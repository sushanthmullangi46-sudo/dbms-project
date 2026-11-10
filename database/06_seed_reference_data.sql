-- ====================================================================
-- URBAN DISASTER RESPONSE & RELIEF COORDINATION PLATFORM (UDRRMS / UDR-ORP)
-- FILE 06: REFERENCE MASTER DATA ONLY (NO FAKE EMERGENCIES)
-- Target: Oracle Database 19c / 21c / 23c
-- Specification: Section 8 Compliance (Clean Baseline Reference Setup)
-- ====================================================================

-- 1. SYSTEM ROLES
INSERT INTO ROLES (role_id, role_name, description) VALUES (1, 'CITIZEN', 'General public user for filing geocoded distress calls');
INSERT INTO ROLES (role_id, role_name, description) VALUES (2, 'DISASTER_OFFICER', 'Command center administrative officer with verification and dispatch authority');
INSERT INTO ROLES (role_id, role_name, description) VALUES (3, 'COORDINATOR', 'Regional logistics and supply depot manager');
INSERT INTO ROLES (role_id, role_name, description) VALUES (4, 'FIELD_RESPONDER', 'Tactical rescue team lead executing field response operations');

-- 2. DISASTER TAXONOMY TYPES
INSERT INTO DISASTER_TYPES (type_id, type_name, default_severity, icon_identifier) VALUES (1, 'Flood', 'CRITICAL', 'droplet');
INSERT INTO DISASTER_TYPES (type_id, type_name, default_severity, icon_identifier) VALUES (2, 'Fire', 'HIGH', 'flame');
INSERT INTO DISASTER_TYPES (type_id, type_name, default_severity, icon_identifier) VALUES (3, 'Earthquake', 'CRITICAL', 'activity');
INSERT INTO DISASTER_TYPES (type_id, type_name, default_severity, icon_identifier) VALUES (4, 'Cyclone', 'HIGH', 'wind');
INSERT INTO DISASTER_TYPES (type_id, type_name, default_severity, icon_identifier) VALUES (5, 'Structural Collapse', 'CRITICAL', 'alert-triangle');

-- 3. MUNICIPAL LOCATIONS & WARDS
INSERT INTO LOCATIONS (location_id, location_name, ward_name, risk_zone, latitude, longitude) 
VALUES (1001, 'Hebbal Flyover Junction', 'Hebbal Ward 21', 'CRITICAL', 13.035800, 77.597000);
INSERT INTO LOCATIONS (location_id, location_name, ward_name, risk_zone, latitude, longitude) 
VALUES (1002, 'Manyata Embassy Business Park', 'Nagawara Ward 23', 'HIGH', 13.047500, 77.620000);
INSERT INTO LOCATIONS (location_id, location_name, ward_name, risk_zone, latitude, longitude) 
VALUES (1003, 'Yelahanka Old Town Lake Basin', 'Yelahanka Ward 4', 'CRITICAL', 13.100700, 77.596300);
INSERT INTO LOCATIONS (location_id, location_name, ward_name, risk_zone, latitude, longitude) 
VALUES (1004, 'Jakkur Aerodrome Sector', 'Jakkur Ward 5', 'MODERATE', 13.078400, 77.604800);
INSERT INTO LOCATIONS (location_id, location_name, ward_name, risk_zone, latitude, longitude) 
VALUES (1005, 'Nagawara Lake Lowlands', 'Nagawara Ward 23', 'HIGH', 13.045000, 77.615000);

-- 4. MASTER RELIEF RESOURCE CATALOG
INSERT INTO RESOURCES (resource_id, resource_name, category, unit, standard_package_size) 
VALUES (1, 'Inflatable Rescue Boat (Zodiac 4.5m)', 'WATER_RESCUE', 'Boats', 1);
INSERT INTO RESOURCES (resource_id, resource_name, category, unit, standard_package_size) 
VALUES (2, 'High-Pressure Medical Oxygen 50L', 'MEDICAL', 'Cylinders', 1);
INSERT INTO RESOURCES (resource_id, resource_name, category, unit, standard_package_size) 
VALUES (3, 'Emergency 72hr Food Ration Kits', 'RATIONS', 'Kits', 50);
INSERT INTO RESOURCES (resource_id, resource_name, category, unit, standard_package_size) 
VALUES (4, 'Purified Potable Water 20L Cans', 'WATER', 'Cans', 100);
INSERT INTO RESOURCES (resource_id, resource_name, category, unit, standard_package_size) 
VALUES (5, 'Trauma Emergency First Aid Kits', 'MEDICAL', 'Kits', 25);
INSERT INTO RESOURCES (resource_id, resource_name, category, unit, standard_package_size) 
VALUES (6, 'Heavy De-Watering Storm Pump', 'EQUIPMENT', 'Pumps', 1);
INSERT INTO RESOURCES (resource_id, resource_name, category, unit, standard_package_size) 
VALUES (7, 'Thermal Cold Relief Blankets', 'SUPPLIES', 'Blankets', 100);

