from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.services.explainability_engine import explainability_engine
from app.schemas.explainability import (
    DistrictExplainabilityResponse,
    ExplainabilityListResponse,
)

router = APIRouter()


@router.get("", response_model=ExplainabilityListResponse)
def get_explainability(
    state: Optional[str] = Query(None, description="Filter by state name"),
    explainability_status: Optional[str] = Query(None, description="Filter by explainability status (COMPLETE, PARTIAL, LIMITED)"),
    priority_level: Optional[str] = Query(None, description="Filter by Phase 5 priority level (CRITICAL_PRIORITY, HIGH_PRIORITY, MODERATE_PRIORITY, LOW_PRIORITY)"),
):
    """
    Retrieve Decision Explainability, Audit & Transparency reports for all districts (Phase 8).
    Combines and explains existing Phase 3-7 analytical decisions without modifying calculations.
    """
    all_data = explainability_engine.analyze_all_districts()
    results = all_data["results"]

    if state:
        st_clean = state.strip().upper()
        results = [r for r in results if r.state.upper() == st_clean]

    if explainability_status:
        stat_clean = explainability_status.strip().upper()
        results = [r for r in results if r.explainability_status.upper() == stat_clean]

    if priority_level:
        prio_clean = priority_level.strip().upper()
        results = [r for r in results if r.vulnerability_summary.priority_level.upper() == prio_clean]

    return ExplainabilityListResponse(
        total_count=len(results),
        results=results,
        summary=all_data.get("summary"),
        disclaimer=all_data["disclaimer"],
    )


@router.get("/priorities", response_model=ExplainabilityListResponse)
def get_explainability_priorities():
    """
    Retrieve explainability reports ordered by existing Phase 5 priority information:
    CRITICAL_PRIORITY -> HIGH_PRIORITY -> MODERATE_PRIORITY -> LOW_PRIORITY,
    then priority_index descending, then priority_rank ascending.
    
    CRITICAL: Registered BEFORE /{district_id} to prevent path collision.
    """
    all_data = explainability_engine.analyze_all_districts()
    priorities = all_data["priorities"]

    return ExplainabilityListResponse(
        total_count=len(priorities),
        results=priorities,
        summary=all_data.get("summary"),
        disclaimer=all_data["disclaimer"],
    )


@router.get("/{district_id}", response_model=DistrictExplainabilityResponse)
def get_district_explainability(district_id: str):
    """
    Retrieve complete explainability report for a single specific district by unique identifier.
    """
    report = explainability_engine.get_district_explanation(district_id)
    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"Explainability report for district '{district_id}' not found.",
        )
    return report
