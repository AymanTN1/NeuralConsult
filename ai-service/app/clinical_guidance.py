from fastapi import APIRouter, Query
from typing import List, Dict
from app.knowledge_engine import knowledge_engine
from pydantic import BaseModel

router = APIRouter(prefix="/clinical-guidance", tags=["clinical-guidance"])

class GuidanceItem(BaseModel):
    content: str
    source: str
    relevance: str

class GuidanceResponse(BaseModel):
    query: str
    results: List[GuidanceItem]

@router.get("/search", response_model=GuidanceResponse)
async def search_guidelines(q: str = Query(..., description="Query to search in medical guidelines")):
    results = knowledge_engine.get_clinical_guidance(q)
    return GuidanceResponse(
        query=q,
        results=[GuidanceItem(**item) for item in results]
    )

@router.get("/nrt-dosage-lookup")
async def lookup_nrt_dosage(fagerstrom_score: int):
    # Specialized query for NRT dosage based on guidelines
    query = f"Dosage substituts nicotiniques patch gommes score Fagerstrom {fagerstrom_score}"
    results = knowledge_engine.get_clinical_guidance(query)
    return {
        "score": fagerstrom_score,
        "recommendations": results
    }

@router.get("/moroccan-protocol")
async def get_moroccan_protocol(topic: str):
    # Specialized query focused on the Moroccan guide
    query = f"Protocole marocain sevrage tabagique {topic}"
    results = knowledge_engine.query(query, n_results=5)
    # Filter only Moroccan source if possible (or prioritize)
    filtered = [
        {"content": r.page_content, "source": r.metadata.get("source")}
        for r in results if "Maroc" in r.metadata.get("source", "") or "marocain" in r.metadata.get("source", "").lower()
    ]
    if not filtered:
        filtered = [{"content": r.page_content, "source": r.metadata.get("source")} for r in results]
        
    return {"topic": topic, "guidance": filtered}
