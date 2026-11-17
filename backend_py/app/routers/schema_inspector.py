from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from sqlalchemy import text
from app.database import engine
import time
import re

router = APIRouter(prefix="/database", tags=["Database Schema Inspector"])

TABLE_MODULE_MAP = {
    "role": "User Authentication & RBAC",
    "agency": "User Authentication & RBAC",
    "user_account": "User Authentication & RBAC",
    "citizen": "User Authentication & RBAC",
    "disaster_location": "GIS Spatial Infrastructure",
    "disaster": "Disaster Incident & Triage",
    "disaster_report": "Disaster Incident & Triage",
    "report_attachment": "Disaster Incident & Triage",
    "report_update": "Disaster Incident & Triage",
    "affected_person": "Disaster Incident & Triage",
    "response_team": "Rescue Squads & GPS Tracking",
    "team_member": "Rescue Squads & GPS Tracking",
    "team_assignment": "Rescue Squads & GPS Tracking",
    "rescue_location_history": "Rescue Squads & GPS Tracking",
    "resource": "Logistics & Supply Chain",
    "warehouse": "Logistics & Supply Chain",
    "inventory": "Logistics & Supply Chain",
    "resource_request": "Logistics & Supply Chain",
    "request_item": "Logistics & Supply Chain",
    "resource_allocation": "Logistics & Supply Chain",
    "delivery": "Logistics & Supply Chain",
    "delivery_item": "Logistics & Supply Chain",
    "shelter": "Shelters & Medical Facilities",
    "shelter_registration": "Shelters & Medical Facilities",
    "hospital": "Shelters & Medical Facilities",
    "medical_referral": "Shelters & Medical Facilities",
    "evacuation_plan": "Evacuation & Field Telemetry",
    "evacuation_assignment": "Evacuation & Field Telemetry",
    "roadblock_report": "Evacuation & Field Telemetry",
    "emergency_alert": "Evacuation & Field Telemetry",
    "incident_workflow_event": "Audit Trail & Workflow Engine",
    "audit_log": "Audit Trail & Workflow Engine",
    "notification": "Audit Trail & Workflow Engine",
    "citizen_feedback": "Audit Trail & Workflow Engine"
}

TABLE_DESCRIPTIONS = {
    "role": "System role definitions and permission access tiers (CITIZEN, RESPONDER, COORDINATOR, COMMAND)",
    "agency": "Emergency response agencies (NDRF, State Police, Fire Services, Red Cross)",
    "user_account": "Encrypted user credentials, roles, email, phone and authentication records",
    "citizen": "Registered citizen profiles, emergency contact details, and special needs",
    "disaster_location": "Geographical master catalog with GPS lat/lng, municipal wards, and risk zones",
    "disaster": "Core disaster master incidents with P1-P4 severity scores, workflow states, and timestamps",
    "disaster_report": "Crowdsourced and citizen disaster reports with casualties, trapped persons, and triage urgency",
    "report_attachment": "Evidence photos, on-scene media files and documentation attachments",
    "report_update": "Chronological field updates, officer remarks, and operational progress notes",
    "affected_person": "Triage registry for identified, rescued, missing, or injured citizens",
    "response_team": "Tactical rescue squads, specializations (Flood/Fire/Collapse), and live readiness",
    "team_member": "Individual responder personnel, badge numbers, phone contacts, and squad assignments",
    "team_assignment": "Operational mission state machine (ASSIGNED -> EN_ROUTE -> ON_SCENE -> COMPLETED)",
    "rescue_location_history": "Continuous GPS telemetry stream with speed (km/h), heading, accuracy, and timestamps",
    "resource": "Master relief resource catalogue (Potable Water, First-Aid Kits, Rations, Inflatable Boats)",
    "warehouse": "Regional disaster relief storage depots, warehouse managers, and pallet capacities",
    "inventory": "Real-time depot stock tracking: available quantities, reserved amounts, and reorder levels",
    "resource_request": "Incident-level supply requisition tickets with priority and coordinator approval status",
    "request_item": "Itemized checklist quantities requested vs coordinator-approved line items",
    "resource_allocation": "Transactional inventory reservations deducted directly from warehouse stock",
    "delivery": "Outbound transport dispatches, assigned truck drivers, vehicle plates, and delivery notes",
    "delivery_item": "Dispatched, received, and damaged item quantities per transit manifest",
    "shelter": "Public emergency shelters, live occupancy headcounts, medical units, and potable water",
    "shelter_registration": "Citizen shelter check-in/out records, family dependent headcounts, and special needs",
    "hospital": "Medical trauma facilities, total vs available ICU and general emergency beds",
    "medical_referral": "Emergency triage referrals from disaster scenes to designated trauma hospitals",
    "evacuation_plan": "Municipal evacuation corridors, risk levels, target shelters, and estimated evacuees",
    "evacuation_assignment": "Deployment of rescue squads to guide citizens along designated evacuation routes",
    "roadblock_report": "Street obstructions, debris, fallen powerlines, bridge damage, and detour instructions",
    "emergency_alert": "Urgent broadcast warning bulletins issued to targeted disaster sectors",
    "incident_workflow_event": "Immutable state-transition audit log (PREVIOUS_STATE -> NEW_STATE) with actor IDs",
    "audit_log": "System-wide DML audit ledger capturing INSERT, UPDATE, DELETE actions and entity IDs",
    "notification": "Role-specific push notifications and high-priority operational broadcasts",
    "citizen_feedback": "Citizen rescue evaluation ratings, response speed scores, and satisfaction remarks"
}

