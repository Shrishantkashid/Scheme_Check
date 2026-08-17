from typing import List, Dict
from discovery.schema import ExtractedScheme
import re

def normalize_string(s: str) -> str:
    """Lowercases and removes special characters for normalization."""
    if not s:
        return ""
    s = s.lower()
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

def dedupe_single_source(schemes: List[ExtractedScheme]) -> List[ExtractedScheme]:
    """
    Dedupes schemes within a single source run based on normalized title and applyLink.
    """
    seen = set()
    unique_schemes = []
    
    for scheme in schemes:
        norm_title = normalize_string(scheme.title)
        link = str(scheme.applyLink) if scheme.applyLink else ""
        
        # Unique identifier for this run
        identifier = f"{norm_title}|{link}"
        
        if identifier not in seen:
            seen.add(identifier)
            unique_schemes.append(scheme)
            
    return unique_schemes

def cross_source_dedupe(new_scheme: ExtractedScheme, existing_schemes: List[ExtractedScheme]) -> bool:
    """
    TODO: Implement cross-source deduplication (e.g. against Seva Sindhu).
    Will use Algorithm 2 (token-set similarity on name and dept) in a future iteration.
    Currently stubbed to return False (no duplicate found).
    """
    return False
