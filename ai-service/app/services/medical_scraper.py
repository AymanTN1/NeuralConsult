"""
Medical data scraper for clinical RAG assistant.

Sources:
  1. Local PDF files (PyMuPDF, keyword search with accent normalization)
  2. PubMed via NCBI E-utilities (free, no API key)
  3. Combined logic with unique source IDs for citations
"""
from __future__ import annotations

import re
import os
import fitz  # PyMuPDF
import requests
import unicodedata
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


def _normalize(text: str) -> str:
    """Normalize text by removing accents and making it lowercase."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text.lower())
        if unicodedata.category(c) != "Mn"
    )


# ─────────────────────────────────────────────
# 1. LOCAL PDF SEARCH
# ─────────────────────────────────────────────

def _score_chunk(chunk: str, query_words: List[str]) -> int:
    """Keyword-based relevance score with normalization."""
    chunk_norm = _normalize(chunk)
    score = 0
    for word in query_words:
        if word in chunk_norm:
            score += 2  # Full word match
        elif len(word) > 4 and word[:len(word)-1] in chunk_norm:
            score += 1  # Partial match (prefix)
    return score


def search_local_pdfs(query: str, max_results: int = 4) -> List[Dict[str, Any]]:
    """Search local medical PDFs using keyword matching on 600-char chunks."""
    results = []
    norm_query = _normalize(query)
    query_words = [w for w in norm_query.split() if len(w) > 2]

    if not os.path.exists(DOCS_PATH):
        return []

    for filename in os.listdir(DOCS_PATH):
        if not filename.lower().endswith(".pdf"):
            continue
        path = os.path.join(DOCS_PATH, filename)
        try:
            doc = fitz.open(path)
            # Process page by page to keep it memory efficient
            for page_num in range(len(doc)):
                page_text = doc[page_num].get_text()
                # Simple chunking within the page
                chunks = [page_text[i:i+600] for i in range(0, len(page_text), 450)]
                
                for chunk in chunks:
                    if len(chunk) < 100: continue
                    score = _score_chunk(chunk, query_words)
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

    # Sort by score and keep best per document if many
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:max_results]


# ─────────────────────────────────────────────
# 2. PUBMED SEARCH
# ─────────────────────────────────────────────

def search_pubmed(query: str, max_results: int = 4) -> List[Dict[str, Any]]:
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
    """Run all scrapers and merge results with unique IDs."""
    pdf_results    = search_local_pdfs(query, max_results=5)
    pubmed_results = search_pubmed(query, max_results=4)

    all_results = pdf_results + pubmed_results
    # Deduplicate by content prefix
    seen = set()
    unique = []
    for r in all_results:
        key = r["content"][:60]
        if key not in seen:
            seen.add(key)
            unique.append(r)

    # Assign IDs for easy citation [1], [2], etc.
    for i, res in enumerate(unique):
        res["id"] = i + 1

    return unique[:10]
