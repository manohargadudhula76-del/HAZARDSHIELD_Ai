from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class CascadeSimulateRequest(BaseModel):
    habitation_id: int = 1
    rainfall_intensity: str = "HEAVY"
    road_status: str = "ONE_BLOCKED"
    shelter_capacity: str = "REDUCED_20"
    evacuation_status: str = "CONGESTED"


class CascadeEventItem(BaseModel):
    step: int
    title: str
    severity: str
    time_offset: str
    description: str
    risk_level_after: float


class EscalationCurveItem(BaseModel):
    time: str
    risk: float


class CascadeSimulateResponse(BaseModel):
    habitation_id: int
    habitation_name: str
    cascade_risk: float
    initial_risk: float
    risk_escalation_delta: float
    secondary_failures: int
    population_impacted: int
    evacuation_delay_minutes: int
    additional_shelter_demand: int
    events: List[CascadeEventItem]
    escalation_curve: List[EscalationCurveItem]
    engine_note: str
