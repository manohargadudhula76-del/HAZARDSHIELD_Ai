from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional


class CarryingCapacityResponse(BaseModel):
    district_id: str = Field(..., json_schema_extra={"example": "DIST_IND_001"})
    state: str = Field(..., json_schema_extra={"example": "ANDAMAN AND NICOBAR ISLANDS"})
    district: str = Field(..., json_schema_extra={"example": "NICOBARS"})
    analytical_level: str = Field("district", json_schema_extra={"example": "district"})

    population_density_capacity_score: Optional[float] = Field(None, json_schema_extra={"example": 99.85})
    housing_capacity_score: Optional[float] = Field(None, json_schema_extra={"example": 80.40})
    healthcare_capacity_score: Optional[float] = Field(None, json_schema_extra={"example": 15.20})
    education_capacity_score: Optional[float] = Field(None, json_schema_extra={"example": None})
    water_capacity_score: Optional[float] = Field(None, json_schema_extra={"example": None})
    shelter_capacity_score: Optional[float] = Field(None, json_schema_extra={"example": None})
    road_evacuation_capacity_score: Optional[float] = Field(None, json_schema_extra={"example": None})

    overall_carrying_capacity_score: float = Field(..., json_schema_extra={"example": 63.48})
    carrying_capacity_level: str = Field(..., json_schema_extra={"example": "MODERATE_CAPACITY"})

    available_sectors: List[str] = Field(..., json_schema_extra={"example": ["population_density", "housing", "healthcare"]})
    missing_sectors: List[str] = Field(..., json_schema_extra={"example": ["education", "water", "shelter", "road_evacuation"]})

    data_completeness_score: float = Field(..., json_schema_extra={"example": 0.43})
    assessment_confidence: str = Field(..., json_schema_extra={"example": "MEDIUM"})

    redistributed_weights: Dict[str, float] = Field(..., json_schema_extra={"example": {"population_density": 0.3636, "housing": 0.3636, "healthcare": 0.2727}})
    redistributed_weights_sum: float = Field(1.0, json_schema_extra={"example": 1.0})

    latitude: Optional[float] = Field(None, json_schema_extra={"example": 7.12})
    longitude: Optional[float] = Field(None, json_schema_extra={"example": 93.77})
    spatial_analysis_available: bool = Field(True, json_schema_extra={"example": True})
