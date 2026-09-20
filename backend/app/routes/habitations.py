from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.habitation import Habitation
from app.schemas.habitation import HabitationResponse

router = APIRouter(prefix="/api/habitations", tags=["habitations"])

@router.get("", response_model=List[HabitationResponse])
def list_habitations(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    relocation_priority: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Habitation)
    if state:
        q = q.filter(Habitation.state.ilike(f"%{state}%"))
    if district:
        q = q.filter(Habitation.district.ilike(f"%{district}%"))
    if risk_level:
        q = q.filter(Habitation.risk_level == risk_level.upper())
    reloc_p = relocation_priority or priority
    if reloc_p:
        q = q.filter(Habitation.relocation_priority == reloc_p.upper())
    return q.order_by(Habitation.risk_score.desc()).all()

@router.get("/{habitation_id}", response_model=HabitationResponse)
def get_habitation(habitation_id: int, db: Session = Depends(get_db)):
    hab = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail="Habitation not found")
    return hab
