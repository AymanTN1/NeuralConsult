"""
scraper.py — Collecte d'articles sportifs multilingues
Sources : Arabe + Français + Anglais (15+ sources)
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import os
import time
import random
from datetime import datetime

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9,ar;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ─────────────────────────────────────────────
# SOURCES DÉFINIES
# Chaque source : nom, url, sélecteurs CSS, langue
# ─────────────────────────────────────────────
SOURCES = [
    # ── SOURCES ARABES ──
    {
        "name": "Hesport",
        "url": "https://www.hesport.com/",
        "lang": "ar",
        "selectors": {
            "articles": "article, .post, .item, h2 a, h3 a",
            "title": "h2, h3, .title, .entry-title",
            "link": "a",
            "date": "time, .date, .post-date",
        },
    },
    {
        "name": "Le360 Sport",
        "url": "https://sport.le360.ma/",
        "lang": "ar",
        "selectors": {
            "articles": ".article, .post, article",
            "title": "h2, h3, .article-title",
            "link": "a",
            "date": "time, .date",
        },
    },
    {
        "name": "Arryadia",
        "url": "https://arryadia.com/",
        "lang": "ar",
        "selectors": {
            "articles": "article, .post, .item",
            "title": "h2, h3, .post-title",
            "link": "a",
            "date": "time, .date",
        },
    },
    {
        "name": "Kooora",
        "url": "https://www.kooora.com/",
        "lang": "ar",
        "selectors": {
            "articles": ".news-item, .news_item, article, h3",
            "title": "h3, h2, .title",
            "link": "a",
            "date": "span.date, .time",
        },
    },
    {
        "name": "FilGoal",
        "url": "https://www.filgoal.com/",
        "lang": "ar",
        "selectors": {
            "articles": "article, .news-item, .post",
            "title": "h2, h3, .title",
            "link": "a",
            "date": "time, .date",
        },
    },
    {
        "name": "Yalla Kora",
        "url": "https://www.yallakora.com/",
        "lang": "ar",
        "selectors": {
            "articles": "article, .news-item, .post",
            "title": "h3, h2, .title",
            "link": "a",
            "date": "time, .date",
        },
    },

    # ── SOURCES FRANÇAISES ──
    {
        "name": "L'Équipe",
        "url": "https://www.lequipe.fr/",
        "lang": "fr",
        "selectors": {
            "articles": "article, .article, .js-push-article",
            "title": "h2, h3, .article__title",
            "link": "a",
            "date": "time, .article__date",
        },
    },
    {
        "name": "RMC Sport",
        "url": "https://rmcsport.bfmtv.com/",
        "lang": "fr",
        "selectors": {
            "articles": "article, .story",
            "title": "h2, h3, .story__title",
            "link": "a",
            "date": "time, .story__date",
        },
    },
    {
        "name": "Eurosport FR",
        "url": "https://www.eurosport.fr/",
        "lang": "fr",
        "selectors": {
            "articles": "article, .story-card",
            "title": "h2, h3",
            "link": "a",
            "date": "time",
        },
    },
    {
        "name": "Sport.fr",
        "url": "https://www.sport.fr/",
        "lang": "fr",
        "selectors": {
            "articles": "article, .article-item",
            "title": "h2, h3",
            "link": "a",
            "date": "time, .date",
        },
    },

    # ── SOURCES ANGLOPHONES ──
    {
        "name": "BBC Sport",
        "url": "https://www.bbc.com/sport",
        "lang": "en",
        "selectors": {
            "articles": "article, .gs-c-promo",
            "title": "h3, h2, .gs-c-promo-heading__title",
            "link": "a",
            "date": "time",
        },
    },
    {
        "name": "Sky Sports",
        "url": "https://www.skysports.com/",
        "lang": "en",
        "selectors": {
            "articles": "article, .news-list__item",
            "title": "h2, h3, .news-list__headline",
            "link": "a",
            "date": "time",
        },
    },
    {
        "name": "Goal.com",
        "url": "https://www.goal.com/en",
        "lang": "en",
        "selectors": {
            "articles": "article, .js-article",
            "title": "h3, h2",
            "link": "a",
            "date": "time",
        },
    },
    {
        "name": "ESPN",
        "url": "https://www.espn.com/",
        "lang": "en",
        "selectors": {
            "articles": ".contentItem, article",
            "title": "h1, h2, h3",
            "link": "a",
            "date": "time",
        },
    },
    {
        "name": "90min",
        "url": "https://www.90min.com/",
        "lang": "en",
        "selectors": {
            "articles": "article, .article-card",
            "title": "h3, h2",
            "link": "a",
            "date": "time",
        },
    },
]


def scrape_source(source: dict) -> list[dict]:
    """Scrape une source et retourne une liste d'articles."""
    articles = []
    try:
        print(f"  🌐 {source['name']}…", end="", flush=True)
        resp = requests.get(source["url"], headers=HEADERS, timeout=15)
        resp.encoding = resp.apparent_encoding or "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")

        sel = source["selectors"]
        today = datetime.now().strftime("%Y-%m-%d")

        # Chercher les titres / liens
        found_titles = set()

        # Stratégie 1 : éléments article
        containers = soup.select(sel["articles"])
        for container in containers[:20]:
            title_el = container.select_one(sel["title"]) if isinstance(container, BeautifulSoup.__class__) else container
            if not title_el:
                title_el = container

            title = title_el.get_text(strip=True)
            if len(title) < 10 or title in found_titles:
                continue

            link_el = container.find("a", href=True)
            url = ""
            if link_el:
                href = link_el.get("href", "")
                url = href if href.startswith("http") else source["url"].rstrip("/") + "/" + href.lstrip("/")

            date_el = container.select_one(sel.get("date", "time"))
            date = today
            if date_el:
                date = (
                    date_el.get("datetime", "")
                    or date_el.get("content", "")
                    or date_el.get_text(strip=True)
                    or today
                )[:10]

            found_titles.add(title)
            articles.append({
                "title": title,
                "source": source["name"],
                "lang": source["lang"],
                "url": url,
                "date": date,
                "summary": "",
                "category": "",
                "credibility": 0,
            })

        # Stratégie 2 : tous les h2/h3 si peu de résultats
        if len(articles) < 5:
            for tag in soup.find_all(["h2", "h3"])[:25]:
                title = tag.get_text(strip=True)
                if len(title) < 10 or title in found_titles:
                    continue
                link_el = tag.find("a", href=True) or tag.find_parent("a", href=True)
                url = ""
                if link_el:
                    href = link_el.get("href", "")
                    url = href if href.startswith("http") else source["url"].rstrip("/") + "/" + href.lstrip("/")
                found_titles.add(title)
                articles.append({
                    "title": title,
                    "source": source["name"],
                    "lang": source["lang"],
                    "url": url,
                    "date": today,
                    "summary": "",
                    "category": "",
                    "credibility": 0,
                })

        print(f" {len(articles)} articles")
    except requests.exceptions.Timeout:
        print(f" ⏱️ Timeout")
    except requests.exceptions.ConnectionError:
        print(f" 🔌 Connexion refusée")
    except Exception as e:
        print(f" ❌ {str(e)[:60]}")

    return articles


