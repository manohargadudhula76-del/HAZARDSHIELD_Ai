from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field


class DecisionSupportResponse(BaseModel):
    district_id: str = Field(..., description="Unique District Identifier")
    state: str = Field(..., description="State or Union Territory Name")
    district: str = Field(..., description="District Name")
    analytical_level: str = Field("district", description="Analytical geographic scope")

    overall_hazard_score: float = Field(..., description="Phase 3 Overall Hazard Score")
    risk_level: str = Field(..., description="Phase 3 Hazard Risk Level")

    overall_carrying_capacity_score: float = Field(..., description="Phase 4 Overall Carrying Capacity Score")
    carrying_capacity_level: str = Field(..., description="Phase 4 Carrying Capacity Level")

    overall_vulnerability_score: float = Field(..., description="Phase 5 Overall Vulnerability Score")
    vulnerability_level: str = Field(..., description="Phase 5 Vulnerability Level")

    priority_index: float = Field(..., description="Phase 5 Priority Index")
    priority_level: str = Field(..., description="Phase 5 Vulnerability Priority Level")
    priority_rank: Optional[int] = Field(None, description="Phase 5 Intervention Priority Rank (1 to 640)")

    primary_intervention: Literal[
        "IMMEDIATE_RELOCATION_ASSESSMENT",
        "HIGH_PRIORITY_MITIGATION",
        "CAPACITY_BUILDING_REQUIRED",
        "VULNERABILITY_REDUCTION",
        "MONITOR_AND_PREPARE",
        "ROUTINE_RESILIENCE_PLANNING",
    ] = Field(..., description="Primary recommended intervention strategy")

    intervention_priority_level: Literal[
        "CRITICAL_INTERVENTION",
        "HIGH_INTERVENTION",
        "MODERATE_INTERVENTION",
        "LOW_INTERVENTION",
    ] = Field(..., description="Intervention priority classification level")

    intervention_reasoning: List[str] = Field(..., description="List of bullet points explaining intervention decision")
    contributing_factors: List[str] = Field(..., description="List of contributing vulnerability/hazard factors")
    recommended_actions: List[str] = Field(..., description="List of rule-based recommended action steps")

    relocation_considered: bool = Field(..., description="Whether relocation assessment was evaluated")
    relocation_status: str = Field(..., description="Phase 6 Relocation Assessment Status")

    decision_data_completeness_score: float = Field(..., description="Combined decision data completeness score")
    decision_confidence: str = Field(..., description="Overall decision assessment confidence (HIGH, MEDIUM, LOW)")

    latitude: Optional[float] = Field(None, description="District Centroid Latitude")
    longitude: Optional[float] = Field(None, description="District Centroid Longitude")
    spatial_analysis_available: bool = Field(..., description="Whether GIS spatial coordinates are available")

    disclaimer: str = Field(..., description="Mandatory prototype analytical decision-support disclaimer notice")


class DecisionSupportSummary(BaseModel):
    total_districts_analyzed: int = Field(..., description="Total districts evaluated")
    intervention_category_distribution: Dict[str, int] = Field(..., description="Count of districts per intervention category")
    intervention_priority_distribution: Dict[str, int] = Field(..., description="Count of districts per intervention priority level")
    disclaimer: str = Field(..., description="Mandatory prototype analytical disclaimer notice")


class DecisionSupportListResponse(BaseModel):
    total_count: int = Field(..., description="Total count of decision support records returned")
    results: List[DecisionSupportResponse] = Field(..., description="List of district decision support records")
    summary: Optional[DecisionSupportSummary] = Field(None, description="Decision support summary metrics")
    disclaimer: str = Field(..., description="Mandatory prototype analytical disclaimer notice")
