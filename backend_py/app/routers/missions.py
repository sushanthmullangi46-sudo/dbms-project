from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import math
from pydantic import BaseModel
from app.database import get_db
from app.models.schema import (
    TeamAssignment, ResponseTeam, Disaster, DisasterLocation,
    ResourceRequest, AuditLog, UserAccount, Resource,
    RescueLocationHistory, DisasterReport, Delivery, DeliveryItem, ResourceAllocation, TeamMember
)
from app.auth.security import get_current_user, require_role
from app.services.workflow_service import WorkflowService
from app.services.audit_service import AuditService

router = APIRouter(tags=["Tactical Missions & Responder Operations"])

OFFICER_ROLES = ["DISASTER_OFFICER", "COMMAND_CENTER"]
RESPONDER_ROLES = ["FIELD_RESPONDER", "RESCUE_TEAM"]
OPERATIONAL_ROLES = OFFICER_ROLES + RESPONDER_ROLES

def get_responder_team(db: Session, user: UserAccount):
    """Resolve the local demo responder to a real team using persisted leader/member names."""
    user_name = (user.full_name or "").strip().casefold()
    if not user_name:
        return None
    teams = db.query(ResponseTeam).all()
    matches = []
    for team in teams:
        names = [team.leader_name]
        names.extend(member.member_name for member in db.query(TeamMember).filter(TeamMember.team_id == team.team_id).all())
        if any(name and name.strip().casefold() in user_name for name in names):
            matches.append(team)
    return matches[0] if matches else db.query(ResponseTeam).first()

def require_responder_assignment(db: Session, mission_id: int, user: UserAccount):
    assignment = db.query(TeamAssignment).filter(TeamAssignment.assignment_id == mission_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Mission assignment not found")
    team = get_responder_team(db, user)
    if not team or assignment.team_id != team.team_id:
        raise HTTPException(status_code=403, detail="Mission is not assigned to your response team")
    return assignment

class MissionCreate(BaseModel):
    requestId: Optional[int] = None
    incidentId: Optional[int] = None
    responderId: Optional[int] = None
    team_id: Optional[int] = None
    vehicleId: Optional[int] = None
    priority: Optional[str] = "P2"
    expectedEndTime: Optional[str] = None

class MissionAllocate(BaseModel):
    resourceId: int
    quantity: int = 1

class MissionStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class MissionComplete(BaseModel):
    notes: Optional[str] = "Mission completed successfully by tactical response squad."

class FieldReportCreate(BaseModel):
    reportType: Optional[str] = "MISSION_UPDATE"
    severity: Optional[str] = "MEDIUM"
    description: str

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    speed: Optional[float] = 0.0
    heading: Optional[float] = 0.0
    accuracy: Optional[float] = 5.0
    status_note: Optional[str] = None

class ClaimIncidentRequest(BaseModel):
    incident_id: Optional[int] = None
    disaster_id: Optional[int] = None
    report_id: Optional[int] = None
    team_id: Optional[int] = None

class DeliveryConfirmRequest(BaseModel):
    receiver_name: Optional[str] = "Capt. Arvind Rao (NDRF Lead)"
    proof_of_delivery_note: Optional[str] = "Supplies verified and distributed to field triage center."

def haversine_dist_km(lat1, lon1, lat2, lon2):
    try:
        R = 6371.0
        dlat = math.radians(float(lat2) - float(lat1))
        dlon = math.radians(float(lon2) - float(lon1))
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon / 2)**2
        return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)
    except Exception:
        return None


