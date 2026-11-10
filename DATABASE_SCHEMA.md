# URBAN DISASTER RELIEF AND RESOURCE MANAGEMENT SYSTEM (UDRRMS)
## Comprehensive Database Architecture & Schema Specification (3NF Relational Model)

---

## 1. Executive Database Overview

The **Urban Disaster Relief and Resource Management System (UDRRMS)** database engine is architected as an enterprise-grade, fully normalized (**Third Normal Form - 3NF**) relational database management system. It provides durable, tamper-evident, and concurrent state management for mission-critical disaster reporting, verification triage, tactical team dispatch, resource allocation, and evacuee sheltering.

### Active Deployment Engines:
1. **Local Persistent Relational Storage (Active Engine)**: SQLite 3.45+ engine configured in **Write-Ahead Logging (WAL)** mode with synchronous disk commits, foreign key constraints permanently enforced (`PRAGMA foreign_keys = ON`), and full transactional durability located at `database/udrrms.db`.
2. **Enterprise Scale Target**: Oracle Database 19c / 21c / 23c Enterprise Edition utilizing native identity sequences, PL/SQL triggers, domain check constraints, and stored procedures located at `database/01_udrrms_oracle_schema.sql`.

---

## 2. Relational Schema Domain Summary (27 Core Tables)

```
+-------------------------------------------------------------------------------------------------------------+
| 1. AUTHENTICATION & ACCESS CONTROL (4 Tables)                                                               |
|    ROLES                    | System access roles (CITIZEN, DISASTER_OFFICER, COORDINATOR, FIELD_RESPONDER)|
|    USER_ACCOUNTS            | Primary identities, salted bcrypt credentials, emails, phones, role FK       |
|    CITIZEN_PROFILES         | Extended medical triage notes, emergency contacts, blood groups, addresses    |
|    USER_SESSIONS            | Active cryptographically validated JWT session records                        |
+-------------------------------------------------------------------------------------------------------------+
| 2. INCIDENT MANAGEMENT & DISASTER TRIAGE (6 Tables)                                                         |
|    DISASTER_TYPES           | Official hazard taxonomy (Flood, Fire, Earthquake, Cyclone, Structural)       |
|    DISASTERS                | Operational incidents (INC-XXXX), severity levels (P1 to P4), lead officer FK |
|    DISASTER_REPORTS         | Citizen submissions (RPT-XXXX), casualties, trapped count, medical/evac flags |
|    REPORT_UPDATES           | Chronological supplemental notes logged by reporting citizens or officers     |
|    INCIDENT_MEDIA           | Evidentiary photographs, damage assessments, MIME types, storage URIs         |
|    LOCATIONS                | Municipal spatial wards, geographic hazard zones, WGS84 GPS coordinates       |
+-------------------------------------------------------------------------------------------------------------+
| 3. TACTICAL RESPONSE & MISSIONS (5 Tables)                                                                  |
|    RESPONSE_TEAMS           | Dedicated rescue units (NDRF 10th Bn, EMS Trauma, Fire Station 4)            |
|    TEAM_MEMBERS             | Individual field responders, ranks, medical/rescue certifications, contact   |
|    MISSIONS                 | Tactical deployment orders (MIS-XXXX), target incident, assigned team, status |
|    MISSION_LOGS             | Chronological mission field diary, casualty extraction tallies, milestones    |
|    VEHICLES                 | Fleet inventory (rescue boats, ambulances, hazmat tenders, de-watering pumps) |
+-------------------------------------------------------------------------------------------------------------+
| 4. LOGISTICS, WAREHOUSE & SUPPLY CHAIN (8 Tables)                                                           |
|    WAREHOUSES               | Regional reserve depots (Hebbal Central, Manyata Vault, Yelahanka North)      |
|    RESOURCES                | Relief catalog (zodiac rafts, 50L oxygen, 72hr food kits, potable water cans)  |
|    INVENTORY                | Multi-depot stock balances, on-hand quantity, reserved quantity, reorder level|
|    INVENTORY_TRANSACTIONS   | Immutable ledger recording intake, reservations, allocations, dispatches      |
|    RESOURCE_REQUESTS        | Incident material demand requests (REQ-XXXX), priority rating, author         |
|    REQUEST_ITEMS            | Granular commodity line items, requested quantities, approved quantities      |
|    RESOURCE_ALLOCATIONS     | Transactional reservations binding depot inventory to approved supply requests|
|    DELIVERIES               | Dispatch manifests (DSP-XXXX), transport vehicle, status, receiver signatures |
+-------------------------------------------------------------------------------------------------------------+
| 5. EVACUATION, MEDICAL & AUDIT GOVERNANCE (4 Tables)                                                        |
|    SHELTERS                 | Relief evacuation camps (stadiums, community halls), capacity ceiling         |
|    EVACUEE_REGISTRATIONS    | Displaced persons check-ins, family size, check-in timestamp                  |
|    HOSPITALS                | Emergency trauma centers, ICU bed count, available general beds, triage phone |
|    AUDIT_LOGS               | Tamper-evident immutable ledger capturing user, action, table, prior/new state|
+-------------------------------------------------------------------------------------------------------------+
```

