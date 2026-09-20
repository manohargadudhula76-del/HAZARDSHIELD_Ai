from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Hazard(Base):
    __tablename__ = "hazards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    habitation_id = Column(Integer, ForeignKey("habitations.id", ondelete="CASCADE"), nullable=False)
    hazard_type = Column(String(100), nullable=False, index=True)  # Flood, Landslide, Cyclone, Extreme Rainfall, Cloudburst, Coastal Erosion
    hazard_score = Column(Float, default=0.0)
    severity = Column(String(50), default="MODERATE", index=True)  # CRITICAL, HIGH, MODERATE, LOW
    description = Column(String(500), nullable=True)

    # Relationship
    habitation = relationship("Habitation", back_populates="hazards")
