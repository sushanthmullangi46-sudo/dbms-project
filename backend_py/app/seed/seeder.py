from sqlalchemy.orm import Session
from datetime import datetime
from app.database import Base, engine, SessionLocal
from app.models.schema import (
    Role, Agency, UserAccount, Citizen, DisasterLocation, DisasterReport,
    Disaster, ResponseTeam, Resource, Warehouse, Inventory, Shelter, Hospital, AuditLog
)
from app.auth.security import get_password_hash

def seed_database(db: Session = None):
    own_session = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        own_session = True

    try:
        # Check if already seeded
        if db.query(Role).count() > 0:
            return

        print("Seeding UDRRMS database with 27 tables and realistic disaster scenario...")

        # 1. ROLES
        roles = [
            Role(role_id=1, role_name="CITIZEN", description="Citizens and witnesses reporting disasters"),
            Role(role_id=2, role_name="DISASTER_OFFICER", description="Incident command & emergency operations officer"),
            Role(role_id=3, role_name="COORDINATOR", description="Relief logistics and inventory coordinator")
        ]
        db.add_all(roles)
        db.commit()

        # 2. AGENCIES
        agencies = [
            Agency(agency_id=1, agency_name="NDRF 10th Battalion", agency_type="RESCUE", contact_phone="+91-80-23001111"),
            Agency(agency_id=2, agency_name="SDRF Quick Response Unit", agency_type="RESCUE", contact_phone="+91-80-23002222"),
            Agency(agency_id=3, agency_name="Bangalore Emergency Medical Services", agency_type="MEDICAL", contact_phone="+91-80-23003333"),
            Agency(agency_id=4, agency_name="Fire & Emergency Services Engine 4", agency_type="FIRE", contact_phone="+91-80-23004444"),
            Agency(agency_id=5, agency_name="Indian Red Cross Humanitarian Hub", agency_type="NGO", contact_phone="+91-80-23005555")
        ]
        db.add_all(agencies)
        db.commit()

        # 3. USER ACCOUNTS (Demo Password: password123)
        pwd_hash = get_password_hash("password123")
        users = [
            UserAccount(user_id=1, role_id=1, full_name="Aarav Sharma (Citizen)", email="citizen@udrrms.com", phone="+91-9880112233", password_hash=pwd_hash),
            UserAccount(user_id=2, role_id=2, full_name="Col. Rajesh Varma (Chief Officer)", email="officer@udrrms.com", phone="+91-9880223344", password_hash=pwd_hash),
            UserAccount(user_id=3, role_id=3, full_name="Dr. Suresh Hegde (Relief Coordinator)", email="coordinator@udrrms.com", phone="+91-9880334455", password_hash=pwd_hash),
            UserAccount(user_id=4, role_id=1, full_name="Priya Nair (Witness)", email="priya@udrrms.com", phone="+91-9880445566", password_hash=pwd_hash)
        ]
        db.add_all(users)
        db.commit()

        # 4. CITIZEN PROFILES
        citizens = [
            Citizen(citizen_id=1, user_id=1, address="Flat 402, Lakeview Apartments, Hebbal", emergency_contact="+91-9880119999", special_needs="Elderly family member (requires walker)"),
            Citizen(citizen_id=2, user_id=4, address="House 12, Nagawara Ring Road", emergency_contact="+91-9880449999")
        ]
        db.add_all(citizens)
        db.commit()

        # 5. DISASTER LOCATIONS (Bangalore Sectors & Risk Zones)
        locations = [
            DisasterLocation(location_id=1001, location_name="Hebbal Flyover Junction", address="Bellary Rd & ORR", ward_name="Hebbal Ward 21", latitude=13.0358, longitude=77.5970, risk_zone="CRITICAL"),
            DisasterLocation(location_id=1002, location_name="Manyata Embassy Business Park", address="Nagawara Ring Road", ward_name="Nagawara Ward 23", latitude=13.0475, longitude=77.6200, risk_zone="HIGH"),
            DisasterLocation(location_id=1003, location_name="Yelahanka Old Town Lake Basin", address="Kogilu Main Road", ward_name="Yelahanka Ward 4", latitude=13.1007, longitude=77.5963, risk_zone="CRITICAL"),
            DisasterLocation(location_id=1004, location_name="Jakkur Aerodrome Sector", address="Jakkur Airfield perimeter", ward_name="Jakkur Ward 5", latitude=13.0784, longitude=77.6048, risk_zone="MODERATE"),
            DisasterLocation(location_id=1005, location_name="Nagawara Lake Lowlands", address="Govindapura", ward_name="Nagawara Ward 23", latitude=13.0438, longitude=77.6253, risk_zone="HIGH"),
            DisasterLocation(location_id=1006, location_name="RT Nagar Central Market", address="Dinnur Main Road", ward_name="RT Nagar Ward 32", latitude=13.0247, longitude=77.5948, risk_zone="MODERATE"),
            DisasterLocation(location_id=1007, location_name="Vidyaranyapura HMT Layout", address="4th Block Vidyaranyapura", ward_name="Vidyaranyapura Ward 9", latitude=13.0805, longitude=77.5562, risk_zone="LOW"),
            DisasterLocation(location_id=1008, location_name="Hennur Cross Radial Road", address="Hennur Ring Rd", ward_name="Hennur Ward 28", latitude=13.0382, longitude=77.6446, risk_zone="MODERATE"),
            DisasterLocation(location_id=1009, location_name="Sahakarnagar Community Hub", address="60 Feet Road", ward_name="Sahakarnagar Ward 18", latitude=13.0623, longitude=77.5871, risk_zone="SAFE"),
            DisasterLocation(location_id=1010, location_name="Kogilu Industrial Zone", address="Airport Expressway", ward_name="Kogilu Ward 7", latitude=13.1189, longitude=77.6095, risk_zone="HIGH")
        ]
        db.add_all(locations)
        db.commit()

        # 6. RESPONSE TEAMS
        teams = [
            ResponseTeam(team_id=1, agency_id=1, team_name="NDRF Alpha Water Rescue", leader_name="Capt. Arvind Rao", contact_phone="+91-9845011111", specialization="WATER_RESCUE", capacity=12, readiness_status="AVAILABLE"),
            ResponseTeam(team_id=2, agency_id=2, team_name="SDRF Quick Response Squad", leader_name="Insp. Anita Rao", contact_phone="+91-9845022222", specialization="COLLAPSE_SAR", capacity=10, readiness_status="AVAILABLE"),
            ResponseTeam(team_id=3, agency_id=3, team_name="EMS Critical Paramedics 1", leader_name="Dr. Priya Nambiar", contact_phone="+91-9845033333", specialization="MEDICAL_TRIAGE", capacity=8, readiness_status="AVAILABLE"),
            ResponseTeam(team_id=4, agency_id=4, team_name="Fire Engine Rescue Unit 4", leader_name="Cmdr. Suresh Kumar", contact_phone="+91-9845044444", specialization="HAZMAT", capacity=15, readiness_status="AVAILABLE")
        ]
        db.add_all(teams)
        db.commit()

        # 7. RESOURCES CATALOG
        resources = [
            Resource(resource_id=1, resource_name="Inflatable Rescue Boat (Zodiac)", category="EQUIPMENT", unit="Boats", is_perishable=False, standard_unit_cost=150000.0),
            Resource(resource_id=2, resource_name="High-Pressure Medical Oxygen 50L", category="MEDICAL", unit="Cylinders", is_perishable=False, standard_unit_cost=4500.0),
            Resource(resource_id=3, resource_name="Emergency 72hr Food Ration Kits", category="FOOD", unit="Kits", is_perishable=True, standard_unit_cost=850.0),
            Resource(resource_id=4, resource_name="Purified Potable Water 20L Cans", category="WATER", unit="Cans", is_perishable=False, standard_unit_cost=60.0),
            Resource(resource_id=5, resource_name="Trauma Emergency First Aid Kit", category="MEDICAL", unit="Kits", is_perishable=False, standard_unit_cost=2200.0),
            Resource(resource_id=6, resource_name="Heavy De-Watering Storm Pump", category="EQUIPMENT", unit="Pumps", is_perishable=False, standard_unit_cost=65000.0),
            Resource(resource_id=7, resource_name="Thermal Cold Relief Blankets", category="SHELTER_SUPPLIES", unit="Blankets", is_perishable=False, standard_unit_cost=350.0)
        ]
        db.add_all(resources)
        db.commit()

        # 8. WAREHOUSES & INVENTORY
        wh1 = Warehouse(warehouse_id=1, warehouse_name="Hebbal Central Disaster Reserve Depot", location_id=1001, manager_name="Inspector R. Chettiar", capacity_pallets=10000)
        wh2 = Warehouse(warehouse_id=2, warehouse_name="Manyata Emergency Logistics Vault", location_id=1002, manager_name="T. Sundaram", capacity_pallets=8000)
        wh3 = Warehouse(warehouse_id=3, warehouse_name="Yelahanka North Relief Warehouse", location_id=1003, manager_name="Major B. Varma", capacity_pallets=12000)
        db.add_all([wh1, wh2, wh3])
        db.commit()

        inventory_items = [
            # Warehouse 1
            Inventory(warehouse_id=1, resource_id=1, quantity_available=8, quantity_reserved=2, reorder_threshold=2),
            Inventory(warehouse_id=1, resource_id=2, quantity_available=85, quantity_reserved=15, reorder_threshold=20),
            Inventory(warehouse_id=1, resource_id=3, quantity_available=2500, quantity_reserved=500, reorder_threshold=300),
            Inventory(warehouse_id=1, resource_id=4, quantity_available=4000, quantity_reserved=800, reorder_threshold=500),
            Inventory(warehouse_id=1, resource_id=5, quantity_available=320, quantity_reserved=40, reorder_threshold=50),
            Inventory(warehouse_id=1, resource_id=6, quantity_available=12, quantity_reserved=3, reorder_threshold=3),
            Inventory(warehouse_id=1, resource_id=7, quantity_available=1800, quantity_reserved=200, reorder_threshold=250),
            # Warehouse 2
            Inventory(warehouse_id=2, resource_id=1, quantity_available=5, quantity_reserved=0, reorder_threshold=2),
            Inventory(warehouse_id=2, resource_id=3, quantity_available=1800, quantity_reserved=200, reorder_threshold=250),
            Inventory(warehouse_id=2, resource_id=4, quantity_available=3000, quantity_reserved=0, reorder_threshold=400),
            # Warehouse 3
            Inventory(warehouse_id=3, resource_id=1, quantity_available=10, quantity_reserved=0, reorder_threshold=3),
            Inventory(warehouse_id=3, resource_id=6, quantity_available=15, quantity_reserved=0, reorder_threshold=4)
        ]
        db.add_all(inventory_items)
        db.commit()

        # 9. SHELTERS
        shelters = [
            Shelter(shelter_id=1, shelter_name="Sahakarnagar Indoor Stadium Relief Shelter", location_id=1009, capacity=500, current_occupancy=185, status="OPEN"),
            Shelter(shelter_id=2, shelter_name="Jakkur Government High School Camp", location_id=1004, capacity=300, current_occupancy=140, status="OPEN"),
            Shelter(shelter_id=3, shelter_name="Vidyaranyapura Community Hall", location_id=1007, capacity=250, current_occupancy=65, status="OPEN"),
            Shelter(shelter_id=4, shelter_name="RT Nagar BBMP Relief Shelter", location_id=1006, capacity=200, current_occupancy=195, status="FULL")
        ]
        db.add_all(shelters)
        db.commit()

        # 10. HOSPITALS
        hospitals = [
            Hospital(hospital_id=1, hospital_name="Columbia Asia Emergency Trauma Center", location_id=1001, total_icu_beds=35, available_icu_beds=12, total_general_beds=200, available_general_beds=60),
            Hospital(hospital_id=2, hospital_name="Aster CMI Tertiary Care Hospital", location_id=1001, total_icu_beds=50, available_icu_beds=18, total_general_beds=300, available_general_beds=95),
            Hospital(hospital_id=3, hospital_name="Yelahanka General Hospital Relief Wing", location_id=1003, total_icu_beds=20, available_icu_beds=4, total_general_beds=120, available_general_beds=22)
        ]
        db.add_all(hospitals)
        db.commit()

        # 11. SAMPLE DISASTER REPORT & INCIDENT
        rep1 = DisasterReport(
            report_id=1,
            report_reference_id="RPT-20261009-HB001",
            reporter_user_id=1,
            location_id=1001,
            disaster_type="Flood",
            description="Bellary Road and Outer Ring Road heavily submerged. Water reached 5 feet in apartment ground floors.",
            people_affected=150,
            injuries_reported=12,
            missing_persons=2,
            trapped_persons=18,
            urgent_medical_needed=True,
            evacuation_needed=True,
            status="VERIFIED",
            submitted_at=datetime.utcnow(),
            verified_at=datetime.utcnow()
        )
        db.add(rep1)
        db.commit()

        inc1 = Disaster(
            disaster_id=1,
            incident_code="INC-20261009-BLR01",
            disaster_name="Bangalore North Zone Flash Flood",
            disaster_type="Flood",
            location_id=1001,
            severity_score=88.5,
            severity_level="P1",
            status="ACTIVE",
            activated_at=datetime.utcnow()
        )
        db.add(inc1)
        db.commit()

        rep1.disaster_id = inc1.disaster_id
        db.commit()

        # 12. INITIAL AUDIT LOG
        audit = AuditLog(
            entity_name="DISASTER",
            entity_id=inc1.incident_code,
            action="INCIDENT_ACTIVATED",
            performed_by=2,
            actor_name="Col. Rajesh Varma",
            details="System initialization: Bangalore North Zone Flash Flood operational incident declared."
        )
        db.add(audit)
        db.commit()

        print("Database seeded successfully with all 27 tables and baseline dataset!")

    finally:
        if own_session:
            db.close()

if __name__ == "__main__":
    seed_database()
