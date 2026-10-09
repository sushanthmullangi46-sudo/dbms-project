import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed.seeder import seed_database
from app.models.schema import Inventory

class TestE2EReportingAndMap(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        seed_database()

        cls.client = TestClient(app)

        # Login Citizen
        res_cit = cls.client.post("/api/v1/auth/login", json={"email": "citizen@udrrms.com", "password": "password123"})
        assert res_cit.status_code == 200, f"Citizen login failed: {res_cit.text}"
        cls.citizen_token = res_cit.json()["access_token"]
        cls.citizen_headers = {"Authorization": f"Bearer {cls.citizen_token}"}

        # Login Officer
        res_off = cls.client.post("/api/v1/auth/login", json={"email": "officer@udrrms.com", "password": "password123"})
        assert res_off.status_code == 200, f"Officer login failed: {res_off.text}"
        cls.officer_token = res_off.json()["access_token"]
        cls.officer_headers = {"Authorization": f"Bearer {cls.officer_token}"}

    def test_e2e_citizen_report_to_officer_queue_and_map(self):
        # 1. Citizen submits disaster report
        payload = {
            "location_id": 1001, # Hebbal Flyover Junction
            "disaster_type": "Flood",
            "description": "Hebbal flyover underpass completely inundated. 5 feet water trapped 20 motorists.",
            "people_affected": 20,
            "injuries_reported": 3,
            "missing_persons": 0,
            "trapped_persons": 15,
            "urgent_medical_needed": True,
            "evacuation_needed": True
        }
        res_submit = self.client.post("/api/v1/reports", json=payload, headers=self.citizen_headers)
        self.assertEqual(res_submit.status_code, 201)
        data = res_submit.json()
        self.assertTrue(data["success"])
        report_id = data["report_id"]
        ref_id = data["report_reference_id"]
        self.assertEqual(data["status"], "SUBMITTED")
        print(f"\n[E2E STEP 1 PASS] Citizen report submitted successfully: ID #{report_id}, Ref: {ref_id}")

        # 2. Officer views verification queue
        res_queue = self.client.get("/api/v1/verification/queue", headers=self.officer_headers)
        self.assertEqual(res_queue.status_code, 200)
        queue_data = res_queue.json()
        self.assertTrue(queue_data["success"])
        found = any(r["report_id"] == report_id for r in queue_data["queue"])
        self.assertTrue(found, "Newly submitted citizen report must appear in officer verification queue")
        print(f"[E2E STEP 2 PASS] Report #{report_id} verified present in Officer Verification Queue ({queue_data['count']} pending)")

        # 3. Geospatial nodes & markers layer check
        res_map = self.client.get("/api/v1/map/markers", headers=self.officer_headers)
        self.assertEqual(res_map.status_code, 200)
        map_data = res_map.json()
        self.assertTrue(map_data["success"])
        reports_layer = map_data["markers"].get("reports", [])
        map_found = any(r["id"] == report_id for r in reports_layer)
        self.assertTrue(map_found, "Newly submitted citizen report must appear in GIS Map layer")
        marker = next(r for r in reports_layer if r["id"] == report_id)
        self.assertIsNotNone(marker.get("lat"))
        self.assertIsNotNone(marker.get("lng"))
        self.assertEqual(marker["severity"], "CRITICAL")
        print(f"[E2E STEP 3 PASS] Report #{report_id} verified present on Disaster GIS Map at [{marker['lat']}, {marker['lng']}]")

        # 4. Officer verifies report
        res_verify = self.client.post("/api/v1/verification/verify", json={"report_id": report_id}, headers=self.officer_headers)
        self.assertEqual(res_verify.status_code, 200)
        verify_data = res_verify.json()
        self.assertTrue(verify_data["success"])
        self.assertEqual(verify_data["status"], "VERIFIED")
        print(f"[E2E STEP 4 PASS] Report #{report_id} officially VERIFIED by Disaster Officer")

        # 5. Citizen adds supplemental update
        res_upd = self.client.post(
            f"/api/v1/reports/{report_id}/updates",
            json={"update_text": "Water levels rising rapidly, 3 additional elderly citizens need evacuation."},
            headers=self.citizen_headers
        )
        self.assertEqual(res_upd.status_code, 200)
        print(f"[E2E STEP 5 PASS] Supplemental update added to report #{report_id} by citizen")

        # 6. Citizen requests assistance
        res_asst = self.client.post(
            f"/api/v1/reports/{report_id}/assistance-request",
            json={"request_type": "EVACUATION", "quantity_or_people": 20, "notes": "Boats required"},
            headers=self.citizen_headers
        )
        self.assertEqual(res_asst.status_code, 200)
        print(f"[E2E STEP 6 PASS] Assistance request registered for report #{report_id}")

        # 7. Check closure check endpoint
        res_closure = self.client.get("/api/v1/incidents/1/closure-check", headers=self.officer_headers)
        self.assertEqual(res_closure.status_code, 200)
        closure_data = res_closure.json()
        self.assertTrue(closure_data["success"])
        self.assertIn("checks", closure_data)
        print(f"[E2E STEP 7 PASS] Incident recovery closure audit checklist validated ({len(closure_data['checks'])} audit points)")

        # 8. Check command dashboard metrics
        res_dash = self.client.get("/api/v1/dashboard", headers=self.officer_headers)
        self.assertEqual(res_dash.status_code, 200)
        dash_data = res_dash.json()
        self.assertTrue(dash_data["success"])
        self.assertIn("topCards", dash_data["data"])
        self.assertIn("severityDistribution", dash_data["data"])
        print(f"[E2E STEP 8 PASS] Command Center Dashboard returns complete topCards and operational analytics")

if __name__ == '__main__':
    unittest.main()
