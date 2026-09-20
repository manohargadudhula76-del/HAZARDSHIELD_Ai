from typing import List, Dict, Optional
from pydantic import BaseModel, Field

PHASE_10_DISCLAIMER = (
    "HazardShield AI is an analytical research and decision-support prototype. "
    "It does not constitute an official government evacuation order, relocation order, "
    "or disaster management directive. All outputs must be validated by relevant "
    "disaster management authorities."
)


class DistrictIdentitySection(BaseModel):
    """District identification and spatial status."""
    district_id: str = Field(..., description="Unique District Identifier (e.g., DIST_IND_345)")
    state: str = Field(..., description="State or Union Territory name")
    district: str = Field(..., description="District Name")
    analytical_level: str = Field("district", description="Analytical aggregation level")
    latitude: Optional[float] = Field(None, description="District centroid latitude coordinate")
    longitude: Optional[float] = Field(None, description="District centroid longitude coordinate")
    spatial_analysis_available: bool = Field(..., description="True if valid GPS coordinates are present")


class DossierHazardSection(BaseModel):
    """Phase 3 Hazard Assessment Summary."""
    overall_hazard_score: float = Field(..., description="Normalized composite hazard score (0-100)")
    risk_level: str = Field(..., description="Hazard risk level (LOW, MODERATE, HIGH, CRITICAL)")
    flood_risk_score: Optional[float] = Field(None, description="Flood risk score (0-100)")
    landslide_risk_score: Optional[float] = Field(None, description="Landslide risk score (0-100)")
    cyclone_risk_score: Optional[float] = Field(None, description="Cyclone risk score (0-100)")
    rainfall_risk_score: Optional[float] = Field(None, description="Rainfall risk score (0-100)")
    population_exposure_score: Optional[float] = Field(None, description="Population exposure score (0-100)")
    housing_vulnerability_score: Optional[float] = Field(None, description="Housing vulnerability score (0-100)")
    infrastructure_risk_score: Optional[float] = Field(None, description="Infrastructure risk score (0-100)")
    analysis_confidence: str = Field("MEDIUM", description="Hazard analysis confidence rating")
    key_hazard_drivers: List[str] = Field(default_factory=list, description="Leading hazard driver descriptions")


class DossierCapacitySection(BaseModel):
    """Phase 4 Carrying Capacity Assessment Summary."""
    overall_carrying_capacity_score: float = Field(..., description="Composite carrying capacity score (0-100)")
    carrying_capacity_level: str = Field(..., description="Capacity classification level")
    available_sectors: List[str] = Field(default_factory=list, description="Sectors with empirical data")
    missing_sectors: List[str] = Field(default_factory=list, description="Sectors lacking empirical data")
    sector_scores: Dict[str, float] = Field(default_factory=dict, description="Sector capacity scores")
    assessment_confidence: str = Field("MEDIUM", description="Carrying capacity confidence rating")
    capacity_drivers: List[str] = Field(default_factory=list, description="Key carrying capacity driver descriptions")


class DossierVulnerabilitySection(BaseModel):
    """Phase 5 Vulnerability & Priority Assessment Summary."""
    overall_vulnerability_score: float = Field(..., description="Composite vulnerability score (0-100)")
    vulnerability_level: str = Field(..., description="Vulnerability classification level")
    priority_index: float = Field(..., description="Phase 5.2 National Priority Index (0-100)")
    priority_level: str = Field(..., description="Priority tier (CRITICAL_PRIORITY, HIGH_PRIORITY, etc.)")
    priority_rank: Optional[int] = Field(None, description="Strict 1-to-640 national priority ranking")
    available_components: List[str] = Field(default_factory=list, description="Evaluated vulnerability components")
    missing_components: List[str] = Field(default_factory=list, description="Missing vulnerability components")
    component_scores: Dict[str, float] = Field(default_factory=dict, description="Component vulnerability scores")
    vulnerability_drivers: List[str] = Field(default_factory=list, description="Leading vulnerability driver descriptions")


class DossierCandidateDestination(BaseModel):
    """Safe destination candidate for relocation."""
    district_id: str = Field(..., description="Destination District Identifier")
    district: str = Field(..., description="Destination District Name")
    state: str = Field(..., description="Destination State Name")
    distance_km: float = Field(..., description="Geodesic distance in kilometers")
    suitability_score: float = Field(..., description="Suitability score (0-100)")


