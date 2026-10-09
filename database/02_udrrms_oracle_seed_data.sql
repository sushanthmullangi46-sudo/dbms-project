-- ====================================================================
-- URBAN DISASTER RELIEF AND RESOURCE MANAGEMENT SYSTEM (UDRRMS)
-- TARGET: ORACLE DATABASE XE / 19c / 21c
-- MASTER SEED DATA (BANGALORE MONSOON FLOOD DISASTER SCENARIO)
-- ====================================================================

-- 1. ROLES
INSERT INTO ROLE (RoleName, Description) VALUES ('CITIZEN', 'Citizens and witnesses reporting disasters');
INSERT INTO ROLE (RoleName, Description) VALUES ('DISASTER_OFFICER', 'Incident command & emergency operations officer');
INSERT INTO ROLE (RoleName, Description) VALUES ('COORDINATOR', 'Relief logistics and inventory coordinator');

-- 2. AGENCIES
INSERT INTO AGENCY (AgencyName, AgencyType, ContactPhone, ContactEmail) VALUES ('NDRF 10th Battalion', 'RESCUE', '+91-80-23001111', 'ndrf.blr@udrrms.gov.in');
INSERT INTO AGENCY (AgencyName, AgencyType, ContactPhone, ContactEmail) VALUES ('SDRF Quick Response Unit', 'RESCUE', '+91-80-23002222', 'sdrf.ops@udrrms.gov.in');
INSERT INTO AGENCY (AgencyName, AgencyType, ContactPhone, ContactEmail) VALUES ('Bangalore Emergency Medical Services', 'MEDICAL', '+91-80-23003333', 'ems.triage@udrrms.gov.in');
INSERT INTO AGENCY (AgencyName, AgencyType, ContactPhone, ContactEmail) VALUES ('Fire & Emergency Services Engine 4', 'FIRE', '+91-80-23004444', 'fire.rescue@udrrms.gov.in');
INSERT INTO AGENCY (AgencyName, AgencyType, ContactPhone, ContactEmail) VALUES ('Indian Red Cross Humanitarian Hub', 'NGO', '+91-80-23005555', 'redcross.blr@udrrms.org');

-- 3. USER ACCOUNTS (Password for all demo accounts: password123)
-- bcrypt hash for 'password123': $2b$12$N7x8f99Lq11sD7tC3...
INSERT INTO USER_ACCOUNT (RoleID, FullName, Email, Phone, PasswordHash, AccountStatus)
VALUES (1, 'Aarav Sharma (Citizen)', 'citizen@udrrms.com', '+91-9880112233', '$2b$12$3V52wT4mK9N/X4v4W7xT1eN2L3y5pQ7r9S1u3v5w7x9z1a3b5c7d9', 'ACTIVE');

INSERT INTO USER_ACCOUNT (RoleID, FullName, Email, Phone, PasswordHash, AccountStatus)
VALUES (2, 'Col. Rajesh Varma (Chief Officer)', 'officer@udrrms.com', '+91-9880223344', '$2b$12$3V52wT4mK9N/X4v4W7xT1eN2L3y5pQ7r9S1u3v5w7x9z1a3b5c7d9', 'ACTIVE');

INSERT INTO USER_ACCOUNT (RoleID, FullName, Email, Phone, PasswordHash, AccountStatus)
VALUES (3, 'Dr. Suresh Hegde (Relief Coordinator)', 'coordinator@udrrms.com', '+91-9880334455', '$2b$12$3V52wT4mK9N/X4v4W7xT1eN2L3y5pQ7r9S1u3v5w7x9z1a3b5c7d9', 'ACTIVE');

-- 4. CITIZEN PROFILES
INSERT INTO CITIZEN (UserID, Address, EmergencyContact, SpecialNeeds)
VALUES (1, 'Flat 402, Lakeview Apartments, Hebbal', '+91-9880119999', 'Elderly parent (requires walker and continuous medication)');

