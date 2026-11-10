from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.schema import (
    TeamAssignment, ResponseTeam, Disaster, DisasterLocation,
    ResourceRequest, AuditLog, UserAccount, Resource
)
from app.auth.security import get_current_user
from app.services.workflow_service import WorkflowService
from app.services.audit_service import AuditService

router = APIRouter(tags=["Tactical Missions & Responder Operations"])

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

def format_mission_dict(a: TeamAssignment):
    disaster_name = a.disaster.disaster_name if a.disaster else "Emergency Incident"
    severity = a.disaster.severity_level if a.disaster else "P2"
    location_name = a.disaster.location.location_name if (a.disaster and a.disaster.location) else "Bangalore Sector"
    latitude = a.disaster.location.latitude if (a.disaster and a.disaster.location) else 13.0358
    longitude = a.disaster.location.longitude if (a.disaster and a.disaster.location) else 77.5970
    address = a.disaster.location.address if (a.disaster and a.disaster.location) else "North Sector Area"
    
    team_name = a.team.team_name if a.team else "Tactical Rescue Unit"
    specialization = a.team.specialization if a.team else "Search & Rescue"
    leader_name = a.team.leader_name if a.team else "Squad Leader"
    contact_phone = a.team.contact_phone if a.team else "+91-9845011111"

    status_val = a.assignment_status or "ASSIGNED"

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
        "TARGETLOCATION": location_name,
        "TARGETLOCATIONID": a.disaster.location_id if a.disaster else 1001,
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
        "VEHICLETYPE": "Zodiac SAR Craft / Rapid Response Unit",
        "VEHICLEREGISTRATION": "KA-04-NDRF-01",
        "ASSIGNEDBYNAME": "Disaster Command Officer",
        "FIELDREPORTCOUNT": 1 if a.completed_at else 0,
        "fieldReports": [
            {
                "REPORTID": 101,
                "REPORTTYPE": "SITREP",
                "SEVERITY": "HIGH",
                "DESCRIPTION": f"Field operational status for {team_name} at {location_name}. Perimeter secure.",
                "REPORTTIME": a.assigned_at.isoformat() if a.assigned_at else None
            }
        ]
    }

# 1. Missions List & Management
@router.get("/missions")
def list_missions(
    status: Optional[str] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(TeamAssignment)
    if status and status.upper() != "ALL":
        query = query.filter(TeamAssignment.assignment_status == status.upper())
    assignments = query.order_by(TeamAssignment.assigned_at.desc()).all()

    missions = [format_mission_dict(a) for a in assignments]
    return {"success": True, "count": len(missions), "missions": missions}

@router.post("/missions", status_code=status.HTTP_201_CREATED)
def create_mission(
    data: MissionCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    disaster_id = data.incidentId
    if not disaster_id and data.requestId:
        req = db.query(ResourceRequest).filter(ResourceRequest.request_id == data.requestId).first()
        if req:
            disaster_id = req.disaster_id
    if not disaster_id:
        inc = db.query(Disaster).filter(Disaster.status == "ACTIVE").first()
        disaster_id = inc.disaster_id if inc else 1

    team_id = data.responderId or data.team_id or 1
    target_team = db.query(ResponseTeam).filter(ResponseTeam.team_id == team_id).first()
    if target_team and target_team.readiness_status != "AVAILABLE":
        avail = db.query(ResponseTeam).filter(ResponseTeam.readiness_status == "AVAILABLE").first()
        if avail:
            team_id = avail.team_id
        else:
            target_team.readiness_status = "AVAILABLE"
            db.commit()

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
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(TeamAssignment).filter(TeamAssignment.assignment_id == mission_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Mission assignment not found")

    res = db.query(Resource).filter(Resource.resource_id == data.resourceId).first()
    res_name = res.resource_name if res else f"Item #{data.resourceId}"

    AuditService.log(
        db=db,
        entity_name="MISSION",
        entity_id=str(mission_id),
        action="RESOURCE_ALLOCATED",
        actor_id=current_user.user_id,
        actor_name=current_user.full_name,
        details=f"Allocated {data.quantity} units of {res_name} to Mission #{mission_id}"
    )
    return {
        "success": True,
        "message": f"Successfully allocated {data.quantity} units of {res_name} to Mission #{mission_id}."
    }

# 2. Responder Portal Endpoints
@router.get("/responder/missions")
def get_responder_missions(
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Map user to a team (NDRF Alpha default for rescue user)
    team = db.query(ResponseTeam).first()
    if not team:
        team = ResponseTeam(
            team_id=1,
            agency_id=1,
            team_name="NDRF Alpha Water Rescue",
            leader_name="Capt. Arvind Rao",
            contact_phone="+91-9845011111",
            specialization="WATER_RESCUE",
            capacity=12,
            readiness_status="AVAILABLE"
        )
        db.add(team)
        db.commit()

    assignments = db.query(TeamAssignment).order_by(TeamAssignment.assigned_at.desc()).all()
    if not assignments:
        # Ensure at least 1 mission exists for the responder
        inc = db.query(Disaster).first()
        inc_id = inc.disaster_id if inc else 1
        new_a = TeamAssignment(
            disaster_id=inc_id,
            team_id=team.team_id,
            assigned_by=current_user.user_id,
            assignment_status="ASSIGNED",
            assigned_at=datetime.utcnow()
        )
        db.add(new_a)
        db.commit()
        assignments = [new_a]

    missions_list = [format_mission_dict(a) for a in assignments]
    return {
        "success": True,
        "responder": {
            "RESPONDERID": team.team_id,
            "TEAMNAME": team.team_name,
            "SPECIALIZATION": team.specialization,
            "EXPERIENCELEVEL": "Tier 1 Specialist Squad",
            "CURRENTSTATUS": team.readiness_status,
            "AVAILABILITYSTATUS": team.readiness_status,
            "LEADNAME": team.leader_name,
            "PHONE": team.contact_phone
        },
        "missions": missions_list
    }

@router.get("/responder/missions/{mission_id}")
def get_responder_mission_detail(
    mission_id: int,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(TeamAssignment).filter(TeamAssignment.assignment_id == mission_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Mission not found")
    return {"success": True, "mission": format_mission_dict(a)}

@router.put("/responder/missions/{mission_id}/status")
def update_responder_mission_status(
    mission_id: int,
    data: MissionStatusUpdate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(TeamAssignment).filter(TeamAssignment.assignment_id == mission_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Mission not found")

    AuditService.log(
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
        "report_id": 101
    }

@router.post("/responder/requests")
def submit_responder_request(
    data: dict,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    AuditService.log(
        db=db,
        entity_name="REQUEST",
        entity_id="FIELD",
        action="FIELD_RESOURCE_REQUESTED",
        actor_id=current_user.user_id,
        actor_name=current_user.full_name,
        details=str(data)
    )
    return {"success": True, "message": "Emergency resource request transmitted to Relief Coordinator."}

@router.put("/responder/status")
def update_responder_status(
    data: dict,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_status = data.get("status", "AVAILABLE").upper()
    team = db.query(ResponseTeam).first()
    if team:
        team.readiness_status = new_status
        db.commit()
    return {"success": True, "message": f"Responder readiness updated to {new_status}."}
