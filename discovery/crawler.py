import requests
from bs4 import BeautifulSoup
import time
import random
import logging
import urllib.robotparser

logger = logging.getLogger(__name__)

MYSCHEME_BASE_URL = "https://www.myscheme.gov.in"

DEMO_URLS = [
    f"{MYSCHEME_BASE_URL}/schemes/dummy-valid-scheme",
    f"{MYSCHEME_BASE_URL}/schemes/pmkmy",
    f"{MYSCHEME_BASE_URL}/schemes/pmsym",
]

def check_robots(url: str, user_agent: str) -> bool:
    """Checks robots.txt for the given URL to see if crawling is allowed."""
    try:
        parsed_url = urllib.parse.urlparse(url)
        robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
        
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(robots_url)
        rp.read()
        return rp.can_fetch(user_agent, url)
    except Exception as e:
        logger.warning(f"Could not parse robots.txt for {url}: {e}")
        return True # Default to True if robots.txt is unavailable or unparseable

def fetch_html(url: str) -> str:
    """Fetches raw HTML for a given URL, with jitter, backoff, and robots.txt check."""
    user_agent = "SchemeCheck-Bot/1.0 (educational project; contact: admin@schemecheck.com)"
    
    if not check_robots(url, user_agent):
        logger.warning(f"Crawling disallowed by robots.txt for: {url}")
        return ""
        
    logger.info(f"Crawling {url}...")
    headers = {
        "User-Agent": user_agent
    }
    
    # Jitter delay (1.5 - 3.5 seconds)
    jitter = random.uniform(1.5, 3.5)
    time.sleep(jitter)
    
    max_retries = 3
    base_backoff = 2
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code in [429, 403]:
                # Exponential backoff
                wait_time = base_backoff ** (attempt + 1)
                logger.warning(f"Received {response.status_code} on {url}. Backing off for {wait_time}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(wait_time)
                continue
                
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            break
            
    return ""

def crawl_myscheme_listing(limit: int = 15) -> dict[str, str]:
    """
    Crawls the MyScheme portal and returns a dict of {url: raw_html}.
    For the MVP, we use a predefined list of top schemes to guarantee consistent demo results,
    but in a real implementation this would parse the sitemap or listing pages.
    """
    urls_to_fetch = DEMO_URLS[:limit]
    results = {}
    
    for url in urls_to_fetch:
        html = fetch_html(url)
        if html:
            results[url] = html
            
    return results
