import requests
import json
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Config
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8080")
INTERNAL_SECRET = "NeuralBotSecret2025"
CACHE_FILE = Path(__file__).parent / "posted_news_cache.json"

def load_cache():
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r') as f:
                return set(json.load(f))
        except:
            return set()
    return set()

def save_cache(cache):
    with open(CACHE_FILE, 'w') as f:
        json.dump(list(cache), f)

def post_articles(articles):
    cache = load_cache()
    posted_count = 0
    
    # We only post up to 5 new articles per session to avoid spamming the FYP
    max_to_post = 5
    
    for art in articles:
        if posted_count >= max_to_post:
            break
            
        # Check if already posted
        art_id = art['link']
        if art_id in cache:
            continue
            
        logger.info(f"Posting official news: {art['title']}")
        
        payload = {
            "content": f"### {art['title']}\n\n{art['content']}\n\nSource: {art['source']}",
            "imageUrl": art['image_url'],
            "postType": "OFFICIAL_NEWS",
            "sourceUrl": art['link'],
            "sourceLabel": art['source']
        }
        
        try:
            # Use the internal bot endpoint with secret
            url = f"{BACKEND_URL}/api/communities/social/bot/posts?secret={INTERNAL_SECRET}"
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code in (200, 201):
                logger.info(f"Successfully posted: {art['title']}")
                cache.add(art_id)
                posted_count += 1
            else:
                logger.error(f"Failed to post ({response.status_code}): {response.text}")
                
        except Exception as e:
            logger.error(f"Error calling backend: {e}")
            
    save_cache(cache)
    return posted_count

if __name__ == "__main__":
    # Test
    test_arts = [{
        "title": "Nouvelle étude sur le sevrage tabagique",
        "link": "https://example.com/test",
        "source": "NeuralConsult Lab",
        "content": "Le sport aide à arrêter de fumer.",
        "image_url": None
    }]
    post_articles(test_arts)
