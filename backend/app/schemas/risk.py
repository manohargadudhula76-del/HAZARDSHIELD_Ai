from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class RiskContributor(BaseModel):
    factor: str
    factor_key: str
    weight_percentage: int
    raw_score: float
    weighted_contribution: float
    explanation: str


class HazardProfileItem(BaseModel):
    hazard_type: str
    hazard_score: float
    severity: str
    description: Optional[str] = None


class ExplainableRiskResponse(BaseModel):
    habitation_id: int
    habitation_name: str
    district: str
    state: str
    latitude: float
    longitude: float
    population_exposed: int
    overall_risk: float
    risk_level: str
    relocation_priority: str
    contributors: List[RiskContributor]
    hazard_profile: List[HazardProfileItem]
    risk_factors: List[str]
    recommended_action: str
    engine_note: str
