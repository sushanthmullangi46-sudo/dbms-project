# URBAN DISASTER RELIEF AND RESOURCE MANAGEMENT SYSTEM (UDRRMS)
## Comprehensive Database Architecture & Schema Specification (3NF Relational Model)

---

### Executive Overview

The **Urban Disaster Relief and Resource Management System (UDRRMS)** database engine is architected as an enterprise-grade, fully normalized (**Third Normal Form - 3NF**) relational database management system. It provides durable, tamper-evident, and concurrent state management for mission-critical disaster reporting, verification triage, tactical team dispatch, resource allocation, and evacuee sheltering.

The platform provides dual-target deployment capabilities:
1. **Local Persistent Production Storage**: SQLite 3.45 engine configured in **Write-Ahead Logging (WAL)** mode with synchronous disk commits, foreign key constraints permanently enforced (`PRAGMA foreign_keys = ON`), and full transactional durability located at `database/udrrms.db`.
2. **Enterprise Scale Target**: Oracle Database 19c / 21c Enterprise Edition utilizing native identity sequences, PL/SQL triggers, domain check constraints, and stored procedures located at `database/01_udrrms_oracle_schema.sql`.

---

### Database Architecture & ACID Guarantees

```
+----------------------------------------------------------------------------+
|                          FastAPI Application Tier                          |
|                       SQLAlchemy 2.0 ORM Mappings                         |
+----------------------------------------------------------------------------+
                                      |
                     Connection Pool (QueuePool / NullPool)
                     PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;
                                      |
                                      v
+----------------------------------------------------------------------------+
|                     Persistent Relational Storage Tier                     |
|                                                                            |
|  +--------------------+  +--------------------+  +---------------------+   |
|  |  Identity & Roles  |  | Disaster Reporting |  | Tactical Operations |   |
|  |  4 Tables (3NF)    |  | 6 Tables (3NF)     |  | 2 Tables (3NF)      |   |
|  +--------------------+  +--------------------+  +---------------------+   |
|                                                                            |
|  +--------------------+  +--------------------+                            |
|  | Logistics & Camps  |  | Audit & Events     |                            |
|  | 12 Tables (3NF)    |  | 3 Tables (3NF)     |                            |
|  +--------------------+  +--------------------+                            |
+----------------------------------------------------------------------------+
```

#### ACID Compliance Guarantees:
- **Atomicity**: All multi-step allocations (e.g., deducting warehouse available stock, reserving dispatch inventory, and generating delivery orders) execute within atomic database transactions. If any step fails or inventory is insufficient, the transaction issues a full `ROLLBACK`.
- **Consistency**: Enforced through database-level `CHECK` constraints (e.g., `chk_positive_inventory: quantity_available >= 0`, `chk_shelter_max_capacity: current_occupancy <= capacity`), unique constraints, and foreign key cascades.
- **Isolation**: Handled via serialized transactions and WAL-mode concurrency, ensuring readers never block writers and writers never corrupt readers.
- **Durability**: Physical disk synchronization ensures that zero data disappears upon browser refresh, server reboot, cold OS restart, or session termination.

---

### 3NF Normalization Analysis & Proof

Every relation in the UDRRMS schema satisfies **Third Normal Form (3NF)**:
1. **First Normal Form (1NF)**:
   - All attributes contain atomic values (no repeating groups, arrays, or comma-separated lists).
   - Each table possesses a designated Primary Key (`RoleID`, `UserID`, `ReportID`, `IncidentID`, `WarehouseID`, `ResourceID`).
2. **Second Normal Form (2NF)**:
   - All tables are in 1NF.
   - All non-key attributes are fully functionally dependent on the entire primary key (no partial key dependencies). For instance, in composite junction tables like `INVENTORY (WarehouseID, ResourceID)`, attributes `quantity_available` and `quantity_reserved` depend strictly on the complete composite pair.
3. **Third Normal Form (3NF)**:
   - All tables are in 2NF.
   - No transitive dependencies exist ($X \to Y$ and $Y \to Z$ where $Z$ is non-prime). For example, rather than storing ward names, district titles, and geographic coordinates repeatedly within `DISASTER_REPORT`, a dedicated `DISASTER_LOCATION` entity abstracts spatial attributes, referencing them strictly via foreign key `LocationID`.

---

### Comprehensive Data Dictionary (27 Relational Tables)

#### Domain 1: Identity, Roles & Access Control

##### 1. `ROLE`
Stores system authorization roles governing Role-Based Access Control (RBAC).
- `RoleID` (NUMBER / INT, PK, AUTOINCREMENT): Unique identifier for the role.
- `RoleName` (VARCHAR2(50) / VARCHAR(50), NOT NULL, UNIQUE): Role name (`CITIZEN`, `DISASTER_OFFICER`, `COORDINATOR`, `RESPONDER`).
- `Description` (VARCHAR2(255) / VARCHAR(255)): Human-readable description of authorization scope.

