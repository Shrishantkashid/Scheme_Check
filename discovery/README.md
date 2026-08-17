# Scheme Check: Discovery Engine (MVP)

This directory contains the Autonomous AI Scheme Discovery Engine, a standalone Python service that crawls government portals, parses text, and uses Groq LLMs with strict Pydantic schemas to extract scheme data into MongoDB.

## Architecture Pipeline

1. **Crawler (`crawler.py`)**: Fetches raw HTML for schemes.
2. **Parser (`parser.py`)**: Strips HTML boilerplate and extracts clean text.
3. **LLM Extractor (`extractor.py` & `schema.py`)**: Prompts Groq to convert text into a strictly validated JSON schema.
4. **Validation Logger (`db.py`)**: Any Pydantic validation failures (e.g. missing required fields) are logged to the `validation_logs` collection.
5. **Deduplication (`dedupe.py`)**: Single-source deduplication using normalized title and link. (Cross-source dedupe is stubbed for future).
6. **Confidence Scoring (`confidence.py`)**: Assigns a 0-1 confidence score based on completeness and source authority.
7. **MongoDB Writer (`db.py`)**: Upserts valid schemes to the `schemes_staging` collection and bumps version numbers on changes. Also writes a summary to `crawl_logs`.

## Setup

1. Copy `.env.example` to `.env` and fill in your `GROQ_API_KEY` and `MONGODB_URI`.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the MVP Demo

Run a single pass of the pipeline targeting MyScheme:

```bash
python discovery/run.py --source myscheme
```

### Options:
- `--limit N`: Cap the number of schemes crawled (default: 5).
- `--inject-malformed`: Injects a fake, broken HTML page to demonstrate how validation failures are gracefully caught and logged to MongoDB without crashing the script.

## Current Limitations (MVP Scope)
- Only targets a single source (MyScheme).
- Deduplication is single-source only.
- The pipeline is executed manually via CLI; the cron scheduler is not yet implemented.
- Writes to `schemes_staging` only. Promotion to the production `schemes` collection is handled separately.
