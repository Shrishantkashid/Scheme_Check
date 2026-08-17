from discovery.schema import ExtractedScheme

def calculate_confidence(scheme: ExtractedScheme) -> float:
    """
    v1 Confidence Scoring Heuristic.
    This can be replaced with a learned model or more complex algorithm later.
    
    Base score is determined by the proportion of fields that are populated.
    Penalties are applied for suspicious or missing official links.
    Returns a score between 0.0 and 1.0.
    """
    fields_to_check = [
        scheme.title,
        scheme.category,
        scheme.state,
        scheme.eligibility_criteria,
        scheme.benefits,
        scheme.documents,
        scheme.procedure
    ]
    
    # Calculate how many fields have content (not empty strings or empty lists)
    populated = 0
    for field in fields_to_check:
        if isinstance(field, list):
            if len(field) > 0:
                populated += 1
        elif isinstance(field, str):
            if field.strip():
                populated += 1
                
    base_score = populated / len(fields_to_check)
    
    # Check official link
    penalty = 0.0
    if not scheme.applyLink:
        penalty += 0.2  # Missing link penalty
    else:
        url = str(scheme.applyLink).lower()
        if not (".gov.in" in url or ".nic.in" in url or "karnataka.gov.in" in url):
            penalty += 0.3  # Non-government domain penalty
            
    final_score = max(0.0, base_score - penalty)
    return round(final_score, 2)
