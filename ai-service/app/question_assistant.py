from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import Field

from app.modeling import ApiModel
from app.services.question_assistant import QuestionAssistantService

router = APIRouter(prefix="/question-assistant", tags=["question-assistant"])


class ChoiceOption(ApiModel):
    value: str
    label: str


class QuestionAssistantRequest(ApiModel):
    phase_id: Optional[int] = None
    phase_label: Optional[str] = None
    question_id: str
    question_label: str
    question_context: Optional[str] = None
    patient_message: Optional[str] = None
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    current_answer: Optional[Any] = None
    official_choices: List[ChoiceOption] = Field(default_factory=list)
    patient_facts: Dict[str, Any] = Field(default_factory=dict)


class QuestionAssistantResponse(ApiModel):
    explanation: str
    clarifying_questions: List[str] = Field(default_factory=list)
    suggested_choice_value: Optional[str] = None
    suggested_choice_label: Optional[str] = None
    suggestion_reason: str
    needs_patient_confirmation: bool = True
    safety_note: str
    engine: str = "fallback"
    engine_warning: Optional[str] = None
    references: List[Dict[str, str]] = Field(default_factory=list)


@router.post("/assist", response_model=QuestionAssistantResponse)
async def assist_question(payload: QuestionAssistantRequest) -> QuestionAssistantResponse:
    service = QuestionAssistantService()
    result = await service.assist(payload.model_dump())
    return QuestionAssistantResponse(**result)
