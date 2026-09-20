from pydantic import BaseModel

class RedZoneBase(BaseModel):
    name: str
    state: str
    district: str
    latitude: float
    longitude: float
    radius: float = 5.0
    risk_score: float = 0.0
    risk_level: str = "CRITICAL"
    hazard_type: str
    population: int = 0
    status: str = "ACTIVE"

class RedZoneCreate(RedZoneBase):
    pass

class RedZoneResponse(RedZoneBase):
    id: int

    class Config:
        from_attributes = True
