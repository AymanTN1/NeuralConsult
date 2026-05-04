from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import Field

from app.modeling import ApiModel
from app.services.clinical_intelligence import ClinicalIntelligenceService

router = APIRouter(prefix="/clinical-intelligence", tags=["clinical-intelligence"])


class ClinicalIntelligenceRequest(ApiModel):
    request_id: str
    facts: Dict[str, Any] = Field(default_factory=dict)


class PhaseSummaryItem(ApiModel):
    phase_id: int
    phase_title: str
    summary: str
    attention_points: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)


class GlobalSummaryItem(ApiModel):
    summary: str
    doctor_focus_points: List[str] = Field(default_factory=list)
    patient_readiness: str
    missing_information: List[str] = Field(default_factory=list)


class PlanCandidateItem(ApiModel):
    track: str
    title: str
    rationale: str
    nrt_recommendation: str
    behavioral_focus: str
    follow_up_plan: str
    scientific_reference: str = Field(default="", description="Ex: Selon Guide Marocain p.12")
    doctor_warnings: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)


class ClinicalIntelligenceResponse(ApiModel):
    request_id: str
    model_name: str
    phase_summaries: List[PhaseSummaryItem]
    global_summary: GlobalSummaryItem
    plan_candidates: List[PlanCandidateItem]
    references: List[Dict[str, str]] = Field(default_factory=list)


@router.post("/generate", response_model=ClinicalIntelligenceResponse)
async def generate_clinical_intelligence(
    payload: ClinicalIntelligenceRequest,
) -> ClinicalIntelligenceResponse:
    service = ClinicalIntelligenceService()
    result = await service.generate(payload.facts)
    return ClinicalIntelligenceResponse(
        request_id=payload.request_id,
        model_name=result["model_name"],
        phase_summaries=[PhaseSummaryItem(**item) for item in result["phase_summaries"]],
        global_summary=GlobalSummaryItem(**result["global_summary"]),
        plan_candidates=[PlanCandidateItem(**item) for item in result["plan_candidates"]],
        references=result.get("references", []),
    )
