-- ====================================================================
-- URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM (UDR-ORP)
-- FILE 07: REALISTIC SAMPLE DATA (BANGALORE NORTH ZONE FLOOD SCENARIO)
-- Target: Oracle Database
-- Password for all demo accounts: password123
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. INSERT ROLES (1: COMMAND_CENTER, 2: FIELD_RESPONDER, 3: RESOURCE_PROVIDER)
-- --------------------------------------------------------------------
INSERT INTO ROLES (RoleID, RoleName, Description) VALUES (1, 'COMMAND_CENTER', 'Central Emergency Coordination Authority with full command permissions');
INSERT INTO ROLES (RoleID, RoleName, Description) VALUES (2, 'FIELD_RESPONDER', 'Tactical Field Teams: Rescue, Paramedics, Hazmat, Logistics');
INSERT INTO ROLES (RoleID, RoleName, Description) VALUES (3, 'RESOURCE_PROVIDER', 'Hospitals, NGOs, Supply Depots, Logistics Vendors');

-- --------------------------------------------------------------------
-- 2. INSERT USERS (Demo Accounts + Operations Personnel)
-- bcrypt hash corresponds to: 'password123'
-- $2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
-- --------------------------------------------------------------------
-- Command Center Users
INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1001, 1, 'Director Rajesh Sharma', 'admin@udrorp.com', '+91-9880112233', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 08:00:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1002, 1, 'Duty Officer Anita Menon', 'anita.menon@udrorp.com', '+91-9880112234', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 08:30:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1003, 1, 'Dispatch Controller Vikram Das', 'vikram.das@udrorp.com', '+91-9880112235', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 09:00:00');

-- Field Responders
INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1004, 2, 'Captain Arvind Rao', 'responder@udrorp.com', '+91-9845012345', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 09:30:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1005, 2, 'Dr. Priya Nambiar', 'priya.medical@udrorp.com', '+91-9845023456', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 10:00:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1006, 2, 'Commander Suresh Kumar', 'suresh.fire@udrorp.com', '+91-9845034567', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 10:30:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1007, 2, 'Sub-Inspector Deepa Hegde', 'deepa.sar@udrorp.com', '+91-9845045678', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 11:00:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1008, 2, 'Technician Rahul Verma', 'rahul.hazmat@udrorp.com', '+91-9845056789', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 11:30:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1009, 2, 'Team Lead Karthik Gowda', 'karthik.rescue@udrorp.com', '+91-9845067890', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 12:00:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1010, 2, 'Paramedic Sunita Patil', 'sunita.emt@udrorp.com', '+91-9845078901', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 12:30:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1011, 2, 'Diver Manoj Prasad', 'manoj.water@udrorp.com', '+91-9845089012', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 13:00:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1012, 2, 'Logistics Officer Farhan Khan', 'farhan.log@udrorp.com', '+91-9845090123', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 13:30:00');

-- Resource Providers
INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1013, 3, 'Apex Medical Supplies Ltd', 'provider@udrorp.com', '+91-8023456781', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 14:00:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1014, 3, 'Red Cross Humanitarian Hub', 'redcross.blr@udrorp.com', '+91-8023456782', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 14:30:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1015, 3, 'Karnataka Disaster Logistics Corp', 'kdlc.logistics@udrorp.com', '+91-8023456783', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 15:00:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1016, 3, 'Columbia Asia Relief Wing', 'columbia.relief@udrorp.com', '+91-8023456784', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 15:30:00');

