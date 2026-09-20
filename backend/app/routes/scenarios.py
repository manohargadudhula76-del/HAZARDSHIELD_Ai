from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.habitation import Habitation
from app.schemas.scenario import ScenarioSimulateRequest, ScenarioSimulateResponse
from app.services.scenario_engine import simulate_scenario

router = APIRouter(prefix="/api/scenarios", tags=["What-If Disaster Simulator"])


@router.post("/simulate", response_model=ScenarioSimulateResponse)
def run_scenario_simulation(payload: ScenarioSimulateRequest, db: Session = Depends(get_db)):
    """
    Deterministic What-If Disaster Simulation:
    Evaluates environmental and infrastructure stress changes (rainfall, population, road status, hospital, shelter).
    """
    habitation = db.query(Habitation).filter(Habitation.id == payload.habitation_id).first()
    if not habitation:
        habitation = db.query(Habitation).first()
    if not habitation:
        raise HTTPException(status_code=404, detail="Habitation not found for scenario simulation")

    return simulate_scenario(
        habitation=habitation,
        rainfall_change=payload.rainfall_change,
        population_change=payload.population_change,
        road_status=payload.road_status,
        hospital_status=payload.hospital_status,
        shelter_change=payload.shelter_change
    )
