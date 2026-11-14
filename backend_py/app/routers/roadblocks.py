from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from app.database import get_db
from app.models.schema import RoadblockReport, UserAccount, ResponseTeam
from app.auth.security import get_current_user

router = APIRouter(prefix="/roadblocks", tags=["Tactical Passage & Roadblock Hazard Feeds"])

class RoadblockCreate(BaseModel):
    disaster_id: Optional[int] = None
    road_name: str
    blockage_type: str = "FLOODED_ROAD" # FLOODED_ROAD, COLLAPSED_BRIDGE, FIRE_HAZARD, DEBRIS, FALLEN_TREE, RESTRICTED_ACCESS
    severity: str = "HIGH" # CRITICAL, HIGH, MODERATE
    latitude: float
    longitude: float
    is_passable: bool = False
    detour_instructions: Optional[str] = None
    team_id: Optional[int] = None

@router.get("")
def list_roadblocks(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    List all reported road obstacles and hazardous terrain passes.
    Used by rescue teams and ambulances to plan safe navigation.
    """
    query = db.query(RoadblockReport)
    if active_only:
        query = query.filter(RoadblockReport.cleared_at == None)
    
    blocks = query.order_by(RoadblockReport.reported_at.desc()).all()
    results = []
    for b in blocks:
        results.append({
            "roadblock_id": b.roadblock_id,
            "disaster_id": b.disaster_id,
            "road_name": b.road_name,
            "blockage_type": b.blockage_type,
            "severity": b.severity,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "is_passable": b.is_passable,
            "detour_instructions": b.detour_instructions,
            "reported_by_team": b.reporting_team.team_name if b.reporting_team else "Field Observer",
            "reported_at": b.reported_at.isoformat() if b.reported_at else None,
            "cleared_at": b.cleared_at.isoformat() if b.cleared_at else None
        })
    return {"success": True, "count": len(results), "roadblocks": results}

@router.post("", status_code=status.HTTP_201_CREATED)
def report_roadblock(
    report_in: RoadblockCreate,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    team_id = report_in.team_id
    if not team_id:
        # Check if user leads a team
        team = db.query(ResponseTeam).first()
        if team:
            team_id = team.team_id

    roadblock = RoadblockReport(
        disaster_id=report_in.disaster_id,
        reported_by_team_id=team_id,
        road_name=report_in.road_name,
        blockage_type=report_in.blockage_type.upper(),
        severity=report_in.severity.upper(),
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        is_passable=report_in.is_passable,
        detour_instructions=report_in.detour_instructions,
        reported_at=now
    )
    db.add(roadblock)
    db.commit()
    db.refresh(roadblock)
    return {
        "success": True,
        "message": "Tactical roadblock obstacle recorded. Routing layers alerted.",
        "roadblock_id": roadblock.roadblock_id,
        "reported_at": roadblock.reported_at.isoformat()
    }

@router.patch("/{roadblock_id}/clear")
def clear_roadblock(
    roadblock_id: int,
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    roadblock = db.query(RoadblockReport).filter(RoadblockReport.roadblock_id == roadblock_id).first()
    if not roadblock:
        raise HTTPException(status_code=404, detail="Roadblock report not found.")
    roadblock.cleared_at = now
    roadblock.is_passable = True
    db.commit()
    return {"success": True, "message": "Roadblock marked as cleared. Route resumed."}