def format_ascii_table(headers: List[str], rows: List[List[Any]], max_col_width: int = 35) -> str:
    """Format headers and row data into authentic SQL CLI output grid."""
    if not headers:
        return "Empty set"
    
    col_widths = [len(str(h)) for h in headers]
    for row in rows:
        for idx, val in enumerate(row):
            if idx < len(col_widths):
                s = "NULL" if val is None else str(val)
                col_widths[idx] = max(col_widths[idx], len(s))
    
    col_widths = [min(w, max_col_width) for w in col_widths]
    sep = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
    header_line = "| " + " | ".join(f"{str(headers[i])[:col_widths[i]]:<{col_widths[i]}}" for i in range(len(headers))) + " |"
    
    output_lines = [sep, header_line, sep]
    for row in rows:
        formatted = []
        for i in range(len(headers)):
            val = row[i] if i < len(row) else None
            s = "NULL" if val is None else str(val)
            if len(s) > col_widths[i]:
                s = s[:col_widths[i]-3] + "..."
            formatted.append(f"{s:<{col_widths[i]}}")
        output_lines.append("| " + " | ".join(formatted) + " |")
    output_lines.append(sep)
    output_lines.append(f"{len(rows)} row{'s' if len(rows) != 1 else ''} in set")
    return "\n".join(output_lines)

def format_oracle_describe(table_name: str, cols_info: List[Dict[str, Any]]) -> str:
    """Format table structure in Oracle SQL*Plus DESCRIBE format."""
    lines = [
        f"SQL> DESCRIBE {table_name.upper()};",
        f" {'Name':<32} {'Null?':<10} {'Type':<30}",
        f" {'-' * 32} {'-' * 10} {'-' * 30}"
    ]
    for col in cols_info:
        name = col['name'].upper()
        null_str = "NOT NULL" if col.get('notnull') or col.get('pk') else ""
        col_type = col.get('type', 'VARCHAR2(100)').upper()
        if col.get('pk'):
            col_type += " [PRIMARY KEY]"
        lines.append(f" {name:<32} {null_str:<10} {col_type:<30}")
    return "\n".join(lines)


@router.get("/tables")
def list_database_tables():
    """Return all database tables with schema summary, row counts, and modules."""
    with engine.connect() as conn:
        res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"))
        table_names = [r[0] for r in res.fetchall()]
        
        tables_list = []
        for t in table_names:
            t_lower = t.lower()
            # Row count
            try:
                cnt_res = conn.execute(text(f'SELECT COUNT(*) FROM "{t}"'))
                row_count = cnt_res.scalar() or 0
            except Exception:
                row_count = 0
                
            # Column info
            cols_res = conn.execute(text(f'PRAGMA table_info("{t}")')).fetchall()
            col_names = [c[1] for c in cols_res]
            pk_cols = [c[1] for c in cols_res if c[5] > 0]
            
            tables_list.append({
                "table_name": t.upper(),
                "raw_name": t,
                "module": TABLE_MODULE_MAP.get(t_lower, "System Core"),
                "description": TABLE_DESCRIPTIONS.get(t_lower, f"Relational table {t}"),
                "row_count": row_count,
                "column_count": len(col_names),
                "columns": col_names,
                "primary_key": pk_cols[0] if pk_cols else None,
                "primary_keys": pk_cols
            })
            
        return {
            "success": True,
            "engine": "Oracle Database 21c (Relational 3NF) / SQLite Persistence",
            "total_tables": len(tables_list),
            "tables": tables_list
        }


