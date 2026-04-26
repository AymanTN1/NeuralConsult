from __future__ import annotations

import datetime as dt
import json
from typing import Any, Dict, List, Optional, Tuple

from app.services.domain_knowledge import ClinicalNotesKnowledgeBaseClient
from app.services.knowledge_base import KnowledgeReference
from app.services.llm_client import DefaultLlmClient


def _safe_str(v: Any) -> Optional[str]:
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


def _format_date_iso(v: Any) -> Optional[str]:
    if v is None:
        return None
    if isinstance(v, dt.date):
        return v.isoformat()
    s = _safe_str(v)
    return s


def _fmt(v: Any) -> str:
    return "Non renseigné" if v is None or (isinstance(v, str) and not v.strip()) else str(v)


def _interpret_had(score: Optional[int]) -> str:
    if score is None:
        return "Non renseigné"
    if score <= 7:
        return "Normal (0-7)"
    if score <= 10:
        return "Douteux (8-10)"
    return "Certain (>= 11)"


def _infer_fagerstrom_level(score: Optional[int]) -> str:
    # Standard thresholds (commonly used). If backend already provides a level, it should override this.
    if score is None:
        return "Non renseigné"
    if score <= 2:
        return "Tres faible"
    if score <= 4:
        return "Faible"
    if score == 5:
        return "Moyenne"
    if score <= 7:
        return "Forte"
    return "Tres forte"


