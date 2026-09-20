import os

schemas = {}

schemas['gis.py'] = """from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class RouteRequest(BaseModel):
    start_latitude: float = Field(..., ge=-90.0, le=90.0)
    start_longitude: float = Field(..., ge=-180.0, le=180.0)
    end_latitude: float = Field(..., ge=-90.0, le=90.0)
    end_longitude: float = Field(..., ge=-180.0, le=180.0)
    is_closed: Optional[bool] = False
    avoid_road: Optional[str] = None


class GeoJSONGeometry(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]]


class RouteResponse(BaseModel):
    distance_km: float
    duration_minutes: float
    status: str
    is_detour: bool
    road_condition: str
    closure_reason: Optional[str] = None
    geometry: GeoJSONGeometry
    source: str
"""

schemas['risk.py'] = """from pydantic import BaseModel
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
"""

schemas['scenario.py'] = """from pydantic import BaseModel, Field
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
"""

schemas['evacuation.py'] = """from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.schemas.gis import GeoJSONGeometry


class EvacuationRouteItem(BaseModel):
    route_id: str
    route_name: str
    origin: str
    destination: str
    destination_id: int
    destination_type: str
    distance_km: float
    duration_minutes: float
    status: str
    is_closed: bool
    road_condition: str
    geometry: GeoJSONGeometry
    source: str


class EvacuationImpactSummary(BaseModel):
    active_routes_count: int
    detour_required: bool
    additional_distance_km: float
    additional_time_minutes: float
    primary_haven_name: str
    primary_available_capacity: int
    recommendation: str


class EvacuationNetworkResponse(BaseModel):
    habitation_id: int
    habitation_name: str
    district: str
    state: str
    origin_coordinates: List[float]
    population_affected: int
    road_closure_active: bool
    closed_segment_name: Optional[str] = None
    routes: List[EvacuationRouteItem]
    impact_summary: EvacuationImpactSummary
"""

schemas['cascade.py'] = """from pydantic import BaseModel
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
"""

schemas['analytics.py'] = """from pydantic import BaseModel
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
"""

schemas['alert.py'] = """from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class AlertResponse(BaseModel):
    id: str
    title: str
    severity: str
    type: str
    location: str
    population_affected: int
    message: str
    timestamp: str
    status: str
    action_required: str


class AlertActionResponse(BaseModel):
    status: str
    alert_id: str
    message: str
"""

os.makedirs('app/schemas', exist_ok=True)
for filename, code in schemas.items():
    path = os.path.join('app', 'schemas', filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code.strip() + '\n')
    print(f'Wrote {path}')