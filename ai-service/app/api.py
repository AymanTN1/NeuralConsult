from fastapi import APIRouter
from app.news_scheduler import trigger_manually

from app.cin_ocr import router as cin_ocr_router
from app.clinical_intelligence import router as clinical_intelligence_router
from app.clinical_notes import router as clinical_notes_router
from app.question_assistant import router as question_assistant_router
from app.support_chat import router as support_chat_router
from app.clinical_guidance import router as clinical_guidance_router

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# CIN OCR API
router.include_router(cin_ocr_router)
# Clinical Intelligence API
router.include_router(clinical_notes_router)
router.include_router(clinical_intelligence_router)
router.include_router(question_assistant_router)
router.include_router(support_chat_router)
router.include_router(clinical_guidance_router)

@router.post("/news/trigger", tags=["news"])
async def trigger_news():
    return trigger_manually()
