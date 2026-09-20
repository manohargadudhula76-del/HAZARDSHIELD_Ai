from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field

PHASE_8_DISCLAIMER = (
    "This explainability output is a prototype analytical transparency layer based on available "
    "datasets and existing model outputs. It does not establish official causation, government policy, "
    "evacuation orders, or legally binding relocation decisions."
)


class HazardSummary(BaseModel):
    """Phase 3 Hazard Risk Summary for district explainability."""
    overall_hazard_score: float = Field(..., description="Phase 3 Overall Hazard Score (0-100)")
    risk_level: str = Field(..., description="Phase 3 Hazard Risk Level (LOW, MODERATE, HIGH, CRITICAL)")
    key_drivers: List[str] = Field(default_factory=list, description="Top analytical hazard components driving the score")
    component_scores: Dict[str, float] = Field(default_factory=dict, description="All available component hazard scores")


class CarryingCapacitySummary(BaseModel):
    """Phase 4 Carrying Capacity Summary for district explainability."""
    overall_carrying_capacity_score: float = Field(..., description="Phase 4 Overall Carrying Capacity Score (0-100)")
    carrying_capacity_level: str = Field(..., description="Phase 4 Carrying Capacity Level")
    available_sectors: List[str] = Field(default_factory=list, description="List of sectors with available data")
    missing_sectors: List[str] = Field(default_factory=list, description="List of sectors lacking district datasets")
    assessment_confidence: str = Field(..., description="Confidence rating based on sector coverage")
    sector_scores: Dict[str, float] = Field(default_factory=dict, description="Normalized available sector scores (0-100)")
    key_drivers: List[str] = Field(default_factory=list, description="Key carrying capacity strengths or critical deficits")


class VulnerabilitySummary(BaseModel):
    """Phase 5 Vulnerability Summary for district explainability."""
    overall_vulnerability_score: float = Field(..., description="Phase 5 Overall Vulnerability Score (0-100)")
    vulnerability_level: str = Field(..., description="Phase 5 Vulnerability Level")
    priority_index: float = Field(..., description="Phase 5 Priority Index (0-100)")
    priority_level: str = Field(..., description="Phase 5 Priority Level")
    priority_rank: Optional[int] = Field(None, description="National Priority Rank (1 to 640)")
    available_components: List[str] = Field(default_factory=list, description="Vulnerability components available")
    missing_components: List[str] = Field(default_factory=list, description="Vulnerability components missing")
    key_drivers: List[str] = Field(default_factory=list, description="Leading vulnerability contributors")
    component_scores: Dict[str, float] = Field(default_factory=dict, description="Component vulnerability scores")


class CandidateDestinationSummary(BaseModel):
    """Summary of top candidate destination for safe relocation."""
    district_id: str = Field(..., description="Destination District Identifier")
    district: str = Field(..., description="Destination District Name")
    state: str = Field(..., description="Destination State Name")
    distance_km: float = Field(..., description="Haversine distance from source district in km")
    suitability_score: float = Field(..., description="Composite Destination Suitability Score (0-100)")


class RelocationSummary(BaseModel):
    """Phase 6 Relocation Assessment Summary for district explainability."""
    relocation_assessment_status: str = Field(
        ...,
        description="Phase 6.1 assessment status (RECOMMENDATIONS_AVAILABLE, CROSS_STATE_RECOMMENDATION, NO_VALID_RECOMMENDATION, INSUFFICIENT_SPATIAL_DATA, or NOT_APPLICABLE)"
    )
    recommendation_scope: str = Field(..., description="Recommendation geographic scope (SAME_STATE, CROSS_STATE, NO_RECOMMENDATION, NOT_EVALUATED)")
    no_recommendation_available: bool = Field(..., description="Whether destination recommendations are unavailable")
    total_candidates_found: int = Field(0, description="Total eligible destination candidates identified")
    explanation: str = Field(..., description="Standardized Phase 6.1 analytical status explanation")
    top_destination: Optional[str] = Field(None, description="Top recommended destination district name")
    top_destination_state: Optional[str] = Field(None, description="Top recommended destination state name")
    top_suitability_score: Optional[float] = Field(None, description="Suitability score of top candidate (0-100)")
    candidate_summary: List[CandidateDestinationSummary] = Field(default_factory=list, description="Brief summaries of top candidate destinations")


class InterventionSummary(BaseModel):
    """Phase 7 Intervention Decision Summary for district explainability."""
    primary_intervention: str = Field(..., description="Phase 7 Primary Recommended Intervention Strategy")
    intervention_priority_level: str = Field(..., description="Phase 7 Intervention Priority Classification Level")
    intervention_reasoning: List[str] = Field(default_factory=list, description="Deterministic rule-based reasoning items")
    contributing_factors: List[str] = Field(default_factory=list, description="Contributing vulnerability/hazard factors")
    recommended_actions: List[str] = Field(default_factory=list, description="Actionable preparedness and mitigation steps")
    decision_confidence: str = Field(..., description="Overall decision confidence rating (HIGH, MEDIUM, LOW)")


class TopContributingFactors(BaseModel):
    """Categorized analytical contributing factors guiding the final intervention decision."""
    hazard_factors: List[str] = Field(default_factory=list, description="Analytical contributing hazard factors")
    capacity_limitations: List[str] = Field(default_factory=list, description="Analytical contributing capacity limitations")
    vulnerability_factors: List[str] = Field(default_factory=list, description="Analytical contributing vulnerability factors")
    relocation_factors: List[str] = Field(default_factory=list, description="Analytical contributing relocation factors or constraints")
    intervention_decision_factors: List[str] = Field(default_factory=list, description="Analytical contributing factors guiding final intervention")


