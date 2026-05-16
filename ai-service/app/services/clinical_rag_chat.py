"""
Conversational RAG service for doctors.

Conversation states:
  CLARIFYING  → AI asks a clarifying question (always shows which sources will be searched)
  DONE        → Results ready with synthesized reply + all sources cited

RULE: Every reply MUST be accompanied by its sources.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List

from app.services.llm_client import DefaultLlmClient
from app.services.medical_scraper import scrape_all, search_pubmed


# Sources that will always be searched — shown to the doctor upfront
AVAILABLE_SOURCES = [
    {"name": "Guide Marocain du Sevrage Tabagique", "type": "PDF local", "url": None},
    {"name": "Dossier de Tabacologie (INPES)", "type": "PDF local", "url": None},
    {"name": "WHO Guideline for Tobacco Cessation", "type": "PDF local", "url": None},
    {"name": "PubMed / NCBI", "type": "Base scientifique", "url": "https://pubmed.ncbi.nlm.nih.gov"},
]


SYSTEM_PROMPT = """\
Tu es un assistant clinique expert en tabacologie et sevrage tabagique, spécialisé pour les médecins.
Tu travailles en DEUX PHASES :

PHASE 1 - CLARIFICATION :
- Si le besoin du médecin n'est pas assez précis, pose UNE seule question courte pour clarifier.
- Exemples : population cible (femme enceinte, adolescent, BPCO), stade de sevrage, type de traitement (NRT, Champix), niveau Fagerstrom.
- Si le besoin est déjà clair et précis, passe directement à la PHASE 2.

PHASE 2 - RECHERCHE :
- Génère une search_query en français (pour les guides locaux) et en anglais (pour PubMed).
- Mets ready_to_search à true.

RÈGLES :
- Réponds TOUJOURS en français.
- Si tu as déjà posé UNE question dans l'historique, lance la recherche directement.
- Retourne UNIQUEMENT du JSON valide.
"""


SYNTHESIS_SYSTEM = """\
Tu es un expert clinique en tabacologie qui rédige des réponses médicales sourcées pour des médecins.

RÈGLE ABSOLUE : Ta synthèse doit TOUJOURS :
1. Utiliser des appels de citations numériques entre crochets, par exemple [1], [2], correspondant aux sources fournies.
2. Citer TOUTES les sources pertinentes qui ont permis de construire la réponse.
3. Être structurée et professionnelle.

