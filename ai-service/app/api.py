from fastapi import APIRouter

from app.clinical_intelligence import router as clinical_intelligence_router
from app.clinical_notes import router as clinical_notes_router
from app.question_assistant import router as question_assistant_router
from app.support_chat import router as support_chat_router

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# Clinical Intelligence API
router.include_router(clinical_notes_router)
router.include_router(clinical_intelligence_router)
router.include_router(question_assistant_router)
router.include_router(support_chat_router)
