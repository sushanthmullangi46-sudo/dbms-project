-- ====================================================================
-- SMART URBAN DISASTER INTELLIGENCE, EMERGENCY RESPONSE & RESOURCE ORCHESTRATION PLATFORM (UDRRMS / UDR-ORP)
-- TARGET DATABASE: POSTGRESQL 14+ / 15+ / 16+
-- MASTER RELATIONAL DDL (34 TABLES - 3NF NORMALIZED, CONSTRAINTS & FKs)
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. SCHEMA CLEANUP
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS citizen_feedback CASCADE;
DROP TABLE IF EXISTS roadblock_report CASCADE;
DROP TABLE IF EXISTS emergency_alert CASCADE;
DROP TABLE IF EXISTS evacuation_assignment CASCADE;
DROP TABLE IF EXISTS evacuation_plan CASCADE;
DROP TABLE IF EXISTS team_member CASCADE;
DROP TABLE IF EXISTS rescue_location_history CASCADE;
DROP TABLE IF EXISTS delivery_item CASCADE;
DROP TABLE IF EXISTS delivery CASCADE;
DROP TABLE IF EXISTS resource_allocation CASCADE;
DROP TABLE IF EXISTS request_item CASCADE;
DROP TABLE IF EXISTS resource_request CASCADE;
DROP TABLE IF EXISTS team_assignment CASCADE;
DROP TABLE IF EXISTS affected_person CASCADE;
DROP TABLE IF EXISTS report_attachment CASCADE;
DROP TABLE IF EXISTS report_update CASCADE;
DROP TABLE IF EXISTS disaster_report CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS medical_referral CASCADE;
DROP TABLE IF EXISTS shelter_registration CASCADE;
DROP TABLE IF EXISTS hospital CASCADE;
DROP TABLE IF EXISTS shelter CASCADE;
DROP TABLE IF EXISTS warehouse CASCADE;
DROP TABLE IF EXISTS incident_workflow_event CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS disaster CASCADE;
DROP TABLE IF EXISTS response_team CASCADE;
DROP TABLE IF EXISTS citizen CASCADE;
DROP TABLE IF EXISTS user_account CASCADE;
DROP TABLE IF EXISTS resource CASCADE;
DROP TABLE IF EXISTS disaster_location CASCADE;
DROP TABLE IF EXISTS agency CASCADE;
DROP TABLE IF EXISTS role CASCADE;

-- --------------------------------------------------------------------
-- 1. ROLE (RBAC Hierarchy)
-- --------------------------------------------------------------------
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- --------------------------------------------------------------------
-- 2. AGENCY (NDRF, SDRF, Fire & Emergency, EMS, Municipal Health)
-- --------------------------------------------------------------------
CREATE TABLE agency (
    agency_id SERIAL PRIMARY KEY,
    agency_name VARCHAR(100) NOT NULL UNIQUE,
    agency_type VARCHAR(50) NOT NULL,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100)
);

