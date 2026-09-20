from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.schemas.hazard import DistrictHazardResponse
from app.services.hazard_engine import hazard_engine

router = APIRouter()


@router.get("", response_model=List[DistrictHazardResponse], summary="Get Hazard Risk Analysis across districts")
def get_hazard_analysis(
    state: Optional[str] = Query(None, description="Filter by state name"),
    district: Optional[str] = Query(None, description="Filter by district name"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MODERATE, HIGH, CRITICAL)")
):
    """
    Returns Multi-Hazard Risk Analysis across all districts or filtered by query parameters.
    Operates on real district-level master analytical data.
    Exposes data completeness score, analysis confidence, missing data list, and spatial analysis availability.
    """
    results = hazard_engine.filter_hazards(state=state, district=district, risk_level=risk_level)
    return results


@router.get("/{district_id}", response_model=DistrictHazardResponse, summary="Get Hazard Analysis for a single district")
def get_district_hazard(district_id: str):
    """
    Returns detailed Multi-Hazard Risk Analysis for a single district by district_id.
    Raises HTTP 404 if the district_id is not found.
    """
    res = hazard_engine.get_district_hazard(district_id)
    if not res:
        raise HTTPException(
            status_code=404,
            detail=f"District with district_id '{district_id}' not found in master analytical dataset."
        )
    return res
