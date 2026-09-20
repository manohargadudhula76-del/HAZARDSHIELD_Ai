import math
from sqlalchemy.orm import Session
from app.models.habitation import Habitation
from app.models.safe_haven import SafeHaven

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def score_haven(hab: Habitation, haven: SafeHaven, dist_km: float) -> float:
    dist_score = max(0.0, 1.0 - dist_km / 500.0) * 30.0
    safety = (haven.safety_score or 70.0) / 100.0 * 30.0
    cap = min(1.0, (haven.available_capacity or 0) / max(1, hab.population)) * 20.0
    access = (haven.road_access_score or 70.0) / 100.0 * 10.0
    health = (haven.healthcare_score or 70.0) / 100.0 * 10.0
    return round(dist_score + safety + cap + access + health, 2)

def get_relocation_recommendation(db: Session, habitation_id: int):
    hab = db.query(Habitation).filter(Habitation.id == habitation_id).first()
    if not hab:
        return None

    havens = db.query(SafeHaven).filter(SafeHaven.status.in_(["AVAILABLE", "ACTIVE", "LIMITED"])).all()
    results = []
    for h in havens:
        dist = haversine_km(hab.latitude, hab.longitude, h.latitude, h.longitude)
        suit = score_haven(hab, h, dist)
        reasons = []
        if dist < 150:
            reasons.append(f"Close proximity ({dist:.1f} km)")
        if (h.safety_score or 0) >= 85:
            reasons.append("High safety score")
        if (h.available_capacity or 0) >= hab.population:
            reasons.append("Sufficient capacity for relocation")
        if (h.road_access_score or 0) >= 80:
            reasons.append("Good road accessibility")
        if (h.healthcare_score or 0) >= 80:
            reasons.append("Healthcare facilities nearby")
        results.append({
            "id": h.id,
            "name": h.name,
            "district": h.district,
            "state": h.state,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "distance_km": round(dist, 1),
            "available_capacity": h.available_capacity or 0,
            "safety_score": h.safety_score or 70.0,
            "road_access_score": h.road_access_score or 70.0,
            "healthcare_score": h.healthcare_score or 70.0,
            "suitability_score": suit,
            "status": h.status,
            "recommendation_reasons": reasons[:4],
        })
    results.sort(key=lambda x: x["suitability_score"], reverse=True)

    relocation_required = (hab.risk_level == "CRITICAL" and hab.relocation_priority == "IMMEDIATE")

    return {
        "habitation": {
            "id": hab.id,
            "name": hab.name,
            "district": hab.district,
            "state": hab.state,
            "latitude": hab.latitude,
            "longitude": hab.longitude,
            "population": hab.population,
            "families": hab.families,
            "risk_score": hab.risk_score,
            "risk_level": hab.risk_level,
            "vulnerability_score": hab.vulnerability_score,
            "relocation_priority": hab.relocation_priority,
        },
        "relocation_required": relocation_required,
        "priority": hab.relocation_priority or "NONE",
        "methodology": "Prototype Rule-Based Recommendation",
        "recommended_safe_havens": results[:5],
    }
