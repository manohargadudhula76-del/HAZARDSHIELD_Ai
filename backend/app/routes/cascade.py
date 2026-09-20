from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.habitation import Habitation
from app.schemas.cascade import CascadeSimulateRequest, CascadeSimulateResponse
from app.services.cascade_engine import simulate_cascade

router = APIRouter(prefix="/api/cascade", tags=["Cascading Disaster Impact"])


@router.post("/simulate", response_model=CascadeSimulateResponse)
def run_cascade_simulation(payload: CascadeSimulateRequest, db: Session = Depends(get_db)):
    """
    Multi-Tier Cascading Disaster Dynamic Engine:
    Models sequential hazard escalation (Rainfall -> Flooding -> Road Cutoff -> Evacuation Delay -> Shelter Overload).
    """
    habitation = db.query(Habitation).filter(Habitation.id == payload.habitation_id).first()
    if not habitation:
        habitation = db.query(Habitation).first()
    if not habitation:
        raise HTTPException(status_code=404, detail="Habitation not found for cascade simulation")

    return simulate_cascade(
        habitation=habitation,
        rainfall_intensity=payload.rainfall_intensity,
        road_status=payload.road_status,
        shelter_capacity=payload.shelter_capacity,
        evacuation_status=payload.evacuation_status
    )
