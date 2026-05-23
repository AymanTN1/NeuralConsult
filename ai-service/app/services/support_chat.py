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
    ) -> Dict[str, Any]:
        references = self.kb.retrieve(
            query=latest_patient_message,
            facts={"patient_facts": patient_facts, "conversation_history": conversation_history},
        )
        if self.llm.is_configured():
            try:
                result = await self._respond_with_llm(
                    latest_patient_message=latest_patient_message,
                    patient_facts=patient_facts,
                    conversation_history=conversation_history,
                    references=references,
                    emergency_mode=emergency_mode,
                )
                return self._validate(result)
            except Exception:
                pass
        return self._fallback(latest_patient_message, patient_facts, emergency_mode)

    async def _respond_with_llm(
        self,
        *,
        latest_patient_message: str,
        patient_facts: Dict[str, Any],
        conversation_history: List[Dict[str, str]],
        references: List[KnowledgeReference],
        emergency_mode: bool,
    ) -> Dict[str, Any]:
        system_prompt = (
            "You are a compassionate 24/7 tobacco-cessation support assistant. "
            "You speak in French, like a calm clinical psychologist. "
            "You help the patient regulate cravings, anxiety, relapse risk, and motivation. "
            "You must answer simply and warmly, like a real human clinician, not like documentation. "
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
            f"Dernier message patient:\n{latest_patient_message}\n\n"
            "Return JSON with this exact structure:\n"
            "{\n"
            '  "reply": "short human reply in French",\n'
            '  "risk_level": "LOW|MODERATE|HIGH|CRITICAL",\n'
            '  "should_alert_doctor": true,\n'
            '  "alert_reason": "short reason or null",\n'
            '  "recommended_doctor_action": "short action or null",\n'
            '  "summary": "1-line summary for the doctor"\n'
            "}"
        )
        result = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.35,
        )
        result["model_name"] = f"{self.llm.provider}:{self.llm.model}"
        return result

    def _fallback(self, latest_patient_message: str, patient_facts: Dict[str, Any], emergency_mode: bool = False) -> Dict[str, Any]:
        text = (latest_patient_message or "").lower()
        risky_patterns = ["suicide", "mourir", "je vais craquer", "je vais refumer", "panique", "danger"]
        emergency_patterns = ["craquer", "refumer", "fumer", "cigarette", "critique", "urgent", "panique", "seul"]
        should_alert = any(pattern in text for pattern in risky_patterns) or (
            emergency_mode and any(pattern in text for pattern in emergency_patterns)
        )
        anxiety = patient_facts.get("had_anxiety_score") or 0
        depression = patient_facts.get("had_depression_score") or 0
        risk_level = "CRITICAL" if should_alert else "HIGH" if emergency_mode or max(anxiety, depression) >= 11 else "MODERATE" if max(anxiety, depression) >= 8 else "LOW"
        if emergency_mode:
            reply = (
                "Je suis avec vous maintenant. Posez les pieds au sol et lancez 5 cycles: inspirez 5 secondes, expirez 5 secondes. "
                "Regardez un point fixe, desserrez les epaules, puis buvez quelques gorgees d'eau. "
                "L'envie monte puis redescend souvent en 3 a 5 minutes; restez avec moi pour la vague suivante."
            )
            if should_alert:
                reply += " Comme le niveau semble critique, votre medecin va etre alerte pour renforcer le soutien."
        elif should_alert:
            reply = (
                "Je reste avec vous. Ce que vous decrivez merite une attention rapide. "
                "Essayez de vous mettre dans un endroit calme, de respirer lentement pendant une minute, "
                "et votre medecin va etre alerte pour renforcer le soutien."
            )
        else:
            reply = (
                "Je vous entends. On peut avancer pas a pas. "
                "Dites-moi surtout ce qui est le plus difficile maintenant: l'envie de fumer, le stress, ou la peur de rechuter ?"
            )
        return {
            "reply": reply,
            "risk_level": risk_level,
            "should_alert_doctor": should_alert,
            "alert_reason": "SOS Envie critique avec risque de rechute immediate." if should_alert and emergency_mode else "Risque psychique ou rechute detecte dans l'echange." if should_alert else None,
            "recommended_doctor_action": "Contacter le patient ou proposer une seance urgente de soutien." if should_alert and emergency_mode else "Proposer une seance exceptionnelle de soutien." if should_alert else None,
            "summary": ("SOS Envie en cours, protocole respiration/sophrologie active. " if emergency_mode else "Echange de soutien IA en cours avec ") + "niveau de risque " + risk_level,
            "model_name": "support-fallback",
        }

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