##### 2. `AGENCY`
Disaster relief and civil defense organizations.
- `AgencyID` (NUMBER / INT, PK, AUTOINCREMENT): Unique identifier.
- `AgencyName` (VARCHAR2(100) / VARCHAR(100), NOT NULL, UNIQUE): Organization name (e.g., NDRF, SDRF, Fire & Rescue).
- `AgencyType` (VARCHAR2(50) / VARCHAR(50), NOT NULL): Agency category (`RESCUE`, `MEDICAL`, `FIRE`, `LOGISTICS`, `NGO`).
- `ContactPhone` (VARCHAR2(50) / VARCHAR(50)): Central dispatch contact phone.
- `ContactEmail` (VARCHAR2(100) / VARCHAR(100)): Official agency email address.

##### 3. `USER_ACCOUNT`
Core authentication and user profiles.
- `UserID` (NUMBER / INT, PK, AUTOINCREMENT): Unique user ID.
- `RoleID` (NUMBER / INT, FK -> `ROLE.RoleID`, NOT NULL): Associated system role.
- `FullName` (VARCHAR2(100) / VARCHAR(100), NOT NULL): Legal full name.
- `Email` (VARCHAR2(120) / VARCHAR(120), NOT NULL, UNIQUE, INDEX): Unique login email.
- `Phone` (VARCHAR2(50) / VARCHAR(50)): Primary contact mobile number.
- `PasswordHash` (VARCHAR2(255) / VARCHAR(255), NOT NULL): Salted bcrypt cryptographic password hash.
- `AccountStatus` (VARCHAR2(20) / VARCHAR(20), NOT NULL, DEFAULT `'ACTIVE'`): `ACTIVE` or `SUSPENDED`.
- `CreatedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).

##### 4. `CITIZEN`
Extended demographic profile for civilian reporters.
- `CitizenID` (NUMBER / INT, PK, AUTOINCREMENT): Unique citizen record ID.
- `UserID` (NUMBER / INT, FK -> `USER_ACCOUNT.UserID`, NOT NULL, UNIQUE): 1:1 relation to user account.
- `Address` (VARCHAR2(255) / VARCHAR(255)): Residential address.
- `EmergencyContact` (VARCHAR2(50) / VARCHAR(50)): Next-of-kin emergency phone number.
- `SpecialNeeds` (CLOB / TEXT): Medical flags, mobility impairments, or infant dependencies.

---

#### Domain 2: Disaster Geospatial & Citizen Reporting

##### 5. `DISASTER_LOCATION`
Normalized geospatial repository of affected zones.
- `LocationID` (NUMBER / INT, PK, AUTOINCREMENT): Unique location identifier.
- `LocationName` (VARCHAR2(120) / VARCHAR(120), NOT NULL): Landmark or neighborhood designation.
- `Address` (VARCHAR2(255) / VARCHAR(255)): Street or sector address.
- `WardName` (VARCHAR2(80) / VARCHAR(80)): Administrative municipality ward.
- `City` (VARCHAR2(60) / VARCHAR(60), NOT NULL, DEFAULT `'Bangalore'`): City name.
- `State` (VARCHAR2(60) / VARCHAR(60), NOT NULL, DEFAULT `'Karnataka'`): State name.
- `Latitude` (FLOAT, NOT NULL): WGS84 decimal latitude coordinates.
- `Longitude` (FLOAT, NOT NULL): WGS84 decimal longitude coordinates.
- `RiskZone` (VARCHAR2(20) / VARCHAR(20), NOT NULL, DEFAULT `'MODERATE'`): Vulnerability tier (`CRITICAL`, `HIGH`, `MODERATE`, `LOW`, `SAFE`).

##### 6. `DISASTER_REPORT`
Initial citizen incident reports submitted from the field.
- `ReportID` (NUMBER / INT, PK, AUTOINCREMENT): Unique internal primary key.
- `ReportReferenceID` (VARCHAR2(36) / VARCHAR(36), NOT NULL, UNIQUE, INDEX): UUID tracking code.
- `ReporterUserID` (NUMBER / INT, FK -> `USER_ACCOUNT.UserID`, NOT NULL): Citizen user who filed the report.
- `LocationID` (NUMBER / INT, FK -> `DISASTER_LOCATION.LocationID`, NOT NULL): Geospatial coordinates pointer.
- `DisasterID` (NUMBER / INT, FK -> `DISASTER.DisasterID`, NULLABLE): Linked verified incident.
- `DisasterType` (VARCHAR2(50) / VARCHAR(50), NOT NULL): Category (`Flood`, `Fire`, `Earthquake`, `Building Collapse`, `Landslide`, `Cyclone`).
- `Description` (CLOB / TEXT, NOT NULL): Detailed incident description.
- `PeopleAffected` (NUMBER / INT, NOT NULL, DEFAULT 1): Estimated victims requiring aid.
- `InjuriesReported` (NUMBER / INT, NOT NULL, DEFAULT 0): Count of injured persons.
- `MissingPersons` (NUMBER / INT, NOT NULL, DEFAULT 0): Count of unlocated persons.
- `TrappedPersons` (NUMBER / INT, NOT NULL, DEFAULT 0): Count of structurally trapped victims.
- `UrgentMedicalNeeded` (NUMBER(1) / BOOLEAN, NOT NULL, DEFAULT 0): Emergency medical triage required.
- `EvacuationNeeded` (NUMBER(1) / BOOLEAN, NOT NULL, DEFAULT 0): Immediate boat/vehicle evacuation required.
- `Status` (VARCHAR2(30) / VARCHAR(30), NOT NULL, DEFAULT `'SUBMITTED'`): `SUBMITTED`, `VERIFIED`, `AWAITING_INFORMATION`, `REJECTED`, `LINKED_DUPLICATE`.
- `RejectionReason` (CLOB / TEXT, NULLABLE): Justification if marked invalid or spam.
- `DuplicateOfReportID` (NUMBER / INT, FK -> `DISASTER_REPORT.ReportID`, NULLABLE): Pointer to parent report.
- `SubmittedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).
- `VerifiedAt` (TIMESTAMP / DATETIME, NULLABLE): Timestamp of officer verification.

