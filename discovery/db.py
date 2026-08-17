import os
import logging
from datetime import datetime, timezone
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv
from discovery.schema import ExtractedScheme, StagedScheme
from discovery.confidence import calculate_confidence

load_dotenv()
logger = logging.getLogger(__name__)

# Use MONGODB_URI from .env
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/schemes_check")
client = MongoClient(MONGODB_URI)
db = client.get_database()

staging_coll = db.schemes_staging
crawl_logs_coll = db.crawl_logs
validation_logs_coll = db.validation_logs

def write_validation_failure(error_details: dict):
    """Writes a validation failure to validation_logs collection."""
    error_details["timestamp"] = datetime.now(timezone.utc)
    try:
        validation_logs_coll.insert_one(error_details)
    except Exception as e:
        logger.error(f"Failed to write validation log: {e}")

def write_crawl_log(log_data: dict):
    """Writes the final run summary to crawl_logs collection."""
    try:
        crawl_logs_coll.insert_one(log_data)
    except Exception as e:
        logger.error(f"Failed to write crawl log: {e}")

def upsert_staged_schemes(schemes: list[ExtractedScheme], source_name: str) -> tuple[int, int]:
    """
    Writes valid schemes to schemes_staging.
    Upserts on source + title. Bumps version on changes.
    Returns (inserted_count, updated_count).
    """
    inserted = 0
    updated = 0
    now = datetime.now(timezone.utc)
    
    for scheme in schemes:
        confidence = calculate_confidence(scheme)
        
        # Build the document
        scheme_dict = scheme.model_dump()
        # Convert HttpUrl to string for Mongo
        if scheme_dict.get('applyLink'):
            scheme_dict['applyLink'] = str(scheme_dict['applyLink'])
            
        scheme_dict["source"] = source_name
        scheme_dict["confidence"] = confidence
        scheme_dict["lastVerified"] = now
        
        query = {"source": source_name, "title": scheme.title}
        
        try:
            existing = staging_coll.find_one(query)
            
            if existing:
                # Check if data actually changed (ignoring metadata fields)
                changed = False
                for k, v in scheme_dict.items():
                    if k not in ["lastVerified", "lastUpdated", "version", "source", "confidence"]:
                        if existing.get(k) != v:
                            changed = True
                            break
                            
                if changed:
                    scheme_dict["version"] = existing.get("version", 1) + 1
                    scheme_dict["lastUpdated"] = now
                    staging_coll.update_one(query, {"$set": scheme_dict})
                    updated += 1
                else:
                    # Just update the lastVerified timestamp
                    staging_coll.update_one(query, {"$set": {"lastVerified": now}})
            else:
                # New scheme
                scheme_dict["version"] = 1
                scheme_dict["lastUpdated"] = now
                staging_coll.insert_one(scheme_dict)
                inserted += 1
                
        except Exception as e:
            logger.error(f"Failed to upsert scheme '{scheme.title}': {e}")
            
    return inserted, updated
