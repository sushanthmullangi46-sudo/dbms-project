import pytest
import sqlite3
import os
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.config import settings
from app.database import Base, get_db
from app.seed.seeder import seed_database
from app.models.schema import UserAccount, DisasterReport, TeamAssignment, Inventory

client = TestClient(app)

class TestMandatoryPersistenceAndSynchronization:
    """
    Mandatory Test Suite covering Section 9 (TEST 1 to TEST 12):
    Data Persistence and Synchronization Requirements.
    """

    test_citizen_email = "citizen_persist_test@udrrms.com"
    test_citizen_password = "password123"
    test_report_id = None
    test_report_ref = None
    initial_water_qty = None

    def test_01_create_citizen_and_verify_account_persists(self):
        """
        TEST 1: Create a citizen account, refresh (re-query), and verify that the account still exists.
        """
        reg_payload = {
            "full_name": "Siddharth Verma",
            "email": self.test_citizen_email,
            "password": self.test_citizen_password,
            "role_name": "CITIZEN",
            "phone": "+91-9988776655",
            "address": "22 Brigade Road, Bangalore",
            "emergency_contact": "+91-9988770000"
        }
        res = client.post("/api/v1/auth/register", json=reg_payload)
        # 200 or 400 if already created
        if res.status_code == 400:
            assert "already exists" in res.json()["detail"]
        else:
            assert res.status_code == 200
            data = res.json()
            assert data["email"] == self.test_citizen_email
            assert data["role"] == "CITIZEN"

        # Simulate page refresh: Login and call /auth/me
        login_res = client.post("/api/v1/auth/login", json={
            "email": self.test_citizen_email,
            "password": self.test_citizen_password
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["email"] == self.test_citizen_email
        assert me_data["full_name"] == "Siddharth Verma"

    def test_02_submit_report_and_verify_it_remains(self):
        """
        TEST 2: Submit a disaster report, refresh the page, and verify that the report remains.
        """
        login_res = client.post("/api/v1/auth/login", json={
            "email": self.test_citizen_email,
            "password": self.test_citizen_password
        })
        token = login_res.json()["access_token"]

        report_payload = {
            "location_id": 1002,
            "disaster_type": "Flood",
            "description": "Flash water logging near Tech Park Gate 3. Commuters marooned.",
            "people_affected": 25,
            "injuries_reported": 2,
            "missing_persons": 0,
            "trapped_persons": 5,
            "urgent_medical_needed": True,
            "evacuation_needed": True
        }
        post_res = client.post("/api/v1/reports", json=report_payload, headers={"Authorization": f"Bearer {token}"})
        assert post_res.status_code == 201
        report_data = post_res.json()
        assert report_data["success"] is True
        TestMandatoryPersistenceAndSynchronization.test_report_id = report_data["report_id"]
        TestMandatoryPersistenceAndSynchronization.test_report_ref = report_data["report_reference_id"]

        # Simulate refreshing the page: Query GET /reports
        list_res = client.get("/api/v1/reports", headers={"Authorization": f"Bearer {token}"})
        assert list_res.status_code == 200
        reports = list_res.json()["reports"]
        matching = [r for r in reports if r["report_id"] == self.test_report_id]
        assert len(matching) == 1
        assert matching[0]["report_reference_id"] == self.test_report_ref
        assert matching[0]["status"] == "SUBMITTED"

    def test_03_close_reopen_session_and_verify_report_available(self):
        """
        TEST 3: Close the browser completely, reopen, log in, and verify report is still available.
        """
        # Session completely fresh: no authorization header cached
        login_res = client.post("/api/v1/auth/login", json={
            "email": self.test_citizen_email,
            "password": self.test_citizen_password
        })
        new_token = login_res.json()["access_token"]

        # Retrieve specific report by ID
        detail_res = client.get(f"/api/v1/reports/{self.test_report_id}", headers={"Authorization": f"Bearer {new_token}"})
        assert detail_res.status_code == 200
        rpt = detail_res.json()["report"]
        assert rpt["report_id"] == self.test_report_id
        assert rpt["report_reference_id"] == self.test_report_ref
        assert rpt["trapped_persons"] == 5

    def test_04_stop_restart_backend_and_verify_records_remain(self):
        """
        TEST 4: Stop the backend server, restart it, and verify that all previous records remain.
        """
        # Simulate server restart by disposing connection pool and triggering startup sequence again
        from app.database import engine, SessionLocal
        engine.dispose()

        # Re-run startup initialization check
        seed_database()

        # Test querying from a fresh session
        db = SessionLocal()
        try:
            user = db.query(UserAccount).filter(UserAccount.email == self.test_citizen_email).first()
            assert user is not None
            assert user.full_name == "Siddharth Verma"

            report = db.query(DisasterReport).filter(DisasterReport.report_id == self.test_report_id).first()
            assert report is not None
            assert report.report_reference_id == self.test_report_ref
        finally:
            db.close()

    def test_05_disk_persistence_shutdown_restart_computer_simulation(self):
        """
        TEST 5: Shut down and restart computer simulation: verify that all information remains on permanent disk storage.
        """
        db_file = Path(settings.DB_FILE)
        assert db_file.exists(), f"Database file must exist at {db_file}"
        assert db_file.stat().st_size > 0, "Database file must have non-zero size on disk"

        # Open raw SQLite connection directly from disk without any server or ORM
        raw_conn = sqlite3.connect(str(db_file))
        cursor = raw_conn.cursor()
        cursor.execute("SELECT full_name, email FROM user_account WHERE email = ?", (self.test_citizen_email,))
        row = cursor.fetchone()
        assert row is not None
        assert row[0] == "Siddharth Verma"

        cursor.execute("SELECT report_id, report_reference_id FROM disaster_report WHERE report_id = ?", (self.test_report_id,))
        rep_row = cursor.fetchone()
        assert rep_row is not None
        assert rep_row[1] == self.test_report_ref
        raw_conn.close()

    def test_06_update_disaster_report_and_verify_persists_after_refresh(self):
        """
        TEST 6: Update a disaster report and verify that the updated information remains after refreshing.
        """
        # Officer login to verify report
        officer_login = client.post("/api/v1/auth/login", json={"email": "officer@udrrms.com", "password": "password123"})
        off_token = officer_login.json()["access_token"]

        verify_res = client.post("/api/v1/verification/verify", json={"report_id": self.test_report_id}, headers={"Authorization": f"Bearer {off_token}"})
        assert verify_res.status_code == 200
        assert verify_res.json()["status"] == "VERIFIED"

        # Also add a citizen supplemental note
        citizen_login = client.post("/api/v1/auth/login", json={"email": self.test_citizen_email, "password": self.test_citizen_password})
        cit_token = citizen_login.json()["access_token"]

        update_res = client.post(f"/api/v1/reports/{self.test_report_id}/updates", json={"message": "Water levels receding by 6 inches."}, headers={"Authorization": f"Bearer {cit_token}"})
        assert update_res.status_code == 200

        # Simulate refresh: get report detail
        refresh_res = client.get(f"/api/v1/reports/{self.test_report_id}", headers={"Authorization": f"Bearer {off_token}"})
        assert refresh_res.status_code == 200
        rpt = refresh_res.json()["report"]
        assert rpt["status"] == "VERIFIED"
        assert len(rpt["updates"]) >= 1

    def test_07_allocate_resources_restart_and_verify_inventory(self):
        """
        TEST 7: Allocate relief resources, restart application, and verify inventory quantities remain correct.
        """
        coord_login = client.post("/api/v1/auth/login", json={"email": "coordinator@udrrms.com", "password": "password123"})
        coord_token = coord_login.json()["access_token"]

        # Check stock before
        stock_res = client.get("/api/v1/inventory/stock", headers={"Authorization": f"Bearer {coord_token}"})
        assert stock_res.status_code == 200
        water_item = next(i for i in stock_res.json()["stock"] if i["RESOURCEID"] == 4 and i["WAREHOUSEID"] == 1)
        initial_qty = water_item["QUANTITYONHAND"]

        # Replenish stock by 250 units
        rep_res = client.post("/api/v1/resources/replenishment", json={
            "warehouseId": 1,
            "resourceId": 4,
            "quantity": 250,
            "batchNumber": "BATCH-2026-PERSIST-TEST"
        }, headers={"Authorization": f"Bearer {coord_token}"})
        assert rep_res.status_code == 200

        # Simulate restart
        from app.database import engine
        engine.dispose()

        # Re-check stock after simulated restart
        stock_after = client.get("/api/v1/inventory/stock", headers={"Authorization": f"Bearer {coord_token}"})
        assert stock_after.status_code == 200
        water_after = next(i for i in stock_after.json()["stock"] if i["RESOURCEID"] == 4 and i["WAREHOUSEID"] == 1)
        assert water_after["QUANTITYONHAND"] == initial_qty + 250

    def test_08_assign_rescue_team_login_as_team_and_verify_assignment(self):
        """
        TEST 8: Assign a rescue team, log in using team account, and verify assignment is available.
        """
        officer_login = client.post("/api/v1/auth/login", json={"email": "officer@udrrms.com", "password": "password123"})
        off_token = officer_login.json()["access_token"]

        assign_res = client.post("/api/v1/missions", json={
            "incidentId": 1,
            "responderId": 2,
            "priority": "P1"
        }, headers={"Authorization": f"Bearer {off_token}"})
        assert assign_res.status_code == 201
        mission_id = assign_res.json()["missionId"]

        # Log in as rescue team (Capt. Arvind Rao)
        rescue_login = client.post("/api/v1/auth/login", json={"email": "rescue@udrrms.com", "password": "password123"})
        assert rescue_login.status_code == 200
        rescue_token = rescue_login.json()["access_token"]

        # Verify assigned mission is available
        resp_missions_res = client.get("/api/v1/responder/missions", headers={"Authorization": f"Bearer {rescue_token}"})
        assert resp_missions_res.status_code == 200
        data = resp_missions_res.json()
        assert data["success"] is True
        assert len(data["missions"]) > 0
        matching = [m for m in data["missions"] if m["MISSIONID"] == mission_id]
        assert len(matching) == 1
        assert matching[0]["STATUS"] in ["ASSIGNED", "ACKNOWLEDGED", "EN_ROUTE", "ON_SCENE"]

        # Free team 1 readiness status so other test suites have access
        from app.database import SessionLocal
        from app.models.schema import ResponseTeam
        db = SessionLocal()
        t1 = db.query(ResponseTeam).filter(ResponseTeam.team_id == 1).first()
        if t1:
            t1.readiness_status = "AVAILABLE"
            db.commit()
        db.close()

    def test_09_login_as_administrator_and_verify_all_reports_visible(self):
        """
        TEST 9: Log in as administrator and verify that all citizen reports are visible.
        """
        admin_login = client.post("/api/v1/auth/login", json={"email": "officer@udrrms.com", "password": "password123"})
        admin_token = admin_login.json()["access_token"]

        reports_res = client.get("/api/v1/reports", headers={"Authorization": f"Bearer {admin_token}"})
        assert reports_res.status_code == 200
        reports = reports_res.json()["reports"]
        assert len(reports) >= 2
        # Verify both baseline report and test report are visible to administrator
        ids = [r["report_id"] for r in reports]
        assert 1 in ids
        assert self.test_report_id in ids

    def test_10_verify_no_duplicate_records_on_refresh(self):
        """
        TEST 10: Verify that no duplicate records are created simply because the user refreshes the page.
        """
        login_res = client.post("/api/v1/auth/login", json={"email": "officer@udrrms.com", "password": "password123"})
        token = login_res.json()["access_token"]

        count_before = len(client.get("/api/v1/reports", headers={"Authorization": f"Bearer {token}"}).json()["reports"])
        # Simulate 5 consecutive page refreshes
        for _ in range(5):
            client.get("/api/v1/reports", headers={"Authorization": f"Bearer {token}"})
            client.get("/api/v1/dashboard", headers={"Authorization": f"Bearer {token}"})
            client.get("/api/v1/incidents", headers={"Authorization": f"Bearer {token}"})

        count_after = len(client.get("/api/v1/reports", headers={"Authorization": f"Bearer {token}"}).json()["reports"])
        assert count_before == count_after, "Page refreshes must never produce duplicate database records"

    def test_11_verify_isolation_modifying_one_record_does_not_affect_others(self):
        """
        TEST 11: Verify that deleting or updating one record does not accidentally erase unrelated records.
        """
        login_res = client.post("/api/v1/auth/login", json={"email": "officer@udrrms.com", "password": "password123"})
        token = login_res.json()["access_token"]

        # Check baseline report 1 status
        rep1_before = client.get("/api/v1/reports/1", headers={"Authorization": f"Bearer {token}"}).json()["report"]

        # Update test report
        client.post(f"/api/v1/reports/{self.test_report_id}/updates", json={"message": "Isolated update test"}, headers={"Authorization": f"Bearer {token}"})

        # Verify report 1 is completely untouched
        rep1_after = client.get("/api/v1/reports/1", headers={"Authorization": f"Bearer {token}"}).json()["report"]
        assert rep1_before["status"] == rep1_after["status"]
        assert rep1_before["report_reference_id"] == rep1_after["report_reference_id"]

    def test_12_verify_migrations_and_restarts_do_not_reset_data(self):
        """
        TEST 12: Verify that database migrations and application restarts do not reset existing data.
        """
        # Call metadata create_all and seed_database simulating multiple cold boots
        seed_database()
        seed_database()

        login_res = client.post("/api/v1/auth/login", json={"email": self.test_citizen_email, "password": self.test_citizen_password})
        assert login_res.status_code == 200, "Citizen created in TEST 1 must survive multiple seed/startup checks"

        detail_res = client.get(f"/api/v1/reports/{self.test_report_id}", headers={"Authorization": f"Bearer {login_res.json()['access_token']}"})
        assert detail_res.status_code == 200, "Report created in TEST 2 must survive multiple seed/startup checks"