##### 7. `REPORT_ATTACHMENT`
Photographic evidence and multimedia proofs.
- `AttachmentID` (NUMBER / INT, PK, AUTOINCREMENT): Unique attachment identifier.
- `ReportID` (NUMBER / INT, FK -> `DISASTER_REPORT.ReportID`, NOT NULL): Parent report pointer.
- `FileURL` (VARCHAR2(255) / VARCHAR(255), NOT NULL): Persistent relative or remote media URL.
- `FileType` (VARCHAR2(50) / VARCHAR(50), NOT NULL): MIME type (e.g., `image/jpeg`, `image/png`).
- `Description` (VARCHAR2(255) / VARCHAR(255)): Caption or visual description.
- `UploadedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).

##### 8. `REPORT_UPDATE`
Chronological discussion and supplementary notes filed on reports.
- `UpdateID` (NUMBER / INT, PK, AUTOINCREMENT): Unique update key.
- `ReportID` (NUMBER / INT, FK -> `DISASTER_REPORT.ReportID`, NOT NULL): Parent report pointer.
- `AuthorID` (NUMBER / INT, FK -> `USER_ACCOUNT.UserID`, NOT NULL): Author user ID.
- `Message` (CLOB / TEXT, NOT NULL): Text message content.
- `CreatedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).

##### 9. `DISASTER`
Verified incident command entity managing field operations.
- `DisasterID` (NUMBER / INT, PK, AUTOINCREMENT): Unique operational incident key.
- `IncidentCode` (VARCHAR2(36) / VARCHAR(36), NOT NULL, UNIQUE, INDEX): Official dispatch tracking code.
- `DisasterName` (VARCHAR2(120) / VARCHAR(120), NOT NULL): Operational incident name.
- `DisasterType` (VARCHAR2(50) / VARCHAR(50), NOT NULL): Disaster categorization.
- `LocationID` (NUMBER / INT, FK -> `DISASTER_LOCATION.LocationID`, NOT NULL): Incident geographic locus.
- `SeverityScore` (FLOAT, NOT NULL, DEFAULT 1.0): Calculated priority score (0.0 to 10.0).
- `SeverityLevel` (VARCHAR2(10) / VARCHAR(10), NOT NULL, DEFAULT `'P3'`): `P1` (Critical), `P2` (High), `P3` (Moderate), `P4` (Low).
- `OverrideReason` (CLOB / TEXT, NULLABLE): Justification for manual severity escalation.
- `AssessedBy` (NUMBER / INT, FK -> `USER_ACCOUNT.UserID`, NULLABLE): Officer ID who assessed priority.
- `Status` (VARCHAR2(30) / VARCHAR(30), NOT NULL, DEFAULT `'ACTIVE'`): `ACTIVE`, `RESPONSE_IN_PROGRESS`, `RECOVERY`, `CLOSED`.
- `IsEscalated` (NUMBER(1) / BOOLEAN, NOT NULL, DEFAULT 0): Escalation flag.
- `EscalationReason` (CLOB / TEXT, NULLABLE): Rationale for regional escalation.
- `ClosureSummary` (CLOB / TEXT, NULLABLE): Incident completion debrief summary.
- `CreatedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).
- `ActivatedAt` (TIMESTAMP / DATETIME, NULLABLE): Time operations mobilized.
- `ClosedAt` (TIMESTAMP / DATETIME, NULLABLE): Time incident officially closed.

##### 10. `AFFECTED_PERSON`
Victim tracking and triage registry.
- `PersonID` (NUMBER / INT, PK, AUTOINCREMENT): Unique casualty/evacuee key.
- `DisasterID` (NUMBER / INT, FK -> `DISASTER.DisasterID`, NOT NULL): Associated incident.
- `FullName` (VARCHAR2(100) / VARCHAR(100)): Victim name or alias.
- `Status` (VARCHAR2(30) / VARCHAR(30), NOT NULL, DEFAULT `'SAFE'`): `TRAPPED`, `INJURED`, `MISSING`, `EVACUATED`, `SAFE`, `HOSPITALIZED`.
- `TriagePriority` (VARCHAR2(10) / VARCHAR(10), NOT NULL, DEFAULT `'P3'`): Medical triage rating.
- `Notes` (CLOB / TEXT): Clinical or extraction observations.
- `RegisteredAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).

