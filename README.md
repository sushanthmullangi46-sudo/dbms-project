# Urban Disaster Relief and Resource Management System (UDRRMS)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2563eb?logo=github&style=for-the-badge)](https://sushanthmullangi46-sudo.github.io/dbms-project/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Database](https://img.shields.io/badge/Database-Oracle%2021c%20(3NF)-F80000?logo=oracle&logoColor=white)](https://www.oracle.com/database/)
[![Tests](https://img.shields.io/badge/Tests-27%2F27%20Passed%20(100%25)-brightgreen)](docs/TEST_RESULTS.md)

> 🌐 **Permanent Live Application Link (Online Demo):**  
> **[https://sushanthmullangi46-sudo.github.io/dbms-project/](https://sushanthmullangi46-sudo.github.io/dbms-project/)**  
> *(Runs standalone with live disaster maps, reporting forms, triage workflows, and 1-click test logins for Citizen, Administrator, Rescue Team, and Coordinator roles.)*
>
> 💻 **All-in-One Local Output Link (Permanent Database Engine):**  
> **[http://localhost:5000](http://localhost:5000)**  
> *(Single unified gateway serving React UI, Persistent 27-Table Relational Database, and [Interactive Swagger Docs](http://localhost:5000/docs). Launch with `RUN_WEBSITE.bat` or `RUN_UDRRMS.bat`.)*

An enterprise-grade, event-driven multi-agency disaster operations management system designed for urban emergency coordination. Built around a **strict 13-stage sequential response workflow** from initial citizen emergency reporting through incident verification, severity assessment, rescue squad dispatch, transactional inventory allocation, shelter placement, and audit-verified incident closure.

---

## 1. System Architecture & Tech Stack

- **Frontend:** React.js 18 with TypeScript, Tailwind CSS, Leaflet + OpenStreetMap spatial visualization, Recharts operational analytics.
- **Backend:** Python FastAPI with asynchronous RESTful endpoints, Pydantic v2 data validation, and JWT RBAC authentication.
- **Database Engine:** Oracle Database 21c/XE (Target Production) with normalized relational schema in **Third Normal Form (3NF)**.
- **Development Adapter:** Dynamic SQLite fallback adapter (`sqlite:///./udrrms.db`) enabling rapid zero-dependency local development without altering the Oracle logical design.
- **Security & RBAC:** Argon2/Bcrypt password hashing, tamper-proof JWT tokens with role claims, database transaction isolation, and immutable audit ledgers.

---

## 2. Core User Roles & Responsibilities

| Role Persona | Target Credentials | Core Responsibilities |
|---|---|---|
| **Role A: Citizen / Affected Person** (`CITIZEN`) | `citizen@udrrms.com`<br>`password123` | • Submit emergency incident reports with map coordinates.<br>• Input affected count, trapped individuals, and urgent medical needs.<br>• Receive unique Incident Reference ID (`RPT-...`).<br>• Real-time timeline tracking (`SUBMITTED` &rarr; `CLOSED`).<br>• Request rations, potable water, medical triage, or shelter places.<br>• Confirm assistance receipt or flag unresolved emergencies. |
| **Role B: Administrator / Chief Officer** (`DISASTER_OFFICER`) | `officer@udrrms.com`<br>`password123` | • Review incoming reports in the Verification Queue.<br>• Verify reports or reject with mandatory audit reasons.<br>• Merge duplicate citizen alerts into active operational incidents.<br>• Run explainable rule-based severity scoring (P1-P4) with authorized overrides.<br>• Deploy and track tactical rescue squads (`ASSIGNED` &rarr; `COMPLETED`).<br>• Enforce mandatory closure criteria matrix before marking `CLOSED`. |
| **Role C: Rescue / Tactical Team** (`FIELD_RESPONDER`) | `rescue@udrrms.com`<br>`password123` | • View assigned tactical operations and disaster zones on interactive map.<br>• Accept missions and update live operation progress (`EN_ROUTE` &rarr; `ON_SCENE`).<br>• Request urgent supplies and equipment escalations.<br>• Submit field completion reports and mark rescue operations completed. |
| **Support: Relief Coordinator** (`COORDINATOR`) | `coordinator@udrrms.com`<br>`password123` | • Manage multi-depot warehouse inventories (Hebbal, Manyata, Yelahanka).<br>• Review incident supply requests in the approval queue.<br>• Approve full/partial quantities and execute transactional stock reservations.<br>• Create transport convoy dispatches (`DSP-...`).<br>• Record delivery receipts with receiver identity and damaged quantity auditing. |

---

## 3. Mandatory Sequential 13-Stage Workflow

```mermaid
graph TD
    S1["Stage 1: Report Submitted (SUBMITTED)"] --> S2["Stage 2: Report Verification (VERIFIED / REJECTED)"]
    S2 --> S3["Stage 3: Severity Assessment (P1 - P4 Scoring)"]
    S3 --> S4["Stage 4: Incident Activation (ACTIVE)"]
    S4 --> S5["Stage 5: Emergency Resource Assessment"]
    S4 --> S6["Stage 6: Rescue Team Assignment"]
    S5 --> S7["Stage 7: Resource Approval & Stock Reservation"]
    S7 --> S8["Stage 8: Dispatch & Delivery Tracking (DELIVERED)"]
    S4 --> S9["Stage 9: Evacuation & Shelter Management"]
    S4 --> S10["Stage 10: Medical Assistance Referrals"]
    S6 --> S11["Stage 11: Incident Monitoring & Escalation"]
    S8 --> S11
    S9 --> S11
    S10 --> S11
    S11 --> S12["Stage 12: Recovery & Closure Checklist (CLOSED)"]
    S12 --> S13["Stage 13: Post-Incident Analytics & CSV Export"]
```

---

## 4. 27 Normalized Relational Tables (3NF Schema)

The database schema is organized into 27 tables with primary keys, foreign keys, unique constraints, and check constraints:

1. `USER_ACCOUNT` — Identity and hashed credentials.
2. `ROLE` — RBAC definitions (`CITIZEN`, `DISASTER_OFFICER`, `COORDINATOR`).
3. `AGENCY` — Emergency agencies (NDRF, SDRF, EMS, Fire & Emergency, Red Cross).
4. `CITIZEN` — Citizen residential profiles and emergency contacts.
5. `AFFECTED_PERSON` — Dependents declared by citizens.
6. `DISASTER_LOCATION` — Spatial hazard nodes, wards, coordinates, and risk zones.
7. `DISASTER_REPORT` — Citizen incident submissions with unique Reference IDs.
8. `DISASTER` — Operational command incidents (`INC-...`).
9. `REPORT_ATTACHMENT` — Supporting photographic evidence.
10. `REPORT_UPDATE` — Supplementary notes logged by citizens.
11. `RESPONSE_TEAM` — Tactical rescue teams and specializations.
12. `TEAM_ASSIGNMENT` — Operational mission assignments and lifecycles.
13. `RESOURCE` — Relief items catalog (Boats, Oxygen, Food, Water, Blankets).
14. `WAREHOUSE` — Regional supply depots and storage capacities.
15. `INVENTORY` — Available vs reserved stock balances per depot.
16. `RESOURCE_REQUEST` — Incident material demand requests.
17. `REQUEST_ITEM` — Items specified in supply requests.
18. `RESOURCE_ALLOCATION` — Approved reservations linked to depots.
19. `DELIVERY` — Transport convoy dispatches and tracking.
20. `DELIVERY_ITEM` — Quantities loaded and verified at delivery.
21. `SHELTER` — Municipal relief camps with capacity constraints.
22. `SHELTER_REGISTRATION` — Citizen shelter check-ins and check-outs.
23. `HOSPITAL` — Medical centers with ICU and general bed counters.
24. `MEDICAL_REFERRAL` — Patient trauma referrals.
25. `NOTIFICATION` — In-app alerts delivered to operators.
26. `INCIDENT_WORKFLOW_EVENT` — Immutable sequential workflow state events.
27. `AUDIT_LOG` — System-wide security and operations ledger.

---

## 5. Local Setup & Execution Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Oracle Database 21c XE (or use default SQLite dev adapter)

### Quick One-Click Startup (Windows)
Double-click `RUN_UDRRMS.bat` in the project root directory. This script:
1. Starts the FastAPI backend service on port 8000.
2. Starts the React Vite frontend service on port 3000.
3. Automatically launches the browser at `http://localhost:3000/#/login`.

### Manual Startup

#### Step 1: Start Backend (FastAPI)
```bash
cd backend_py
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Interactive ReDoc: `http://127.0.0.1:8000/redoc`

#### Step 2: Start Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
- Access Frontend UI: `http://localhost:3000/#/login`

---

## 6. Running the Automated Test Suite

To run all 27 automated test cases (validating the 13 workflow stages, database constraints, and all 12 mandatory persistence & synchronization tests):

```bash
python -m pytest -o pythonpath=backend_py backend_py\tests -v
```

Result:
```text
======================= 27 passed in 8.44s (100% pass rate) =======================
```
```

---

## 7. Deliverables & Documentation Directory

### Core System Documentation (Markdown):
- **System Architecture:** [`SYSTEM_ARCHITECTURE.md`](SYSTEM_ARCHITECTURE.md)
- **Database Design & 3NF Proof:** [`DATABASE_DESIGN.md`](DATABASE_DESIGN.md)
- **ER Model & Data Dictionary:** [`ER_DIAGRAM.md`](ER_DIAGRAM.md)
- **REST API Specifications:** [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)
- **Security & RBAC Architecture:** [`SECURITY_DOCUMENTATION.md`](SECURITY_DOCUMENTATION.md)
- **Local Setup & Installation Guide:** [`SETUP_GUIDE.md`](SETUP_GUIDE.md)
- **Production Deployment Guide:** [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)
- **Error Audit & Post-Mortem Report:** [`ERROR_AUDIT.md`](ERROR_AUDIT.md)
- **Automated Test Results (27/27):** [`TEST_RESULTS.md`](TEST_RESULTS.md)
- **System Validation Certification:** [`PROJECT_VALIDATION_REPORT.md`](PROJECT_VALIDATION_REPORT.md)

### Academic Final Project Report Package (`FINAL_PROJECT_REPORT/`):
- **Official PDF Report:** [`FINAL_PROJECT_REPORT/FINAL_PROJECT_REPORT.pdf`](FINAL_PROJECT_REPORT/FINAL_PROJECT_REPORT.pdf)
- **Official Word DOCX Report:** [`FINAL_PROJECT_REPORT/FINAL_PROJECT_REPORT.docx`](FINAL_PROJECT_REPORT/FINAL_PROJECT_REPORT.docx)
- **Comprehensive Markdown Report:** [`FINAL_PROJECT_REPORT/FINAL_PROJECT_REPORT.md`](FINAL_PROJECT_REPORT/FINAL_PROJECT_REPORT.md)
- **System Architecture Diagram:** [`FINAL_PROJECT_REPORT/SYSTEM_ARCHITECTURE.png`](FINAL_PROJECT_REPORT/SYSTEM_ARCHITECTURE.png)
- **3NF Entity-Relationship Diagram:** [`FINAL_PROJECT_REPORT/ER_DIAGRAM.png`](FINAL_PROJECT_REPORT/ER_DIAGRAM.png)
- **Unified 4-Role Use Case Diagram:** [`FINAL_PROJECT_REPORT/USE_CASE_DIAGRAM.png`](FINAL_PROJECT_REPORT/USE_CASE_DIAGRAM.png)
- **13-Stage Operational Workflow:** [`FINAL_PROJECT_REPORT/COMPLETE_WORKFLOW.png`](FINAL_PROJECT_REPORT/COMPLETE_WORKFLOW.png)
- **Excel Test Cases Matrix:** [`FINAL_PROJECT_REPORT/TEST_CASES.xlsx`](FINAL_PROJECT_REPORT/TEST_CASES.xlsx)
- **17 Live Authentic Chrome Screenshots:** [`FINAL_PROJECT_REPORT/SCREENSHOTS/`](FINAL_PROJECT_REPORT/SCREENSHOTS/)

### Database Scripts:
- **Oracle Enterprise 3NF Schema:** [`database/01_udrrms_oracle_schema.sql`](database/01_udrrms_oracle_schema.sql)
- **Oracle Seed Master Dataset:** [`database/02_udrrms_oracle_seed_data.sql`](database/02_udrrms_oracle_seed_data.sql)
- **Analytical SQL Queries (JOIN / GROUP BY):** [`database/03_analytical_queries.sql`](database/03_analytical_queries.sql)
