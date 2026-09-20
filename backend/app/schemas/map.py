from typing import List, Optional
from pydantic import BaseModel

class MapLocationItem(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    risk_score: float
    risk_level: str
    population: int = 0
    type: str  # "habitation", "red_zone", "safe_haven"
    district: Optional[str] = None
    state: Optional[str] = None
    hazard_type: Optional[str] = None
    radius: Optional[float] = None
    relocation_priority: Optional[str] = None
    total_capacity: Optional[int] = None
    occupied_capacity: Optional[int] = None
    available_capacity: Optional[int] = None
    safety_score: Optional[float] = None
    road_access_score: Optional[float] = None
    healthcare_score: Optional[float] = None
    suitability_score: Optional[float] = None
    status: Optional[str] = None

class MapLocationsResponse(BaseModel):
    habitations: List[MapLocationItem] = []
    red_zones: List[MapLocationItem] = []
    safe_havens: List[MapLocationItem] = []
