# UDRRMS REST API Specifications (FastAPI Engine)

The UDRRMS backend exposes comprehensive RESTful APIs adhering to the OpenAPI 3.1 standard.
Interactive Swagger documentation is available live at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

## Base Configuration
- **Base URL:** `http://localhost:8000/api/v1`
- **Authentication:** `Authorization: Bearer <JWT_TOKEN>`
- **Content-Type:** `application/json`

---

## 1. Authentication & RBAC Identity (`/auth`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new citizen account and profile | Public |
| `POST` | `/auth/login` | Authenticate credentials & issue JWT token | Public |
| `GET` | `/auth/me` | Fetch active user identity & assigned RBAC role | Authenticated |

---

## 2. Disaster Reporting (`/reports`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/reports` | Stage 1: Submit disaster report; generates Ref ID | `CITIZEN` |
| `GET` | `/reports` | List reports (Citizen gets own; Officer gets all) | Authenticated |
| `GET` | `/reports/{id}` | Retrieve comprehensive incident report details | Authenticated |
| `POST` | `/reports/{id}/updates` | Post supplementary field information notes | `CITIZEN` / `DISASTER_OFFICER` |
| `POST` | `/reports/{id}/assistance-request` | Submit urgent food, water, or medical request | `CITIZEN` |

---

## 3. Incident Verification & Deduplication (`/verification`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/verification/queue` | List unverified reports (`SUBMITTED`) | `DISASTER_OFFICER` |
| `POST` | `/verification/verify` | Stage 2: Mark report verified (`VERIFIED`) | `DISASTER_OFFICER` |
| `POST` | `/verification/reject` | Reject report with mandatory reason (`REJECTED`) | `DISASTER_OFFICER` |
| `POST` | `/verification/request-info` | Request info (`AWAITING_INFORMATION`) | `DISASTER_OFFICER` |
| `POST` | `/verification/merge` | Merge duplicate report into active incident | `DISASTER_OFFICER` |

---

## 4. Operational Incident Command (`/incidents`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/incidents` | List active operational incidents | Authenticated |
| `GET` | `/incidents/{id}` | Incident detail with timeline, teams, resources | Authenticated |
| `POST` | `/incidents/assess-severity` | Stage 3: Rule-based explainable scoring (P1-P4) | `DISASTER_OFFICER` |
| `POST` | `/incidents/activate` | Stage 4: Activate operational response (`ACTIVE`) | `DISASTER_OFFICER` |
| `POST` | `/incidents/{id}/escalate` | Stage 11: Escalate worsening emergency | `DISASTER_OFFICER` |
| `GET` | `/incidents/{id}/closure-check` | Validate all 6 mandatory closure criteria | `DISASTER_OFFICER` |
| `POST` | `/incidents/{id}/close` | Stage 12: Authorize incident closure (`CLOSED`) | `DISASTER_OFFICER` |

---

## 5. Tactical Response Teams (`/teams`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/teams` | List emergency agencies and response squads | Authenticated |
| `POST` | `/teams/assign` | Stage 6: Assign team to operational incident | `DISASTER_OFFICER` |
| `POST` | `/teams/update-status` | Advance lifecycle: `ASSIGNED` &rarr; `COMPLETED` | Authenticated |

---

## 6. Logistics & Inventory Management (`/resources`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/resources` | Catalog of relief items, specs, and units | Authenticated |
| `GET` | `/resources/warehouses` | List regional reserve depots & capacities | Authenticated |
| `GET` | `/resources/inventory` | Multi-depot available & reserved stock balances | Authenticated |
| `POST` | `/resources/requests` | Stage 5: Create incident resource request | `DISASTER_OFFICER` |
| `GET` | `/resources/requests` | List incident supply requests | `COORDINATOR` |
| `POST` | `/resources/allocate` | Stage 7: Approve & reserve warehouse stock | `COORDINATOR` |
| `POST` | `/resources/replenishment` | Replenish inventory after stock shortages | `COORDINATOR` |

---

## 7. Dispatch & Delivery Tracking (`/deliveries`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/deliveries` | List active transport convoys & delivery records | Authenticated |
| `POST` | `/deliveries/dispatch` | Stage 8: Create convoy dispatch (`DISPATCHED`) | `COORDINATOR` |
| `POST` | `/deliveries/confirm` | Confirm receipt & reconcile stock (`DELIVERED`) | `COORDINATOR` |

---

## 8. Shelters & Evacuation Management (`/shelters`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/shelters` | Municipal relief shelters with capacity & occupancy | Authenticated |
| `POST` | `/shelters/register` | Stage 9: Check in citizen (capacity enforced) | Authenticated |
| `POST` | `/shelters/checkout` | Check out citizen & release shelter places | Authenticated |

---

## 9. Medical Coordination (`/medical`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/medical/hospitals` | Hospital bed matrix (ICU and General beds) | Authenticated |
| `POST` | `/medical/referrals` | Stage 10: Create trauma patient referral | Authenticated |
| `GET` | `/medical/referrals` | List referrals and treatment statuses | Authenticated |

---

## 10. Operational Analytics & Audit Logs (`/analytics`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/analytics/dashboard` | Aggregated KPIs, charts, and SLA performance | Authenticated |
| `GET` | `/analytics/export-csv` | Stage 13: Download complete post-incident CSV | `DISASTER_OFFICER` |
| `GET` | `/analytics/audit-logs` | Immutable audit log trail with actor & actions | `DISASTER_OFFICER` |
