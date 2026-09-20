from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.relocation_service import get_relocation_recommendation

router = APIRouter(prefix="/api/relocation", tags=["relocation"])

@router.get("/{habitation_id}")
def relocation_recommendation(habitation_id: int, db: Session = Depends(get_db)):
    result = get_relocation_recommendation(db, habitation_id)
    if not result:
        raise HTTPException(status_code=404, detail="Habitation not found")
    return result