-- 5. DISASTER LOCATIONS (Accurate Bangalore Coordinates & Risk Zones)
INSERT INTO DISASTER_LOCATION (LocationName, Address, WardName, City, State, Latitude, Longitude, RiskZone)
VALUES ('Hebbal Flyover Junction', 'Bellary Rd & ORR', 'Hebbal Ward 21', 'Bangalore', 'Karnataka', 13.035800, 77.597000, 'CRITICAL');

INSERT INTO DISASTER_LOCATION (LocationName, Address, WardName, City, State, Latitude, Longitude, RiskZone)
VALUES ('Manyata Embassy Business Park', 'Nagawara Ring Road', 'Nagawara Ward 23', 'Bangalore', 'Karnataka', 13.047500, 77.620000, 'HIGH');

INSERT INTO DISASTER_LOCATION (LocationName, Address, WardName, City, State, Latitude, Longitude, RiskZone)
VALUES ('Yelahanka Old Town Lake Basin', 'Kogilu Main Road', 'Yelahanka Ward 4', 'Bangalore', 'Karnataka', 13.100700, 77.596300, 'CRITICAL');

INSERT INTO DISASTER_LOCATION (LocationName, Address, WardName, City, State, Latitude, Longitude, RiskZone)
VALUES ('Jakkur Aerodrome Sector', 'Jakkur Airfield perimeter', 'Jakkur Ward 5', 'Bangalore', 'Karnataka', 13.078400, 77.604800, 'MODERATE');

INSERT INTO DISASTER_LOCATION (LocationName, Address, WardName, City, State, Latitude, Longitude, RiskZone)
VALUES ('Nagawara Lake Lowlands', 'Govindapura', 'Nagawara Ward 23', 'Bangalore', 'Karnataka', 13.043800, 77.625300, 'HIGH');

INSERT INTO DISASTER_LOCATION (LocationName, Address, WardName, City, State, Latitude, Longitude, RiskZone)
VALUES ('RT Nagar Central Market', 'Dinnur Main Road', 'RT Nagar Ward 32', 'Bangalore', 'Karnataka', 13.024700, 77.594800, 'MODERATE');

INSERT INTO DISASTER_LOCATION (LocationName, Address, WardName, City, State, Latitude, Longitude, RiskZone)
VALUES ('Vidyaranyapura HMT Layout', '4th Block Vidyaranyapura', 'Vidyaranyapura Ward 9', 'Bangalore', 'Karnataka', 13.080500, 77.556200, 'LOW');

INSERT INTO DISASTER_LOCATION (LocationName, Address, WardName, City, State, Latitude, Longitude, RiskZone)
VALUES ('Hennur Cross Radial Road', 'Hennur Ring Rd Junction', 'Hennur Ward 28', 'Bangalore', 'Karnataka', 13.038200, 77.644600, 'MODERATE');

INSERT INTO DISASTER_LOCATION (LocationName, Address, WardName, City, State, Latitude, Longitude, RiskZone)
VALUES ('Sahakarnagar Community Hub', '60 Feet Road', 'Sahakarnagar Ward 18', 'Bangalore', 'Karnataka', 13.062300, 77.587100, 'SAFE');

INSERT INTO DISASTER_LOCATION (LocationName, Address, WardName, City, State, Latitude, Longitude, RiskZone)
VALUES ('Kogilu Cross Industrial Zone', 'Airport Expressway', 'Kogilu Ward 7', 'Bangalore', 'Karnataka', 13.118900, 77.609500, 'HIGH');

-- 6. RESPONSE TEAMS
INSERT INTO RESPONSE_TEAM (AgencyID, TeamName, LeaderName, ContactPhone, Specialization, Capacity, ReadinessStatus)
VALUES (1, 'NDRF Alpha Water Rescue', 'Capt. Arvind Rao', '+91-9845011111', 'WATER_RESCUE', 12, 'AVAILABLE');