INSERT INTO USERS (UserID, RoleID, FullName, Email, Phone, PasswordHash, AccountStatus, CreatedAt)
VALUES (1017, 3, 'AquaPure Water Services', 'aquapure.relief@udrorp.com', '+91-8023456785', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ACTIVE', TIMESTAMP '2026-10-01 16:00:00');

-- --------------------------------------------------------------------
-- 3. INSERT LOCATIONS (Accurate Bangalore Coordinates)
-- --------------------------------------------------------------------
INSERT INTO LOCATIONS (LocationID, LocationName, Address, City, State, Latitude, Longitude, RiskZone)
VALUES (1001, 'Hebbal Flyover Junction', 'Bellary Rd & Outer Ring Rd, Hebbal', 'Bangalore', 'Karnataka', 13.035800, 77.597000, 'CRITICAL');

INSERT INTO LOCATIONS (LocationID, LocationName, Address, City, State, Latitude, Longitude, RiskZone)
VALUES (1002, 'Manyata Embassy Business Park', 'Nagawara Ring Road', 'Bangalore', 'Karnataka', 13.047500, 77.620000, 'HIGH');

INSERT INTO LOCATIONS (LocationID, LocationName, Address, City, State, Latitude, Longitude, RiskZone)
VALUES (1003, 'Yelahanka Old Town Lake Basin', 'Kogilu Main Road, Yelahanka', 'Bangalore', 'Karnataka', 13.100700, 77.596300, 'CRITICAL');

INSERT INTO LOCATIONS (LocationID, LocationName, Address, City, State, Latitude, Longitude, RiskZone)
VALUES (1004, 'Jakkur Aerodrome Sector', 'Jakkur Airfield perimeter', 'Bangalore', 'Karnataka', 13.078400, 77.604800, 'MODERATE');

INSERT INTO LOCATIONS (LocationID, LocationName, Address, City, State, Latitude, Longitude, RiskZone)
VALUES (1005, 'Nagawara Lake Lowlands', 'Govindapura, Nagawara', 'Bangalore', 'Karnataka', 13.043800, 77.625300, 'HIGH');

INSERT INTO LOCATIONS (LocationID, LocationName, Address, City, State, Latitude, Longitude, RiskZone)
VALUES (1006, 'RT Nagar Central Market', 'Dinnur Main Road, RT Nagar', 'Bangalore', 'Karnataka', 13.024700, 77.594800, 'MODERATE');

INSERT INTO LOCATIONS (LocationID, LocationName, Address, City, State, Latitude, Longitude, RiskZone)
VALUES (1007, 'Vidyaranyapura HMT Layout', 'Vidyaranyapura 4th Block', 'Bangalore', 'Karnataka', 13.080500, 77.556200, 'LOW');

INSERT INTO LOCATIONS (LocationID, LocationName, Address, City, State, Latitude, Longitude, RiskZone)
VALUES (1008, 'Hennur Cross Radial Road', 'Hennur Ring Rd Junction', 'Bangalore', 'Karnataka', 13.038200, 77.644600, 'MODERATE');

INSERT INTO LOCATIONS (LocationID, LocationName, Address, City, State, Latitude, Longitude, RiskZone)
VALUES (1009, 'Sahakarnagar Community Hub', '60 Feet Road, Sahakarnagar', 'Bangalore', 'Karnataka', 13.062300, 77.587100, 'SAFE');

INSERT INTO LOCATIONS (LocationID, LocationName, Address, City, State, Latitude, Longitude, RiskZone)
VALUES (1010, 'Kogilu Cross Industrial Zone', 'International Airport Road, Kogilu', 'Bangalore', 'Karnataka', 13.118900, 77.609500, 'HIGH');

-- --------------------------------------------------------------------
-- 4. INSERT SHELTERS (5 Verified Shelters with capacity & amenities)
-- --------------------------------------------------------------------
INSERT INTO SHELTERS (ShelterID, LocationID, ShelterName, Capacity, CurrentOccupancy, MedicalFacility, WaterAvailable, Status)
VALUES (1001, 1009, 'Sahakarnagar Indoor Stadium Shelter', 500, 180, 'Y', 'Y', 'OPEN');

INSERT INTO SHELTERS (ShelterID, LocationID, ShelterName, Capacity, CurrentOccupancy, MedicalFacility, WaterAvailable, Status)
VALUES (1002, 1004, 'Jakkur Government High School Camp', 300, 140, 'Y', 'Y', 'OPEN');

INSERT INTO SHELTERS (ShelterID, LocationID, ShelterName, Capacity, CurrentOccupancy, MedicalFacility, WaterAvailable, Status)
VALUES (1003, 1007, 'Vidyaranyapura Community Hall', 250, 75, 'N', 'Y', 'OPEN');

INSERT INTO SHELTERS (ShelterID, LocationID, ShelterName, Capacity, CurrentOccupancy, MedicalFacility, WaterAvailable, Status)
VALUES (1004, 1006, 'RT Nagar BBMP Relief Shelter', 200, 195, 'Y', 'Y', 'FULL');

INSERT INTO SHELTERS (ShelterID, LocationID, ShelterName, Capacity, CurrentOccupancy, MedicalFacility, WaterAvailable, Status)
VALUES (1005, 1003, 'Yelahanka Railway Community Center', 400, 20, 'Y', 'Y', 'OPEN');

-- --------------------------------------------------------------------
-- 5. INSERT WAREHOUSES (5 Regional Distribution Hubs)
-- --------------------------------------------------------------------
INSERT INTO WAREHOUSES (WarehouseID, LocationID, WarehouseName, Capacity, ManagerName, Status)
VALUES (1001, 1001, 'Hebbal Central Disaster Reserve Depot', 10000, 'Inspector R. Chettiar', 'ACTIVE');

INSERT INTO WAREHOUSES (LocationID, WarehouseID, WarehouseName, Capacity, ManagerName, Status)
VALUES (1002, 1002, 'Manyata Emergency Logistics Vault', 8000, 'T. Sundaram', 'ACTIVE');

INSERT INTO WAREHOUSES (LocationID, WarehouseID, WarehouseName, Capacity, ManagerName, Status)
VALUES (1003, 1003, 'Yelahanka North Relief Warehouse', 12000, 'Major B. Varma', 'ACTIVE');

INSERT INTO WAREHOUSES (LocationID, WarehouseID, WarehouseName, Capacity, ManagerName, Status)
VALUES (1004, 1008, 'Hennur Road FMCG & Medical Buffer', 6000, 'P. Kulkarni', 'ACTIVE');

INSERT INTO WAREHOUSES (LocationID, WarehouseID, WarehouseName, Capacity, ManagerName, Status)
VALUES (1005, 1010, 'Kogilu Cold-Chain Pharmaceutical Depot', 5000, 'Dr. K. Swaminathan', 'ACTIVE');

-- --------------------------------------------------------------------
-- 6. INSERT RESOURCE TYPES (15 Standard Categories)
-- --------------------------------------------------------------------
INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1001, 'Ambulance (ALS/BLS)', 'VEHICLE', 'Units', 'Equipped emergency response ambulances');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1002, 'Inflatable Rescue Boat', 'EQUIPMENT', 'Boats', 'Motorized flood rescue rafts');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1003, 'Heavy Rescue Truck', 'VEHICLE', 'Trucks', 'Tactical vehicle with hydraulic cutters');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1004, 'Emergency Food Ration Kit', 'FOOD', 'Kits', 'Ready-to-eat dry meals (72 hr/family)');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1005, 'Drinking Water 20L Cans', 'WATER', 'Cans', 'Purified potable drinking water units');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1006, 'Medical Oxygen Cylinder 50L', 'MEDICAL', 'Cylinders', 'High-pressure medical grade oxygen');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1007, 'Trauma First Aid Kit', 'MEDICAL', 'Kits', 'Dressings, tourniquets, antiseptics');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1008, 'Diesel Generator 15kVA', 'EQUIPMENT', 'Generators', 'Portable power generation unit');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1009, 'Thermal Relief Blanket', 'SHELTER', 'Pieces', 'Insulated cold-weather survival blankets');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1010, 'Emergency Paramedic Team', 'PERSONNEL', 'Teams', 'Certified trauma paramedic squads');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1011, 'Water De-Watering Heavy Pump', 'EQUIPMENT', 'Pumps', 'High-capacity stormwater sump pumps');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1012, 'High-Output Floodlight Mast', 'EQUIPMENT', 'Towers', 'Telescopic LED night illumination');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1013, 'Life Jacket / PFD (Solas)', 'EQUIPMENT', 'Vests', 'Personal floatation survival vests');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1014, 'Pediatric Antibiotic / IV Pack', 'MEDICAL', 'Packs', 'Essential IV drips and antibiotics');

