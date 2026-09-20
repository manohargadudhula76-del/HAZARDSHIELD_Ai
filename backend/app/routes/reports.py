import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.habitation import Habitation
from app.models.hazard import Hazard
from app.models.capacity import CarryingCapacity
from app.models.safe_haven import SafeHaven
from app.services.risk_engine import compute_explainable_risk
from app.services.evacuation_service import analyze_evacuation_network
from app.services.gis_service import haversine_distance

router = APIRouter(prefix="/api/reports", tags=["Reports & Decision Support"])

@router.get("/dossier/{habitation_id}", summary="Get Complete Habitation Decision Support Dossier")
def get_habitation_dossier(habitation_id: int, db: Session = Depends(get_db)):
    """
    Returns a unified executive dossier aggregating multi-hazard risk,
    carrying capacity, relocation recommendations, evacuation network status,
    and official decision support actions for a specific habitation.
    """
    hab = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not hab:
        raise HTTPException(status_code=404, detail=f"Habitation with ID {habitation_id} not found")

    hazards = db.query(Hazard).filter(Hazard.habitation_id == habitation_id).all()
    hazards_data = [{"type": h.hazard_type, "severity": h.severity, "score": h.hazard_score, "description": h.description} for h in hazards]

    # Explainable Risk
    risk_info = compute_explainable_risk(hab, hazards)

    # Nearby Safe Havens with Suitability
    all_havens = db.query(SafeHaven).all()
    haven_recs = []
    for sh in all_havens:
        dist = haversine_distance(hab.latitude, hab.longitude, sh.latitude, sh.longitude)
        dist_penalty = min(30, dist * 0.5)
        suitability = max(10, min(100, round(
            sh.safety_score * 0.4 +
            (sh.available_capacity / max(1, sh.total_capacity)) * 30 +
            sh.healthcare_score * 0.15 +
            sh.road_access_score * 0.15 -
            dist_penalty
        )))
        haven_recs.append({
            "id": sh.id,
            "name": sh.name,
            "district": sh.district,
            "state": sh.state,
            "distance_km": round(dist, 1),
            "available_capacity": sh.available_capacity,
            "safety_score": sh.safety_score,
            "suitability_score": suitability,
            "status": sh.status
        })
    haven_recs.sort(key=lambda x: x["suitability_score"], reverse=True)

    # Evacuation summary
    evac_data = analyze_evacuation_network(hab, all_havens, is_road_closed=False)
    impact_sum = evac_data.get("impact_summary", {})

    return {
        "report_id": f"DSR-2026-{hab.id:04d}",
        "title": "HAZARDSHIELD AI — EXECUTIVE DECISION SUPPORT DOSSIER",
        "generated_at": "2026-09-09T22:00:00Z",
        "provenance": "Prototype Decision Support System (Demo Dataset)",
        "habitation": {
            "id": hab.id,
            "name": hab.name,
            "district": hab.district,
            "state": hab.state,
            "population": hab.population,
            "families": hab.families,
            "coordinates": {"lat": hab.latitude, "lng": hab.longitude},
            "relocation_priority": hab.relocation_priority
        },
        "risk_assessment": {
            "risk_score": hab.risk_score,
            "risk_level": hab.risk_level,
            "vulnerability_score": hab.vulnerability_score,
            "primary_driver": risk_info.primary_risk_driver,
            "secondary_driver": risk_info.secondary_risk_driver,
            "explanation": risk_info.summary_explanation,
            "contributors": [c.model_dump() if hasattr(c, 'model_dump') else c.dict() if hasattr(c, 'dict') else c for c in risk_info.contributors]
        },
        "hazard_profile": hazards_data,
        "recommended_safe_havens": haven_recs[:3],
        "evacuation_overview": {
            "active_routes": impact_sum.get("active_routes_count", 2),
            "primary_destination": impact_sum.get("primary_haven_name", haven_recs[0]["name"] if haven_recs else "Safe Haven"),
            "recommendation": impact_sum.get("recommendation", "Corridor open and traversable.")
        },
        "strategic_action_plan": [
            f"Mobilize SDRF / NDRF evacuation readiness for {hab.name} (Pop: {hab.population:,}).",
            f"Pre-allocate {hab.population:,} beds at {haven_recs[0]['name'] if haven_recs else 'Mangaldai Safe Haven'} ({haven_recs[0]['distance_km'] if haven_recs else 14.2} km away).",
            "Establish real-time river gauge monitoring and bridge structural checkpoints.",
            "Issue high-priority advisories via State Emergency Operation Center."
        ]
    }


@router.get("/export-csv", summary="Export Regional Disaster Decision Summary as CSV")
def export_summary_csv(db: Session = Depends(get_db)):
    """
    Exports a tabular CSV report of all habitations, risk scores, populations,
    and relocation priorities for offline administrative decision support.
    """
    habitations = db.query(Habitation).order_by(Habitation.risk_score.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Habitation ID",
        "Habitation Name",
        "District",
        "State",
        "Latitude",
        "Longitude",
        "Population",
        "Families",
        "Risk Score (0-100)",
        "Risk Level",
        "Vulnerability Score",
        "Relocation Priority",
        "Dataset Provenance"
    ])

    for h in habitations:
        writer.writerow([
            h.id,
            h.name,
            h.district,
            h.state,
            h.latitude,
            h.longitude,
            h.population,
            h.families,
            h.risk_score,
            h.risk_level,
            h.vulnerability_score,
            h.relocation_priority,
            "HazardShield AI Prototype Dataset"
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hazardshield_decision_summary.csv"}
    )
