from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.safe_haven import SafeHaven
from app.schemas.safe_haven import SafeHavenResponse

router = APIRouter(prefix="/api/safe-havens", tags=["safe_havens"])

@router.get("", response_model=List[SafeHavenResponse])
def list_safe_havens(
    state: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(SafeHaven)
    if state:
        q = q.filter(SafeHaven.state.ilike(f"%{state}%"))
    if status:
        q = q.filter(SafeHaven.status == status.upper())
    return q.order_by(SafeHaven.suitability_score.desc()).all()

@router.get("/{haven_id}", response_model=SafeHavenResponse)
def get_safe_haven(haven_id: int, db: Session = Depends(get_db)):
    h = db.query(SafeHaven).filter(SafeHaven.id == haven_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Safe haven not found")
    return h
