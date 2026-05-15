"""
Conversational RAG service for doctors.

Conversation states:
  CLARIFYING  → AI asks a clarifying question
  SEARCHING   → AI has enough info, triggers scraper
  DONE        → Results ready, formatted for the doctor
"""
from __future__ import annotations

import json
from typing import Any, Dict, List

from app.services.llm_client import DefaultLlmClient
from app.services.medical_scraper import scrape_all


SYSTEM_PROMPT = """\
Tu es un assistant clinique expert en tabacologie et en sevrage tabagique, spécialisé pour les médecins.
Tu travailles en DEUX PHASES :

PHASE 1 - CLARIFICATION :
- Si le besoin du médecin n'est pas assez précis pour faire une bonne recherche médicale, pose UNE seule question courte et ciblée pour clarifier.
- Exemples de clarifications utiles : population cible (femme enceinte, adolescent, BPCO), stade de sevrage, type de traitement (NRT, Champix, comportemental), niveau de dépendance (Fagerstrom).
- Si le besoin est déjà clair et précis, passe directement à la PHASE 2.

PHASE 2 - RECHERCHE :
- Quand tu as toutes les infos, génère une search_query en anglais (pour PubMed) et en français (pour les guides locaux), précise et médicalement correcte.
- Mets ready_to_search à true.

RÈGLES IMPORTANTES :
- Réponds TOUJOURS en français, de façon professionnelle mais concise.
- Si l'historique montre que tu as déjà posé UNE question, lance la recherche même si tu n'as pas toutes les précisions.
- Tu es un assistant clinique, PAS un chatbot grand public. Sois direct et utile.
- Retourne UNIQUEMENT du JSON valide.
"""


def _build_user_prompt(
    doctor_message: str,
    conversation_history: List[Dict[str, str]],
) -> str:
    history_str = json.dumps(conversation_history, ensure_ascii=False, indent=2)
    return (
        f"Historique de la conversation:\n{history_str}\n\n"
        f"Dernier message du médecin:\n{doctor_message}\n\n"
        "Retourne ce JSON exact:\n"
        "{\n"
        '  "reply": "Réponse ou question de clarification en français",\n'
        '  "ready_to_search": false,\n'
        '  "search_query_fr": "requête en français pour les guides locaux ou null",\n'
        '  "search_query_en": "query in English for PubMed or null"\n'
        "}"
    )


class ClinicalRagChatService:
    def __init__(self) -> None:
        self.llm = DefaultLlmClient()

    async def chat(
        self,
        *,
        doctor_message: str,
        conversation_history: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """
        Process one turn of the conversation.
        Returns a dict with: reply, status, results (list), model_name
        """
        if not self.llm.is_configured():
            return self._fallback(doctor_message, conversation_history)

        try:
            raw = await self.llm.generate_json(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=_build_user_prompt(doctor_message, conversation_history),
                temperature=0.3,
            )
        except Exception as e:
            return self._fallback(doctor_message, conversation_history)

        ready = bool(raw.get("ready_to_search"))
        reply = str(raw.get("reply") or "").strip()
        q_fr  = raw.get("search_query_fr") or ""
        q_en  = raw.get("search_query_en") or ""

        if not ready:
            # Still clarifying
            return {
                "reply": reply,
                "status": "CLARIFYING",
                "results": [],
                "model_name": f"{self.llm.provider}:{self.llm.model}",
            }

        # --- SEARCH phase ---
        # Build combined query: French for PDFs, English for PubMed
        combined_query_fr = q_fr or doctor_message
        combined_query_en = q_en or doctor_message

        raw_results = scrape_all(combined_query_fr)
        # Also run an English search for PubMed
        from app.services.medical_scraper import search_pubmed, search_local_pdfs
        pubmed_en = search_pubmed(combined_query_en, max_results=3)
        # Merge (avoid duplicates via url key)
        existing_urls = {r.get("url") for r in raw_results}
        for r in pubmed_en:
            if r.get("url") not in existing_urls:
                raw_results.append(r)
                existing_urls.add(r.get("url"))

        if not raw_results:
            return {
                "reply": (
                    "J'ai effectué la recherche dans les guides cliniques et PubMed, "
                    "mais je n'ai pas trouvé de résultats spécifiques à votre question. "
                    "Voulez-vous reformuler ou élargir les critères de recherche ?"
                ),
                "status": "DONE",
                "results": [],
                "model_name": f"{self.llm.provider}:{self.llm.model}",
            }

        # --- SUMMARIZE phase: ask LLM to synthesize results ---
        synthesis_prompt = (
            f"Besoin du médecin : {combined_query_fr}\n\n"
            "Voici les résultats bruts extraits des sources médicales :\n"
            + json.dumps(raw_results[:6], ensure_ascii=False, indent=2)
            + "\n\nRédige une synthèse clinique courte (3-5 lignes maximum) "
            "qui répond directement au besoin du médecin, en citant les sources. "
            "Réponds en français, de façon concise et cliniquement utile."
        )
        try:
            synthesis = await self.llm.generate_text(
                system_prompt="Tu es un expert en tabacologie qui synthétise des données médicales pour des médecins.",
                user_prompt=synthesis_prompt,
                temperature=0.2,
            )
        except Exception:
            synthesis = reply or "Voici les résultats trouvés dans les sources médicales."

        return {
            "reply": synthesis,
            "status": "DONE",
            "results": raw_results[:7],
            "model_name": f"{self.llm.provider}:{self.llm.model}",
        }

    def _fallback(
        self,
        doctor_message: str,
        conversation_history: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """Fallback when LLM is unavailable: scrape directly."""
        raw_results = scrape_all(doctor_message)
        return {
            "reply": (
                "Voici les résultats trouvés dans les guides cliniques locaux "
                "(mode dégradé sans IA disponible)."
                if raw_results
                else "Aucun résultat trouvé. Veuillez reformuler votre question."
            ),
            "status": "DONE",
            "results": raw_results,
            "model_name": "fallback-scraper",
        }
