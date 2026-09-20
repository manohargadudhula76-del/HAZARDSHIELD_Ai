from typing import Optional
from fastapi import APIRouter, Query

from app.services.system_integration_engine import system_integration_engine
from app.schemas.system_status import (
    SystemStatusResponse,
    SystemHealthResponse,
    ReadinessResponse,
    DiagnosticsResponse,
)

router = APIRouter()


@router.get("", response_model=SystemStatusResponse)
def get_system_status():
    """
    Retrieve complete Phase 9 System Integration, API Quality & Production Readiness audit report.
    Validates cross-engine consistency, dataset integrity, and subsystem availability without modifying calculations.
    """
    report = system_integration_engine.evaluate_system()
    return report["response"]


@router.get("/health", response_model=SystemHealthResponse)
def get_system_health():
    """
    Retrieve lightweight system health summary evaluating the operational availability of all 7 core subsystems.
    """
    return system_integration_engine.get_health()


@router.get("/readiness", response_model=ReadinessResponse)
def get_system_readiness():
    """
    Retrieve standardized prototype readiness classification (ANALYTICALLY_READY_FOR_PROTOTYPE_USE).
    Explicitly provides research and analytical prototype disclaimers.
    """
    return system_integration_engine.get_readiness()


@router.get("/diagnostics", response_model=DiagnosticsResponse)
def get_system_diagnostics(
    severity: Optional[str] = Query(None, description="Filter diagnostics by severity level (INFO, WARNING, ERROR, CRITICAL)"),
    component: Optional[str] = Query(None, description="Filter diagnostics by subsystem component name"),
):
    """
    Retrieve standardized system diagnostics with optional severity or component filtering.
    """
    return system_integration_engine.get_diagnostics(severity=severity, component=component)
