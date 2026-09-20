from sqlalchemy.orm import Session
from app.models.habitation import Habitation
from app.models.red_zone import RedZone
from app.models.safe_haven import SafeHaven
from app.models.capacity import CarryingCapacity

def get_dashboard_summary(db: Session) -> dict:
    total_habitations = db.query(Habitation).count()
    high_risk = db.query(Habitation).filter(Habitation.risk_level.in_(["CRITICAL", "HIGH"])).count()
    safe_hab = db.query(Habitation).filter(Habitation.risk_level.in_(["LOW", "MODERATE"])).count()

    immediate_reloc_rows = db.query(Habitation).filter(Habitation.relocation_priority == "IMMEDIATE").all()
    immediate_reloc_habs = len(immediate_reloc_rows)
    immediate_reloc_people = sum(h.population for h in immediate_reloc_rows)

    total_red_zones = db.query(RedZone).count()
    critical_red_zones = db.query(RedZone).filter(RedZone.risk_level == "CRITICAL").count()

    pop_at_risk_rows = db.query(Habitation).filter(Habitation.risk_level.in_(["CRITICAL", "HIGH"])).all()
    population_at_risk = sum(h.population for h in pop_at_risk_rows)

    capacity_exceeded = db.query(CarryingCapacity).filter(
        CarryingCapacity.status.in_(["EXCEEDED", "CRITICAL"])
    ).count()

    total_safe_havens = db.query(SafeHaven).count()

    return {
        "critical_red_zones": critical_red_zones,
        "population_at_risk": population_at_risk,
        "capacity_exceeded": capacity_exceeded,
        "immediate_relocation": immediate_reloc_people if immediate_reloc_people > 0 else immediate_reloc_habs,
        "immediate_relocation_habitations": immediate_reloc_habs,
        "immediate_relocation_people": immediate_reloc_people,
        "high_risk_habitations": high_risk,
        "safe_habitations": safe_hab,
        "active_alerts": critical_red_zones + immediate_reloc_habs,
        "total_habitations": total_habitations,
        "total_safe_havens": total_safe_havens,
        "total_red_zones": total_red_zones,
        "data_source": "Prototype Database (Rule-Based Aggregation)",
    }
