from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.red_zone import RedZone
from app.schemas.red_zone import RedZoneResponse

router = APIRouter(prefix="/api/red-zones", tags=["red_zones"])

@router.get("", response_model=List[RedZoneResponse])
def list_red_zones(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    hazard_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(RedZone)
    if state:
        q = q.filter(RedZone.state.ilike(f"%{state}%"))
    if district:
        q = q.filter(RedZone.district.ilike(f"%{district}%"))
    if risk_level:
        q = q.filter(RedZone.risk_level == risk_level.upper())
    if hazard_type:
        q = q.filter(RedZone.hazard_type.ilike(f"%{hazard_type}%"))
    return q.order_by(RedZone.risk_score.desc()).all()

@router.get("/{zone_id}", response_model=RedZoneResponse)
def get_red_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(RedZone).filter(RedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Red zone not found")
    return zone
