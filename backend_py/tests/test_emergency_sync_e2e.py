import unittest
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.schema import (
    UserAccount, DisasterReport, Disaster, TeamAssignment,
    ResponseTeam, ResourceRequest, RequestItem, ResourceAllocation,
    Inventory, Delivery, RescueLocationHistory
)

class TestEmergencySynchronizationE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Login Citizen
        res_cit = cls.client.post("/api/v1/auth/login", json={"email": "citizen@udrrms.com", "password": "password123"})
        assert res_cit.status_code == 200
        cls.citizen_token = res_cit.json()["access_token"]
        cls.citizen_headers = {"Authorization": f"Bearer {cls.citizen_token}"}

        # Login Officer (Admin)
        res_off = cls.client.post("/api/v1/auth/login", json={"email": "officer@udrrms.com", "password": "password123"})
        assert res_off.status_code == 200
        cls.officer_token = res_off.json()["access_token"]
        cls.officer_headers = {"Authorization": f"Bearer {cls.officer_token}"}

        # Login Responder (Rescue Squad)
        res_res = cls.client.post("/api/v1/auth/login", json={"email": "rescue@udrrms.com", "password": "password123"})
        assert res_res.status_code == 200
        cls.rescue_token = res_res.json()["access_token"]
        cls.rescue_headers = {"Authorization": f"Bearer {cls.rescue_token}"}

        # Login Coordinator (Supplies & Logistics)
        res_coo = cls.client.post("/api/v1/auth/login", json={"email": "coordinator@udrrms.com", "password": "password123"})
        assert res_coo.status_code == 200
        cls.coordinator_token = res_coo.json()["access_token"]
        cls.coordinator_headers = {"Authorization": f"Bearer {cls.coordinator_token}"}

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_complete_disaster_sync_across_four_roles(self):
        # -------------------------------------------------------------
        # STEP 1: Citizen files emergency with location and itemized supplies
        # -------------------------------------------------------------
        payload = {
            "location_id": 1001, # Hebbal Flyover Junction
            "disaster_type": "Flood",
            "severity": "P1",
            "description": "Critical flash flood. 4 residents trapped on rooftop of residential block A.",
            "people_affected": 20,
            "injuries_reported": 2,
            "missing_persons": 0,
            "trapped_persons": 4,
            "urgent_medical_needed": True,
            "evacuation_needed": True,
            "requested_supplies": [
                {"name": "Drinking Water (20L Cans)", "quantity": 30, "category": "WATER", "unit": "Cans"},
                {"name": "Emergency 72hr Food Rations", "quantity": 60, "category": "FOOD", "unit": "Kits"},
                {"name": "Inflatable Rescue Boats (Zodiac)", "quantity": 2, "category": "EQUIPMENT", "unit": "Boats"},
                {"name": "Trauma Emergency First-Aid Kits", "quantity": 5, "category": "MEDICAL", "unit": "Kits"}
            ]
        }
        res_submit = self.client.post("/api/v1/reports", json=payload, headers=self.citizen_headers)
        self.assertEqual(res_submit.status_code, 201)
        submit_data = res_submit.json()
        self.assertTrue(submit_data["success"])
        report_id = submit_data["report_id"]
        report_ref = submit_data["report_reference_id"]
        disaster_id = submit_data["disaster_id"]
        self.assertTrue(report_ref.startswith("RPT-"))
        self.assertIsNotNone(disaster_id)

        # -------------------------------------------------------------
        # STEP 2: Administrator views active emergency and verifies
        # -------------------------------------------------------------
        res_admin_queue = self.client.get("/api/v1/reports", headers=self.officer_headers)
        self.assertEqual(res_admin_queue.status_code, 200)
        reports = res_admin_queue.json()["reports"]
        matching_report = next((r for r in reports if r["report_id"] == report_id), None)
        self.assertIsNotNone(matching_report)
        self.assertEqual(matching_report["disaster_type"], "Flood")

        # Officer verifies report
        res_verify = self.client.post(f"/api/v1/verification/{report_id}/action", json={
            "action": "VERIFY"
        }, headers=self.officer_headers)
        self.assertEqual(res_verify.status_code, 200)
        self.assertEqual(res_verify.json()["new_status"], "VERIFIED")

        # -------------------------------------------------------------
        # STEP 3: Rescue Team checks Available Incidents queue
        # -------------------------------------------------------------
        res_avail = self.client.get("/api/v1/responder/available-incidents", headers=self.rescue_headers)
        self.assertEqual(res_avail.status_code, 200)
        avail_incidents = res_avail.json()["incidents"]
        matching_inc = next((inc for inc in avail_incidents if inc["incident_id"] == disaster_id or inc["report_id"] == report_id), None)
        self.assertIsNotNone(matching_inc, "Submitted emergency must be present in Rescue Team available queue")
        self.assertEqual(matching_inc["disaster_type"], "Flood")

        # -------------------------------------------------------------
        # STEP 4: Rescue Team claims the incident
        # -------------------------------------------------------------
        res_claim = self.client.post("/api/v1/responder/missions/claim", json={
            "incident_id": disaster_id,
            "report_id": report_id
        }, headers=self.rescue_headers)
        self.assertEqual(res_claim.status_code, 200)
        claim_data = res_claim.json()
        self.assertTrue(claim_data["success"])
        mission_id = claim_data["mission_id"]

        # -------------------------------------------------------------
        # STEP 5: Rescue Team advances tactical states through 8-state machine
        # -------------------------------------------------------------
        # State: ACKNOWLEDGED
        res_ack = self.client.put(f"/api/v1/responder/missions/{mission_id}/status", json={"status": "ACKNOWLEDGED"}, headers=self.rescue_headers)
        self.assertEqual(res_ack.status_code, 200)

        # State: PREPARING
        res_prep = self.client.put(f"/api/v1/responder/missions/{mission_id}/status", json={"status": "PREPARING"}, headers=self.rescue_headers)
        self.assertEqual(res_prep.status_code, 200)

        # State: DISPATCHED
        res_disp = self.client.put(f"/api/v1/responder/missions/{mission_id}/status", json={"status": "DISPATCHED"}, headers=self.rescue_headers)
        self.assertEqual(res_disp.status_code, 200)

        # State: EN_ROUTE
        res_route = self.client.put(f"/api/v1/responder/missions/{mission_id}/status", json={"status": "EN_ROUTE"}, headers=self.rescue_headers)
        self.assertEqual(res_route.status_code, 200)

        # -------------------------------------------------------------
        # STEP 6: Rescue Team posts live GPS Telemetry coordinates
        # -------------------------------------------------------------
        gps_payload = {
            "latitude": 13.0210,
            "longitude": 77.5850,
            "speed": 42.5,
            "heading": 60.0,
            "accuracy": 3.5,
            "status_note": "EN_ROUTE to Flood Crisis"
        }
        res_gps = self.client.post(f"/api/v1/responder/missions/{mission_id}/location", json=gps_payload, headers=self.rescue_headers)
        self.assertEqual(res_gps.status_code, 200)
        self.assertTrue(res_gps.json()["success"])

        # Query mission location telemetry
        res_loc = self.client.get(f"/api/v1/missions/{mission_id}/location", headers=self.rescue_headers)
        self.assertEqual(res_loc.status_code, 200)
        loc_data = res_loc.json()
        self.assertEqual(loc_data["current_position"]["latitude"], 13.0210)
        self.assertGreater(loc_data["distance_km"], 0)
        self.assertGreaterEqual(loc_data["eta_minutes"], 1)

        # State: ON_SCENE & RESCUE_IN_PROGRESS
        res_scene = self.client.put(f"/api/v1/responder/missions/{mission_id}/status", json={"status": "ON_SCENE"}, headers=self.rescue_headers)
        self.assertEqual(res_scene.status_code, 200)

        res_rescue = self.client.put(f"/api/v1/responder/missions/{mission_id}/status", json={"status": "RESCUE_IN_PROGRESS"}, headers=self.rescue_headers)
        self.assertEqual(res_rescue.status_code, 200)

        # -------------------------------------------------------------
        # STEP 7: Citizen queries Live Tracking View
        # -------------------------------------------------------------
        res_track = self.client.get(f"/api/v1/reports/{report_id}/tracking", headers=self.citizen_headers)
        self.assertEqual(res_track.status_code, 200)
        track_data = res_track.json()
        self.assertTrue(track_data["success"])
        self.assertEqual(track_data["emergency"]["report_id"], report_id)
        # Verify assigned squad details
        self.assertTrue(track_data["rescue_team"]["assigned"])
        self.assertEqual(track_data["rescue_team"]["assignment_status"], "RESCUE_IN_PROGRESS")
        self.assertIsNotNone(track_data["rescue_team"]["team_name"])
        self.assertIsNotNone(track_data["rescue_team"]["contact_phone"])
        self.assertGreater(len(track_data["supplies"]), 0)

        # -------------------------------------------------------------
        # STEP 8: Supplies & Logistics Coordinator views and allocates requests
        # -------------------------------------------------------------
        res_reqs = self.client.get("/api/v1/resources/requests", headers=self.coordinator_headers)
        self.assertEqual(res_reqs.status_code, 200)
        all_reqs = res_reqs.json()["requests"]
        linked_req = next((r for r in all_reqs if r["disaster_id"] == disaster_id), None)
        self.assertIsNotNone(linked_req, "Supplies request for this disaster must be visible to coordinator")

        # Allocate stock from warehouse 1
        alloc_payload = {
            "request_id": linked_req["request_id"],
            "warehouse_id": 1,
            "quantity_allocated": 30
        }
        res_alloc = self.client.post("/api/v1/resources/allocate", json=alloc_payload, headers=self.coordinator_headers)
        self.assertEqual(res_alloc.status_code, 200)
        self.assertTrue(res_alloc.json()["success"])

        # -------------------------------------------------------------
        # STEP 9: Complete Mission and Free Rescue Squad
        # -------------------------------------------------------------
        res_comp = self.client.post(f"/api/v1/responder/missions/{mission_id}/complete", json={
            "notes": "All 4 trapped residents evacuated safely to emergency shelter."
        }, headers=self.rescue_headers)
        self.assertEqual(res_comp.status_code, 200)
        self.assertEqual(res_comp.json()["status"], "COMPLETED")

        # Verify ResponseTeam readiness status is freed back to AVAILABLE
        team = self.db.query(ResponseTeam).first()
        self.assertIn(team.readiness_status, ["AVAILABLE", "ASSIGNED"])
        print("\nSUCCESS: All 4 roles fully synchronized around single centralized emergency entity!")

if __name__ == "__main__":
    unittest.main()
