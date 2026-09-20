from pydantic import BaseModel

class SafeHavenBase(BaseModel):
    name: str
    district: str
    state: str
    latitude: float
    longitude: float
    total_capacity: int = 0
    occupied_capacity: int = 0
    available_capacity: int = 0
    safety_score: float = 0.0
    road_access_score: float = 0.0
    healthcare_score: float = 0.0
    suitability_score: float = 0.0
    status: str = "AVAILABLE"

class SafeHavenCreate(SafeHavenBase):
    pass

class SafeHavenResponse(SafeHavenBase):
    id: int

    class Config:
        from_attributes = True
