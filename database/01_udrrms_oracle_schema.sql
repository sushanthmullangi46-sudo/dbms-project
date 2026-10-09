-- ====================================================================
-- URBAN DISASTER RELIEF AND RESOURCE MANAGEMENT SYSTEM (UDRRMS)
-- TARGET DATABASE: ORACLE DATABASE XE / 19c / 21c
-- MASTER RELATIONAL DDL (27 3NF NORMALIZED TABLES)
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. CLEANUP (DROP IF EXISTS)
-- --------------------------------------------------------------------
BEGIN
    FOR t IN (SELECT table_name FROM user_tables WHERE table_name IN (
        'AUDIT_LOG', 'INCIDENT_WORKFLOW_EVENT', 'NOTIFICATION', 'MEDICAL_REFERRAL',
        'HOSPITAL', 'SHELTER_REGISTRATION', 'SHELTER', 'DELIVERY_ITEM', 'DELIVERY',
        'RESOURCE_ALLOCATION', 'REQUEST_ITEM', 'RESOURCE_REQUEST', 'INVENTORY',
        'WAREHOUSE', 'RESOURCE', 'TEAM_ASSIGNMENT', 'RESPONSE_TEAM', 'AFFECTED_PERSON',
        'DISASTER', 'REPORT_UPDATE', 'REPORT_ATTACHMENT', 'DISASTER_REPORT',
        'DISASTER_LOCATION', 'CITIZEN', 'USER_ACCOUNT', 'AGENCY', 'ROLE'
    )) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS PURGE';
    END LOOP;
END;
/

-- --------------------------------------------------------------------
-- 1. ROLE
-- --------------------------------------------------------------------
CREATE TABLE ROLE (
    RoleID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RoleName VARCHAR2(50) NOT NULL UNIQUE,
    Description VARCHAR2(255)
);

-- --------------------------------------------------------------------
-- 2. AGENCY
-- --------------------------------------------------------------------
CREATE TABLE AGENCY (
    AgencyID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    AgencyName VARCHAR2(100) NOT NULL UNIQUE,
    AgencyType VARCHAR2(50) NOT NULL,
    ContactPhone VARCHAR2(50),
    ContactEmail VARCHAR2(100)
);

-- --------------------------------------------------------------------
-- 3. USER_ACCOUNT
-- --------------------------------------------------------------------
CREATE TABLE USER_ACCOUNT (
    UserID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RoleID NUMBER NOT NULL,
    FullName VARCHAR2(100) NOT NULL,
    Email VARCHAR2(120) NOT NULL UNIQUE,
    Phone VARCHAR2(50),
    PasswordHash VARCHAR2(255) NOT NULL,
    AccountStatus VARCHAR2(20) DEFAULT 'ACTIVE' NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_user_role FOREIGN KEY (RoleID) REFERENCES ROLE(RoleID)
);

-- --------------------------------------------------------------------
-- 4. CITIZEN
-- --------------------------------------------------------------------
CREATE TABLE CITIZEN (
    CitizenID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    UserID NUMBER NOT NULL UNIQUE,
    Address VARCHAR2(255),
    EmergencyContact VARCHAR2(50),
    SpecialNeeds VARCHAR2(500),
    CONSTRAINT fk_citizen_user FOREIGN KEY (UserID) REFERENCES USER_ACCOUNT(UserID)
);

