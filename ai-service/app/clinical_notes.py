from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.clinical_notes import ClinicalNotesService

router = APIRouter(prefix="/clinical-notes", tags=["clinical-notes"])


class ClinicalNotesGenerateRequest(BaseModel):
    """
    NOTE: To enforce "zero hallucination", the generator must stick to this `facts` object.
    If a fact is missing, the output should explicitly mention the missing info.
    """

    request_id: str = Field(..., description="Client-generated idempotency key / trace id")
    facts: Dict[str, Any] = Field(..., description="Patient facts (single source of truth)")


class ValidationResult(BaseModel):
    is_valid: bool
    issues: List[str] = Field(default_factory=list)


class ClinicalNotesGenerateResponse(BaseModel):
    request_id: str
    medical_summary: str
    complementary_note: str
    validation: ValidationResult
    model_name: str = Field(..., description="Which generator produced this output")

    # RAG preparation: in the future, this will contain external references (INPES 2007 excerpts, etc).
    # For now, it stays empty and acts as a placeholder for the future vector DB integration.
    references: List[Dict[str, str]] = Field(default_factory=list)


@router.post("/generate", response_model=ClinicalNotesGenerateResponse)
async def generate_notes(payload: ClinicalNotesGenerateRequest) -> ClinicalNotesGenerateResponse:
    service = ClinicalNotesService()
    result = service.generate(payload.facts)

    if not result["validation"]["is_valid"]:
        # Block the workflow: caller must ask for re-analysis / correction.
        raise HTTPException(status_code=422, detail={"request_id": payload.request_id, **result})

    return ClinicalNotesGenerateResponse(
        request_id=payload.request_id,
        medical_summary=result["medical_summary"],
        complementary_note=result["complementary_note"],
        validation=ValidationResult(**result["validation"]),
        model_name=result["model_name"],
        references=result.get("references", []),
    )