class ClinicalNotesService:
    """
    Clinical Intelligence Notes (Deterministic generator).

    Design goals:
    - Zero hallucination: stick strictly to input facts.
    - Structured output, physician-ready.
    - RAG-ready structure: easy to enrich with external guideline snippets later.
    """

    MODEL_NAME = "deterministic-v1"

    def __init__(self) -> None:
        self.kb = ClinicalNotesKnowledgeBaseClient()
        self.llm = DefaultLlmClient()

    async def generate(self, facts: Dict[str, Any]) -> Dict[str, Any]:
        refs = self.kb.retrieve(
            query="Synthese clinique sevrage tabagique INPES 2007",
            facts=facts,
        )

        if self.llm.is_configured():
            try:
                medical_summary, complementary_note = await self._generate_notes_with_llm(facts, refs)
                model_name = f"{self.llm.provider}:{self.llm.model}"
            except Exception:
                medical_summary, complementary_note = self._generate_notes_deterministic(facts, refs)
                model_name = f"{self.MODEL_NAME}-fallback"
        else:
            medical_summary, complementary_note = self._generate_notes_deterministic(facts, refs)
            model_name = self.MODEL_NAME

        validation = self._validate(facts, medical_summary, complementary_note)
        return {
            "model_name": model_name,
            "medical_summary": medical_summary,
            "complementary_note": complementary_note,
            "validation": validation,
            "references": [
                {"source": r.source, "title": r.title, "excerpt": r.excerpt} for r in refs
            ],
        }

    async def _generate_notes_with_llm(
        self,
        facts: Dict[str, Any],
        refs: List[KnowledgeReference],
    ) -> Tuple[str, str]:
        system_prompt = (
            "You are a clinical summarization engine for a tobacco cessation platform. "
            "You write physician-ready notes from structured patient facts. "
            "You must never invent missing information. "
            "You must explicitly mention when information is missing. "
            "Return valid JSON only."
        )

        user_prompt = (
            "Produce a structured medical summary and a complementary note.\n\n"
            f"Facts:\n{json.dumps(facts, ensure_ascii=True, indent=2)}\n\n"
            f"References:\n{json.dumps([r.__dict__ for r in refs], ensure_ascii=True, indent=2)}\n\n"
            "Return JSON with exactly this shape:\n"
            "{\n"
            '  "medical_summary": "structured physician summary in French",\n'
            '  "complementary_note": "critical attention note in French"\n'
            "}"
        )
        response = await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.1,
        )
        medical_summary = _safe_str(response.get("medical_summary"))
        complementary_note = _safe_str(response.get("complementary_note"))
        if not medical_summary or not complementary_note:
            raise RuntimeError("Gemini response missing required note fields.")
        return medical_summary, complementary_note

    def _generate_notes_deterministic(
        self,
        facts: Dict[str, Any],
        refs: List[KnowledgeReference],
    ) -> Tuple[str, str]:
        patient = facts.get("patient_profile") or {}
        onboarding = facts.get("onboarding_assessment") or {}
        tests = facts.get("tests") or {}

        # Demographics (single source of truth)
        dob = _format_date_iso(patient.get("date_of_birth"))
        sex = _safe_str(patient.get("sex"))
        height = patient.get("height_cm")
        weight = patient.get("weight_kg")
        city = _safe_str(patient.get("city"))
        country = _safe_str(patient.get("country_code"))
        occupation = _safe_str(patient.get("occupation"))

        # Tobacco history / habits
        cpd = patient.get("cigarettes_per_day")
        start_age = patient.get("smoking_start_age")
        currently_smoking = onboarding.get("currently_smoking")
        reduced_last_month = onboarding.get("reduced_consumption_last_month")
        uses_ecig = onboarding.get("uses_e_cigarette")
        weekly_spend = onboarding.get("weekly_tobacco_spend")

        # Scores (prefer the patient_profile aggregated values if present)
        fager_score = patient.get("fagerstrom_score")
        had_a = patient.get("had_anxiety_score")
        had_d = patient.get("had_depression_score")
        dependence_level = _safe_str(patient.get("dependence_level"))

        # Social context (EPICES)
        epices_score = onboarding.get("epices_score")
        income_bracket = _safe_str(onboarding.get("income_bracket"))

        # Medical history notes
        medical_history_notes = _safe_str(patient.get("medical_history_notes"))
        other_health_issues = _safe_str(onboarding.get("other_health_issues"))
        depression_history = onboarding.get("depression_history")

        # Optional: include latest tests snapshots (still facts, not interpretations)
        latest_fagerstrom = tests.get("fagerstrom_latest") or {}
        latest_had = tests.get("had_latest") or {}

        inferred_fager_level = _infer_fagerstrom_level(int(fager_score)) if fager_score is not None else None
        had_a_interp = _interpret_had(int(had_a)) if had_a is not None else None
        had_d_interp = _interpret_had(int(had_d)) if had_d is not None else None

        # --- Medical summary (structured, physician-ready) ---
        lines: List[str] = []
        lines.append("NOTE MEDICALE (Synthese Clinique - generee automatiquement)")
        lines.append("")
        lines.append("1) Identite & Donnees de base")
        lines.append(f"- Date de naissance: {_fmt(dob)}")
        lines.append(f"- Sexe: {_fmt(sex)}")
        lines.append(f"- Taille/Poids: {_fmt(height)} cm / {_fmt(weight)} kg")
        lines.append(f"- Localisation: {_fmt(city)} / {_fmt(country)}")
        lines.append(f"- Profession: {_fmt(occupation)}")
        lines.append("")

        lines.append("2) Tabac & Habitudes")
        lines.append(f"- Statut tabagique actuel (onboarding): {_fmt(currently_smoking)}")
        lines.append(f"- Cigarettes/jour (profil): {_fmt(cpd)}")
        lines.append(f"- Age debut tabac (profil): {_fmt(start_age)}")
        lines.append(f"- Reduction le mois dernier (onboarding): {_fmt(reduced_last_month)}")
        lines.append(f"- Usage e-cigarette (onboarding): {_fmt(uses_ecig)}")
        lines.append("")

        lines.append("3) Scores & Interpretation (faits + interpretation standard)")
        lines.append(f"- Fagerstrom (score total): {_fmt(fager_score)}")
        if dependence_level:
            lines.append(f"- Niveau de dependance (profil): {dependence_level}")
        else:
            lines.append(f"- Niveau de dependance (inference): {_fmt(inferred_fager_level)}")
        lines.append(f"- HAD Anxiete (A): {_fmt(had_a)} | Interpretation: {_fmt(had_a_interp)}")
        lines.append(f"- HAD Depression (D): {_fmt(had_d)} | Interpretation: {_fmt(had_d_interp)}")
        lines.append("")

        lines.append("4) Contexte social & budget")
        lines.append(f"- Depense tabac hebdomadaire (Q47): {_fmt(weekly_spend)}")
        lines.append(f"- Tranche de revenus (Q48): {_fmt(income_bracket)}")
        lines.append(f"- EPICES (nb reponses positives /11): {_fmt(epices_score)}")
        lines.append("")

        lines.append("5) Antecedents / Notes")
        lines.append(f"- Historique depression (onboarding): {_fmt(depression_history)}")
        lines.append(f"- Notes medicales (profil): {_fmt(medical_history_notes)}")
        lines.append(f"- Autres problemes de sante (onboarding): {_fmt(other_health_issues)}")
        lines.append("")

        lines.append("6) Donnees manquantes / A completer")
        missing = self._compute_missing_fields(patient, onboarding)
        if not missing:
            lines.append("- Aucune (selon les champs fournis).")
        else:
            for item in missing:
                lines.append(f"- {item}")
        lines.append("")

        # Keep raw latest test snapshots visible to the physician if present (facts only).
        if latest_fagerstrom or latest_had:
            lines.append("Annexes (faits bruts des derniers tests)")
            if latest_fagerstrom:
                lines.append(f"- Fagerstrom (dernier): {_fmt(latest_fagerstrom)}")
            if latest_had:
                lines.append(f"- HAD (dernier): {_fmt(latest_had)}")
            lines.append("")

        medical_summary = "\n".join(lines).strip()

        # --- Complementary note (critical attention points, strictly from facts) ---
        flags: List[str] = []
        if had_d is not None and int(had_d) >= 11:
            flags.append("Risque eleve de symptomatologie depressive (HAD D >= 11).")
        elif had_d is not None and int(had_d) >= 8:
            flags.append("Symptomatologie depressive possible (HAD D 8-10).")

        if had_a is not None and int(had_a) >= 11:
            flags.append("Anxiete elevee (HAD A >= 11).")
        elif had_a is not None and int(had_a) >= 8:
            flags.append("Anxiete possible (HAD A 8-10).")

        if fager_score is not None and int(fager_score) >= 6:
            flags.append("Dependance physique elevee au tabac (Fagerstrom >= 6).")

        if epices_score is not None and int(epices_score) >= 5:
            # Note: EPICES standard is weighted; our app stores a simple count.
            flags.append("Vulnerabilite sociale possible (EPICES nb reponses positives eleve) - a confirmer.")

        if weekly_spend is not None and int(weekly_spend) >= 50:
            flags.append("Impact financier potentiellement important (depense tabac hebdo >= 50).")

        if depression_history is True:
            flags.append("Antecedent de depression rapporte (onboarding).")

        if not flags:
            flags.append("Aucun point critique detecte a partir des informations disponibles.")

        complementary_note = "POINTS D'ATTENTION (Note complementaire)\n- " + "\n- ".join(flags)

        return medical_summary, complementary_note

    def _compute_missing_fields(self, patient: Dict[str, Any], onboarding: Dict[str, Any]) -> List[str]:
        missing: List[str] = []
        if not patient.get("date_of_birth"):
            missing.append("Date de naissance")
        if not patient.get("sex"):
            missing.append("Sexe")
        if patient.get("height_cm") is None:
            missing.append("Taille (cm)")
        if patient.get("weight_kg") is None:
            missing.append("Poids (kg)")
        if patient.get("cigarettes_per_day") is None:
            missing.append("Cigarettes par jour")
        if patient.get("smoking_start_age") is None:
            missing.append("Age debut tabac")
        if onboarding.get("weekly_tobacco_spend") is None:
            missing.append("Depense tabac hebdomadaire (Q47)")
        return missing

    def _validate(self, facts: Dict[str, Any], medical_summary: str, complementary_note: str) -> Dict[str, Any]:
        """
        Basic automatic quality gate.

        This is intentionally strict enough to block obviously broken outputs.
        It is NOT a medical validator.
        """
        issues: List[str] = []

        if not medical_summary or len(medical_summary.strip()) < 80:
            issues.append("medical_summary trop court ou vide.")

        if not complementary_note or len(complementary_note.strip()) < 30:
            issues.append("complementary_note trop court ou vide.")

        # Coherence checks: if scores exist in facts, they must be present as text in the note.
        patient = facts.get("patient_profile") or {}
        for key in ("fagerstrom_score", "had_anxiety_score", "had_depression_score"):
            if patient.get(key) is not None:
                if str(patient.get(key)) not in medical_summary:
                    issues.append(f"Score manquant dans la synthese: {key}={patient.get(key)}")

        # Prevent "hallucinated certainty": require explicit missing section.
        if "Donnees manquantes" not in medical_summary:
            issues.append("Section 'Donnees manquantes' absente.")

        return {"is_valid": len(issues) == 0, "issues": issues}
