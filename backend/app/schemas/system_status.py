from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field

PHASE_9_DISCLAIMER = (
    "HazardShield AI Phase 9 is an analytical system integration, quality verification, and "
    "research prototype monitoring layer. It does not certify official government readiness, "
    "statutory compliance, evacuation orders, or operational disaster deployment authority."
)


class ComponentStatus(BaseModel):
    """Status evaluation of an individual subsystem component."""
    component_name: str = Field(..., description="Name of the subsystem component")
    component_available: bool = Field(..., description="Whether the component initialized and is available")
    component_status: Literal["HEALTHY", "DEGRADED", "UNAVAILABLE"] = Field(..., description="Operational status")
    records_analyzed: Optional[int] = Field(None, description="Number of district records or entities analyzed")
    validation_message: str = Field(..., description="Detailed analytical status summary")
    issues: List[str] = Field(default_factory=list, description="Any identified non-critical or operational notices")


class IntegrationCheck(BaseModel):
    """Validation check verifying cross-phase data integrity and consistency."""
    check_id: str = Field(..., description="Unique check identifier")
    source_phase: str = Field(..., description="Originating phase providing source data")
    target_phase: str = Field(..., description="Downstream phase consuming source data")
    description: str = Field(..., description="Purpose and rule evaluated by the check")
    passed: bool = Field(..., description="Whether cross-phase consistency holds true")
    records_checked: int = Field(..., description="Total records evaluated under this rule")
    discrepancy_count: int = Field(..., description="Number of inconsistent records identified")
    details: str = Field(..., description="Contextual evaluation notes or failure details")


class DataQualityCheck(BaseModel):
    """Data quality and boundary validation rule."""
    check_name: str = Field(..., description="Descriptive name of the data quality rule")
    category: str = Field(..., description="Category (IDENTIFIER, COORDINATES, SCORES, COMPLETENESS, DEMOGRAPHICS)")
    description: str = Field(..., description="Specific constraint or boundary evaluated")
    passed: bool = Field(..., description="Whether the check passed with zero critical anomalies")
    records_evaluated: int = Field(..., description="Total records evaluated")
    anomalies_detected: int = Field(..., description="Count of anomalous or out-of-boundary records")
    details: str = Field(..., description="Contextual notes or observation details")


class SystemDiagnostic(BaseModel):
    """Standardized diagnostic alert or notice."""
    diagnostic_id: str = Field(..., description="Unique diagnostic code")
    component: str = Field(..., description="Associated subsystem component")
    severity: Literal["INFO", "WARNING", "ERROR", "CRITICAL"] = Field(..., description="Diagnostic severity level")
    message: str = Field(..., description="Diagnostic notification text")
    affected_district_id: Optional[str] = Field(None, description="Affected district identifier if isolated")
    recommendation: str = Field(..., description="Actionable recommendation or resolution path")


class SystemReadiness(BaseModel):
    """Overall prototype analytical readiness assessment."""
    readiness_level: Literal[
        "ANALYTICALLY_READY_FOR_PROTOTYPE_USE",
        "PARTIALLY_READY_FOR_PROTOTYPE_USE",
        "NOT_READY"
    ] = Field(..., description="Standardized prototype readiness level")
    score: float = Field(..., description="Readiness index score (0.0 to 100.0)")
    status_rationale: str = Field(..., description="Analytical justification for the determined readiness level")
    blocking_issues: List[str] = Field(default_factory=list, description="Critical blocking issues preventing prototype usage")
    warnings: List[str] = Field(default_factory=list, description="Non-blocking operational observations")


class SystemStatusSummary(BaseModel):
    """Quantitative summary metrics of system integration and readiness."""
    total_districts: int = Field(..., description="Total districts evaluated across engines")
    total_components_checked: int = Field(..., description="Total subsystems evaluated")
    healthy_components: int = Field(..., description="Count of healthy components")
    degraded_components: int = Field(..., description="Count of degraded components")
    unavailable_components: int = Field(..., description="Count of unavailable components")
    integration_checks_passed: int = Field(..., description="Count of passed cross-engine integration rules")
    integration_checks_failed: int = Field(..., description="Count of failed cross-engine integration rules")
    data_quality_checks_passed: int = Field(..., description="Count of passed data quality rules")
    data_quality_checks_failed: int = Field(..., description="Count of failed data quality rules")
    warnings_count: int = Field(..., description="Total non-blocking warning diagnostics")
    errors_count: int = Field(..., description="Total error diagnostics")
    critical_issues_count: int = Field(..., description="Total critical diagnostics")
    overall_system_status: str = Field(..., description="Overall system health status")
    prototype_readiness_level: str = Field(..., description="Calculated prototype readiness classification")


class SystemStatusResponse(BaseModel):
    """Comprehensive Phase 9 system integration and readiness report."""
    summary: SystemStatusSummary
    components: List[ComponentStatus] = Field(default_factory=list, description="Subsystem component statuses")
    integration_checks: List[IntegrationCheck] = Field(default_factory=list, description="Cross-engine integration checks")
    data_quality_checks: List[DataQualityCheck] = Field(default_factory=list, description="Data quality validation checks")
    diagnostics: List[SystemDiagnostic] = Field(default_factory=list, description="Standardized system diagnostics")
    readiness: SystemReadiness
    disclaimer: str = Field(PHASE_9_DISCLAIMER, description="Mandatory prototype analytical disclaimer notice")


class SystemHealthResponse(BaseModel):
    """Lightweight health status check."""
    status: str = Field(..., description="Overall health status (HEALTHY, DEGRADED, UNAVAILABLE)")
    components_healthy: int = Field(..., description="Number of healthy components")
    total_components: int = Field(..., description="Total components checked")
    timestamp: str = Field(..., description="ISO 8601 evaluation timestamp")
    disclaimer: str = Field(PHASE_9_DISCLAIMER, description="Mandatory prototype analytical disclaimer notice")


class ReadinessResponse(BaseModel):
    """Focused prototype readiness assessment."""
    readiness_level: str = Field(..., description="Standardized prototype readiness classification")
    score: float = Field(..., description="Calculated readiness score (0-100)")
    status_rationale: str = Field(..., description="Analytical justification")
    blocking_issues: List[str] = Field(default_factory=list, description="Any blocking issues")
    warnings: List[str] = Field(default_factory=list, description="Operational warnings")
    disclaimer: str = Field(PHASE_9_DISCLAIMER, description="Mandatory prototype analytical disclaimer notice")


class DiagnosticsResponse(BaseModel):
    """System diagnostics response with optional filters applied."""
    total_count: int = Field(..., description="Total diagnostic records before filtering")
    filtered_count: int = Field(..., description="Diagnostic records matching filter criteria")
    severity_distribution: Dict[str, int] = Field(..., description="Count of diagnostics by severity")
    diagnostics: List[SystemDiagnostic] = Field(default_factory=list, description="Diagnostic items")
    disclaimer: str = Field(PHASE_9_DISCLAIMER, description="Mandatory prototype analytical disclaimer notice")