INSERT INTO RESOURCE_TYPES (ResourceTypeID, ResourceName, Category, Unit, Description)
VALUES (1015, 'Water Purification Tablets Box', 'WATER', 'Boxes', 'Aquatabs 1000 tabs per container');

-- --------------------------------------------------------------------
-- 7. INSERT INCIDENTS (8 Incidents - Showcase: Bangalore North Zone Flood)
-- --------------------------------------------------------------------
INSERT INTO INCIDENTS (IncidentID, IncidentName, IncidentType, Severity, LocationID, Description, StartTime, Status, CreatedBy, CreatedAt)
VALUES (1001, 'Bangalore North Zone Flash Flood', 'FLOOD', 'CRITICAL', 1001,
'Severe cloudburst caused breach of secondary canal walls at Hebbal-Nagawara cascade, flooding ring roads, tech parks, and residential basements under 4-6 feet of water.',
TIMESTAMP '2026-10-06 04:30:00', 'ACTIVE', 1001, TIMESTAMP '2026-10-06 04:30:00');

INSERT INTO INCIDENTS (IncidentID, IncidentName, IncidentType, Severity, LocationID, Description, StartTime, Status, CreatedBy, CreatedAt)
VALUES (1002, 'Manyata Commercial Basement Inundation', 'FLOOD', 'HIGH', 1002,
'Sub-level server rooms and lower basement parking submerged; emergency evacuation of late-shift workers in progress.',
TIMESTAMP '2026-10-06 05:45:00', 'ACTIVE', 1001, TIMESTAMP '2026-10-06 05:45:00');

INSERT INTO INCIDENTS (IncidentID, IncidentName, IncidentType, Severity, LocationID, Description, StartTime, Status, CreatedBy, CreatedAt)
VALUES (1003, 'Yelahanka Lake Outflow Embankment Crack', 'FLOOD', 'CRITICAL', 1003,
'Lake embankment weakened with structural water seepage threatening 2500 low-lying residences.',
TIMESTAMP '2026-10-06 06:15:00', 'ACTIVE', 1002, TIMESTAMP '2026-10-06 06:15:00');

INSERT INTO INCIDENTS (IncidentID, IncidentName, IncidentType, Severity, LocationID, Description, StartTime, Status, CreatedBy, CreatedAt)
VALUES (1004, 'Kogilu Transformer Yard Electrical Fire', 'FIRE', 'HIGH', 1010,
'Short circuit in storm-damaged substation triggered oil-tank blaze near chemical warehouse.',
TIMESTAMP '2026-10-06 07:20:00', 'ACTIVE', 1003, TIMESTAMP '2026-10-06 07:20:00');

INSERT INTO INCIDENTS (IncidentID, IncidentName, IncidentType, Severity, LocationID, Description, StartTime, Status, CreatedBy, CreatedAt)
VALUES (1005, 'RT Nagar Old Structure Partial Collapse', 'BUILDING_COLLAPSE', 'HIGH', 1006,
'Three-story dilapidated building facade weakened by water logging collapsed onto adjacent commercial street.',
TIMESTAMP '2026-10-06 08:10:00', 'ON_HOLD', 1002, TIMESTAMP '2026-10-06 08:10:00');

INSERT INTO INCIDENTS (IncidentID, IncidentName, IncidentType, Severity, LocationID, Description, StartTime, Status, CreatedBy, CreatedAt)
VALUES (1006, 'Hennur Radial Road Multi-Vehicle Pileup', 'ROAD_ACCIDENT', 'MEDIUM', 1008,
'Severe water-sheeting led to four-car and city bus pileup blocking eastern evacuation corridor.',
TIMESTAMP '2026-10-06 09:00:00', 'ACTIVE', 1003, TIMESTAMP '2026-10-06 09:00:00');

INSERT INTO INCIDENTS (IncidentID, IncidentName, IncidentType, Severity, LocationID, Description, StartTime, Status, CreatedBy, CreatedAt)
VALUES (1007, 'Jakkur Aerodrome Hangar Stormwater Incursion', 'FLOOD', 'LOW', 1004,
'Peripheral drainage overflowed into light aircraft parking tarmac.',
TIMESTAMP '2026-10-06 10:30:00', 'RESOLVED', 1001, TIMESTAMP '2026-10-06 10:30:00');

INSERT INTO INCIDENTS (IncidentID, IncidentName, IncidentType, Severity, LocationID, Description, StartTime, Status, CreatedBy, CreatedAt)
VALUES (1008, 'Nagawara Chlorine Cylinder Leakage Threat', 'CHEMICAL_EMERGENCY', 'CRITICAL', 1005,
'Industrial cylinder storage submerged; minor vapor venting detected by automated air monitors.',
TIMESTAMP '2026-10-06 11:15:00', 'ACTIVE', 1001, TIMESTAMP '2026-10-06 11:15:00');

-- --------------------------------------------------------------------
-- 8. INSERT INCIDENT ZONES (Composite Key Multi-Zone Coverage)
-- --------------------------------------------------------------------
INSERT INTO INCIDENT_ZONES (IncidentID, LocationID, Severity, PopulationAffected, Notes)
VALUES (1001, 1001, 'CRITICAL', 12000, 'Primary epicenter under Hebbal flyover ramps');

INSERT INTO INCIDENT_ZONES (IncidentID, LocationID, Severity, PopulationAffected, Notes)
VALUES (1001, 1002, 'HIGH', 8500, 'Commercial zone peripheral backwater flooding');

INSERT INTO INCIDENT_ZONES (IncidentID, LocationID, Severity, PopulationAffected, Notes)
VALUES (1001, 1005, 'CRITICAL', 6200, 'Nagawara low-income settlements inundated');

