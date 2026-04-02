from __future__ import annotations

import json
from typing import Any, Dict, List

from app.services.clinical_notes import ClinicalNotesService
from app.services.knowledge_base import KnowledgeBaseClient, KnowledgeReference
from app.services.llm_client import DefaultLlmClient


class ClinicalIntelligenceService:
    """
    Structured clinical intelligence layer.

    Outputs:
    - 5 phase summaries
    - 1 global summary
    - 3 AI-generated candidate plans
    """

    def __init__(self) -> None:
        self.notes_service = ClinicalNotesService()
        self.kb = KnowledgeBaseClient()
        self.llm = DefaultLlmClient()

    async def generate(self, facts: Dict[str, Any]) -> Dict[str, Any]:
        references = self.kb.retrieve(
            query="Synthese des phases du dossier tabacologie et plans de sevrage",
            facts=facts,
        )

        if self.llm.is_configured():
            try:
                generated = await self._generate_with_llm(facts, references)
                return self._validate_result(generated, references)
            except Exception:
                pass

        fallback = self._fallback(facts, references)
        return self._validate_result(fallback, references)

    async def _generate_with_llm(
        self,
        facts: Dict[str, Any],
        references: List[KnowledgeReference],
    ) -> Dict[str, Any]:
        system_prompt = (
            "You are a clinical intelligence engine for a tobacco cessation platform. "
            "You summarize patient facts and propose 3 candidate cessation tracks. "
            "You must stick strictly to the provided facts. "
            "You must not invent diagnoses. "
            "Return valid JSON only."
        )
        user_prompt = (
            "Generate 5 phase summaries, one global summary, and 3 plan candidates.\n\n"
            f"Facts:\n{json.dumps(facts, ensure_ascii=True, indent=2)}\n\n"
            f"References:\n{json.dumps([r.__dict__ for r in references], ensure_ascii=True, indent=2)}\n\n"
            "Return JSON with this exact structure:\n"
            "{\n"
            '  "phase_summaries": [\n'
            "    {\n"
            '      "phase_id": 1,\n'
            '      "phase_title": "Phase title",\n'
            '      "summary": "short physician-ready summary",\n'
            '      "attention_points": ["point"],\n'
            '      "missing_information": ["field"]\n'
            "    }\n"
            "  ],\n"
            '  "global_summary": {\n'
            '    "summary": "global physician summary",\n'
            '    "doctor_focus_points": ["point"],\n'
            '    "patient_readiness": "one line",\n'
            '    "missing_information": ["field"]\n'
            "  },\n"
            '  "plan_candidates": [\n'
            "    {\n"
            '      "track": "INTENSIVE|BALANCED|LONG_TERM",\n'
            '      "title": "plan title",\n'
            '      "rationale": "why this plan fits",\n'
            '      "nrt_recommendation": "nrt line",\n'
            '      "behavioral_focus": "behavioral line",\n'
            '      "follow_up_plan": "follow up line",\n'
            '      "doctor_warnings": ["warning"],\n'
            '      "steps": ["step 1", "step 2"]\n'
            "    }\n"
            "  ]\n"
            "}"
        )
        return await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.15,
        )

    def _fallback(self, facts: Dict[str, Any], references: List[KnowledgeReference]) -> Dict[str, Any]:
        medical_summary, _ = self.notes_service._generate_notes_deterministic(facts, references)
        patient = facts.get("patient_profile") or {}
        onboarding = facts.get("onboarding_assessment") or {}

        phases = [
            {
                "phase_id": 1,
                "phase_title": "Social & Personal Context",
                "summary": (
                    f"Patient localise a {patient.get('city') or 'Non renseigne'} "
                    f"avec profession {patient.get('occupation') or 'Non renseignee'}."
                ),
                "attention_points": [
                    "Verifier la stabilite du contexte personnel et social.",
                    "Confirmer la disponibilite du patient pour l'engagement therapeutique.",
                ],
                "missing_information": self._missing(
                    {
                        "date_of_birth": patient.get("date_of_birth"),
                        "sex": patient.get("sex"),
                        "city": patient.get("city"),
                        "occupation": patient.get("occupation"),
                    }
                ),
            },
            {
                "phase_id": 2,
                "phase_title": "Medical Risks & History",
                "summary": (
                    f"Historique depression: {onboarding.get('depression_history', 'Non renseigne')} | "
                    f"Autres problemes de sante: {onboarding.get('other_health_issues') or 'Non renseignes'}."
                ),
                "attention_points": [
                    "Revoir les antecedents somatiques et psychiatriques.",
                ],
                "missing_information": self._missing(
                    {
                        "depression_history": onboarding.get("depression_history"),
                        "other_health_issues": onboarding.get("other_health_issues"),
                    }
                ),
            },
            {
                "phase_id": 3,
                "phase_title": "Smoking Habits & E-Cig",
                "summary": (
                    f"Cigarettes/jour: {patient.get('cigarettes_per_day') or 'Non renseigne'} | "
                    f"e-cigarette: {onboarding.get('uses_e_cigarette', 'Non renseigne')}."
                ),
                "attention_points": [
                    "Caracteriser la consommation principale et les usages associes.",
                ],
                "missing_information": self._missing(
                    {
                        "cigarettes_per_day": patient.get("cigarettes_per_day"),
                        "currently_smoking": onboarding.get("currently_smoking"),
                        "uses_e_cigarette": onboarding.get("uses_e_cigarette"),
                    }
                ),
            },
            {
                "phase_id": 4,
                "phase_title": "Dependency Scoring",
                "summary": (
                    f"Fagerstrom: {patient.get('fagerstrom_score') or 'Non renseigne'} | "
                    f"HAD A: {patient.get('had_anxiety_score') or 'Non renseigne'} | "
                    f"HAD D: {patient.get('had_depression_score') or 'Non renseigne'}."
                ),
                "attention_points": [
                    "Les scores orientent l'intensite du sevrage.",
                    "Les resultats psychologiques doivent etre surveilles par le clinicien.",
                ],
                "missing_information": self._missing(
                    {
                        "fagerstrom_score": patient.get("fagerstrom_score"),
                        "had_anxiety_score": patient.get("had_anxiety_score"),
                        "had_depression_score": patient.get("had_depression_score"),
                    }
                ),
            },
            {
                "phase_id": 5,
                "phase_title": "Social Vulnerability & Co-Addictions",
                "summary": (
                    f"EPICES: {onboarding.get('epices_score') or 'Non renseigne'} | "
                    f"CAGE: {onboarding.get('cage_score') or 'Non renseigne'} | "
                    f"HONC: {onboarding.get('honc_score') or 'Non renseigne'}."
                ),
                "attention_points": [
                    "Verifier les co-addictions et la vulnerabilite sociale.",
                ],
                "missing_information": self._missing(
                    {
                        "epices_score": onboarding.get("epices_score"),
                        "cage_score": onboarding.get("cage_score"),
                        "honc_score": onboarding.get("honc_score"),
                    }
                ),
            },
        ]

        plan_candidates = [
            {
                "track": "INTENSIVE",
                "title": "Track intensif avec encadrement renforce",
                "rationale": "Adapte quand la dependance physique ou la fragilite psychique est elevee.",
                "nrt_recommendation": "Patch + forme rapide selon le profil du patient.",
                "behavioral_focus": "Coaching serre, gestion des declencheurs, routine anti-craving.",
                "follow_up_plan": "Suivi hebdomadaire, coordination medecin / patient.",
                "doctor_warnings": ["Confirmer la tolerance aux substituts et la charge psychique."],
                "steps": [
                    "Fixer une date cible de sevrage.",
                    "Mettre en place un suivi rapproche la premiere phase.",
                ],
            },
            {
                "track": "BALANCED",
                "title": "Track equilibre avec NRT standard",
                "rationale": "Convient a un profil intermediaire avec besoin de structure sans intensite maximale.",
                "nrt_recommendation": "Patch ou gomme selon les envies et le rythme de consommation.",
                "behavioral_focus": "Stabiliser les routines et les strategies de remplacement.",
                "follow_up_plan": "Suivi toutes les 1 a 2 semaines.",
                "doctor_warnings": ["Verifier l'observance et les situations a risque."],
                "steps": [
                    "Identifier les situations declenchantes.",
                    "Mettre en place une routine de remplacement.",
                ],
            },
            {
                "track": "LONG_TERM",
                "title": "Track progressif centre sur le comportement",
                "rationale": "Approche adaptee si la priorite est l'adherence progressive et le soutien social.",
                "nrt_recommendation": "NRT optionnelle selon l'evolution clinique.",
                "behavioral_focus": "Motivation, entourage, activite physique et prevention des rechutes.",
                "follow_up_plan": "Suivi mensuel et auto-observation reguliere.",
                "doctor_warnings": ["Risque de perte d'elan si l'encadrement est trop leger."],
                "steps": [
                    "Consolider la motivation du patient.",
                    "Ancrer des habitudes de compensation saines.",
                ],
            },
        ]

        return {
            "phase_summaries": phases,
            "global_summary": {
                "summary": medical_summary,
                "doctor_focus_points": [
                    "Confirmer les zones de risque psychologique et social.",
                    "Choisir le plan le plus credible medicalement.",
                ],
                "patient_readiness": "Le patient a fourni une base exploitable pour une decision medicale.",
                "missing_information": [],
            },
            "plan_candidates": plan_candidates,
        }

    def _missing(self, values: Dict[str, Any]) -> List[str]:
        return [key for key, value in values.items() if value in (None, "", [])]

    def _validate_result(
        self,
        result: Dict[str, Any],
        references: List[KnowledgeReference],
    ) -> Dict[str, Any]:
        phase_summaries = result.get("phase_summaries") or []
        if len(phase_summaries) != 5:
            raise RuntimeError("Invalid number of phase summaries returned by AI.")

        plan_candidates = result.get("plan_candidates") or []
        tracks = {candidate.get("track") for candidate in plan_candidates}
        if tracks != {"INTENSIVE", "BALANCED", "LONG_TERM"}:
            raise RuntimeError("AI must return exactly 3 plan tracks: INTENSIVE, BALANCED, LONG_TERM.")

        return {
            "phase_summaries": phase_summaries,
            "global_summary": result.get("global_summary") or {},
            "plan_candidates": plan_candidates,
            "model_name": (
                f"{self.llm.provider}:{self.llm.model}" if self.llm.is_configured() else "deterministic-fallback"
            ),
            "references": [
                {"source": ref.source, "title": ref.title, "excerpt": ref.excerpt}
                for ref in references
            ],
        }