class DossierRelocationSection(BaseModel):
    """Phase 6 Safe Relocation Recommendation Summary."""
    relocation_assessment_status: str = Field(..., description="Relocation screening status")
    recommendation_scope: str = Field(..., description="Geographic recommendation scope")
    no_recommendation_available: bool = Field(..., description="Whether recommendations are unavailable")
    total_candidates_found: int = Field(0, description="Count of viable destination candidates")
    explanation: str = Field(..., description="Contextual explanation for relocation assessment")
    top_destination: Optional[str] = Field(None, description="Top recommended destination district name")
    top_destination_state: Optional[str] = Field(None, description="Top recommended destination state name")
    top_suitability_score: Optional[float] = Field(None, description="Top candidate suitability score")
    candidate_destinations: List[DossierCandidateDestination] = Field(default_factory=list, description="Top candidates")


class DossierDecisionSection(BaseModel):
    """Phase 7 Decision Support & Intervention Summary."""
    primary_intervention: str = Field(..., description="Assigned primary intervention pathway")
    intervention_priority_level: str = Field(..., description="Intervention urgency classification")
    recommended_actions: List[str] = Field(default_factory=list, description="Concrete policy and engineering actions")
    contributing_factors: List[str] = Field(default_factory=list, description="Core analytical factors triggering intervention")
    intervention_reasoning: List[str] = Field(default_factory=list, description="Deterministic rule-based rationale")


class DossierExplainabilitySection(BaseModel):
    """Phase 8 Decision Explainability & Audit Summary."""
    decision_data_completeness_score: float = Field(..., description="Data completeness ratio (0-1)")
    decision_confidence: str = Field(..., description="Overall decision confidence rating")
    explainability_audit_status: str = Field(..., description="Explainability audit completeness rating")
    concise_reasoning_summary: List[str] = Field(default_factory=list, description="Multi-stage reasoning summary")


class DistrictDossierResponse(BaseModel):
    """Unified District Executive Dossier response model."""
    identity: DistrictIdentitySection
    hazard: DossierHazardSection
    carrying_capacity: DossierCapacitySection
    vulnerability: DossierVulnerabilitySection
    relocation: DossierRelocationSection
    decision_support: DossierDecisionSection
    explainability: DossierExplainabilitySection
    disclaimer: str = Field(PHASE_10_DISCLAIMER, description="Mandatory prototype disclaimer")


class TopPriorityDistrictSummary(BaseModel):
    """Summary of high/critical priority district for executive briefings."""
    district_id: str = Field(..., description="District Identifier")
    district: str = Field(..., description="District Name")
    state: str = Field(..., description="State Name")
    priority_index: float = Field(..., description="National priority index")
    priority_level: str = Field(..., description="Priority classification level")
    priority_rank: Optional[int] = Field(None, description="National priority rank (1-640)")
    overall_hazard_score: float = Field(..., description="Overall hazard score")
    overall_vulnerability_score: float = Field(..., description="Overall vulnerability score")
    primary_intervention: str = Field(..., description="Primary intervention pathway")
    intervention_priority_level: str = Field(..., description="Intervention priority level")


class SystemHealthReadinessSummary(BaseModel):
    """System health and readiness summary from Phase 9."""
    overall_system_status: str = Field(..., description="Overall system health status (e.g. HEALTHY)")
    prototype_readiness_level: str = Field(..., description="Readiness classification level")
    prototype_readiness_score: float = Field(..., description="Readiness numerical score (0-100)")
    healthy_components: int = Field(..., description="Count of healthy components")
    total_components: int = Field(..., description="Total evaluated components")
    diagnostics_summary: List[str] = Field(default_factory=list, description="Key system diagnostics notes")


class NationalBriefingResponse(BaseModel):
    """National Executive Briefing response model."""
    total_districts_analyzed: int = Field(..., description="Total districts evaluated nationwide")
    hazard_risk_distribution: Dict[str, int] = Field(..., description="Distribution of hazard risk levels")
    vulnerability_distribution: Dict[str, int] = Field(..., description="Distribution of vulnerability levels")
    priority_distribution: Dict[str, int] = Field(..., description="Distribution of priority tiers")
    intervention_distribution: Dict[str, int] = Field(..., description="Distribution of primary intervention pathways")
    critical_priority_districts_count: int = Field(..., description="Count of CRITICAL_PRIORITY districts")
    high_priority_districts_count: int = Field(..., description="Count of HIGH_PRIORITY districts")
    relocation_category_distribution: Dict[str, int] = Field(..., description="Distribution of relocation assessment categories")
    system_health: SystemHealthReadinessSummary
    top_intervention_priority_districts: List[TopPriorityDistrictSummary] = Field(default_factory=list, description="Top priority districts nationally")
    disclaimer: str = Field(PHASE_10_DISCLAIMER, description="Mandatory prototype disclaimer")


