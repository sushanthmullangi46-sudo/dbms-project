# REST API ARCHITECTURE & ENDPOINT SPECIFICATION
## Urban Disaster Response & Relief Coordination Platform (UDRRMS / UDR-ORP)

---

## 1. Overview & General Principles

The UDRRMS application programming interface is engineered following strict RESTful principles, providing JSON-over-HTTP communications with complete OpenAPI 3.0 / Swagger compatibility.

- **Base Gateway URL**: `http://localhost:5000/api/v1`
- **Core Engine URL**: `http://127.0.0.1:8000/api/v1`
- **Interactive Swagger Documentation**: `http://localhost:5000/docs`
- **ReDoc Technical Interface**: `http://localhost:5000/redoc`
- **Authentication**: Stateless HTTP Authorization Header with Bearer Token (`Authorization: Bearer <JWT_TOKEN>`)
- **Default Content Type**: `application/json`

---

## 2. Standardized HTTP Status Code Protocol

| Status Code | Meaning | Usage Scenario in UDRRMS |
| :--- | :--- | :--- |
| **200 OK** | Success | Query requests, successful state modifications, verified operational updates. |
| **201 Created** | Resource Created | Successful report submission, user account onboarding, dispatch manifest creation. |
| **400 Bad Request** | Business Rule Violation | Insufficient warehouse stock, duplicate delivery confirmation, invalid state transition. |
| **401 Unauthorized** | Missing/Invalid Token | Expired JWT, tampered signature, unauthenticated request to protected endpoints. |
| **403 Forbidden** | RBAC Privilege Error | Citizen attempting officer verification, responder modifying warehouse inventories. |
| **404 Not Found** | Resource Missing | Non-existent incident ID, unknown report reference code. |
| **422 Unprocessable**| Validation Error | Pydantic validation failure (e.g. invalid latitude/longitude range, negative casualty count). |
| **500 Server Error** | Unexpected Failure | Database connectivity fault or unhandled exception (handled with standard error payload). |

---

## 3. Core API Route Inventory

### 3.1 Authentication Subsystem (`/api/v1/auth`)

#### `POST /auth/login`
- **Description**: Authenticates user credentials via salted bcrypt comparison and issues a signed JWT token.
- **Request Body**:
  ```json
  {
    "email": "officer@udrrms.com",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user_id": 2,
    "role": "DISASTER_OFFICER",
    "user": {
      "userId": 2,
      "email": "officer@udrrms.com",
      "fullName": "Col. Rajesh Varma",
      "role": "DISASTER_OFFICER"
    }
  }
  ```

#### `POST /auth/register`
- **Description**: Self-service citizen onboarding. Assigns `ROLE_CITIZEN` by default.
- **Request Body**:
  ```json
  {
    "full_name": "Suresh Patel",
    "email": "suresh.patel@example.com",
    "phone": "+91-9880123456",
    "password": "SecurePassword2026!"
  }
  ```
- **Response (201 Created)**: Returns created user identity and authorization token.

---

### 3.2 Citizen Distress Reporting (`/api/v1/reports`)

#### `POST /reports`
- **Description**: Submits an urgent disaster report. Generates a unique tracking reference code (`RPT-YYYYMMDD-XXXXXX`), sets initial status to `SUBMITTED`, and updates the geospatial marker layer.
- **Authorized Roles**: `CITIZEN`, `DISASTER_OFFICER`
- **Request Body**:
  ```json
  {
    "location_id": 1001,
    "disaster_type": "Flood",
    "description": "Hebbal flyover underpass completely inundated. 5 feet water trapped 20 motorists.",
    "people_affected": 20,
    "injuries_reported": 3,
    "missing_persons": 0,
    "trapped_persons": 15,
    "urgent_medical_needed": true,
    "evacuation_needed": true
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "report_id": 92,
    "report_reference_id": "RPT-20261110-11AC9E",
    "status": "SUBMITTED",
    "severity": "CRITICAL",
    "created_at": "2026-11-10T17:15:40.123456"
  }
  ```

#### `POST /reports/{report_id}/updates`
- **Description**: Adds chronological supplemental notes and casualty condition updates to an existing report.
- **Request Body**:
  ```json
  {
    "update_text": "Water levels rising rapidly, 3 additional elderly citizens need evacuation."
  }
  ```
- **Response (200 OK)**: Appends update to report diary.

---

### 3.3 Command Triage & Verification (`/api/v1/verification`)