def format_mission_dict(a: TeamAssignment):
    disaster_name = a.disaster.disaster_name if a.disaster else "Emergency Incident"
    severity = a.disaster.severity_level if a.disaster else "P2"
    location_name = a.disaster.location.location_name if (a.disaster and a.disaster.location) else None
    latitude = a.disaster.location.latitude if (a.disaster and a.disaster.location) else None
    longitude = a.disaster.location.longitude if (a.disaster and a.disaster.location) else None
    address = a.disaster.location.address if (a.disaster and a.disaster.location) else None
    
    team_name = a.team.team_name if a.team else None
    specialization = a.team.specialization if a.team else None
    leader_name = a.team.leader_name if a.team else None
    contact_phone = a.team.contact_phone if a.team else None

    status_val = a.assignment_status or "ASSIGNED"

    report = a.disaster.reports[0] if (a.disaster and a.disaster.reports) else None
    emg_code = report.report_reference_id if report else f"EMG-{a.disaster_id:04d}"
    description = report.description if report else None

    return {
        "MISSIONID": a.assignment_id,
        "mission_id": a.assignment_id,
        "assignment_id": a.assignment_id,
        "id": a.assignment_id,
        "STATUS": status_val,
        "status": status_val,
        "assignment_status": status_val,
        "PRIORITY": severity,
        "priority": severity,
        "STARTTIME": a.assigned_at.isoformat() if a.assigned_at else None,
        "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
        "EXPECTEDENDTIME": None,
        "ACTUALENDTIME": a.completed_at.isoformat() if a.completed_at else None,
        "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        "REQUESTID": a.assignment_id,
        "request_id": a.assignment_id,
        "REQUESTTYPE": specialization,
        "INCIDENTID": a.disaster_id,
        "disaster_id": a.disaster_id,
        "INCIDENTNAME": disaster_name,
        "disaster_name": disaster_name,
        "INCIDENTSEVERITY": severity,
        "EMERGENCYID": emg_code,
        "emergency_id": emg_code,
        "EMERGENCYCODE": emg_code,
        "emergency_code": emg_code,
        "DESCRIPTION": description,
        "description": description,
        "PEOPLEAFFECTED": report.people_affected if report else None,
        "people_affected": report.people_affected if report else None,
        "TRAPPEDPERSONS": report.trapped_persons if report else None,
        "trapped_persons": report.trapped_persons if report else None,
        "INJURIESREPORTED": report.injuries_reported if report else None,
        "injuries_reported": report.injuries_reported if report else None,
        "TARGETLOCATION": location_name,
        "TARGETLOCATIONID": a.disaster.location_id if a.disaster else None,
        "TARGETADDRESS": address,
        "TARGETLATITUDE": latitude,
        "TARGETLONGITUDE": longitude,
        "latitude": latitude,
        "longitude": longitude,
        "lat": latitude,
        "lng": longitude,
        "RESPONDERID": a.team_id,
        "team_id": a.team_id,
        "TEAMNAME": team_name,
        "team_name": team_name,
        "SPECIALIZATION": specialization,
        "specialization": specialization,
        "RESPONDERLEADNAME": leader_name,
        "RESPONDERPHONE": contact_phone,
        "VEHICLETYPE": None,
        "VEHICLEREGISTRATION": None,
        "ASSIGNEDBYNAME": None,
        "FIELDREPORTCOUNT": 0,
        "fieldReports": []
    }


# 1. Missions List & Management
@router.get("/missions")
def list_missions(
    status: Optional[str] = None,
    current_user: UserAccount = Depends(require_role(OPERATIONAL_ROLES)),
    db: Session = Depends(get_db)
):
    query = db.query(TeamAssignment)
    if current_user.role.role_name in RESPONDER_ROLES:
        team = get_responder_team(db, current_user)
        if not team:
            return {"success": True, "count": 0, "missions": []}
        query = query.filter(TeamAssignment.team_id == team.team_id)
    if status and status.upper() != "ALL":
        query = query.filter(TeamAssignment.assignment_status == status.upper())
    assignments = query.order_by(TeamAssignment.assigned_at.desc()).all()

    missions = [format_mission_dict(a) for a in assignments]
    return {"success": True, "count": len(missions), "missions": missions}

