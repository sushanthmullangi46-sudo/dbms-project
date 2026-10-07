-- ====================================================================
-- URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM (UDR-ORP)
-- FILE 01: TABLES, CONSTRAINTS & DATA INTEGRITY
-- Target: Oracle Database (XE / 11g / 19c / 21c)
-- ====================================================================

-- Clean up existing tables (Drop in reverse dependency order)
BEGIN
    FOR t IN (SELECT table_name FROM user_tables WHERE table_name IN (
        'INCIDENT_LOGS', 'FIELD_REPORTS', 'RESOURCE_HANDOVERS', 'INVENTORY_TRANSACTIONS',
        'INVENTORY', 'MISSION_RESOURCES', 'MISSIONS', 'RESPONDER_SKILLS', 'SKILLS',
        'RESPONDERS', 'VEHICLES', 'RESOURCES', 'RESOURCE_TYPES', 'REQUEST_ITEMS',
        'REQUESTS', 'INCIDENT_ZONES', 'INCIDENTS', 'WAREHOUSES', 'SHELTERS',
        'LOCATIONS', 'USERS', 'ROLES'
    )) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
    END LOOP;
END;
/

-- --------------------------------------------------------------------
-- 1. ROLES TABLE
-- --------------------------------------------------------------------
CREATE TABLE ROLES (
    RoleID NUMBER NOT NULL,
    RoleName VARCHAR2(50) NOT NULL,
    Description VARCHAR2(255),
    CONSTRAINT PK_ROLES PRIMARY KEY (RoleID),
    CONSTRAINT UQ_ROLE_NAME UNIQUE (RoleName),
    CONSTRAINT CHK_ROLE_NAME CHECK (RoleName IN ('COMMAND_CENTER', 'FIELD_RESPONDER', 'RESOURCE_PROVIDER'))
);

-- --------------------------------------------------------------------
-- 2. USERS TABLE
-- --------------------------------------------------------------------
CREATE TABLE USERS (
    UserID NUMBER NOT NULL,
    RoleID NUMBER NOT NULL,
    FullName VARCHAR2(100) NOT NULL,
    Email VARCHAR2(100) NOT NULL,
    Phone VARCHAR2(20) NOT NULL,
    PasswordHash VARCHAR2(255) NOT NULL,
    AccountStatus VARCHAR2(20) DEFAULT 'ACTIVE' NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    LastLogin TIMESTAMP,
    CONSTRAINT PK_USERS PRIMARY KEY (UserID),
    CONSTRAINT FK_USERS_ROLE FOREIGN KEY (RoleID) REFERENCES ROLES(RoleID),
    CONSTRAINT UQ_USER_EMAIL UNIQUE (Email),
    CONSTRAINT CHK_USER_STATUS CHECK (AccountStatus IN ('ACTIVE', 'SUSPENDED', 'INACTIVE'))
);

-- --------------------------------------------------------------------
-- 3. LOCATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE LOCATIONS (
    LocationID NUMBER NOT NULL,
    LocationName VARCHAR2(100) NOT NULL,
    Address VARCHAR2(255) NOT NULL,
    City VARCHAR2(50) NOT NULL,
    State VARCHAR2(50) NOT NULL,
    Latitude NUMBER(10,6) NOT NULL,
    Longitude NUMBER(10,6) NOT NULL,
    RiskZone VARCHAR2(20) DEFAULT 'MODERATE' NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_LOCATIONS PRIMARY KEY (LocationID),
    CONSTRAINT CHK_LOC_LAT CHECK (Latitude BETWEEN -90 AND 90),
    CONSTRAINT CHK_LOC_LNG CHECK (Longitude BETWEEN -180 AND 180),
    CONSTRAINT CHK_LOC_RISK CHECK (RiskZone IN ('SAFE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'))
);