#### `GET /verification/queue`
- **Description**: Retrieves all unverified citizen distress reports requiring administrative evaluation.
- **Authorized Roles**: `DISASTER_OFFICER`, `ADMINISTRATOR`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 3,
    "queue": [
      {
        "report_id": 92,
        "report_reference_id": "RPT-20261110-11AC9E",
        "disaster_type": "Flood",
        "description": "Hebbal flyover underpass completely inundated...",
        "people_affected": 20,
        "trapped_persons": 15,
        "location_name": "Hebbal Flyover Junction",
        "status": "SUBMITTED"
      }
    ]
  }
  ```

#### `POST /verification/verify`
- **Description**: Formally verifies a citizen report, promoting it into an official incident (`INC-YYYYMMDD-XXXXXX`), setting status to `VERIFIED`/`ACTIVE`, and enabling rescue squad dispatch.
- **Request Body**:
  ```json
  {
    "report_id": 92,
    "severity_override": "P1"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Report officially verified into active disaster incident.",
    "status": "VERIFIED",
    "incident_id": 1004,
    "incident_code": "INC-20261110-449102"
  }
  ```

#### `POST /verification/reject`
- **Description**: Rejects an unsubstantiated report with documented reason.
- **Request Body**:
  ```json
  {
    "report_id": 93,
    "reason": "Duplicate alert submitted for known resolved situation."
  }
  ```
- **Response (200 OK)**: Status updated to `REJECTED`, audit record stored.

---

### 3.4 Warehouse Inventory & Stock Ledger (`/api/v1/inventory`)

#### `GET /inventory/stock`
- **Description**: Retrieves real-time stock balances across all regional logistics reserve depots.
- **Authorized Roles**: `COORDINATOR`, `DISASTER_OFFICER`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 12,
    "stock": [
      {
        "INVENTORYID": 1,
        "WAREHOUSENAME": "Hebbal Central Disaster Reserve Depot",
        "WAREHOUSELOCATION": "Hebbal Logistics Hub",
        "RESOURCENAME": "Inflatable Rescue Boat (Zodiac)",
        "CATEGORY": "EQUIPMENT",
        "QUANTITYAVAILABLE": 8,
        "QUANTITYRESERVED": 2,
        "QUANTITYONHAND": 10,
        "REORDERLEVEL": 2,
        "UNIT": "Boats",
        "STOCKSTATUS": "OPTIMAL"
      }
    ]
  }
  ```

#### `GET /inventory/transactions`
- **Description**: Returns immutable transaction ledger of all stock reservations, dispatches, and intake replenishments.
- **Response (200 OK)**: Returns transaction history array.

#### `POST /resources/allocate`
- **Description**: Atomically reserves warehouse stock for an approved incident supply request.
- **Request Body**:
  ```json
  {
    "request_id": 101,
    "warehouse_id": 1,
    "quantity_allocated": 500
  }
  ```
- **Response (200 OK)**: Deducts available balance and increments reserved balance atomically.

---

### 3.5 Geospatial & Analytics Intelligence (`/api/v1/map` & `/api/v1/analytics`)

#### `GET /map/markers`
- **Description**: Compiles GeoJSON-compatible markers across all spatial entities: incidents, shelters, warehouses, hospitals, and tactical field teams.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "markers": {
      "incidents": [...],
      "shelters": [...],
      "warehouses": [...],
      "responders": [...],
      "reports": [...]
    }
  }
  ```

#### `GET /analytics/dashboard`
- **Description**: Consolidated executive dashboard analytics with real SQL database aggregations.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "kpis": {
      "total_incidents": 4,
      "active_incidents": 2,
      "closed_incidents": 2,
      "total_reports": 18,
      "avg_verification_time_mins": 8.5,
      "avg_response_time_mins": 18.2,
      "resource_fulfillment_pct": 94.0
    },
    "incidents_by_type": [
      {"name": "Flood", "count": 8},
      {"name": "Fire", "count": 4}
    ],
    "incidents_by_severity": [
      {"name": "P1 - Critical", "value": 5},
      {"name": "P2 - High", "value": 7}
    ],
    "resource_demand_vs_fulfilled": [
      {"item": "72hr Food Ration Kits", "requested": 2500, "fulfilled": 2400},
      {"item": "Purified Potable Water 20L Cans", "requested": 4000, "fulfilled": 3800}
    ]
  }
  ```

