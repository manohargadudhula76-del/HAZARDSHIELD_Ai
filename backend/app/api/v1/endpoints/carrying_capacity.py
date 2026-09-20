from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.schemas.carrying_capacity import CarryingCapacityResponse
from app.services.carrying_capacity_engine import carrying_capacity_engine

router = APIRouter()


@router.get("", response_model=List[CarryingCapacityResponse], summary="Get 7-Sector Carrying Capacity Assessments")
def get_carrying_capacities(
    state: Optional[str] = Query(None, description="Filter by state name"),
    carrying_capacity_level: Optional[str] = Query(
        None,
        description="Filter by capacity level (CRITICAL_CAPACITY, LOW_CAPACITY, MODERATE_CAPACITY, HIGH_CAPACITY)"
    )
):
    """
    Returns 7-Sector Carrying Capacity Assessments across districts.
    Supports filtering by state and capacity level.
    """
    return carrying_capacity_engine.filter_capacities(
        state=state,
        carrying_capacity_level=carrying_capacity_level
    )


@router.get("/{district_id}", response_model=CarryingCapacityResponse, summary="Get Carrying Capacity Assessment for single district")
def get_district_carrying_capacity(district_id: str):
    """
    Returns detailed 7-Sector Carrying Capacity Assessment for a specific district.
    """
    result = carrying_capacity_engine.get_district_capacity(district_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found in master dataset.")
    return result