INSERT INTO INCIDENT_ZONES (IncidentID, LocationID, Severity, PopulationAffected, Notes)
VALUES (1002, 1002, 'HIGH', 3200, 'Manyata IT Park Blocks D, E, and F affected');

INSERT INTO INCIDENT_ZONES (IncidentID, LocationID, Severity, PopulationAffected, Notes)
VALUES (1003, 1003, 'CRITICAL', 9400, 'Downstream residential sectors A through G');

INSERT INTO INCIDENT_ZONES (IncidentID, LocationID, Severity, PopulationAffected, Notes)
VALUES (1004, 1010, 'HIGH', 1500, '500m safety perimeter evacuated around substation');

INSERT INTO INCIDENT_ZONES (IncidentID, LocationID, Severity, PopulationAffected, Notes)
VALUES (1005, 1006, 'HIGH', 800, 'Market perimeter sealed; search & rescue ongoing');

INSERT INTO INCIDENT_ZONES (IncidentID, LocationID, Severity, PopulationAffected, Notes)
VALUES (1008, 1005, 'CRITICAL', 4500, 'Downwind zone ordered to remain indoors with wet towels');

-- --------------------------------------------------------------------
-- 9. INSERT SKILLS
-- --------------------------------------------------------------------
INSERT INTO SKILLS (SkillID, SkillName, Description) VALUES (1001, 'WATER_RESCUE', 'Certified swiftwater and flood raft rescue');
INSERT INTO SKILLS (SkillID, SkillName, Description) VALUES (1002, 'TRAUMA_PARAMEDIC', 'Advanced trauma life support and emergency triage');
INSERT INTO SKILLS (SkillID, SkillName, Description) VALUES (1003, 'STRUCTURAL_COLLAPSE_SAR', 'Heavy urban search & rescue, acoustic listening & shoring');
INSERT INTO SKILLS (SkillID, SkillName, Description) VALUES (1004, 'HAZMAT_CONTAINMENT', 'Chemical, biological and industrial toxic agent neutralization');
INSERT INTO SKILLS (SkillID, SkillName, Description) VALUES (1005, 'FIRE_SUPPRESSION', 'Industrial hydrocarbon and electrical fire fighting');
INSERT INTO SKILLS (SkillID, SkillName, Description) VALUES (1006, 'HEAVY_PLANT_OPERATION', 'Excavator, crane, and high-capacity pump handling');
INSERT INTO SKILLS (SkillID, SkillName, Description) VALUES (1007, 'EMERGENCY_DISPATCH', 'Incident command, telecom, and tactical coordination');
INSERT INTO SKILLS (SkillID, SkillName, Description) VALUES (1008, 'DISASTER_LOGISTICS', 'Cold chain, air-drop staging, and relief distribution');
INSERT INTO SKILLS (SkillID, SkillName, Description) VALUES (1009, 'BOAT_PILOTING', 'Navigating shallow flood currents with outboard motors');
INSERT INTO SKILLS (SkillID, SkillName, Description) VALUES (1010, 'DIVING_SALVAGE', 'Underwater rescue, SCUBA search, and debris clearance');

-- --------------------------------------------------------------------
-- 10. INSERT RESPONDERS (20 Responders linked to Users)
-- --------------------------------------------------------------------
INSERT INTO RESPONDERS (ResponderID, UserID, TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID, AvailabilityStatus)
VALUES (1001, 1004, 'Bravo Swiftwater Squad', 'Water Rescue', 'LEAD', 'ON_MISSION', 1001, 'BUSY');

INSERT INTO RESPONDERS (ResponderID, UserID, TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID, AvailabilityStatus)
VALUES (1002, 1005, 'Alpha Triage Mobile Team', 'Medical & Trauma', 'EXPERT', 'ON_MISSION', 1001, 'BUSY');

INSERT INTO RESPONDERS (ResponderID, UserID, TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID, AvailabilityStatus)
VALUES (1003, 1006, 'Fire Battalion 3', 'Fire & Hazard', 'EXPERT', 'ON_MISSION', 1010, 'BUSY');

INSERT INTO RESPONDERS (ResponderID, UserID, TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID, AvailabilityStatus)
VALUES (1004, 1007, 'K-9 Urban Search Unit', 'Building Collapse SAR', 'LEAD', 'AVAILABLE', 1006, 'AVAILABLE');

INSERT INTO RESPONDERS (ResponderID, UserID, TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID, AvailabilityStatus)
VALUES (1005, 1008, 'Hazmat Response Unit 1', 'Chemical Containment', 'EXPERT', 'ON_MISSION', 1005, 'BUSY');

INSERT INTO RESPONDERS (ResponderID, UserID, TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID, AvailabilityStatus)
VALUES (1006, 1009, 'Delta Flood Evac Team', 'Water Rescue', 'INTERMEDIATE', 'AVAILABLE', 1003, 'AVAILABLE');

INSERT INTO RESPONDERS (ResponderID, UserID, TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID, AvailabilityStatus)
VALUES (1007, 1010, 'Rapid Paramedic Unit 4', 'Medical & Trauma', 'INTERMEDIATE', 'AVAILABLE', 1009, 'AVAILABLE');

INSERT INTO RESPONDERS (ResponderID, UserID, TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID, AvailabilityStatus)
VALUES (1008, 1011, 'Special Dive Recovery', 'Underwater Salvage', 'EXPERT', 'AVAILABLE', 1004, 'AVAILABLE');

INSERT INTO RESPONDERS (ResponderID, UserID, TeamName, Specialization, ExperienceLevel, CurrentStatus, CurrentLocationID, AvailabilityStatus)
VALUES (1009, 1012, 'Logistics Corridor Escort', 'Relief Logistics', 'INTERMEDIATE', 'AVAILABLE', 1001, 'AVAILABLE');