-- 5. REGIONAL LOGISTICS RESERVE DEPOTS
INSERT INTO WAREHOUSES (warehouse_id, warehouse_name, location_id, capacity_pallets, manager_name, contact_phone, status) 
VALUES (1, 'Hebbal Central Disaster Reserve Depot', 1001, 10000, 'Inspector R. Chettiar', '+91-80-23415671', 'ACTIVE');
INSERT INTO WAREHOUSES (warehouse_id, warehouse_name, location_id, capacity_pallets, manager_name, contact_phone, status) 
VALUES (2, 'Manyata Emergency Logistics Vault', 1002, 8000, 'T. Sundaram', '+91-80-23415672', 'ACTIVE');
INSERT INTO WAREHOUSES (warehouse_id, warehouse_name, location_id, capacity_pallets, manager_name, contact_phone, status) 
VALUES (3, 'Yelahanka North Relief Warehouse', 1003, 12000, 'Major B. Varma', '+91-80-23415673', 'ACTIVE');

-- 6. EMERGENCY RELIEF SHELTERS (INITIAL OCCUPANCY = 0)
INSERT INTO SHELTERS (shelter_id, shelter_name, location_id, capacity, current_occupancy, status, contact_person) 
VALUES (1, 'Sahakarnagar Indoor Stadium Relief Shelter', 1001, 500, 0, 'OPEN', 'V. Natarajan');
INSERT INTO SHELTERS (shelter_id, shelter_name, location_id, capacity, current_occupancy, status, contact_person) 
VALUES (2, 'Jakkur Government High School Camp', 1004, 300, 0, 'OPEN', 'M. Venkatesh');
INSERT INTO SHELTERS (shelter_id, shelter_name, location_id, capacity, current_occupancy, status, contact_person) 
VALUES (3, 'Yelahanka Community Hall Evacuation Camp', 1003, 400, 0, 'OPEN', 'Mrs. Rekha Rao');

-- 7. EMERGENCY TRAUMA HOSPITALS
INSERT INTO HOSPITALS (hospital_id, hospital_name, location_id, total_icu_beds, available_icu_beds, total_general_beds, available_general_beds, contact_number)
VALUES (1, 'Columbia Asia Emergency Trauma Center', 1001, 35, 12, 200, 60, '+91-80-66600000');
INSERT INTO HOSPITALS (hospital_id, hospital_name, location_id, total_icu_beds, available_icu_beds, total_general_beds, available_general_beds, contact_number)
VALUES (2, 'Aster CMI Tertiary Care Hospital', 1001, 50, 18, 300, 95, '+91-80-43420100');

-- 8. AUTHORIZED RESCUE & TACTICAL UNITS
INSERT INTO RESPONSE_TEAMS (team_id, team_name, specialization, leader_name, contact_phone, status) 
VALUES (1, 'NDRF 10th Bn Alpha Squad', 'Search & Rescue (Water / Structural)', 'Commander K. Raghavan', '+91-9880445566', 'AVAILABLE');
INSERT INTO RESPONSE_TEAMS (team_id, team_name, specialization, leader_name, contact_phone, status) 
VALUES (2, 'EMS Rapid Trauma Response Unit 1', 'Advanced Life Support / Medical', 'Dr. Farooq Khan', '+91-9880445577', 'AVAILABLE');
INSERT INTO RESPONSE_TEAMS (team_id, team_name, specialization, leader_name, contact_phone, status) 
VALUES (3, 'Karnataka Fire & Emergency Services Station 4', 'Firefighting & HAZMAT Mitigation', 'Station Officer G. Murthy', '+91-9880445588', 'AVAILABLE');

-- 9. USER ACCOUNTS (INITIAL BASELINE SEED)
-- Passwords hashed with bcrypt: 'password123' -> $2b$12$e86gUuR...
INSERT INTO USER_ACCOUNTS (user_id, role_id, full_name, email, phone, password_hash, is_active)
VALUES (1, 1, 'Aarav Sharma (Citizen)', 'citizen@udrrms.com', '+91-9880112233', '$2b$12$jQjX8o/uL8sQW4yvj8Q9u.d5C3J9K4z3T7q4X8V6l1N5P2B9C8E7O', 1);

INSERT INTO USER_ACCOUNTS (user_id, role_id, full_name, email, phone, password_hash, is_active)
VALUES (2, 2, 'Col. Rajesh Varma (Chief Officer)', 'officer@udrrms.com', '+91-9880223344', '$2b$12$jQjX8o/uL8sQW4yvj8Q9u.d5C3J9K4z3T7q4X8V6l1N5P2B9C8E7O', 1);

INSERT INTO USER_ACCOUNTS (user_id, role_id, full_name, email, phone, password_hash, is_active)
VALUES (3, 3, 'Dr. Suresh Hegde (Relief Coordinator)', 'coordinator@udrrms.com', '+91-9880334455', '$2b$12$jQjX8o/uL8sQW4yvj8Q9u.d5C3J9K4z3T7q4X8V6l1N5P2B9C8E7O', 1);

INSERT INTO USER_ACCOUNTS (user_id, role_id, full_name, email, phone, password_hash, is_active)
VALUES (4, 4, 'Rescue Team Lead (Alpha Squad)', 'rescue@udrrms.com', '+91-9880445566', '$2b$12$jQjX8o/uL8sQW4yvj8Q9u.d5C3J9K4z3T7q4X8V6l1N5P2B9C8E7O', 1);

COMMIT;
