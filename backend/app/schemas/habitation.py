from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.hazard import HazardResponse

class HabitationBase(BaseModel):
    name: str
    district: str
    state: str
    latitude: float
    longitude: float
    population: int = 0
    families: int = 0
    risk_score: float = 0.0
    risk_level: str = "LOW"
    vulnerability_score: float = 0.0
    relocation_priority: str = "NONE"

class HabitationCreate(HabitationBase):
    pass

class HabitationResponse(HabitationBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    hazards: List[HazardResponse] = []

    class Config:
        from_attributes = True
