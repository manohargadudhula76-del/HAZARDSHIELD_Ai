from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Habitation(Base):
    __tablename__ = "habitations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    population = Column(Integer, default=0)
    families = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(50), default="LOW", index=True)  # CRITICAL, HIGH, MODERATE, LOW
    vulnerability_score = Column(Float, default=0.0)
    relocation_priority = Column(String(50), default="NONE", index=True)  # IMMEDIATE, SHORT_TERM, MEDIUM_TERM, NONE
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hazards = relationship("Hazard", back_populates="habitation", cascade="all, delete-orphan")
