from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.habitation import Habitation
from app.models.red_zone import RedZone
from app.models.safe_haven import SafeHaven
from app.schemas.map import MapLocationsResponse, MapLocationItem

router = APIRouter(prefix="/api/map", tags=["map"])

@router.get("/locations", response_model=MapLocationsResponse)
def get_map_locations(db: Session = Depends(get_db)):
    habitations = db.query(Habitation).all()
    red_zones = db.query(RedZone).all()
    safe_havens = db.query(SafeHaven).all()

    hab_items = [MapLocationItem(
        id=h.id, name=h.name, latitude=h.latitude, longitude=h.longitude,
        risk_score=h.risk_score, risk_level=h.risk_level, population=h.population,
        type="habitation", district=h.district, state=h.state,
        relocation_priority=h.relocation_priority
    ) for h in habitations]

    rz_items = [MapLocationItem(
        id=z.id, name=z.name, latitude=z.latitude, longitude=z.longitude,
        risk_score=z.risk_score, risk_level=z.risk_level, population=z.population or 0,
        type="red_zone", district=z.district, state=z.state,
        hazard_type=z.hazard_type, radius=z.radius, status=z.status
    ) for z in red_zones]

    sh_items = [MapLocationItem(
        id=s.id, name=s.name, latitude=s.latitude, longitude=s.longitude,
        risk_score=s.suitability_score, risk_level="SAFE", population=0,
        type="safe_haven", district=s.district, state=s.state,
        total_capacity=s.total_capacity,
        occupied_capacity=s.occupied_capacity,
        available_capacity=s.available_capacity,
        safety_score=s.safety_score,
        road_access_score=s.road_access_score,
        healthcare_score=s.healthcare_score,
        suitability_score=s.suitability_score,
        status=s.status
    ) for s in safe_havens]

    return MapLocationsResponse(habitations=hab_items, red_zones=rz_items, safe_havens=sh_items)
