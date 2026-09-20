from pydantic import BaseModel

class CarryingCapacityBase(BaseModel):
    location_name: str
    state: str
    district: str
    latitude: float
    longitude: float
    total_capacity: int = 0
    occupied_capacity: int = 0
    available_capacity: int = 0
    housing_capacity: int = 0
    water_capacity: int = 0
    healthcare_capacity: int = 0
    shelter_capacity: int = 0
    capacity_score: float = 0.0
    status: str = "SUFFICIENT"

class CarryingCapacityCreate(CarryingCapacityBase):
    pass

class CarryingCapacityResponse(CarryingCapacityBase):
    id: int

    class Config:
        from_attributes = True

CapacityResponse = CarryingCapacityResponse
