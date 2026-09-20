from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class CarryingCapacity(Base):
    __tablename__ = "carrying_capacity"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    location_name = Column(String(255), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_capacity = Column(Integer, default=0)
    occupied_capacity = Column(Integer, default=0)
    available_capacity = Column(Integer, default=0)
    housing_capacity = Column(Integer, default=0)
    water_capacity = Column(Integer, default=0)
    healthcare_capacity = Column(Integer, default=0)
    shelter_capacity = Column(Integer, default=0)
    capacity_score = Column(Float, default=0.0)
    status = Column(String(50), default="SUFFICIENT", index=True)  # SUFFICIENT, NEAR_LIMIT, EXCEEDED, CRITICAL
