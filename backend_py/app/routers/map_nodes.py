from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import (
    DisasterLocation, Disaster, DisasterReport, Warehouse, Shelter, ResponseTeam
)
from app.auth.security import get_current_user

router = APIRouter(prefix="/map", tags=["Geospatial Leaflet Nodes & Risk Zones"])

@router.get("/nodes")
def get_map_nodes(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns geo-spatial Leaflet coordinates for all operational disaster entities.
    """
    # 1. Locations & Risk Zones
    locations = db.query(DisasterLocation).all()
    zones = [
        {
            "id": l.location_id,
            "name": l.location_name,
            "address": l.address,
            "ward": l.ward_name,
            "lat": l.latitude,
            "lng": l.longitude,
            "risk_zone": l.risk_zone
        } for l in locations
    ]

    # 2. Active Incidents
    incidents = db.query(Disaster).filter(Disaster.status.in_(["ACTIVE", "RESPONSE_IN_PROGRESS"])).all()
    inc_markers = [
        {
            "id": i.disaster_id,
            "code": i.incident_code,
            "title": i.disaster_name,
            "type": i.disaster_type,
            "severity": i.severity_level,
            "status": i.status,
            "lat": i.location.latitude if i.location else 13.0358,
            "lng": i.location.longitude if i.location else 77.5970,
            "location": i.location.location_name if i.location else "Sector"
        } for i in incidents
    ]

    # 3. Shelters
    shelters = db.query(Shelter).all()
    sh_markers = [
        {
            "id": s.shelter_id,
            "title": s.shelter_name,
            "capacity": s.capacity,
            "occupancy": s.current_occupancy,
            "status": s.status,
            "lat": s.location.latitude if s.location else 13.0623,
            "lng": s.location.longitude if s.location else 77.5871,
            "location": s.location.location_name if s.location else "Safe Hub"
        } for s in shelters
    ]

    # 4. Warehouses
    warehouses = db.query(Warehouse).all()
    wh_markers = [
        {
            "id": w.warehouse_id,
            "title": w.warehouse_name,
            "manager": w.manager_name,
            "lat": w.location.latitude if w.location else 13.0358,
            "lng": w.location.longitude if w.location else 77.5970,
            "location": w.location.location_name if w.location else "Depot"
        } for w in warehouses
    ]

    return {
        "success": True,
        "nodes": {
            "zones": zones,
            "incidents": inc_markers,
            "shelters": sh_markers,
            "warehouses": wh_markers
        }
    }

@router.get("/markers")
def get_map_markers_alias(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = get_map_nodes(current_user, db)
    nodes = res["nodes"]
    return {
        "success": True,
        "markers": {
            "incidents": nodes["incidents"],
            "shelters": nodes["shelters"],
            "warehouses": nodes["warehouses"],
            "zones": nodes["zones"]
        }
    }

