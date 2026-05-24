from __future__ import annotations

import json
from typing import Any, Dict, List

from app.services.domain_knowledge import SupportChatKnowledgeBaseClient
from app.services.knowledge_base import KnowledgeReference
from app.services.llm_client import DefaultLlmClient


class SupportChatService:
    def __init__(self) -> None:
        self.kb = SupportChatKnowledgeBaseClient()
        self.llm = DefaultLlmClient()

    async def respond(
        self,
        *,
        latest_patient_message: str,
        patient_facts: Dict[str, Any],
        conversation_history: List[Dict[str, str]],
        emergency_mode: bool = False,
        preferred_language: str = "fr",
    ) -> Dict[str, Any]:
        language = self._normalize_language(preferred_language)
        references = self.kb.retrieve(
            query=latest_patient_message,
            facts={
                "patient_facts": patient_facts,
                "conversation_history": conversation_history,
                "preferred_language": language,
            },
        )
        if self.llm.is_configured():
            try:
                result = await self._respond_with_llm(
                    latest_patient_message=latest_patient_message,
                    patient_facts=patient_facts,
                    conversation_history=conversation_history,
                    references=references,
                    emergency_mode=emergency_mode,
                    preferred_language=language,
                )
                return self._validate(result)
            except Exception:
                pass
        return self._fallback(latest_patient_message, patient_facts, emergency_mode, language)

    async def respond_voice(
        self,
        *,
        audio_bytes: bytes,
        audio_mime_type: str,
        patient_facts: Dict[str, Any],
        conversation_history: List[Dict[str, str]],
        emergency_mode: bool = False,
        preferred_language: str = "fr",
        audio_duration_ms: int | None = None,
    ) -> Dict[str, Any]:
        language = self._normalize_language(preferred_language)
        voice_analysis = await self._analyze_voice_with_gemini(
            audio_bytes=audio_bytes,
            audio_mime_type=audio_mime_type,
            preferred_language=language,
            audio_duration_ms=audio_duration_ms,
        )
        transcription = voice_analysis["transcription"]
        if not transcription:
            raise ValueError("Audio inaudible ou transcription vide.")

        enriched_facts = dict(patient_facts or {})
        enriched_facts["voice_analysis"] = {
            "stress_score": voice_analysis["voice_stress_score"],
            "stress_level": voice_analysis["voice_stress_level"],
            "stress_summary": voice_analysis["voice_stress_summary"],
            "stress_signals": voice_analysis["voice_stress_signals"],
            "audio_duration_ms": audio_duration_ms,
            "non_diagnostic": True,
        }

        chat_result = await self.respond(
            latest_patient_message=transcription,
            patient_facts=enriched_facts,
            conversation_history=conversation_history,
            emergency_mode=emergency_mode,
            preferred_language=language,
        )
        if chat_result.get("should_alert_doctor") and not self._has_doctor_alert_signal(
            transcription,
            emergency_mode,
        ):
            chat_result = {
                **chat_result,
                "should_alert_doctor": False,
                "alert_reason": None,
                "recommended_doctor_action": None,
            }
        return {
            **chat_result,
            **voice_analysis,
        }

    async def _analyze_voice_with_gemini(
        self,
        *,
        audio_bytes: bytes,
        audio_mime_type: str,
        preferred_language: str,
        audio_duration_ms: int | None,
    ) -> Dict[str, Any]:
        if not self.llm.gemini.is_configured():
            raise RuntimeError("GEMINI_API_KEY est requis pour l'analyse vocale.")

        mime_type = (audio_mime_type or "application/octet-stream").split(";")[0].strip()
        system_prompt = (
            "You transcribe short patient voice notes for a tobacco-cessation support app. "
            "You also estimate apparent stress from voice tone/prosody and spoken content. "
            "This estimate is non-diagnostic and must be cautious. "
            "Return valid JSON only."
        )
        user_prompt = (
            "Analyze the attached audio. Return JSON with this exact structure:\n"
            "{\n"
            '  "transcription": "verbatim transcript in the spoken language",\n'
            '  "voice_stress_score": 0,\n'
            '  "voice_stress_level": "LOW|MODERATE|HIGH|CRITICAL",\n'
            '  "voice_stress_summary": "short French non-diagnostic summary",\n'
            '  "voice_stress_signals": ["short French signal"]\n'
            "}\n\n"
            "Rules: keep the transcript faithful, do not invent missing words, "
            "use CRITICAL only for extreme distress, panic, danger cues, or imminent relapse cues. "
            "If the speech is in Moroccan Darija, transcribe it naturally in the same script/style used by the speaker when possible. "
            f"Requested support language: {preferred_language}. "
            f"Approximate duration in milliseconds: {audio_duration_ms}."
        )
        result = await self.llm.gemini.generate_json_with_inline_data(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            inline_data=audio_bytes,
            mime_type=mime_type,
            temperature=0.1,
        )
        return self._validate_voice_analysis(result)

    async def _respond_with_llm(
        self,
        *,
        latest_patient_message: str,
        patient_facts: Dict[str, Any],
        conversation_history: List[Dict[str, str]],
        references: List[KnowledgeReference],
        emergency_mode: bool,
        preferred_language: str,
    ) -> Dict[str, Any]:
        system_prompt = (
            "You are a compassionate 24/7 tobacco-cessation support assistant. "
            "You speak like a calm clinical psychologist. "
            "You help the patient regulate cravings, anxiety, relapse risk, and motivation. "
            "You must answer simply and warmly, like a real human clinician, not like documentation. "
            "Reply to the patient in the requested language: French for fr, Moroccan Darija for darija, English for en. "
            "For Darija, use natural Moroccan dialect; Latin-script Darija is acceptable unless the patient writes Arabic script. "
            "Keep all doctor-facing fields (summary, alert_reason, recommended_doctor_action) in French. "
            "When patient_facts.voice_analysis is present, adapt warmth and regulation guidance to the apparent stress level, "
            "but describe it as non-diagnostic and never alert the doctor solely because of vocal stress. "
            "When emergency_mode is true, switch immediately to 'Urgences Respiration & Sophrologie': "
            "guide the patient through a 3 to 5 minute craving protocol with cardiac coherence, grounding, "
            "and one concrete next action. "
            "If you detect danger, severe distress, suicidal ideation, panic, or imminent relapse, "
            "you must set should_alert_doctor=true and explain why. "
            "Return valid JSON only."
        )
        user_prompt = (
            "Reponds a ce patient avec empathie et precision.\n"
            "Contrainte: une reponse simple, humaine, utile, avec au maximum une question de suivi.\n\n"
            f"Patient facts:\n{json.dumps(patient_facts, ensure_ascii=False, indent=2)}\n\n"
            f"Conversation history:\n{json.dumps(conversation_history, ensure_ascii=False, indent=2)}\n\n"
            f"References RAG du soutien 24/7:\n{json.dumps([ref.__dict__ for ref in references], ensure_ascii=False, indent=2)}\n\n"
            f"Mode urgence SOS envie:\n{json.dumps(emergency_mode, ensure_ascii=False)}\n\n"
            f"Langue patient demandee:\n{preferred_language}\n\n"
            "Important si voice_analysis est present: utiliser ces indices pour choisir un ton plus contenant, "
            "mais ne pas les presenter comme un diagnostic.\n\n"
            f"Dernier message patient:\n{latest_patient_message}\n\n"
            "Return JSON with this exact structure:\n"
            "{\n"
            '  "reply": "short human reply in the requested patient language",\n'
            '  "risk_level": "LOW|MODERATE|HIGH|CRITICAL",\n'
            '  "should_alert_doctor": true,\n'
            '  "alert_reason": "short French reason or null",\n'
            '  "recommended_doctor_action": "short French action or null",\n'
            '  "summary": "1-line French summary for the doctor"\n'
            "}"
        )
        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.35,
        )
        result["model_name"] = f"{self.llm.provider}:{self.llm.model}"
        return result

    def _fallback(
        self,
        latest_patient_message: str,
        patient_facts: Dict[str, Any],
        emergency_mode: bool = False,
        preferred_language: str = "fr",
    ) -> Dict[str, Any]:
        language = self._normalize_language(preferred_language)
        text = (latest_patient_message or "").lower()
        risky_patterns = ["suicide", "mourir", "je vais craquer", "je vais refumer", "panique", "danger"]
        emergency_patterns = ["craquer", "refumer", "fumer", "cigarette", "critique", "urgent", "panique", "seul"]
        should_alert = any(pattern in text for pattern in risky_patterns) or (
            emergency_mode and any(pattern in text for pattern in emergency_patterns)
        )
        anxiety = patient_facts.get("had_anxiety_score") or 0
        depression = patient_facts.get("had_depression_score") or 0
        voice_analysis = patient_facts.get("voice_analysis") if isinstance(patient_facts, dict) else None
        voice_score = 0
        if isinstance(voice_analysis, dict):
            try:
                voice_score = int(voice_analysis.get("stress_score") or 0)
            except (TypeError, ValueError):
                voice_score = 0
        risk_level = "CRITICAL" if should_alert else "HIGH" if emergency_mode or max(anxiety, depression) >= 11 else "MODERATE" if max(anxiety, depression) >= 8 or voice_score >= 70 else "LOW"
        if emergency_mode:
            reply = self._emergency_reply(language)
            if should_alert:
                reply += self._doctor_alert_suffix(language)
        elif should_alert:
            reply = self._alert_reply(language)
        elif voice_score >= 70:
            reply = self._stressed_voice_reply(language)
        else:
            reply = self._standard_reply(language)
        return {
            "reply": reply,
            "risk_level": risk_level,
            "should_alert_doctor": should_alert,
            "alert_reason": "SOS Envie critique avec risque de rechute immediate." if should_alert and emergency_mode else "Risque psychique ou rechute detecte dans l'echange." if should_alert else None,
            "recommended_doctor_action": "Contacter le patient ou proposer une seance urgente de soutien." if should_alert and emergency_mode else "Proposer une seance exceptionnelle de soutien." if should_alert else None,
            "summary": ("SOS Envie en cours, protocole respiration/sophrologie active. " if emergency_mode else "Echange de soutien IA en cours avec ") + "niveau de risque " + risk_level,
            "model_name": "support-fallback",
        }

    def _normalize_language(self, raw: str | None) -> str:
        value = (raw or "fr").strip().lower()
        if value in {"darija", "ar", "ar-ma", "ma"}:
            return "darija"
        if value in {"en", "english"}:
            return "en"
        return "fr"

    def _validate_voice_analysis(self, result: Dict[str, Any]) -> Dict[str, Any]:
        transcription = str(result.get("transcription") or result.get("transcript") or "").strip()
        if not transcription:
            raise ValueError("Audio inaudible ou transcription vide.")

        try:
            score = int(float(result.get("voice_stress_score", 0)))
        except (TypeError, ValueError):
            score = 0
        score = max(0, min(100, score))

        level = str(result.get("voice_stress_level") or "").upper()
        if level not in {"LOW", "MODERATE", "HIGH", "CRITICAL"}:
            level = self._stress_level_from_score(score)

        raw_signals = result.get("voice_stress_signals") or []
        signals = [str(item).strip() for item in raw_signals if str(item).strip()]

        return {
            "transcription": transcription[:4000],
            "voice_stress_score": score,
            "voice_stress_level": level,
            "voice_stress_summary": str(result.get("voice_stress_summary") or "").strip()[:1000] or None,
            "voice_stress_signals": signals[:5],
        }

    def _stress_level_from_score(self, score: int) -> str:
        if score >= 85:
            return "CRITICAL"
        if score >= 65:
            return "HIGH"
        if score >= 35:
            return "MODERATE"
        return "LOW"

    def _has_doctor_alert_signal(self, text: str, emergency_mode: bool) -> bool:
        value = (text or "").lower()
        high_risk_patterns = [
            "suicide",
            "mourir",
            "je vais craquer",
            "je vais refumer",
            "je vais fumer",
            "panique",
            "danger",
            "urgent",
            "je n'en peux plus",
            "crise",
        ]
        craving_patterns = ["craquer", "refumer", "fumer", "cigarette", "critique", "seul"]
        return any(pattern in value for pattern in high_risk_patterns) or (
            emergency_mode and any(pattern in value for pattern in craving_patterns)
        )

    def _standard_reply(self, language: str) -> str:
        if language == "darija":
            return (
                "KanHess bik. Ghadi nmchiw bchwia bchwia. "
                "Goul lia daba ach s3ib 3lik kter: l'envie dyal tkemmi, stress, wla khouf trje3?"
            )
        if language == "en":
            return (
                "I hear you. We can take this one step at a time. "
                "Tell me what feels hardest right now: the craving, stress, or fear of relapse?"
            )
        return (
            "Je vous entends. On peut avancer pas a pas. "
            "Dites-moi surtout ce qui est le plus difficile maintenant: l'envie de fumer, le stress, ou la peur de rechuter ?"
        )

    def _stressed_voice_reply(self, language: str) -> str:
        if language == "darija":
            return (
                "Sme3t belli l-stress tal3, w hadchi ghir ichara machi tachkhis. "
                "Khalli telephone 7dak, tnaffess bchwia: dkhel nfass 4 tawan, khrej 6 tawan, 5 marrat. "
                "Daba goul lia: wach bghiti nkmlo m3a l'envie dyal cigarette wla stress?"
            )
        if language == "en":
            return (
                "I hear tension in this moment, and I am treating that only as a support signal, not a diagnosis. "
                "Put the phone down for a second: breathe in for 4, out for 6, five times. "
                "What should we steady first: the cigarette urge or the stress?"
            )
        return (
            "J'entends une tension dans ce moment, et je la prends seulement comme un signal de soutien, pas comme un diagnostic. "
            "Posez le telephone une seconde: inspirez 4 secondes, expirez 6 secondes, cinq fois. "
            "On stabilise d'abord l'envie de cigarette ou le stress ?"
        )

    def _emergency_reply(self, language: str) -> str:
        if language == "darija":
            return (
                "Ana m3ak daba. Hett rjlik f l-ard w dir 5 dawrat: tnaffess 5 tawan, khrej nfass 5 tawan. "
                "Chouf f noqta wahda, rkhfi ktanfek, w chrab chwia d lma. "
                "Had l'envie katطلع w katهبط f 3 ta 5 dqayeq; bqa m3aya daba."
            )
        if language == "en":
            return (
                "I am with you now. Put both feet on the floor and do 5 cycles: breathe in for 5 seconds, out for 5 seconds. "
                "Fix your eyes on one point, relax your shoulders, then take a few sips of water. "
                "A craving usually rises and falls within 3 to 5 minutes; stay with me through this wave."
            )
        return (
            "Je suis avec vous maintenant. Posez les pieds au sol et lancez 5 cycles: inspirez 5 secondes, expirez 5 secondes. "
            "Regardez un point fixe, desserrez les epaules, puis buvez quelques gorgees d'eau. "
            "L'envie monte puis redescend souvent en 3 a 5 minutes; restez avec moi pour la vague suivante."
        )

    def _alert_reply(self, language: str) -> str:
        if language == "darija":
            return (
                "Ana baqi m3ak. Dakchi li katgoul kayban khaso intibah b sor3a. "
                "Dkhol l blasa hadi'a, tnaffess bchwia chi dqiqa, w ttabib ghadi ytwssel b alerte bach yzidk soutien."
            )
        if language == "en":
            return (
                "I am staying with you. What you describe deserves quick attention. "
                "Try to move to a calm place, breathe slowly for one minute, and your doctor will be alerted for extra support."
            )
        return (
            "Je reste avec vous. Ce que vous decrivez merite une attention rapide. "
            "Essayez de vous mettre dans un endroit calme, de respirer lentement pendant une minute, "
            "et votre medecin va etre alerte pour renforcer le soutien."
        )

    def _doctor_alert_suffix(self, language: str) -> str:
        if language == "darija":
            return " Hit niveau kayban critique, ttabib dyalek ghadi ytwssel b alerte bach yzid soutien."
        if language == "en":
            return " Since the level seems critical, your doctor will be alerted to reinforce support."
        return " Comme le niveau semble critique, votre medecin va etre alerte pour renforcer le soutien."

    def _validate(self, result: Dict[str, Any]) -> Dict[str, Any]:
        risk_level = str(result.get("risk_level") or "LOW").upper()
        if risk_level not in {"LOW", "MODERATE", "HIGH", "CRITICAL"}:
            risk_level = "LOW"
        return {
            "reply": str(result.get("reply") or "").strip() or "Je suis la avec vous. Pouvez-vous me dire ce qui vous pese le plus en ce moment ?",
            "risk_level": risk_level,
            "should_alert_doctor": bool(result.get("should_alert_doctor")),
            "alert_reason": result.get("alert_reason"),
            "recommended_doctor_action": result.get("recommended_doctor_action"),
            "summary": result.get("summary"),
            "model_name": result.get("model_name") or f"{self.llm.provider}:{self.llm.model}",
        }
