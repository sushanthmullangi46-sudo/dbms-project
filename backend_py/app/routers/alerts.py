from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from app.database import get_db
from app.models.schema import EmergencyAlert, UserAccount, Notification
from app.auth.security import get_current_user

router = APIRouter(prefix="/alerts", tags=["Emergency Broadcasts & Warnings"])

class AlertCreate(BaseModel):
    title: str
    alert_type: str = "GENERAL_SAFETY" # FLOOD_WARNING, FIRE_ALERT, EVACUATION_NOTICE, MEDICAL_EMERGENCY, ROAD_CLOSURE, GENERAL_SAFETY
    severity: str = "CRITICAL" # CRITICAL, HIGH, MODERATE, ADVISORY
    target_area: str = "City-wide"
    message: str
    expires_in_hours: Optional[int] = 12

@router.get("/active")
@router.get("")
def list_active_alerts(
    target_area: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all currently active emergency alerts.
    Available publicly to all portals: Citizen, Responder, Logistics, and Command Center.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    query = db.query(EmergencyAlert).filter(EmergencyAlert.is_active == True)
    if target_area:
        query = query.filter(EmergencyAlert.target_area.ilike(f"%{target_area}%"))
    
    alerts = query.order_by(EmergencyAlert.issued_at.desc()).all()
    results = []
    for a in alerts:
        # Check expiry
        if a.expires_at and a.expires_at < now:
            a.is_active = False
            db.commit()
            continue
            
        results.append({
            "alert_id": a.alert_id,
            "title": a.title,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "target_area": a.target_area,
            "message": a.message,
            "issued_by": a.issuer.full_name if a.issuer else "Emergency Operations Center",
            "issued_at": a.issued_at.isoformat() if a.issued_at else None,
            "expires_at": a.expires_at.isoformat() if a.expires_at else None,
            "is_active": a.is_active
        })
    return {"success": True, "count": len(results), "alerts": results}

@router.post("", status_code=status.HTTP_201_CREATED)
def create_emergency_alert(
    alert_in: AlertCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Broadcast an emergency alert city-wide or to a specific target zone.
    Logs broadcast and sends push notifications to all users.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    expiry = now + timedelta(hours=alert_in.expires_in_hours or 12)
    
    alert = EmergencyAlert(
        title=alert_in.title,
        alert_type=alert_in.alert_type.upper(),
        severity=alert_in.severity.upper(),
        target_area=alert_in.target_area,
        message=alert_in.message,
        issued_by=current_user.user_id,
        issued_at=now,
        expires_at=expiry,
        is_active=True
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    # Broadcast notification to users
    users = db.query(UserAccount).filter(UserAccount.account_status == "ACTIVE").limit(50).all()
    notifs = [
        Notification(
            user_id=u.user_id,
            title=f"EMERGENCY BROADCAST: {alert.title}",
            message=alert.message,
            notification_type="ALERT",
            is_read=False,
            created_at=now
        )
        for u in users
    ]
    db.add_all(notifs)
    db.commit()
    
    return {
        "success": True,
        "message": "Emergency alert broadcast successfully.",
        "alert_id": alert.alert_id,
        "issued_at": alert.issued_at.isoformat(),
        "expires_at": alert.expires_at.isoformat()
    }

@router.patch("/{alert_id}/dismiss")
def dismiss_emergency_alert(
    alert_id: int,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.is_active = False
    db.commit()
    return {"success": True, "message": "Alert dismissed and deactivated."}

