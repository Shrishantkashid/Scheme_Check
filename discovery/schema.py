from pydantic import BaseModel, HttpUrl, Field
from typing import List, Literal, Optional
from datetime import datetime

class Eligibility(BaseModel):
    ageMin: int = Field(0, description="Minimum age requirement (0 if none)")
    ageMax: int = Field(200, description="Maximum age requirement (200 if none)")
    gender: List[Literal['male', 'female', 'other', 'all']] = Field(['all'], description="Gender requirements")
    incomeMax: Optional[float] = Field(None, description="Maximum allowed annual income (null if none)")
    occupations: List[Literal['farmer', 'student', 'daily_wage', 'self_employed', 'unemployed', 'artisan', 'all']] = Field(['all'], description="Target occupations")
    castes: List[Literal['general', 'obc', 'sc', 'st', 'all']] = Field(['all'], description="Target caste categories")
    isBPLRequired: bool = Field(False, description="Is Below Poverty Line (BPL) status required?")
    isDisabilityRequired: bool = Field(False, description="Is disability status required?")
    landSizeMax: Optional[float] = Field(None, description="Maximum land size in hectares (null if none)")
    residence: Literal['rural', 'urban', 'all'] = Field('all', description="Residence requirement")

class ExtractedScheme(BaseModel):
    """
    Schema for LLM to extract from raw HTML text.
    Aligned with backend/models/Scheme.js field names where applicable.
    """
    title: str = Field(..., description="Name of the government scheme")
    category: str = Field(..., description="Target demographic or sector (e.g. farmer, student, women, self-employed, general)")
    state: Literal["Central", "Karnataka"] = Field(..., description="Is this a Central government or Karnataka state scheme?")
    eligibility: Eligibility = Field(..., description="Granular eligibility requirements")
    eligibility_criteria: List[str] = Field(default_factory=list, description="List of specific eligibility requirements (raw strings)")
    benefits: List[str] = Field(default_factory=list, description="List of benefits provided by the scheme")
    documents: List[str] = Field(default_factory=list, description="List of required documents for application")
    procedure: str = Field("", description="Application process or procedure")
    applyLink: Optional[HttpUrl] = Field(None, description="Official link to apply or read more")
    deadline: Optional[str] = Field(None, description="Application deadline if mentioned in the text")

class StagedScheme(ExtractedScheme):
    """
    Schema for the final record written to schemes_staging in MongoDB.
    Includes metadata like source, versioning, and confidence scoring.
    """
    source: str
    lastVerified: datetime
    lastUpdated: datetime
    version: int
    confidence: float
