from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.schema import Shelter, ShelterRegistration, Citizen, UserAccount
from app.schemas.dtos import ShelterRegistrationCreate
from app.auth.security import get_current_user
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/shelters", tags=["Evacuation & Relief Shelter Management"])

@router.get("")
def list_shelters(
    status_filter: Optional[str] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Shelter)
    if status_filter:
        query = query.filter(Shelter.status == status_filter.upper())
    shelters = query.all()

    results = []
    for s in shelters:
        results.append({
            "shelter_id": s.shelter_id,
            "shelter_name": s.shelter_name,
            "capacity": s.capacity,
            "current_occupancy": s.current_occupancy,
            "available_capacity": max(0, s.capacity - s.current_occupancy),
            "occupancy_rate_pct": round((s.current_occupancy / s.capacity) * 100, 1) if s.capacity > 0 else 100.0,
            "status": s.status,
            "has_medical_unit": s.has_medical_unit,
            "has_potable_water": s.has_potable_water,
            "location_name": s.location.location_name if s.location else "Sector",
            "risk_zone": s.location.risk_zone if s.location else "SAFE"
        })
    return {"success": True, "count": len(results), "shelters": results}

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_shelter_checkin(
    reg_in: ShelterRegistrationCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stage 9: Evacuation Check-in & Capacity Enforcement
    Prevents shelter occupancy from exceeding capacity.
    """
    citizen = db.query(Citizen).filter(Citizen.user_id == current_user.user_id).first()
    if not citizen:
        # Auto-create citizen profile if missing
        citizen = Citizen(user_id=current_user.user_id)
        db.add(citizen)
        db.commit()
        db.refresh(citizen)

    registration = WorkflowService.register_shelter_entry(
        db=db,
        citizen_id=citizen.citizen_id,
        shelter_id=reg_in.shelter_id,
        dependents=reg_in.dependents_count,
        special_reqs=reg_in.special_requirements
    )
    return {
        "success": True,
        "message": "Citizen and dependents registered into evacuation shelter successfully.",
        "registration_id": registration.registration_id,
        "check_in_time": registration.check_in_time
    }