class ScoreContributionItem(BaseModel):
    component: str = Field(..., description="Component or sector identifier")
    score: Optional[float] = Field(None, description="Normalized raw score (0-100)")
    weight: Optional[float] = Field(None, description="Effective redistributed weight applied")
    weighted_contribution: Optional[float] = Field(None, description="Score multiplied by weight (0-100 scale)")


class ComponentContributionSection(BaseModel):
    """Contribution breakdown section for an individual assessment phase."""
    contribution_available: bool = Field(..., description="Whether exact weighted contributions are mathematically derived from output weights")
    reason: Optional[str] = Field(None, description="Explanation when contribution is unavailable or how it was derived")
    weights_redistributed: bool = Field(False, description="Whether weights were dynamically redistributed for missing components")
    redistributed_weights_sum: Optional[float] = Field(None, description="Sum of effective weights applied")
    items: List[ScoreContributionItem] = Field(default_factory=list, description="Breakdown of individual component score contributions")


class ScoreContributions(BaseModel):
    """Transparent mathematical score contributions across phases."""
    vulnerability_contributions: ComponentContributionSection
    carrying_capacity_contributions: ComponentContributionSection
    hazard_contributions: ComponentContributionSection


class DataCompletenessSummary(BaseModel):
    """Cross-phase data completeness analysis."""
    overall_completeness_score: float = Field(..., description="Harmonized completeness score across phases (0.0 to 1.0)")
    hazard_completeness_score: float = Field(..., description="Phase 3 data completeness score")
    carrying_capacity_completeness_score: float = Field(..., description="Phase 4 data completeness score")
    vulnerability_completeness_score: float = Field(..., description="Phase 5 data completeness score")
    missing_hazard_data: List[str] = Field(default_factory=list, description="Missing hazard input variables")
    missing_capacity_sectors: List[str] = Field(default_factory=list, description="Carrying capacity sectors without data")
    missing_vulnerability_components: List[str] = Field(default_factory=list, description="Vulnerability components missing")


class ConfidenceSummary(BaseModel):
    """Cross-phase analytical confidence breakdown."""
    overall_decision_confidence: str = Field(..., description="Harmonized decision confidence (HIGH, MEDIUM, LOW)")
    hazard_confidence: str = Field(..., description="Phase 3 analysis confidence")
    carrying_capacity_confidence: str = Field(..., description="Phase 4 assessment confidence")
    vulnerability_confidence: str = Field(..., description="Phase 5 assessment confidence")


class SpatialDataStatus(BaseModel):
    """GIS spatial coordinate status for analytical mapping."""
    spatial_analysis_available: bool = Field(..., description="Whether GIS coordinates are available for spatial analysis")
    latitude: Optional[float] = Field(None, description="District centroid latitude")
    longitude: Optional[float] = Field(None, description="District centroid longitude")
    coordinates_present: bool = Field(..., description="Whether coordinate fields are populated and non-null")
    status_explanation: str = Field(..., description="Explanation of spatial analysis capability")


class DecisionTraceStep(BaseModel):
    """Single chronological step in the transparent decision trace."""
    step: int = Field(..., description="Chronological sequence number (1-6)")
    assessment: str = Field(..., description="Assessment name")
    result: str = Field(..., description="Concise analytical output description")
    source_phase: str = Field(..., description="Originating project phase")


class DistrictExplainabilityResponse(BaseModel):
    """Comprehensive explainability, audit and transparency report for a single district."""
    district_id: str = Field(..., description="Unique District Identifier")
    state: str = Field(..., description="State or Union Territory Name")
    district: str = Field(..., description="District Name")
    analytical_level: str = Field("district", description="Analytical geographic scope")

    hazard_summary: HazardSummary
    carrying_capacity_summary: CarryingCapacitySummary
    vulnerability_summary: VulnerabilitySummary
    relocation_summary: RelocationSummary
    intervention_summary: InterventionSummary

    top_contributing_factors: TopContributingFactors
    score_contributions: ScoreContributions

    data_completeness_summary: DataCompletenessSummary
    confidence_summary: ConfidenceSummary
    missing_data_limitations: List[str] = Field(default_factory=list, description="Explicit data constraints and limitations")
    spatial_data_status: SpatialDataStatus

    decision_trace: List[DecisionTraceStep] = Field(..., description="Chronological 6-step decision trace")
    explainability_status: Literal["COMPLETE", "PARTIAL", "LIMITED"] = Field(..., description="Overall explainability completeness rating")

    disclaimer: str = Field(PHASE_8_DISCLAIMER, description="Mandatory prototype analytical transparency disclaimer")


class ExplainabilitySummary(BaseModel):
    """Aggregate explainability summary metrics across all districts."""
    total_districts_explained: int = Field(..., description="Total districts evaluated")
    explainability_status_distribution: Dict[str, int] = Field(..., description="Count of districts per explainability status")
    priority_level_distribution: Dict[str, int] = Field(..., description="Count of districts per priority level")
    relocation_status_distribution: Dict[str, int] = Field(..., description="Count of districts per relocation status")
    disclaimer: str = Field(PHASE_8_DISCLAIMER, description="Mandatory prototype analytical transparency disclaimer")


class ExplainabilityListResponse(BaseModel):
    """Paginated or complete list of district explainability reports."""
    total_count: int = Field(..., description="Total count of explainability records returned")
    results: List[DistrictExplainabilityResponse] = Field(..., description="List of district explainability records")
    summary: Optional[ExplainabilitySummary] = Field(None, description="Aggregate explainability summary metrics")
    disclaimer: str = Field(PHASE_8_DISCLAIMER, description="Mandatory prototype analytical transparency disclaimer")
