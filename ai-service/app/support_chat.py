from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import Field

from app.modeling import ApiModel
from app.services.support_chat import SupportChatService

router = APIRouter(prefix="/support-chat", tags=["support-chat"])


class SupportChatRequest(ApiModel):
    request_id: str
    patient_facts: Dict[str, Any] = Field(default_factory=dict)
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    latest_patient_message: str = ""


class SupportChatResponse(ApiModel):
    request_id: str
    reply: str
    risk_level: str
    should_alert_doctor: bool
    alert_reason: str | None = None
    recommended_doctor_action: str | None = None
    summary: str | None = None
    model_name: str


@router.post("/respond", response_model=SupportChatResponse)
async def respond(payload: SupportChatRequest) -> SupportChatResponse:
    service = SupportChatService()
    result = await service.respond(
        latest_patient_message=payload.latest_patient_message,
        patient_facts=payload.patient_facts,
        conversation_history=payload.conversation_history,
    )
    return SupportChatResponse(request_id=payload.request_id, **result)