---

#### Domain 3: Tactical Response & Field Operations

##### 11. `RESPONSE_TEAM`
Tactical rescue units and civil defense squads.
- `TeamID` (NUMBER / INT, PK, AUTOINCREMENT): Unique squad identifier.
- `AgencyID` (NUMBER / INT, FK -> `AGENCY.AgencyID`, NOT NULL): Parent agency.
- `TeamName` (VARCHAR2(100) / VARCHAR(100), NOT NULL): Unit callsign (e.g., NDRF Alpha Squad).
- `LeaderName` (VARCHAR2(100) / VARCHAR(100), NOT NULL): Commanding officer name.
- `ContactPhone` (VARCHAR2(50) / VARCHAR(50), NOT NULL): Field radio/satellite mobile line.
- `Specialization` (VARCHAR2(80) / VARCHAR(80), NOT NULL): Unit capability (`WATER_RESCUE`, `MEDICAL_TRIAGE`, `COLLAPSE_SAR`, `HAZMAT`).
- `Capacity` (NUMBER / INT, NOT NULL, DEFAULT 10): Operative count.
- `ReadinessStatus` (VARCHAR2(30) / VARCHAR(30), NOT NULL, DEFAULT `'AVAILABLE'`): `AVAILABLE`, `ASSIGNED`, `ON_MISSION`, `MAINTENANCE`.

