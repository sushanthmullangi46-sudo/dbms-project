from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.schema import DisasterReport, UserAccount
from app.schemas.dtos import ReportVerificationAction
from app.auth.security import require_role
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/verification", tags=["Disaster Officer Verification Queue"])

class VerifyRequest(BaseModel):
    report_id: int

class RejectRequest(BaseModel):
    report_id: int
    reason: str

class RequestInfoRequest(BaseModel):
    report_id: int
    details_requested: Optional[str] = "More information requested by command officer"

class MergeRequest(BaseModel):
    report_id: int
    target_report_id: Optional[int] = None
    target_incident_id: Optional[int] = None

@router.get("/queue")
def get_verification_queue(
    current_user: UserAccount = Depends(require_role(["DISASTER_OFFICER", "COMMAND_CENTER"])),
    db: Session = Depends(get_db)
):
    """
    Stage 2: Officer Verification Queue
    Returns pending submitted reports along with potential duplicate detection.
    """
    pending = db.query(DisasterReport).filter(
        DisasterReport.status.in_(["SUBMITTED", "AWAITING_INFORMATION"])
    ).order_by(DisasterReport.submitted_at.asc()).all()

    queue_items = []
    for r in pending:
        # Check potential duplicates: same location or disaster type within recent window
        potential_dups = db.query(DisasterReport).filter(
            DisasterReport.report_id != r.report_id,
            DisasterReport.location_id == r.location_id,
            DisasterReport.disaster_type == r.disaster_type,
            DisasterReport.status.in_(["SUBMITTED", "VERIFIED", "ASSESSED", "ACTIVE"])
        ).limit(3).all()

        queue_items.append({
            "report_id": r.report_id,
            "report_reference_id": r.report_reference_id,
            "disaster_type": r.disaster_type,
            "description": r.description,
            "people_affected": r.people_affected,
            "injuries": r.injuries_reported,
            "injuries_reported": r.injuries_reported,
            "missing_persons": r.missing_persons,
            "trapped": r.trapped_persons,
            "trapped_persons": r.trapped_persons,
            "urgent_medical": r.urgent_medical_needed,
            "urgent_medical_needed": r.urgent_medical_needed,
            "evacuation": r.evacuation_needed,
            "evacuation_needed": r.evacuation_needed,
            "status": r.status,
            "location_name": r.location.location_name if r.location else "Sector",
            "risk_zone": r.location.risk_zone if r.location else "MODERATE",
            "submitted_at": r.submitted_at,
            "potential_duplicates": [
                {"report_id": d.report_id, "ref": d.report_reference_id, "status": d.status}
                for d in potential_dups
            ]
        })

    return {"success": True, "count": len(queue_items), "queue": queue_items}

@router.post("/verify")
def verify_report_direct(
    body: VerifyRequest,
    current_user: UserAccount = Depends(require_role(["DISASTER_OFFICER", "COMMAND_CENTER"])),
    db: Session = Depends(get_db)
):
    """
    Stage 2: Directly Verify a Disaster Report
    """
    report = WorkflowService.verify_report(
        db=db,
        report_id=body.report_id,
        officer=current_user,
        action="VERIFY"
    )
    return {
        "success": True,
        "message": f"Report {report.report_reference_id} verified successfully.",
        "report_id": report.report_id,
        "report_reference_id": report.report_reference_id,
        "status": report.status
    }

@router.post("/reject")
def reject_report_direct(
    body: RejectRequest,
    current_user: UserAccount = Depends(require_role(["DISASTER_OFFICER", "COMMAND_CENTER"])),
    db: Session = Depends(get_db)
):
    """
    Stage 2: Reject an Unsubstantiated Report with Mandatory Audit Reason
    """
    report = WorkflowService.verify_report(
        db=db,
        report_id=body.report_id,
        officer=current_user,
        action="REJECT",
        rejection_reason=body.reason
    )
    return {
        "success": True,
        "message": f"Report {report.report_reference_id} rejected.",
        "report_id": report.report_id,
        "report_reference_id": report.report_reference_id,
        "status": report.status
    }

@router.post("/request-info")
def request_info_direct(
    body: RequestInfoRequest,
    current_user: UserAccount = Depends(require_role(["DISASTER_OFFICER", "COMMAND_CENTER"])),
    db: Session = Depends(get_db)
):
    """
    Stage 2: Mark Report as Awaiting Information from Reporter
    """
    report = WorkflowService.verify_report(
        db=db,
        report_id=body.report_id,
        officer=current_user,
        action="AWAIT_INFO"
    )
    return {
        "success": True,
        "message": f"Report {report.report_reference_id} marked as awaiting information.",
        "report_id": report.report_id,
        "report_reference_id": report.report_reference_id,
        "status": report.status
    }

@router.post("/merge")
def merge_report_direct(
    body: MergeRequest,
    current_user: UserAccount = Depends(require_role(["DISASTER_OFFICER", "COMMAND_CENTER"])),
    db: Session = Depends(get_db)
):
    """
    Stage 2: Merge Duplicate Report into Existing Incident/Master Report
    """
    target_id = body.target_report_id or body.target_incident_id
    report = WorkflowService.verify_report(
        db=db,
        report_id=body.report_id,
        officer=current_user,
        action="LINK_DUPLICATE",
        target_report_id=target_id
    )
    return {
        "success": True,
        "message": f"Report {report.report_reference_id} linked as duplicate.",
        "report_id": report.report_id,
        "report_reference_id": report.report_reference_id,
        "status": report.status
    }

@router.post("/{report_id}/action")
def perform_verification_action(
    report_id: int,
    action_in: ReportVerificationAction,
    current_user: UserAccount = Depends(require_role(["DISASTER_OFFICER", "COMMAND_CENTER"])),
    db: Session = Depends(get_db)
):
    """
    Stage 2: Verify, Reject, or Merge Duplicate Report (Generic Action Endpoint)
    """
    report = WorkflowService.verify_report(
        db=db,
        report_id=report_id,
        officer=current_user,
        action=action_in.action.upper(),
        rejection_reason=action_in.rejection_reason,
        target_report_id=action_in.target_report_id
    )
    return {
        "success": True,
        "message": f"Verification action '{action_in.action}' executed successfully.",
        "report_reference_id": report.report_reference_id,
        "status": report.status
    }