INSERT INTO RESPONSE_TEAM (AgencyID, TeamName, LeaderName, ContactPhone, Specialization, Capacity, ReadinessStatus)
VALUES (2, 'SDRF Quick Response Squad', 'Insp. Anita Rao', '+91-9845022222', 'COLLAPSE_SAR', 10, 'AVAILABLE');

INSERT INTO RESPONSE_TEAM (AgencyID, TeamName, LeaderName, ContactPhone, Specialization, Capacity, ReadinessStatus)
VALUES (3, 'EMS Critical Paramedics 1', 'Dr. Priya Nambiar', '+91-9845033333', 'MEDICAL_TRIAGE', 8, 'AVAILABLE');

INSERT INTO RESPONSE_TEAM (AgencyID, TeamName, LeaderName, ContactPhone, Specialization, Capacity, ReadinessStatus)
VALUES (4, 'Fire Engine Rescue Unit 4', 'Cmdr. Suresh Kumar', '+91-9845044444', 'HAZMAT', 15, 'AVAILABLE');

-- 7. RESOURCES CATALOG
INSERT INTO RESOURCE (ResourceName, Category, Unit, IsPerishable, StandardUnitCost)
VALUES ('Inflatable Rescue Boat (Zodiac)', 'EQUIPMENT', 'Boats', 0, 150000.00);

INSERT INTO RESOURCE (ResourceName, Category, Unit, IsPerishable, StandardUnitCost)
VALUES ('High-Pressure Medical Oxygen 50L', 'MEDICAL', 'Cylinders', 0, 4500.00);

INSERT INTO RESOURCE (ResourceName, Category, Unit, IsPerishable, StandardUnitCost)
VALUES ('Emergency 72hr Food Ration Kits', 'FOOD', 'Kits', 1, 850.00);

INSERT INTO RESOURCE (ResourceName, Category, Unit, IsPerishable, StandardUnitCost)
VALUES ('Purified Potable Water 20L Cans', 'WATER', 'Cans', 0, 60.00);

INSERT INTO RESOURCE (ResourceName, Category, Unit, IsPerishable, StandardUnitCost)
VALUES ('Trauma Emergency First Aid Kit', 'MEDICAL', 'Kits', 0, 2200.00);

INSERT INTO RESOURCE (ResourceName, Category, Unit, IsPerishable, StandardUnitCost)
VALUES ('Heavy De-Watering Storm Pump', 'EQUIPMENT', 'Pumps', 0, 65000.00);

INSERT INTO RESOURCE (ResourceName, Category, Unit, IsPerishable, StandardUnitCost)
VALUES ('Thermal Cold Relief Blankets', 'SHELTER_SUPPLIES', 'Blankets', 0, 350.00);

-- 8. WAREHOUSES & INVENTORY
INSERT INTO WAREHOUSE (WarehouseName, LocationID, ManagerName, CapacityPallets, IsActive)
VALUES ('Hebbal Central Disaster Reserve Depot', 1, 'Inspector R. Chettiar', 10000, 1);

INSERT INTO WAREHOUSE (WarehouseName, LocationID, ManagerName, CapacityPallets, IsActive)
VALUES ('Manyata Emergency Logistics Vault', 2, 'T. Sundaram', 8000, 1);

INSERT INTO WAREHOUSE (WarehouseName, LocationID, ManagerName, CapacityPallets, IsActive)
VALUES ('Yelahanka North Relief Warehouse', 3, 'Major B. Varma', 12000, 1);

