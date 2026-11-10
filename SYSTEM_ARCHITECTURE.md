# SYSTEM ARCHITECTURE SPECIFICATION
## Urban Disaster Response & Relief Coordination Platform (UDRRMS / UDR-ORP)

---

## 1. Architectural Overview & Design Principles

The Urban Disaster Response & Relief Coordination Platform (UDRRMS / UDR-ORP) is engineered as an enterprise-grade, distributed 3-tier disaster orchestration system. It is designed to operate under mission-critical conditions where real-time coordination, transactional data integrity, and role-based operational security are paramount.

```
+-----------------------------------------------------------------------------+
|                            PRESENTATION TIER                                |
|  React 18 + Vite + Tailwind CSS + Lucide Icons + Recharts + Leaflet GIS     |
|                                                                             |
|  [Citizen Portal]      [Admin Command]     [Rescue Terminal]  [Logistics]   |
+-----------------------------------------------------------------------------+
                                      |
                           HTTPS / WSS / REST APIs
                                      |
+-----------------------------------------------------------------------------+
|                          APPLICATION & GATEWAY TIER                         |
|                                                                             |
|  [Unified Node Gateway :5000]                                               |
|  - SPA Static Distribution & Cache Headers                                  |
|  - Reverse Proxy Routing (/api, /docs, /openapi.json)                       |
|  - CORS, Rate Limiting & Hop-by-Hop Sanitization                            |
|                                                                             |
|  [FastAPI Microservice Engine :8000]                                        |
|  - Pydantic v2 Request/Response Validation                                  |
|  - Stateless HMAC-SHA256 JWT Authentication                                 |
|  - Role-Based Access Control (RBAC) Dependency Injections                   |
|  - 14-Stage Operational Workflow State Machine                              |
|  - Geospatial Distance & Polygon Calculation Engine                         |
+-----------------------------------------------------------------------------+
                                      |
                        SQLAlchemy ORM / Raw SQL Pool
                                      |
+-----------------------------------------------------------------------------+
|                          PERSISTENT DATA TIER                               |
|                                                                             |
|  - Production Engine: Oracle Database 19c/23c (Enterprise Schema DDL)       |
|  - Embedded Engine: SQLite 3.45+ (WAL Mode, Foreign Keys = ON)              |
|  - 27 Normalized Relational Tables (Strict Third Normal Form - 3NF)          |
|  - 16 B-Tree Indexes on High-Frequency Join and Filter Predicates           |
|  - ACID Transactional Atomicity with Row-Level Concurrency Locks            |
+-----------------------------------------------------------------------------+
```

---

## 2. Layer Specifications

### 2.1 Presentation Tier (Frontend Client)
- **Framework**: React 18.3+ with Vite modern build system.
- **Styling**: Tailwind CSS utilizing an emergency-command dark slate aesthetic (`#0f172a` canvas, `#1e293b` surfaces, with high-contrast priority accents: Crimson P1, Amber P2, Cobalt P3, Emerald Normal).
- **Geospatial Mapping**: Leaflet 1.9.4 integration with OpenStreetMap tiles. Renders layered geospatial nodes:
  - Active Disasters (P1 Critical to P4 Low pulsing markers)
  - Emergency Relief Shelters (dynamic occupancy % indicator)
  - Regional Logistics Reserve Depots & Warehouses
  - Deployed Tactical Field Units (NDRF, EMS, Fire Brigades)
  - City Risk Zones & Inundation Boundaries
- **Data Visualization**: Recharts engine providing real-time operational metrics:
  - Hazard Category Distribution (Bar Chart)
  - Incident Severity Breakdown (Pie Chart)
  - Resource Demand vs. Fulfilled Supply (Dual-Column Grouped Bar Chart)
- **Resilience**: Universal Defensive Programming guards against missing properties, API envelopes, and network dropped packets. All collection mappings are protected via `(items || []).map(...)` and `React.ErrorBoundary`.

### 2.2 Unified Gateway Tier (Node.js Express Proxy)
- **Host**: Port 5000 (`http://localhost:5000`).
- **Single-Entry Point**: Delivers the compiled Single-Page Application (SPA) production build from `frontend/dist` while seamlessly routing `/api` and `/api/v1` to the FastAPI core backend.
- **Auto-Bootstrapping**: Verifies FastAPI backend health on port 8000 at startup; if offline, automatically spawns `uvicorn app.main:app` as a managed child process.
- **Security & Headers**: Implements CORS policy, forwards JWT Authorization bearer tokens intact, sanitizes hop-by-hop HTTP headers, and eliminates CORS preflight issues during development and deployment.