-- --------------------------------------------------------------------
-- 4. SHELTERS TABLE
-- --------------------------------------------------------------------
CREATE TABLE SHELTERS (
    ShelterID NUMBER NOT NULL,
    LocationID NUMBER NOT NULL,
    ShelterName VARCHAR2(100) NOT NULL,
    Capacity NUMBER NOT NULL,
    CurrentOccupancy NUMBER DEFAULT 0 NOT NULL,
    MedicalFacility VARCHAR2(1) DEFAULT 'N' NOT NULL,
    WaterAvailable VARCHAR2(1) DEFAULT 'Y' NOT NULL,
    Status VARCHAR2(20) DEFAULT 'OPEN' NOT NULL,
    CONSTRAINT PK_SHELTERS PRIMARY KEY (ShelterID),
    CONSTRAINT FK_SHELTER_LOC FOREIGN KEY (LocationID) REFERENCES LOCATIONS(LocationID),
    CONSTRAINT CHK_SHELTER_CAP CHECK (Capacity > 0),
    CONSTRAINT CHK_SHELTER_OCC CHECK (CurrentOccupancy >= 0),
    CONSTRAINT CHK_SHELTER_MAX CHECK (CurrentOccupancy <= Capacity),
    CONSTRAINT CHK_SHELTER_MED CHECK (MedicalFacility IN ('Y', 'N')),
    CONSTRAINT CHK_SHELTER_WAT CHECK (WaterAvailable IN ('Y', 'N')),
    CONSTRAINT CHK_SHELTER_STAT CHECK (Status IN ('OPEN', 'FULL', 'CLOSED', 'DAMAGED'))
);

-- --------------------------------------------------------------------
-- 5. WAREHOUSES TABLE
-- --------------------------------------------------------------------
CREATE TABLE WAREHOUSES (
    WarehouseID NUMBER NOT NULL,
    LocationID NUMBER NOT NULL,
    WarehouseName VARCHAR2(100) NOT NULL,
    Capacity NUMBER NOT NULL,
    ManagerName VARCHAR2(100) NOT NULL,
    Status VARCHAR2(20) DEFAULT 'ACTIVE' NOT NULL,
    CONSTRAINT PK_WAREHOUSES PRIMARY KEY (WarehouseID),
    CONSTRAINT FK_WH_LOC FOREIGN KEY (LocationID) REFERENCES LOCATIONS(LocationID),
    CONSTRAINT CHK_WH_CAP CHECK (Capacity > 0),
    CONSTRAINT CHK_WH_STAT CHECK (Status IN ('ACTIVE', 'MAINTENANCE', 'INACTIVE'))
);