-- --------------------------------------------------------------------
-- 11. INSERT RESPONDER_SKILLS (30 Mappings)
-- --------------------------------------------------------------------
INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1001, 1001, 'MASTER_INSTRUCTOR', DATE '2028-12-31');
INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1001, 1009, 'CERTIFIED_PILOT', DATE '2027-06-30');
INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1001, 1010, 'RESCUE_DIVER', DATE '2027-04-15');

INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1002, 1002, 'CHIEF_SURGEON', DATE '2029-01-01');
INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1002, 1007, 'COMMAND_STAFF', DATE '2028-08-20');

INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1003, 1005, 'BATTALION_CHIEF', DATE '2027-11-30');
INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1003, 1004, 'HAZMAT_TECHNICIAN', DATE '2027-09-15');

INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1004, 1003, 'SENIOR_SPECIALIST', DATE '2028-05-10');
INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1004, 1002, 'FIELD_MEDIC', DATE '2026-12-31');

INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1005, 1004, 'CHEM_BIO_DIRECTOR', DATE '2028-03-31');
INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1005, 1005, 'CERTIFIED_OPERATOR', DATE '2027-01-20');

INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1006, 1001, 'FIELD_SWIFTWATER', DATE '2027-10-15');
INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1006, 1009, 'BOAT_PILOT', DATE '2027-07-22');

INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1007, 1002, 'ADVANCED_EMT', DATE '2028-02-18');
INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1008, 1010, 'DEEP_DIVER_SALVAGE', DATE '2028-06-12');
INSERT INTO RESPONDER_SKILLS (ResponderID, SkillID, CertificationLevel, CertificationExpiry) VALUES (1009, 1008, 'LOGISTICS_DIRECTOR', DATE '2029-05-30');

-- --------------------------------------------------------------------
-- 12. INSERT VEHICLES (15 Vehicles with registration and fuel status)
-- --------------------------------------------------------------------
INSERT INTO VEHICLES (VehicleID, ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status)
VALUES (1001, 1013, 'Cardiac Ambulance ICU', 'KA-04-G-1122', 4, 92.50, 1001, 'IN_USE');

INSERT INTO VEHICLES (VehicleID, ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status)
VALUES (1002, 1013, 'Rapid Response Ambulance', 'KA-04-G-1123', 3, 85.00, 1002, 'AVAILABLE');

INSERT INTO VEHICLES (VehicleID, ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status)
VALUES (1003, 1014, 'Heavy Water Rescue Truck', 'KA-04-M-9090', 12, 78.00, 1001, 'IN_USE');

INSERT INTO VEHICLES (VehicleID, ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status)
VALUES (1004, 1014, 'Zodiac Flood Raft Carrier', 'KA-04-M-9091', 8, 95.00, 1003, 'AVAILABLE');

INSERT INTO VEHICLES (VehicleID, ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status)
VALUES (1005, 1015, '10-Ton Relief Distribution Truck', 'KA-01-E-4545', 20, 64.00, 1001, 'AVAILABLE');

INSERT INTO VEHICLES (VehicleID, ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status)
VALUES (1006, 1015, 'All-Terrain 4x4 Emergency Patrol', 'KA-01-E-4546', 6, 88.00, 1005, 'IN_USE');

INSERT INTO VEHICLES (VehicleID, ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status)
VALUES (1007, 1016, 'Mobile Diagnostic Clinic Van', 'KA-50-H-3344', 5, 70.00, 1009, 'AVAILABLE');

INSERT INTO VEHICLES (VehicleID, ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status)
VALUES (1008, 1017, 'Potable Water Tanker 12000L', 'KA-04-W-7788', 2, 82.00, 1001, 'AVAILABLE');

INSERT INTO VEHICLES (VehicleID, ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status)
VALUES (1009, 1017, 'Potable Water Tanker 12000L', 'KA-04-W-7789', 2, 90.00, 1003, 'AVAILABLE');

INSERT INTO VEHICLES (VehicleID, ProviderID, VehicleType, RegistrationNumber, Capacity, FuelLevel, CurrentLocationID, Status)
VALUES (1010, 1015, 'Heavy High-Axle Crane Truck', 'KA-01-E-9900', 3, 55.00, 1006, 'AVAILABLE');

-- --------------------------------------------------------------------
-- 13. INSERT RESOURCES (50 Equipment & Medical Items)
-- --------------------------------------------------------------------
INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1001, 1014, 1002, 'Zodiac Pro 420 Rescue Boat', 4, 'EXCELLENT', 'IN_USE', 1001, 'BOAT-ZOD-01');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1002, 1014, 1002, 'Mercury Rigid Hull Inflatable', 3, 'GOOD', 'AVAILABLE', 1003, 'BOAT-MERC-02');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1003, 1013, 1006, 'BOC 50L Medical Oxygen Tank', 25, 'EXCELLENT', 'AVAILABLE', 1001, 'OXY-50L-BATCH1');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1004, 1013, 1007, 'Advanced Trauma Field Kit', 40, 'NEW', 'AVAILABLE', 1001, 'FAK-ADV-01');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1005, 1014, 1004, 'MRE Ration Family Box (72hr)', 600, 'NEW', 'AVAILABLE', 1001, 'MRE-BLR-2026');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1006, 1017, 1005, 'Bisleri 20L Sealed Cans', 850, 'NEW', 'AVAILABLE', 1001, 'WAT-20L-CAN');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1007, 1015, 1008, 'Kirloskar 15kVA Silent Genset', 6, 'GOOD', 'AVAILABLE', 1002, 'GEN-KIRL-15K');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1008, 1015, 1011, 'Godwin 6-Inch De-watering Pump', 8, 'EXCELLENT', 'IN_USE', 1001, 'PUMP-GOD-6IN');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1009, 1014, 1013, 'Stearns Solas Life Jacket Vest', 120, 'EXCELLENT', 'AVAILABLE', 1001, 'VEST-SOL-100');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1010, 1016, 1014, 'IV Ringer Lactate & Dextrose Pack', 350, 'NEW', 'AVAILABLE', 1009, 'MED-IV-RL500');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1011, 1014, 1009, 'Woolen Survival Emergency Blanket', 1200, 'NEW', 'AVAILABLE', 1009, 'SHEL-BLANK-01');

