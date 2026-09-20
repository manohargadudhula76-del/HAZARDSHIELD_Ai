from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.habitation import Habitation
from app.models.hazard import Hazard
from app.schemas.risk import ExplainableRiskResponse
from app.services.risk_engine import compute_explainable_risk

router = APIRouter(prefix="/api/risk", tags=["Explainable Multi-Hazard Risk"])


@router.get("/{habitation_id}", response_model=ExplainableRiskResponse)
def get_explainable_risk_by_habitation(habitation_id: int, db: Session = Depends(get_db)):
    """
    Explainable Multi-Hazard Risk Engine:
    Answers clearly 'WHY is this habitation high risk?' by computing weighted factor contributions.
    """
    habitation = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not habitation:
        habitation = db.query(Habitation).first()
    if not habitation:
        raise HTTPException(status_code=404, detail="Habitation not found")

    hazards = db.query(Hazard).filter(Hazard.habitation_id == habitation.id).all()
    return compute_explainable_risk(habitation, hazards)


@router.get("/", response_model=List[ExplainableRiskResponse])
def get_all_explainable_risks(db: Session = Depends(get_db)):
    """List explainable risk calculations for all habitations."""
    habitations = db.query(Habitation).all()
    results = []
    for h in habitations:
        hazards = db.query(Hazard).filter(Hazard.habitation_id == h.id).all()
        results.append(compute_explainable_risk(h, hazards))
    return results
