import sys
sys.path.insert(0, 'backend_py')
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.schema import (
    TeamMember, EvacuationPlan, EvacuationAssignment,
    EmergencyAlert, RoadblockReport, CitizenFeedback,
    ResponseTeam, Shelter, DisasterLocation, Disaster, UserAccount
)

def seed_advanced_data():
    db = SessionLocal()
    try:
        # 1. Team Members
        if db.query(TeamMember).count() == 0:
            members = [
                TeamMember(team_id=1, member_name="Sub-Inspector M. Kulkarni", role_title="Zodiac Boat Pilot & Diver", contact_phone="+91-9845012301", badge_number="NDRF-W01", is_available=True),
                TeamMember(team_id=1, member_name="Havildar Ramesh Nayak", role_title="Water Rescue Specialist", contact_phone="+91-9845012302", badge_number="NDRF-W02", is_available=True),
                TeamMember(team_id=1, member_name="Constable Sunil Gowda", role_title="Flood Extraction Technician", contact_phone="+91-9845012303", badge_number="NDRF-W03", is_available=True),
                TeamMember(team_id=2, member_name="Sub-Inspector Vikas Patil", role_title="Acoustic Search Specialist", contact_phone="+91-9845012304", badge_number="SDRF-S01", is_available=True),
                TeamMember(team_id=2, member_name="Naik Ankit Singh", role_title="Breaching & Shoring Technician", contact_phone="+91-9845012305", badge_number="SDRF-S02", is_available=True),
                TeamMember(team_id=3, member_name="Dr. Kavita Shenoy", role_title="Critical Care Paramedic Lead", contact_phone="+91-9845012306", badge_number="EMS-P01", is_available=True),
                TeamMember(team_id=3, member_name="Nurse Imran Khan", role_title="Field Trauma Specialist", contact_phone="+91-9845012307", badge_number="EMS-P02", is_available=True),
                TeamMember(team_id=4, member_name="Station Officer T. R. Rao", role_title="Hazmat Safety Officer", contact_phone="+91-9845012308", badge_number="FIRE-H01", is_available=True),
            ]
            db.add_all(members)
            print(f"Added {len(members)} team members.")

        # 2. Emergency Alerts
        if db.query(EmergencyAlert).count() == 0:
            alerts = [
                EmergencyAlert(
                    title="FLASH FLOOD RED ALERT: Hebbal & Nagawara Lake Basin",
                    alert_type="FLOOD_WARNING",
                    severity="CRITICAL",
                    target_area="Hebbal / Outer Ring Road / Nagawara",
                    message="IMD reports intense precipitation exceeding 110mm/hr. Low-lying basements and underpasses along Outer Ring Road Hebbal stretch are critically submerged. Citizens are advised to seek upper floors or move to Sahakarnagar Indoor Stadium.",
                    issued_by=2, # Col. Rajesh Varma
                    issued_at=datetime.utcnow() - timedelta(hours=2),
                    expires_at=datetime.utcnow() + timedelta(hours=10),
                    is_active=True
                ),
                EmergencyAlert(
                    title="URGENT EVACUATION ADVISORY: Kodigehalli Railway Underpass Zone",
                    alert_type="EVACUATION_NOTICE",
                    severity="HIGH",
                    target_area="Kodigehalli / Thindlu",
                    message="Water stagnation reached 4.5 feet near railway underbridge. SDRF and NDRF rescue boats deployed. Power supply suspended temporarily for electrical safety. Head towards Vidyaranyapura Community Hall.",
                    issued_by=2,
                    issued_at=datetime.utcnow() - timedelta(minutes=45),
                    expires_at=datetime.utcnow() + timedelta(hours=6),
                    is_active=True
                ),
                EmergencyAlert(
                    title="TRAFFIC & PASSAGE CLOSURE: Bellary Road Flyover Ramps",
                    alert_type="ROAD_CLOSURE",
                    severity="MODERATE",
                    target_area="Bellary Road / Airport Corridor",
                    message="Service lanes flooded near Esteem Mall. Heavy vehicles diverted via Thanisandra Main Road. Keep emergency lanes clear for ambulances and NDRF rescue vehicles.",
                    issued_by=2,
                    issued_at=datetime.utcnow() - timedelta(minutes=20),
                    expires_at=datetime.utcnow() + timedelta(hours=8),
                    is_active=True
                )
            ]
            db.add_all(alerts)
            print(f"Added {len(alerts)} emergency alerts.")

        # 3. Roadblock Reports
        if db.query(RoadblockReport).count() == 0:
            roadblocks = [
                RoadblockReport(
                    disaster_id=1,
                    reported_by_team_id=1,
                    road_name="Outer Ring Road Hebbal Underpass",
                    blockage_type="FLOODED_ROAD",
                    severity="CRITICAL",
                    latitude=13.0382,
                    longitude=77.5895,
                    is_passable=False,
                    detour_instructions="Divert all rescue transports via Kempapura Main Road and Sanjaynagar Service Road.",
                    reported_at=datetime.utcnow() - timedelta(hours=1)
                ),
                RoadblockReport(
                    disaster_id=2,
                    reported_by_team_id=2,
                    road_name="Kodigehalli Railway Underbridge",
                    blockage_type="COLLAPSED_BRIDGE",
                    severity="HIGH",
                    latitude=13.0645,
                    longitude=77.5788,
                    is_passable=False,
                    detour_instructions="Use bypass route via Thindlu Circle and Vidyaranyapura 2nd Main.",
                    reported_at=datetime.utcnow() - timedelta(minutes=30)
                ),
                RoadblockReport(
                    disaster_id=1,
                    reported_by_team_id=4,
                    road_name="Thanisandra Main Cross Road 4",
                    blockage_type="DEBRIS",
                    severity="MODERATE",
                    latitude=13.0520,
                    longitude=77.6210,
                    is_passable=True,
                    detour_instructions="Single lane operational. Proceed with caution at 15 km/h.",
                    reported_at=datetime.utcnow() - timedelta(minutes=15)
                )
            ]
            db.add_all(roadblocks)
            print(f"Added {len(roadblocks)} roadblock reports.")

        # 4. Evacuation Plans & Assignments
        if db.query(EvacuationPlan).count() == 0:
            loc = db.query(DisasterLocation).first()
            loc_id = loc.location_id if loc else 1
            plan1 = EvacuationPlan(
                disaster_id=1,
                location_id=loc_id,
                zone_name="Hebbal Lake Lowland Settlement Sector 4",
                risk_level="CRITICAL",
                priority="P1",
                target_shelter_id=1, # Sahakarnagar
                instructions="Deploy motorized inflatables. Evacuate elderly and children from ground-floor dwellings first. Assemble at designated pickup point on higher ground near Esteem Mall gate.",
                evacuation_status="ACTIVE",
                estimated_evacuees=120,
                evacuated_count=45,
                created_at=datetime.utcnow() - timedelta(hours=2)
            )
            plan2 = EvacuationPlan(
                disaster_id=2,
                location_id=loc_id,
                zone_name="Kodigehalli Slum Perimeter Basin",
                risk_level="HIGH",
                priority="P2",
                target_shelter_id=3, # Vidyaranyapura
                instructions="Ground clearance team guide evacuees on foot using safety guide-ropes towards Vidyaranyapura Hall.",
                evacuation_status="ACTIVE",
                estimated_evacuees=80,
                evacuated_count=30,
                created_at=datetime.utcnow() - timedelta(hours=1)
            )
            db.add(plan1)
            db.add(plan2)
            db.commit()

            # Evacuation assignments
            assign1 = EvacuationAssignment(
                plan_id=plan1.plan_id,
                team_id=1, # NDRF Alpha
                assigned_at=datetime.utcnow() - timedelta(hours=2),
                status="EVACUATING",
                evacuees_transported=45
            )
            assign2 = EvacuationAssignment(
                plan_id=plan2.plan_id,
                team_id=2, # SDRF
                assigned_at=datetime.utcnow() - timedelta(hours=1),
                status="EN_ROUTE",
                evacuees_transported=30
            )
            db.add(assign1)
            db.add(assign2)
            print("Added 2 evacuation plans and 2 assignments.")

        # 5. Citizen Feedback sample
        if db.query(CitizenFeedback).count() == 0:
            feedbacks = [
                CitizenFeedback(
                    disaster_id=1,
                    citizen_id=1,
                    rating=5,
                    response_speed_rating=5,
                    rescue_team_rating=5,
                    supplies_rating=4,
                    comments="NDRF water rescue team arrived within 18 minutes of request. Extremely professional inflatable boat extraction from our flooded ground floor.",
                    created_at=datetime.utcnow() - timedelta(days=1)
                ),
                CitizenFeedback(
                    disaster_id=3,
                    citizen_id=4,
                    rating=5,
                    response_speed_rating=4,
                    rescue_team_rating=5,
                    supplies_rating=5,
                    comments="The relief supplies (rations and clean water) were delivered promptly to the community shelter.",
                    created_at=datetime.utcnow() - timedelta(days=2)
                )
            ]
            db.add_all(feedbacks)
            print(f"Added {len(feedbacks)} citizen feedbacks.")

        db.commit()
        print("All advanced seed data committed successfully!")
    except Exception as e:
        db.rollback()
        print("Error seeding advanced data:", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_advanced_data()
