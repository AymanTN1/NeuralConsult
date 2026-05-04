"""
data_enricher.py — Enrichissement des articles
- Résumés automatiques
- Images depuis Wikipedia REST API
- Schéma de données canonique autour de la colonne `summary`
"""

import os
import re
import time
from urllib.parse import quote

import pandas as pd
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ISIC-Enricher/1.0)",
    "Accept-Language": "fr-FR,fr;q=0.9,ar;q=0.8,en;q=0.7",
}

WIKIPEDIA_LANGS = ["ar", "fr", "en"]


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"\s+", " ", text)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&")
    text = text.replace("&lt;", "<").replace("&gt;", ">")
    return text.strip()


def extract_summary_from_url(url: str, max_chars: int = 300) -> str:
    if not url or not url.startswith("http"):
        return ""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.encoding = resp.apparent_encoding or "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")

        for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
            tag.decompose()

        for paragraph in soup.find_all("p"):
            text = clean_text(paragraph.get_text())
            if len(text) > 60:
                return text[:max_chars] + ("…" if len(text) > max_chars else "")
    except Exception:
        pass
    return ""


def fetch_wikipedia_image(title: str, lang: str = "fr") -> dict:
    for wiki_lang in ([lang] + [value for value in WIKIPEDIA_LANGS if value != lang]):
        try:
            search_url = f"https://{wiki_lang}.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": title,
                "srlimit": 1,
            }
            response = requests.get(search_url, params=params, headers=HEADERS, timeout=8)
            data = response.json()
            results = data.get("query", {}).get("search", [])
            if not results:
                continue

            page_title = results[0]["title"]
            rest_url = f"https://{wiki_lang}.wikipedia.org/api/rest_v1/page/summary/{quote(page_title)}"
            page_response = requests.get(rest_url, headers=HEADERS, timeout=8)
            if not page_response.ok:
                continue
            page = page_response.json()

            thumbnail = page.get("thumbnail", {})
            if thumbnail.get("source"):
                image_url = re.sub(r"/\d+px-", "/800px-", thumbnail["source"])
                return {
                    "url": image_url,
                    "caption": page.get("description", ""),
                    "source": f"Wikipedia ({wiki_lang})",
                }
        except Exception:
            continue
    return {}


def detect_article_lang(title: str) -> str:
    arabic = len(re.findall(r"[\u0600-\u06FF]", title))
    total = len(title.replace(" ", ""))
    if total == 0:
        return "fr"
    if arabic / total > 0.25:
        return "ar"
    fr_words = ["le", "la", "les", "du", "des", "un", "une", "et", "en", "au", "aux"]
    words = title.lower().split()
    if any(word in fr_words for word in words[:5]):
        return "fr"
    return "en"


def ensure_canonical_columns(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    frame.columns = [str(col).strip().lower() for col in frame.columns]

    if "summary" not in frame.columns:
        frame["summary"] = frame["resume"] if "resume" in frame.columns else ""
    elif "resume" in frame.columns:
        current = frame["summary"].fillna("").astype(str)
        resume_values = frame["resume"].fillna("").astype(str)
        frame.loc[current.isin(["", "nan"]), "summary"] = resume_values

    if "image_url" not in frame.columns:
        frame["image_url"] = ""
    if "image_caption" not in frame.columns:
        frame["image_caption"] = ""
    if "lang" not in frame.columns:
        frame["lang"] = frame["title"].apply(detect_article_lang) if "title" in frame.columns else "fr"

    return frame


def enrich_dataframe(
    df: pd.DataFrame,
    enrich_images: bool = True,
    enrich_summaries: bool = True,
    max_articles: int | None = None,
) -> pd.DataFrame:
    if df.empty:
        return df

    frame = ensure_canonical_columns(df)
    limit = min(max_articles or len(frame), len(frame))
    print(f"\n🔍 Enrichissement de {limit} articles…")

    for index, row_index in enumerate(frame.index[:limit]):
        row = frame.loc[row_index]
        title = str(row.get("title", ""))
        url = str(row.get("url", ""))
        lang = str(row.get("lang", "fr"))

        print(f"  [{index + 1:3d}/{limit}] {title[:55]}…", end="\r")

        if enrich_summaries:
            current_summary = str(row.get("summary", "")).strip()
            if not current_summary or current_summary == "nan":
                summary = extract_summary_from_url(url)
                if summary:
                    frame.at[row_index, "summary"] = summary

        if enrich_images:
            current_image = str(row.get("image_url", "")).strip()
            if not current_image or current_image == "nan":
                wiki_lang = "ar" if lang == "ar" else "fr" if lang == "fr" else "en"
                image_data = fetch_wikipedia_image(title, wiki_lang)
                if image_data:
                    frame.at[row_index, "image_url"] = image_data["url"]
                    frame.at[row_index, "image_caption"] = image_data.get("caption", "")

        time.sleep(0.3)

    print("\n✅ Enrichissement terminé")
    return frame


def run_enrichment(
    input_path: str,
    output_path: str,
    images: bool = True,
    summaries: bool = True,
    max_articles: int = 50,
):
    print(f"📂 Lecture : {input_path}")
    df = pd.read_csv(input_path, encoding="utf-8-sig")
    print(f"   {len(df)} articles chargés")

    df = enrich_dataframe(
        df,
        enrich_images=images,
        enrich_summaries=summaries,
        max_articles=max_articles,
    )

    ordered_columns = [
        column
        for column in ["title", "source", "lang", "url", "date", "summary", "category", "credibility", "image_url", "image_caption"]
        if column in df.columns
    ]
    remaining_columns = [column for column in df.columns if column not in ordered_columns and column != "resume"]
    df = df[ordered_columns + remaining_columns]

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"\n💾 Sauvegardé : {output_path}")

    image_count = (df["image_url"].notna() & (df["image_url"] != "")).sum()
    summary_count = (df["summary"].notna() & (df["summary"] != "")).sum()
    print(f"   📸 Articles avec image  : {image_count}/{len(df)}")
    print(f"   📝 Articles avec résumé : {summary_count}/{len(df)}")

    return df


if __name__ == "__main__":
    BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(BASE, "data", "output", "organized_articles.csv")
    output_file = os.path.join(BASE, "data", "output", "organized_articles.csv")

    if not os.path.exists(input_file):
        print(f"❌ Fichier introuvable : {input_file}")
    else:
        run_enrichment(input_file, output_file, images=True, summaries=True, max_articles=100)
