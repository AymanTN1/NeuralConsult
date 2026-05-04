from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.news_scraper import scrape_news
from app.news_poster import post_articles
import logging
import threading

logger = logging.getLogger(__name__)

# Singleton scheduler
scheduler = BackgroundScheduler()

def run_news_pipeline():
    """Main job: scrape and post"""
    logger.info("Starting News Pipeline (Scrape -> Post)")
    try:
        articles = scrape_news()
        logger.info(f"Scraped {len(articles)} articles.")
        
        count = post_articles(articles)
        logger.info(f"Posted {count} new articles to community feed.")
    except Exception as e:
        logger.error(f"Error in news pipeline: {e}")

def start_scheduler():
    if not scheduler.running:
        # Schedule every day at 8:00 AM
        scheduler.add_job(
            run_news_pipeline,
            CronTrigger(hour=8, minute=0),
            id="daily_news_job",
            replace_existing=True
        )
        scheduler.start()
        logger.info("News Bot Scheduler started (Daily at 8:00 AM).")

def trigger_manually():
    """Run in a background thread to not block FastAPI"""
    thread = threading.Thread(target=run_news_pipeline)
    thread.start()
    return {"status": "started", "message": "Scraper is running in background."}
