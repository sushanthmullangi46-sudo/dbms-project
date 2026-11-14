from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import math
from app.database import get_db
from app.models.schema import ResponseTeam, TeamAssignment, Agency, UserAccount, TeamMember, Disaster
from app.schemas.dtos import TeamAssignmentCreate, TeamStatusUpdate
from app.auth.security import get_current_user, require_role
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
        return 3.2

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

@router.get("/recommendations")
def get_squad_recommendations(
    disaster_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Intelligent Multi-Factor Squad Recommendation Engine.
    Evaluates:
    - Specialization suitability based on disaster type (40%)
    - Operational availability & readiness status (30%)
    - Proximity / GIS Haversine distance (20%)
    - Squad capacity & equipment readiness (10%)
    """
    disaster = None
    target_lat = 13.0358
    target_lon = 77.5970
    disaster_type = "FLOOD"

    if disaster_id:
        disaster = db.query(Disaster).filter(Disaster.disaster_id == disaster_id).first()
        if disaster:
            disaster_type = (disaster.disaster_type or "FLOOD").upper()
            if disaster.location:
                target_lat = disaster.location.latitude
                target_lon = disaster.location.longitude

    teams = db.query(ResponseTeam).all()
    recommendations = []

    # Disaster type to ideal specializations
    spec_map = {
        "FLOOD": ["WATER_RESCUE", "EVACUATION"],
        "FLASH FLOOD": ["WATER_RESCUE", "EVACUATION"],
        "EARTHQUAKE": ["COLLAPSE_SAR", "MEDICAL_TRIAGE"],
        "BUILDING COLLAPSE": ["COLLAPSE_SAR", "MEDICAL_TRIAGE"],
        "FIRE": ["FIRE_FIGHTING", "HAZMAT", "EVACUATION"],
        "HAZMAT": ["HAZMAT", "MEDICAL_TRIAGE"],
        "LANDSLIDE": ["COLLAPSE_SAR", "WATER_RESCUE"]
    }
    preferred_specs = spec_map.get(disaster_type, ["WATER_RESCUE", "COLLAPSE_SAR", "MEDICAL_TRIAGE"])

    for team in teams:
        score = 0
        reasons = []

        # 1. Specialization Match (Max 40)
        team_spec = (team.specialization or "").upper()
        if team_spec == preferred_specs[0]:
            score += 40
            reasons.append(f"Direct tactical match for {disaster_type} ({team.specialization})")
        elif len(preferred_specs) > 1 and team_spec == preferred_specs[1]:
            score += 30
            reasons.append(f"Secondary tactical suitability ({team.specialization})")
        else:
            score += 15
            reasons.append(f"General tactical responder capability ({team.specialization})")

        # 2. Availability (Max 30)
        status_norm = (team.readiness_status or "").upper()
        if status_norm == "AVAILABLE":
            score += 30
            reasons.append("Squad is unassigned and immediately deployable")
        elif status_norm in ["ASSIGNED", "ACKNOWLEDGED"]:
            score += 15
            reasons.append("Squad currently assigned but can be retasked if prioritized")
        else:
            score += 5
            reasons.append("Squad has ongoing mission commitments")

        # 3. Proximity / Distance (Max 20)
        team_lat = getattr(team, 'current_latitude', None) or target_lat + 0.02
        team_lon = getattr(team, 'current_longitude', None) or target_lon + 0.015
        dist_km = haversine_km(target_lat, target_lon, team_lat, team_lon)
        eta_mins = max(3, int(round((dist_km / 35.0) * 60)))

        if dist_km <= 3.0:
            score += 20
            reasons.append(f"Immediate radius ({dist_km} km, ETA ~{eta_mins} mins)")
        elif dist_km <= 7.0:
            score += 14
            reasons.append(f"Medium sector range ({dist_km} km, ETA ~{eta_mins} mins)")
        else:
            score += 8
            reasons.append(f"Extended sector distance ({dist_km} km, ETA ~{eta_mins} mins)")

        # 4. Capacity (Max 10)
        cap = getattr(team, 'capacity', 10) or 10
        if cap >= 10:
            score += 10
            reasons.append(f"Full squad complement ({cap} personnel)")
        else:
            score += 6
            reasons.append(f"Tactical unit complement ({cap} personnel)")

        recommendations.append({
            "team_id": team.team_id,
            "team_name": team.team_name,
            "agency_name": team.agency.agency_name if team.agency else "Emergency Corps",
            "specialization": team.specialization,
            "leader_name": team.leader_name,
            "contact_phone": team.contact_phone,
            "readiness_status": team.readiness_status,
            "match_score_pct": min(100, score),
            "distance_km": dist_km,
            "estimated_eta_minutes": eta_mins,
            "justification": " • ".join(reasons)
        })

    # Sort descending by match score
    recommendations.sort(key=lambda x: x["match_score_pct"], reverse=True)
    return {
        "success": True,
        "disaster_id": disaster_id,
        "disaster_type": disaster_type,
        "recommended_squads": recommendations
    }

@router.get("/{team_id}/members")
def get_team_members(
    team_id: int,
    db: Session = Depends(get_db)
):
    team = db.query(ResponseTeam).filter(ResponseTeam.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Response team not found.")
    
    members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    results = []
    for m in members:
        results.append({
            "member_id": m.member_id,
            "member_name": m.member_name,
            "role_title": m.role_title,
            "badge_number": m.badge_number,
            "contact_phone": m.contact_phone,
            "is_available": m.is_available,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None
        })
    return {"success": True, "team_id": team_id, "team_name": team.team_name, "count": len(results), "members": results}
