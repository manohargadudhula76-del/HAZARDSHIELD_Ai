from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ScenarioSimulateRequest(BaseModel):
    habitation_id: int = 1
    rainfall_change: float = Field(0.0, ge=-50.0, le=100.0)
    population_change: float = Field(0.0, ge=-50.0, le=100.0)
    road_status: str = "OPEN"
    hospital_status: str = "AVAILABLE"
    shelter_change: float = Field(0.0, ge=-100.0, le=100.0)


class ScenarioStateMetrics(BaseModel):
    risk_score: float
    risk_level: str
    population: int
    evacuation_status: str
    hospital_status: str
    shelter_status: str


class ImpactBreakdownItem(BaseModel):
    factor: str
    delta_points: float
    status: str


class ScenarioSimulateResponse(BaseModel):
    habitation_id: int
    habitation_name: str
    district: str
    state: str
    inputs: Dict[str, Any]
    before: ScenarioStateMetrics
    after: ScenarioStateMetrics
    risk_delta: float
    percentage_change: float
    impact_breakdown: List[ImpactBreakdownItem]
    explanation: str
    engine_note: str
