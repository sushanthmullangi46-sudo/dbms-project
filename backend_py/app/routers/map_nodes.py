from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import (
    DisasterLocation, Disaster, DisasterReport, Warehouse, Shelter, ResponseTeam, Hospital
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

    # 5. Citizen Disaster Reports Layer
    reports = db.query(DisasterReport).all()
    rep_markers = [
        {
            "id": r.report_id,
            "ref": r.report_reference_id,
            "title": f"{r.disaster_type} ({r.report_reference_id})",
            "type": r.disaster_type,
            "severity": "CRITICAL" if (r.trapped_persons > 0 or r.urgent_medical_needed) else "HIGH" if (r.injuries_reported > 0) else "MODERATE",
            "status": r.status,
            "peopleAffected": r.people_affected,
            "injuries": r.injuries_reported,
            "trapped": r.trapped_persons,
            "lat": r.location.latitude if r.location else 13.0358,
            "lng": r.location.longitude if r.location else 77.5970,
            "location": r.location.location_name if r.location else "Sector",
            "description": r.description,
            "submitted_at": r.submitted_at
        } for r in reports
    ]

    # 6. Response Teams
    teams = db.query(ResponseTeam).all()
    resp_markers = [
        {
            "id": t.team_id,
            "title": t.team_name,
            "specialization": getattr(t, "specialization", "Search & Rescue"),
            "status": t.readiness_status,
            "phone": getattr(t, "contact_phone", "+91-9845011111"),
            "lat": 13.0358,
            "lng": 77.5970,
            "location": "North Command Hub"
        } for t in teams
    ]

    # 7. Hospitals & Trauma Centers
    hospitals = db.query(Hospital).all()
    hosp_geo_coords = {
        1: (13.0382, 77.5925, "+91-80-6666-9999"),
        2: (13.0538, 77.5941, "+91-80-4342-0100"),
        3: (13.1007, 77.5963, "+91-80-2856-1111"),
        4: (13.0245, 77.5878, "+91-80-2202-4444")
    }
    hosp_markers = []
    for h in hospitals:
        fallback = hosp_geo_coords.get(h.hospital_id, (13.0382, 77.5925, "+91-80-2222-3333"))
        lat = fallback[0] if fallback else (h.location.latitude if h.location else 13.0382)
        lng = fallback[1] if fallback else (h.location.longitude if h.location else 77.5925)
        phone = fallback[2] if fallback else "+91-80-2222-3333"
        hosp_markers.append({
            "id": h.hospital_id,
            "title": h.hospital_name,
            "type": "HOSPITAL",
            "available_icu_beds": h.available_icu_beds,
            "total_icu_beds": h.total_icu_beds,
            "available_general_beds": h.available_general_beds,
            "total_general_beds": h.total_general_beds,
            "trauma_center_level": h.trauma_center_level or "LEVEL_1",
            "phone": phone,
            "status": "OPERATIONAL",
            "lat": lat,
            "lng": lng,
            "location": h.location.location_name if h.location else "Bengaluru Sector"
        })

    return {
        "success": True,
        "nodes": {
            "zones": zones,
            "incidents": inc_markers,
            "reports": rep_markers,
            "shelters": sh_markers,
            "hospitals": hosp_markers,
            "warehouses": wh_markers,
            "responders": resp_markers
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
            "reports": nodes.get("reports", []),
            "shelters": nodes["shelters"],
            "hospitals": nodes.get("hospitals", []),
            "warehouses": nodes["warehouses"],
            "responders": nodes.get("responders", []),
            "zones": nodes["zones"]
        }
    }

