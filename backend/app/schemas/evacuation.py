from pydantic import BaseModel
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
