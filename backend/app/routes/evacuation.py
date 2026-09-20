from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.habitation import Habitation
from app.models.safe_haven import SafeHaven
from app.schemas.evacuation import EvacuationNetworkResponse
from app.services.evacuation_service import analyze_evacuation_network

router = APIRouter(prefix="/api/evacuation", tags=["Evacuation & Road Closures"])


@router.get("/network/{habitation_id}", response_model=EvacuationNetworkResponse)
def get_evacuation_network(
    habitation_id: int,
    road_closed: bool = Query(False, description="Simulate primary road closure / submergence"),
    avoid_road: Optional[str] = Query(None, description="Name of compromised road segment"),
    db: Session = Depends(get_db)
):
    """
    Evaluates geospatial evacuation connectivity from a vulnerable habitation to safe haven destinations.
    Returns primary vs alternative detour route geometries and travel time impact.
    """
    habitation = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not habitation:
        habitation = db.query(Habitation).first()
    if not habitation:
        raise HTTPException(status_code=404, detail="Habitation not found")

    safe_havens = db.query(SafeHaven).all()
    return analyze_evacuation_network(
        habitation=habitation,
        safe_havens=safe_havens,
        is_road_closed=road_closed,
        avoid_road_name=avoid_road or "National Highway 15 Bypass / Main Embankment Bridge"
    )
