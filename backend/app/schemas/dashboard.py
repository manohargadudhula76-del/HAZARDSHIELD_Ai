from typing import Optional
from pydantic import BaseModel

class DashboardSummaryResponse(BaseModel):
    critical_red_zones: int
    population_at_risk: int
    capacity_exceeded: int
    immediate_relocation: int
    immediate_relocation_habitations: Optional[int] = None
    immediate_relocation_people: Optional[int] = None
    high_risk_habitations: int
    safe_habitations: int
    active_alerts: int
    total_habitations: int
    total_safe_havens: int
    total_red_zones: int
    data_source: str = "Prototype Database (Rule-Based Aggregation)"
