from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class RiskDistributionItem(BaseModel):
    name: str
    count: int
    percentage: float
    color: str


class StateAnalyticsItem(BaseModel):
    state: str
    habitations_count: int
    population: int


class HazardFrequencyItem(BaseModel):
    hazard: str
    frequency: int


class AnalyticsOverviewResponse(BaseModel):
    total_habitations: int
    total_red_zones: int
    total_safe_havens: int
    total_capacity_zones: int
    population_at_risk: int
    immediate_relocation_population: int
    risk_distribution: List[RiskDistributionItem]
    state_analytics: List[StateAnalyticsItem]
    hazard_frequency: List[HazardFrequencyItem]
    timestamp: str
    data_source: str
