import os
import json
import logging
from groq import Groq
from pydantic import ValidationError
from dotenv import load_dotenv
from discovery.schema import ExtractedScheme

load_dotenv()
logger = logging.getLogger(__name__)

# Initialize Groq client
groq_api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=groq_api_key) if groq_api_key else None

def extract_scheme_data(text: str, source_url: str) -> tuple[ExtractedScheme | None, dict | None]:
    """
    Prompts Groq LLM to extract structured scheme data from raw text.
    Returns a tuple of (ExtractedScheme, None) on success, or (None, ErrorDict) on failure.
    """
    if not client:
        logger.error("Groq API key not found. Cannot extract data.")
        return None, {"reason": "Missing GROQ_API_KEY"}

    schema_json = ExtractedScheme.schema_json()
    
    system_prompt = f"""
    You are an AI assistant that extracts government welfare scheme details into structured JSON.
    You will be given raw text scraped from a government portal.
    Extract the information into a JSON object that strictly matches the following Pydantic schema:
    {schema_json}
    
    IMPORTANT RULES:
    1. Return ONLY valid JSON. No markdown formatting, no code blocks (do not wrap in ```json), no prose.
    2. Do not hallucinate. If a field (like deadline or applyLink) is not mentioned in the text, return null.
    3. Ensure all list fields (eligibility_criteria, benefits, documents) are arrays of strings.
    """

    user_prompt = f"Source URL: {source_url}\n\nRaw Text:\n{text}"

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Or whichever model is preferred/available
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        raw_json_str = response.choices[0].message.content.strip()
        
        # Groq sometimes still returns code block formatting despite the prompt, so clean it
        if raw_json_str.startswith("```json"):
            raw_json_str = raw_json_str.replace("```json", "", 1)
        if raw_json_str.endswith("```"):
            raw_json_str = raw_json_str[:-3]
            
        parsed_json = json.loads(raw_json_str.strip())
        
        # Pydantic validation
        scheme_obj = ExtractedScheme(**parsed_json)
        return scheme_obj, None

    except ValidationError as e:
        error_details = {
            "source": source_url,
            "rawExtractedJson": raw_json_str if 'raw_json_str' in locals() else None,
            "missingFields": [err['loc'][0] for err in e.errors() if err['type'] == 'value_error.missing'],
            "invalidFields": [err['loc'][0] for err in e.errors() if err['type'] != 'value_error.missing'],
            "reason": "Pydantic validation failed"
        }
        return None, error_details
        
    except Exception as e:
        logger.error(f"LLM extraction failed for {source_url}: {e}")
        return None, {
            "source": source_url,
            "rawExtractedJson": None,
            "missingFields": [],
            "invalidFields": [],
            "reason": f"LLM or parsing error: {str(e)}"
        }