-- Inventory Balances
INSERT INTO INVENTORY (WarehouseID, ResourceID, QuantityAvailable, QuantityReserved, ReorderThreshold)
VALUES (1, 1, 8, 2, 2);
INSERT INTO INVENTORY (WarehouseID, ResourceID, QuantityAvailable, QuantityReserved, ReorderThreshold)
VALUES (1, 2, 85, 15, 20);
INSERT INTO INVENTORY (WarehouseID, ResourceID, QuantityAvailable, QuantityReserved, ReorderThreshold)
VALUES (1, 3, 2500, 500, 300);
INSERT INTO INVENTORY (WarehouseID, ResourceID, QuantityAvailable, QuantityReserved, ReorderThreshold)
VALUES (1, 4, 4000, 800, 500);
INSERT INTO INVENTORY (WarehouseID, ResourceID, QuantityAvailable, QuantityReserved, ReorderThreshold)
VALUES (1, 5, 320, 40, 50);
INSERT INTO INVENTORY (WarehouseID, ResourceID, QuantityAvailable, QuantityReserved, ReorderThreshold)
VALUES (1, 6, 12, 3, 3);
INSERT INTO INVENTORY (WarehouseID, ResourceID, QuantityAvailable, QuantityReserved, ReorderThreshold)
VALUES (1, 7, 1800, 200, 250);

-- 9. SHELTERS
INSERT INTO SHELTER (ShelterName, LocationID, Capacity, CurrentOccupancy, Status, HasMedicalUnit, HasPotableWater)
VALUES ('Sahakarnagar Indoor Stadium Relief Shelter', 9, 500, 185, 'OPEN', 1, 1);

INSERT INTO SHELTER (ShelterName, LocationID, Capacity, CurrentOccupancy, Status, HasMedicalUnit, HasPotableWater)
VALUES ('Jakkur Government High School Camp', 4, 300, 140, 'OPEN', 1, 1);

INSERT INTO SHELTER (ShelterName, LocationID, Capacity, CurrentOccupancy, Status, HasMedicalUnit, HasPotableWater)
VALUES ('Vidyaranyapura Community Hall', 7, 250, 65, 'OPEN', 0, 1);

INSERT INTO SHELTER (ShelterName, LocationID, Capacity, CurrentOccupancy, Status, HasMedicalUnit, HasPotableWater)
VALUES ('RT Nagar BBMP Relief Shelter', 6, 200, 195, 'FULL', 1, 1);

-- 10. HOSPITALS
INSERT INTO HOSPITAL (HospitalName, LocationID, TotalICUBeds, AvailableICUBeds, TotalGeneralBeds, AvailableGeneralBeds, TraumaCenterLevel)
VALUES ('Columbia Asia Emergency Trauma Center', 1, 35, 12, 200, 60, 'LEVEL_1');

INSERT INTO HOSPITAL (HospitalName, LocationID, TotalICUBeds, AvailableICUBeds, TotalGeneralBeds, AvailableGeneralBeds, TraumaCenterLevel)
VALUES ('Aster CMI Tertiary Care Hospital', 1, 50, 18, 300, 95, 'LEVEL_1');

-- 11. BASELINE DISASTER & REPORT
INSERT INTO DISASTER (IncidentCode, DisasterName, DisasterType, LocationID, SeverityScore, SeverityLevel, Status, ActivatedAt)
VALUES ('INC-20261009-BLR01', 'Bangalore North Zone Flash Flood', 'Flood', 1, 88.50, 'P1', 'ACTIVE', CURRENT_TIMESTAMP);

INSERT INTO DISASTER_REPORT (ReportReferenceID, ReporterUserID, LocationID, DisasterID, DisasterType, Description, PeopleAffected, InjuriesReported, MissingPersons, TrappedPersons, UrgentMedicalNeeded, EvacuationNeeded, Status, VerifiedAt)
VALUES ('RPT-20261009-HB001', 1, 1, 1, 'Flood', 'Bellary Road and Outer Ring Road heavily submerged under 5ft water. Ground floor apartments flooded.', 150, 12, 2, 18, 1, 1, 'VERIFIED', CURRENT_TIMESTAMP);

-- 12. INITIAL AUDIT LOG
INSERT INTO AUDIT_LOG (EntityName, EntityID, Action, PerformedBy, ActorName, Details)
VALUES ('DISASTER', 'INC-20261009-BLR01', 'INCIDENT_ACTIVATED', 2, 'Col. Rajesh Varma', 'System seed initialization: Bangalore North Zone Flash Flood incident activated.');

COMMIT;
