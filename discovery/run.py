import argparse
import logging
import sys
import os
from datetime import datetime, timezone

# Add the project root to sys.path so 'discovery' module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from discovery.crawler import crawl_myscheme_listing
from discovery.parser import parse_html_to_text
from discovery.extractor import extract_scheme_data
from discovery.dedupe import dedupe_single_source, cross_source_dedupe
from discovery.db import write_validation_failure, write_crawl_log, upsert_staged_schemes

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# A deliberately malformed test payload to demonstrate validation failure without crashing
MALFORMED_HTML_TEST = """
<main>
    <h1>Fake Scheme Missing Fields</h1>
    <p>This is a scheme that will fail Pydantic validation because it intentionally lacks category, state, and other required fields.</p>
</main>
"""

def main():
    parser = argparse.ArgumentParser(description="Scheme Check Discovery Engine")
    parser.add_argument("--source", required=True, choices=["myscheme"], help="Target source portal to crawl")
    parser.add_argument("--limit", type=int, default=5, help="Maximum number of schemes to process for the demo")
    parser.add_argument("--inject-malformed", action="store_true", help="Inject a malformed HTML page to test validation logging")
    
    args = parser.parse_args()
    source = args.source
    limit = args.limit
    
    start_time = datetime.now(timezone.utc)
    logger.info(f"Starting discovery run for source: {source} with limit {limit}")
    
    # 1. Crawler
    if source == "myscheme":
        raw_pages = crawl_myscheme_listing(limit=limit)
    else:
        logger.error(f"Unsupported source: {source}")
        sys.exit(1)
        
    if args.inject_malformed:
        raw_pages["https://www.myscheme.gov.in/schemes/fake-malformed-test"] = MALFORMED_HTML_TEST
        
    pages_found = len(raw_pages)
    pages_processed = 0
    succeeded = 0
    failed = 0
    extracted_schemes = []
    
    # Process each page
    for url, html in raw_pages.items():
        pages_processed += 1
        logger.info(f"Processing ({pages_processed}/{pages_found}): {url}")
        
        # 2. Parser
        text = parse_html_to_text(html)
        if not text:
            logger.warning(f"No text extracted from {url}. Skipping.")
            failed += 1
            continue
            
        # 3 & 4. LLM Extraction & Validation
        scheme_obj, error_details = extract_scheme_data(text, url)
        
        if error_details:
            write_validation_failure(error_details)
            logger.warning(f"Validation failed for {url}. Logged to validation_logs.")
            failed += 1
        elif scheme_obj:
            extracted_schemes.append(scheme_obj)
            succeeded += 1
            
    # 6. Dedupe
    logger.info("Running single-source deduplication...")
    deduped_schemes = dedupe_single_source(extracted_schemes)
    
    # TODO: cross-source dedupe
    # For future: cross_source_dedupe(scheme, existing_schemes)
    
    # 7. Write to Staging
    logger.info(f"Upserting {len(deduped_schemes)} validated schemes to staging...")
    inserted, updated = upsert_staged_schemes(deduped_schemes, source)
    
    end_time = datetime.now(timezone.utc)
    
    # Log the run
    log_data = {
        "source": source,
        "startTime": start_time,
        "endTime": end_time,
        "pagesFound": pages_found,
        "pagesProcessed": pages_processed,
        "succeeded": succeeded,
        "failed": failed,
        "inserted": inserted,
        "updated": updated
    }
    
    write_crawl_log(log_data)
    
    # Print summary
    logger.info("=== DISCOVERY RUN COMPLETE ===")
    for k, v in log_data.items():
        logger.info(f"{k}: {v}")
        
    # TODO: scheduler
    # In the future, this script will be wrapped in a scheduler daemon (e.g. `schedule.every().day.at("02:00").do(main)`)
    # that runs indefinitely in the background.

if __name__ == "__main__":
    main()
