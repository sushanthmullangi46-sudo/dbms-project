# END-USER OPERATIONAL & DEMONSTRATION MANUAL
## Urban Disaster Response & Relief Coordination Platform (UDRRMS / UDR-ORP)

---

## 1. Quick Access & Pre-Configured Test Credentials

For evaluation and viva demonstration, pre-configured accounts are provided with pre-populated credentials. You can either type the credentials or click the **1-Click Quick Demo Login** buttons at the bottom of the login screen.

| Role Persona | Email Address | Password | Operational Landing Page |
| :--- | :--- | :--- | :--- |
| **Citizen (Public)** | `citizen@udrrms.com` | `password123` | `/#/citizen/dashboard` |
| **Administrator (Chief Officer)** | `officer@udrrms.com` | `password123` | `/#/officer/dashboard` |
| **Rescue Team Lead (Alpha Squad)**| `rescue@udrrms.com` | `password123` | `/#/responder/missions` |
| **Logistics Coordinator (Depots)** | `coordinator@udrrms.com` | `password123` | `/#/coordinator/inventory` |

---

## 2. Role 1: Citizen Operational Walkthrough

### 2.1 Submitting an Emergency Disaster Report
1. Sign in as **Citizen** (`citizen@udrrms.com`).
2. Navigate to **Report Emergency** (`/#/citizen/report`).
3. Fill out the report form:
   - **Hazard Category**: Select from dropdown (e.g., `Flood`, `Structural Collapse`, `Fire`).
   - **Incident Location**: Select an urban sector (e.g., `Hebbal Flyover Junction`).
   - **Emergency Description**: Enter situational details (e.g., "5 feet water trapped 20 motorists under flyover").
   - **Casualty & Victim Numbers**: Specify affected individuals, trapped persons, and injuries.
   - **Critical Flags**: Check `Urgent Medical Required` and `Evacuation Required`.
4. Click **Submit Emergency Report**.
5. **Outcome**: The system assigns an alphanumeric tracking reference code (e.g., `RPT-20261110-11AC9E`) and sets the initial state to `SUBMITTED`.

### 2.2 Tracking Report Status & Adding Updates
1. Navigate to **My Reports** (`/#/citizen/reports`).
2. Review the live timeline showing progression from `SUBMITTED` &rarr; `VERIFIED` &rarr; `ACTIVE` &rarr; `CLOSED`.
3. To add new observations, click **Add Update**, enter notes (e.g., "Water receding slowly, 3 seniors evacuated safely"), and submit.
4. Click **Request Relief Assistance** to request food rations, potable water, or medical support directly for your incident.

---

## 3. Role 2: Administrator Command Center Walkthrough

### 3.1 Reviewing the Verification Queue
1. Sign in as **Officer / Administrator** (`officer@udrrms.com`).
2. Click **Verification Queue** in the sidebar.
3. Incoming unverified reports from citizens appear in real time.
4. Click on a report to inspect:
   - Reported coordinates and casualty telemetry.
   - Urgent medical or evacuation needs.
5. Take action:
   - **Verify Report**: Formally confirms the alert, promoting it into an official incident (`INC-XXXX`) with an assigned severity rating (`P1 - Critical` to `P4 - Low`).
   - **Reject Report**: Requires entering an audit reason (e.g., "Duplicate alert for resolved issue") and updates the status to `REJECTED`.

### 3.2 Incident Command & Tactical Team Mobilization
1. Open **Active Incidents** (`/#/officer/incidents`).
2. Click **Deploy Mission** on an active incident.
3. In the tactical assignment modal, select an available rescue unit (e.g., `NDRF 10th Bn Alpha Squad`) and click **Confirm Mission Deployment**.
4. **Outcome**: The team's status updates to `ASSIGNED`, and the mission appears in the rescue team's queue.

### 3.3 Interactive Leaflet GIS Disaster Map
1. Click **Disaster Map** in the sidebar.
2. The interactive map renders:
   - **Pulsing Disaster Markers**: Color-coded by severity (Crimson P1, Amber P2, Cobalt P3).
   - **Relief Shelters**: Displays current occupancy percentage and capacity.
   - **Reserve Depots**: Displays warehouse pallet capacity and manager contact info.
   - **Tactical Field Squads**: Displays current deployment status.
3. Click any marker to open its operational popup card.

---

