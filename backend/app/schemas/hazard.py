from typing import Optional
from pydantic import BaseModel

class HazardBase(BaseModel):
    hazard_type: str
    hazard_score: float = 0.0
    severity: str = "MODERATE"
    description: Optional[str] = None

class HazardCreate(HazardBase):
    habitation_id: int

class HazardResponse(HazardBase):
    id: int
    habitation_id: int

    class Config:
        from_attributes = True