Chaque numéro [x] doit correspondre à l'ID de la source dans la liste fournie.
"""


def _build_user_prompt(doctor_message: str, conversation_history: List[Dict[str, str]]) -> str:
    history_str = json.dumps(conversation_history, ensure_ascii=False, indent=2)
    return (
        f"Historique:\n{history_str}\n\n"
        f"Dernier message du médecin:\n{doctor_message}\n\n"
        "Retourne ce JSON:\n"
        '{\n'
        '  "reply": "...",\n'
        '  "ready_to_search": false,\n'
        '  "search_query_fr": "... ou null",\n'
        '  "search_query_en": "... or null"\n'
        '}'
    )


def _build_synthesis_prompt(query: str, results: List[Dict[str, Any]]) -> str:
    """Build synthesis prompt that forces numeric [ID] citations."""
    sources_text = ""
    for r in results:
        sources_text += f"ID: [{r.get('id')}]\nSource: {r.get('source')}\nType: {r.get('source_type')}\nContenu: {r.get('content')}\n---\n"

    return (
        f"Question du médecin : {query}\n\n"
        "Voici les sources médicales extraites (PDF locaux et Web/PubMed) :\n"
        + sources_text
        + "\n"
        "Instructions :\n"
        "1. Rédige une réponse clinique concise en français.\n"
        "2. Accompagne chaque affirmation par son numéro de source entre crochets, ex: [1].\n"
        "3. Si une information vient de plusieurs sources, mets plusieurs crochets, ex: [1][3].\n"
        "4. N'invente AUCUNE information non présente dans les sources.\n"
        "5. La réponse DOIT être accompagnée de ses sources, c'est impératif."
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
        Process one turn. Returns:
          reply, status, results (always non-empty when DONE), model_name
        """
        if not self.llm.is_configured():
            return await self._fallback(doctor_message)

        try:
            raw = await self.llm.generate_json(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=_build_user_prompt(doctor_message, conversation_history),
                temperature=0.3,
            )
        except Exception:
            return await self._fallback(doctor_message)

        ready = bool(raw.get("ready_to_search"))
        reply = str(raw.get("reply") or "").strip()
        q_fr  = raw.get("search_query_fr") or ""
        q_en  = raw.get("search_query_en") or ""

        if not ready:
            # CLARIFYING: show AI reply + list of sources that WILL be searched
            return {
                "reply": reply,
                "status": "CLARIFYING",
                "results": AVAILABLE_SOURCES,   # always show available sources
                "model_name": f"{self.llm.provider}:{self.llm.model}",
            }

        # ── SEARCH phase ──────────────────────────────────────────────
        combined_query_fr = q_fr or doctor_message
        combined_query_en = q_en or doctor_message

        # Search local PDFs (French query)
        raw_results = scrape_all(combined_query_fr)

        # Merge English PubMed results (avoids duplicates by URL)
        pubmed_en = search_pubmed(combined_query_en, max_results=4)
        existing_urls = {r.get("url") for r in raw_results}
        for r in pubmed_en:
            if r.get("url") not in existing_urls:
                raw_results.append(r)
                existing_urls.add(r.get("url"))

        # Ensure every result has a proper source label and an ID
        max_id = max((r.get("id") or 0) for r in raw_results) if raw_results else 0
        for r in raw_results:
            if r.get("id") is None:
                max_id += 1
                r["id"] = max_id
            if not r.get("source"):
                r["source"] = "Source médicale"
            if not r.get("source_type"):
                r["source_type"] = "Document"

        if not raw_results:
            return {
                "reply": (
                    "⚠️ Aucune source trouvée pour cette requête dans les guides locaux ni sur PubMed.\n"
                    "Essayez de reformuler avec des termes médicaux plus précis ou en anglais."
                ),
                "status": "DONE",
                "results": AVAILABLE_SOURCES,   # show which sources were checked
                "model_name": f"{self.llm.provider}:{self.llm.model}",
            }

        # ── SYNTHESIZE phase: LLM must cite sources explicitly ─────────
        try:
            synthesis = await self.llm.generate_text(
                system_prompt=SYNTHESIS_SYSTEM,
                user_prompt=_build_synthesis_prompt(combined_query_fr, raw_results),
                temperature=0.15,
            )
            
            import re
            # Extract cited IDs, e.g. [1], [2], [1, 3]
            cited_ids_str = re.findall(r'\[\s*([\d\s,]+)\s*\]', synthesis)
            cited_ids = set()
            for group in cited_ids_str:
                for match in re.findall(r'\d+', group):
                    cited_ids.add(int(match))
            
            if cited_ids:
                final_results = [r for r in raw_results if r.get("id") in cited_ids]
            else:
                final_results = raw_results[:8]
                
        except Exception:
            # Fallback: build manual reply listing sources
            source_names = list({r.get("source", "?") for r in raw_results})
            synthesis = (
                f"Résultats trouvés dans {len(raw_results)} source(s) : "
                + ", ".join(f"[{s}]" for s in source_names)
                + ".\nConsultez les extraits ci-dessous pour les détails."
            )
            final_results = raw_results[:8]

        return {
            "reply": synthesis,
            "status": "DONE",
            "results": final_results,
            "model_name": f"{self.llm.provider}:{self.llm.model}",
        }

    async def _fallback(self, doctor_message: str) -> Dict[str, Any]:
        """Fallback: scrape directly without LLM, always show sources."""
        raw_results = scrape_all(doctor_message)
        if raw_results:
            source_names = list({r.get("source", "?") for r in raw_results})
            reply = (
                f"Résultats extraits de {len(raw_results)} extrait(s) depuis : "
                + ", ".join(f"[{s}]" for s in source_names)
                + ".\n(Mode dégradé — IA non disponible, sources brutes affichées.)"
            )
        else:
            reply = "Aucun résultat trouvé dans les sources locales ni sur PubMed."
        return {
            "reply": reply,
            "status": "DONE",
            "results": raw_results or AVAILABLE_SOURCES,
            "model_name": "fallback-scraper",
        }
