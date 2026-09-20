from fastapi import APIRouter
from app.schemas.health import HealthCheckResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Backend Health Check",
    description="Returns backend server health status and timestamp."
)
def check_health() -> HealthCheckResponse:
    return HealthCheckResponse(
        status="ok",
        service="HazardShield AI Backend",
        version="0.1.0",
    )