##### 12. `TEAM_ASSIGNMENT`
Tactical dispatch orders linking response units to incidents.
- `AssignmentID` (NUMBER / INT, PK, AUTOINCREMENT): Unique deployment key.
- `DisasterID` (NUMBER / INT, FK -> `DISASTER.DisasterID`, NOT NULL): Target incident.
- `TeamID` (NUMBER / INT, FK -> `RESPONSE_TEAM.TeamID`, NOT NULL): Assigned squad.
- `AssignedBy` (NUMBER / INT, FK -> `USER_ACCOUNT.UserID`, NOT NULL): Dispatching commander.
- `AssignmentStatus` (VARCHAR2(30) / VARCHAR(30), NOT NULL, DEFAULT `'ASSIGNED'`): `ASSIGNED` -> `ACKNOWLEDGED` -> `EN_ROUTE` -> `ON_SCENE` -> `COMPLETED`.
- `CancellationReason` (CLOB / TEXT, NULLABLE): Cancellation rationale.
- `AssignedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).
- `AcknowledgedAt` (TIMESTAMP / DATETIME, NULLABLE): Field acknowledgment timestamp.
- `EnRouteAt` (TIMESTAMP / DATETIME, NULLABLE): Transit initiation timestamp.
- `OnSceneAt` (TIMESTAMP / DATETIME, NULLABLE): On-scene arrival timestamp.
- `CompletedAt` (TIMESTAMP / DATETIME, NULLABLE): Mission wrap-up timestamp.

---

#### Domain 4: Logistics, Warehouses, Inventory & Shelter

##### 13. `RESOURCE`
Standard catalog of emergency aid supplies, pharmaceuticals, and equipment.
- `ResourceID` (NUMBER / INT, PK, AUTOINCREMENT): Unique item key.
- `ResourceName` (VARCHAR2(100) / VARCHAR(100), NOT NULL): Supply item title (e.g., Drinking Water 20L, First Aid Kit).
- `Category` (VARCHAR2(50) / VARCHAR(50), NOT NULL): `FOOD`, `WATER`, `MEDICAL`, `SHELTER_SUPPLIES`, `EQUIPMENT`.
- `Unit` (VARCHAR2(30) / VARCHAR(30), NOT NULL): Metric unit (`Packets`, `Litres`, `Kits`, `Blankets`, `Boats`).
- `IsPerishable` (NUMBER(1) / BOOLEAN, NOT NULL, DEFAULT 0): Perishability indicator.
- `StandardUnitCost` (FLOAT, NOT NULL, DEFAULT 0.0): Valuation per unit in INR.

##### 14. `WAREHOUSE`
Regional distribution depots and supply centers.
- `WarehouseID` (NUMBER / INT, PK, AUTOINCREMENT): Depot key.
- `WarehouseName` (VARCHAR2(100) / VARCHAR(100), NOT NULL): Depot title.
- `LocationID` (NUMBER / INT, FK -> `DISASTER_LOCATION.LocationID`, NOT NULL): Depot geospatial locus.
- `ManagerName` (VARCHAR2(100) / VARCHAR(100), NOT NULL): Warehouse administrator name.
- `CapacityPallets` (NUMBER / INT, NOT NULL, DEFAULT 5000): Storage volume in pallet equivalents.
- `IsActive` (NUMBER(1) / BOOLEAN, NOT NULL, DEFAULT 1): Active operational status.

##### 15. `INVENTORY`
Atomic stock balances and reservation ledger.
- `InventoryID` (NUMBER / INT, PK, AUTOINCREMENT): Stock record key.
- `WarehouseID` (NUMBER / INT, FK -> `WAREHOUSE.WarehouseID`, NOT NULL): Warehouse pointer.
- `ResourceID` (NUMBER / INT, FK -> `RESOURCE.ResourceID`, NOT NULL): Catalog item pointer.
- `QuantityAvailable` (NUMBER / INT, NOT NULL, DEFAULT 0): Unreserved free stock.
- `QuantityReserved` (NUMBER / INT, NOT NULL, DEFAULT 0): Reserved inventory earmarked for dispatches.
- `ReorderThreshold` (NUMBER / INT, NOT NULL, DEFAULT 50): Critical low-stock warning threshold.
- `ExpiryDate` (TIMESTAMP / DATETIME, NULLABLE): Expiration date for perishables.
- **Constraints**:
  - `uq_warehouse_resource`: `UNIQUE(WarehouseID, ResourceID)`
  - `chk_positive_inventory`: `CHECK(QuantityAvailable >= 0)`
  - `chk_positive_reserved`: `CHECK(QuantityReserved >= 0)`

##### 16. `RESOURCE_REQUEST`
Formal supply requisitions initiated by field commanders.
- `RequestID` (NUMBER / INT, PK, AUTOINCREMENT): Requisition identifier.
- `DisasterID` (NUMBER / INT, FK -> `DISASTER.DisasterID`, NOT NULL): Requesting incident.
- `RequestedBy` (NUMBER / INT, FK -> `USER_ACCOUNT.UserID`, NOT NULL): Requesting commander ID.
- `Status` (VARCHAR2(30) / VARCHAR(30), NOT NULL, DEFAULT `'PENDING_APPROVAL'`): `PENDING_APPROVAL`, `APPROVED`, `PARTIALLY_APPROVED`, `REJECTED`, `FULFILLED`.
- `Priority` (VARCHAR2(10) / VARCHAR(10), NOT NULL, DEFAULT `'P2'`): Priority rating.
- `RejectionReason` (CLOB / TEXT, NULLABLE): Rejection explanation.
- `RequestedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).

##### 17. `REQUEST_ITEM`
Line items detailing individual supplies in a requisition.
- `RequestItemID` (NUMBER / INT, PK, AUTOINCREMENT): Line item key.
- `RequestID` (NUMBER / INT, FK -> `RESOURCE_REQUEST.RequestID`, NOT NULL): Requisition header.
- `ResourceID` (NUMBER / INT, FK -> `RESOURCE.ResourceID`, NOT NULL): Target catalog supply.
- `QuantityRequested` (NUMBER / INT, NOT NULL): Units requisitioned.
- `QuantityApproved` (NUMBER / INT, NOT NULL, DEFAULT 0): Units authorized by logistics coordinator.

