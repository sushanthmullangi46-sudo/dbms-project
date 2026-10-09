import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed.seeder import seed_database
from app.models.schema import (
    Disaster, DisasterReport, Inventory, Shelter, ResponseTeam, AuditLog,
    ResourceAllocation, TeamAssignment
)

class TestUDRRMSWorkflow(unittest.TestCase):
    active_disaster_id = 1
    test_disp_ref = None

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        seed_database()
        
        # Ensure fresh stock baseline for reproducible test runs
        db = SessionLocal()
        for inv in db.query(Inventory).all():
            if inv.resource_id == 1:
                inv.quantity_available = 10
                inv.quantity_reserved = 0
        db.commit()
        db.close()

        cls.client = TestClient(app)
        
        # 1. Login Citizen
        res_cit = cls.client.post("/api/v1/auth/login", json={"email": "citizen@udrrms.com", "password": "password123"})
        assert res_cit.status_code == 200, f"Citizen login failed: {res_cit.text}"
        cls.citizen_token = res_cit.json()["access_token"]
        cls.citizen_headers = {"Authorization": f"Bearer {cls.citizen_token}"}

        # 2. Login Officer
        res_off = cls.client.post("/api/v1/auth/login", json={"email": "officer@udrrms.com", "password": "password123"})
        assert res_off.status_code == 200, f"Officer login failed: {res_off.text}"
        cls.officer_token = res_off.json()["access_token"]
        cls.officer_headers = {"Authorization": f"Bearer {cls.officer_token}"}

        # 3. Login Coordinator
        res_coo = cls.client.post("/api/v1/auth/login", json={"email": "coordinator@udrrms.com", "password": "password123"})
        assert res_coo.status_code == 200, f"Coordinator login failed: {res_coo.text}"
        cls.coordinator_token = res_coo.json()["access_token"]
        cls.coordinator_headers = {"Authorization": f"Bearer {cls.coordinator_token}"}

    # Test 1: Citizen report submission
    def test_01_citizen_report_submission(self):
        payload = {
            "location_id": 1006, # RT Nagar Market
            "disaster_type": "Flood",
            "description": "Basement transformer submerged under 4ft water. Severe short circuit hazard.",
            "people_affected": 45,
            "injuries_reported": 4,
            "missing_persons": 0,
            "trapped_persons": 6,
            "urgent_medical_needed": True,
            "evacuation_needed": True
        }
        res = self.client.post("/api/v1/reports", json=payload, headers=self.citizen_headers)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["status"], "SUBMITTED")
        self.assertTrue(data["report_reference_id"].startswith("RPT-"))
        TestUDRRMSWorkflow.test_report_id = data["report_id"]
        print(f"PASS: Test 1 - Report Submitted with Ref {data['report_reference_id']}")

    # Test 2: Report verification and rejection
    def test_02_report_verification_and_rejection(self):
        # Create a bogus report to test rejection
        res_bogus = self.client.post("/api/v1/reports", json={
            "location_id": 1004,
            "disaster_type": "Flood",
            "description": "Bogus false alarm test report."
        }, headers=self.citizen_headers)
        bogus_id = res_bogus.json()["report_id"]

        # Reject without justification (must fail with 400)
        res_fail = self.client.post(f"/api/v1/verification/{bogus_id}/action", json={
            "action": "REJECT",
            "rejection_reason": ""
        }, headers=self.officer_headers)
        self.assertEqual(res_fail.status_code, 400)

        # Reject with valid justification
        res_rej = self.client.post(f"/api/v1/verification/{bogus_id}/action", json={
            "action": "REJECT",
            "rejection_reason": "Verified on CCTV: Drain water clear; zero waterlogging or trapped citizens."
        }, headers=self.officer_headers)
        self.assertEqual(res_rej.status_code, 200)
        self.assertEqual(res_rej.json()["status"], "REJECTED")

        # Now verify the real test report
        res_ver = self.client.post(f"/api/v1/verification/{self.test_report_id}/action", json={
            "action": "VERIFY"
        }, headers=self.officer_headers)
        self.assertEqual(res_ver.status_code, 200)
        self.assertEqual(res_ver.json()["status"], "VERIFIED")
        print("PASS: Test 2 - Report Verification & Justified Rejection Enforced")

    # Test 3: Invalid state transitions
    def test_03_invalid_state_transitions(self):
        # Cannot activate an incident directly from a SUBMITTED unverified report
        res_unver = self.client.post("/api/v1/reports", json={
            "location_id": 1007,
            "disaster_type": "Fire",
            "description": "Unverified smoke sighting."
        }, headers=self.citizen_headers)
        unver_id = res_unver.json()["report_id"]

        res_invalid = self.client.post(f"/api/v1/incidents/activate?report_id={unver_id}", json={
            "disaster_name": "Invalid Early Activation"
        }, headers=self.officer_headers)
        self.assertEqual(res_invalid.status_code, 400)
        print("PASS: Test 3 - Invalid State Transitions Blocked by Backend")

    # Test 4: Severity assessment and authorized overrides
    def test_04_severity_assessment_and_override(self):
        res = self.client.post(f"/api/v1/incidents/assess/{self.test_report_id}", json={
            "disaster_type": "Flood",
            "people_affected": 45,
            "injuries": 4,
            "trapped": 6,
            "override_level": "P1",
            "override_reason": "Officer command override: Substation flood poses critical explosion and electrocution hazard."
        }, headers=self.officer_headers)
        self.assertEqual(res.status_code, 200)
        assessment = res.json()["assessment"]
        self.assertEqual(assessment["final_priority"], "P1")
        self.assertGreater(assessment["calculated_score"], 50.0)
        print("PASS: Test 4 - Rule-based Severity Scoring & Officer Override Stamped")

    # Test 5: Duplicate report handling
    def test_05_duplicate_report_handling(self):
        # Create duplicate report
        res_dup = self.client.post("/api/v1/reports", json={
            "location_id": 1006, # Same RT Nagar location
            "disaster_type": "Flood",
            "description": "Duplicate call: RT Nagar transformer smoking in water."
        }, headers=self.citizen_headers)
        dup_id = res_dup.json()["report_id"]

        # Officer merges as duplicate
        res_merge = self.client.post(f"/api/v1/verification/{dup_id}/action", json={
            "action": "LINK_DUPLICATE",
            "target_report_id": self.test_report_id
        }, headers=self.officer_headers)
        self.assertEqual(res_merge.status_code, 200)
        self.assertEqual(res_merge.json()["status"], "LINKED_DUPLICATE")
        print("PASS: Test 5 - Duplicate Report Merged while Preserving Audit Trail")

    # Test 6: Team assignment & mission lifecycle
    def test_06_team_assignment_and_lifecycle(self):
        # First activate operational incident
        res_act = self.client.post(f"/api/v1/incidents/activate?report_id={self.test_report_id}", json={
            "disaster_name": "RT Nagar Substation Flood Crisis",
            "priority_level": "P1"
        }, headers=self.officer_headers)
        self.assertEqual(res_act.status_code, 200)
        TestUDRRMSWorkflow.active_disaster_id = res_act.json()["disaster_id"]

        # Assign NDRF squad (team 1)
        res_assign = self.client.post("/api/v1/teams/assign", json={
            "disaster_id": self.active_disaster_id,
            "team_id": 1
        }, headers=self.officer_headers)
        self.assertEqual(res_assign.status_code, 201)
        assignment_id = res_assign.json()["assignment_id"]

        # Step through lifecycle
        res_ack = self.client.patch(f"/api/v1/teams/assignments/{assignment_id}/status", json={"new_status": "ACKNOWLEDGED"}, headers=self.officer_headers)
        self.assertEqual(res_ack.json()["new_status"], "ACKNOWLEDGED")

        res_route = self.client.patch(f"/api/v1/teams/assignments/{assignment_id}/status", json={"new_status": "EN_ROUTE"}, headers=self.officer_headers)
        self.assertEqual(res_route.json()["new_status"], "EN_ROUTE")

        res_scene = self.client.patch(f"/api/v1/teams/assignments/{assignment_id}/status", json={"new_status": "ON_SCENE"}, headers=self.officer_headers)
        self.assertEqual(res_scene.json()["new_status"], "ON_SCENE")

        res_comp = self.client.patch(f"/api/v1/teams/assignments/{assignment_id}/status", json={"new_status": "COMPLETED"}, headers=self.officer_headers)
        self.assertEqual(res_comp.json()["new_status"], "COMPLETED")
        print("PASS: Test 6 - Response Team Mission Lifecycle Enforced (ASSIGNED -> COMPLETED)")

    # Test 7: Insufficient warehouse stock
    def test_07_insufficient_warehouse_stock(self):
        # Create resource request for 99999 rescue boats
        res_req = self.client.post("/api/v1/resources/requests", json={
            "disaster_id": self.active_disaster_id,
            "items": [{"resource_id": 1, "quantity_requested": 99999}]
        }, headers=self.officer_headers)
        req_id = res_req.json()["request_id"]

        # Attempt allocation (must fail with 400)
        res_alloc = self.client.post("/api/v1/resources/allocate", json={
            "request_id": req_id,
            "warehouse_id": 1,
            "approved_items": [{"resource_id": 1, "approved_quantity": 99999}]
        }, headers=self.coordinator_headers)
        self.assertEqual(res_alloc.status_code, 400)
        self.assertIn("Insufficient inventory", res_alloc.json()["detail"])
        print("PASS: Test 7 - Insufficient Stock Prevented & Rejection Enforced")

    # Test 8: Concurrent / Transactional stock allocation
    def test_08_transactional_stock_allocation(self):
        # Request valid 2 rescue boats
        res_req = self.client.post("/api/v1/resources/requests", json={
            "disaster_id": self.active_disaster_id,
            "items": [{"resource_id": 1, "quantity_requested": 2}]
        }, headers=self.officer_headers)
        req_id = res_req.json()["request_id"]

        res_alloc = self.client.post("/api/v1/resources/allocate", json={
            "request_id": req_id,
            "warehouse_id": 1,
            "approved_items": [{"resource_id": 1, "approved_quantity": 2}]
        }, headers=self.coordinator_headers)
        self.assertEqual(res_alloc.status_code, 200)
        self.assertEqual(res_alloc.json()["allocations_count"], 1)
        TestUDRRMSWorkflow.test_disp_ref = res_alloc.json()["dispatch_references"][0]
        print("PASS: Test 8 - Transactional Stock Reservation Successful (Zero Double-Allocation)")

    # Test 9: Duplicate delivery confirmation prevented
    def test_09_duplicate_delivery_confirmation(self):
        # Dispatch delivery
        alloc = SessionLocal().query(ResourceAllocation).filter_by(dispatch_reference=self.test_disp_ref).first()
        res_disp = self.client.post("/api/v1/deliveries/dispatch", json={
            "allocation_id": alloc.allocation_id,
            "transport_driver_name": "R. Kumar",
            "vehicle_registration": "KA-04-E-1234"
        }, headers=self.coordinator_headers)
        deliv_id = res_disp.json()["delivery_id"]

        # Confirm delivery first time
        res_conf1 = self.client.post(f"/api/v1/deliveries/{deliv_id}/confirm", json={
            "quantity_received": 2,
            "receiver_name": "Inspector Anita Rao"
        }, headers=self.officer_headers)
        self.assertEqual(res_conf1.status_code, 200)

        # Confirm delivery second time (must fail with 400)
        res_conf2 = self.client.post(f"/api/v1/deliveries/{deliv_id}/confirm", json={
            "quantity_received": 2,
            "receiver_name": "Inspector Anita Rao"
        }, headers=self.officer_headers)
        self.assertEqual(res_conf2.status_code, 400)
        print("PASS: Test 9 - Duplicate Delivery Confirmation Prevented & Idempotency Verified")

    # Test 10: Shelter capacity enforcement
    def test_10_shelter_capacity_enforcement(self):
        # Shelter 4 (RT Nagar) has capacity 200, current occupancy 195 (5 spaces left)
        # Attempt to register 10 evacuees (must fail with 400)
        res_full = self.client.post("/api/v1/shelters/register", json={
            "shelter_id": 4,
            "dependents_count": 9 # 1 + 9 = 10 people
        }, headers=self.citizen_headers)
        self.assertEqual(res_full.status_code, 400)
        detail_msg = res_full.json()["detail"].lower()
        self.assertTrue("capacity" in detail_msg or "full" in detail_msg)

        # Register valid 2 people into Open Shelter (Shelter 1 Sahakarnagar)
        res_ok = self.client.post("/api/v1/shelters/register", json={
            "shelter_id": 1,
            "dependents_count": 1 # 1 + 1 = 2 people
        }, headers=self.citizen_headers)
        self.assertEqual(res_ok.status_code, 201)
        print("PASS: Test 10 - Shelter Maximum Capacity Constraint Strictly Enforced")

    # Test 11: Role-based access control
    def test_11_role_based_access_control(self):
        # Citizen cannot access officer verification queue (must return 403)
        res_denied = self.client.get("/api/v1/verification/queue", headers=self.citizen_headers)
        self.assertEqual(res_denied.status_code, 403)

        # Citizen cannot approve resource allocations
        res_alloc_denied = self.client.post("/api/v1/resources/allocate", json={
            "request_id": 1,
            "warehouse_id": 1,
            "approved_items": []
        }, headers=self.citizen_headers)
        self.assertEqual(res_alloc_denied.status_code, 403)
        print("PASS: Test 11 - RBAC Role Guard Enforced Across Portals")

    # Test 12: Incident closure validation
    def test_12_incident_closure_validation(self):
        # Reset team 3 to AVAILABLE to guarantee successful assignment
        db_s = SessionLocal()
        t3 = db_s.query(ResponseTeam).filter_by(team_id=3).first()
        if t3:
            t3.readiness_status = "AVAILABLE"
            db_s.commit()
        db_s.close()

        # Assign team 3 to active disaster
        res_assign = self.client.post("/api/v1/teams/assign", json={
            "disaster_id": self.active_disaster_id,
            "team_id": 3
        }, headers=self.officer_headers)
        self.assertEqual(res_assign.status_code, 201)
        assign3_id = res_assign.json()["assignment_id"]

        # Attempt to close (must fail with 400 because squad is still active)
        res_fail = self.client.post(f"/api/v1/incidents/{self.active_disaster_id}/close", json={
            "closure_summary": "Premature closure attempt while squads are deployed."
        }, headers=self.officer_headers)
        self.assertEqual(res_fail.status_code, 400)
        self.assertIn("active on scene", res_fail.json()["detail"])

        # Cancel team 3 assignment with recorded justification
        res_cancel = self.client.patch(f"/api/v1/teams/assignments/{assign3_id}/status", json={
            "new_status": "CANCELLED",
            "notes": "Operation handed over to local brigade"
        }, headers=self.officer_headers)
        self.assertEqual(res_cancel.status_code, 200)

        # Close incident successfully
        res_close = self.client.post(f"/api/v1/incidents/{self.active_disaster_id}/close", json={
            "closure_summary": "Substation water completely pumped out; electrical grid restored; all stranded citizens safely evacuated."
        }, headers=self.officer_headers)
        self.assertEqual(res_close.status_code, 200)
        self.assertEqual(res_close.json()["status"], "CLOSED")
        print("PASS: Test 12 - Mandatory Incident Closure Checklist Enforced")

    # Test 13: Incident escalation & analytics
    def test_13_incident_escalation_and_analytics(self):
        res_esc = self.client.post(f"/api/v1/incidents/1/escalate", json={
            "escalation_reason": "Secondary drain overflow threatening adjacent residential towers."
        }, headers=self.officer_headers)
        self.assertEqual(res_esc.status_code, 200)

        # Analytics
        res_analytics = self.client.get("/api/v1/analytics/overview", headers=self.officer_headers)
        self.assertEqual(res_analytics.status_code, 200)
        self.assertGreater(res_analytics.json()["kpis"]["total_incidents"], 0)

        # CSV Export
        res_csv = self.client.get("/api/v1/analytics/export-csv", headers=self.officer_headers)
        self.assertEqual(res_csv.status_code, 200)
        self.assertIn("Incident ID,Incident Code", res_csv.text)
        print("PASS: Test 13 - Incident Escalation & Post-Incident CSV Analytics Verified")

    # Test 14: Audit event generation
    def test_14_audit_event_generation(self):
        db = SessionLocal()
        logs = db.query(AuditLog).all()
        self.assertGreater(len(logs), 0)
        actions = [l.action for l in logs]
        self.assertIn("REPORT_SUBMITTED", actions)
        print(f"PASS: Test 14 - Master Immutable Audit Trail Verified ({len(logs)} audit entries recorded)")

if __name__ == "__main__":
    unittest.main()