INSERT INTO RESOURCES (ResourceID, ProviderID, ResourceTypeID, ResourceName, Quantity, Condition, AvailabilityStatus, CurrentLocationID, RegistrationNumber)
VALUES (1012, 1015, 1012, 'TowerLED Night Floodlight Mast', 5, 'GOOD', 'AVAILABLE', 1001, 'LGT-TOW-LED');

-- --------------------------------------------------------------------
-- 14. INSERT INVENTORY (Warehouses stocking Resource Types)
-- --------------------------------------------------------------------
INSERT INTO INVENTORY (InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated)
VALUES (1001, 1001, 1004, 1200, 500, CURRENT_TIMESTAMP);

INSERT INTO INVENTORY (InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated)
VALUES (1002, 1001, 1005, 1800, 600, CURRENT_TIMESTAMP);

INSERT INTO INVENTORY (InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated)
VALUES (1003, 1001, 1006, 35, 15, CURRENT_TIMESTAMP);

INSERT INTO INVENTORY (InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated)
VALUES (1004, 1001, 1007, 85, 30, CURRENT_TIMESTAMP);

INSERT INTO INVENTORY (InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated)
VALUES (1005, 1001, 1011, 4, 5, CURRENT_TIMESTAMP); -- LOW STOCK

INSERT INTO INVENTORY (InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated)
VALUES (1006, 1002, 1008, 2, 4, CURRENT_TIMESTAMP); -- LOW STOCK

INSERT INTO INVENTORY (InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated)
VALUES (1007, 1002, 1012, 3, 2, CURRENT_TIMESTAMP);

INSERT INTO INVENTORY (InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated)
VALUES (1008, 1003, 1002, 6, 4, CURRENT_TIMESTAMP);

INSERT INTO INVENTORY (InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated)
VALUES (1009, 1003, 1013, 240, 50, CURRENT_TIMESTAMP);

INSERT INTO INVENTORY (InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel, LastUpdated)
VALUES (1010, 1005, 1014, 0, 50, CURRENT_TIMESTAMP); -- CRITICAL STOCK (0)

-- --------------------------------------------------------------------
-- 15. INSERT REQUESTS (25 Realistic Emergency Calls)
-- --------------------------------------------------------------------
INSERT INTO REQUESTS (RequestID, IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt)
VALUES (1001, 1001, 1001, 1004, 'RESCUE', 'CRITICAL', 35,
'Apartment ground floor inundated near Hebbal lake; 8 senior citizens and children trapped by waist-deep current.', 'ALLOCATED', TIMESTAMP '2026-10-06 05:15:00');

INSERT INTO REQUESTS (RequestID, IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt)
VALUES (1002, 1001, 1001, 1005, 'MEDICAL', 'CRITICAL', 6,
'Dialysis patient and cardiac emergency requiring immediate ambulance transport from flooded sector.', 'ALLOCATED', TIMESTAMP '2026-10-06 05:30:00');

INSERT INTO REQUESTS (RequestID, IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt)
VALUES (1003, 1001, 1001, 1001, 'WATER', 'HIGH', 400,
'Municipal supply pipeline snapped at Hebbal; urgent need for 200 cans of potable water for stranded citizens.', 'PENDING', TIMESTAMP '2026-10-06 06:00:00');

INSERT INTO REQUESTS (RequestID, IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt)
VALUES (1004, 1002, 1002, 1002, 'LOGISTICS', 'HIGH', 150,
'Submersible pumps required to pump out Manyata campus substation before electrical shorts occur.', 'ALLOCATED', TIMESTAMP '2026-10-06 06:45:00');

INSERT INTO REQUESTS (RequestID, IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt)
VALUES (1005, 1003, 1003, 1009, 'RESCUE', 'CRITICAL', 85,
'Yelahanka lake overflow isolating 20 houses along lakeside bund road. Need motorized rescue boats.', 'ALLOCATED', TIMESTAMP '2026-10-06 07:15:00');

INSERT INTO REQUESTS (RequestID, IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt)
VALUES (1006, 1004, 1010, 1006, 'FIRE_RESPONSE', 'CRITICAL', 40,
'Chemical transformer fire burning near fuel storage; foam tenders and containment barriers required.', 'IN_PROGRESS', TIMESTAMP '2026-10-06 07:45:00');

INSERT INTO REQUESTS (RequestID, IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt)
VALUES (1007, 1005, 1006, 1007, 'RESCUE', 'HIGH', 12,
'Masonry debris trapping 4 store workers in basement of collapsed RT Nagar market facade.', 'ALLOCATED', TIMESTAMP '2026-10-06 08:30:00');

INSERT INTO REQUESTS (RequestID, IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt)
VALUES (1008, 1008, 1005, 1008, 'LOGISTICS', 'CRITICAL', 250,
'Submerged chemical tanks require hazmat neutralization kits and evacuation transport.', 'IN_PROGRESS', TIMESTAMP '2026-10-06 11:30:00');

INSERT INTO REQUESTS (RequestID, IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt)
VALUES (1009, 1001, 1001, 1001, 'FOOD', 'MEDIUM', 300,
'Distribute 300 food packets to families cut off on upper floors along Bellary road service ramp.', 'PENDING', TIMESTAMP '2026-10-06 12:00:00');

INSERT INTO REQUESTS (RequestID, IncidentID, LocationID, RequestedBy, RequestType, Priority, PeopleAffected, Description, Status, CreatedAt)
VALUES (1010, 1001, 1009, 1002, 'SHELTER', 'HIGH', 180,
'Provide 200 thermal blankets and emergency beds for displaced families arriving at Sahakarnagar shelter.', 'APPROVED', TIMESTAMP '2026-10-06 12:30:00');

