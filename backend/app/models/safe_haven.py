from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class SafeHaven(Base):
    __tablename__ = "safe_havens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_capacity = Column(Integer, default=0)
    occupied_capacity = Column(Integer, default=0)
    available_capacity = Column(Integer, default=0)
    safety_score = Column(Float, default=0.0)
    road_access_score = Column(Float, default=0.0)
    healthcare_score = Column(Float, default=0.0)
    suitability_score = Column(Float, default=0.0)
    status = Column(String(50), default="AVAILABLE", index=True)  # AVAILABLE, LIMITED, FULL
