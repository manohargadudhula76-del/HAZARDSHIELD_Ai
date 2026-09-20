from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.services.relocation_engine import relocation_engine
from app.schemas.relocation import (
    RelocationListResponse,
    RelocationRecommendation,
    RelocationPrioritySummary,
)

router = APIRouter()


@router.get("", response_model=RelocationListResponse)
def get_relocation_recommendations(
    source_district_id: Optional[str] = Query(None, description="Filter by source district ID"),
    state: Optional[str] = Query(None, description="Filter by source state name"),
    recommendation_scope: Optional[str] = Query(None, description="Filter by recommendation scope (SAME_STATE, CROSS_STATE, NO_RECOMMENDATION)"),
):
    """
    Retrieve Safe Relocation Recommendations for eligible high-priority source districts (Phase 6).
    Operates strictly at the district-to-district analytical level.
    """
    all_data = relocation_engine.analyze_all_relocations()
    results = all_data["results"]

    if source_district_id:
        results = [r for r in results if r["source_district_id"].upper() == source_district_id.upper()]

    if state:
        results = [r for r in results if r["source_state"].upper() == state.upper()]

    if recommendation_scope:
        results = [r for r in results if r["recommendation_scope"].upper() == recommendation_scope.upper()]

    return RelocationListResponse(
        total_count=len(results),
        results=results,
        summary=all_data.get("summary"),
        disclaimer=all_data["disclaimer"],
    )


@router.get("/priorities", response_model=RelocationPrioritySummary)
def get_relocation_priorities():
    """
    Retrieve a high-level summary of high-priority relocation source districts requiring intervention.
    NOTE: Registered before /{district_id} to prevent path parameter collision.
    """
    all_data = relocation_engine.analyze_all_relocations()
    summary_data = all_data["summary"]
    return RelocationPrioritySummary(**summary_data)


@router.get("/{district_id}", response_model=RelocationRecommendation)
def get_district_relocation_recommendation(district_id: str):
    """
    Retrieve safe relocation recommendation details for a single specific source district.
    """
    rec = relocation_engine.get_relocation_for_district(district_id)
    if not rec:
        raise HTTPException(
            status_code=404,
            detail=f"Relocation recommendation for source district '{district_id}' not found or district is not an eligible high-priority source district.",
        )
    return RelocationRecommendation(**rec)
