import requests
from bs4 import BeautifulSoup
import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)

# Target keywords for filtering (sensibilisation sevrage tabagique)
KEYWORDS = [
    "sevrage", "tabac", "cigarette", "fumeur", "nicotine", 
    "arrêt", "santé", "poumon", "cancer", "respiratoire",
    "vapotage", "e-cigarette", "dépendance", "santé publique",
    "recherche médicale", "étude scientifique"
]

SOURCES = [
    {
        "name": "Tabac Info Service",
        "url": "https://www.tabac-info-service.fr/toutes-les-actualites",
        "selectors": {
            "articles": "div.card-news",
            "title": "h3.card-title",
            "link": "a.card-link",
            "image": "img.card-img-top"
        },
        "base_url": "https://www.tabac-info-service.fr"
    },
    {
        "name": "Santé Publique France",
        "url": "https://www.santepubliquefrance.fr/recherche/#search=tabac&type=actualite",
        "selectors": {
            "articles": "article.card",
            "title": "h2.card__title",
            "link": "a.card__link",
            "image": "img.card__image"
        },
        "base_url": "https://www.santepubliquefrance.fr"
    },
    {
        "name": "OMS - Tabagisme",
        "url": "https://www.who.int/fr/news-room/fact-sheets/detail/tobacco",
        "selectors": {
            "articles": "div.content-block",
            "title": "h1.heading",
            "link": None,
            "image": None
        },
        "base_url": ""
    },
    {
        "name": "Medical News Today",
        "url": "https://www.medicalnewstoday.com/categories/smoking",
        "selectors": {
            "articles": "li.css-0", 
            "title": "h2",
            "link": "a",
            "image": "img"
        },
        "base_url": "https://www.medicalnewstoday.com"
    },
    {
        "name": "ScienceDaily",
        "url": "https://www.sciencedaily.com/news/health_medicine/smoking_cessation/",
        "selectors": {
            "articles": "div.latest-head",
            "title": "h3.latest-title",
            "link": "a",
            "image": None
        },
        "base_url": "https://www.sciencedaily.com"
    },
    {
        "name": "Truth Initiative",
        "url": "https://truthinitiative.org/news",
        "selectors": {
            "articles": "div.views-row",
            "title": "h3",
            "link": "a",
            "image": "img"
        },
        "base_url": "https://truthinitiative.org"
    },
    {
        "name": "JAMA - Tobacco Research",
        "url": "https://jamanetwork.com/searchresults?q=tobacco+cessation&c=all&ex=all",
        "selectors": {
            "articles": "div.search-result",
            "title": "h3.article-title",
            "link": "a",
            "image": None
        },
        "base_url": "https://jamanetwork.com"
    },
    {
        "name": "Ministère de la Santé (Maroc)",
        "url": "https://www.sante.gov.ma/Pages/Actualites.aspx",
        "selectors": {
            "articles": "div.ms-item",
            "title": "h4",
            "link": "a",
            "image": "img"
        },
        "base_url": "https://www.sante.gov.ma"
    }
]

def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def matches_keywords(title, content=""):
    text = (title + " " + content).lower()
    return any(kw in text for kw in KEYWORDS)

def scrape_news():
    all_articles = []
    
    for source in SOURCES:
        try:
            logger.info(f"Scraping {source['name']}...")
            response = requests.get(source['url'], timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Special handling for static WHO-like pages
            if not source['selectors']['articles']:
                title = soup.select_one(source['selectors']['title'])
                if title:
                    all_articles.append({
                        "title": clean_text(title.text),
                        "link": source['url'],
                        "source": source['name'],
                        "content": "Fiche d'information officielle de l'OMS sur le tabagisme.",
                        "image_url": None
                    })
                continue

            articles = soup.select(source['selectors']['articles'])
            for art in articles[:10]: # Limit to 10 latest per source
                title_el = art.select_one(source['selectors']['title'])
                link_el = art.select_one(source['selectors']['link']) if source['selectors']['link'] else None
                
                if not title_el:
                    continue
                
                title = clean_text(title_el.text)
                link = link_el['href'] if link_el else source['url']
                if link and not link.startswith('http'):
                    link = source['base_url'] + link
                
                # Basic content extraction if possible
                content = ""
                desc_el = art.select_one("p.card-text, div.description")
                if desc_el:
                    content = clean_text(desc_el.text)
                
                if matches_keywords(title, content):
                    img_el = art.select_one(source['selectors']['image'])
                    image_url = None
                    if img_el and img_el.get('src'):
                        image_url = img_el['src']
                        if not image_url.startswith('http'):
                            image_url = source['base_url'] + image_url

                    all_articles.append({
                        "title": title,
                        "link": link,
                        "source": source['name'],
                        "content": content,
                        "image_url": image_url
                    })
                    
        except Exception as e:
            logger.error(f"Error scraping {source['name']}: {e}")
            
    return all_articles
