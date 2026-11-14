import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.schema import UserAccount

client = TestClient(app)

@pytest.fixture(scope="module")
def citizen_token():
    res = client.post("/api/v1/auth/login", json={"email": "citizen@udrrms.com", "password": "password123"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]

@pytest.fixture(scope="module")
def officer_token():
    res = client.post("/api/v1/auth/login", json={"email": "officer@udrrms.com", "password": "password123"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]

def test_sos_activation(citizen_token):
    res = client.post(
        "/api/v1/sos/activate",
        json={
            "latitude": 13.0382,
            "longitude": 77.5895,
            "emergency_type": "URGENT_WATER_TRAPPED",
            "notes": "Water level reaching 5 feet, 2 elderly persons need boat evacuation",
            "trapped_count": 2,
            "medical_needed": True
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["success"] is True
    assert "EMG-" in data["emergency_id"]
    assert data["status"] == "ACTIVE"
    assert data["severity"] == "CRITICAL"

def test_emergency_alerts_feed_and_creation(officer_token):
    # 1. List active alerts
    res_list = client.get("/api/v1/alerts/active")
    assert res_list.status_code == 200, res_list.text
    data = res_list.json()
    assert data["success"] is True
    assert "alerts" in data
    assert len(data["alerts"]) >= 1

    # 2. Create alert as officer
    res_create = client.post(
        "/api/v1/alerts",
        json={
            "title": "Severe Gale Warning - North Zone",
            "alert_type": "GENERAL_SAFETY",
            "severity": "HIGH",
            "target_area": "Yelahanka & Hebbal",
            "message": "Gusty winds and heavy squalls anticipated. Secure rooftop fixtures.",
            "expires_in_hours": 8
        },
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res_create.status_code == 201, res_create.text
    assert res_create.json()["success"] is True

def test_roadblocks_feed_and_reporting(officer_token):
    # 1. List roadblocks
    res_list = client.get("/api/v1/roadblocks")
    assert res_list.status_code == 200, res_list.text
    assert res_list.json()["success"] is True
    assert len(res_list.json()["roadblocks"]) >= 1

    # 2. Report roadblock
    res_post = client.post(
        "/api/v1/roadblocks",
        json={
            "road_name": "Ring Road Sector 7 Subway",
            "blockage_type": "FLOODED_ROAD",
            "severity": "CRITICAL",
            "latitude": 13.0410,
            "longitude": 77.5920,
            "is_passable": False,
            "detour_instructions": "Take arterial link road via Hennur cross"
        },
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res_post.status_code == 201, res_post.text
    rb_id = res_post.json()["roadblock_id"]

    # 3. Clear roadblock
    res_clear = client.patch(f"/api/v1/roadblocks/{rb_id}/clear", headers={"Authorization": f"Bearer {officer_token}"})
    assert res_clear.status_code == 200, res_clear.text

def test_evacuation_plans_and_progress(officer_token):
    # 1. List plans
    res_plans = client.get("/api/v1/evacuation/plans")
    assert res_plans.status_code == 200, res_plans.text
    plans = res_plans.json()["plans"]
    assert len(plans) >= 1
    assert "assigned_squads" in plans[0]

    # 2. Create new plan
    res_create = client.post(
        "/api/v1/evacuation/plans",
        json={
            "location_id": 1,
            "zone_name": "Nagawara Lake Shoreline Colony",
            "risk_level": "CRITICAL",
            "priority": "P1",
            "target_shelter_id": 1,
            "instructions": "Move population to Sahakarnagar Stadium via higher ridge path",
            "estimated_evacuees": 60
        },
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res_create.status_code == 201, res_create.text
    plan_id = res_create.json()["plan_id"]

    # 3. Assign squad
    res_assign = client.post(
        f"/api/v1/evacuation/plans/{plan_id}/assign-squad",
        json={"team_id": 1},
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res_assign.status_code == 200, res_assign.text
    assign_id = res_assign.json()["assignment_id"]

    # 4. Update progress
    res_prog = client.patch(
        f"/api/v1/evacuation/assignments/{assign_id}/progress",
        json={"status": "EVACUATING", "evacuees_transported": 25},
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res_prog.status_code == 200, res_prog.text

def test_intelligent_squad_recommendations():
    res = client.get("/api/v1/teams/recommendations?disaster_id=1")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    squads = data["recommended_squads"]
    assert len(squads) >= 1
    assert "match_score_pct" in squads[0]
    assert "distance_km" in squads[0]
    assert "estimated_eta_minutes" in squads[0]
    # Check sorted descending
    for i in range(len(squads) - 1):
        assert squads[i]["match_score_pct"] >= squads[i + 1]["match_score_pct"]

def test_citizen_feedback_submission_and_summary(citizen_token):
    res_sub = client.post(
        "/api/v1/feedback",
        json={
            "disaster_id": 1,
            "rating": 5,
            "response_speed_rating": 5,
            "rescue_team_rating": 5,
            "supplies_rating": 4,
            "comments": "Exceptional coordination and prompt arrival of NDRF rescue boat."
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res_sub.status_code == 201, res_sub.text
    assert res_sub.json()["success"] is True

    res_sum = client.get("/api/v1/feedback/summary")
    assert res_sum.status_code == 200, res_sum.text
    data = res_sum.json()
    assert data["success"] is True
    assert data["count"] >= 1
    assert data["average_overall_rating"] >= 4.0

def test_analytics_hotspots_and_predictions():
    # Hotspots
    res_hot = client.get("/api/v1/analytics/hotspots")
    assert res_hot.status_code == 200, res_hot.text
    assert res_hot.json()["success"] is True
    assert res_hot.json()["hotspots_detected"] >= 1

    # Predictive burn rates
    res_burn = client.get("/api/v1/analytics/resource-predictions")
    assert res_burn.status_code == 200, res_burn.text
    data = res_burn.json()
    assert data["success"] is True
    assert len(data["predictions"]) >= 1
    assert "hours_remaining_buffer" in data["predictions"][0]
