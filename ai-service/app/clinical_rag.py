from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.clinical_rag_chat import ClinicalRagChatService

router = APIRouter(prefix="/clinical-rag", tags=["clinical-rag"])


class RagChatRequest(BaseModel):
    doctor_message: str
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)


class RagResult(BaseModel):
    content: str | None = None
    source: str | None = None
    source_type: str | None = None
    name: str | None = None
    type: str | None = None
    url: str | None = None
    id: int | None = None


class RagChatResponse(BaseModel):
    reply: str
    status: str  # CLARIFYING | DONE
    results: List[RagResult] = Field(default_factory=list)
    model_name: str


@router.post("/chat", response_model=RagChatResponse)
async def chat(payload: RagChatRequest) -> RagChatResponse:
    service = ClinicalRagChatService()
    result = await service.chat(
        doctor_message=payload.doctor_message,
        conversation_history=payload.conversation_history,
    )
    return RagChatResponse(
        reply=result["reply"],
        status=result["status"],
        results=[RagResult(**r) for r in result.get("results", [])],
        model_name=result["model_name"],
    )
