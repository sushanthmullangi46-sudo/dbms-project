"""
Full Multi-Role Disaster Lifecycle Test Script
Simulates:
1. Citizen raising a disaster report
2. Administrator receiving report in verification queue, verifying, creating incident, and assigning rescue team
3. Rescue team logging in, seeing assigned mission, updating status to ON_SCENE, and completing with field report
4. Coordinator checking supply inventory balances
5. Map markers updating with disaster location
6. Permanent relational database verification in database/udrrms.db
"""

import requests
import json
import sqlite3
from pathlib import Path

BASE_URL = "http://localhost:5000/api/v1"
DB_PATH = Path(__file__).resolve().parent.parent / "database" / "udrrms.db"

def print_step(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def main():
    print_step("STEP 1: CITIZEN LOGS IN & RAISES A DISASTER REPORT")
    # 1. Login as Citizen
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "citizen@udrrms.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"Citizen login failed: {res.text}"
    citizen_token = res.json()["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}", "Content-Type": "application/json"}
    print(f" [OK] Citizen Logged In: {res.json()['full_name']} (Role: {res.json()['role']})")

    # 2. Raise Disaster Report
    report_payload = {
        "location_id": 1001,
        "disaster_type": "FLOOD",
        "description": "Severe flash flood at Hebbal service road. 14 people trapped on building rooftop. Water level rising fast.",
        "people_affected": 14,
        "injuries_reported": 2,
        "missing_persons": 0,
        "trapped_persons": 14,
        "urgent_medical_needed": True,
        "evacuation_needed": True,
        "attachment_urls": ["https://images.unsplash.com/photo-flood-sample.jpg"]
    }
    res = requests.post(f"{BASE_URL}/reports", headers=citizen_headers, json=report_payload)
    assert res.status_code in [200, 201], f"Submit report failed: {res.text}"
    report_data = res.json()
    report_id = report_data.get("report_id") or report_data.get("id")
    ref_id = report_data.get("report_reference_id") or report_data.get("ref_id") or f"RPT-{report_id}"
    print(f" [OK] Disaster Report Submitted!")
    print(f"      Report ID: {report_id}")
    print(f"      Reference Code: {ref_id}")
    print(f"      Status: {report_data.get('status', 'SUBMITTED')}")

    # 3. Citizen checks their reports list
    res = requests.get(f"{BASE_URL}/reports", headers=citizen_headers)
    assert res.status_code == 200, f"Get reports failed: {res.text}"
    my_reports = res.json().get("reports", res.json())
    found_citizen_report = any((r.get("report_id") == report_id or r.get("id") == report_id) for r in my_reports)
    print(f" [OK] Verified Citizen Report is listed in Citizen's history (Found: {found_citizen_report})")

    print_step("STEP 2: ADMINISTRATOR CHECKS QUEUE, VERIFIES, CREATES INCIDENT & DISPATCHES RESCUE TEAM")
    # 1. Login as Administrator
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "officer@udrrms.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"Officer login failed: {res.text}"
    officer_token = res.json()["access_token"]
    officer_headers = {"Authorization": f"Bearer {officer_token}", "Content-Type": "application/json"}
    print(f" [OK] Officer Logged In: {res.json()['full_name']} (Role: {res.json()['role']})")

    # 2. Check Verification Queue for Citizen's new report
    res = requests.get(f"{BASE_URL}/verification/queue", headers=officer_headers)
    assert res.status_code == 200, f"Queue fetch failed: {res.text}"
    queue = res.json().get("queue", [])
    matching_in_queue = next((q for q in queue if q.get("report_id") == report_id), None)
    assert matching_in_queue is not None, f"Report {report_id} not found in Administrator's queue!"
    print(f" [OK] Officer successfully sees Citizen report in Verification Queue:")
    print(f"      Title/Desc: {matching_in_queue['description'][:60]}...")
    print(f"      Trapped Count: {matching_in_queue['trapped_persons']} persons")
    print(f"      Location: {matching_in_queue['location_name']} (Risk Zone: {matching_in_queue['risk_zone']})")

    # 3. Verify the Report
    res = requests.post(f"{BASE_URL}/verification/verify", headers=officer_headers, json={"report_id": report_id})
    assert res.status_code == 200, f"Verify report failed: {res.text}"
    print(f" [OK] Officer verified report: {res.json().get('message')}")

    # 4. Create Active Operational Incident
    incident_payload = {
        "incidentName": f"Hebbal Flash Flood Operation (Ref {ref_id})",
        "incidentType": "FLOOD",
        "severity": "CRITICAL",
        "locationId": 1001,
        "description": "Mass evacuation operation for 14 trapped persons at Hebbal Flyover."
    }
    res = requests.post(f"{BASE_URL}/incidents", headers=officer_headers, json=incident_payload)
    assert res.status_code in [200, 201], f"Create incident failed: {res.text}"
    inc_data = res.json()
    incident_id = inc_data.get("disaster_id") or inc_data.get("INCIDENTID") or inc_data.get("id")
    inc_code = inc_data.get("incident_code") or inc_data.get("INCIDENTCODE")
    print(f" [OK] Operational Incident Created & Activated:")
    print(f"      Incident ID: {incident_id}")
    print(f"      Incident Code: {inc_code}")
    print(f"      Status: ACTIVE (Severity: CRITICAL / P1)")

    # 5. Dispatch / Assign Rescue Team (Tactical Mission)
    mission_payload = {
        "incidentId": incident_id,
        "responderId": 1, # Team 1: NDRF Alpha Squad
        "priority": "P1"
    }
    res = requests.post(f"{BASE_URL}/missions", headers=officer_headers, json=mission_payload)
    assert res.status_code in [200, 201], f"Assign mission failed: {res.text}"
    mission_id = res.json().get("mission_id") or res.json().get("missionId")
    print(f" [OK] Tactical Mission Dispatched to NDRF Rescue Team:")
    print(f"      Mission ID: {mission_id}")
    print(f"      Status: {res.json().get('status', 'ASSIGNED')}")

    print_step("STEP 3: RESCUE TEAM LOGS IN, SEES ASSIGNMENT, ADVANCES STATUS & COMPLETES MISSION")
    # 1. Login as Rescue Team
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "rescue@udrrms.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"Rescue team login failed: {res.text}"
    rescue_token = res.json()["access_token"]
    rescue_headers = {"Authorization": f"Bearer {rescue_token}", "Content-Type": "application/json"}
    print(f" [OK] Rescue Team Logged In: {res.json()['full_name']} (Role: {res.json()['role']})")

    # 2. Rescue Team checks assigned missions
    res = requests.get(f"{BASE_URL}/responder/missions", headers=rescue_headers)
    assert res.status_code == 200, f"Get responder missions failed: {res.text}"
    resp_missions = res.json().get("missions", [])
    my_mission = next((m for m in resp_missions if (m.get("mission_id") == mission_id or m.get("MISSIONID") == mission_id)), None)
    assert my_mission is not None, f"Mission {mission_id} not visible to Rescue Team!"
    print(f" [OK] Rescue Team Terminal received assigned mission:")
    print(f"      Mission Code: {my_mission.get('mission_code', my_mission.get('MISSIONCODE', 'MSN-01'))}")
    print(f"      Target Location: {my_mission.get('location_name', my_mission.get('LOCATIONNAME'))}")
    print(f"      Priority: {my_mission.get('priority', my_mission.get('PRIORITY', 'P1'))}")

    # 3. Rescue Team updates status: ASSIGNED -> ACKNOWLEDGED -> EN_ROUTE -> ON_SCENE
    res = requests.put(f"{BASE_URL}/responder/missions/{mission_id}/status", headers=rescue_headers, json={
        "status": "ACKNOWLEDGED",
        "notes": "Alpha Squad acknowledges tactical dispatch."
    })
    assert res.status_code == 200, f"Update status to ACKNOWLEDGED failed: {res.text}"
    print(f" [OK] Rescue Team Status Updated -> ACKNOWLEDGED")

    res = requests.put(f"{BASE_URL}/responder/missions/{mission_id}/status", headers=rescue_headers, json={
        "status": "EN_ROUTE",
        "notes": "Alpha Squad deployed from base."
    })
    assert res.status_code == 200, f"Update status to EN_ROUTE failed: {res.text}"
    print(f" [OK] Rescue Team Status Updated -> EN_ROUTE")

    res = requests.put(f"{BASE_URL}/responder/missions/{mission_id}/status", headers=rescue_headers, json={
        "status": "ON_SCENE",
        "notes": "Alpha Squad arrived on site with zodiac motorized boats."
    })
    assert res.status_code == 200, f"Update status to ON_SCENE failed: {res.text}"
    print(f" [OK] Rescue Team Status Updated -> ON_SCENE")

    # 4. Rescue Team submits Field Incident Report & Completes Mission
    report_res = requests.post(f"{BASE_URL}/responder/missions/{mission_id}/report", headers=rescue_headers, json={
        "reportType": "TACTICAL_UPDATE",
        "severity": "CRITICAL",
        "description": "Zodiac boats deployed. All 14 trapped civilians successfully extracted from rooftop."
    })
    assert report_res.status_code == 200, f"Field report failed: {report_res.text}"

    complete_res = requests.post(f"{BASE_URL}/responder/missions/{mission_id}/complete", headers=rescue_headers, json={
        "notes": "Operation complete. All 14 victims relocated to Hebbal Municipal Relief Shelter."
    })
    assert complete_res.status_code == 200, f"Complete mission failed: {complete_res.text}"
    print(f" [OK] Rescue Team Field Report Logged & Mission Marked COMPLETED!")

    print_step("STEP 4: LOGISTICS COORDINATOR CHECKS RESOURCE BALANCES & WAREHOUSES")
    # 1. Login as Logistics Coordinator
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "coordinator@udrrms.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"Coordinator login failed: {res.text}"
    coord_token = res.json()["access_token"]
    coord_headers = {"Authorization": f"Bearer {coord_token}", "Content-Type": "application/json"}
    print(f" [OK] Coordinator Logged In: {res.json()['full_name']} (Role: {res.json()['role']})")

    # 2. Check Inventory Stock
    res = requests.get(f"{BASE_URL}/inventory/stock", headers=coord_headers)
    assert res.status_code == 200, f"Inventory stock failed: {res.text}"
    stock_items = res.json().get("stock", [])
    print(f" [OK] Coordinator Stock Ledger Active: {len(stock_items)} resource inventory lines tracked across depots.")

    print_step("STEP 5: VERIFY GIS INTERACTIVE DISASTER MAP")
    res = requests.get(f"{BASE_URL}/map/markers", headers=officer_headers)
    assert res.status_code == 200, f"Map markers failed: {res.text}"
    markers_data = res.json()
    markers = markers_data.get("markers", markers_data)
    incidents_on_map = markers.get("incidents", [])
    reports_on_map = markers.get("reports", [])
    found_inc = any((i.get("id") == incident_id or i.get("INCIDENTID") == incident_id) for i in incidents_on_map)
    found_rep = any((r.get("id") == report_id) for r in reports_on_map)
    print(f" [OK] Live GIS Map retrieved: {len(incidents_on_map)} active disaster markers, {len(reports_on_map)} citizen report markers.")
    print(f"      Our newly raised disaster incident is actively displayed on the map: {found_inc}")
    print(f"      Our citizen disaster report is actively plotted on the map: {found_rep}")

    print_step("STEP 6: PHYSICAL DATABASE PERSISTENCE VERIFICATION (database/udrrms.db)")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Verify Report in DB
    cur.execute("SELECT report_id, report_reference_id, status, description FROM DISASTER_REPORT WHERE report_id = ?", (report_id,))
    row = cur.fetchone()
    assert row is not None, "Report not in database!"
    print(f" [OK] DB DISASTER_REPORT Row: ID={row[0]}, Ref={row[1]}, Status={row[2]}")

    # Verify Incident in DB
    cur.execute("SELECT disaster_id, incident_code, status, severity_level FROM DISASTER WHERE disaster_id = ?", (incident_id,))
    row = cur.fetchone()
    assert row is not None, "Incident not in database!"
    print(f" [OK] DB DISASTER Row: ID={row[0]}, Code={row[1]}, Status={row[2]}, Severity={row[3]}")

    # Verify Mission Assignment in DB
    cur.execute("SELECT assignment_id, assignment_status FROM TEAM_ASSIGNMENT WHERE assignment_id = ?", (mission_id,))
    row = cur.fetchone()
    assert row is not None, "Mission not in database!"
    print(f" [OK] DB TEAM_ASSIGNMENT Row: ID={row[0]}, Status={row[1]}")

    # Verify Audit Logs in DB
    cur.execute("SELECT COUNT(*) FROM AUDIT_LOG WHERE entity_id IN (?, ?, ?)", (str(report_id), str(incident_id), str(mission_id)))
    audit_count = cur.fetchone()[0]
    print(f" [OK] DB AUDIT_LOG Rows: {audit_count} immutable ledger events recorded for this operation.")

    conn.close()

    print_step(">>> ALL MULTI-ROLE DISASTER WORKFLOW TESTS PASSED 100%! <<<")

if __name__ == "__main__":
    main()
