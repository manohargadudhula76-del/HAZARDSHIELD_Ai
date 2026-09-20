from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.hazard import Hazard
from app.models.habitation import Habitation
from app.schemas.hazard import HazardResponse

router = APIRouter(prefix="/api/hazards", tags=["hazards"])

@router.get("", response_model=List[HazardResponse])
def list_hazards(
    hazard_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    habitation_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Hazard)
    if state:
        q = q.join(Habitation).filter(Habitation.state.ilike(f"%{state}%"))
    if hazard_type:
        q = q.filter(Hazard.hazard_type.ilike(f"%{hazard_type}%"))
    if severity:
        q = q.filter(Hazard.severity == severity.upper())
    if habitation_id:
        q = q.filter(Hazard.habitation_id == habitation_id)
    return q.all()

@router.get("/{habitation_id}", response_model=List[HazardResponse])
def get_hazards_by_habitation(habitation_id: int, db: Session = Depends(get_db)):
    hab = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail="Habitation not found")
    hazards = db.query(Hazard).filter(Hazard.habitation_id == habitation_id).all()
    return hazards