class StateBriefingResponse(BaseModel):
    """State Executive Briefing response model."""
    state: str = Field(..., description="State Name")
    total_districts: int = Field(..., description="Total districts in the state")
    hazard_distribution: Dict[str, int] = Field(..., description="Distribution of hazard risk levels in the state")
    vulnerability_distribution: Dict[str, int] = Field(..., description="Distribution of vulnerability levels in the state")
    priority_distribution: Dict[str, int] = Field(..., description="Distribution of priority tiers in the state")
    intervention_distribution: Dict[str, int] = Field(..., description="Distribution of intervention pathways in the state")
    critical_priority_count: int = Field(..., description="Count of CRITICAL_PRIORITY districts in the state")
    high_priority_count: int = Field(..., description="Count of HIGH_PRIORITY districts in the state")
    relocation_category_summary: Dict[str, int] = Field(..., description="Distribution of relocation categories in the state")
    top_priority_districts: List[TopPriorityDistrictSummary] = Field(default_factory=list, description="Top priority districts in this state")
    disclaimer: str = Field(PHASE_10_DISCLAIMER, description="Mandatory prototype disclaimer")


class DossierExportDistrictItem(BaseModel):
    """Standardized multi-indicator record for data export."""
    district_id: str = Field(..., description="District Identifier")
    state: str = Field(..., description="State Name")
    district: str = Field(..., description="District Name")
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")
    overall_hazard_score: float = Field(..., description="Overall hazard score")
    risk_level: str = Field(..., description="Hazard risk level")
    overall_carrying_capacity_score: float = Field(..., description="Carrying capacity score")
    overall_vulnerability_score: float = Field(..., description="Vulnerability score")
    vulnerability_level: str = Field(..., description="Vulnerability level")
    priority_index: float = Field(..., description="Priority index")
    priority_level: str = Field(..., description="Priority level")
    priority_rank: Optional[int] = Field(None, description="Priority rank (1-640)")
    primary_intervention: str = Field(..., description="Primary intervention pathway")
    intervention_priority_level: str = Field(..., description="Intervention priority level")
    relocation_assessment_status: str = Field(..., description="Relocation assessment status")
    spatial_analysis_available: bool = Field(..., description="Spatial coordinates availability")


class DossierExportSummaryResponse(BaseModel):
    """JSON summary data export response model."""
    total_districts: int = Field(..., description="Total districts exported")
    exported_at: str = Field(..., description="ISO 8601 export timestamp")
    districts: List[DossierExportDistrictItem] = Field(..., description="All district export records")
    disclaimer: str = Field(PHASE_10_DISCLAIMER, description="Mandatory prototype disclaimer")


class GeoJSONPointGeometry(BaseModel):
    """GeoJSON Point geometry object."""
    type: str = Field("Point", description="GeoJSON geometry type")
    coordinates: List[float] = Field(..., description="Coordinates array in [longitude, latitude] order")


class GeoJSONDistrictProperties(BaseModel):
    """GeoJSON Feature properties for district analysis."""
    district_id: str = Field(..., description="District Identifier")
    state: str = Field(..., description="State Name")
    district: str = Field(..., description="District Name")
    overall_hazard_score: float = Field(..., description="Overall hazard score")
    risk_level: str = Field(..., description="Hazard risk level")
    overall_carrying_capacity_score: float = Field(..., description="Carrying capacity score")
    overall_vulnerability_score: float = Field(..., description="Vulnerability score")
    vulnerability_level: str = Field(..., description="Vulnerability level")
    priority_index: float = Field(..., description="Priority index")
    priority_level: str = Field(..., description="Priority level")
    primary_intervention: str = Field(..., description="Primary intervention pathway")
    intervention_priority_level: str = Field(..., description="Intervention priority level")


class GeoJSONDistrictFeature(BaseModel):
    """GeoJSON Feature object."""
    type: str = Field("Feature", description="GeoJSON type")
    geometry: GeoJSONPointGeometry
    properties: GeoJSONDistrictProperties


class GeoJSONFeatureCollectionMetadata(BaseModel):
    """Metadata for GeoJSON export."""
    total_districts: int = Field(..., description="Total evaluated districts")
    features_count: int = Field(..., description="Count of features included with coordinates")
    excluded_missing_coordinates_count: int = Field(..., description="Count of districts excluded due to missing coordinates")
    coordinate_reference_system: str = Field("urn:ogc:def:crs:OGC:1.3:CRS84", description="CRS identifier")
    exported_at: str = Field(..., description="ISO 8601 export timestamp")


class GeoJSONExportResponse(BaseModel):
    """GeoJSON FeatureCollection export response model."""
    type: str = Field("FeatureCollection", description="GeoJSON type")
    metadata: GeoJSONFeatureCollectionMetadata
    features: List[GeoJSONDistrictFeature] = Field(..., description="Array of GeoJSON point features")
    disclaimer: str = Field(PHASE_10_DISCLAIMER, description="Mandatory prototype disclaimer")
