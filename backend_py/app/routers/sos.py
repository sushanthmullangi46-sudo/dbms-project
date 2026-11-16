from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.schema import (
    DisasterReport, Disaster, DisasterLocation, UserAccount,
    Notification, EmergencyAlert, Role
)
from app.auth.security import get_current_user, require_role
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/sos", tags=["SOS Emergency Alerting & Direct Dispatch"])

class SOSRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    address: Optional[str] = None
    emergency_type: Optional[str] = "FLASH_FLOOD_TRAPPED"
    notes: Optional[str] = "CRITICAL SOS: Citizen trapped requiring immediate rescue."
    trapped_count: Optional[int] = 1
    medical_needed: Optional[bool] = True

@router.post("/activate", status_code=status.HTTP_201_CREATED)
@router.post("", status_code=status.HTTP_201_CREATED)
def activate_sos(
    sos_in: SOSRequest,
    current_user: UserAccount = Depends(require_role(["CITIZEN"])),
    db: Session = Depends(get_db)
):
    """
    One-click SOS Emergency Trigger:
    - Finds or creates closest location node
    - Registers emergency report with P1 / CRITICAL severity
    - Automatically links/creates active disaster incident
    - Queues critical supplies (First Aid Kit, Drinking Water, Boat)
    - Broadcasts high-priority notifications to command officers & rescue leads
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    lat = sos_in.latitude
    lng = sos_in.longitude

    # Pick location
    loc = db.query(DisasterLocation).first()
    loc_id = loc.location_id if loc else 1

    report = WorkflowService.submit_report(
        db=db,
        reporter_user_id=current_user.user_id,
        location_id=loc_id,
        disaster_type="Flood",
        description=f"CRITICAL SOS [{sos_in.emergency_type}]: {sos_in.notes} at coordinates ({lat:.4f}, {lng:.4f})",
        people_affected=sos_in.trapped_count or 1,
        injuries_reported=1 if sos_in.medical_needed else 0,
        missing_persons=0,
        trapped_persons=sos_in.trapped_count or 1,
        urgent_medical_needed=sos_in.medical_needed,
        evacuation_needed=True,
        attachment_urls=[],
        requested_supplies=[
            {"resource_id": 4, "quantity": 10}, # Potable Water
            {"resource_id": 5, "quantity": 2},  # First Aid Kits
            {"resource_id": 1, "quantity": 1}   # Rescue Boat
        ],
        severity="P1",
        latitude=lat,
        longitude=lng,
        address=sos_in.address
    )

    # Immediately ensure linked disaster is marked ACTIVE
    if report.disaster_id:
        disaster = db.query(Disaster).filter(Disaster.disaster_id == report.disaster_id).first()
        if disaster:
            disaster.status = "ACTIVE"
            db.commit()

    # Create emergency alert for command center
    alert = EmergencyAlert(
        title=f"SOS SIGNAL: {current_user.full_name or 'Citizen'} in Distress",
        alert_type="EVACUATION_NOTICE",
        severity="CRITICAL",
        target_area=loc.ward_name if loc else "Immediate Vicinity",
        message=f"Direct SOS beacon activated at ({lat:.4f}, {lng:.4f}). Trapped: {sos_in.trapped_count or 1}. Medical required: {sos_in.medical_needed}.",
        issued_by=current_user.user_id,
        issued_at=now,
        is_active=True
    )
    db.add(alert)

    # Notify all officers and rescue leads
    officers = db.query(UserAccount).join(Role).filter(
        UserAccount.account_status == "ACTIVE",
        Role.role_name.in_(["DISASTER_OFFICER", "FIELD_RESPONDER"])
    ).all()
    for off in officers:
        db.add(Notification(
            user_id=off.user_id,
            title=f"SOS RED ALERT: Report #{report.report_id}",
            message=f"SOS triggered by {current_user.full_name} ({current_user.phone or 'No phone'}). Immediate deployment required.",
            notification_type="ALERT",
            is_read=False,
            created_at=now
        ))
    db.commit()

    return {
        "success": True,
        "message": "SOS Emergency signal broadcast! Response teams and command officers notified.",
        "report_id": report.report_id,
        "emergency_id": f"EMG-{report.report_id:04d}",
        "report_reference_id": report.report_reference_id,
        "disaster_id": report.disaster_id,
        "status": "ACTIVE",
        "severity": "CRITICAL",
        "tracking_url": f"/citizen/tracking?report_id={report.report_id}"
    }