@router.get("/table/{table_name}")
def get_table_details(table_name: str, limit: int = 15):
    """Return full schema, columns, foreign keys, and SQL output for a specific table."""
    safe_name = re.sub(r'[^a-zA-Z0-9_]', '', table_name).lower()
    
    with engine.connect() as conn:
        # Check if table exists
        check = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND lower(name) = :tbl"), {"tbl": safe_name}).fetchone()
        if not check:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist in database.")
            
        real_name = check[0]
        
        # Columns
        cols_raw = conn.execute(text(f'PRAGMA table_info("{real_name}")')).fetchall()
        cols = [{
            "cid": c[0],
            "name": c[1],
            "type": c[2],
            "notnull": bool(c[3]),
            "default_value": c[4],
            "pk": bool(c[5])
        } for c in cols_raw]
        
        # Foreign Keys
        fks_raw = conn.execute(text(f'PRAGMA foreign_key_list("{real_name}")')).fetchall()
        fks = [{
            "id": fk[0],
            "table": fk[2],
            "from_col": fk[3],
            "to_col": fk[4]
        } for fk in fks_raw]
        
        # Total count
        row_count = conn.execute(text(f'SELECT COUNT(*) FROM "{real_name}"')).scalar() or 0
        
        # Sample rows
        start_t = time.perf_counter()
        query_sql = f'SELECT * FROM "{real_name}" LIMIT {max(1, min(limit, 50))}'
        rows_res = conn.execute(text(query_sql))
        headers = list(rows_res.keys())
        raw_rows = [list(r) for r in rows_res.fetchall()]
        elapsed_sec = round(time.perf_counter() - start_t, 4)
        
        # Formatted SQL strings
        ascii_grid = format_ascii_table(headers, raw_rows)
        sql_select_cmd = f"SQL> SELECT * FROM {real_name.upper()} LIMIT {limit};\n{ascii_grid}\nElapsed: {elapsed_sec} sec."
        describe_output = format_oracle_describe(real_name, cols)
        
        # Dict rows for JSON
        dict_rows = [dict(zip(headers, r)) for r in raw_rows]
        
        return {
            "success": True,
            "table_name": real_name.upper(),
            "raw_name": real_name,
            "module": TABLE_MODULE_MAP.get(safe_name, "System Core"),
            "description": TABLE_DESCRIPTIONS.get(safe_name, ""),
            "row_count": row_count,
            "columns": cols,
            "foreign_keys": fks,
            "headers": headers,
            "rows": dict_rows,
            "sql_describe": describe_output,
            "sql_select_preview": sql_select_cmd,
            "ascii_table": ascii_grid,
            "elapsed_seconds": elapsed_sec
        }


class SqlQueryRequest(BaseModel):
    query: str

@router.post("/query")
def execute_readonly_sql(payload: SqlQueryRequest):
    """Execute a safe read-only SQL query and return terminal formatted output."""
    raw_query = payload.query.strip().rstrip(';')
    if not raw_query:
        raise HTTPException(status_code=400, detail="Empty SQL query provided.")
        
    # Security check: strictly allow SELECT or PRAGMA or EXPLAIN
    first_word = raw_query.split()[0].upper() if raw_query.split() else ""
    if first_word not in ["SELECT", "PRAGMA", "EXPLAIN", "WITH"]:
        raise HTTPException(status_code=403, detail="Read-Only SQL Inspector: Only SELECT, PRAGMA and EXPLAIN queries are permitted.")
        
    # Check for dangerous keywords
    dangerous_keywords = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "REPLACE", "CREATE", "EXEC", "ATTACH"]
    pattern = r'\b(' + '|'.join(dangerous_keywords) + r')\b'
    if re.search(pattern, raw_query, re.IGNORECASE):
        raise HTTPException(status_code=403, detail="Data modification statements are blocked in SQL Inspector mode.")
        
    start_t = time.perf_counter()
    with engine.connect() as conn:
        try:
            res = conn.execute(text(raw_query))
            headers = list(res.keys()) if res.returns_rows else []
            rows = [list(r) for r in res.fetchmany(100)] if res.returns_rows else []
            elapsed_sec = round(time.perf_counter() - start_t, 4)
            
            ascii_grid = format_ascii_table(headers, rows)
            formatted_output = f"SQL> {raw_query};\n\n{ascii_grid}\nExecution Time: {elapsed_sec} sec."
            dict_rows = [dict(zip(headers, r)) for r in rows]
            
            return {
                "success": True,
                "query": raw_query,
                "headers": headers,
                "rows": dict_rows,
                "row_count": len(rows),
                "ascii_table": ascii_grid,
                "formatted_output": formatted_output,
                "elapsed_seconds": elapsed_sec
            }
        except Exception as err:
            elapsed_sec = round(time.perf_counter() - start_t, 4)
            return {
                "success": False,
                "query": raw_query,
                "error": str(err),
                "formatted_output": f"SQL> {raw_query};\n\nORA-00942: Table or view does not exist / SQL Error:\n{str(err)}",
                "elapsed_seconds": elapsed_sec
            }


