from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.schema import DisasterReport, ReportUpdate, DisasterLocation, UserAccount
from app.schemas.dtos import DisasterReportCreate, ReportUpdateCreate
from app.auth.security import get_current_user
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/reports", tags=["Disaster Reports (Citizen / Witness)"])

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_disaster_report(
    report_in: DisasterReportCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stage 1: Submit Emergency Disaster Report
    Validates fields, assigns unique Report Reference ID, sets status to SUBMITTED,
    and logs immutable audit event.
    """
    report = WorkflowService.submit_report(
        db=db,
        reporter_user_id=current_user.user_id,
        location_id=report_in.location_id,
        disaster_type=report_in.disaster_type,
        description=report_in.description,
        people_affected=report_in.people_affected,
        injuries_reported=report_in.injuries_reported,
        missing_persons=report_in.missing_persons,
        trapped_persons=report_in.trapped_persons,
        urgent_medical_needed=report_in.urgent_medical_needed,
        evacuation_needed=report_in.evacuation_needed,
        attachment_urls=report_in.attachment_urls or []
    )
    return {
        "success": True,
        "message": "Emergency report submitted successfully. Disaster management command has been alerted.",
        "report_id": report.report_id,
        "report_reference_id": report.report_reference_id,
        "status": report.status,
        "submitted_at": report.submitted_at
    }

@router.get("")
def list_reports(
    status_filter: Optional[str] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DisasterReport)
    # Citizens can only access their own private reports
    if current_user.role.role_name == "CITIZEN":
        query = query.filter(DisasterReport.reporter_user_id == current_user.user_id)
    if status_filter:
        query = query.filter(DisasterReport.status == status_filter.upper())

    reports = query.order_by(DisasterReport.submitted_at.desc()).all()
    results = []
    for r in reports:
        results.append({
            "report_id": r.report_id,
            "report_reference_id": r.report_reference_id,
            "disaster_type": r.disaster_type,
            "description": r.description,
            "status": r.status,
            "people_affected": r.people_affected,
            "injuries": r.injuries_reported,
            "trapped": r.trapped_persons,
            "location_name": r.location.location_name if r.location else "Unknown",
            "risk_zone": r.location.risk_zone if r.location else "MODERATE",
            "submitted_at": r.submitted_at,
            "linked_incident_id": r.disaster_id
        })
    return {"success": True, "count": len(results), "reports": results}

@router.get("/{report_id}")
def get_report_detail(
    report_id: int,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(DisasterReport).filter(DisasterReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Disaster report not found")
    
    # Enforce citizen privacy
    if current_user.role.role_name == "CITIZEN" and report.reporter_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied to private report")

    return {
        "success": True,
        "report": {
            "report_id": report.report_id,
            "report_reference_id": report.report_reference_id,
            "disaster_type": report.disaster_type,
            "description": report.description,
            "people_affected": report.people_affected,
            "injuries_reported": report.injuries_reported,
            "missing_persons": report.missing_persons,
            "trapped_persons": report.trapped_persons,
            "urgent_medical_needed": report.urgent_medical_needed,
            "evacuation_needed": report.evacuation_needed,
            "status": report.status,
            "rejection_reason": report.rejection_reason,
            "location": {
                "location_id": report.location.location_id,
                "location_name": report.location.location_name,
                "address": report.location.address,
                "latitude": report.location.latitude,
                "longitude": report.location.longitude,
                "risk_zone": report.location.risk_zone
            } if report.location else None,
            "submitted_at": report.submitted_at,
            "verified_at": report.verified_at,
            "attachments": [{"url": a.file_url, "type": a.file_type} for a in report.attachments],
            "updates": [{"author": u.author_id, "message": u.message, "created_at": u.created_at} for u in report.updates]
        }
    }

@router.post("/{report_id}/updates")
def add_report_update(
    report_id: int,
    update_in: ReportUpdateCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(DisasterReport).filter(DisasterReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user.role.role_name == "CITIZEN" and report.reporter_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Cannot post updates to another citizen's report")

    upd = ReportUpdate(
        report_id=report.report_id,
        author_id=current_user.user_id,
        message=update_in.message
    )
    db.add(upd)
    db.commit()
    return {"success": True, "message": "Supplemental update logged successfully"}
