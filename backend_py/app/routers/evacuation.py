from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from app.database import get_db
from app.models.schema import EvacuationPlan, EvacuationAssignment, Shelter, ResponseTeam, DisasterLocation, UserAccount
from app.auth.security import get_current_user

router = APIRouter(prefix="/evacuation", tags=["Evacuation Zones & Corridor Orchestration"])

class EvacuationPlanCreate(BaseModel):
    disaster_id: Optional[int] = None
    location_id: int
    zone_name: str
    risk_level: str = "CRITICAL"
    priority: str = "P1"
    target_shelter_id: Optional[int] = None
    instructions: str
    estimated_evacuees: int = 50

class EvacuationAssignCreate(BaseModel):
    team_id: int

class EvacuationProgressUpdate(BaseModel):
    status: str # ASSIGNED, EN_ROUTE, EVACUATING, COMPLETED
    evacuees_transported: int

@router.get("/plans")
def list_evacuation_plans(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(EvacuationPlan)
    if status_filter:
        query = query.filter(EvacuationPlan.evacuation_status == status_filter.upper())
    
    plans = query.order_by(EvacuationPlan.priority.asc(), EvacuationPlan.created_at.desc()).all()
    results = []
    for p in plans:
        # Load assignments
        assignments = db.query(EvacuationAssignment).filter(EvacuationAssignment.plan_id == p.plan_id).all()
        assigned_teams = []
        for a in assignments:
            assigned_teams.append({
                "assignment_id": a.assignment_id,
                "team_id": a.team_id,
                "team_name": a.team.team_name if a.team else f"Team #{a.team_id}",
                "status": a.status,
                "evacuees_transported": a.evacuees_transported
            })

        shelter_data = None
        if p.shelter:
            shelter_data = {
                "shelter_id": p.shelter.shelter_id,
                "shelter_name": p.shelter.shelter_name,
                "capacity": p.shelter.capacity,
                "current_occupancy": p.shelter.current_occupancy,
                "available_space": max(0, p.shelter.capacity - p.shelter.current_occupancy)
            }

        results.append({
            "plan_id": p.plan_id,
            "disaster_id": p.disaster_id,
            "zone_name": p.zone_name,
            "risk_level": p.risk_level,
            "priority": p.priority,
            "target_shelter": shelter_data,
            "instructions": p.instructions,
            "evacuation_status": p.evacuation_status,
            "estimated_evacuees": p.estimated_evacuees,
            "evacuated_count": p.evacuated_count,
            "completion_pct": round((p.evacuated_count / p.estimated_evacuees) * 100, 1) if p.estimated_evacuees > 0 else 100.0,
            "assigned_squads": assigned_teams,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    return {"success": True, "count": len(results), "plans": results}

@router.post("/plans", status_code=status.HTTP_201_CREATED)
def create_evacuation_plan(
    plan_in: EvacuationPlanCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    plan = EvacuationPlan(
        disaster_id=plan_in.disaster_id,
        location_id=plan_in.location_id,
        zone_name=plan_in.zone_name,
        risk_level=plan_in.risk_level.upper(),
        priority=plan_in.priority.upper(),
        target_shelter_id=plan_in.target_shelter_id,
        instructions=plan_in.instructions,
        evacuation_status="ACTIVE",
        estimated_evacuees=plan_in.estimated_evacuees,
        evacuated_count=0,
        created_at=now
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {
        "success": True,
        "message": "Tactical evacuation plan operationalized.",
        "plan_id": plan.plan_id,
        "zone_name": plan.zone_name
    }

@router.post("/plans/{plan_id}/assign-squad")
def assign_squad_to_evacuation(
    plan_id: int,
    assign_in: EvacuationAssignCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(EvacuationPlan).filter(EvacuationPlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Evacuation plan not found.")
    
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    assignment = EvacuationAssignment(
        plan_id=plan_id,
        team_id=assign_in.team_id,
        assigned_at=now,
        status="ASSIGNED",
        evacuees_transported=0
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return {
        "success": True,
        "message": f"Squad assigned to evacuation plan '{plan.zone_name}'.",
        "assignment_id": assignment.assignment_id
    }

@router.patch("/assignments/{assignment_id}/progress")
def update_evacuation_progress(
    assignment_id: int,
    progress_in: EvacuationProgressUpdate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = db.query(EvacuationAssignment).filter(EvacuationAssignment.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Evacuation assignment not found.")
    
    delta = progress_in.evacuees_transported - assignment.evacuees_transported
    assignment.status = progress_in.status.upper()
    assignment.evacuees_transported = progress_in.evacuees_transported

    # Update plan totals
    plan = assignment.plan
    if plan and delta > 0:
        plan.evacuated_count = min(plan.estimated_evacuees, plan.evacuated_count + delta)
        if plan.evacuated_count >= plan.estimated_evacuees:
            plan.evacuation_status = "COMPLETED"
        
        # Also update target shelter occupancy if available
        if plan.shelter:
            plan.shelter.current_occupancy = min(plan.shelter.capacity, plan.shelter.current_occupancy + delta)
            if plan.shelter.current_occupancy >= plan.shelter.capacity:
                plan.shelter.status = "FULL"

    db.commit()
    return {
        "success": True,
        "message": f"Evacuation progress updated: {assignment.evacuees_transported} citizens evacuated.",
        "status": assignment.status
    }

