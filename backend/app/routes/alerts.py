from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.alert import AlertResponse, AlertActionResponse
from app.services.alert_service import get_active_alerts, resolve_alert, acknowledge_alert

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Notifications"])


@router.get("", response_model=List[AlertResponse])
def get_alerts_list(db: Session = Depends(get_db)):
    """Returns active rule-based alerts for critical red zones, capacity deficits, and relocation triggers."""
    return get_active_alerts(db)


@router.post("/{alert_id}/resolve", response_model=AlertActionResponse)
def resolve_active_alert(alert_id: str):
    """Mark an active alert as resolved and remove from critical banner stream."""
    return resolve_alert(alert_id)


@router.post("/{alert_id}/acknowledge", response_model=AlertActionResponse)
def acknowledge_active_alert(alert_id: str):
    """Acknowledge alert receipt by emergency operations officer."""
    return acknowledge_alert(alert_id)