def scrape_all(output_path: str, delay: float = 1.5) -> pd.DataFrame:
    """Scrape toutes les sources et sauvegarde."""
    all_articles = []
    print(f"\n🚀 Démarrage du scraping ({len(SOURCES)} sources)\n")

    for i, source in enumerate(SOURCES, 1):
        print(f"[{i:2d}/{len(SOURCES)}]", end=" ")
        articles = scrape_source(source)
        all_articles.extend(articles)

        # Délai poli entre requêtes
        if i < len(SOURCES):
            sleep = delay + random.uniform(0, 0.8)
            time.sleep(sleep)

    # Déduplications par titre
    df = pd.DataFrame(all_articles)
    if df.empty:
        print("\n⚠️ Aucun article collecté.")
        return df

    before = len(df)
    df = df.drop_duplicates(subset=["title"])
    after = len(df)
    print(f"\n🗑️  Doublons supprimés : {before - after}")

    # Sauvegarder
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False, encoding="utf-8-sig")

    print(f"\n✅ {after} articles sauvegardés → {output_path}")
    print(f"\n📊 Par langue :")
    for lang, n in df["lang"].value_counts().items():
        print(f"   {lang}: {n}")
    print(f"\n📊 Par source :")
    for src, n in df["source"].value_counts().items():
        print(f"   {src:20s}: {n}")

    return df


if __name__ == "__main__":
    BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(BASE, "data", "output", "articles.csv")
    scrape_all(out)
