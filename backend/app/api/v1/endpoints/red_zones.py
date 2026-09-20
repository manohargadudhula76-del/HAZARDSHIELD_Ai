from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
from app.schemas.hazard import RedZoneResponse, GeoJSONFeatureCollection
from app.services.red_zone_engine import red_zone_engine

router = APIRouter()


@router.get("", response_model=List[RedZoneResponse], summary="Get identified Red Zones")
def get_red_zones(
    state: Optional[str] = Query(None, description="Filter by state name"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (HIGH, CRITICAL)")
):
    """
    Returns identified Red Zones and Potential Red Zones across districts.
    Includes tabular records for both spatial and non-spatial districts.
    """
    return red_zone_engine.identify_red_zones(state=state, risk_level=risk_level)


@router.get("/geojson", response_model=GeoJSONFeatureCollection, summary="Get GeoJSON FeatureCollection of spatial Red Zones")
def get_red_zones_geojson(
    state: Optional[str] = Query(None, description="Filter by state name"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (HIGH, CRITICAL)")
):
    """
    Returns map-compatible GeoJSON FeatureCollection of Red Zone circle polygons around district centroids.
    Districts without valid GIS coordinates (spatial_analysis_available == False) are excluded from the GeoJSON features output.
    """
    return red_zone_engine.generate_red_zones_geojson(state=state, risk_level=risk_level)
