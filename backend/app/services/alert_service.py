from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.habitation import Habitation
from app.models.red_zone import RedZone
from app.models.capacity import CarryingCapacity


_RESOLVED_ALERT_IDS = set()
_ACKNOWLEDGED_ALERT_IDS = set()


def get_active_alerts(db: Session) -> List[Dict[str, Any]]:
    alerts = []
    
    critical_rz = db.query(RedZone).filter(RedZone.risk_level == 'CRITICAL').limit(5).all()
    for rz in critical_rz:
        aid = f"alt-rz-{rz.id}"
        if aid in _RESOLVED_ALERT_IDS:
            continue
        alerts.append({
            'id': aid,
            'title': f"Critical Red Zone Surge: {rz.name}",
            'severity': 'CRITICAL',
            'type': 'RED_ZONE_BREACH',
            'location': f"{rz.district}, {rz.state}",
            'population_affected': rz.population,
            'message': f"Hazard buffer {rz.radius} km breached by severe {rz.hazard_type}. Immediate shelter activation required.",
            'timestamp': '10 mins ago',
            'status': 'ACKNOWLEDGED' if aid in _ACKNOWLEDGED_ALERT_IDS else 'ACTIVE',
            'action_required': 'Deploy evacuation transport to safe haven centers'
        })

    strained_caps = db.query(CarryingCapacity).filter(CarryingCapacity.status.in_(['EXCEEDED', 'DEFICIT', 'STRAINED'])).limit(4).all()
    for cap in strained_caps:
        aid = f"alt-cap-{cap.id}"
        if aid in _RESOLVED_ALERT_IDS:
            continue
        alerts.append({
            'id': aid,
            'title': f"Carrying Capacity Strained: {cap.location_name}",
            'severity': 'HIGH',
            'type': 'CAPACITY_DEFICIT',
            'location': f"{cap.district}, {cap.state}",
            'population_affected': cap.occupied_capacity,
            'message': f"Total capacity {cap.total_capacity:,} occupied at {cap.occupied_capacity:,}. Available margin: {cap.available_capacity:,}.",
            'timestamp': '25 mins ago',
            'status': 'ACKNOWLEDGED' if aid in _ACKNOWLEDGED_ALERT_IDS else 'ACTIVE',
            'action_required': 'Re-route upcoming evacuee convoys to secondary safe havens'
        })

    critical_habs = db.query(Habitation).filter(Habitation.relocation_priority == 'IMMEDIATE').limit(4).all()
    for hab in critical_habs:
        aid = f"alt-hab-{hab.id}"
        if aid in _RESOLVED_ALERT_IDS:
            continue
        alerts.append({
            'id': aid,
            'title': f"Immediate Relocation Required: {hab.name}",
            'severity': 'CRITICAL',
            'type': 'RELOCATION_URGENT',
            'location': f"{hab.district}, {hab.state}",
            'population_affected': hab.population,
            'message': f"Vulnerability index {hab.vulnerability_score}/100 with active flood risk {hab.risk_score}/100.",
            'timestamp': '40 mins ago',
            'status': 'ACKNOWLEDGED' if aid in _ACKNOWLEDGED_ALERT_IDS else 'ACTIVE',
            'action_required': 'Execute SDMA relocation protocol'
        })

    return alerts


def resolve_alert(alert_id: str) -> Dict[str, Any]:
    _RESOLVED_ALERT_IDS.add(alert_id)
    return {'status': 'success', 'alert_id': alert_id, 'message': 'Alert resolved and archived'}


def acknowledge_alert(alert_id: str) -> Dict[str, Any]:
    _ACKNOWLEDGED_ALERT_IDS.add(alert_id)
    return {'status': 'success', 'alert_id': alert_id, 'message': 'Alert acknowledged by operator'}
