from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.schema import ResponseTeam, TeamAssignment, Agency, UserAccount
from app.schemas.dtos import TeamAssignmentCreate, TeamStatusUpdate
from app.auth.security import get_current_user, require_role
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/teams", tags=["Tactical Field Teams & Missions"])

@router.get("")
def list_teams(
    readiness_filter: Optional[str] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ResponseTeam)
    if readiness_filter:
        query = query.filter(ResponseTeam.readiness_status == readiness_filter.upper())
    teams = query.all()

    results = []
    for t in teams:
        results.append({
            "team_id": t.team_id,
            "team_name": t.team_name,
            "agency_name": t.agency.agency_name if t.agency else "Emergency Services",
            "specialization": t.specialization,
            "leader_name": t.leader_name,
            "contact_phone": t.contact_phone,
            "capacity": t.capacity,
            "readiness_status": t.readiness_status
        })
    return {"success": True, "count": len(results), "teams": results}

@router.post("/assign", status_code=status.HTTP_201_CREATED)
def assign_team(
    assign_in: TeamAssignmentCreate,
    current_user: UserAccount = Depends(require_role(["DISASTER_OFFICER"])),
    db: Session = Depends(get_db)
):
    """
    Stage 6: Assign Response Team
    """
    assignment = WorkflowService.assign_response_team(
        db=db,
        disaster_id=assign_in.disaster_id,
        team_id=assign_in.team_id,
        officer=current_user
    )
    return {
        "success": True,
        "message": "Tactical response squad successfully assigned to incident.",
        "assignment_id": assignment.assignment_id,
        "status": assignment.assignment_status,
        "assigned_at": assignment.assigned_at
    }

@router.patch("/assignments/{assignment_id}/status")
def update_assignment_status(
    assignment_id: int,
    status_in: TeamStatusUpdate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stage 6: Team Mission Lifecycle Transition
    ASSIGNED -> ACKNOWLEDGED -> EN_ROUTE -> ON_SCENE -> COMPLETED
    """
    assignment = WorkflowService.update_team_status(
        db=db,
        assignment_id=assignment_id,
        user=current_user,
        new_status=status_in.new_status.upper(),
        notes=status_in.notes
    )
    return {
        "success": True,
        "message": f"Team status advanced to {assignment.assignment_status}.",
        "assignment_id": assignment.assignment_id,
        "new_status": assignment.assignment_status
    }

@router.get("/assignments")
def list_assignments(
    disaster_id: Optional[int] = None,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(TeamAssignment)
    if disaster_id:
        query = query.filter(TeamAssignment.disaster_id == disaster_id)
    assignments = query.order_by(TeamAssignment.assigned_at.desc()).all()

    results = []
    for a in assignments:
        results.append({
            "assignment_id": a.assignment_id,
            "disaster_id": a.disaster_id,
            "disaster_name": a.disaster.disaster_name if a.disaster else "Emergency",
            "team_id": a.team_id,
            "team_name": a.team.team_name if a.team else "Squad",
            "specialization": a.team.specialization if a.team else "Rescue",
            "status": a.assignment_status,
            "assigned_at": a.assigned_at,
            "acknowledged_at": a.acknowledged_at,
            "en_route_at": a.en_route_at,
            "on_scene_at": a.on_scene_at,
            "completed_at": a.completed_at
        })
    return {"success": True, "count": len(results), "assignments": results}
