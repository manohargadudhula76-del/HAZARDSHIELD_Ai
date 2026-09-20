from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.habitation import Habitation
from app.models.red_zone import RedZone
from app.models.safe_haven import SafeHaven
from app.schemas.gis import RouteRequest, RouteResponse
from app.services.gis_service import calculate_route

router = APIRouter(prefix="/api/gis", tags=["GIS & Routing"])


@router.post("/route", response_model=RouteResponse)
def get_gis_route(payload: RouteRequest):
    """
    Calculate driving evacuation route between coordinates with OpenStreetMap OSRM and fallback.
    Supports road closure detour recalculation.
    """
    return calculate_route(
        start_lat=payload.start_latitude,
        start_lon=payload.start_longitude,
        end_lat=payload.end_latitude,
        end_lon=payload.end_longitude,
        is_closed=payload.is_closed or False,
        avoid_road=payload.avoid_road
    )


@router.get("/routes")
def list_gis_corridors(db: Session = Depends(get_db)):
    """Returns catalog of designated disaster evacuation corridors and road segments."""
    return [
        {
            "route_id": "corridor-nh15-east",
            "name": "NH-15 Brahmaputra North Trunk Corridor",
            "state": "Assam",
            "status": "OPEN",
            "hazard_exposure": "MODERATE",
            "description": "Primary high-capacity bituminous highway connecting Darrang to Tezpur higher ridge."
        },
        {
            "route_id": "corridor-nh58-hills",
            "name": "NH-58 Alaknanda High-Ridge Arterial",
            "state": "Uttarakhand",
            "status": "PARTIALLY_BLOCKED",
            "hazard_exposure": "HIGH",
            "description": "Hill road with active landslide monitoring stations and pre-positioned clearance bulldozers."
        },
        {
            "route_id": "corridor-sh12-delta",
            "name": "Mahanadi Delta Coastal Evacuation Highway",
            "state": "Odisha",
            "status": "OPEN",
            "hazard_exposure": "LOW",
            "description": "Elevated all-weather multi-purpose cyclone evacuation corridor."
        }
    ]



@router.get("/red-zones")
def get_gis_red_zones(state: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns active Red Zone polygons/circular perimeters for GIS map overlays."""
    query = db.query(RedZone)
    if state and state != 'ALL':
        query = query.filter(RedZone.state == state)
    zones = query.all()
    return [
        {
            "id": rz.id,
            "name": rz.name,
            "state": rz.state,
            "district": rz.district,
            "latitude": rz.latitude,
            "longitude": rz.longitude,
            "radius_km": rz.radius,
            "risk_score": rz.risk_score,
            "risk_level": rz.risk_level,
            "hazard_type": rz.hazard_type,
            "population": rz.population,
            "status": rz.status
        }
        for rz in zones
    ]


@router.get("/habitations")
def get_gis_habitations(state: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns GIS habitation points with vulnerability and risk scores."""
    query = db.query(Habitation)
    if state and state != 'ALL':
        query = query.filter(Habitation.state == state)
    habs = query.all()
    return [
        {
            "id": h.id,
            "name": h.name,
            "state": h.state,
            "district": h.district,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "population": h.population,
            "risk_score": h.risk_score,
            "risk_level": h.risk_level,
            "vulnerability_score": h.vulnerability_score,
            "relocation_priority": h.relocation_priority
        }
        for h in habs
    ]


@router.get("/safe-havens")
def get_gis_safe_havens(state: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns GIS designated Safe Haven destination coordinates and capacities."""
    query = db.query(SafeHaven)
    if state and state != 'ALL':
        query = query.filter(SafeHaven.state == state)
    havens = query.all()
    return [
        {
            "id": sh.id,
            "name": sh.name,
            "state": sh.state,
            "district": sh.district,
            "latitude": sh.latitude,
            "longitude": sh.longitude,
            "total_capacity": sh.total_capacity,
            "available_capacity": sh.available_capacity,
            "safety_score": sh.safety_score,
            "status": sh.status
        }
        for sh in havens
    ]
