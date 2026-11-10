import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs("FINAL_PROJECT_REPORT", exist_ok=True)

# -------------------------------------------------------------
# 1. SYSTEM ARCHITECTURE DIAGRAM
# -------------------------------------------------------------
def generate_system_architecture():
    fig, ax = plt.subplots(figsize=(16, 11), dpi=300)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 11)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#0f172a')

    # Title Box
    title_box = patches.FancyBboxPatch((1, 9.8), 14, 0.9, boxstyle="round,pad=0.1", fc='#1e293b', ec='#38bdf8', lw=2)
    ax.add_patch(title_box)
    ax.text(8, 10.25, "URBAN DISASTER RELIEF & RESOURCE MANAGEMENT SYSTEM (UDRRMS)", 
            color='#f8fafc', fontsize=16, fontweight='bold', ha='center', va='center')
    ax.text(8, 9.95, "Comprehensive 3-Tier Enterprise Architecture & Operational Flow", 
            color='#94a3b8', fontsize=11, ha='center', va='center')

    # Tier 1: Client Layer
    t1 = patches.FancyBboxPatch((0.8, 7.1), 14.4, 2.3, boxstyle="round,pad=0.15", fc='#1e293b', ec='#3b82f6', lw=1.5)
    ax.add_patch(t1)
    ax.text(1.2, 9.1, "TIER 1: PRESENTATION & CLIENT INTERFACES (React 18 + TailwindCSS + Vite)", 
            color='#60a5fa', fontsize=12, fontweight='bold')

    clients = [
        ("Citizen Portal", "Report submission, GPS tagging,\nrequest tracking & relief maps", 1.2, 7.3, '#10b981'),
        ("Incident Command (Admin)", "Triage queue, report verification,\nresource & team mobilization", 4.9, 7.3, '#f59e0b'),
        ("Tactical Response Unit", "Missions execution, field logs,\nteam readiness & telemetry", 8.6, 7.3, '#ef4444'),
        ("Logistics & Relief Camps", "Warehouse inventory, dispatch manifests,\nshelter occupancy & aid kits", 12.3, 7.3, '#8b5cf6')
    ]
    for title, desc, x, y, col in clients:
        box = patches.FancyBboxPatch((x, y), 2.9, 1.5, boxstyle="round,pad=0.1", fc='#0f172a', ec=col, lw=1.5)
        ax.add_patch(box)
        ax.text(x + 1.45, y + 1.1, title, color='#f8fafc', fontsize=10, fontweight='bold', ha='center')
        ax.text(x + 1.45, y + 0.55, desc, color='#94a3b8', fontsize=7.5, ha='center', va='center')

    # Tier 2: Gateway & Application Tier
    t2 = patches.FancyBboxPatch((0.8, 3.6), 14.4, 3.1, boxstyle="round,pad=0.15", fc='#1e293b', ec='#10b981', lw=1.5)
    ax.add_patch(t2)
    ax.text(1.2, 6.4, "TIER 2: GATEWAY & BACKEND APPLICATION SERVICES (Node Express + FastAPI)", 
            color='#34d399', fontsize=12, fontweight='bold')

    # Node Gateway
    gw_box = patches.FancyBboxPatch((1.2, 3.9), 3.5, 2.2, boxstyle="round,pad=0.1", fc='#0f172a', ec='#34d399', lw=1.5)
    ax.add_patch(gw_box)
    ax.text(2.95, 5.7, "Node.js Express Gateway", color='#f8fafc', fontsize=10.5, fontweight='bold', ha='center')
    ax.text(2.95, 5.35, "Port 5000 (Unified Single-Entry)", color='#34d399', fontsize=8.5, ha='center')
    ax.text(2.95, 4.6, "• Static SPA Asset Delivery\n• Reverse Proxy for /api & /docs\n• Security Headers & Hop Sanitation\n• WebSocket / Live Stream Hub", 
            color='#cbd5e1', fontsize=7.5, ha='center')

    # FastAPI Core
    api_box = patches.FancyBboxPatch((5.1, 3.9), 9.7, 2.2, boxstyle="round,pad=0.1", fc='#0f172a', ec='#10b981', lw=1.5)
    ax.add_patch(api_box)
    ax.text(9.95, 5.7, "FastAPI Core Application Engine (Python 3.11 / Port 8000)", color='#f8fafc', fontsize=10.5, fontweight='bold', ha='center')

    modules = [
        ("Auth & RBAC", "JWT OAuth2\nRole Policies", 5.3, 4.0, '#38bdf8'),
        ("Incidents API", "Verification\nTriage Engine", 7.25, 4.0, '#f59e0b'),
        ("Missions Engine", "Team Dispatch\nField Logging", 9.2, 4.0, '#ef4444'),
        ("Logistics & Camps", "Stock Allocation\nCapacity Tracking", 11.15, 4.0, '#8b5cf6'),
        ("Audit & Notifs", "Immutable Logs\nBroadcasts", 13.1, 4.0, '#10b981')
    ]
    for m_title, m_desc, mx, my, mcol in modules:
        mbox = patches.FancyBboxPatch((mx, my), 1.65, 1.4, boxstyle="round,pad=0.08", fc='#1e293b', ec=mcol, lw=1.2)
        ax.add_patch(mbox)
        ax.text(mx + 0.82, my + 1.05, m_title, color='#f8fafc', fontsize=8, fontweight='bold', ha='center')
        ax.text(mx + 0.82, my + 0.5, m_desc, color='#cbd5e1', fontsize=7, ha='center')

    # Tier 3: Database & Persistence Tier
    t3 = patches.FancyBboxPatch((0.8, 0.4), 14.4, 2.8, boxstyle="round,pad=0.15", fc='#1e293b', ec='#f59e0b', lw=1.5)
    ax.add_patch(t3)
    ax.text(1.2, 2.9, "TIER 3: PERSISTENT RELATIONAL STORAGE & ORM (3NF Normalized SQLite / Oracle 21c DDL)", 
            color='#fbbf24', fontsize=12, fontweight='bold')

    db_groups = [
        ("Auth & Users (4)", "users, roles,\nuser_roles, refresh_tokens", 1.2, 0.7, '#38bdf8'),
        ("Incidents & Media (4)", "incidents, incident_media,\nverifications, status_hist", 4.15, 0.7, '#f59e0b'),
        ("Rescue & Missions (6)", "rescue_teams, members,\nmissions, assignments, logs", 7.1, 0.7, '#ef4444'),
        ("Logistics & Camps (7)", "items, warehouses, ledger,\nrequests, orders, camps, staff", 10.05, 0.7, '#8b5cf6'),
        ("Audit & Alerts (3)", "audit_logs, notifications,\ncitizen_assistance", 13.0, 0.7, '#10b981')
    ]
    for db_t, db_d, dx, dy, dcol in db_groups:
        dbox = patches.FancyBboxPatch((dx, dy), 2.2, 1.8, boxstyle="round,pad=0.1", fc='#0f172a', ec=dcol, lw=1.2)
        ax.add_patch(dbox)
        ax.text(dx + 1.1, dy + 1.4, db_t, color='#f8fafc', fontsize=8.5, fontweight='bold', ha='center')
        ax.text(dx + 1.1, dy + 0.75, db_d, color='#94a3b8', fontsize=7, ha='center', va='center')

    # Connecting arrows
    ax.annotate('', xy=(8, 6.7), xytext=(8, 7.1), arrowprops=dict(arrowstyle="<->", color='#38bdf8', lw=2))
    ax.annotate('', xy=(8, 3.2), xytext=(8, 3.6), arrowprops=dict(arrowstyle="<->", color='#10b981', lw=2))

    plt.tight_layout()
    plt.savefig("FINAL_PROJECT_REPORT/SYSTEM_ARCHITECTURE.png", dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("SYSTEM_ARCHITECTURE.png generated successfully!")

# -------------------------------------------------------------
# 2. COMPLETE WORKFLOW DIAGRAM
# -------------------------------------------------------------
def generate_workflow_diagram():
    fig, ax = plt.subplots(figsize=(16, 12), dpi=300)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.axis('off')

    fig.patch.set_facecolor('#0b1329')
    ax.set_facecolor('#0b1329')

    # Header
    title_box = patches.FancyBboxPatch((1, 10.9), 14, 0.85, boxstyle="round,pad=0.1", fc='#1e293b', ec='#38bdf8', lw=2)
    ax.add_patch(title_box)
    ax.text(8, 11.35, "UDRRMS END-TO-END OPERATIONAL WORKFLOW & LIFECYCLE", 
            color='#f8fafc', fontsize=15, fontweight='bold', ha='center', va='center')
    ax.text(8, 11.05, "13-Stage Operational Cycle: Citizen Reporting -> Command Verification -> Resource Allocation -> Rescue Debrief", 
            color='#94a3b8', fontsize=10, ha='center', va='center')

    stages = [
        # Col 1: Stages 1-4 (Citizen & Ingestion)
        ("Stage 1: Incident Reporting", "Citizen initiates SOS / report with category,\nseverity, description & GPS location", 1.0, 8.8, '#10b981'),
        ("Stage 2: Media & Evidence Ingestion", "Upload photographic proof, affected count,\nimmediate assistance categories", 1.0, 6.4, '#10b981'),
        ("Stage 3: Persistent Database Write", "FastAPI validates payload; writes record to\n'incidents' table with PENDING status", 1.0, 4.0, '#3b82f6'),
        ("Stage 4: Automated Ingestion Alerts", "Audit trigger logs entry; system issues\nalert to Incident Command verification queue", 1.0, 1.6, '#3b82f6'),

        # Col 2: Stages 5-8 (Verification & Command)
        ("Stage 5: Officer Triage & Verification", "Disaster Officer reviews field evidence,\nadjusts severity & confirms authenticity", 5.5, 8.8, '#f59e0b'),
        ("Stage 6: Incident Status Transition", "Report status advances to VERIFIED;\nauto-geocoded marker plotted on Tactical Map", 5.5, 6.4, '#f59e0b'),
        ("Stage 7: Team Mobilization Request", "Command reviews team readiness;\nNDRF/SDRF unit selected based on specialty", 5.5, 4.0, '#ef4444'),
        ("Stage 8: Tactical Mission Deployment", "Mission created; status 'DEPLOYED';\nassignment pushed to Team Leader terminal", 5.5, 1.6, '#ef4444'),

        # Col 3: Stages 9-13 (Logistics, Execution, Debrief)
        ("Stage 9: Team Mission Acceptance", "Rescue team leader accepts mission in field;\ntelemetry status transitions to 'ACTIVE'", 10.0, 8.8, '#ef4444'),
        ("Stage 10: Resource Requisition & Dispatch", "Field team requests medical/food kits;\nWarehouse approves & ledger updates stock", 10.0, 6.4, '#8b5cf6'),
        ("Stage 11: Tactical Field Execution", "Rescue ops, victim extraction, medical triage;\nField progress logs logged with timestamps", 10.0, 4.0, '#8b5cf6'),
        ("Stage 12: Citizen & Camp Notifications", "Status broadcasted to citizen portal;\nEvacuees registered in Relief Camp shelter", 10.0, 1.6, '#10b981'),

        # Col 4: Stage 13 (Completion)
        ("Stage 13: Debrief & Immutable Audit", "Mission closed with 'COMPLETED' status;\nCitizen notified; immutable audit log committed\nto persistent database storage", 10.0, -0.8, '#38bdf8')
    ]

    # Redraw with 3 rows of 4 stages or 2 rows
    # Let's organize into a clean 4 columns x 3 rows grid
    plt.close()
    fig, ax = plt.subplots(figsize=(16, 12), dpi=300)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.axis('off')
    fig.patch.set_facecolor('#0b1329')
    ax.set_facecolor('#0b1329')

    title_box = patches.FancyBboxPatch((1, 10.9), 14, 0.85, boxstyle="round,pad=0.1", fc='#1e293b', ec='#38bdf8', lw=2)
    ax.add_patch(title_box)
    ax.text(8, 11.35, "UDRRMS END-TO-END OPERATIONAL WORKFLOW & LIFECYCLE", 
            color='#f8fafc', fontsize=15, fontweight='bold', ha='center', va='center')
    ax.text(8, 11.05, "13-Stage Operational Cycle: Citizen Reporting -> Command Verification -> Resource Allocation -> Rescue Debrief", 
            color='#94a3b8', fontsize=10, ha='center', va='center')

    flow_nodes = [
        # Row 1: Left to Right (Stages 1-4)
        (1, "Stage 1: Incident Reporting", "Citizen files report\nwith GPS & details", 0.8, 8.5, '#10b981'),
        (2, "Stage 2: Evidence Upload", "Photos, victim count\n& assistance needs", 4.5, 8.5, '#10b981'),
        (3, "Stage 3: Persistent Storage", "FastAPI writes record\nto SQLite database", 8.2, 8.5, '#3b82f6'),
        (4, "Stage 4: Ingestion Alert", "Real-time notification\nto Command Center", 11.9, 8.5, '#3b82f6'),

        # Row 2: Right to Left (Stages 5-8)
        (5, "Stage 5: Admin Verification", "Officer inspects evidence\n& verifies authenticity", 11.9, 5.0, '#f59e0b'),
        (6, "Stage 6: Status Update", "Status -> VERIFIED\nPlotted on live Map", 8.2, 5.0, '#f59e0b'),
        (7, "Stage 7: Team Selection", "NDRF / SDRF team\nmatched by specialty", 4.5, 5.0, '#ef4444'),
        (8, "Stage 8: Mission Deploy", "Tactical mission issued\n& units dispatched", 0.8, 5.0, '#ef4444'),

        # Row 3: Left to Right (Stages 9-13)
        (9, "Stage 9: Mission Acceptance", "Team accepts mission;\nUnit moves to scene", 0.8, 1.5, '#ef4444'),
        (10, "Stage 10: Resource Allocation", "Warehouse stock ledger\ndeducts aid supplies", 4.5, 1.5, '#8b5cf6'),
        (11, "Stage 11: Field Execution", "Rescue, first aid,\nevacuation to camps", 8.2, 1.5, '#8b5cf6'),
        (12, "Stage 12: Citizen Updates", "Citizen app notified;\nCamp occupancy updated", 11.9, 1.5, '#10b981'),
    ]

    for stage_num, title, desc, x, y, col in flow_nodes:
        box = patches.FancyBboxPatch((x, y), 3.2, 1.8, boxstyle="round,pad=0.1", fc='#1e293b', ec=col, lw=2)
        ax.add_patch(box)
        badge = patches.Circle((x + 0.35, y + 1.45), 0.22, fc=col, ec='#ffffff', lw=1)
        ax.add_patch(badge)
        ax.text(x + 0.35, y + 1.45, str(stage_num), color='#ffffff', fontsize=9, fontweight='bold', ha='center', va='center')
        ax.text(x + 1.7, y + 1.45, title, color='#f8fafc', fontsize=9.5, fontweight='bold', ha='center', va='center')
        ax.text(x + 1.6, y + 0.65, desc, color='#cbd5e1', fontsize=8.5, ha='center', va='center')

    # Row 1 arrows ->
    for sx in [4.0, 7.7, 11.4]:
        ax.annotate('', xy=(sx + 0.5, 9.4), xytext=(sx, 9.4),
                    arrowprops=dict(arrowstyle="->", color='#38bdf8', lw=2.5))
    # Down arrow to row 2
    ax.annotate('', xy=(13.5, 6.8), xytext=(13.5, 8.5),
                arrowprops=dict(arrowstyle="->", color='#f59e0b', lw=2.5))
    # Row 2 arrows <-
    for sx in [11.9, 8.2, 4.5]:
        ax.annotate('', xy=(sx - 0.5, 5.9), xytext=(sx, 5.9),
                    arrowprops=dict(arrowstyle="->", color='#f59e0b', lw=2.5))
    # Down arrow to row 3
    ax.annotate('', xy=(2.4, 3.3), xytext=(2.4, 5.0),
                arrowprops=dict(arrowstyle="->", color='#ef4444', lw=2.5))
    # Row 3 arrows ->
    for sx in [4.0, 7.7, 11.4]:
        ax.annotate('', xy=(sx + 0.5, 2.4), xytext=(sx, 2.4),
                    arrowprops=dict(arrowstyle="->", color='#8b5cf6', lw=2.5))

    # Stage 13 Bottom Banner
    st13_box = patches.FancyBboxPatch((2.5, 0.1), 11.0, 0.95, boxstyle="round,pad=0.1", fc='#0f172a', ec='#38bdf8', lw=2)
    ax.add_patch(st13_box)
    badge13 = patches.Circle((3.0, 0.57), 0.22, fc='#38bdf8', ec='#ffffff', lw=1)
    ax.add_patch(badge13)
    ax.text(3.0, 0.57, "13", color='#0f172a', fontsize=9, fontweight='bold', ha='center', va='center')
    ax.text(8.0, 0.7, "Stage 13: Mission Debrief, Resolution & Immutable Audit Archival", 
            color='#38bdf8', fontsize=10.5, fontweight='bold', ha='center')
    ax.text(8.0, 0.35, "Mission completed, final casualty report filed, incident closed, and tamper-proof audit trail committed to DB.", 
            color='#cbd5e1', fontsize=8.5, ha='center')

    plt.tight_layout()
    plt.savefig("FINAL_PROJECT_REPORT/COMPLETE_WORKFLOW.png", dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("COMPLETE_WORKFLOW.png generated successfully!")

# -------------------------------------------------------------
# 3. ER DIAGRAM
# -------------------------------------------------------------
def generate_er_diagram():
    fig, ax = plt.subplots(figsize=(20, 15), dpi=300)
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 15)
    ax.axis('off')

    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#0f172a')

    # Title Box
    title_box = patches.FancyBboxPatch((1, 13.9), 18, 0.9, boxstyle="round,pad=0.1", fc='#1e293b', ec='#38bdf8', lw=2)
    ax.add_patch(title_box)
    ax.text(10, 14.45, "URBAN DISASTER RELIEF & RESOURCE MANAGEMENT SYSTEM (UDRRMS) - RELATIONAL ER DIAGRAM", 
            color='#f8fafc', fontsize=15, fontweight='bold', ha='center', va='center')
    ax.text(10, 14.1, "3NF Normalized Relational Schema: 27 Core Tables Across 5 Functional Domains with Explicit PK/FK Constraints", 
            color='#94a3b8', fontsize=9.5, ha='center', va='center')

    # Schema Tables definition: (title, columns, x, y, width, height, color)
    tables = [
        # Domain 1: Authentication & Users (Top Left)
        ("USERS", ["PK id (VARCHAR/UUID)", "FK role_id (VARCHAR)", "email (VARCHAR UNIQUE)", "full_name (VARCHAR)", "phone (VARCHAR)", "hashed_password (VARCHAR)", "created_at (DATETIME)"], 0.8, 10.8, 3.4, 2.6, '#38bdf8'),
        ("ROLES", ["PK id (VARCHAR)", "name (VARCHAR)", "description (TEXT)", "created_at (DATETIME)"], 4.5, 12.0, 2.7, 1.4, '#38bdf8'),
        ("REFRESH_TOKENS", ["PK id (VARCHAR)", "FK user_id (VARCHAR)", "token_hash (VARCHAR)", "expires_at (DATETIME)"], 4.5, 10.3, 2.7, 1.4, '#38bdf8'),

        # Domain 2: Incidents & Disaster Reporting (Top Center & Right)
        ("INCIDENTS", ["PK id (VARCHAR/UUID)", "FK reported_by (VARCHAR)", "title (VARCHAR)", "category (VARCHAR)", "severity (VARCHAR)", "status (VARCHAR)", "latitude (FLOAT)", "longitude (FLOAT)", "people_affected (INT)", "created_at (DATETIME)"], 7.6, 9.8, 3.7, 3.6, '#f59e0b'),
        ("INCIDENT_MEDIA", ["PK id (VARCHAR)", "FK incident_id (VARCHAR)", "media_type (VARCHAR)", "url (VARCHAR)", "caption (TEXT)"], 11.6, 12.0, 3.0, 1.4, '#f59e0b'),
        ("INCIDENT_VERIFICATIONS", ["PK id (VARCHAR)", "FK incident_id (VARCHAR)", "FK verified_by (VARCHAR)", "verdict (VARCHAR)", "verification_notes (TEXT)"], 11.6, 10.3, 3.0, 1.4, '#f59e0b'),
        ("INCIDENT_STATUS_HISTORY", ["PK id (VARCHAR)", "FK incident_id (VARCHAR)", "FK changed_by (VARCHAR)", "old_status (VARCHAR)", "new_status (VARCHAR)"], 14.9, 10.3, 3.1, 1.4, '#f59e0b'),

        # Domain 3: Rescue Teams & Missions (Middle Band)
        ("RESCUE_TEAMS", ["PK id (VARCHAR)", "name (VARCHAR)", "team_type (VARCHAR)", "status (VARCHAR)", "base_location (VARCHAR)", "max_capacity (INT)", "contact_number (VARCHAR)"], 0.8, 6.2, 3.4, 2.6, '#ef4444'),
        ("TEAM_MEMBERS", ["PK id (VARCHAR)", "FK team_id (VARCHAR)", "name (VARCHAR)", "role (VARCHAR)", "phone (VARCHAR)"], 4.5, 7.4, 2.7, 1.4, '#ef4444'),
        ("TACTICAL_MISSIONS", ["PK id (VARCHAR)", "FK incident_id (VARCHAR)", "FK team_id (VARCHAR)", "mission_code (VARCHAR)", "status (VARCHAR)", "priority (VARCHAR)", "deployment_time (DATETIME)", "completion_time (DATETIME)"], 7.6, 5.8, 3.7, 3.1, '#ef4444'),
        ("MISSION_LOGS", ["PK id (VARCHAR)", "FK mission_id (VARCHAR)", "FK logged_by (VARCHAR)", "log_entry (TEXT)", "logged_at (DATETIME)"], 11.6, 7.4, 3.0, 1.4, '#ef4444'),
        ("MISSION_ASSIGNMENTS", ["PK id (VARCHAR)", "FK mission_id (VARCHAR)", "FK team_id (VARCHAR)", "assigned_role (VARCHAR)", "status (VARCHAR)"], 11.6, 5.7, 3.0, 1.4, '#ef4444'),

        # Domain 4: Logistics, Warehouses & Camps (Bottom Band)
        ("WAREHOUSES", ["PK id (VARCHAR)", "name (VARCHAR)", "location (VARCHAR)", "latitude (FLOAT)", "longitude (FLOAT)", "capacity (INT)"], 0.8, 2.0, 3.4, 2.2, '#8b5cf6'),
        ("INVENTORY_ITEMS", ["PK id (VARCHAR)", "name (VARCHAR)", "category (VARCHAR)", "unit (VARCHAR)", "minimum_threshold (INT)"], 4.5, 3.6, 2.7, 1.6, '#8b5cf6'),
        ("STOCK_LEDGER", ["PK id (VARCHAR)", "FK warehouse_id (VARCHAR)", "FK item_id (VARCHAR)", "quantity_on_hand (INT)", "reserved_quantity (INT)", "last_updated (DATETIME)"], 4.5, 1.7, 2.7, 1.7, '#8b5cf6'),
        ("RESOURCE_REQUESTS", ["PK id (VARCHAR)", "FK incident_id (VARCHAR)", "FK requested_by (VARCHAR)", "status (VARCHAR)", "priority (VARCHAR)", "created_at (DATETIME)"], 7.6, 2.4, 3.7, 2.4, '#8b5cf6'),
        ("ALLOCATION_ORDERS", ["PK id (VARCHAR)", "FK request_id (VARCHAR)", "FK warehouse_id (VARCHAR)", "status (VARCHAR)", "dispatched_at (DATETIME)"], 11.6, 3.6, 3.0, 1.4, '#8b5cf6'),
        ("RELIEF_CAMPS", ["PK id (VARCHAR)", "name (VARCHAR)", "location (VARCHAR)", "capacity (INT)", "current_occupancy (INT)", "latitude (FLOAT)", "longitude (FLOAT)"], 11.6, 1.7, 3.0, 1.7, '#8b5cf6'),

        # Domain 5: Citizen Assistance, Notifications & Audit (Right / Bottom-Right)
        ("CITIZEN_ASSISTANCE", ["PK id (VARCHAR)", "FK citizen_id (VARCHAR)", "assistance_type (VARCHAR)", "urgency (VARCHAR)", "status (VARCHAR)"], 14.9, 5.7, 3.1, 1.4, '#10b981'),
        ("NOTIFICATIONS", ["PK id (VARCHAR)", "FK recipient_id (VARCHAR)", "title (VARCHAR)", "message (TEXT)", "is_read (BOOLEAN)"], 14.9, 3.6, 3.1, 1.4, '#10b981'),
        ("AUDIT_LOGS", ["PK id (VARCHAR)", "FK user_id (VARCHAR)", "action (VARCHAR)", "table_name (VARCHAR)", "record_id (VARCHAR)", "timestamp (DATETIME)"], 14.9, 1.7, 3.1, 1.7, '#10b981'),
    ]

    for tbl_title, cols, tx, ty, tw, th, col in tables:
        # Table container
        card = patches.FancyBboxPatch((tx, ty), tw, th, boxstyle="round,pad=0.08", fc='#1e293b', ec=col, lw=1.5)
        ax.add_patch(card)
        # Header banner
        hdr = patches.Rectangle((tx, ty + th - 0.4), tw, 0.4, fc=col)
        ax.add_patch(hdr)
        ax.text(tx + tw/2, ty + th - 0.2, tbl_title, color='#ffffff', fontsize=8.5, fontweight='bold', ha='center', va='center')
        # Columns
        col_y = ty + th - 0.65
        for col_name in cols:
            is_pk = "PK" in col_name
            is_fk = "FK" in col_name
            text_color = '#38bdf8' if is_pk else ('#fbbf24' if is_fk else '#cbd5e1')
            weight = 'bold' if (is_pk or is_fk) else 'normal'
            ax.text(tx + 0.15, col_y, col_name, color=text_color, fontsize=6.8, fontweight=weight, va='center')
            col_y -= 0.25

    # Cardinality relationship lines & annotations
    connectors = [
        # Users -> Incidents (1:N)
        ((4.2, 11.8), (7.6, 11.5), "1 : N (reported_by)"),
        # Users -> Roles (N:1)
        ((4.2, 12.5), (4.5, 12.5), "N : 1"),
        # Incidents -> Incident Media (1:N)
        ((11.3, 12.3), (11.6, 12.3), "1 : N"),
        # Incidents -> Tactical Missions (1:N)
        ((9.45, 9.8), (9.45, 8.9), "1 : N"),
        # Rescue Teams -> Tactical Missions (1:N)
        ((4.2, 7.5), (7.6, 7.5), "1 : N"),
        # Tactical Missions -> Mission Logs (1:N)
        ((11.3, 8.1), (11.6, 8.1), "1 : N"),
        # Incidents -> Resource Requests (1:N)
        ((9.45, 5.8), (9.45, 4.8), "1 : N"),
        # Resource Requests -> Allocation Orders (1:N)
        ((11.3, 4.0), (11.6, 4.0), "1 : N"),
        # Warehouses -> Stock Ledger (1:N)
        ((4.2, 2.6), (4.5, 2.6), "1 : N"),
    ]

    for p1, p2, label in connectors:
        ax.annotate('', xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="->", color='#94a3b8', lw=1.2, linestyle='--'))
        mid_x = (p1[0] + p2[0]) / 2
        mid_y = (p1[1] + p2[1]) / 2 + 0.12
        ax.text(mid_x, mid_y, label, color='#94a3b8', fontsize=6.5, ha='center', backgroundcolor='#0f172a')

    # Domain legends at bottom
    legends = [
        ("Auth & Access Control", '#38bdf8'),
        ("Disaster Reporting & Verification", '#f59e0b'),
        ("Tactical Teams & Operations", '#ef4444'),
        ("Logistics, Camps & Supplies", '#8b5cf6'),
        ("Citizen Services & Audit", '#10b981')
    ]
    lx = 1.0
    for l_text, l_col in legends:
        box = patches.Rectangle((lx, 0.4), 0.35, 0.25, fc=l_col)
        ax.add_patch(box)
        ax.text(lx + 0.45, 0.52, l_text, color='#cbd5e1', fontsize=7.5, va='center')
        lx += 3.7

    plt.tight_layout()
    plt.savefig("FINAL_PROJECT_REPORT/ER_DIAGRAM.png", dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("ER_DIAGRAM.png generated successfully!")

# -------------------------------------------------------------
# 4. USE CASE DIAGRAM (4 Interconnected Roles)
# -------------------------------------------------------------
def generate_use_case_diagram():
    fig, ax = plt.subplots(figsize=(16, 11), dpi=300)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 11)
    ax.axis('off')

    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#0f172a')

    # Title Box
    title_box = patches.FancyBboxPatch((1, 9.8), 14, 0.9, boxstyle="round,pad=0.1", fc='#1e293b', ec='#38bdf8', lw=2)
    ax.add_patch(title_box)
    ax.text(8, 10.25, "UDRRMS: ENTERPRISE USE CASE MODEL (4 INTERCONNECTED ROLES)", 
            color='#f8fafc', fontsize=15, fontweight='bold', ha='center', va='center')
    ax.text(8, 9.95, "Comprehensive Role-Based Access Control & Unified Operational Life Cycle", 
            color='#94a3b8', fontsize=10.5, ha='center', va='center')

    # System Boundary Box
    boundary = patches.FancyBboxPatch((3.8, 0.6), 8.4, 8.8, boxstyle="round,pad=0.15", fc='#1e293b', ec='#475569', lw=2)
    ax.add_patch(boundary)
    ax.text(8.0, 9.15, "UDRRMS Centralized Core Platform Boundary", color='#38bdf8', fontsize=12, fontweight='bold', ha='center')

    # 4 Actors
    actors = [
        ("ROLE: CITIZEN", 1.8, 7.5, '#10b981', "Citizen User"),
        ("ROLE: ADMINISTRATOR", 1.8, 2.5, '#f59e0b', "Disaster Officer"),
        ("ROLE: RESCUE TEAM", 14.2, 7.5, '#ef4444', "Field Responder"),
        ("ROLE: SUPPLIES TEAM", 14.2, 2.5, '#8b5cf6', "Logistics Officer")
    ]

    for title, x, y, col, sub in actors:
        # Actor stick figure/box
        box = patches.FancyBboxPatch((x - 1.4, y - 0.7), 2.8, 1.4, boxstyle="round,pad=0.1", fc='#0f172a', ec=col, lw=2)
        ax.add_patch(box)
        ax.text(x, y + 0.35, title, color='#f8fafc', fontsize=9.5, fontweight='bold', ha='center')
        ax.text(x, y - 0.05, f"({sub})", color=col, fontsize=8.5, ha='center')
        ax.text(x, y - 0.45, "Authenticated via JWT", color='#64748b', fontsize=7, ha='center')

    # Use Cases (Ellipses)
    use_cases = [
        # Citizen use cases
        ("UC-01: Register & Login", 5.6, 8.2, '#10b981', 1.8, 0.45),
        ("UC-02: Submit Geocoded Report", 5.6, 7.1, '#10b981', 1.8, 0.45),
        ("UC-03: Request Emergency Aid", 5.6, 6.0, '#10b981', 1.8, 0.45),
        ("UC-04: Track Distress Status", 5.6, 4.9, '#10b981', 1.8, 0.45),

        # Admin use cases
        ("UC-05: Triage & Verify Reports", 8.0, 8.2, '#f59e0b', 1.8, 0.45),
        ("UC-06: Assess Severity (P1-P4)", 8.0, 7.1, '#f59e0b', 1.8, 0.45),
        ("UC-07: Mobilize Tactical Squads", 8.0, 6.0, '#f59e0b', 1.8, 0.45),
        ("UC-08: Closure & Audit Trail", 8.0, 4.9, '#f59e0b', 1.8, 0.45),
        ("UC-09: Live GIS Command Map", 8.0, 3.8, '#38bdf8', 1.8, 0.45),
        ("UC-10: Multi-Module Analytics", 8.0, 2.7, '#38bdf8', 1.8, 0.45),

        # Rescue Team use cases
        ("UC-11: Accept / Reject Mission", 10.4, 8.2, '#ef4444', 1.8, 0.45),
        ("UC-12: Field Progress Updates", 10.4, 7.1, '#ef4444', 1.8, 0.45),
        ("UC-13: Request Incident Supplies", 10.4, 6.0, '#ef4444', 1.8, 0.45),
        ("UC-14: Evacuee Check-In", 10.4, 4.9, '#ef4444', 1.8, 0.45),

        # Supplies Team use cases
        ("UC-15: Warehouse Inventory Check", 10.4, 3.8, '#8b5cf6', 1.8, 0.45),
        ("UC-16: Atomic Stock Reservation", 10.4, 2.7, '#8b5cf6', 1.8, 0.45),
        ("UC-17: Dispatch Manifest Order", 10.4, 1.6, '#8b5cf6', 1.8, 0.45),
        ("UC-18: Delivery Confirmation", 8.0, 1.6, '#8b5cf6', 1.8, 0.45),
    ]

    for label, cx, cy, col, rx, ry in use_cases:
        ellipse = patches.Ellipse((cx, cy), rx * 2, ry * 2, fc='#0f172a', ec=col, lw=1.5)
        ax.add_patch(ellipse)
        ax.text(cx, cy, label, color='#f8fafc', fontsize=7.5, fontweight='bold', ha='center', va='center')

    # Association Lines
    # Citizen -> UC-01, 02, 03, 04, 09
    for target in [(4.7, 8.2), (4.7, 7.1), (4.7, 6.0), (4.7, 4.9)]:
        ax.annotate('', xy=target, xytext=(3.2, 7.5),
                    arrowprops=dict(arrowstyle="-", color='#10b981', lw=1.2))

    # Admin -> UC-05, 06, 07, 08, 09, 10
    for target in [(7.1, 8.2), (7.1, 7.1), (7.1, 6.0), (7.1, 4.9), (7.1, 3.8), (7.1, 2.7)]:
        ax.annotate('', xy=target, xytext=(3.2, 2.5),
                    arrowprops=dict(arrowstyle="-", color='#f59e0b', lw=1.2))

    # Rescue Team -> UC-11, 12, 13, 14, 09
    for target in [(11.3, 8.2), (11.3, 7.1), (11.3, 6.0), (11.3, 4.9)]:
        ax.annotate('', xy=target, xytext=(12.8, 7.5),
                    arrowprops=dict(arrowstyle="-", color='#ef4444', lw=1.2))

    # Supplies Team -> UC-15, 16, 17, 18
    for target in [(11.3, 3.8), (11.3, 2.7), (11.3, 1.6), (8.9, 1.6)]:
        ax.annotate('', xy=target, xytext=(12.8, 2.5),
                    arrowprops=dict(arrowstyle="-", color='#8b5cf6', lw=1.2))

    # Inter-use case relationships (<<include>> / <<extend>>)
    includes = [
        # UC-02 (Submit report) -> UC-05 (Verify)
        ((6.5, 7.1), (7.1, 8.2), "<<triggers>>"),
        # UC-05 (Verify) -> UC-06 (Assess)
        ((8.0, 7.75), (8.0, 7.55), "<<include>>"),
        # UC-06 (Assess) -> UC-07 (Mobilize)
        ((8.0, 6.65), (8.0, 6.45), "<<include>>"),
        # UC-07 (Mobilize) -> UC-11 (Accept Mission)
        ((8.9, 6.0), (9.5, 8.2), "<<notifies>>"),
        # UC-13 (Request Supplies) -> UC-15 (Warehouse Check)
        ((10.4, 5.55), (10.4, 4.25), "<<triggers>>"),
        # UC-15 (Warehouse Check) -> UC-16 (Stock Reservation)
        ((10.4, 3.35), (10.4, 3.15), "<<include>>"),
        # UC-16 (Stock Reservation) -> UC-17 (Dispatch)
        ((10.4, 2.25), (10.4, 2.05), "<<include>>"),
        # UC-17 (Dispatch) -> UC-18 (Delivery Confirm)
        ((9.5, 1.6), (8.9, 1.6), "<<completes>>")
    ]

    for p1, p2, txt in includes:
        ax.annotate('', xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="->", color='#38bdf8', lw=1.2, linestyle=':'))
        mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
        ax.text(mx, my, txt, color='#38bdf8', fontsize=6.5, ha='center', backgroundcolor='#0f172a')

    plt.tight_layout()
    plt.savefig("FINAL_PROJECT_REPORT/USE_CASE_DIAGRAM.png", dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("USE_CASE_DIAGRAM.png generated successfully!")

if __name__ == "__main__":
    generate_system_architecture()
    generate_workflow_diagram()
    generate_er_diagram()
    generate_use_case_diagram()


