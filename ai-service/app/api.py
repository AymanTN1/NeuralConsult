from fastapi import APIRouter

from app.clinical_notes import router as clinical_notes_router

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# Clinical Intelligence (Notes) API
router.include_router(clinical_notes_router)