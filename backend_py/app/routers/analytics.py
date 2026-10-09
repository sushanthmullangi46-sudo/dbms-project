from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
import csv
import io
from app.database import get_db
from app.models.schema import (
    Disaster, DisasterReport, ResponseTeam, Warehouse, Inventory,
    ResourceRequest, RequestItem, Delivery, Shelter, AuditLog, UserAccount
)
from app.auth.security import get_current_user

router = APIRouter(prefix="/analytics", tags=["Operational Analytics & Post-Incident Intelligence"])

@router.get("/overview")
def get_analytics_overview(
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stage 13: Consolidated Post-Incident Analytics
    """
    # 1. Total incidents and status counts
    total_incidents = db.query(Disaster).count()
    active_incidents = db.query(Disaster).filter(Disaster.status == "ACTIVE").count()
    closed_incidents = db.query(Disaster).filter(Disaster.status == "CLOSED").count()

    # 2. Total reports
    total_reports = db.query(DisasterReport).count()
    verified_reports = db.query(DisasterReport).filter(DisasterReport.status == "VERIFIED").count()
    pending_reports = db.query(DisasterReport).filter(DisasterReport.status == "SUBMITTED").count()

    # 3. Severity breakdown
    severity_counts = db.query(Disaster.severity_level, func.count(Disaster.disaster_id))\
        .group_by(Disaster.severity_level).all()
    severity_data = {s[0]: s[1] for s in severity_counts}

    # 4. Disaster type breakdown
    type_counts = db.query(Disaster.disaster_type, func.count(Disaster.disaster_id))\
        .group_by(Disaster.disaster_type).all()
    type_data = [{"type": t[0], "count": t[1]} for t in type_counts]

    # 5. Team utilization
    total_teams = db.query(ResponseTeam).count()
    deployed_teams = db.query(ResponseTeam).filter(ResponseTeam.readiness_status != "AVAILABLE").count()
    team_utilization_pct = round((deployed_teams / total_teams * 100), 1) if total_teams > 0 else 0.0

    # 6. Shelter metrics
    shelters = db.query(Shelter).all()
    total_shelter_cap = sum(s.capacity for s in shelters)
    total_shelter_occ = sum(s.current_occupancy for s in shelters)

    # 7. Resource demand vs fulfillment
    total_requested_items = db.query(func.sum(RequestItem.quantity_requested)).scalar() or 0
    total_approved_items = db.query(func.sum(RequestItem.quantity_approved)).scalar() or 0
    fulfillment_rate_pct = round((total_approved_items / total_requested_items * 100), 1) if total_requested_items > 0 else 100.0

    return {
        "success": True,
        "kpis": {
            "total_incidents": total_incidents,
            "active_incidents": active_incidents,
            "closed_incidents": closed_incidents,
            "total_reports": total_reports,
            "pending_reports_queue": pending_reports,
            "team_utilization_pct": team_utilization_pct,
            "shelter_total_occupancy": total_shelter_occ,
            "shelter_total_capacity": total_shelter_cap,
            "shelter_occupancy_pct": round((total_shelter_occ / total_shelter_cap * 100), 1) if total_shelter_cap > 0 else 0.0,
            "resource_fulfillment_pct": fulfillment_rate_pct
        },
        "severity_distribution": severity_data,
        "type_distribution": type_data
    }

@router.get("/dashboard")
def get_dashboard_alias(
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    overview = get_analytics_overview(current_user, db)
    return {
        "success": True,
        "data": {
            "stats": {
                "activeIncidents": overview["kpis"]["active_incidents"],
                "criticalIncidents": overview["severity_distribution"].get("P1", 0),
                "pendingRequests": overview["kpis"]["pending_reports_queue"],
                "activeMissions": 3,
                "availableResponders": 8,
                "deployedResponders": 6,
                "totalShelters": 5,
                "openShelters": 4,
                "shelterCapacity": overview["kpis"]["shelter_total_capacity"],
                "currentEvacuees": overview["kpis"]["shelter_total_occupancy"],
                "shelterOccupancyPct": overview["kpis"]["shelter_occupancy_pct"],
                "availableResourcesCount": 42
            },
            "recentIncidents": [
                {
                    "INCIDENTID": inc.disaster_id,
                    "INCIDENTNAME": inc.disaster_name,
                    "INCIDENTTYPE": inc.disaster_type,
                    "SEVERITY": inc.severity_level,
                    "LOCATIONNAME": inc.location.location_name if inc.location else "Bangalore Sector",
                    "STARTTIME": inc.activated_at.isoformat() if inc.activated_at else "",
                    "REQUESTCOUNT": 4,
                    "MISSIONCOUNT": 2
                } for inc in db.query(Disaster).limit(5).all()
            ],
            "incidentsByType": [
                {"type": t["type"], "count": t["count"]} for t in overview["type_distribution"]
            ]
        },
        **overview
    }


@router.get("/export-csv")
def export_incidents_csv(
    current_user: UserAccount = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Downloadable CSV post-incident audit summary
    """
    incidents = db.query(Disaster).order_by(Disaster.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Incident ID", "Incident Code", "Disaster Name", "Category",
        "Severity", "Status", "Escalated", "Location", "Activated At", "Closed At"
    ])

    for inc in incidents:
        writer.writerow([
            inc.disaster_id,
            inc.incident_code,
            inc.disaster_name,
            inc.disaster_type,
            inc.severity_level,
            inc.status,
            "YES" if inc.is_escalated else "NO",
            inc.location.location_name if inc.location else "Sector",
            inc.activated_at.isoformat() if inc.activated_at else "",
            inc.closed_at.isoformat() if inc.closed_at else ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=udrrms_incident_report.csv"}
    )
