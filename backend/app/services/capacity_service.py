from sqlalchemy.orm import Session
from app.models.capacity import CarryingCapacity

def assess_carrying_capacity(db: Session, location_id: int):
    record = db.query(CarryingCapacity).filter(CarryingCapacity.id == location_id).first()
    if not record:
        return None
    available = max(0, (record.total_capacity or 0) - (record.occupied_capacity or 0))
    load_ratio = (record.occupied_capacity or 0) / max(1, record.total_capacity or 1) * 100.0
    return {
        "id": record.id,
        "location_name": record.location_name,
        "state": record.state,
        "district": record.district,
        "total_capacity": record.total_capacity,
        "occupied_capacity": record.occupied_capacity,
        "available_capacity": available,
        "load_percentage": round(load_ratio, 1),
        "status": record.status,
    }
