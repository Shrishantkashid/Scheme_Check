from bs4 import BeautifulSoup
import re

import json

def parse_html_to_text(html: str) -> str:
    """
    Strips navigation, footer, and boilerplate from raw HTML.
    Returns cleaned text suitable for LLM extraction.
    """
    soup = BeautifulSoup(html, "html.parser")
    
    # Next.js SPA extraction (MyScheme uses this)
    next_data = soup.find("script", id="__NEXT_DATA__")
    if next_data and next_data.string:
        try:
            data = json.loads(next_data.string)
            # Dump the raw json data as text for the LLM
            text = json.dumps(data, separators=(',', ':'))
            # Clean up JSON syntax a bit so LLM reads it easier
            text = text.replace('"', ' ').replace('{', ' ').replace('}', ' ').replace('[', ' ').replace(']', ' ')
            return text[:12000]
        except:
            pass
            
    # Regular HTML parsing fallback
    for script_or_style in soup(["script", "style", "noscript", "header", "footer", "nav"]):
        script_or_style.decompose()
        
    # Attempt to find the main content area (MyScheme usually puts content in specific mains/divs)
    # If not found, fall back to body
    main_content = soup.find("main") or soup.find("div", {"id": "main-content"}) or soup.find("body")
    
    if not main_content:
        return ""
        
    text = main_content.get_text(separator="\n")
    
    # Clean up whitespace
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    cleaned_text = "\n".join(chunk for chunk in chunks if chunk)
    
    # Limit length if it's ridiculously long to save LLM tokens (unlikely for a single scheme page, but safe)
    return cleaned_text[:12000]
