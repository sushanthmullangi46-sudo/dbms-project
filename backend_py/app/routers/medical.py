from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from app.database import get_db
from app.models.schema import Hospital, MedicalReferral, Disaster, UserAccount
from app.schemas.dtos import MedicalReferralCreate
from app.auth.security import get_current_user

router = APIRouter(prefix="/medical", tags=["Emergency Medical Referrals & Hospitals"])

@router.get("/hospitals")
def list_hospitals(
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hospitals = db.query(Hospital).all()
    results = []
    for h in hospitals:
        results.append({
            "hospital_id": h.hospital_id,
            "hospital_name": h.hospital_name,
            "total_icu_beds": h.total_icu_beds,
            "available_icu_beds": h.available_icu_beds,
            "total_general_beds": h.total_general_beds,
            "available_general_beds": h.available_general_beds,
            "trauma_center_level": h.trauma_center_level,
            "location_name": h.location.location_name if h.location else "Sector"
        })
    return {"success": True, "count": len(results), "hospitals": results}

@router.post("/referrals", status_code=status.HTTP_201_CREATED)
def create_medical_referral(
    ref_in: MedicalReferralCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stage 10: Medical Assistance & Hospital Referral
    """
    hospital = db.query(Hospital).filter(Hospital.hospital_id == ref_in.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    referral = MedicalReferral(
        disaster_id=ref_in.disaster_id,
        hospital_id=ref_in.hospital_id,
        patient_name=ref_in.patient_name,
        injury_severity=ref_in.injury_severity,
        assigned_ambulance=ref_in.assigned_ambulance,
        referral_status="ASSIGNED",
        created_at=datetime.utcnow()
    )
    # Deduct bed safely if available
    if hospital.available_icu_beds > 0 and ref_in.injury_severity == "CRITICAL":
        hospital.available_icu_beds -= 1
    elif hospital.available_general_beds > 0:
        hospital.available_general_beds -= 1

    db.add(referral)
    db.commit()
    db.refresh(referral)

    return {
        "success": True,
        "message": f"Patient {ref_in.patient_name} referred to {hospital.hospital_name}.",
        "referral_id": referral.referral_id,
        "status": referral.referral_status
    }