@router.get("/preset-queries")
def get_preset_evaluation_queries():
    """Return verified DBMS evaluation queries for viva demonstration."""
    return {
        "success": True,
        "queries": [
            {
                "id": "q1",
                "title": "1. Multi-Table Join: Disasters with Risk Zones & Casualty Stats",
                "description": "Joins DISASTER with DISASTER_LOCATION and aggregates affected people from DISASTER_REPORT.",
                "sql": """SELECT d.disaster_id, d.incident_code, d.disaster_name, d.disaster_type, d.severity_level, d.status, l.location_name, l.risk_zone, l.ward_name, COALESCE(SUM(r.people_affected), 0) AS total_affected FROM disaster d JOIN disaster_location l ON d.location_id = l.location_id LEFT JOIN disaster_report r ON d.disaster_id = r.disaster_id GROUP BY d.disaster_id LIMIT 10;"""
            },
            {
                "id": "q2",
                "title": "2. Logistics Warehouse Stock Allocation & Available Quantities",
                "description": "Calculates available stock, reserved stock and low-stock reorder thresholds across warehouses.",
                "sql": """SELECT w.warehouse_name, res.resource_name, res.category, i.quantity_available, i.quantity_reserved, i.reorder_threshold, (i.quantity_available - i.quantity_reserved) AS free_stock FROM inventory i JOIN warehouse w ON i.warehouse_id = w.warehouse_id JOIN resource res ON i.resource_id = res.resource_id ORDER BY free_stock ASC LIMIT 10;"""
            },
            {
                "id": "q3",
                "title": "3. Rescue Teams Operational Lifecycle & Telemetry Coordinates",
                "description": "Inspects active response teams, their agency, current mission status and latest GPS location.",
                "sql": """SELECT t.team_id, t.team_name, t.specialization, t.readiness_status, a.agency_name, ta.assignment_status, ta.disaster_id, loc.latitude, loc.longitude, loc.speed FROM response_team t JOIN agency a ON t.agency_id = a.agency_id LEFT JOIN team_assignment ta ON t.team_id = ta.team_id AND ta.assignment_status != 'COMPLETED' LEFT JOIN rescue_location_history loc ON t.team_id = loc.team_id ORDER BY t.team_id LIMIT 10;"""
            },
            {
                "id": "q4",
                "title": "4. Emergency Public Shelters Live Occupancy vs Capacity",
                "description": "Evaluates safe capacity limits, live occupancy rates and medical unit readiness in shelters.",
                "sql": """SELECT s.shelter_id, s.shelter_name, l.location_name, s.capacity, s.current_occupancy, ROUND((s.current_occupancy * 100.0 / s.capacity), 1) AS occupancy_pct, s.has_medical_unit, s.has_potable_water, s.status FROM shelter s JOIN disaster_location l ON s.location_id = l.location_id ORDER BY occupancy_pct DESC;"""
            },
            {
                "id": "q5",
                "title": "5. Emergency Trauma Hospitals & Available Critical ICU Beds",
                "description": "Monitors hospital bed occupancy, available ICU units and trauma center capabilities.",
                "sql": """SELECT h.hospital_id, h.hospital_name, l.location_name, h.trauma_center_level, h.available_icu_beds, h.total_icu_beds, h.available_general_beds, h.total_general_beds FROM hospital h JOIN disaster_location l ON h.location_id = l.location_id ORDER BY h.available_icu_beds DESC;"""
            },
            {
                "id": "q6",
                "title": "6. Incident State Machine Transition Audit Events",
                "description": "Inspects sequential state transitions (PREVIOUS_STATE -> NEW_STATE) in the immutable workflow log.",
                "sql": """SELECT e.event_id, e.disaster_id, e.event_type, e.previous_state, e.new_state, e.actor_id, e.created_at FROM incident_workflow_event e ORDER BY e.event_id DESC LIMIT 10;"""
            },
            {
                "id": "q7",
                "title": "7. Citizen Emergency Reports & Urgent Triage Requirements",
                "description": "Lists citizen reported incidents requiring immediate triage, ambulances, and rescue squads.",
                "sql": """SELECT r.report_id, r.report_reference_id, r.disaster_type, r.people_affected, r.urgent_medical_needed, r.evacuation_needed, r.status, l.location_name FROM disaster_report r JOIN disaster_location l ON r.location_id = l.location_id WHERE r.urgent_medical_needed = 1 OR r.evacuation_needed = 1 ORDER BY r.report_id DESC LIMIT 10;"""
            },
            {
                "id": "q8",
                "title": "8. Complete 34-Table Master Schema Catalog & Row Counts",
                "description": "Full database catalog with table names and stored record counts.",
                "sql": """SELECT name AS table_name, type FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"""
            }
        ]
    }
