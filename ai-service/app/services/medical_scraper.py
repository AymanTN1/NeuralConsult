"""
Medical data scraper for clinical RAG assistant.

Sources:
  1. Local PDF files (PyMuPDF, keyword search)
  2. PubMed via NCBI E-utilities (free, no API key)
  3. WHO FCTC / INPES web pages (BeautifulSoup)
"""
from __future__ import annotations

import re
import os
import fitz  # PyMuPDF
import requests
from typing import List, Dict, Any
from xml.etree import ElementTree


DOCS_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "papiersMedicales")
)

PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_FETCH_URL  = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
PUBMED_SUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


# ─────────────────────────────────────────────
# 1. LOCAL PDF SEARCH
# ─────────────────────────────────────────────

def _score_chunk(chunk: str, query_words: List[str]) -> int:
    """Simple keyword-based relevance score."""
    chunk_lower = chunk.lower()
    return sum(1 for w in query_words if w in chunk_lower)


def search_local_pdfs(query: str, max_results: int = 4) -> List[Dict[str, Any]]:
    """Search local medical PDFs using keyword matching on 500-char chunks."""
    results = []
    query_words = [w.lower() for w in query.split() if len(w) > 3]

    if not os.path.exists(DOCS_PATH):
        return []

    for filename in os.listdir(DOCS_PATH):
        if not filename.lower().endswith(".pdf"):
            continue
        path = os.path.join(DOCS_PATH, filename)
        try:
            doc = fitz.open(path)
            full_text = " ".join(page.get_text() for page in doc)
            # Split into 500-char chunks with 100-char overlap
            chunks = []
            step = 400
            size = 500
            for i in range(0, len(full_text), step):
                chunk = full_text[i:i + size]
                if len(chunk) > 80:
                    chunks.append(chunk)

            scored = [(chunk, _score_chunk(chunk, query_words)) for chunk in chunks]
            scored.sort(key=lambda x: x[1], reverse=True)

            for chunk, score in scored[:2]:
                if score > 0:
                    results.append({
                        "content": _clean(chunk),
                        "source": filename,
                        "source_type": "PDF local",
                        "score": score,
                        "url": None,
                    })
        except Exception as e:
            print(f"[scraper] PDF error {filename}: {e}")

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:max_results]


# ─────────────────────────────────────────────
# 2. PUBMED SEARCH
# ─────────────────────────────────────────────

def search_pubmed(query: str, max_results: int = 3) -> List[Dict[str, Any]]:
    """Search PubMed via NCBI E-utilities (no API key needed)."""
    try:
        search_resp = requests.get(
            PUBMED_SEARCH_URL,
            params={
                "db": "pubmed",
                "term": f"{query} [Title/Abstract]",
                "retmax": max_results,
                "retmode": "xml",
                "sort": "relevance",
            },
            timeout=8,
        )
        search_resp.raise_for_status()
        root = ElementTree.fromstring(search_resp.content)
        ids = [el.text for el in root.findall(".//Id") if el.text]

        if not ids:
            return []

        summary_resp = requests.get(
            PUBMED_SUMMARY_URL,
            params={"db": "pubmed", "id": ",".join(ids), "retmode": "xml"},
            timeout=8,
        )
        summary_resp.raise_for_status()
        sroot = ElementTree.fromstring(summary_resp.content)

        results = []
        for doc_sum in sroot.findall(".//DocSum"):
            uid = doc_sum.findtext("Id", "")
            title = ""
            authors = ""
            pub_date = ""
            for item in doc_sum.findall("Item"):
                name = item.get("Name", "")
                if name == "Title":
                    title = item.text or ""
                if name == "AuthorList":
                    authors = ", ".join(
                        a.text for a in item.findall("Item") if a.text
                    )
                if name == "PubDate":
                    pub_date = item.text or ""

            if title:
                results.append({
                    "content": f"{title}\nAuteurs: {authors}\nDate: {pub_date}",
                    "source": "PubMed",
                    "source_type": "Article scientifique",
                    "score": 5,
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/{uid}/",
                })

        return results
    except Exception as e:
        print(f"[scraper] PubMed error: {e}")
        return []


# ─────────────────────────────────────────────
# 3. COMBINED SCRAPER
# ─────────────────────────────────────────────

def scrape_all(query: str) -> List[Dict[str, Any]]:
    """Run all scrapers and merge results."""
    pdf_results    = search_local_pdfs(query, max_results=4)
    pubmed_results = search_pubmed(query, max_results=3)

    all_results = pdf_results + pubmed_results
    # Deduplicate by content prefix
    seen = set()
    unique = []
    for r in all_results:
        key = r["content"][:60]
        if key not in seen:
            seen.add(key)
            unique.append(r)

    return unique[:7]
