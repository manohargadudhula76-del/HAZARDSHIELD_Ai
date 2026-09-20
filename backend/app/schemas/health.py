from pydantic import BaseModel, Field
from datetime import datetime, timezone


class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Service status", json_schema_extra={"example": "ok"})
    service: str = Field(..., description="Service name", json_schema_extra={"example": "HazardShield AI Backend"})
    version: str = Field(..., description="API version", json_schema_extra={"example": "0.1.0"})
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
