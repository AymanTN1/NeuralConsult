from __future__ import annotations

import json
from typing import Any, Dict, List

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import Field

from app.modeling import ApiModel
from app.services.support_chat import SupportChatService

router = APIRouter(prefix="/support-chat", tags=["support-chat"])


class SupportChatRequest(ApiModel):
    request_id: str
    patient_facts: Dict[str, Any] = Field(default_factory=dict)
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    latest_patient_message: str = ""
    emergency_mode: bool = False
    preferred_language: str = "fr"


class SupportChatResponse(ApiModel):
    request_id: str
    reply: str
    risk_level: str
    should_alert_doctor: bool
    alert_reason: str | None = None
    recommended_doctor_action: str | None = None
    summary: str | None = None
    model_name: str


class SupportVoiceChatResponse(SupportChatResponse):
    transcription: str
    voice_stress_score: int = 0
    voice_stress_level: str = "LOW"
    voice_stress_summary: str | None = None
    voice_stress_signals: List[str] = Field(default_factory=list)


@router.post("/respond", response_model=SupportChatResponse)
async def respond(payload: SupportChatRequest) -> SupportChatResponse:
    service = SupportChatService()
    result = await service.respond(
        latest_patient_message=payload.latest_patient_message,
        patient_facts=payload.patient_facts,
        conversation_history=payload.conversation_history,
        emergency_mode=payload.emergency_mode,
        preferred_language=payload.preferred_language,
    )
    return SupportChatResponse(request_id=payload.request_id, **result)


@router.post("/respond-voice", response_model=SupportVoiceChatResponse)
async def respond_voice(
    audio: UploadFile = File(...),
    request_id: str = Form(..., alias="requestId"),
    patient_facts: str = Form("{}", alias="patientFacts"),
    conversation_history: str = Form("[]", alias="conversationHistory"),
    emergency_mode: bool = Form(False, alias="emergencyMode"),
    preferred_language: str = Form("fr", alias="preferredLanguage"),
    audio_duration_ms: int | None = Form(None, alias="audioDurationMs"),
) -> SupportVoiceChatResponse:
    content_type = (audio.content_type or "").lower()
    if not (
        content_type.startswith("audio/")
        or content_type.startswith("video/webm")
        or content_type == "application/octet-stream"
    ):
        raise HTTPException(status_code=400, detail="Format audio non accepte.")

    raw = await audio.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Le message vocal est vide.")
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Le message vocal depasse la taille autorisee de 10 Mo.")
    if audio_duration_ms is not None and audio_duration_ms > 90_000:
        raise HTTPException(status_code=400, detail="Le message vocal doit durer 90 secondes maximum.")

    try:
        parsed_facts = json.loads(patient_facts)
        parsed_history = json.loads(conversation_history)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Contexte IA vocal invalide.") from exc

    service = SupportChatService()
    try:
        result = await service.respond_voice(
            audio_bytes=raw,
            audio_mime_type=content_type,
            patient_facts=parsed_facts if isinstance(parsed_facts, dict) else {},
            conversation_history=parsed_history if isinstance(parsed_history, list) else [],
            emergency_mode=emergency_mode,
            preferred_language=preferred_language,
            audio_duration_ms=audio_duration_ms,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return SupportVoiceChatResponse(request_id=request_id, **result)
