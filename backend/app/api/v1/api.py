from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    dashboard,
    alerts,
    hazard,
    red_zones,
    carrying_capacity,
    vulnerability,
    relocation,
    decision_support,
    explainability,
    system_status,
    dossier,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(dashboard.router, tags=["Dashboard"])
api_router.include_router(alerts.router, tags=["Alerts"])
api_router.include_router(hazard.router, prefix="/hazard", tags=["Hazard Engine"])
api_router.include_router(red_zones.router, prefix="/red-zones", tags=["Red Zones"])
api_router.include_router(carrying_capacity.router, prefix="/carrying-capacity", tags=["Carrying Capacity"])
api_router.include_router(carrying_capacity.router, prefix="/capacity", tags=["Carrying Capacity"])
api_router.include_router(vulnerability.router, prefix="/vulnerability", tags=["Vulnerability Analysis"])
api_router.include_router(relocation.router, prefix="/relocation", tags=["Safe Relocation"])
api_router.include_router(decision_support.router, prefix="/decision-support", tags=["Decision Support"])
api_router.include_router(explainability.router, prefix="/explainability", tags=["Decision Explainability"])
api_router.include_router(system_status.router, prefix="/system-status", tags=["System Integration & Readiness"])
api_router.include_router(dossier.router, prefix="/dossier", tags=["Executive Dossier & Data Export"])