---

## 3. ACID Compliance & Transaction Management

- **Atomicity**: Multi-step inventory operations execute within strict database transactions (`db.begin()`). If an allocation request exceeds available stock (`quantity_available < requested_qty`), an immediate `ROLLBACK` triggers, leaving stock balances untouched.
- **Consistency**: Guaranteed through database constraints:
  - Check constraints prevent negative inventory: `quantity_available >= 0`
  - Unique constraints prevent duplicate depot stock rows: `UNIQUE(warehouse_id, resource_id)`
  - Foreign key cascades ensure child records maintain referential integrity.
- **Isolation**: Handled via Write-Ahead Logging (WAL) and `with_for_update()` row-level locks, preventing dirty reads and race conditions.
- **Durability**: Persistent storage in `database/udrrms.db` ensures zero data loss upon page refresh, browser restart, or server reboot.

---

## 4. 3NF Normalization Proof

1. **First Normal Form (1NF)**:
   - Every column holds atomic, scalar values (no repeating groups, arrays, or JSON strings in normalized operational columns).
   - Every table possesses an explicit surrogate primary key (`user_id`, `report_id`, `inventory_id`, etc.).
2. **Second Normal Form (2NF)**:
   - All tables are in 1NF.
   - Every non-key column is fully functionally dependent on the entire primary key, eliminating partial key dependencies in junction tables like `INVENTORY`.
3. **Third Normal Form (3NF)**:
   - All tables are in 2NF.
   - Non-key columns depend directly on primary keys, eliminating transitive dependencies. For instance, in `DISASTER_REPORTS`, the location coordinates and ward name are not duplicated; they reside in `LOCATIONS` referenced by foreign key `location_id`.

---

## 5. Dedicated Performance Indexes (16 Indexes)

To guarantee sub-10ms query execution during high-volume urban disasters, 16 B-tree indexes are maintained:
```sql
CREATE INDEX idx_reports_status ON DISASTER_REPORTS(status);
CREATE INDEX idx_reports_location ON DISASTER_REPORTS(location_id);
CREATE INDEX idx_reports_user ON DISASTER_REPORTS(reported_by_user_id);
CREATE INDEX idx_reports_created ON DISASTER_REPORTS(created_at);
CREATE INDEX idx_incidents_status ON DISASTERS(status);
CREATE INDEX idx_incidents_severity ON DISASTERS(severity_level);
CREATE INDEX idx_incidents_location ON DISASTERS(location_id);
CREATE INDEX idx_incidents_activated ON DISASTERS(activated_at);
CREATE INDEX idx_missions_status ON MISSIONS(status);
CREATE INDEX idx_missions_incident ON MISSIONS(incident_id);
CREATE INDEX idx_missions_team ON MISSIONS(assigned_team_id);
CREATE INDEX idx_inventory_warehouse ON INVENTORY(warehouse_id);
CREATE INDEX idx_inventory_resource ON INVENTORY(resource_id);
CREATE INDEX idx_alloc_request ON RESOURCE_ALLOCATIONS(request_id);
CREATE INDEX idx_alloc_status ON RESOURCE_ALLOCATIONS(allocation_status);
CREATE INDEX idx_audit_created ON AUDIT_LOGS(created_at);
```

