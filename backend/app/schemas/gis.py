from pydantic import BaseModel, Field
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