##### 18. `RESOURCE_ALLOCATION`
Binding inventory reservation linking warehouse stock to an approved requisition.
- `AllocationID` (NUMBER / INT, PK, AUTOINCREMENT): Allocation order key.
- `RequestID` (NUMBER / INT, FK -> `RESOURCE_REQUEST.RequestID`, NOT NULL): Originating requisition.
- `WarehouseID` (NUMBER / INT, FK -> `WAREHOUSE.WarehouseID`, NOT NULL): Sourcing warehouse depot.
- `ResourceID` (NUMBER / INT, FK -> `RESOURCE.ResourceID`, NOT NULL): Allocated item.
- `AllocatedQuantity` (NUMBER / INT, NOT NULL): Number of units deducted from `QuantityAvailable`.
- `AllocatedBy` (NUMBER / INT, FK -> `USER_ACCOUNT.UserID`, NOT NULL): Authorizing logistics officer.
- `DispatchReference` (VARCHAR2(36) / VARCHAR(36), NOT NULL, UNIQUE): Unique manifest identifier.
- `AllocationStatus` (VARCHAR2(30) / VARCHAR(30), NOT NULL, DEFAULT `'RESERVED'`): `RESERVED`, `DISPATCHED`, `COMPLETED`, `CANCELLED`.
- `AllocatedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).

##### 19. `DELIVERY`
Logistics transport dispatches and field transit tracking.
- `DeliveryID` (NUMBER / INT, PK, AUTOINCREMENT): Shipment tracking ID.
- `WarehouseID` (NUMBER / INT, FK -> `WAREHOUSE.WarehouseID`, NOT NULL): Origin depot.
- `DisasterID` (NUMBER / INT, FK -> `DISASTER.DisasterID`, NOT NULL): Destination incident site.
- `TransportDriverName` (VARCHAR2(100) / VARCHAR(100)): Transport driver name.
- `VehicleRegistration` (VARCHAR2(50) / VARCHAR(50)): Transport vehicle license plate.
- `DeliveryStatus` (VARCHAR2(30) / VARCHAR(30), NOT NULL, DEFAULT `'PREPARING'`): `PREPARING` -> `DISPATCHED` -> `IN_TRANSIT` -> `DELIVERED`.
- `DispatchedAt` (TIMESTAMP / DATETIME, NULLABLE): Departure timestamp.
- `DeliveredAt` (TIMESTAMP / DATETIME, NULLABLE): Delivery confirmation timestamp.
- `ReceiverName` (VARCHAR2(100) / VARCHAR(100)): Field recipient signature name.
- `ProofOfDeliveryNote` (CLOB / TEXT): Receipt notes or digital signature verification.

##### 20. `DELIVERY_ITEM`
Quantities and verification status of items within a transport shipment.
- `DeliveryItemID` (NUMBER / INT, PK, AUTOINCREMENT): Line item key.
- `DeliveryID` (NUMBER / INT, FK -> `DELIVERY.DeliveryID`, NOT NULL): Shipment pointer.
- `ResourceID` (NUMBER / INT, FK -> `RESOURCE.ResourceID`, NOT NULL): Supply item pointer.
- `QuantityDispatched` (NUMBER / INT, NOT NULL): Units loaded.
- `QuantityReceived` (NUMBER / INT, NOT NULL, DEFAULT 0): Units verified at destination.
- `QuantityDamaged` (NUMBER / INT, NOT NULL, DEFAULT 0): Damaged or spoiled units.

##### 21. `SHELTER`
Emergency relief camps and evacuation shelter centers.
- `ShelterID` (NUMBER / INT, PK, AUTOINCREMENT): Camp key.
- `ShelterName` (VARCHAR2(120) / VARCHAR(120), NOT NULL): Camp designation (e.g., Central Stadium Relief Camp).
- `LocationID` (NUMBER / INT, FK -> `DISASTER_LOCATION.LocationID`, NOT NULL): Geographic coordinates.
- `Capacity` (NUMBER / INT, NOT NULL): Maximum evacuee capacity.
- `CurrentOccupancy` (NUMBER / INT, NOT NULL, DEFAULT 0): Present resident count.
- `Status` (VARCHAR2(20) / VARCHAR(20), NOT NULL, DEFAULT `'OPEN'`): `OPEN`, `FULL`, `CLOSED`.
- `HasMedicalUnit` (NUMBER(1) / BOOLEAN, NOT NULL, DEFAULT 1): Field clinic available.
- `HasPotableWater` (NUMBER(1) / BOOLEAN, NOT NULL, DEFAULT 1): Safe drinking water supply confirmed.
- **Constraints**:
  - `chk_shelter_min_occ`: `CHECK(CurrentOccupancy >= 0)`
  - `chk_shelter_max_capacity`: `CHECK(CurrentOccupancy <= Capacity)`

##### 22. `SHELTER_REGISTRATION`
Evacuee check-in and check-out ledger.
- `RegistrationID` (NUMBER / INT, PK, AUTOINCREMENT): Registration record key.
- `ShelterID` (NUMBER / INT, FK -> `SHELTER.ShelterID`, NOT NULL): Camp pointer.
- `CitizenID` (NUMBER / INT, FK -> `CITIZEN.CitizenID`, NOT NULL): Registered evacuee.
- `CheckInTime` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).
- `CheckOutTime` (TIMESTAMP / DATETIME, NULLABLE): Check-out timestamp.
- `DependentsCount` (NUMBER / INT, NOT NULL, DEFAULT 0): Accompanying family members.
- `SpecialRequirements` (CLOB / TEXT): Infant care, dietary, or mobility needs.

##### 23. `HOSPITAL`
Designated emergency healthcare facilities and trauma centers.
- `HospitalID` (NUMBER / INT, PK, AUTOINCREMENT): Hospital identifier.
- `HospitalName` (VARCHAR2(120) / VARCHAR(120), NOT NULL): Facility title.
- `LocationID` (NUMBER / INT, FK -> `DISASTER_LOCATION.LocationID`, NOT NULL): Facility coordinates.
- `TotalICUBeds` (NUMBER / INT, NOT NULL, DEFAULT 30): ICU bed capacity.
- `AvailableICUBeds` (NUMBER / INT, NOT NULL, DEFAULT 10): Real-time free ICU beds.
- `TotalGeneralBeds` (NUMBER / INT, NOT NULL, DEFAULT 150): General ward capacity.
- `AvailableGeneralBeds` (NUMBER / INT, NOT NULL, DEFAULT 45): Real-time free general beds.
- `TraumaCenterLevel` (VARCHAR2(20) / VARCHAR(20), NOT NULL, DEFAULT `'LEVEL_1'`): Trauma designation.

##### 24. `MEDICAL_REFERRAL`
Emergency casualty ambulance transport and trauma triage referrals.
- `ReferralID` (NUMBER / INT, PK, AUTOINCREMENT): Referral ticket key.
- `DisasterID` (NUMBER / INT, FK -> `DISASTER.DisasterID`, NOT NULL): Incident source.
- `HospitalID` (NUMBER / INT, FK -> `HOSPITAL.HospitalID`, NOT NULL): Destination hospital.
- `PatientName` (VARCHAR2(100) / VARCHAR(100), NOT NULL): Patient identifier.
- `InjurySeverity` (VARCHAR2(20) / VARCHAR(20), NOT NULL): `CRITICAL`, `SERIOUS`, `MODERATE`, `MINOR`.
- `AssignedAmbulance` (VARCHAR2(50) / VARCHAR(50)): Ambulance unit callsign.
- `ReferralStatus` (VARCHAR2(30) / VARCHAR(30), NOT NULL, DEFAULT `'REQUESTED'`): `REQUESTED` -> `ASSIGNED` -> `IN_TRANSIT` -> `RECEIVED` -> `COMPLETED`.
- `CreatedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).
- `ReceivedAt` (TIMESTAMP / DATETIME, NULLABLE): Hospital admission timestamp.

