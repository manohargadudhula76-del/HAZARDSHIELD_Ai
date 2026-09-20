from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.services.decision_support_engine import decision_support_engine
from app.schemas.decision_support import (
    DecisionSupportListResponse,
    DecisionSupportResponse,
    DecisionSupportSummary,
)

router = APIRouter()


@router.get("", response_model=DecisionSupportListResponse)
def get_decision_support(
    state: Optional[str] = Query(None, description="Filter by state name"),
    intervention_priority_level: Optional[str] = Query(None, description="Filter by intervention priority level (CRITICAL_INTERVENTION, HIGH_INTERVENTION, MODERATE_INTERVENTION, LOW_INTERVENTION)"),
    primary_intervention: Optional[str] = Query(None, description="Filter by primary intervention strategy"),
):
    """
    Retrieve Decision Support and Intervention Prioritization for all districts (Phase 7).
    Operates strictly at the district analytical level.
    """
    all_data = decision_support_engine.analyze_all_districts()
    results = all_data["results"]

    if state:
        results = [r for r in results if r["state"].upper() == state.upper()]

    if intervention_priority_level:
        results = [r for r in results if r["intervention_priority_level"].upper() == intervention_priority_level.upper()]

    if primary_intervention:
        results = [r for r in results if r["primary_intervention"].upper() == primary_intervention.upper()]

    return DecisionSupportListResponse(
        total_count=len(results),
        results=results,
        summary=all_data.get("summary"),
        disclaimer=all_data["disclaimer"],
    )


@router.get("/priorities", response_model=DecisionSupportListResponse)
def get_decision_support_priorities():
    """
    Retrieve Decision Support records ordered by intervention priority level, priority index (descending), and priority rank (ascending).
    NOTE: Registered before /{district_id} to prevent path parameter collision.
    """
    all_data = decision_support_engine.analyze_all_districts()
    priorities = all_data["priorities"]

    return DecisionSupportListResponse(
        total_count=len(priorities),
        results=priorities,
        summary=all_data.get("summary"),
        disclaimer=all_data["disclaimer"],
    )


@router.get("/{district_id}", response_model=DecisionSupportResponse)
def get_district_decision_support(district_id: str):
    """
    Retrieve complete decision support and intervention prioritization for a single specific district.
    """
    decision = decision_support_engine.get_decision_for_district(district_id)
    if not decision:
        raise HTTPException(
            status_code=404,
            detail=f"Decision support assessment for district '{district_id}' not found.",
        )
    return DecisionSupportResponse(**decision)