### 2.3 Application Core Tier (Python FastAPI)
- **Host**: Port 8000 (`http://127.0.0.1:8000`).
- **Architectural Style**: Asynchronous RESTful microservice with automatic OpenAPI 3.0 / Swagger documentation.
- **Validation**: Strict schema typing using Pydantic v2. Invalid payloads are rejected at the edge with descriptive 422 Unprocessable Entity responses.
- **Security Subsystem**: Passwords hashed using salted `bcrypt` (work factor 12). Authentication verified using stateless HMAC-SHA256 JWT tokens containing role, subject, and expiration claims.
- **Modular Routers**:
  - `/api/v1/auth`: Citizen self-registration, credential verification, profile inspection.
  - `/api/v1/reports`: Geocoded distress submission, supplemental citizen updates, emergency assistance requests.
  - `/api/v1/verification`: Incident command verification queue, severity override, rejection with audit log.
  - `/api/v1/incidents`: Active disaster triage, incident closure audit checklist.
  - `/api/v1/teams` & `/api/v1/missions`: Tactical squad deployment, mission life-cycle transitions (`ASSIGNED` -> `EN_ROUTE` -> `ON_SCENE` -> `COMPLETED`).
  - `/api/v1/resources` & `/api/v1/inventory`: Multi-depot stock query, atomic reservation, stock intake replenishment.
  - `/api/v1/deliveries`: Dispatch manifests, carrier transit logs, receiver delivery confirmations.
  - `/api/v1/shelters`: Evacuee check-ins, capacity ceiling enforcement, camp manager directory.
  - `/api/v1/map`: Aggregated spatial GeoJSON nodes.
  - `/api/v1/analytics`: Real-time SQL aggregations and CSV data export.

### 2.4 Data Tier (Persistent Relational Database)
- **Oracle Database Compatibility**: Complete enterprise DDL script (`database/01_udrrms_oracle_schema.sql`) defining 27 normalized tables, sequences, triggers, check constraints, foreign keys, and views.
- **Embedded Persistent Engine**: SQLite engine (`database/udrrms.db`) executing identical 3NF normalized tables with Write-Ahead Logging (WAL) and `PRAGMA foreign_keys = ON`.
- **Relational Integrity**: 100% normalized to Third Normal Form (3NF). Every multi-valued dependency is decomposed into child junction tables. Comma-separated fields are strictly prohibited.

---

## 3. Four Interconnected User Roles & Workflows

| User Role | System Persona | Primary Capabilities & Workflows |
| :--- | :--- | :--- |
| **CITIZEN** | Aarav Sharma (Citizen) | Registers account, reports geocoded emergencies, attaches casualty telemetry, tracks live status (`SUBMITTED` -> `VERIFIED` -> `ACTIVE` -> `RESOLVED`), submits emergency assistance requests, views relief camps. |
| **ADMINISTRATOR** | Col. Rajesh Varma (Chief Officer) | Central incident command, reviews pending verification queue, assesses severity (`P1` to `P4`), overrides priority, assigns specialized rescue teams, monitors live GIS map, validates closure audit checklist. |
| **RESCUE TEAM** | NDRF Alpha Squad / EMS Trauma | Receives tactical mission orders, views route coordinates, accepts/declines missions, submits field telemetry updates, requests specialized equipment/medical supplies, confirms aid delivery. |
| **SUPPLIES & LOGISTICS** | Dr. Suresh Hegde (Coordinator) | Manages regional reserve depots (Hebbal, Manyata, Yelahanka), verifies on-hand inventory balances, performs atomic stock reservations, dispatches relief convoys, tracks delivery receipts, records intake. |

---

## 4. End-to-End Operational Lifecycle Workflow

```
[CITIZEN REPORT]
       |
       v
(1) Submit Report (GPS, Casualties, Medical/Evacuation Needs)
       |
       v
(2) Relational DB Stores (Status = 'SUBMITTED', Ref ID = 'RPT-20261110-XXXXXX')
       |
       v
(3) Administrator Triage (Inspects Queue, Overrides Severity P1-P4)
       |
       +---> [REJECT] --> Status = 'REJECTED' (Recorded in Audit Log)
       |
       +---> [VERIFY] --> Status = 'ACTIVE', Creates Incident INC-XXXX
               |
               v
       (4) Tactical Team Mobilization (Assigns NDRF / EMS Unit)
               |
               v
       (5) Team Acceptance (Status = 'ASSIGNED' -> 'EN_ROUTE' -> 'ON_SCENE')
               |
               v
       (6) Resource Request Submitted (e.g. 500 Food Kits, 800 Water Cans)
               |
               v
       (7) Logistics Depot Inventory Check (Hebbal Central Depot)
               |
               v
       (8) Atomic Stock Reservation (Available: -500, Reserved: +500)
               |
               v
       (9) Dispatch Manifest Created (Carrier KA-04-G-4412 Assigned)
               |
               v
       (10) Transit & Field Delivery (Status = 'DISPATCHED')
               |
               v
       (11) Receipt Confirmation (Commander Signs Manifest, Reserved: -500)
               |
               v
       (12) Evacuation to Shelters (Sahakarnagar Shelter Occupancy Incremented)
               |
               v
       (13) Incident Closure Audit (All Checks Validated, Incident = 'CLOSED')
```

---

## 5. Security & High-Availability Architecture
1. **Stateless Scalability**: Authentication uses signed JWT tokens, allowing multiple backend application workers to run behind load balancers without session affinity bottlenecks.
2. **ACID Transaction Isolation**: Multi-record state transitions (such as stock reservations and mission completions) are wrapped inside atomic database transactions with immediate rollback upon constraint failure.
3. **Data Loss Prevention**: Database persistence is validated across application restarts, browser reloads, and simulated computer reboots.

