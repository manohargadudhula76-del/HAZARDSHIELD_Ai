from typing import List, Optional
from pydantic import BaseModel
from app.schemas.habitation import HabitationResponse

class RecommendedSafeHaven(BaseModel):
    id: int
    name: str
    district: str
    state: str
    latitude: float
    longitude: float
    distance_km: float
    available_capacity: int
    safety_score: float
    road_access_score: float
    healthcare_score: float
    suitability_score: float
    status: Optional[str] = "AVAILABLE"
    recommendation_reasons: List[str] = []

class RelocationRecommendationResponse(BaseModel):
    habitation: HabitationResponse
    relocation_required: bool
    priority: str  # IMMEDIATE, SHORT_TERM, MEDIUM_TERM, NONE
    methodology: str = "Prototype Rule-Based Recommendation"
    recommended_safe_havens: List[RecommendedSafeHaven] = []