-- --------------------------------------------------------------------
-- 3. USER_ACCOUNT (Authentication & Identity)
-- --------------------------------------------------------------------
CREATE TABLE user_account (
    user_id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES role(role_id) ON DELETE RESTRICT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    account_status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 4. CITIZEN (Profile & Emergency Metrics)
-- --------------------------------------------------------------------
CREATE TABLE citizen (
    citizen_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES user_account(user_id) ON DELETE CASCADE,
    aadhaar_number VARCHAR(12) UNIQUE,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    blood_group VARCHAR(5),
    home_address TEXT
);

-- --------------------------------------------------------------------
-- 5. DISASTER_LOCATION (GIS Spatial Coordinates & City Wards)
-- --------------------------------------------------------------------
CREATE TABLE disaster_location (
    location_id SERIAL PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL,
    city VARCHAR(60) DEFAULT 'Bengaluru' NOT NULL,
    state VARCHAR(60) DEFAULT 'Karnataka' NOT NULL,
    postal_code VARCHAR(10),
    latitude NUMERIC(10, 6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(10, 6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    risk_level VARCHAR(20) DEFAULT 'MODERATE' NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL'))
);

-- --------------------------------------------------------------------
-- 6. RESOURCE (Standard Supply & Equipment Catalog)
-- --------------------------------------------------------------------
CREATE TABLE resource (
    resource_id SERIAL PRIMARY KEY,
    resource_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('FOOD', 'WATER', 'MEDICAL', 'SHELTER', 'EQUIPMENT', 'HAZMAT', 'POWER', 'FUEL')),
    unit_of_measure VARCHAR(20) NOT NULL
);

-- --------------------------------------------------------------------
-- 7. RESPONSE_TEAM (Tactical Units & First Responder Squads)
-- --------------------------------------------------------------------
CREATE TABLE response_team (
    team_id SERIAL PRIMARY KEY,
    agency_id INT NOT NULL REFERENCES agency(agency_id) ON DELETE RESTRICT,
    team_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(50) NOT NULL CHECK (specialization IN ('WATER_RESCUE', 'COLLAPSE_SAR', 'MEDICAL_TRIAGE', 'HAZMAT', 'FIRE_FIGHTING', 'EVACUATION')),
    current_status VARCHAR(30) DEFAULT 'AVAILABLE' NOT NULL CHECK (current_status IN ('AVAILABLE', 'ASSIGNED', 'ACKNOWLEDGED', 'PREPARING', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'RESCUE_IN_PROGRESS', 'COMPLETED', 'OFF_DUTY')),
    current_latitude NUMERIC(10, 6),
    current_longitude NUMERIC(10, 6),
    contact_phone VARCHAR(50)
);

-- --------------------------------------------------------------------
-- 8. WAREHOUSE (Supply Depot & Logistics Staging Points)
-- --------------------------------------------------------------------
CREATE TABLE warehouse (
    warehouse_id SERIAL PRIMARY KEY,
    warehouse_name VARCHAR(100) NOT NULL,
    location_id INT NOT NULL REFERENCES disaster_location(location_id) ON DELETE RESTRICT,
    manager_name VARCHAR(100) NOT NULL,
    manager_phone VARCHAR(50) NOT NULL,
    capacity_sqm INT DEFAULT 5000 NOT NULL
);

-- --------------------------------------------------------------------
-- 9. INVENTORY (Warehouse Stock Management & Reorder Thresholds)
-- --------------------------------------------------------------------
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    warehouse_id INT NOT NULL REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT,
    resource_id INT NOT NULL REFERENCES resource(resource_id) ON DELETE RESTRICT,
    quantity_available INT DEFAULT 0 NOT NULL CHECK (quantity_available >= 0),
    quantity_reserved INT DEFAULT 0 NOT NULL CHECK (quantity_reserved >= 0),
    reorder_level INT DEFAULT 100 NOT NULL CHECK (reorder_level >= 0),
    CONSTRAINT uq_wh_resource UNIQUE (warehouse_id, resource_id)
);

-- --------------------------------------------------------------------
-- 10. SHELTER (Relief Camps & Evacuation Facilities)
-- --------------------------------------------------------------------
CREATE TABLE shelter (
    shelter_id SERIAL PRIMARY KEY,
    shelter_name VARCHAR(120) NOT NULL,
    location_id INT NOT NULL REFERENCES disaster_location(location_id) ON DELETE RESTRICT,
    capacity INT NOT NULL CHECK (capacity > 0),
    current_occupancy INT DEFAULT 0 NOT NULL CHECK (current_occupancy >= 0),
    status VARCHAR(20) DEFAULT 'OPEN' NOT NULL CHECK (status IN ('OPEN', 'FULL', 'CLOSED')),
    has_medical_unit BOOLEAN DEFAULT TRUE NOT NULL,
    has_potable_water BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT chk_shelter_capacity CHECK (current_occupancy <= capacity)
);

-- --------------------------------------------------------------------
-- 11. HOSPITAL (Emergency Medical & ICU Capacity)
-- --------------------------------------------------------------------
CREATE TABLE hospital (
    hospital_id SERIAL PRIMARY KEY,
    hospital_name VARCHAR(120) NOT NULL,
    location_id INT NOT NULL REFERENCES disaster_location(location_id) ON DELETE RESTRICT,
    total_icu_beds INT DEFAULT 30 NOT NULL CHECK (total_icu_beds >= 0),
    available_icu_beds INT DEFAULT 10 NOT NULL CHECK (available_icu_beds >= 0),
    total_general_beds INT DEFAULT 150 NOT NULL CHECK (total_general_beds >= 0),
    available_general_beds INT DEFAULT 45 NOT NULL CHECK (available_general_beds >= 0),
    trauma_center_level VARCHAR(20) DEFAULT 'LEVEL_1' NOT NULL CHECK (trauma_center_level IN ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'COMMUNITY')),
    CONSTRAINT chk_hosp_icu CHECK (available_icu_beds <= total_icu_beds),
    CONSTRAINT chk_hosp_gen CHECK (available_general_beds <= total_general_beds)
);

