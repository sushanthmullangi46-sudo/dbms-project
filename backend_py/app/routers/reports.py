from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import math
from app.database import get_db
from app.models.schema import (
    DisasterReport, ReportUpdate, DisasterLocation, UserAccount,
    TeamAssignment, ResponseTeam, ResourceRequest, RequestItem,
    ResourceAllocation, Delivery, RescueLocationHistory
)
from app.schemas.dtos import DisasterReportCreate, ReportUpdateCreate, AssistanceRequestCreate
from app.auth.security import get_current_user
from app.services.workflow_service import WorkflowService

def haversine_km(lat1, lon1, lat2, lon2):
    try:
        R = 6371.0
        dlat = math.radians(float(lat2) - float(lat1))
        dlon = math.radians(float(lon2) - float(lon1))
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 2)
    except Exception:
        return 2.5

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
        attachment_urls=report_in.attachment_urls or [],
        requested_supplies=report_in.requested_supplies or [],
        severity=report_in.severity or "P2"
    )
    return {
        "success": True,
        "message": "Emergency report submitted successfully. Disaster management command and rescue squads alerted.",
        "report_id": report.report_id,
        "id": report.report_id,
        "emergency_id": f"EMG-{report.report_id:04d}",
        "emergency_code": report.report_reference_id,
        "report_reference_id": report.report_reference_id,
        "disaster_id": report.disaster_id,
        "linked_incident_id": report.disaster_id,
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
        loc_name = r.location.location_name if r.location else "Unknown"
        lat = r.location.latitude if r.location else 13.0358
        lng = r.location.longitude if r.location else 77.5970
        ward = r.location.ward_name if r.location else "North Sector"
        sub_time = r.submitted_at.isoformat() if hasattr(r.submitted_at, 'isoformat') else str(r.submitted_at)

        results.append({
            "report_id": r.report_id,
            "id": r.report_id,
            "report_reference_id": r.report_reference_id,
            "disaster_type": r.disaster_type,
            "description": r.description,
            "status": r.status,
            "people_affected": r.people_affected,
            "injuries": r.injuries_reported,
            "injuries_reported": r.injuries_reported,
            "trapped": r.trapped_persons,
            "trapped_persons": r.trapped_persons,
            "missing_persons": r.missing_persons,
            "urgent_medical_needed": r.urgent_medical_needed,
            "evacuation_needed": r.evacuation_needed,
            "location_name": loc_name,
            "ward_name": ward,
            "lat": lat,
            "lng": lng,
            "latitude": lat,
            "longitude": lng,
            "risk_zone": r.location.risk_zone if r.location else "MODERATE",
            "submitted_at": sub_time,
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

    msg = update_in.message or update_in.update_text or update_in.note or "Status update"
    upd = ReportUpdate(
        report_id=report.report_id,
        author_id=current_user.user_id,
        message=msg
    )
    db.add(upd)
    db.commit()
    return {"success": True, "message": "Supplemental update logged successfully"}

@router.get("/{report_id}/tracking")
def get_report_live_tracking(
    report_id: int,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(DisasterReport).filter(DisasterReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Disaster report not found")

    target_lat = report.location.latitude if report.location else 13.0358
    target_lng = report.location.longitude if report.location else 77.5970
    loc_name = report.location.location_name if report.location else "Sector Emergency Site"
    address = report.location.address if report.location else "Bangalore North Division"

    # 1. Assigned Rescue Team & Tactical Telemetry
    assignment = None
    if report.disaster_id:
        assignment = db.query(TeamAssignment).filter(
            TeamAssignment.disaster_id == report.disaster_id
        ).order_by(TeamAssignment.assigned_at.desc()).first()

    team_data = None
    if assignment:
        team = assignment.team
        # Fetch latest GPS breadcrumb
        latest_loc = db.query(RescueLocationHistory).filter(
            (RescueLocationHistory.mission_id == assignment.assignment_id) |
            (RescueLocationHistory.team_id == assignment.team_id)
        ).order_by(RescueLocationHistory.recorded_at.desc()).first()

        squad_lat = latest_loc.latitude if latest_loc else (target_lat - 0.024)
        squad_lng = latest_loc.longitude if latest_loc else (target_lng - 0.018)
        squad_speed = latest_loc.speed if latest_loc else 38.5
        squad_heading = latest_loc.heading if latest_loc else 45.0
        squad_recorded = latest_loc.recorded_at.isoformat() if latest_loc else assignment.assigned_at.isoformat()

        # Fetch recent path history (up to 20 coordinates)
        history_points = db.query(RescueLocationHistory).filter(
            (RescueLocationHistory.mission_id == assignment.assignment_id) |
            (RescueLocationHistory.team_id == assignment.team_id)
        ).order_by(RescueLocationHistory.recorded_at.asc()).limit(20).all()

        route_trail = [[pt.latitude, pt.longitude] for pt in history_points]
        if not route_trail:
            route_trail = [
                [target_lat - 0.045, target_lng - 0.035],
                [target_lat - 0.024, target_lng - 0.018],
                [squad_lat, squad_lng]
            ]

        dist_km = haversine_km(squad_lat, squad_lng, target_lat, target_lng)
        # Assuming avg emergency vehicle speed of 35 km/h in urban traffic
        eta_mins = max(1, int(round((dist_km / 35.0) * 60))) if assignment.assignment_status not in ("ON_SCENE", "ARRIVED", "RESCUE_IN_PROGRESS", "COMPLETED") else 0

        team_data = {
            "assigned": True,
            "assignment_id": assignment.assignment_id,
            "mission_id": assignment.assignment_id,
            "team_id": team.team_id if team else 1,
            "team_name": team.team_name if team else "NDRF Rapid SAR Squad",
            "leader_name": team.leader_name if team else "Capt. Arvind Rao",
            "contact_phone": team.contact_phone if team else "+91-9845011111",
            "specialization": team.specialization if team else "WATER_RESCUE",
            "status": assignment.assignment_status,
            "assignment_status": assignment.assignment_status,
            "latitude": squad_lat,
            "longitude": squad_lng,
            "speed_kmh": squad_speed,
            "heading": squad_heading,
            "last_updated": squad_recorded,
            "distance_km": dist_km,
            "eta_minutes": eta_mins,
            "route_trail": route_trail,
            "timestamps": {
                "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None,
                "acknowledged_at": assignment.acknowledged_at.isoformat() if assignment.acknowledged_at else None,
                "en_route_at": assignment.en_route_at.isoformat() if assignment.en_route_at else None,
                "on_scene_at": assignment.on_scene_at.isoformat() if assignment.on_scene_at else None,
                "completed_at": assignment.completed_at.isoformat() if assignment.completed_at else None
            }
        }
    else:
        team_data = {
            "assigned": False,
            "status": "QUEUED_FOR_DEPLOYMENT",
            "message": "Incident Command is prioritizing and deploying an active tactical squad to your sector."
        }

    # 2. Itemized Requested Relief Supplies
    supplies_list = []
    if report.disaster_id:
        reqs = db.query(ResourceRequest).filter(ResourceRequest.disaster_id == report.disaster_id).all()
        for r in reqs:
            for item in r.items:
                res = item.resource
                # Check allocations
                alloc = db.query(ResourceAllocation).filter(
                    ResourceAllocation.request_id == r.request_id,
                    ResourceAllocation.resource_id == item.resource_id
                ).first()

                alloc_status = alloc.allocation_status if alloc else "REQUESTED"
                dispatch_ref = alloc.dispatch_reference if alloc else None
                wh_name = alloc.warehouse.warehouse_name if (alloc and alloc.warehouse) else None

                # Check delivery
                deliv = None
                if alloc:
                    deliv = db.query(Delivery).filter(Delivery.disaster_id == report.disaster_id).first()

                derived_status = "REQUESTED"
                if deliv and deliv.delivery_status == "DELIVERED":
                    derived_status = "DELIVERED"
                elif deliv and deliv.delivery_status == "DISPATCHED":
                    derived_status = "DISPATCHED"
                elif alloc_status in ("RESERVED", "APPROVED"):
                    derived_status = "RESERVED"
                elif r.status == "APPROVED":
                    derived_status = "APPROVED"

                supplies_list.append({
                    "request_item_id": item.request_item_id,
                    "request_id": r.request_id,
                    "resource_id": item.resource_id,
                    "resource_name": res.resource_name if res else "Emergency Supplies",
                    "category": res.category if res else "SUPPLY",
                    "unit": res.unit if res else "Units",
                    "quantity_requested": item.quantity_requested,
                    "quantity_approved": item.quantity_approved or (alloc.allocated_quantity if alloc else 0),
                    "status": derived_status,
                    "dispatch_reference": dispatch_ref,
                    "warehouse_name": wh_name,
                    "driver_name": deliv.transport_driver_name if deliv else None,
                    "vehicle_registration": deliv.vehicle_registration if deliv else None
                })

    return {
        "success": True,
        "emergency": {
            "report_id": report.report_id,
            "report_reference_id": report.report_reference_id,
            "emergency_id": f"EMG-{report.report_id:04d}",
            "disaster_id": report.disaster_id,
            "disaster_type": report.disaster_type,
            "description": report.description,
            "status": report.status,
            "people_affected": report.people_affected,
            "injuries": report.injuries_reported,
            "trapped": report.trapped_persons,
            "missing": report.missing_persons,
            "submitted_at": report.submitted_at.isoformat() if report.submitted_at else None,
            "target_location": {
                "location_name": loc_name,
                "address": address,
                "latitude": target_lat,
                "longitude": target_lng
            }
        },
        "rescue_team": team_data,
        "supplies": supplies_list
    }


@router.post("/{report_id}/assistance-request")
def request_assistance_for_report(
    report_id: int,
    req_in: AssistanceRequestCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(DisasterReport).filter(DisasterReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    note_text = f"[ASSISTANCE REQUEST: {req_in.request_type}] For {req_in.quantity_or_people} people. Notes: {req_in.notes or 'None'}"
    upd = ReportUpdate(
        report_id=report.report_id,
        author_id=current_user.user_id,
        message=note_text
    )
    db.add(upd)
    db.commit()
    return {
        "success": True,
        "message": "Assistance request logged with disaster command center",
        "report_id": report_id,
        "request_type": req_in.request_type
    }
