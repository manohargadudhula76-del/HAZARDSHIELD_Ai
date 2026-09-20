import os

routes = {}

routes['gis.py'] = """from fastapi import APIRouter, Depends, HTTPException, Query
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
    \"\"\"
    Calculate driving evacuation route between coordinates with OpenStreetMap OSRM and fallback.
    Supports road closure detour recalculation.
    \"\"\"
    return calculate_route(
        start_lat=payload.start_latitude,
        start_lon=payload.start_longitude,
        end_lat=payload.end_latitude,
        end_lon=payload.end_longitude,
        is_closed=payload.is_closed or False,
        avoid_road=payload.avoid_road
    )


@router.get("/red-zones")
def get_gis_red_zones(state: Optional[str] = None, db: Session = Depends(get_db)):
    \"\"\"Returns active Red Zone polygons/circular perimeters for GIS map overlays.\"\"\"
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
    \"\"\"Returns GIS habitation points with vulnerability and risk scores.\"\"\"
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
    \"\"\"Returns GIS designated Safe Haven destination coordinates and capacities.\"\"\"
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
"""

routes['risk.py'] = """from fastapi import APIRouter, Depends, HTTPException
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
    \"\"\"
    Explainable Multi-Hazard Risk Engine:
    Answers clearly 'WHY is this habitation high risk?' by computing weighted factor contributions.
    \"\"\"
    habitation = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not habitation:
        habitation = db.query(Habitation).first()
    if not habitation:
        raise HTTPException(status_code=404, detail="Habitation not found")

    hazards = db.query(Hazard).filter(Hazard.habitation_id == habitation.id).all()
    return compute_explainable_risk(habitation, hazards)


@router.get("/", response_model=List[ExplainableRiskResponse])
def get_all_explainable_risks(db: Session = Depends(get_db)):
    \"\"\"List explainable risk calculations for all habitations.\"\"\"
    habitations = db.query(Habitation).all()
    results = []
    for h in habitations:
        hazards = db.query(Hazard).filter(Hazard.habitation_id == h.id).all()
        results.append(compute_explainable_risk(h, hazards))
    return results
"""

routes['scenarios.py'] = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.habitation import Habitation
from app.schemas.scenario import ScenarioSimulateRequest, ScenarioSimulateResponse
from app.services.scenario_engine import simulate_scenario

router = APIRouter(prefix="/api/scenarios", tags=["What-If Disaster Simulator"])


@router.post("/simulate", response_model=ScenarioSimulateResponse)
def run_scenario_simulation(payload: ScenarioSimulateRequest, db: Session = Depends(get_db)):
    \"\"\"
    Deterministic What-If Disaster Simulation:
    Evaluates environmental and infrastructure stress changes (rainfall, population, road status, hospital, shelter).
    \"\"\"
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
"""

routes['evacuation.py'] = """from fastapi import APIRouter, Depends, HTTPException, Query
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
    \"\"\"
    Evaluates geospatial evacuation connectivity from a vulnerable habitation to safe haven destinations.
    Returns primary vs alternative detour route geometries and travel time impact.
    \"\"\"
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
"""

routes['cascade.py'] = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.habitation import Habitation
from app.schemas.cascade import CascadeSimulateRequest, CascadeSimulateResponse
from app.services.cascade_engine import simulate_cascade

router = APIRouter(prefix="/api/cascade", tags=["Cascading Disaster Impact"])


@router.post("/simulate", response_model=CascadeSimulateResponse)
def run_cascade_simulation(payload: CascadeSimulateRequest, db: Session = Depends(get_db)):
    \"\"\"
    Multi-Tier Cascading Disaster Dynamic Engine:
    Models sequential hazard escalation (Rainfall -> Flooding -> Road Cutoff -> Evacuation Delay -> Shelter Overload).
    \"\"\"
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
"""

routes['analytics.py'] = """from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics import AnalyticsOverviewResponse
from app.services.analytics_service import get_analytics_overview

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Reports"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_summary(db: Session = Depends(get_db)):
    \"\"\"Aggregated disaster risk, demographic vulnerability, and capacity metrics.\"\"\"
    return get_analytics_overview(db)


@router.get("/risk-distribution")
def get_risk_distribution(db: Session = Depends(get_db)):
    overview = get_analytics_overview(db)
    return overview["risk_distribution"]


@router.get("/hazard-frequency")
def get_hazard_frequency(db: Session = Depends(get_db)):
    overview = get_analytics_overview(db)
    return overview["hazard_frequency"]


@router.get("/population-risk")
def get_population_risk(db: Session = Depends(get_db)):
    overview = get_analytics_overview(db)
    return {
        "population_at_risk": overview["population_at_risk"],
        "immediate_relocation_population": overview["immediate_relocation_population"],
        "state_breakdown": overview["state_analytics"]
    }
"""

routes['alerts.py'] = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.alert import AlertResponse, AlertActionResponse
from app.services.alert_service import get_active_alerts, resolve_alert, acknowledge_alert

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Notifications"])


@router.get("", response_model=List[AlertResponse])
def get_alerts_list(db: Session = Depends(get_db)):
    \"\"\"Returns active rule-based alerts for critical red zones, capacity deficits, and relocation triggers.\"\"\"
    return get_active_alerts(db)


@router.post("/{alert_id}/resolve", response_model=AlertActionResponse)
def resolve_active_alert(alert_id: str):
    \"\"\"Mark an active alert as resolved and remove from critical banner stream.\"\"\"
    return resolve_alert(alert_id)


@router.post("/{alert_id}/acknowledge", response_model=AlertActionResponse)
def acknowledge_active_alert(alert_id: str):
    \"\"\"Acknowledge alert receipt by emergency operations officer.\"\"\"
    return acknowledge_alert(alert_id)
"""

os.makedirs('app/routes', exist_ok=True)
for filename, code in routes.items():
    path = os.path.join('app', 'routes', filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code.strip() + '\n')
    print(f'Wrote {path}')