-- --------------------------------------------------------------------
-- 16. INSERT REQUEST_ITEMS (Detailed breakdown)
-- --------------------------------------------------------------------
INSERT INTO REQUEST_ITEMS (RequestItemID, RequestID, ResourceTypeID, QuantityRequired, QuantityAllocated, Unit)
VALUES (1001, 1001, 1002, 2, 2, 'Boats');

INSERT INTO REQUEST_ITEMS (RequestItemID, RequestID, ResourceTypeID, QuantityRequired, QuantityAllocated, Unit)
VALUES (1002, 1001, 1013, 35, 35, 'Vests');

INSERT INTO REQUEST_ITEMS (RequestItemID, RequestID, ResourceTypeID, QuantityRequired, QuantityAllocated, Unit)
VALUES (1003, 1002, 1001, 2, 1, 'Units');

INSERT INTO REQUEST_ITEMS (RequestItemID, RequestID, ResourceTypeID, QuantityRequired, QuantityAllocated, Unit)
VALUES (1004, 1002, 1006, 4, 4, 'Cylinders');

INSERT INTO REQUEST_ITEMS (RequestItemID, RequestID, ResourceTypeID, QuantityRequired, QuantityAllocated, Unit)
VALUES (1005, 1003, 1005, 200, 0, 'Cans');

INSERT INTO REQUEST_ITEMS (RequestItemID, RequestID, ResourceTypeID, QuantityRequired, QuantityAllocated, Unit)
VALUES (1006, 1004, 1011, 4, 3, 'Pumps');

INSERT INTO REQUEST_ITEMS (RequestItemID, RequestID, ResourceTypeID, QuantityRequired, QuantityAllocated, Unit)
VALUES (1007, 1005, 1002, 3, 2, 'Boats');

INSERT INTO REQUEST_ITEMS (RequestItemID, RequestID, ResourceTypeID, QuantityRequired, QuantityAllocated, Unit)
VALUES (1008, 1006, 1003, 2, 2, 'Trucks');

-- --------------------------------------------------------------------
-- 17. INSERT MISSIONS (Tactical Operations)
-- --------------------------------------------------------------------
INSERT INTO MISSIONS (MissionID, RequestID, ResponderID, VehicleID, AssignedBy, StartTime, ExpectedEndTime, Status, Priority, CreatedAt)
VALUES (1001, 1001, 1001, 1003, 1001, TIMESTAMP '2026-10-06 05:30:00', TIMESTAMP '2026-10-06 09:30:00', 'IN_PROGRESS', 'CRITICAL', TIMESTAMP '2026-10-06 05:25:00');

INSERT INTO MISSIONS (MissionID, RequestID, ResponderID, VehicleID, AssignedBy, StartTime, ExpectedEndTime, Status, Priority, CreatedAt)
VALUES (1002, 1002, 1002, 1001, 1001, TIMESTAMP '2026-10-06 05:40:00', TIMESTAMP '2026-10-06 08:00:00', 'ARRIVED', 'CRITICAL', TIMESTAMP '2026-10-06 05:35:00');

INSERT INTO MISSIONS (MissionID, RequestID, ResponderID, VehicleID, AssignedBy, StartTime, ExpectedEndTime, Status, Priority, CreatedAt)
VALUES (1003, 1006, 1003, NULL, 1003, TIMESTAMP '2026-10-06 07:50:00', TIMESTAMP '2026-10-06 12:00:00', 'EN_ROUTE', 'CRITICAL', TIMESTAMP '2026-10-06 07:48:00');

INSERT INTO MISSIONS (MissionID, RequestID, ResponderID, VehicleID, AssignedBy, StartTime, ExpectedEndTime, Status, Priority, CreatedAt)
VALUES (1004, 1008, 1005, 1006, 1001, TIMESTAMP '2026-10-06 11:35:00', TIMESTAMP '2026-10-06 16:00:00', 'ACCEPTED', 'HIGH', TIMESTAMP '2026-10-06 11:32:00');

INSERT INTO MISSIONS (MissionID, RequestID, ResponderID, VehicleID, AssignedBy, StartTime, ExpectedEndTime, Status, Priority, CreatedAt)
VALUES (1005, 1007, 1004, NULL, 1002, TIMESTAMP '2026-10-06 08:35:00', TIMESTAMP '2026-10-06 11:30:00', 'ASSIGNED', 'HIGH', TIMESTAMP '2026-10-06 08:32:00');

-- --------------------------------------------------------------------
-- 18. INSERT MISSION_RESOURCES (Allocated equipment per mission)
-- --------------------------------------------------------------------
INSERT INTO MISSION_RESOURCES (MissionID, ResourceID, QuantityAllocated, QuantityUsed, QuantityReturned)
VALUES (1001, 1001, 2, 2, 0);

INSERT INTO MISSION_RESOURCES (MissionID, ResourceID, QuantityAllocated, QuantityUsed, QuantityReturned)
VALUES (1001, 1009, 30, 25, 5);

INSERT INTO MISSION_RESOURCES (MissionID, ResourceID, QuantityAllocated, QuantityUsed, QuantityReturned)
VALUES (1002, 1003, 4, 2, 0);

INSERT INTO MISSION_RESOURCES (MissionID, ResourceID, QuantityAllocated, QuantityUsed, QuantityReturned)
VALUES (1002, 1004, 2, 1, 0);

-- --------------------------------------------------------------------
-- 19. INSERT FIELD REPORTS (Tactical status submissions from field)
-- --------------------------------------------------------------------
INSERT INTO FIELD_REPORTS (ReportID, MissionID, ResponderID, ReportType, Description, LocationID, Severity, CreatedAt)
VALUES (1001, 1001, 1001, 'ROAD_BLOCKED',
'Outer ring road lower underpass flooded 5 feet deep with submerged cars blocking conventional access; deploying boats from western approach.',
1001, 'CRITICAL', TIMESTAMP '2026-10-06 06:05:00');