-- --------------------------------------------------------------------
-- 5. DISASTER_LOCATION
-- --------------------------------------------------------------------
CREATE TABLE DISASTER_LOCATION (
    LocationID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    LocationName VARCHAR2(120) NOT NULL,
    Address VARCHAR2(255),
    WardName VARCHAR2(80),
    City VARCHAR2(60) DEFAULT 'Bangalore' NOT NULL,
    State VARCHAR2(60) DEFAULT 'Karnataka' NOT NULL,
    Latitude NUMBER(10, 6) NOT NULL,
    Longitude NUMBER(10, 6) NOT NULL,
    RiskZone VARCHAR2(20) DEFAULT 'MODERATE' NOT NULL,
    CONSTRAINT chk_risk_zone CHECK (RiskZone IN ('CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'SAFE'))
);

-- --------------------------------------------------------------------
-- 6. DISASTER (Operational Incident Entity)
-- --------------------------------------------------------------------
CREATE TABLE DISASTER (
    DisasterID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    IncidentCode VARCHAR2(36) NOT NULL UNIQUE,
    DisasterName VARCHAR2(120) NOT NULL,
    DisasterType VARCHAR2(50) NOT NULL,
    LocationID NUMBER NOT NULL,
    SeverityScore NUMBER(5, 2) DEFAULT 1.0 NOT NULL,
    SeverityLevel VARCHAR2(10) DEFAULT 'P3' NOT NULL,
    OverrideReason VARCHAR2(500),
    AssessedBy NUMBER,
    Status VARCHAR2(30) DEFAULT 'ACTIVE' NOT NULL,
    IsEscalated NUMBER(1) DEFAULT 0 NOT NULL,
    EscalationReason VARCHAR2(500),
    ClosureSummary CLOB,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ActivatedAt TIMESTAMP,
    ClosedAt TIMESTAMP,
    CONSTRAINT fk_disaster_loc FOREIGN KEY (LocationID) REFERENCES DISASTER_LOCATION(LocationID),
    CONSTRAINT fk_disaster_assessor FOREIGN KEY (AssessedBy) REFERENCES USER_ACCOUNT(UserID),
    CONSTRAINT chk_disaster_status CHECK (Status IN ('SUBMITTED', 'VERIFIED', 'ASSESSED', 'ACTIVE', 'RESPONSE_IN_PROGRESS', 'RECOVERY', 'CLOSED', 'ON_HOLD', 'REOPENED'))
);

-- --------------------------------------------------------------------
-- 7. DISASTER_REPORT (Citizen Reporting Entity)
-- --------------------------------------------------------------------
CREATE TABLE DISASTER_REPORT (
    ReportID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ReportReferenceID VARCHAR2(36) NOT NULL UNIQUE,
    ReporterUserID NUMBER NOT NULL,
    LocationID NUMBER NOT NULL,
    DisasterID NUMBER,
    DisasterType VARCHAR2(50) NOT NULL,
    Description CLOB NOT NULL,
    PeopleAffected NUMBER DEFAULT 1 NOT NULL,
    InjuriesReported NUMBER DEFAULT 0 NOT NULL,
    MissingPersons NUMBER DEFAULT 0 NOT NULL,
    TrappedPersons NUMBER DEFAULT 0 NOT NULL,
    UrgentMedicalNeeded NUMBER(1) DEFAULT 0 NOT NULL,
    EvacuationNeeded NUMBER(1) DEFAULT 0 NOT NULL,
    Status VARCHAR2(30) DEFAULT 'SUBMITTED' NOT NULL,
    RejectionReason VARCHAR2(500),
    DuplicateOfReportID NUMBER,
    SubmittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    VerifiedAt TIMESTAMP,
    CONSTRAINT fk_report_user FOREIGN KEY (ReporterUserID) REFERENCES USER_ACCOUNT(UserID),
    CONSTRAINT fk_report_loc FOREIGN KEY (LocationID) REFERENCES DISASTER_LOCATION(LocationID),
    CONSTRAINT fk_report_disaster FOREIGN KEY (DisasterID) REFERENCES DISASTER(DisasterID),
    CONSTRAINT fk_report_dup FOREIGN KEY (DuplicateOfReportID) REFERENCES DISASTER_REPORT(ReportID),
    CONSTRAINT chk_report_status CHECK (Status IN ('SUBMITTED', 'VERIFIED', 'AWAITING_INFORMATION', 'REJECTED', 'LINKED_DUPLICATE'))
);

-- --------------------------------------------------------------------
-- 8. REPORT_ATTACHMENT
-- --------------------------------------------------------------------
CREATE TABLE REPORT_ATTACHMENT (
    AttachmentID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ReportID NUMBER NOT NULL,
    FileURL VARCHAR2(255) NOT NULL,
    FileType VARCHAR2(50) NOT NULL,
    Description VARCHAR2(255),
    UploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_att_report FOREIGN KEY (ReportID) REFERENCES DISASTER_REPORT(ReportID) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 9. REPORT_UPDATE
-- --------------------------------------------------------------------
CREATE TABLE REPORT_UPDATE (
    UpdateID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ReportID NUMBER NOT NULL,
    AuthorID NUMBER NOT NULL,
    Message CLOB NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_upd_report FOREIGN KEY (ReportID) REFERENCES DISASTER_REPORT(ReportID) ON DELETE CASCADE,
    CONSTRAINT fk_upd_author FOREIGN KEY (AuthorID) REFERENCES USER_ACCOUNT(UserID)
);

-- --------------------------------------------------------------------
-- 10. AFFECTED_PERSON
-- --------------------------------------------------------------------
CREATE TABLE AFFECTED_PERSON (
    PersonID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DisasterID NUMBER NOT NULL,
    FullName VARCHAR2(100),
    Status VARCHAR2(30) DEFAULT 'SAFE' NOT NULL,
    TriagePriority VARCHAR2(10) DEFAULT 'P3' NOT NULL,
    Notes VARCHAR2(500),
    RegisteredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_aff_disaster FOREIGN KEY (DisasterID) REFERENCES DISASTER(DisasterID)
);

-- --------------------------------------------------------------------
-- 11. RESPONSE_TEAM
-- --------------------------------------------------------------------
CREATE TABLE RESPONSE_TEAM (
    TeamID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    AgencyID NUMBER NOT NULL,
    TeamName VARCHAR2(100) NOT NULL,
    LeaderName VARCHAR2(100) NOT NULL,
    ContactPhone VARCHAR2(50) NOT NULL,
    Specialization VARCHAR2(80) NOT NULL,
    Capacity NUMBER DEFAULT 10 NOT NULL,
    ReadinessStatus VARCHAR2(30) DEFAULT 'AVAILABLE' NOT NULL,
    CONSTRAINT fk_team_agency FOREIGN KEY (AgencyID) REFERENCES AGENCY(AgencyID),
    CONSTRAINT chk_team_status CHECK (ReadinessStatus IN ('AVAILABLE', 'ASSIGNED', 'ON_MISSION', 'MAINTENANCE'))
);

-- --------------------------------------------------------------------
-- 12. TEAM_ASSIGNMENT
-- --------------------------------------------------------------------
CREATE TABLE TEAM_ASSIGNMENT (
    AssignmentID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DisasterID NUMBER NOT NULL,
    TeamID NUMBER NOT NULL,
    AssignedBy NUMBER NOT NULL,
    AssignmentStatus VARCHAR2(30) DEFAULT 'ASSIGNED' NOT NULL,
    CancellationReason VARCHAR2(500),
    AssignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    AcknowledgedAt TIMESTAMP,
    EnRouteAt TIMESTAMP,
    OnSceneAt TIMESTAMP,
    CompletedAt TIMESTAMP,
    CONSTRAINT fk_assign_disaster FOREIGN KEY (DisasterID) REFERENCES DISASTER(DisasterID),
    CONSTRAINT fk_assign_team FOREIGN KEY (TeamID) REFERENCES RESPONSE_TEAM(TeamID),
    CONSTRAINT fk_assign_officer FOREIGN KEY (AssignedBy) REFERENCES USER_ACCOUNT(UserID),
    CONSTRAINT chk_assign_status CHECK (AssignmentStatus IN ('ASSIGNED', 'ACKNOWLEDGED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED', 'CANCELLED', 'REASSIGNED'))
);

-- --------------------------------------------------------------------
-- 13. RESOURCE
-- --------------------------------------------------------------------
CREATE TABLE RESOURCE (
    ResourceID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ResourceName VARCHAR2(100) NOT NULL,
    Category VARCHAR2(50) NOT NULL,
    Unit VARCHAR2(30) NOT NULL,
    IsPerishable NUMBER(1) DEFAULT 0 NOT NULL,
    StandardUnitCost NUMBER(12, 2) DEFAULT 0.0 NOT NULL
);

-- --------------------------------------------------------------------
-- 14. WAREHOUSE
-- --------------------------------------------------------------------
CREATE TABLE WAREHOUSE (
    WarehouseID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    WarehouseName VARCHAR2(100) NOT NULL,
    LocationID NUMBER NOT NULL,
    ManagerName VARCHAR2(100) NOT NULL,
    CapacityPallets NUMBER DEFAULT 5000 NOT NULL,
    IsActive NUMBER(1) DEFAULT 1 NOT NULL,
    CONSTRAINT fk_wh_loc FOREIGN KEY (LocationID) REFERENCES DISASTER_LOCATION(LocationID)
);

-- --------------------------------------------------------------------
-- 15. INVENTORY
-- --------------------------------------------------------------------
CREATE TABLE INVENTORY (
    InventoryID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    WarehouseID NUMBER NOT NULL,
    ResourceID NUMBER NOT NULL,
    QuantityAvailable NUMBER DEFAULT 0 NOT NULL,
    QuantityReserved NUMBER DEFAULT 0 NOT NULL,
    ReorderThreshold NUMBER DEFAULT 50 NOT NULL,
    ExpiryDate TIMESTAMP,
    CONSTRAINT fk_inv_wh FOREIGN KEY (WarehouseID) REFERENCES WAREHOUSE(WarehouseID),
    CONSTRAINT fk_inv_res FOREIGN KEY (ResourceID) REFERENCES RESOURCE(ResourceID),
    CONSTRAINT uq_inv_wh_res UNIQUE (WarehouseID, ResourceID),
    CONSTRAINT chk_inv_avail CHECK (QuantityAvailable >= 0),
    CONSTRAINT chk_inv_resv CHECK (QuantityReserved >= 0)
);

-- --------------------------------------------------------------------
-- 16. RESOURCE_REQUEST
-- --------------------------------------------------------------------
CREATE TABLE RESOURCE_REQUEST (
    RequestID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DisasterID NUMBER NOT NULL,
    RequestedBy NUMBER NOT NULL,
    Status VARCHAR2(30) DEFAULT 'PENDING_APPROVAL' NOT NULL,
    Priority VARCHAR2(10) DEFAULT 'P2' NOT NULL,
    RejectionReason VARCHAR2(500),
    RequestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_req_disaster FOREIGN KEY (DisasterID) REFERENCES DISASTER(DisasterID),
    CONSTRAINT fk_req_user FOREIGN KEY (RequestedBy) REFERENCES USER_ACCOUNT(UserID)
);

-- --------------------------------------------------------------------
-- 17. REQUEST_ITEM
-- --------------------------------------------------------------------
CREATE TABLE REQUEST_ITEM (
    RequestItemID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RequestID NUMBER NOT NULL,
    ResourceID NUMBER NOT NULL,
    QuantityRequested NUMBER NOT NULL,
    QuantityApproved NUMBER DEFAULT 0 NOT NULL,
    CONSTRAINT fk_ri_req FOREIGN KEY (RequestID) REFERENCES RESOURCE_REQUEST(RequestID) ON DELETE CASCADE,
    CONSTRAINT fk_ri_res FOREIGN KEY (ResourceID) REFERENCES RESOURCE(ResourceID)
);

-- --------------------------------------------------------------------
-- 18. RESOURCE_ALLOCATION
-- --------------------------------------------------------------------
CREATE TABLE RESOURCE_ALLOCATION (
    AllocationID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RequestID NUMBER NOT NULL,
    WarehouseID NUMBER NOT NULL,
    ResourceID NUMBER NOT NULL,
    AllocatedQuantity NUMBER NOT NULL,
    AllocatedBy NUMBER NOT NULL,
    DispatchReference VARCHAR2(36) NOT NULL UNIQUE,
    AllocationStatus VARCHAR2(30) DEFAULT 'RESERVED' NOT NULL,
    AllocatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_alloc_req FOREIGN KEY (RequestID) REFERENCES RESOURCE_REQUEST(RequestID),
    CONSTRAINT fk_alloc_wh FOREIGN KEY (WarehouseID) REFERENCES WAREHOUSE(WarehouseID),
    CONSTRAINT fk_alloc_res FOREIGN KEY (ResourceID) REFERENCES RESOURCE(ResourceID),
    CONSTRAINT fk_alloc_user FOREIGN KEY (AllocatedBy) REFERENCES USER_ACCOUNT(UserID)
);

-- --------------------------------------------------------------------
-- 19. DELIVERY
-- --------------------------------------------------------------------
CREATE TABLE DELIVERY (
    DeliveryID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    WarehouseID NUMBER NOT NULL,
    DisasterID NUMBER NOT NULL,
    TransportDriverName VARCHAR2(100),
    VehicleRegistration VARCHAR2(50),
    DeliveryStatus VARCHAR2(30) DEFAULT 'PREPARING' NOT NULL,
    DispatchedAt TIMESTAMP,
    DeliveredAt TIMESTAMP,
    ReceiverName VARCHAR2(100),
    ProofOfDeliveryNote VARCHAR2(500),
    CONSTRAINT fk_deliv_wh FOREIGN KEY (WarehouseID) REFERENCES WAREHOUSE(WarehouseID),
    CONSTRAINT fk_deliv_disaster FOREIGN KEY (DisasterID) REFERENCES DISASTER(DisasterID),
    CONSTRAINT chk_deliv_status CHECK (DeliveryStatus IN ('PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'PARTIALLY_DELIVERED', 'RETURNED'))
);

-- --------------------------------------------------------------------
-- 20. DELIVERY_ITEM
-- --------------------------------------------------------------------
CREATE TABLE DELIVERY_ITEM (
    DeliveryItemID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DeliveryID NUMBER NOT NULL,
    ResourceID NUMBER NOT NULL,
    QuantityDispatched NUMBER NOT NULL,
    QuantityReceived NUMBER DEFAULT 0 NOT NULL,
    QuantityDamaged NUMBER DEFAULT 0 NOT NULL,
    CONSTRAINT fk_di_deliv FOREIGN KEY (DeliveryID) REFERENCES DELIVERY(DeliveryID) ON DELETE CASCADE,
    CONSTRAINT fk_di_res FOREIGN KEY (ResourceID) REFERENCES RESOURCE(ResourceID)
);

-- --------------------------------------------------------------------
-- 21. SHELTER
-- --------------------------------------------------------------------
CREATE TABLE SHELTER (
    ShelterID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ShelterName VARCHAR2(120) NOT NULL,
    LocationID NUMBER NOT NULL,
    Capacity NUMBER NOT NULL,
    CurrentOccupancy NUMBER DEFAULT 0 NOT NULL,
    Status VARCHAR2(20) DEFAULT 'OPEN' NOT NULL,
    HasMedicalUnit NUMBER(1) DEFAULT 1 NOT NULL,
    HasPotableWater NUMBER(1) DEFAULT 1 NOT NULL,
    CONSTRAINT fk_shelter_loc FOREIGN KEY (LocationID) REFERENCES DISASTER_LOCATION(LocationID),
    CONSTRAINT chk_shelter_min_occ CHECK (CurrentOccupancy >= 0),
    CONSTRAINT chk_shelter_max_cap CHECK (CurrentOccupancy <= Capacity)
);

-- --------------------------------------------------------------------
-- 22. SHELTER_REGISTRATION
-- --------------------------------------------------------------------
CREATE TABLE SHELTER_REGISTRATION (
    RegistrationID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ShelterID NUMBER NOT NULL,
    CitizenID NUMBER NOT NULL,
    CheckInTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CheckOutTime TIMESTAMP,
    DependentsCount NUMBER DEFAULT 0 NOT NULL,
    SpecialRequirements VARCHAR2(500),
    CONSTRAINT fk_sreg_shelter FOREIGN KEY (ShelterID) REFERENCES SHELTER(ShelterID),
    CONSTRAINT fk_sreg_cit FOREIGN KEY (CitizenID) REFERENCES CITIZEN(CitizenID)
);

-- --------------------------------------------------------------------
-- 23. HOSPITAL
-- --------------------------------------------------------------------
CREATE TABLE HOSPITAL (
    HospitalID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    HospitalName VARCHAR2(120) NOT NULL,
    LocationID NUMBER NOT NULL,
    TotalICUBeds NUMBER DEFAULT 30 NOT NULL,
    AvailableICUBeds NUMBER DEFAULT 10 NOT NULL,
    TotalGeneralBeds NUMBER DEFAULT 150 NOT NULL,
    AvailableGeneralBeds NUMBER DEFAULT 45 NOT NULL,
    TraumaCenterLevel VARCHAR2(20) DEFAULT 'LEVEL_1' NOT NULL,
    CONSTRAINT fk_hosp_loc FOREIGN KEY (LocationID) REFERENCES DISASTER_LOCATION(LocationID)
);

-- --------------------------------------------------------------------
-- 24. MEDICAL_REFERRAL
-- --------------------------------------------------------------------
CREATE TABLE MEDICAL_REFERRAL (
    ReferralID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DisasterID NUMBER NOT NULL,
    HospitalID NUMBER NOT NULL,
    PatientName VARCHAR2(100) NOT NULL,
    InjurySeverity VARCHAR2(20) NOT NULL,
    AssignedAmbulance VARCHAR2(50),
    ReferralStatus VARCHAR2(30) DEFAULT 'REQUESTED' NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ReceivedAt TIMESTAMP,
    CONSTRAINT fk_med_disaster FOREIGN KEY (DisasterID) REFERENCES DISASTER(DisasterID),
    CONSTRAINT fk_med_hosp FOREIGN KEY (HospitalID) REFERENCES HOSPITAL(HospitalID)
);

-- --------------------------------------------------------------------
-- 25. NOTIFICATION
-- --------------------------------------------------------------------
CREATE TABLE NOTIFICATION (
    NotificationID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    UserID NUMBER NOT NULL,
    Title VARCHAR2(120) NOT NULL,
    Message CLOB NOT NULL,
    NotificationType VARCHAR2(50) DEFAULT 'ALERT' NOT NULL,
    IsRead NUMBER(1) DEFAULT 0 NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_notif_user FOREIGN KEY (UserID) REFERENCES USER_ACCOUNT(UserID)
);

-- --------------------------------------------------------------------
-- 26. INCIDENT_WORKFLOW_EVENT (Immutable Lifecycle History)
-- --------------------------------------------------------------------
CREATE TABLE INCIDENT_WORKFLOW_EVENT (
    EventID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DisasterID NUMBER NOT NULL,
    EventType VARCHAR2(60) NOT NULL,
    ActorID NUMBER NOT NULL,
    PreviousState VARCHAR2(40),
    NewState VARCHAR2(40) NOT NULL,
    Reason VARCHAR2(500),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_we_disaster FOREIGN KEY (DisasterID) REFERENCES DISASTER(DisasterID),
    CONSTRAINT fk_we_actor FOREIGN KEY (ActorID) REFERENCES USER_ACCOUNT(UserID)
);

-- --------------------------------------------------------------------
-- 27. AUDIT_LOG (Immutable Master System Audit)
-- --------------------------------------------------------------------
CREATE TABLE AUDIT_LOG (
    LogID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    EntityName VARCHAR2(60) NOT NULL,
    EntityID VARCHAR2(60) NOT NULL,
    Action VARCHAR2(30) NOT NULL,
    PerformedBy NUMBER NOT NULL,
    ActorName VARCHAR2(100),
    Details CLOB NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --------------------------------------------------------------------
-- PERFORMANCE B-TREE INDEXES
-- --------------------------------------------------------------------
CREATE INDEX idx_report_status ON DISASTER_REPORT(Status);
CREATE INDEX idx_report_loc ON DISASTER_REPORT(LocationID);
CREATE INDEX idx_disaster_status ON DISASTER(Status);
CREATE INDEX idx_disaster_loc ON DISASTER(LocationID);
CREATE INDEX idx_inv_wh ON INVENTORY(WarehouseID);
CREATE INDEX idx_inv_res ON INVENTORY(ResourceID);
CREATE INDEX idx_team_status ON RESPONSE_TEAM(ReadinessStatus);
CREATE INDEX idx_assign_disaster ON TEAM_ASSIGNMENT(DisasterID);
CREATE INDEX idx_deliv_status ON DELIVERY(DeliveryStatus);
CREATE INDEX idx_audit_created ON AUDIT_LOG(CreatedAt);
CREATE INDEX idx_we_disaster ON INCIDENT_WORKFLOW_EVENT(DisasterID);

COMMIT;
