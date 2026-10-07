# UDR-ORP — REST API Specification

Base URL: `http://localhost:5000/api`

All authenticated endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication Endpoints

### `POST /auth/login`
- **Access:** Public
- **Body:**
  ```json
  {
    "email": "admin@udrorp.com",
    "password": "password123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "userId": 1001,
      "roleId": 1,
      "roleName": "COMMAND_CENTER",
      "fullName": "Director Rajesh Sharma",
      "email": "admin@udrorp.com"
    }
  }
  ```

### `GET /auth/me`
- **Access:** Any authenticated user
- **Response `200 OK`:** User identity, role, and profile details.

### `POST /auth/logout`
- **Access:** Authenticated
- **Response `200 OK`:** `{"success": true, "message": "Logged out successfully"}`

---

## 2. Command Center Endpoints (`COMMAND_CENTER`)

### `GET /dashboard`
- **Access:** `COMMAND_CENTER`
- **Returns:** Real-time metrics aggregated via Oracle SQL:
  - `activeIncidents`, `pendingRequests`, `activeMissions`, `availableResponders`, `availableVehicles`
  - Severity distribution, Category breakdown, Mission status counts, Resource utilization, Inventory alerts, Critical requests, Recent audit activity.

### `GET /incidents`
- **Filters:** `?status=ACTIVE&severity=CRITICAL&search=Hebbal`
- **Returns:** List of incidents with locations and zone metrics.

### `POST /incidents`
- **Body:**
  ```json
  {
    "incidentName": "Hebbal Metro Line Breach",
    "incidentType": "FLOOD",
    "severity": "CRITICAL",
    "locationId": 1001,
    "description": "Drainage canal overflow inundated metro station approach road."
  }
  ```
- **Invokes Oracle Procedure:** `CREATE_INCIDENT`

### `GET /incidents/:id`
- **Returns:** Incident details, affected zones, associated requests, missions, field reports, and audit trail.

### `PUT /incidents/:id`
- **Body:** `{"status": "RESOLVED", "severity": "MEDIUM", "endTime": "..."}`
- **Fires Oracle Trigger:** `TRG_INCIDENT_AUDIT_LOG`

### `GET /requests`
- **Filters:** `?priority=CRITICAL&status=PENDING&type=RESCUE`

### `POST /requests`
- **Body:**
  ```json
  {
    "incidentId": 1001,
    "locationId": 1001,
    "requestType": "RESCUE",
    "priority": "CRITICAL",
    "peopleAffected": 25,
    "description": "Senior citizens stranded in ground floor apartment."
  }
  ```
- **Invokes Oracle Procedure:** `CREATE_REQUEST`

### `POST /missions`
- **Body:**
  ```json
  {
    "requestId": 1001,
    "responderId": 1001,
    "vehicleId": 1003,
    "priority": "CRITICAL",
    "expectedEndTime": "2026-10-07T18:00:00"
  }
  ```
- **Invokes Oracle Procedure:** `CREATE_MISSION` (Enforces conflict checks for responder and vehicle)

### `POST /missions/:id/allocate`
- **Body:**
  ```json
  {
    "resourceId": 1001,
    "quantity": 2
  }
  ```
- **Invokes Oracle Procedure:** `ALLOCATE_RESOURCE` (Row-lock `FOR UPDATE`, deducts quantity, updates request item and audit logs)

### `GET /inventory`
- **Returns:** Warehouse inventory status from Oracle View `V_INVENTORY_STATUS`.

### `GET /map/markers`
- **Returns:** Active geo-spatial entities (incidents, requests, shelters, warehouses, responders, vehicles) for Leaflet rendering.

### `GET /reports/:reportId`
- **Executes:** One of the 10 SQL analytical reports (1 through 10) on demand.

### `GET /audit-logs`
- **Returns:** Immutable audit history from `INCIDENT_LOGS`.

---

## 3. Field Responder Endpoints (`FIELD_RESPONDER`)

### `GET /responder/missions`
- **Returns:** Active and historical missions assigned to the logged-in responder.

### `PUT /responder/missions/:id/status`
- **Body:**
  ```json
  {
    "status": "ARRIVED",
    "notes": "Team reached site, commencing inflatable raft deployment."
  }
  ```
- **Invokes Oracle Procedure:** `UPDATE_MISSION_STATUS` (Validates state transition)

### `POST /responder/missions/:id/report`
- **Body:**
  ```json
  {
    "reportType": "ROAD_BLOCKED",
    "description": "Submerged vehicles blocking Hebbal underpass.",
    "locationId": 1001,
    "severity": "CRITICAL"
  }
  ```
- **Inserts into:** `FIELD_REPORTS`

### `POST /responder/missions/:id/complete`
- **Invokes Oracle Procedure:** `COMPLETE_MISSION` (Frees responder, vehicle, updates request to RESOLVED)

---

## 4. Resource Provider Endpoints (`RESOURCE_PROVIDER`)

### `GET /provider/resources`
- **Returns:** Resources registered by the logged-in provider.

### `POST /provider/resources`
- **Body:**
  ```json
  {
    "resourceTypeId": 1002,
    "resourceName": "Rigid Hull Raft 400",
    "quantity": 5,
    "condition": "NEW",
    "currentLocationId": 1001
  }
  ```

### `PUT /provider/resources/:id`
- **Body:** `{"quantity": 10, "condition": "GOOD", "availabilityStatus": "AVAILABLE"}`

### `GET /provider/allocations`
- **Returns:** Mission allocations utilizing the provider's assets.

### `POST /provider/handovers`
- **Body:**
  ```json
  {
    "resourceId": 1001,
    "toUserId": 1004,
    "quantity": 2,
    "handoverLocationId": 1001,
    "conditionBefore": "EXCELLENT",
    "conditionAfter": "EXCELLENT",
    "notes": "Handover to Swiftwater lead"
  }
  ```
- **Inserts into:** `RESOURCE_HANDOVERS`