@router.post("/missions", status_code=status.HTTP_201_CREATED)
def create_mission(
    data: MissionCreate,
    current_user: UserAccount = Depends(require_role(OFFICER_ROLES)),
    db: Session = Depends(get_db)
):
    disaster_id = data.incidentId
    if not disaster_id and data.requestId:
        req = db.query(ResourceRequest).filter(ResourceRequest.request_id == data.requestId).first()
        if req:
            disaster_id = req.disaster_id
    if not disaster_id:
        raise HTTPException(status_code=400, detail="An incident ID is required to create an assignment")

    team_id = data.responderId or data.team_id
    if not team_id:
        raise HTTPException(status_code=400, detail="A response team ID is required")
    target_team = db.query(ResponseTeam).filter(ResponseTeam.team_id == team_id).first()
    if not target_team:
        raise HTTPException(status_code=404, detail="Response team not found")

    assignment = WorkflowService.assign_response_team(
        db=db,
        disaster_id=disaster_id,
        team_id=team_id,
        officer=current_user
    )
    return {
        "success": True,
        "message": "Mission deployed and response team locked to operation.",
        "missionId": assignment.assignment_id,
        "mission_id": assignment.assignment_id,
        "assignment_id": assignment.assignment_id,
        "team_id": assignment.team_id,
        "status": assignment.assignment_status
    }

