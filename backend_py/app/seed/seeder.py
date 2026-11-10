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
            # Idempotently check and ensure all required roles and accounts exist
            resp_role = db.query(Role).filter(Role.role_name == "FIELD_RESPONDER").first()
            if not resp_role:
                max_role_id = db.query(Role).count() + 1
                resp_role = Role(role_id=max_role_id, role_name="FIELD_RESPONDER", description="Tactical rescue and emergency field team")
                db.add(resp_role)
                db.commit()

            rescue_user = db.query(UserAccount).filter(UserAccount.email == "rescue@udrrms.com").first()
            if not rescue_user:
                pwd_hash = get_password_hash("password123")
                max_u_id = max([u.user_id for u in db.query(UserAccount).all()] or [0]) + 1
                rescue_user = UserAccount(
                    user_id=max_u_id,
                    role_id=resp_role.role_id,
                    full_name="Capt. Arvind Rao (NDRF Water Rescue Lead)",
                    email="rescue@udrrms.com",
                    phone="+91-9845011111",
                    password_hash=pwd_hash
                )
                db.add(rescue_user)
                db.commit()

            admin_user = db.query(UserAccount).filter(UserAccount.email == "admin@udrorp.com").first()
            if not admin_user:
                pwd_hash = get_password_hash("password123")
                officer_role = db.query(Role).filter(Role.role_name == "DISASTER_OFFICER").first()
                max_u_id = max([u.user_id for u in db.query(UserAccount).all()] or [0]) + 1
                admin_user = UserAccount(
                    user_id=max_u_id,
                    role_id=officer_role.role_id if officer_role else 2,
                    full_name="Director of Disaster Management (Admin)",
                    email="admin@udrorp.com",
                    phone="+91-9880000000",
                    password_hash=pwd_hash
                )
                db.add(admin_user)
                db.commit()
            return

        print("Seeding UDRRMS database with 27 tables and realistic disaster scenario...")

        # 1. ROLES
        roles = [
            Role(role_id=1, role_name="CITIZEN", description="Citizens and witnesses reporting disasters"),
            Role(role_id=2, role_name="DISASTER_OFFICER", description="Incident command & emergency operations officer"),
            Role(role_id=3, role_name="COORDINATOR", description="Relief logistics and inventory coordinator"),
            Role(role_id=4, role_name="FIELD_RESPONDER", description="Tactical rescue and emergency field team")
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
            UserAccount(user_id=4, role_id=1, full_name="Priya Nair (Witness)", email="priya@udrrms.com", phone="+91-9880445566", password_hash=pwd_hash),
            UserAccount(user_id=5, role_id=4, full_name="Capt. Arvind Rao (NDRF Water Rescue Lead)", email="rescue@udrrms.com", phone="+91-9845011111", password_hash=pwd_hash),
            UserAccount(user_id=6, role_id=2, full_name="Director of Disaster Management (Admin)", email="admin@udrorp.com", phone="+91-9880000000", password_hash=pwd_hash)
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

        # 8. WAREHOUSES
        warehouses = [
            Warehouse(warehouse_id=1, warehouse_name="Hebbal Central Reserve Depot", location_id=1001, manager_name="Ravi Teja", capacity_pallets=4500),
            Warehouse(warehouse_id=2, warehouse_name="Manyata Rapid Logistics Vault", location_id=1002, manager_name="Ananya Hegde", capacity_pallets=3200),
            Warehouse(warehouse_id=3, warehouse_name="Yelahanka North Staging Depot", location_id=1003, manager_name="Kiran Somanna", capacity_pallets=2800)
        ]
        db.add_all(warehouses)
        db.commit()

        # 9. INVENTORY BALANCES
        inventory_items = [
            Inventory(warehouse_id=1, resource_id=1, quantity_available=6, quantity_reserved=0, reorder_threshold=2),
            Inventory(warehouse_id=1, resource_id=2, quantity_available=85, quantity_reserved=0, reorder_threshold=20),
            Inventory(warehouse_id=1, resource_id=3, quantity_available=2500, quantity_reserved=0, reorder_threshold=500),
            Inventory(warehouse_id=1, resource_id=4, quantity_available=1800, quantity_reserved=0, reorder_threshold=400),
            Inventory(warehouse_id=2, resource_id=3, quantity_available=1200, quantity_reserved=0, reorder_threshold=300),
            Inventory(warehouse_id=2, resource_id=5, quantity_available=150, quantity_reserved=0, reorder_threshold=30),
            Inventory(warehouse_id=2, resource_id=7, quantity_available=900, quantity_reserved=0, reorder_threshold=200),
            Inventory(warehouse_id=3, resource_id=4, quantity_available=1100, quantity_reserved=0, reorder_threshold=250),
            Inventory(warehouse_id=3, resource_id=6, quantity_available=8, quantity_reserved=0, reorder_threshold=2)
        ]
        db.add_all(inventory_items)
        db.commit()

        # 10. SHELTERS & HOSPITALS
        shelters = [
            Shelter(shelter_id=1, location_id=1009, shelter_name="Sahakarnagar Indoor Stadium Camp", capacity=350, current_occupancy=45, status="OPEN", has_medical_unit=True, has_potable_water=True),
            Shelter(shelter_id=2, location_id=1007, shelter_name="Vidyaranyapura Govt High School Shelter", capacity=200, current_occupancy=20, status="OPEN", has_medical_unit=True, has_potable_water=True)
        ]
        db.add_all(shelters)

        hospitals = [
            Hospital(hospital_id=1, location_id=1001, hospital_name="Columbia Asia Referral Hospital Hebbal", total_icu_beds=30, available_icu_beds=8, total_general_beds=180, available_general_beds=42, trauma_center_level="LEVEL_1"),
            Hospital(hospital_id=2, location_id=1002, hospital_name="Aster CMI Hospital Sahakarnagar", total_icu_beds=40, available_icu_beds=12, total_general_beds=250, available_general_beds=65, trauma_center_level="LEVEL_1")
        ]
        db.add_all(hospitals)
        db.commit()

        # 11. BASELINE DISASTER REPORT & OPERATIONAL INCIDENT
        rep1 = DisasterReport(
            report_id=1,
            report_reference_id="RPT-20261009-HB001",
            reporter_user_id=1,
            location_id=1001,
            disaster_type="Flood",
            description="Severe storm drainage backflow under Hebbal flyover. Water level rising above 4 feet. Trapped commuters on service lane.",
            people_affected=45,
            injuries_reported=3,
            missing_persons=0,
            trapped_persons=12,
            urgent_medical_needed=True,
            evacuation_needed=True,
            status="ACTIVE",
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