## 4. Role 3: Rescue & Relief Team Walkthrough

### 4.1 Viewing Assigned Tactical Missions
1. Sign in as **Rescue Team** (`rescue@udrrms.com`).
2. You are automatically directed to the **Tactical Missions Terminal** (`/#/responder/missions`).
3. Locate your assigned mission with priority badge, target coordinates, and incident description.

### 4.2 Updating Mission Lifecycle & Requesting Supplies
1. Update operational progress sequentially:
   - Click **Acknowledge & En Route**: Updates status to `EN_ROUTE`.
   - Click **Arrived on Scene**: Updates status to `ON_SCENE`.
2. If specialized gear is required, click **Request Incident Supplies**:
   - Select resource item (e.g., `Inflatable Rescue Boat`, `High-Pressure Medical Oxygen`).
   - Enter quantity and urgency notes.
   - Click **Submit Supply Request**.
3. Upon completing rescue operations, enter debrief summary and click **Complete Mission**.

---

## 5. Role 4: Supplies & Logistics Coordinator Walkthrough

### 5.1 Warehouse Inventory Management
1. Sign in as **Logistics Coordinator** (`coordinator@udrrms.com`).
2. Open **Warehouse Inventory** (`/#/coordinator/inventory`).
3. Inspect multi-depot stock levels across `Hebbal Central Depot`, `Manyata Vault`, and `Yelahanka North Warehouse`.
4. Review available stock, reserved stock, and reorder threshold alerts (`LOW STOCK` vs. `OPTIMAL`).
5. To record new supply intake, click **Replenish Depot Stocks**, select target warehouse, commodity, quantity, and click **Confirm Stock Intake**.

### 5.2 Approving Supply Requests & Atomic Stock Reservation
1. Open **Resource Requests** (`/#/coordinator/requests`).
2. Incoming supply requirements from incident commanders appear in the queue.
3. Click **Approve & Reserve Stock**:
   - Select the source warehouse depot.
   - Specify approved quantity (coordinator authority permits partial approvals).
   - Click **Confirm Stock Reservation**.
4. **Outcome**: The database executes an atomic transaction: available stock decrements while reserved stock increments, preventing double-allocation.
5. Create a dispatch manifest (`DSP-XXXX`) and assign a transport carrier to dispatch the supplies to the field.

---

## 6. Demonstrating the Complete 13-Stage Interconnected Workflow

To demonstrate the full end-to-end integration to your evaluator:

```
[STEP 1] Citizen files Flood report at Hebbal Junction.
           |
[STEP 2] Check Administrator Verification Queue -> Report appears instantly.
           |
[STEP 3] Administrator verifies report -> Promotes to Incident INC-BLR01 (P1).
           |
[STEP 4] Administrator deploys NDRF Alpha Squad to Incident INC-BLR01.
           |
[STEP 5] Check Rescue Team Terminal -> NDRF team sees mission and moves EN_ROUTE.
           |
[STEP 6] Rescue Team requests 500 Food Kits and 800 Water Cans.
           |
[STEP 7] Check Coordinator Requests Queue -> Coordinator approves and reserves stock.
           |
[STEP 8] Check Warehouse Inventory -> Available stock decreased, reserved increased.
           |
[STEP 9] Dispatch manifest created and delivery confirmed.
           |
[STEP 10] Rescue team evacuates 45 citizens to Sahakarnagar Shelter -> Shelter occupancy increases.
           |
[STEP 11] Administrator validates Incident Closure Checklist -> Incident marked CLOSED.
           |
[STEP 12] Refresh browser or restart backend -> All records persist intact on disk.
```

---

## 7. Troubleshooting & FAQ

- **Q: Why does GitHub Pages look like a demo?**  
  *A: GitHub Pages is a static host. The public demo uses an in-browser storage adapter for standalone review. For full persistent relational database features with Oracle DDL or SQLite, run the local gateway via `npm start` at `http://localhost:5000`.*
- **Q: How do I verify that data is saved permanently?**  
  *A: Submit a report in the citizen portal, then restart the server (`npm start`) or refresh the browser. The report remains in the database and reappears on the administrator dashboard.*
- **Q: How do I view the raw database tables?**  
  *A: Open `http://localhost:5000/docs` to test endpoints, or inspect `database/udrrms.db` directly using any SQLite viewer or the analytical queries in `database/07_analytical_queries.sql`.*