---

#### Domain 5: Audit Trails, Workflow History & Alerts

##### 25. `NOTIFICATION`
Role-targeted operational alerts and dispatch announcements.
- `NotificationID` (NUMBER / INT, PK, AUTOINCREMENT): Notification key.
- `UserID` (NUMBER / INT, FK -> `USER_ACCOUNT.UserID`, NOT NULL): Recipient user.
- `Title` (VARCHAR2(120) / VARCHAR(120), NOT NULL): Alert headline.
- `Message` (CLOB / TEXT, NOT NULL): Full notification body.
- `NotificationType` (VARCHAR2(50) / VARCHAR(50), NOT NULL, DEFAULT `'ALERT'`): `ALERT`, `DISPATCH`, `STATUS_CHANGE`, `WARNING`.
- `IsRead` (NUMBER(1) / BOOLEAN, NOT NULL, DEFAULT 0): Read flag.
- `CreatedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).

##### 26. `INCIDENT_WORKFLOW_EVENT`
State machine transition audit log capturing lifecycle changes.
- `EventID` (NUMBER / INT, PK, AUTOINCREMENT): Event log key.
- `DisasterID` (NUMBER / INT, FK -> `DISASTER.DisasterID`, NOT NULL): Target incident.
- `EventType` (VARCHAR2(60) / VARCHAR(60), NOT NULL): Transition trigger (e.g., `REPORT_SUBMITTED`, `SEVERITY_ASSESSED`, `INCIDENT_ACTIVATED`).
- `ActorID` (NUMBER / INT, FK -> `USER_ACCOUNT.UserID`, NOT NULL): User who initiated state change.
- `PreviousState` (VARCHAR2(40) / VARCHAR(40), NULLABLE): Prior FSM status.
- `NewState` (VARCHAR2(40) / VARCHAR(40), NOT NULL): Target FSM status.
- `Reason` (CLOB / TEXT, NULLABLE): Justification for transition.
- `CreatedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).

