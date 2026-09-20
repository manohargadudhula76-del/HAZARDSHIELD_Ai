from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class MLPredictionInput(BaseModel):
    habitation_name: Optional[str] = Field("Rampur Village", description="Habitation Name")
    average_rainfall_mm: float = Field(..., ge=0, le=6000, description="Average annual or seasonal rainfall in mm")
    distance_from_river_km: float = Field(..., ge=0, le=100, description="Distance to nearest major river/water body in km")
    elevation_meters: float = Field(..., ge=0, le=6000, description="Terrain elevation in meters")
    population_density: float = Field(..., ge=0, le=50000, description="Population density (people/sq km)")
    historical_disaster_frequency: int = Field(..., ge=0, le=50, description="Historical disaster events count in past 10 years")
    infrastructure_score: float = Field(..., ge=0, le=100, description="Infrastructure resilience rating (0-100)")

class MLPredictionResponse(BaseModel):
    habitation_name: str
    predicted_risk_level: str
    confidence_score: float
    probability_distribution: Dict[str, float]
    primary_risk_driver: str
    secondary_risk_driver: str
    feature_contributions: Dict[str, float]
    model_version: str
    model_type: str
    engine_note: str

class MLModelMetricsResponse(BaseModel):
    model_name: str
    model_version: str
    algorithm: str
    training_date: str
    dataset_size: int
    features: List[str]
    target_classes: List[str]
    accuracy: float
    precision_macro: float
    recall_macro: float
    f1_score_macro: float
    confusion_matrix: List[List[int]]
    feature_importances: Dict[str, float]
    provenance_label: str