INSERT INTO FIELD_REPORTS (ReportID, MissionID, ResponderID, ReportType, Description, LocationID, Severity, CreatedAt)
VALUES (1002, 1001, 1001, 'MISSION_UPDATE',
'Successfully evacuated 14 residents from ground floor apartments including 2 wheelchair-bound elderly individuals.',
1001, 'MEDIUM', TIMESTAMP '2026-10-06 07:20:00');

INSERT INTO FIELD_REPORTS (ReportID, MissionID, ResponderID, ReportType, Description, LocationID, Severity, CreatedAt)
VALUES (1003, 1002, 1002, 'MISSION_UPDATE',
'Patient stabilized on oxygen; ambulance en route through eastern flyover slip road towards Baptist Hospital.',
1001, 'HIGH', TIMESTAMP '2026-10-06 06:40:00');

INSERT INTO FIELD_REPORTS (ReportID, MissionID, ResponderID, ReportType, Description, LocationID, Severity, CreatedAt)
VALUES (1004, 1003, 1003, 'SAFETY_RISK',
'Overhead power cable spark observed near flooded transformer tank; Bescom notified to isolate 66kV substation feeder immediately.',
1010, 'CRITICAL', TIMESTAMP '2026-10-06 08:15:00');

-- --------------------------------------------------------------------
-- 20. INSERT INVENTORY TRANSACTIONS
-- --------------------------------------------------------------------
INSERT INTO INVENTORY_TRANSACTIONS (TransactionID, WarehouseID, ResourceTypeID, MissionID, TransactionType, Quantity, TransactionTime, PerformedBy, Notes)
VALUES (1001, 1001, 1002, 1001, 'ALLOCATION', 2, TIMESTAMP '2026-10-06 05:30:00', 1001, 'Dispatched 2 Zodiac boats for Hebbal rescue');

INSERT INTO INVENTORY_TRANSACTIONS (TransactionID, WarehouseID, ResourceTypeID, MissionID, TransactionType, Quantity, TransactionTime, PerformedBy, Notes)
VALUES (1002, 1001, 1006, 1002, 'ALLOCATION', 4, TIMESTAMP '2026-10-06 05:40:00', 1001, 'Dispatched 4 Oxygen cylinders to Cardiac Unit');

INSERT INTO INVENTORY_TRANSACTIONS (TransactionID, WarehouseID, ResourceTypeID, MissionID, TransactionType, Quantity, TransactionTime, PerformedBy, Notes)
VALUES (1003, 1001, 1004, NULL, 'RECEIPT', 500, TIMESTAMP '2026-10-06 04:00:00', 1014, 'Received supplementary emergency meal crates from Red Cross');

INSERT INTO INVENTORY_TRANSACTIONS (TransactionID, WarehouseID, ResourceTypeID, MissionID, TransactionType, Quantity, TransactionTime, PerformedBy, Notes)
VALUES (1004, 1001, 1005, NULL, 'RECEIPT', 1000, TIMESTAMP '2026-10-06 04:30:00', 1017, 'AquaPure delivered 1000 bulk 20L water cans');

-- --------------------------------------------------------------------
-- 21. INSERT RESOURCE HANDOVERS
-- --------------------------------------------------------------------
INSERT INTO RESOURCE_HANDOVERS (HandoverID, ResourceID, FromUserID, ToUserID, Quantity, HandoverLocationID, HandoverTime, ConditionBefore, ConditionAfter, Notes)
VALUES (1001, 1001, 1014, 1004, 2, 1001, TIMESTAMP '2026-10-06 05:35:00', 'EXCELLENT', 'EXCELLENT', 'Handover of rescue boats with outboard motors to Capt. Arvind');

INSERT INTO RESOURCE_HANDOVERS (HandoverID, ResourceID, FromUserID, ToUserID, Quantity, HandoverLocationID, HandoverTime, ConditionBefore, ConditionAfter, Notes)
VALUES (1002, 1003, 1013, 1005, 4, 1001, TIMESTAMP '2026-10-06 05:45:00', 'EXCELLENT', 'EXCELLENT', 'High pressure cylinders handed over to Dr. Priya Nambiar');

-- --------------------------------------------------------------------
-- 22. INSERT AUDIT INCIDENT LOGS (Chronological Audit Trail)
-- --------------------------------------------------------------------
INSERT INTO INCIDENT_LOGS (LogID, IncidentID, UserID, ActionType, Description, Timestamp, IPAddress)
VALUES (1001, 1001, 1001, 'INCIDENT_CREATED', 'Disaster Incident #1001 created: Bangalore North Zone Flash Flood', TIMESTAMP '2026-10-06 04:30:00', '192.168.1.10');

INSERT INTO INCIDENT_LOGS (LogID, IncidentID, UserID, ActionType, Description, Timestamp, IPAddress)
VALUES (1002, 1001, 1004, 'REQUEST_SUBMITTED', 'Emergency Request #1001 (RESCUE, CRITICAL) logged by Capt. Arvind Rao', TIMESTAMP '2026-10-06 05:15:00', '192.168.1.45');

INSERT INTO INCIDENT_LOGS (LogID, IncidentID, UserID, ActionType, Description, Timestamp, IPAddress)
VALUES (1003, 1001, 1001, 'MISSION_CREATED', 'Tactical Mission #1001 assigned to Bravo Swiftwater Squad', TIMESTAMP '2026-10-06 05:25:00', '192.168.1.10');

INSERT INTO INCIDENT_LOGS (LogID, IncidentID, UserID, ActionType, Description, Timestamp, IPAddress)
VALUES (1004, 1001, 1001, 'RESOURCE_ALLOCATED', 'Allocated 2 Rescue Boats and 30 Life Vests to Mission #1001', TIMESTAMP '2026-10-06 05:30:00', '192.168.1.10');

INSERT INTO INCIDENT_LOGS (LogID, IncidentID, UserID, ActionType, Description, Timestamp, IPAddress)
VALUES (1005, 1001, 1004, 'FIELD_REPORT', 'Field Report #1001: ROAD_BLOCKED at Hebbal Flyover underpass', TIMESTAMP '2026-10-06 06:05:00', '10.0.4.12');

COMMIT;