##### 27. `AUDIT_LOG`
Tamper-evident system-wide audit trail recording critical database operations.
- `LogID` (NUMBER / INT, PK, AUTOINCREMENT): Primary key.
- `EntityName` (VARCHAR2(60) / VARCHAR(60), NOT NULL): Target table name (e.g., `DISASTER_REPORT`, `RESOURCE_ALLOCATION`).
- `EntityID` (VARCHAR2(60) / VARCHAR(60), NOT NULL): Primary key value of affected row.
- `Action` (VARCHAR2(30) / VARCHAR(30), NOT NULL): Operation type (`INSERT`, `UPDATE`, `DELETE`, `STATE_TRANSITION`).
- `PerformedBy` (NUMBER / INT, NOT NULL): User ID executing operation (or 0 for system daemon).
- `ActorName` (VARCHAR2(100) / VARCHAR(100)): Cached actor full name.
- `Details` (CLOB / TEXT, NOT NULL): Structured JSON or text representation of delta / parameters.
- `CreatedAt` (TIMESTAMP / DATETIME, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`).

---

### Core Relational Indexes & Performance Optimization

To guarantee sub-10ms response times across large-scale datasets, the database establishes indexed B-Trees across all high-frequency foreign keys and lookup attributes:

```sql
-- Fast Citizen Email Authentication
CREATE UNIQUE INDEX idx_user_email ON USER_ACCOUNT(Email);

-- Citizen Report Fast Reference & Verification Queue Lookup
CREATE UNIQUE INDEX idx_report_ref ON DISASTER_REPORT(ReportReferenceID);
CREATE INDEX idx_report_status ON DISASTER_REPORT(Status, SubmittedAt DESC);
CREATE INDEX idx_report_location ON DISASTER_REPORT(LocationID);

-- Incident Command & Live Map Spatial Lookup
CREATE UNIQUE INDEX idx_incident_code ON DISASTER(IncidentCode);
CREATE INDEX idx_incident_status ON DISASTER(Status);
CREATE INDEX idx_disaster_location ON DISASTER(LocationID);

-- Inventory Transaction Concurrency & Depletion Scanning
CREATE UNIQUE INDEX idx_inv_wh_res ON INVENTORY(WarehouseID, ResourceID);
CREATE INDEX idx_inv_available ON INVENTORY(QuantityAvailable);

-- Tactical Mission Dispatch Query Optimization
CREATE INDEX idx_mission_team ON TEAM_ASSIGNMENT(TeamID, AssignmentStatus);
CREATE INDEX idx_mission_disaster ON TEAM_ASSIGNMENT(DisasterID);

-- Shelter Real-time Capacity Monitoring
CREATE INDEX idx_shelter_capacity ON SHELTER(CurrentOccupancy, Capacity);
```

---

### Key Database Transaction Implementations (SQL & ORM)

#### 1. Atomic Warehouse Resource Deduction & Reservation
```sql
BEGIN TRANSACTION;

-- 1. Validate stock sufficiency with exclusive row lock
SELECT QuantityAvailable, QuantityReserved 
FROM INVENTORY 
WHERE WarehouseID = 1 AND ResourceID = 101 
FOR UPDATE;

-- 2. Deduct available stock and increment reserved pool atomically
UPDATE INVENTORY 
SET QuantityAvailable = QuantityAvailable - 250,
    QuantityReserved = QuantityReserved + 250
WHERE WarehouseID = 1 AND ResourceID = 101 
  AND QuantityAvailable >= 250;

-- 3. Record binding allocation manifest
INSERT INTO RESOURCE_ALLOCATION (
    RequestID, WarehouseID, ResourceID, AllocatedQuantity, 
    AllocatedBy, DispatchReference, AllocationStatus, AllocatedAt
) VALUES (
    42, 1, 101, 250, 
    7, 'DISP-8F72A9B1', 'RESERVED', CURRENT_TIMESTAMP
);

-- 4. Record immutable audit log entry
INSERT INTO AUDIT_LOG (
    EntityName, EntityID, Action, PerformedBy, ActorName, Details, CreatedAt
) VALUES (
    'RESOURCE_ALLOCATION', 'DISP-8F72A9B1', 'INSERT', 7, 'Logistics Officer', 
    '{"quantity": 250, "warehouse_id": 1, "resource_id": 101}', CURRENT_TIMESTAMP
);

COMMIT;
```

#### 2. Evacuee Shelter Check-In with Capacity Guard
```sql
BEGIN TRANSACTION;

-- Verify shelter capacity limit is not exceeded
SELECT Capacity, CurrentOccupancy 
FROM SHELTER 
WHERE ShelterID = 5;

-- Atomically increment shelter occupancy
UPDATE SHELTER 
SET CurrentOccupancy = CurrentOccupancy + 1,
    Status = CASE WHEN CurrentOccupancy + 1 >= Capacity THEN 'FULL' ELSE 'OPEN' END
WHERE ShelterID = 5 AND CurrentOccupancy < Capacity;

-- Insert evacuee check-in record
INSERT INTO SHELTER_REGISTRATION (
    ShelterID, CitizenID, CheckInTime, DependentsCount, SpecialRequirements
) VALUES (
    5, 108, CURRENT_TIMESTAMP, 2, 'Elderly wheelchair requirement'
);

COMMIT;
```

