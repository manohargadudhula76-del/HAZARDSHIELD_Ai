from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics import AnalyticsOverviewResponse
from app.services.analytics_service import get_analytics_overview

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Reports"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_summary(db: Session = Depends(get_db)):
    """Aggregated disaster risk, demographic vulnerability, and capacity metrics."""
    return get_analytics_overview(db)


@router.get("/risk-distribution")
def get_risk_distribution(db: Session = Depends(get_db)):
    overview = get_analytics_overview(db)
    return overview["risk_distribution"]


@router.get("/hazard-frequency")
def get_hazard_frequency(db: Session = Depends(get_db)):
    overview = get_analytics_overview(db)
    return overview["hazard_frequency"]


@router.get("/population-risk")
def get_population_risk(db: Session = Depends(get_db)):
    overview = get_analytics_overview(db)
    return {
        "population_at_risk": overview["population_at_risk"],
        "immediate_relocation_population": overview["immediate_relocation_population"],
        "state_breakdown": overview["state_analytics"]
    }
