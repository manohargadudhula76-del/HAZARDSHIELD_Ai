from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.capacity import CarryingCapacity
from app.schemas.capacity import CapacityResponse

router = APIRouter(prefix="/api/capacity", tags=["capacity"])

@router.get("", response_model=List[CapacityResponse])
def list_capacity(
    state: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(CarryingCapacity)
    if state:
        q = q.filter(CarryingCapacity.state.ilike(f"%{state}%"))
    if status:
        q = q.filter(CarryingCapacity.status == status.upper())
    records = q.all()
    for item in records:
        if item.available_capacity is None or item.available_capacity == 0:
            item.available_capacity = max(0, (item.total_capacity or 0) - (item.occupied_capacity or 0))
    return records

@router.get("/{capacity_id}", response_model=CapacityResponse)
def get_capacity(capacity_id: int, db: Session = Depends(get_db)):
    c = db.query(CarryingCapacity).filter(CarryingCapacity.id == capacity_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Capacity record not found")
    if c.available_capacity is None or c.available_capacity == 0:
        c.available_capacity = max(0, (c.total_capacity or 0) - (c.occupied_capacity or 0))
    return c
