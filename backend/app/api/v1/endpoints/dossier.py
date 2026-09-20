from typing import Optional
from fastapi import APIRouter, HTTPException, Response

from app.services.dossier_engine import dossier_engine
from app.services.export_engine import export_engine
from app.schemas.dossier import (
    DistrictDossierResponse,
    NationalBriefingResponse,
    StateBriefingResponse,
    DossierExportSummaryResponse,
    GeoJSONExportResponse,
)

router = APIRouter()


# -------------------------------------------------------------------------
# Static Executive Briefing & Export Routes (MUST be registered before /{district_id})
# -------------------------------------------------------------------------

@router.get(
    "/briefing/national",
    response_model=NationalBriefingResponse,
    summary="National Executive Briefing",
    description="Summarizes multi-hazard risk, vulnerability, priority distributions, and system readiness across all 640 Indian districts.",
)
def get_national_briefing():
    """Returns the nationwide executive briefing combining Phases 3-9 outputs."""
    try:
        return dossier_engine.get_national_briefing()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate national executive briefing.",
        ) from exc


@router.get(
    "/briefing/state/{state_name}",
    response_model=StateBriefingResponse,
    summary="State Executive Briefing",
    description="Provides state-level multi-hazard risk, vulnerability distributions, priority ranking, and relocation summaries.",
)
def get_state_briefing(state_name: str):
    """Returns state-level executive briefing for the requested state (case-insensitive)."""
    briefing = dossier_engine.get_state_briefing(state_name)
    if briefing is None:
        raise HTTPException(
            status_code=404,
            detail=f"State '{state_name}' not found in analytical registry.",
        )
    return briefing


@router.get(
    "/export/summary",
    response_model=DossierExportSummaryResponse,
    summary="Multi-Indicator JSON Export",
    description="Returns standardized JSON summary containing core Phase 3-9 indicators across all 640 districts.",
)
def get_export_summary():
    """Exports standardized multi-phase indicator records in JSON format."""
    try:
        return export_engine.get_export_summary()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate multi-indicator summary export.",
        ) from exc


@router.get(
    "/export/csv",
    summary="Downloadable District CSV Export",
    description="Returns downloadable CSV containing standard analytical indicators for all 640 districts.",
    response_class=Response,
)
def get_export_csv():
    """Generates downloadable CSV data file for district analyses."""
    try:
        csv_content = export_engine.generate_csv_data()
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": 'attachment; filename="hazardshield_district_dossier_summary.csv"'
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate CSV data export.",
        ) from exc


@router.get(
    "/export/geojson",
    response_model=GeoJSONExportResponse,
    summary="RFC 7946 GeoJSON FeatureCollection Export",
    description="Returns RFC 7946 compliant GeoJSON FeatureCollection for districts with verified centroid coordinates. Coordinates: [longitude, latitude].",
)
def get_export_geojson():
    """Exports district risk, vulnerability, and priority data as GeoJSON Point features."""
    try:
        return export_engine.generate_geojson()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate GeoJSON export.",
        ) from exc


# -------------------------------------------------------------------------
# Dynamic District Dossier Route (Registered AFTER static routes to prevent collision)
# -------------------------------------------------------------------------

@router.get(
    "/{district_id}",
    response_model=DistrictDossierResponse,
    summary="Unified District Executive Dossier",
    description="Retrieves a complete executive dossier combining hazard, carrying capacity, vulnerability, relocation, decision support, and explainability for a specific district.",
)
def get_district_dossier(district_id: str):
    """Retrieves unified district profile by district ID (e.g. DIST_IND_345)."""
    dossier = dossier_engine.get_district_dossier(district_id)
    if dossier is None:
        raise HTTPException(
            status_code=404,
            detail=f"District '{district_id}' not found in analytical registry.",
        )
    return dossier
