from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class AlertResponse(BaseModel):
    id: str
    title: str
    severity: str
    type: str
    location: str
    population_affected: int
    message: str
    timestamp: str
    status: str
    action_required: str


class AlertActionResponse(BaseModel):
    status: str
    alert_id: str
    message: str
