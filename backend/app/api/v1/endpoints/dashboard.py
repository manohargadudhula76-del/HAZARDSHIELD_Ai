from fastapi import APIRouter
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import dashboard_service

router = APIRouter()


@router.get(
    "/dashboard/summary",
    response_model=DashboardSummaryResponse,
    summary="Get Executive Dashboard Summary",
    description="Retrieves executive disaster risk intelligence metrics, hazard distribution, capacity stress, and AI summary."
)
def get_dashboard_summary() -> DashboardSummaryResponse:
    return dashboard_service.get_dashboard_summary()
