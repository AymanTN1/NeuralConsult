import io
import re
from typing import Optional

import easyocr
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image, ImageEnhance, ImageFilter
from pydantic import BaseModel

router = APIRouter(prefix="/ocr", tags=["OCR"])

# ── Lazy-load EasyOCR reader (loads model only once) ─────────────────────────
_reader: Optional[easyocr.Reader] = None


def get_reader() -> easyocr.Reader:
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(["fr", "en"], gpu=False, verbose=False)
    return _reader


# ── Noise word list ────────────────────────────────────────────────────────────
NOISE_WORDS = {
    "ROYAUME", "MAROC", "ROYAUMEDUMAROC", "KINGDOM", "MOROCCO",
    "CARTE", "NATIONALE", "IDENTITE", "NATIONAL", "IDENTITY",
    "DIDENTITE", "DDENTITE", "NIDENTITE", "CARTENA", "CARTENATIONALE",
    "SIGNATURE", "SEXE", "SEX", "NAISSANCE", "BIRTH",
    "VALIDITE", "EXPIRY", "EXPIRATION", "VALABLE",
    "NOM", "PRENOM", "SURNAME", "NAME", "FIRST", "GIVEN",
    "NEL", "NELE", "NOLO", "BALE", "NEE", "DU", "DE", "LA", "LE",
    "LES", "AU", "ET", "A", "D", "M", "F",
    "RABAT", "CASABLANCA", "FES", "MARRAKECH", "AGADIR", "HASSAN",
    "OUARZAZATE", "SAFI", "TIZNIT", "NADOR", "KENITRA", "OUJDA",
    "LAAYOUNE", "DAKHLA", "KHOURIBGA", "SETTAT", "BENI", "MELLAL",
    "VAS", "LIT", "LIS", "SOC", "TEE", "INVIN", "WTAN", "SEEN", "LITE",
    "RON", "MAR", "ANI", "BAT", "TAT",  # typical OCR garbage
    "MASCULIN", "FEMININ", "DN", "NA",
}

HEADER_MARKERS = re.compile(
    r"ROYAUME|MAROC|CARTE|NATIONALE|IDENTIT|KINGDOM", re.IGNORECASE
)


# ── Image pre-processing ───────────────────────────────────────────────────────
def enhance_image(img: Image.Image) -> Image.Image:
    """Convert to grayscale, upscale, sharpen, boost contrast."""
    img = img.convert("L")  # grayscale
    w, h = img.size
    # Upscale to at least 1800px wide
    scale = max(1, 1800 // w)
    if scale > 1:
        img = img.resize((w * scale, h * scale), Image.LANCZOS)
    # Sharpen
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
    # Contrast boost
    img = ImageEnhance.Contrast(img).enhance(1.8)
    return img


# ── Text extraction ────────────────────────────────────────────────────────────
def extract_names(lines: list[str]) -> tuple[str, str]:
    """Skip header, then find first two valid uppercase name words."""
    header_end = -1
    for i, line in enumerate(lines[:6]):
        if HEADER_MARKERS.search(line):
            header_end = i
    post = lines[header_end + 1:] if header_end >= 0 else lines

    candidates: list[str] = []
    for line in post:
        if re.search(r"\d{2}[\s./\-]\d{2}[\s./\-]\d{4}", line):
            continue
        if re.search(r"\d{5,}", line):
            continue
        if re.match(r"^(nom|prenom|prénom|naissance|birth|date|validite|sexe)", line, re.IGNORECASE):
            continue
        words = re.findall(r"[A-Z]{3,}", line.upper())
        for w in words:
            if w not in NOISE_WORDS and w not in candidates:
                candidates.append(w)

    first_name = candidates[0] if len(candidates) > 0 else ""
    last_name  = candidates[1] if len(candidates) > 1 else ""
    return first_name, last_name


def extract_date(texts: list[str]) -> str:
    """Find birth date (dd.mm.yyyy or dd/mm/yyyy or ddmmyyyy) in OCR output."""
    now_year = 2025
    best = None
    best_score = -1

    all_text = " ".join(texts)
    # Replace common OCR confusions
    sanitized = re.sub(r"[Oo]", "0", all_text)
    sanitized = re.sub(r"[Il|]", "1", sanitized)

    for match in re.finditer(r"\d{2}[\s./\-]?\d{2}[\s./\-]?\d{4}", sanitized):
        digits = re.sub(r"\D", "", match.group())
        if len(digits) != 8:
            continue
        dd, mm, yyyy = digits[:2], digits[2:4], digits[4:]
        y, m, d = int(yyyy), int(mm), int(dd)
        if not (1930 <= y <= now_year - 10):
            continue
        if not (1 <= m <= 12 and 1 <= d <= 31):
            continue
        score = 10 if re.search(r"naissance|né|nee|birth", match.string, re.IGNORECASE) else 1
        if score > best_score:
            best_score = score
            best = f"{yyyy}-{mm}-{dd}"

    return best or ""


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
    Accept an image (JPEG/PNG) of a Moroccan CIN recto and extract:
    - firstName (Prénom)
    - lastName  (Nom)
    - dateOfBirth (YYYY-MM-DD)
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Seules les images JPEG/PNG sont acceptées.")

    try:
        raw = await file.read()
        img = Image.open(io.BytesIO(raw))
    except Exception:
        raise HTTPException(status_code=400, detail="Impossible de lire l'image.")

    try:
        enhanced = enhance_image(img)
        np_img = np.array(enhanced)

        reader = get_reader()
        results = reader.readtext(np_img, detail=0, paragraph=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur OCR : {e}")

    # Clean up lines
    lines = [r.strip() for r in results if r.strip()]
    raw_text = "\n".join(lines)

    first_name, last_name = extract_names(lines)
    date_of_birth = extract_date(lines)

    confidence = (
        (34 if first_name   else 0) +
        (33 if last_name    else 0) +
        (33 if date_of_birth else 0)
    )

    return CinOcrResult(
        firstName=first_name,
        lastName=last_name,
        dateOfBirth=date_of_birth,
        rawText=raw_text,
        confidence=confidence,
    )
