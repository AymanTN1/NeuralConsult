import io
import os
import base64
from typing import Optional
import google.generativeai as genai
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel

router = APIRouter(prefix="/ocr", tags=["OCR"])

# ── Gemini OCR Setup ───────────────────────────────────────────────────────────
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-2.0-flash"))

# ── Response model ─────────────────────────────────────────────────────────────
class CinOcrResult(BaseModel):
    firstName:   str
    lastName:    str
    dateOfBirth: str
    rawText:     str
    confidence:  int

# ── Endpoint ───────────────────────────────────────────────────────────────────
@router.post("/cin", response_model=CinOcrResult)
async def ocr_cin(file: UploadFile = File(...)):
    """
    Accept an image of a Moroccan CIN and extract info using Gemini Vision.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Seules les images JPEG/PNG sont acceptées.")

    try:
        raw = await file.read()
        # Verify it's a valid image
        Image.open(io.BytesIO(raw))
    except Exception:
        raise HTTPException(status_code=400, detail="Impossible de lire l'image.")

    try:
        model = get_gemini_client()
        
        prompt = """
        Analyze this Moroccan Identity Card (CIN) and extract exactly:
        1. First Name (Prénom)
        2. Last Name (Nom)
        3. Date of Birth (Format: YYYY-MM-DD)
        
        Return ONLY a JSON object with these keys: firstName, lastName, dateOfBirth, rawText (all text found).
        If something is missing, use an empty string.
        """
        
        # Format image for Gemini
        img_data = {
            "mime_type": file.content_type,
            "data": base64.b64encode(raw).decode("utf-8")
        }
        
        response = model.generate_content([prompt, img_data])
        text = response.text
        
        # Simple JSON extraction from response
        import json
        # Find JSON block
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
        else:
            # Fallback if no JSON block
            raise ValueError("Gemini failed to return JSON")

        first_name = data.get("firstName", "")
        last_name = data.get("lastName", "")
        dob = data.get("dateOfBirth", "")
        raw_text = data.get("rawText", text)

        confidence = (
            (34 if first_name else 0) +
            (33 if last_name else 0) +
            (33 if dob else 0)
        )

        return CinOcrResult(
            firstName=first_name,
            lastName=last_name,
            dateOfBirth=dob,
            rawText=raw_text,
            confidence=confidence,
        )
    except Exception as e:
        print(f"OCR Error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur OCR (Gemini) : {str(e)}")

import re
