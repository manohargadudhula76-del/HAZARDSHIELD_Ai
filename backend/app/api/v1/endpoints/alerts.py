from fastapi import APIRouter, Query
from typing import Optional
from app.schemas.alert import AlertListResponse
from app.services.dashboard_service import dashboard_service

router = APIRouter()


@router.get(
    "/alerts",
    response_model=AlertListResponse,
    summary="Get Emergency Disaster Alerts",
    description="Retrieves active disaster emergency alerts, filterable by severity level."
)
def get_alerts(
    severity: Optional[str] = Query(None, description="Filter alerts by severity (e.g. CRITICAL, HIGH PRIORITY, ALL)")
) -> AlertListResponse:
    return dashboard_service.get_alerts(severity=severity)
