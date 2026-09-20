from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class RedZone(Base):
    __tablename__ = "red_zones"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius = Column(Float, default=5.0)  # buffer radius in km
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(50), default="CRITICAL", index=True)  # CRITICAL, HIGH, MODERATE, LOW
    hazard_type = Column(String(100), nullable=False, index=True)
    population = Column(Integer, default=0)
    status = Column(String(50), default="ACTIVE", index=True)  # ACTIVE, MONITORING, RESOLVED