-- --------------------------------------------------------------------
-- 6. INCIDENTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE INCIDENTS (
    IncidentID NUMBER NOT NULL,
    IncidentName VARCHAR2(150) NOT NULL,
    IncidentType VARCHAR2(50) NOT NULL,
    Severity VARCHAR2(20) NOT NULL,
    LocationID NUMBER NOT NULL,
    Description VARCHAR2(1000) NOT NULL,
    StartTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    EndTime TIMESTAMP,
    Status VARCHAR2(20) DEFAULT 'ACTIVE' NOT NULL,
    CreatedBy NUMBER NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_INCIDENTS PRIMARY KEY (IncidentID),
    CONSTRAINT FK_INC_LOC FOREIGN KEY (LocationID) REFERENCES LOCATIONS(LocationID),
    CONSTRAINT FK_INC_USER FOREIGN KEY (CreatedBy) REFERENCES USERS(UserID),
    CONSTRAINT CHK_INC_TYPE CHECK (IncidentType IN (
        'FLOOD', 'EARTHQUAKE', 'FIRE', 'CYCLONE', 'INDUSTRIAL_ACCIDENT',
        'ROAD_ACCIDENT', 'BUILDING_COLLAPSE', 'CHEMICAL_EMERGENCY', 'OTHER'
    )),
    CONSTRAINT CHK_INC_SEV CHECK (Severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT CHK_INC_STAT CHECK (Status IN ('ACTIVE', 'ON_HOLD', 'RESOLVED', 'CLOSED'))
);

-- --------------------------------------------------------------------
-- 7. INCIDENT_ZONES (Composite Key Table)
-- --------------------------------------------------------------------
CREATE TABLE INCIDENT_ZONES (
    IncidentID NUMBER NOT NULL,
    LocationID NUMBER NOT NULL,
    Severity VARCHAR2(20) NOT NULL,
    PopulationAffected NUMBER DEFAULT 0 NOT NULL,
    Notes VARCHAR2(500),
    CONSTRAINT PK_INCIDENT_ZONES PRIMARY KEY (IncidentID, LocationID),
    CONSTRAINT FK_IZ_INC FOREIGN KEY (IncidentID) REFERENCES INCIDENTS(IncidentID) ON DELETE CASCADE,
    CONSTRAINT FK_IZ_LOC FOREIGN KEY (LocationID) REFERENCES LOCATIONS(LocationID),
    CONSTRAINT CHK_IZ_SEV CHECK (Severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT CHK_IZ_POP CHECK (PopulationAffected >= 0)
);

-- --------------------------------------------------------------------
-- 8. REQUESTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE REQUESTS (
    RequestID NUMBER NOT NULL,
    IncidentID NUMBER NOT NULL,
    LocationID NUMBER NOT NULL,
    RequestedBy NUMBER NOT NULL,
    RequestType VARCHAR2(50) NOT NULL,
    Priority VARCHAR2(20) NOT NULL,
    PeopleAffected NUMBER DEFAULT 1 NOT NULL,
    Description VARCHAR2(1000) NOT NULL,
    Status VARCHAR2(20) DEFAULT 'PENDING' NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ResolvedAt TIMESTAMP,
    CONSTRAINT PK_REQUESTS PRIMARY KEY (RequestID),
    CONSTRAINT FK_REQ_INC FOREIGN KEY (IncidentID) REFERENCES INCIDENTS(IncidentID),
    CONSTRAINT FK_REQ_LOC FOREIGN KEY (LocationID) REFERENCES LOCATIONS(LocationID),
    CONSTRAINT FK_REQ_USER FOREIGN KEY (RequestedBy) REFERENCES USERS(UserID),
    CONSTRAINT CHK_REQ_TYPE CHECK (RequestType IN (
        'RESCUE', 'MEDICAL', 'FOOD', 'WATER', 'SHELTER',
        'TRANSPORT', 'FIRE_RESPONSE', 'LOGISTICS', 'OTHER'
    )),
    CONSTRAINT CHK_REQ_PRIO CHECK (Priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT CHK_REQ_STAT CHECK (Status IN ('PENDING', 'APPROVED', 'ALLOCATED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')),
    CONSTRAINT CHK_REQ_POP CHECK (PeopleAffected >= 0)
);

-- --------------------------------------------------------------------
-- 9. RESOURCE_TYPES TABLE
-- --------------------------------------------------------------------
CREATE TABLE RESOURCE_TYPES (
    ResourceTypeID NUMBER NOT NULL,
    ResourceName VARCHAR2(100) NOT NULL,
    Category VARCHAR2(50) NOT NULL,
    Unit VARCHAR2(30) NOT NULL,
    Description VARCHAR2(255),
    CONSTRAINT PK_RESOURCE_TYPES PRIMARY KEY (ResourceTypeID),
    CONSTRAINT UQ_RES_NAME UNIQUE (ResourceName)
);

-- --------------------------------------------------------------------
-- 10. REQUEST_ITEMS TABLE (Normalized Relationship)
-- --------------------------------------------------------------------
CREATE TABLE REQUEST_ITEMS (
    RequestItemID NUMBER NOT NULL,
    RequestID NUMBER NOT NULL,
    ResourceTypeID NUMBER NOT NULL,
    QuantityRequired NUMBER NOT NULL,
    QuantityAllocated NUMBER DEFAULT 0 NOT NULL,
    Unit VARCHAR2(30) NOT NULL,
    CONSTRAINT PK_REQUEST_ITEMS PRIMARY KEY (RequestItemID),
    CONSTRAINT FK_RI_REQ FOREIGN KEY (RequestID) REFERENCES REQUESTS(RequestID) ON DELETE CASCADE,
    CONSTRAINT FK_RI_RESTYPE FOREIGN KEY (ResourceTypeID) REFERENCES RESOURCE_TYPES(ResourceTypeID),
    CONSTRAINT CHK_RI_REQ_QTY CHECK (QuantityRequired > 0),
    CONSTRAINT CHK_RI_ALLOC_QTY CHECK (QuantityAllocated >= 0),
    CONSTRAINT CHK_RI_ALLOC_LIMIT CHECK (QuantityAllocated <= QuantityRequired)
);

-- --------------------------------------------------------------------
-- 11. RESOURCES TABLE
-- --------------------------------------------------------------------
CREATE TABLE RESOURCES (
    ResourceID NUMBER NOT NULL,
    ProviderID NUMBER NOT NULL,
    ResourceTypeID NUMBER NOT NULL,
    ResourceName VARCHAR2(100) NOT NULL,
    Quantity NUMBER DEFAULT 1 NOT NULL,
    Condition VARCHAR2(30) DEFAULT 'GOOD' NOT NULL,
    AvailabilityStatus VARCHAR2(30) DEFAULT 'AVAILABLE' NOT NULL,
    CurrentLocationID NUMBER,
    RegistrationNumber VARCHAR2(50),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_RESOURCES PRIMARY KEY (ResourceID),
    CONSTRAINT FK_RES_PROV FOREIGN KEY (ProviderID) REFERENCES USERS(UserID),
    CONSTRAINT FK_RES_TYPE FOREIGN KEY (ResourceTypeID) REFERENCES RESOURCE_TYPES(ResourceTypeID),
    CONSTRAINT FK_RES_LOC FOREIGN KEY (CurrentLocationID) REFERENCES LOCATIONS(LocationID),
    CONSTRAINT CHK_RES_QTY CHECK (Quantity >= 0),
    CONSTRAINT CHK_RES_COND CHECK (Condition IN ('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR')),
    CONSTRAINT CHK_RES_AVAIL CHECK (AvailabilityStatus IN ('AVAILABLE', 'ALLOCATED', 'IN_USE', 'DAMAGED', 'UNDER_REPAIR', 'UNAVAILABLE'))
);

-- --------------------------------------------------------------------
-- 12. VEHICLES TABLE
-- --------------------------------------------------------------------
CREATE TABLE VEHICLES (
    VehicleID NUMBER NOT NULL,
    ProviderID NUMBER NOT NULL,
    VehicleType VARCHAR2(50) NOT NULL,
    RegistrationNumber VARCHAR2(50) NOT NULL,
    Capacity NUMBER NOT NULL,
    FuelLevel NUMBER(5,2) DEFAULT 100.00 NOT NULL,
    CurrentLocationID NUMBER,
    Status VARCHAR2(30) DEFAULT 'AVAILABLE' NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_VEHICLES PRIMARY KEY (VehicleID),
    CONSTRAINT FK_VEH_PROV FOREIGN KEY (ProviderID) REFERENCES USERS(UserID),
    CONSTRAINT FK_VEH_LOC FOREIGN KEY (CurrentLocationID) REFERENCES LOCATIONS(LocationID),
    CONSTRAINT UQ_VEH_REG UNIQUE (RegistrationNumber),
    CONSTRAINT CHK_VEH_CAP CHECK (Capacity > 0),
    CONSTRAINT CHK_VEH_FUEL CHECK (FuelLevel BETWEEN 0 AND 100),
    CONSTRAINT CHK_VEH_STAT CHECK (Status IN ('AVAILABLE', 'ALLOCATED', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE'))
);

-- --------------------------------------------------------------------
-- 13. RESPONDERS TABLE
-- --------------------------------------------------------------------
CREATE TABLE RESPONDERS (
    ResponderID NUMBER NOT NULL,
    UserID NUMBER NOT NULL,
    TeamName VARCHAR2(100) NOT NULL,
    Specialization VARCHAR2(100) NOT NULL,
    ExperienceLevel VARCHAR2(30) DEFAULT 'INTERMEDIATE' NOT NULL,
    CurrentStatus VARCHAR2(30) DEFAULT 'AVAILABLE' NOT NULL,
    CurrentLocationID NUMBER,
    AvailabilityStatus VARCHAR2(30) DEFAULT 'AVAILABLE' NOT NULL,
    CONSTRAINT PK_RESPONDERS PRIMARY KEY (ResponderID),
    CONSTRAINT FK_RESP_USER FOREIGN KEY (UserID) REFERENCES USERS(UserID),
    CONSTRAINT FK_RESP_LOC FOREIGN KEY (CurrentLocationID) REFERENCES LOCATIONS(LocationID),
    CONSTRAINT UQ_RESP_USER UNIQUE (UserID),
    CONSTRAINT CHK_RESP_EXP CHECK (ExperienceLevel IN ('ENTRY', 'INTERMEDIATE', 'EXPERT', 'LEAD')),
    CONSTRAINT CHK_RESP_CURR_STAT CHECK (CurrentStatus IN ('AVAILABLE', 'ASSIGNED', 'ON_MISSION', 'OFF_DUTY', 'UNAVAILABLE')),
    CONSTRAINT CHK_RESP_AVAIL CHECK (AvailabilityStatus IN ('AVAILABLE', 'BUSY', 'OFFLINE'))
);

-- --------------------------------------------------------------------
-- 14. SKILLS TABLE
-- --------------------------------------------------------------------
CREATE TABLE SKILLS (
    SkillID NUMBER NOT NULL,
    SkillName VARCHAR2(100) NOT NULL,
    Description VARCHAR2(255),
    CONSTRAINT PK_SKILLS PRIMARY KEY (SkillID),
    CONSTRAINT UQ_SKILL_NAME UNIQUE (SkillName)
);

-- --------------------------------------------------------------------
-- 15. RESPONDER_SKILLS TABLE (Many-to-Many Composite Key)
-- --------------------------------------------------------------------
CREATE TABLE RESPONDER_SKILLS (
    ResponderID NUMBER NOT NULL,
    SkillID NUMBER NOT NULL,
    CertificationLevel VARCHAR2(50) DEFAULT 'CERTIFIED' NOT NULL,
    CertificationExpiry DATE,
    CONSTRAINT PK_RESP_SKILLS PRIMARY KEY (ResponderID, SkillID),
    CONSTRAINT FK_RS_RESP FOREIGN KEY (ResponderID) REFERENCES RESPONDERS(ResponderID) ON DELETE CASCADE,
    CONSTRAINT FK_RS_SKILL FOREIGN KEY (SkillID) REFERENCES SKILLS(SkillID)
);

-- --------------------------------------------------------------------
-- 16. MISSIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE MISSIONS (
    MissionID NUMBER NOT NULL,
    RequestID NUMBER NOT NULL,
    ResponderID NUMBER NOT NULL,
    VehicleID NUMBER,
    AssignedBy NUMBER NOT NULL,
    StartTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ExpectedEndTime TIMESTAMP,
    ActualEndTime TIMESTAMP,
    Status VARCHAR2(30) DEFAULT 'ASSIGNED' NOT NULL,
    Priority VARCHAR2(20) DEFAULT 'MEDIUM' NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_MISSIONS PRIMARY KEY (MissionID),
    CONSTRAINT FK_MISS_REQ FOREIGN KEY (RequestID) REFERENCES REQUESTS(RequestID),
    CONSTRAINT FK_MISS_RESP FOREIGN KEY (ResponderID) REFERENCES RESPONDERS(ResponderID),
    CONSTRAINT FK_MISS_VEH FOREIGN KEY (VehicleID) REFERENCES VEHICLES(VehicleID),
    CONSTRAINT FK_MISS_ADMIN FOREIGN KEY (AssignedBy) REFERENCES USERS(UserID),
    CONSTRAINT CHK_MISS_STAT CHECK (Status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT CHK_MISS_PRIO CHECK (Priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- --------------------------------------------------------------------
-- 17. MISSION_RESOURCES TABLE (Many-to-Many Composite Key)
-- --------------------------------------------------------------------
CREATE TABLE MISSION_RESOURCES (
    MissionID NUMBER NOT NULL,
    ResourceID NUMBER NOT NULL,
    QuantityAllocated NUMBER NOT NULL,
    QuantityUsed NUMBER DEFAULT 0 NOT NULL,
    QuantityReturned NUMBER DEFAULT 0 NOT NULL,
    CONSTRAINT PK_MISSION_RES PRIMARY KEY (MissionID, ResourceID),
    CONSTRAINT FK_MR_MISS FOREIGN KEY (MissionID) REFERENCES MISSIONS(MissionID) ON DELETE CASCADE,
    CONSTRAINT FK_MR_RES FOREIGN KEY (ResourceID) REFERENCES RESOURCES(ResourceID),
    CONSTRAINT CHK_MR_ALLOC CHECK (QuantityAllocated > 0),
    CONSTRAINT CHK_MR_USED CHECK (QuantityUsed >= 0),
    CONSTRAINT CHK_MR_RET CHECK (QuantityReturned >= 0),
    CONSTRAINT CHK_MR_TOTAL CHECK (QuantityUsed + QuantityReturned <= QuantityAllocated)
);

-- --------------------------------------------------------------------
-- 18. INVENTORY TABLE
-- --------------------------------------------------------------------
CREATE TABLE INVENTORY (
    InventoryID NUMBER NOT NULL,
    WarehouseID NUMBER NOT NULL,
    ResourceTypeID NUMBER NOT NULL,
    QuantityAvailable NUMBER DEFAULT 0 NOT NULL,
    ReorderLevel NUMBER DEFAULT 10 NOT NULL,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_INVENTORY PRIMARY KEY (InventoryID),
    CONSTRAINT FK_INV_WH FOREIGN KEY (WarehouseID) REFERENCES WAREHOUSES(WarehouseID),
    CONSTRAINT FK_INV_TYPE FOREIGN KEY (ResourceTypeID) REFERENCES RESOURCE_TYPES(ResourceTypeID),
    CONSTRAINT UQ_WH_RESTYPE UNIQUE (WarehouseID, ResourceTypeID),
    CONSTRAINT CHK_INV_QTY CHECK (QuantityAvailable >= 0),
    CONSTRAINT CHK_INV_REORDER CHECK (ReorderLevel >= 0)
);

-- --------------------------------------------------------------------
-- 19. INVENTORY_TRANSACTIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE INVENTORY_TRANSACTIONS (
    TransactionID NUMBER NOT NULL,
    WarehouseID NUMBER NOT NULL,
    ResourceTypeID NUMBER NOT NULL,
    MissionID NUMBER,
    TransactionType VARCHAR2(30) NOT NULL,
    Quantity NUMBER NOT NULL,
    TransactionTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PerformedBy NUMBER NOT NULL,
    Notes VARCHAR2(500),
    CONSTRAINT PK_INV_TX PRIMARY KEY (TransactionID),
    CONSTRAINT FK_IT_WH FOREIGN KEY (WarehouseID) REFERENCES WAREHOUSES(WarehouseID),
    CONSTRAINT FK_IT_TYPE FOREIGN KEY (ResourceTypeID) REFERENCES RESOURCE_TYPES(ResourceTypeID),
    CONSTRAINT FK_IT_MISS FOREIGN KEY (MissionID) REFERENCES MISSIONS(MissionID),
    CONSTRAINT FK_IT_USER FOREIGN KEY (PerformedBy) REFERENCES USERS(UserID),
    CONSTRAINT CHK_IT_TYPE CHECK (TransactionType IN ('RECEIPT', 'ALLOCATION', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'TRANSFER')),
    CONSTRAINT CHK_IT_QTY CHECK (Quantity > 0)
);

-- --------------------------------------------------------------------
-- 20. RESOURCE_HANDOVERS TABLE
-- --------------------------------------------------------------------
CREATE TABLE RESOURCE_HANDOVERS (
    HandoverID NUMBER NOT NULL,
    ResourceID NUMBER NOT NULL,
    FromUserID NUMBER NOT NULL,
    ToUserID NUMBER NOT NULL,
    Quantity NUMBER NOT NULL,
    HandoverLocationID NUMBER NOT NULL,
    HandoverTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ConditionBefore VARCHAR2(50) DEFAULT 'GOOD' NOT NULL,
    ConditionAfter VARCHAR2(50) DEFAULT 'GOOD' NOT NULL,
    Notes VARCHAR2(500),
    CONSTRAINT PK_HANDOVERS PRIMARY KEY (HandoverID),
    CONSTRAINT FK_HO_RES FOREIGN KEY (ResourceID) REFERENCES RESOURCES(ResourceID),
    CONSTRAINT FK_HO_FROM FOREIGN KEY (FromUserID) REFERENCES USERS(UserID),
    CONSTRAINT FK_HO_TO FOREIGN KEY (ToUserID) REFERENCES USERS(UserID),
    CONSTRAINT FK_HO_LOC FOREIGN KEY (HandoverLocationID) REFERENCES LOCATIONS(LocationID),
    CONSTRAINT CHK_HO_QTY CHECK (Quantity > 0)
);

-- --------------------------------------------------------------------
-- 21. FIELD_REPORTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE FIELD_REPORTS (
    ReportID NUMBER NOT NULL,
    MissionID NUMBER NOT NULL,
    ResponderID NUMBER NOT NULL,
    ReportType VARCHAR2(50) NOT NULL,
    Description VARCHAR2(1000) NOT NULL,
    LocationID NUMBER NOT NULL,
    Severity VARCHAR2(20) DEFAULT 'MEDIUM' NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_FIELD_REPORTS PRIMARY KEY (ReportID),
    CONSTRAINT FK_FR_MISS FOREIGN KEY (MissionID) REFERENCES MISSIONS(MissionID),
    CONSTRAINT FK_FR_RESP FOREIGN KEY (ResponderID) REFERENCES RESPONDERS(ResponderID),
    CONSTRAINT FK_FR_LOC FOREIGN KEY (LocationID) REFERENCES LOCATIONS(LocationID),
    CONSTRAINT CHK_FR_TYPE CHECK (ReportType IN (
        'ROAD_BLOCKED', 'ADDITIONAL_RESOURCE', 'INJURY', 'DAMAGE',
        'WEATHER', 'SAFETY_RISK', 'MISSION_UPDATE', 'OTHER'
    )),
    CONSTRAINT CHK_FR_SEV CHECK (Severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- --------------------------------------------------------------------
-- 22. INCIDENT_LOGS TABLE (Audit Trail)
-- --------------------------------------------------------------------
CREATE TABLE INCIDENT_LOGS (
    LogID NUMBER NOT NULL,
    IncidentID NUMBER NOT NULL,
    UserID NUMBER,
    ActionType VARCHAR2(50) NOT NULL,
    Description VARCHAR2(1000) NOT NULL,
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    IPAddress VARCHAR2(50),
    CONSTRAINT PK_INCIDENT_LOGS PRIMARY KEY (LogID),
    CONSTRAINT FK_IL_INC FOREIGN KEY (IncidentID) REFERENCES INCIDENTS(IncidentID) ON DELETE CASCADE,
    CONSTRAINT FK_IL_USER FOREIGN KEY (UserID) REFERENCES USERS(UserID)
);

COMMIT;