-- --------------------------------------------------------------------
-- 12. DISASTER (Central Incident Master Record)
-- --------------------------------------------------------------------
CREATE TABLE disaster (
    disaster_id SERIAL PRIMARY KEY,
    incident_code VARCHAR(30) NOT NULL UNIQUE,
    disaster_type VARCHAR(50) NOT NULL CHECK (disaster_type IN ('Flood', 'Earthquake', 'Fire', 'Cyclone', 'Landslide', 'Industrial', 'Building Collapse', 'Flash Flood')),
    severity VARCHAR(20) DEFAULT 'CRITICAL' NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('REPORTED', 'VERIFIED', 'ACTIVE', 'IN_PROGRESS', 'CONTAINED', 'RESOLVED', 'CLOSED')),
    location_id INT NOT NULL REFERENCES disaster_location(location_id) ON DELETE RESTRICT,
    reported_by INT NOT NULL REFERENCES user_account(user_id) ON DELETE RESTRICT,
    lead_agency_id INT REFERENCES agency(agency_id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE
);

-- --------------------------------------------------------------------
-- 13. DISASTER_REPORT (Citizen Crowdsourced Field Submissions)
-- --------------------------------------------------------------------
CREATE TABLE disaster_report (
    report_id SERIAL PRIMARY KEY,
    report_reference_id VARCHAR(30) UNIQUE,
    disaster_id INT REFERENCES disaster(disaster_id) ON DELETE CASCADE,
    reporter_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE RESTRICT,
    location_id INT NOT NULL REFERENCES disaster_location(location_id) ON DELETE RESTRICT,
    disaster_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'P1' NOT NULL,
    description TEXT NOT NULL,
    estimated_casualties INT DEFAULT 0 NOT NULL CHECK (estimated_casualties >= 0),
    estimated_trapped INT DEFAULT 0 NOT NULL CHECK (estimated_trapped >= 0),
    requires_medical BOOLEAN DEFAULT FALSE NOT NULL,
    requires_food_water BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 14. REPORT_ATTACHMENT (Evidence Photos, Audio & Media)
-- --------------------------------------------------------------------
CREATE TABLE report_attachment (
    attachment_id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES disaster_report(report_id) ON DELETE CASCADE,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size_kb INT DEFAULT 100 NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 15. REPORT_UPDATE (Chronological Situation Reports / SitReps)
-- --------------------------------------------------------------------
CREATE TABLE report_update (
    update_id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES disaster_report(report_id) ON DELETE CASCADE,
    updated_by INT NOT NULL REFERENCES user_account(user_id) ON DELETE RESTRICT,
    update_note TEXT NOT NULL,
    status_snapshot VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 16. AFFECTED_PERSON (Victim Identification, Kin Tracking & Triage)
-- --------------------------------------------------------------------
CREATE TABLE affected_person (
    person_id SERIAL PRIMARY KEY,
    disaster_id INT NOT NULL REFERENCES disaster(disaster_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    age INT CHECK (age >= 0 AND age <= 130),
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    triage_category VARCHAR(20) DEFAULT 'YELLOW' NOT NULL CHECK (triage_category IN ('RED', 'YELLOW', 'GREEN', 'BLACK')),
    injury_notes TEXT,
    contact_phone VARCHAR(50),
    kin_name VARCHAR(100),
    kin_phone VARCHAR(50),
    rescue_status VARCHAR(30) DEFAULT 'TRAPPED' NOT NULL CHECK (rescue_status IN ('TRAPPED', 'RESCUED', 'IN_TRANSIT', 'SHELTERED', 'HOSPITALIZED', 'DECEASED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 17. TEAM_ASSIGNMENT (Tactical Squad Mission Deployment)
-- --------------------------------------------------------------------
CREATE TABLE team_assignment (
    assignment_id SERIAL PRIMARY KEY,
    disaster_id INT NOT NULL REFERENCES disaster(disaster_id) ON DELETE CASCADE,
    team_id INT NOT NULL REFERENCES response_team(team_id) ON DELETE RESTRICT,
    role_description VARCHAR(100) DEFAULT 'Primary Search & Extraction Squad' NOT NULL,
    mission_status VARCHAR(30) DEFAULT 'ASSIGNED' NOT NULL CHECK (mission_status IN ('ASSIGNED', 'ACKNOWLEDGED', 'PREPARING', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'RESCUE_IN_PROGRESS', 'COMPLETED', 'ABORTED')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    arrived_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    debrief_notes TEXT
);

-- --------------------------------------------------------------------
-- 18. RESOURCE_REQUEST (Emergency Logistics Order)
-- --------------------------------------------------------------------
CREATE TABLE resource_request (
    request_id SERIAL PRIMARY KEY,
    disaster_id INT NOT NULL REFERENCES disaster(disaster_id) ON DELETE CASCADE,
    requested_by INT NOT NULL REFERENCES user_account(user_id) ON DELETE RESTRICT,
    request_type VARCHAR(50) DEFAULT 'RELIEF_SUPPLIES' NOT NULL,
    priority VARCHAR(10) DEFAULT 'P1' NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'ALLOCATED', 'DISPATCHED', 'DELIVERED', 'REJECTED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 19. REQUEST_ITEM (Line Items of Requested Resources)
-- --------------------------------------------------------------------
CREATE TABLE request_item (
    request_item_id SERIAL PRIMARY KEY,
    request_id INT NOT NULL REFERENCES resource_request(request_id) ON DELETE CASCADE,
    resource_id INT NOT NULL REFERENCES resource(resource_id) ON DELETE RESTRICT,
    quantity_requested INT NOT NULL CHECK (quantity_requested > 0),
    quantity_fulfilled INT DEFAULT 0 NOT NULL CHECK (quantity_fulfilled >= 0)
);

-- --------------------------------------------------------------------
-- 20. RESOURCE_ALLOCATION (ACID Reservation against Warehouse Stocks)
-- --------------------------------------------------------------------
CREATE TABLE resource_allocation (
    allocation_id SERIAL PRIMARY KEY,
    request_id INT NOT NULL REFERENCES resource_request(request_id) ON DELETE CASCADE,
    warehouse_id INT NOT NULL REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT,
    resource_id INT NOT NULL REFERENCES resource(resource_id) ON DELETE RESTRICT,
    allocated_quantity INT NOT NULL CHECK (allocated_quantity > 0),
    allocated_by INT NOT NULL REFERENCES user_account(user_id) ON DELETE RESTRICT,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_req_wh_res UNIQUE (request_id, warehouse_id, resource_id)
);

-- --------------------------------------------------------------------
-- 21. DELIVERY (Transport Manifest & Convoy Tracking)
-- --------------------------------------------------------------------
CREATE TABLE delivery (
    delivery_id SERIAL PRIMARY KEY,
    warehouse_id INT NOT NULL REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT,
    disaster_id INT NOT NULL REFERENCES disaster(disaster_id) ON DELETE CASCADE,
    transport_driver_name VARCHAR(100),
    vehicle_registration VARCHAR(50),
    delivery_status VARCHAR(30) DEFAULT 'PREPARING' NOT NULL CHECK (delivery_status IN ('PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED')),
    dispatched_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    receiver_name VARCHAR(100),
    proof_of_delivery_note TEXT
);

-- --------------------------------------------------------------------
-- 22. DELIVERY_ITEM (Line Items Transferred per Delivery Convoy)
-- --------------------------------------------------------------------
CREATE TABLE delivery_item (
    delivery_item_id SERIAL PRIMARY KEY,
    delivery_id INT NOT NULL REFERENCES delivery(delivery_id) ON DELETE CASCADE,
    resource_id INT NOT NULL REFERENCES resource(resource_id) ON DELETE RESTRICT,
    quantity_dispatched INT NOT NULL CHECK (quantity_dispatched > 0),
    quantity_received INT DEFAULT 0 NOT NULL CHECK (quantity_received >= 0),
    quantity_damaged INT DEFAULT 0 NOT NULL CHECK (quantity_damaged >= 0)
);

-- --------------------------------------------------------------------
-- 23. SHELTER_REGISTRATION (Evacuee Check-in/Check-out Log)
-- --------------------------------------------------------------------
CREATE TABLE shelter_registration (
    registration_id SERIAL PRIMARY KEY,
    shelter_id INT NOT NULL REFERENCES shelter(shelter_id) ON DELETE RESTRICT,
    citizen_id INT NOT NULL REFERENCES citizen(citizen_id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    dependents_count INT DEFAULT 0 NOT NULL CHECK (dependents_count >= 0),
    special_requirements TEXT
);

-- --------------------------------------------------------------------
-- 24. MEDICAL_REFERRAL (Critical Patient Evacuation to Hospitals)
-- --------------------------------------------------------------------
CREATE TABLE medical_referral (
    referral_id SERIAL PRIMARY KEY,
    disaster_id INT NOT NULL REFERENCES disaster(disaster_id) ON DELETE CASCADE,
    hospital_id INT NOT NULL REFERENCES hospital(hospital_id) ON DELETE RESTRICT,
    patient_name VARCHAR(100) NOT NULL,
    injury_severity VARCHAR(20) NOT NULL CHECK (injury_severity IN ('CRITICAL', 'SERIOUS', 'MODERATE', 'MINOR')),
    assigned_ambulance VARCHAR(50),
    referral_status VARCHAR(30) DEFAULT 'REQUESTED' NOT NULL CHECK (referral_status IN ('REQUESTED', 'ASSIGNED', 'IN_TRANSIT', 'RECEIVED', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE
);

-- --------------------------------------------------------------------
-- 25. NOTIFICATION (Citizen & Responder Dispatch Pushes)
-- --------------------------------------------------------------------
CREATE TABLE notification (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'ALERT' NOT NULL CHECK (notification_type IN ('ALERT', 'DISPATCH', 'STATUS_CHANGE', 'WARNING', 'INFO')),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 26. INCIDENT_WORKFLOW_EVENT (Lifecycle State Transition Log)
-- --------------------------------------------------------------------
CREATE TABLE incident_workflow_event (
    event_id SERIAL PRIMARY KEY,
    disaster_id INT NOT NULL REFERENCES disaster(disaster_id) ON DELETE CASCADE,
    event_type VARCHAR(60) NOT NULL,
    actor_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE RESTRICT,
    previous_state VARCHAR(40),
    new_state VARCHAR(40) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 27. AUDIT_LOG (Immutable Regulatory System Audit Trail)
-- --------------------------------------------------------------------
CREATE TABLE audit_log (
    log_id SERIAL PRIMARY KEY,
    entity_name VARCHAR(60) NOT NULL,
    entity_id VARCHAR(60) NOT NULL,
    action VARCHAR(30) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'STATE_TRANSITION', 'LOGIN', 'SECURITY')),
    performed_by INT NOT NULL,
    actor_name VARCHAR(100),
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 28. RESCUE_LOCATION_HISTORY (Real-time Responder GPS Telemetry)
-- --------------------------------------------------------------------
CREATE TABLE rescue_location_history (
    history_id SERIAL PRIMARY KEY,
    mission_id INT REFERENCES team_assignment(assignment_id) ON DELETE CASCADE,
    team_id INT NOT NULL REFERENCES response_team(team_id) ON DELETE CASCADE,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    speed NUMERIC(5, 2) DEFAULT 0.0,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    accuracy NUMERIC(5, 2) DEFAULT 5.0,
    status_note VARCHAR(100),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 29. TEAM_MEMBER (Specialist Responders Assigned to Squads)
-- --------------------------------------------------------------------
CREATE TABLE team_member (
    member_id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES response_team(team_id) ON DELETE CASCADE,
    member_name VARCHAR(100) NOT NULL,
    role_title VARCHAR(60) DEFAULT 'Rescue Specialist' NOT NULL,
    contact_phone VARCHAR(50),
    badge_number VARCHAR(30) NOT NULL UNIQUE,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 30. EVACUATION_PLAN (Designated Danger Zones & Route Mapping)
-- --------------------------------------------------------------------
CREATE TABLE evacuation_plan (
    plan_id SERIAL PRIMARY KEY,
    disaster_id INT REFERENCES disaster(disaster_id) ON DELETE SET NULL,
    location_id INT NOT NULL REFERENCES disaster_location(location_id) ON DELETE RESTRICT,
    zone_name VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'CRITICAL' NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    priority VARCHAR(10) DEFAULT 'P1' NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
    target_shelter_id INT REFERENCES shelter(shelter_id) ON DELETE SET NULL,
    instructions TEXT NOT NULL,
    evacuation_status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL CHECK (evacuation_status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'SUSPENDED')),
    estimated_evacuees INT DEFAULT 50 NOT NULL CHECK (estimated_evacuees >= 0),
    evacuated_count INT DEFAULT 0 NOT NULL CHECK (evacuated_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- 31. EVACUATION_ASSIGNMENT (Tactical Squad Tasking for Evacuation)
-- --------------------------------------------------------------------
CREATE TABLE evacuation_assignment (
    assignment_id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL REFERENCES evacuation_plan(plan_id) ON DELETE CASCADE,
    team_id INT NOT NULL REFERENCES response_team(team_id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'ASSIGNED' NOT NULL CHECK (status IN ('ASSIGNED', 'EN_ROUTE', 'EVACUATING', 'COMPLETED')),
    evacuees_transported INT DEFAULT 0 NOT NULL CHECK (evacuees_transported >= 0)
);

-- --------------------------------------------------------------------
-- 32. EMERGENCY_ALERT (Targeted & City-Wide Broadcasts)
-- --------------------------------------------------------------------
CREATE TABLE emergency_alert (
    alert_id SERIAL PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('FLOOD_WARNING', 'FIRE_ALERT', 'EVACUATION_NOTICE', 'MEDICAL_EMERGENCY', 'ROAD_CLOSURE', 'GENERAL_SAFETY')),
    severity VARCHAR(20) DEFAULT 'CRITICAL' NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    target_area VARCHAR(120) DEFAULT 'City-wide' NOT NULL,
    message TEXT NOT NULL,
    issued_by INT NOT NULL REFERENCES user_account(user_id) ON DELETE RESTRICT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- --------------------------------------------------------------------
-- 33. ROADBLOCK_REPORT (Hazardous Blocked Passages on Ground)
-- --------------------------------------------------------------------
CREATE TABLE roadblock_report (
    roadblock_id SERIAL PRIMARY KEY,
    disaster_id INT REFERENCES disaster(disaster_id) ON DELETE SET NULL,
    reported_by_team_id INT REFERENCES response_team(team_id) ON DELETE SET NULL,
    road_name VARCHAR(120) NOT NULL,
    blockage_type VARCHAR(50) NOT NULL CHECK (blockage_type IN ('FLOODED_ROAD', 'COLLAPSED_BRIDGE', 'FIRE_HAZARD', 'DEBRIS', 'FALLEN_TREE', 'RESTRICTED_ACCESS')),
    severity VARCHAR(20) DEFAULT 'HIGH' NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    is_passable BOOLEAN DEFAULT FALSE NOT NULL,
    detour_instructions TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cleared_at TIMESTAMP WITH TIME ZONE
);

-- --------------------------------------------------------------------
-- 34. CITIZEN_FEEDBACK (Post-Rescue Operational Evaluation)
-- --------------------------------------------------------------------
CREATE TABLE citizen_feedback (
    feedback_id SERIAL PRIMARY KEY,
    disaster_id INT NOT NULL REFERENCES disaster(disaster_id) ON DELETE CASCADE,
    citizen_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE RESTRICT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    response_speed_rating INT DEFAULT 5 NOT NULL CHECK (response_speed_rating BETWEEN 1 AND 5),
    rescue_team_rating INT DEFAULT 5 NOT NULL CHECK (rescue_team_rating BETWEEN 1 AND 5),
    supplies_rating INT DEFAULT 5 NOT NULL CHECK (supplies_rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- B-TREE PERFORMANCE INDEXES
-- --------------------------------------------------------------------
CREATE INDEX idx_disaster_status ON disaster(status);
CREATE INDEX idx_disaster_loc ON disaster(location_id);
CREATE INDEX idx_report_disaster ON disaster_report(disaster_id);
CREATE INDEX idx_report_status ON disaster_report(status);
CREATE INDEX idx_team_assign_disaster ON team_assignment(disaster_id);
CREATE INDEX idx_team_assign_status ON team_assignment(mission_status);
CREATE INDEX idx_res_req_disaster ON resource_request(disaster_id);
CREATE INDEX idx_res_req_status ON resource_request(status);
CREATE INDEX idx_gps_mission ON rescue_location_history(mission_id);
CREATE INDEX idx_gps_team ON rescue_location_history(team_id);
CREATE INDEX idx_alerts_active ON emergency_alert(is_active);
CREATE INDEX idx_roadblocks_passable ON roadblock_report(is_passable);
CREATE INDEX idx_evac_plan_status ON evacuation_plan(evacuation_status);