@router.post("/missions/{mission_id}/allocate")
def allocate_to_mission(
    mission_id: int,
    data: MissionAllocate,
    current_user: UserAccount = Depends(require_role(["COORDINATOR", "DISASTER_OFFICER"])),
    db: Session = Depends(get_db)
):
    a = db.query(TeamAssignment).filter(TeamAssignment.assignment_id == mission_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Mission assignment not found")
    request = WorkflowService.create_resource_request(
        db=db,
        disaster_id=a.disaster_id,
        user_id=current_user.user_id,
        items=[{"resource_id": data.resourceId, "quantity_requested": data.quantity}],
        priority=a.disaster.severity_level if a.disaster else "P2"
    )
    return {
        "success": True,
        "message": "Supply request recorded and routed to the logistics approval queue.",
        "request_id": request.request_id,
        "status": request.status
    }

# 2. Responder Portal Endpoints
@router.get("/responder/missions")
def get_responder_missions(
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    # Only report persisted teams and assignments; never create operational
    # records as a side effect of opening the responder dashboard.
    team = get_responder_team(db, current_user)
    assignments = db.query(TeamAssignment).filter(
        TeamAssignment.team_id == team.team_id
    ).order_by(TeamAssignment.assigned_at.desc()).all() if team else []

    missions_list = [format_mission_dict(a) for a in assignments]
    return {
        "success": True,
        "responder": ({
            "RESPONDERID": team.team_id,
            "TEAMNAME": team.team_name,
            "SPECIALIZATION": team.specialization,
            "EXPERIENCELEVEL": "Tier 1 Specialist Squad",
            "CURRENTSTATUS": team.readiness_status,
            "AVAILABILITYSTATUS": team.readiness_status,
            "LEADNAME": team.leader_name,
            "PHONE": team.contact_phone
        } if team else None),
        "missions": missions_list
    }

@router.get("/responder/missions/{mission_id}")
def get_responder_mission_detail(
    mission_id: int,
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    a = require_responder_assignment(db, mission_id, current_user)
    return {"success": True, "mission": format_mission_dict(a)}

@router.put("/responder/missions/{mission_id}/status")
def update_responder_mission_status(
    mission_id: int,
    data: MissionStatusUpdate,
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    require_responder_assignment(db, mission_id, current_user)
    a = WorkflowService.update_team_status(
        db=db,
        assignment_id=mission_id,
        user=current_user,
        new_status=data.status.upper(),
        notes=data.notes
    )
    return {
        "success": True,
        "message": f"Mission status successfully advanced to {a.assignment_status}.",
        "status": a.assignment_status,
        "mission_id": a.assignment_id
    }

@router.post("/responder/missions/{mission_id}/complete")
def complete_responder_mission(
    mission_id: int,
    data: MissionComplete,
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    require_responder_assignment(db, mission_id, current_user)
    a = WorkflowService.update_team_status(
        db=db,
        assignment_id=mission_id,
        user=current_user,
        new_status="COMPLETED",
        notes=data.notes
    )
    return {
        "success": True,
        "message": "Mission marked COMPLETED and logged in immutable operational audit.",
        "status": a.assignment_status,
        "mission_id": a.assignment_id
    }

@router.post("/responder/missions/{mission_id}/report")
def submit_responder_field_report(
    mission_id: int,
    data: FieldReportCreate,
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    a = require_responder_assignment(db, mission_id, current_user)

    audit_entry = AuditService.log(
        db=db,
        entity_name="FIELD_REPORT",
        entity_id=str(mission_id),
        action="FIELD_REPORT_SUBMITTED",
        actor_id=current_user.user_id,
        actor_name=current_user.full_name,
        details=f"[{data.reportType} - {data.severity}] {data.description}"
    )
    return {
        "success": True,
        "message": "Field observation registered and synchronized with Incident Command.",
        "audit_log_id": audit_entry.log_id
    }

@router.post("/responder/requests")
def submit_responder_request(
    data: dict,
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    disaster_id = data.get("incident_id") or data.get("disaster_id")
    resource_id = data.get("resource_id")
    quantity = data.get("quantity")
    if not isinstance(disaster_id, int) or not isinstance(resource_id, int) or not isinstance(quantity, int) or quantity <= 0:
        raise HTTPException(status_code=422, detail="incident_id, resource_id, and a positive quantity are required")
    assignment = db.query(TeamAssignment).filter(
        TeamAssignment.disaster_id == disaster_id,
        TeamAssignment.assignment_status.notin_(["COMPLETED", "CANCELLED"])
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="A field team can only request supplies for an active assignment")
    responder_team = get_responder_team(db, current_user)
    if not responder_team or assignment.team_id != responder_team.team_id:
        raise HTTPException(status_code=403, detail="The incident is not assigned to your response team")
    if not db.query(Resource).filter(Resource.resource_id == resource_id).first():
        raise HTTPException(status_code=404, detail="Resource not found")
    request = WorkflowService.create_resource_request(
        db=db,
        disaster_id=disaster_id,
        user_id=current_user.user_id,
        items=[{"resource_id": resource_id, "quantity_requested": quantity}],
        priority=str(data.get("priority") or "P2").upper()
    )
    return {"success": True, "message": "Field supply request saved for logistics review.", "request_id": request.request_id, "status": request.status}

@router.put("/responder/status")
def update_responder_status(
    data: dict,
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    new_status = data.get("status", "AVAILABLE").upper()
    team = get_responder_team(db, current_user)
    if not team:
        raise HTTPException(status_code=403, detail="No response team is linked to this account")
    if new_status not in {"AVAILABLE", "ASSIGNED", "ON_MISSION", "MAINTENANCE"}:
        raise HTTPException(status_code=422, detail="Invalid response team readiness status")
    team.readiness_status = new_status
    db.commit()
    return {"success": True, "message": f"Responder readiness updated to {new_status}."}

# 3. Available Incidents Queue (Unassigned Citizen Emergencies)
@router.get("/responder/available-incidents")
@router.get("/missions/available-incidents")
def get_available_incidents(
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Returns verified/active emergencies currently awaiting tactical squad dispatch or claim.
    """
    assigned_disaster_ids = [
        row[0] for row in db.query(TeamAssignment.disaster_id).filter(
            TeamAssignment.assignment_status.notin_(["COMPLETED", "CANCELLED"])
        ).all()
    ]

    active_disasters = db.query(Disaster).filter(
        Disaster.status.in_(["ACTIVE", "REPORTED", "VERIFIED"])
    ).order_by(Disaster.created_at.desc()).all()

    incidents = []
    for d in active_disasters:
        if d.disaster_id in assigned_disaster_ids:
            continue

        rpt = d.reports[0] if d.reports else None
        loc = d.location
        loc_name = loc.location_name if loc else None
        lat = loc.latitude if loc else None
        lng = loc.longitude if loc else None
        addr = loc.address if loc else None

        incidents.append({
            "incident_id": d.disaster_id,
            "id": d.disaster_id,
            "disaster_id": d.disaster_id,
            "incident_code": d.incident_code,
            "emergency_id": rpt.report_reference_id if rpt else d.incident_code,
            "report_reference_id": rpt.report_reference_id if rpt else d.incident_code,
            "report_id": rpt.report_id if rpt else None,
            "disaster_name": d.disaster_name,
            "disaster_type": d.disaster_type,
            "severity": d.severity_level,
            "status": d.status,
            "description": rpt.description if rpt else None,
            "people_affected": rpt.people_affected if rpt else None,
            "trapped_persons": rpt.trapped_persons if rpt else None,
            "injuries_reported": rpt.injuries_reported if rpt else None,
            "urgent_medical_needed": rpt.urgent_medical_needed if rpt else False,
            "evacuation_needed": rpt.evacuation_needed if rpt else True,
            "location_name": loc_name,
            "address": addr,
            "latitude": lat,
            "longitude": lng,
            "created_at": d.created_at.isoformat() if d.created_at else None
        })

    return {"success": True, "count": len(incidents), "incidents": incidents}

# 4. Incident Claim / Acceptance
@router.post("/responder/missions/claim")
@router.post("/missions/claim")
def claim_incident(
    data: ClaimIncidentRequest,
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Allows a tactical rescue squad to claim an active citizen emergency.
    Prevents race conditions by atomically locking the assignment.
    """
    disaster_id = data.incident_id or data.disaster_id
    if not disaster_id and data.report_id:
        rpt = db.query(DisasterReport).filter(DisasterReport.report_id == data.report_id).first()
        if rpt:
            disaster_id = rpt.disaster_id

    if not disaster_id:
        raise HTTPException(status_code=400, detail="Incident or report ID required to claim assignment")

    # Determine team
    responder_team = get_responder_team(db, current_user)
    team_id = data.team_id or (responder_team.team_id if responder_team else None)
    if not team_id:
        raise HTTPException(status_code=403, detail="No response team is linked to this account")
    if not responder_team or team_id != responder_team.team_id:
        raise HTTPException(status_code=403, detail="You may only claim an incident for your assigned response team")

    # Concurrency check: already assigned?
    existing = db.query(TeamAssignment).filter(
        TeamAssignment.disaster_id == disaster_id,
        TeamAssignment.assignment_status.notin_(["COMPLETED", "CANCELLED"])
    ).first()
    if existing:
        if existing.team_id != team_id:
            raise HTTPException(status_code=409, detail="Incident is already assigned to another response team")
        return {"success": True, "message": "This team already has an active assignment for the incident.", "mission_id": existing.assignment_id, "mission": format_mission_dict(existing)}

    team_obj = db.query(ResponseTeam).filter(ResponseTeam.team_id == team_id).first()
    if not team_obj:
        raise HTTPException(status_code=404, detail="Response team not found")

    assignment = WorkflowService.assign_response_team(
        db=db,
        disaster_id=disaster_id,
        team_id=team_id,
        officer=current_user
    )

    return {
        "success": True,
        "message": f"Successfully claimed and locked incident to squad '{team_obj.team_name if team_obj else 'Rescue Squad'}'.",
        "mission_id": assignment.assignment_id,
        "assignment_id": assignment.assignment_id,
        "status": assignment.assignment_status,
        "mission": format_mission_dict(assignment)
    }

# 5. Live GPS Location Reporting & Ingestion
@router.post("/missions/{mission_id}/location")
@router.post("/responder/missions/{mission_id}/location")
def update_mission_location(
    mission_id: int,
    loc: LocationUpdate,
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    a = require_responder_assignment(db, mission_id, current_user)

    history_entry = RescueLocationHistory(
        mission_id=mission_id,
        team_id=a.team_id,
        latitude=loc.latitude,
        longitude=loc.longitude,
        speed=loc.speed or 0.0,
        heading=loc.heading or 0.0,
        accuracy=loc.accuracy or 5.0,
        status_note=loc.status_note or a.assignment_status,
        recorded_at=datetime.utcnow()
    )
    db.add(history_entry)
    db.commit()

    return {
        "success": True,
        "message": "GPS telemetry point logged to operational ledger.",
        "recorded_at": history_entry.recorded_at.isoformat()
    }

# 6. Live Mission Location & Routing Query
@router.get("/missions/{mission_id}/location")
def get_mission_location(
    mission_id: int,
    current_user: UserAccount = Depends(require_role(OPERATIONAL_ROLES)),
    db: Session = Depends(get_db)
):
    a = db.query(TeamAssignment).filter(TeamAssignment.assignment_id == mission_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Mission assignment not found")
    if current_user.role.role_name in RESPONDER_ROLES:
        require_responder_assignment(db, mission_id, current_user)

    target_lat = a.disaster.location.latitude if (a.disaster and a.disaster.location) else None
    target_lng = a.disaster.location.longitude if (a.disaster and a.disaster.location) else None

    latest_loc = db.query(RescueLocationHistory).filter(
        RescueLocationHistory.mission_id == mission_id
    ).order_by(RescueLocationHistory.recorded_at.desc()).first()

    squad_lat = latest_loc.latitude if latest_loc else None
    squad_lng = latest_loc.longitude if latest_loc else None

    has_positions = all(value is not None for value in (squad_lat, squad_lng, target_lat, target_lng))
    dist_km = haversine_dist_km(squad_lat, squad_lng, target_lat, target_lng) if has_positions else None
    # No road-routing provider is configured, so do not invent a road ETA.
    eta = None

    return {
        "success": True,
        "mission_id": mission_id,
        "team_id": a.team_id,
        "team_name": a.team.team_name if a.team else "Tactical Rescue Unit",
        "assignment_status": a.assignment_status,
        "current_position": {
            "latitude": squad_lat,
            "longitude": squad_lng,
            "speed": latest_loc.speed if latest_loc else None,
            "heading": latest_loc.heading if latest_loc else None,
            "recorded_at": latest_loc.recorded_at.isoformat() if latest_loc else None
        },
        "target_position": {
            "latitude": target_lat,
            "longitude": target_lng,
            "location_name": a.disaster.location.location_name if (a.disaster and a.disaster.location) else None
        },
        "distance_km": dist_km,
        "distance_basis": "STRAIGHT_LINE" if dist_km is not None else None,
        "eta_minutes": eta,
        "routing_available": False
    }

# 7. Delivery Confirmation by Rescue Squad on Scene
@router.post("/responder/deliveries/{delivery_id}/confirm")
def confirm_delivery_receipt(
    delivery_id: int,
    data: DeliveryConfirmRequest,
    current_user: UserAccount = Depends(require_role(RESPONDER_ROLES)),
    db: Session = Depends(get_db)
):
    deliv = db.query(Delivery).filter(Delivery.delivery_id == delivery_id).first()
    if not deliv:
        raise HTTPException(status_code=404, detail="Delivery record not found")

    assignment = db.query(TeamAssignment).filter(
        TeamAssignment.disaster_id == deliv.disaster_id,
        TeamAssignment.assignment_status.notin_(["COMPLETED", "CANCELLED"])
    ).first()
    responder_team = get_responder_team(db, current_user)
    if not assignment or not responder_team or assignment.team_id != responder_team.team_id:
        raise HTTPException(status_code=403, detail="Delivery is not assigned to your response team")

    items = db.query(DeliveryItem).filter(DeliveryItem.delivery_id == delivery_id).all()
    if len(items) != 1:
        raise HTTPException(status_code=400, detail="Use the delivery receipt workflow for this shipment's itemized quantities")
    WorkflowService.confirm_delivery(
        db=db,
        delivery_id=delivery_id,
        user=current_user,
        quantity_received=items[0].quantity_dispatched,
        quantity_damaged=0,
        receiver_name=data.receiver_name or current_user.full_name,
        proof_note=data.proof_of_delivery_note
    )
    return {"success": True, "message": "Delivery receipt confirmed on scene. Relief distribution logged."}

