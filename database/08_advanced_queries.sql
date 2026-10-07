-- ====================================================================
-- URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM (UDR-ORP)
-- FILE 08: ADVANCED SQL QUERIES (COMPREHENSIVE DBMS DEMONSTRATION)
-- Target: Oracle Database
-- Categories: SELECT, JOINS, GROUP BY, HAVING, SUBQUERIES, CORRELATED,
--             EXISTS, CASE, WINDOW FUNCTIONS, ANALYTICAL REPORTS
-- ====================================================================

-- ====================================================================
-- CATEGORY 1: BASIC SELECT QUERIES (10 QUERIES)
-- ====================================================================

-- 1.1 List all active critical or high severity disaster incidents
SELECT IncidentID, IncidentName, IncidentType, Severity, Status, StartTime
FROM INCIDENTS
WHERE Status = 'ACTIVE' AND Severity IN ('CRITICAL', 'HIGH')
ORDER BY StartTime DESC;

-- 1.2 Find open shelters with medical facility and water available
SELECT ShelterID, ShelterName, Capacity, CurrentOccupancy, (Capacity - CurrentOccupancy) AS RemainingBeds
FROM SHELTERS
WHERE Status = 'OPEN' AND MedicalFacility = 'Y' AND WaterAvailable = 'Y';

-- 1.3 Retrieve all pending emergency requests with affected population > 10
SELECT RequestID, RequestType, Priority, PeopleAffected, Description, CreatedAt
FROM REQUESTS
WHERE Status = 'PENDING' AND PeopleAffected > 10
ORDER BY PeopleAffected DESC;

-- 1.4 List all available ambulances and rescue trucks with high fuel level (> 75%)
SELECT VehicleID, VehicleType, RegistrationNumber, Capacity, FuelLevel
FROM VEHICLES
WHERE Status = 'AVAILABLE' AND FuelLevel > 75.0
ORDER BY FuelLevel DESC;

-- 1.5 Retrieve responders currently marked AVAILABLE with LEAD or EXPERT experience
SELECT ResponderID, TeamName, Specialization, ExperienceLevel, CurrentStatus
FROM RESPONDERS
WHERE CurrentStatus = 'AVAILABLE' AND ExperienceLevel IN ('LEAD', 'EXPERT');

-- 1.6 Show all inventory stock items below their designated reorder level
SELECT InventoryID, WarehouseID, ResourceTypeID, QuantityAvailable, ReorderLevel
FROM INVENTORY
WHERE QuantityAvailable <= ReorderLevel;

-- 1.7 List all distinct incident types recorded in the system
SELECT DISTINCT IncidentType
FROM INCIDENTS
ORDER BY IncidentType;

-- 1.8 Retrieve all field reports concerning blocked roads or safety risks
SELECT ReportID, MissionID, ReportType, Severity, CreatedAt, Description
FROM FIELD_REPORTS
WHERE ReportType IN ('ROAD_BLOCKED', 'SAFETY_RISK')
ORDER BY CreatedAt DESC;

-- 1.9 Find users registered with active command center or provider privileges
SELECT UserID, FullName, Email, Phone, RoleID, AccountStatus
FROM USERS
WHERE RoleID IN (1, 3) AND AccountStatus = 'ACTIVE';

-- 1.10 Show recent audit logs from the last 24 hours
SELECT LogID, IncidentID, ActionType, Description, Timestamp
FROM INCIDENT_LOGS
WHERE Timestamp >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
ORDER BY Timestamp DESC;

-- ====================================================================
-- CATEGORY 2: JOIN QUERIES (10 QUERIES)
-- ====================================================================

-- 2.1 Display incidents along with their primary location details (INNER JOIN)
SELECT i.IncidentID, i.IncidentName, i.IncidentType, l.LocationName, l.Address, l.City, l.RiskZone
FROM INCIDENTS i
JOIN LOCATIONS l ON i.LocationID = l.LocationID;

-- 2.2 List emergency requests with incident name and requester's contact details (MULTI-TABLE INNER JOIN)
SELECT r.RequestID, r.RequestType, r.Priority, i.IncidentName, u.FullName AS RequesterName, u.Phone AS ContactNumber
FROM REQUESTS r
JOIN INCIDENTS i ON r.IncidentID = i.IncidentID
JOIN USERS u ON r.RequestedBy = u.UserID;

-- 2.3 Comprehensive mission roster: Mission, Responder, Vehicle, and Incident (4-TABLE JOIN)
SELECT m.MissionID, m.Status AS MissionStatus, r.TeamName, v.VehicleType, v.RegistrationNumber, i.IncidentName
FROM MISSIONS m
JOIN RESPONDERS r ON m.ResponderID = r.ResponderID
LEFT JOIN VEHICLES v ON m.VehicleID = v.VehicleID
JOIN REQUESTS req ON m.RequestID = req.RequestID
JOIN INCIDENTS i ON req.IncidentID = i.IncidentID;

-- 2.4 List all locations and show if any shelter is situated there (LEFT OUTER JOIN)
SELECT l.LocationID, l.LocationName, l.City, s.ShelterName, s.Status AS ShelterStatus, s.Capacity
FROM LOCATIONS l
LEFT JOIN SHELTERS s ON l.LocationID = s.LocationID;

-- 2.5 Show all registered resource types and their warehouse stock count (RIGHT OUTER JOIN)
SELECT rt.ResourceTypeID, rt.ResourceName, rt.Category, inv.WarehouseID, inv.QuantityAvailable
FROM INVENTORY inv
RIGHT JOIN RESOURCE_TYPES rt ON inv.ResourceTypeID = rt.ResourceTypeID;

-- 2.6 Full outer join between Shelters and Warehouses to compare facility footprint by location
SELECT COALESCE(s.LocationID, w.LocationID) AS LocationID, s.ShelterName, w.WarehouseName
FROM SHELTERS s
FULL OUTER JOIN WAREHOUSES w ON s.LocationID = w.LocationID;

-- 2.7 Self-join: Find pairs of responders that share the exact same specialization
SELECT r1.TeamName AS Team_A, r2.TeamName AS Team_B, r1.Specialization
FROM RESPONDERS r1
JOIN RESPONDERS r2 ON r1.Specialization = r2.Specialization AND r1.ResponderID < r2.ResponderID;

-- 2.8 Detail mission resource allocations with resource brand and provider organization
SELECT mr.MissionID, res.ResourceName, rt.Category, u.FullName AS ProviderName, mr.QuantityAllocated
FROM MISSION_RESOURCES mr
JOIN RESOURCES res ON mr.ResourceID = res.ResourceID
JOIN RESOURCE_TYPES rt ON res.ResourceTypeID = rt.ResourceTypeID
JOIN USERS u ON res.ProviderID = u.UserID;

-- 2.9 Display responder skills along with certification levels
SELECT r.TeamName, s.SkillName, rs.CertificationLevel, rs.CertificationExpiry
FROM RESPONDERS r
JOIN RESPONDER_SKILLS rs ON r.ResponderID = rs.ResponderID
JOIN SKILLS s ON rs.SkillID = s.SkillID;

-- 2.10 Correlate field reports with their parent mission and assigned vehicle
SELECT fr.ReportID, fr.ReportType, fr.Severity, m.MissionID, resp.TeamName, v.VehicleType
FROM FIELD_REPORTS fr
JOIN MISSIONS m ON fr.MissionID = m.MissionID
JOIN RESPONDERS resp ON fr.ResponderID = resp.ResponderID
LEFT JOIN VEHICLES v ON m.VehicleID = v.VehicleID;

-- ====================================================================
-- CATEGORY 3: GROUP BY QUERIES (5 QUERIES)
-- ====================================================================

-- 3.1 Total population affected grouped by disaster severity
SELECT Severity, SUM(PopulationAffected) AS TotalAffected, COUNT(*) AS TotalZones
FROM INCIDENT_ZONES
GROUP BY Severity;

-- 3.2 Total number of emergency requests grouped by request category
SELECT RequestType, COUNT(*) AS RequestCount, SUM(PeopleAffected) AS TotalPeopleCount
FROM REQUESTS
GROUP BY RequestType;

-- 3.3 Available inventory quantity grouped by warehouse facility
SELECT w.WarehouseName, COUNT(inv.InventoryID) AS StockItemCount, SUM(inv.QuantityAvailable) AS TotalUnitsStocked
FROM WAREHOUSES w
JOIN INVENTORY inv ON w.WarehouseID = inv.WarehouseID
GROUP BY w.WarehouseName;

-- 3.4 Mission distribution grouped by current operational status
SELECT Status, COUNT(*) AS MissionCount
FROM MISSIONS
GROUP BY Status;

-- 3.5 Total resources registered per provider organization
SELECT u.FullName AS ProviderName, COUNT(r.ResourceID) AS ResourceTypesSupplied, SUM(r.Quantity) AS TotalUnitsRegistered
FROM USERS u
JOIN RESOURCES r ON u.UserID = r.ProviderID
GROUP BY u.FullName;

-- ====================================================================
-- CATEGORY 4: HAVING QUERIES (5 QUERIES)
-- ====================================================================

-- 4.1 Incidents with more than 3 affected zones
SELECT IncidentID, COUNT(LocationID) AS ZoneCount
FROM INCIDENT_ZONES
GROUP BY IncidentID
HAVING COUNT(LocationID) >= 3;

-- 4.2 Resource categories where total available quantity is greater than 100 units
SELECT rt.Category, SUM(r.Quantity) AS TotalQty
FROM RESOURCE_TYPES rt
JOIN RESOURCES r ON rt.ResourceTypeID = r.ResourceTypeID
WHERE r.AvailabilityStatus = 'AVAILABLE'
GROUP BY rt.Category
HAVING SUM(r.Quantity) > 100;

-- 4.3 Shelters operating at higher than 70% occupancy
SELECT ShelterID, ShelterName, Capacity, CurrentOccupancy, ROUND((CurrentOccupancy / Capacity) * 100, 2) AS OccupancyRate
FROM SHELTERS
WHERE Capacity > 0
GROUP BY ShelterID, ShelterName, Capacity, CurrentOccupancy
HAVING (CurrentOccupancy / Capacity) > 0.70;

-- 4.4 Responders who have been assigned to 2 or more missions
SELECT ResponderID, COUNT(MissionID) AS TotalMissionsAssigned
FROM MISSIONS
GROUP BY ResponderID
HAVING COUNT(MissionID) >= 2;

-- 4.5 Locations with aggregate affected population exceeding 5,000 citizens
SELECT LocationID, SUM(PopulationAffected) AS AggregatedAffectedPopulation
FROM INCIDENT_ZONES
GROUP BY LocationID
HAVING SUM(PopulationAffected) > 5000;

-- ====================================================================
-- CATEGORY 5: SUBQUERIES (5 QUERIES)
-- ====================================================================

-- 5.1 Find requests whose affected people count exceeds the average across all requests
SELECT RequestID, RequestType, Priority, PeopleAffected
FROM REQUESTS
WHERE PeopleAffected > (SELECT AVG(PeopleAffected) FROM REQUESTS);

-- 5.2 Find vehicles belonging to the provider who owns the largest quantity of resources
SELECT VehicleID, VehicleType, RegistrationNumber, ProviderID
FROM VEHICLES
WHERE ProviderID = (
    SELECT ProviderID
    FROM RESOURCES
    GROUP BY ProviderID
    ORDER BY SUM(Quantity) DESC
    FETCH FIRST 1 ROW ONLY
);

-- 5.3 Retrieve incidents that have pending emergency requests
SELECT IncidentID, IncidentName, Severity
FROM INCIDENTS
WHERE IncidentID IN (
    SELECT DISTINCT IncidentID
    FROM REQUESTS
    WHERE Status = 'PENDING'
);

-- 5.4 Find resources with availability quantity below the category average
SELECT ResourceID, ResourceName, Quantity, ResourceTypeID
FROM RESOURCES
WHERE Quantity < (
    SELECT AVG(Quantity)
    FROM RESOURCES r2
    WHERE r2.ResourceTypeID = RESOURCES.ResourceTypeID
);

-- 5.5 Find shelters located in locations designated as 'CRITICAL' risk zones
SELECT ShelterID, ShelterName, LocationID
FROM SHELTERS
WHERE LocationID IN (
    SELECT LocationID
    FROM LOCATIONS
    WHERE RiskZone = 'CRITICAL'
);

-- ====================================================================
-- CATEGORY 6: CORRELATED SUBQUERIES (3 QUERIES)
-- ====================================================================

-- 6.1 Find each incident's highest priority request
SELECT r.IncidentID, r.RequestID, r.RequestType, r.Priority, r.PeopleAffected
FROM REQUESTS r
WHERE r.PeopleAffected = (
    SELECT MAX(r2.PeopleAffected)
    FROM REQUESTS r2
    WHERE r2.IncidentID = r.IncidentID
);

-- 6.2 Identify warehouses whose available stock is strictly lower than warehouse-wide average
SELECT inv.WarehouseID, inv.ResourceTypeID, inv.QuantityAvailable
FROM INVENTORY inv
WHERE inv.QuantityAvailable < (
    SELECT AVG(inv2.QuantityAvailable)
    FROM INVENTORY inv2
    WHERE inv2.WarehouseID = inv.WarehouseID
);

-- 6.3 Find responders who have handled more missions than the team average in their specialization
SELECT resp.ResponderID, resp.TeamName, resp.Specialization,
       (SELECT COUNT(*) FROM MISSIONS m WHERE m.ResponderID = resp.ResponderID) AS MissionCount
FROM RESPONDERS resp
WHERE (SELECT COUNT(*) FROM MISSIONS m WHERE m.ResponderID = resp.ResponderID) > (
    SELECT AVG(sub.m_count)
    FROM (
        SELECT r2.Specialization, COUNT(m2.MissionID) AS m_count
        FROM RESPONDERS r2
        LEFT JOIN MISSIONS m2 ON r2.ResponderID = m2.ResponderID
        GROUP BY r2.ResponderID, r2.Specialization
    ) sub
    WHERE sub.Specialization = resp.Specialization
);

-- ====================================================================
-- CATEGORY 7: EXISTS / NOT EXISTS QUERIES (3 QUERIES)
-- ====================================================================

-- 7.1 Find critical requests that do NOT have any mission created yet (NOT EXISTS)
SELECT r.RequestID, r.RequestType, r.Priority, r.Description, r.CreatedAt
FROM REQUESTS r
WHERE r.Priority = 'CRITICAL'
  AND NOT EXISTS (
      SELECT 1 FROM MISSIONS m WHERE m.RequestID = r.RequestID
  );

-- 7.2 Find active incidents that have at least one critical road blocked field report (EXISTS)
SELECT i.IncidentID, i.IncidentName, i.Severity
FROM INCIDENTS i
WHERE EXISTS (
    SELECT 1 
    FROM REQUESTS r
    JOIN MISSIONS m ON r.RequestID = m.RequestID
    JOIN FIELD_REPORTS fr ON m.MissionID = fr.MissionID
    WHERE r.IncidentID = i.IncidentID AND fr.ReportType = 'ROAD_BLOCKED'
);

-- 7.3 Find responders who do not possess any water rescue or diving skills (NOT EXISTS)
SELECT r.ResponderID, r.TeamName, r.Specialization
FROM RESPONDERS r
WHERE NOT EXISTS (
    SELECT 1 
    FROM RESPONDER_SKILLS rs
    JOIN SKILLS s ON rs.SkillID = s.SkillID
    WHERE rs.ResponderID = r.ResponderID AND s.SkillName IN ('WATER_RESCUE', 'DIVING_SALVAGE')
);

-- ====================================================================
-- CATEGORY 8: CASE EXPRESSIONS (3 QUERIES)
-- ====================================================================

-- 8.1 Categorize emergency response triage tier based on people affected and priority
SELECT RequestID, RequestType, Priority, PeopleAffected,
    CASE 
        WHEN Priority = 'CRITICAL' AND PeopleAffected >= 50 THEN 'TIER_1_IMMEDIATE_AIR_EVAC'
        WHEN Priority = 'CRITICAL' OR PeopleAffected >= 20  THEN 'TIER_2_URGENT_TACTICAL_TEAM'
        WHEN Priority = 'HIGH'                             THEN 'TIER_3_PRIORITY_DISPATCH'
        ELSE 'TIER_4_ROUTINE_QUEUE'
    END AS DispatchPriorityTier
FROM REQUESTS;

-- 8.2 Evaluate warehouse stock health index
SELECT inv.WarehouseID, rt.ResourceName, inv.QuantityAvailable, inv.ReorderLevel,
    CASE 
        WHEN inv.QuantityAvailable = 0 THEN 'OUT_OF_STOCK_EMERGENCY'
        WHEN inv.QuantityAvailable < inv.ReorderLevel THEN 'CRITICAL_SHORTAGE'
        WHEN inv.QuantityAvailable <= (inv.ReorderLevel * 1.5) THEN 'ADEQUATE'
        ELSE 'SURPLUS_RESERVE'
    END AS StockHealthStatus
FROM INVENTORY inv
JOIN RESOURCE_TYPES rt ON inv.ResourceTypeID = rt.ResourceTypeID;

-- 8.3 Calculate vehicle readiness score based on fuel and current operational status
SELECT VehicleID, VehicleType, RegistrationNumber, Status, FuelLevel,
    CASE 
        WHEN Status = 'AVAILABLE' AND FuelLevel >= 80.0 THEN 'MISSION_READY_A1'
        WHEN Status = 'AVAILABLE' AND FuelLevel >= 50.0 THEN 'NEEDS_REFUELING'
        WHEN Status = 'IN_USE' THEN 'ACTIVE_DEPLOYMENT'
        ELSE 'NOT_DISPATCHABLE'
    END AS VehicleReadiness
FROM VEHICLES;

-- ====================================================================
-- CATEGORY 9: WINDOW FUNCTIONS (3 QUERIES)
-- ====================================================================

-- 9.1 Rank emergency requests within each incident by affected population (ROW_NUMBER & DENSE_RANK)
SELECT 
    r.IncidentID,
    r.RequestID,
    r.RequestType,
    r.PeopleAffected,
    ROW_NUMBER() OVER (PARTITION BY r.IncidentID ORDER BY r.PeopleAffected DESC) AS RankWithinIncident,
    DENSE_RANK() OVER (ORDER BY r.PeopleAffected DESC) AS OverallRank
FROM REQUESTS r;

-- 9.2 Running cumulative total of people affected per incident chronologically (SUM OVER PARTITION)
SELECT 
    IncidentID,
    RequestID,
    CreatedAt,
    PeopleAffected,
    SUM(PeopleAffected) OVER (
        PARTITION BY IncidentID 
        ORDER BY CreatedAt 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS CumulativePeopleAffected
FROM REQUESTS;

-- 9.3 Calculate percentage of total allocated resources contributed by each individual mission (RATIO_TO_REPORT)
SELECT 
    mr.MissionID,
    mr.ResourceID,
    mr.QuantityAllocated,
    ROUND(RATIO_TO_REPORT(mr.QuantityAllocated) OVER (PARTITION BY mr.ResourceID) * 100, 2) AS PctOfResourceAllocated
FROM MISSION_RESOURCES mr;

-- ====================================================================
-- CATEGORY 10: COMPLEX REPORTING QUERIES (5 QUERIES)
-- ====================================================================

-- 10.1 Multi-Dimensional Incident Resource Consumption Report
SELECT 
    i.IncidentID,
    i.IncidentName,
    i.Severity,
    COUNT(DISTINCT r.RequestID) AS TotalRequests,
    COUNT(DISTINCT m.MissionID) AS TotalMissions,
    NVL(SUM(mr.QuantityAllocated), 0) AS TotalResourceUnitsAllocated,
    NVL(SUM(mr.QuantityUsed), 0) AS TotalResourceUnitsConsumed
FROM INCIDENTS i
LEFT JOIN REQUESTS r ON i.IncidentID = r.IncidentID
LEFT JOIN MISSIONS m ON r.RequestID = m.RequestID
LEFT JOIN MISSION_RESOURCES mr ON m.MissionID = mr.MissionID
GROUP BY i.IncidentID, i.IncidentName, i.Severity
ORDER BY TotalResourceUnitsConsumed DESC;

-- 10.2 Provider Allocation Fulfillment Performance Scorecard
SELECT 
    u.UserID AS ProviderID,
    u.FullName AS ProviderName,
    COUNT(DISTINCT r.ResourceID) AS TotalInventoryCatalog,
    NVL(SUM(mr.QuantityAllocated), 0) AS UnitsDispatchedToMissions,
    NVL(SUM(mr.QuantityUsed), 0) AS UnitsUtilizedInField
FROM USERS u
JOIN RESOURCES r ON u.UserID = r.ProviderID
LEFT JOIN MISSION_RESOURCES mr ON r.ResourceID = mr.ResourceID
WHERE u.RoleID = 3
GROUP BY u.UserID, u.FullName
ORDER BY UnitsDispatchedToMissions DESC;

-- 10.3 Response Time & Triage Latency by Incident Severity
SELECT 
    i.Severity,
    COUNT(m.MissionID) AS CompletedMissions,
    ROUND(AVG(CALCULATE_RESPONSE_TIME(m.MissionID)), 2) AS AvgResponseTimeMinutes,
    MIN(CALCULATE_RESPONSE_TIME(m.MissionID)) AS FastestResponseMinutes,
    MAX(CALCULATE_RESPONSE_TIME(m.MissionID)) AS SlowestResponseMinutes
FROM INCIDENTS i
JOIN REQUESTS r ON i.IncidentID = r.IncidentID
JOIN MISSIONS m ON r.RequestID = m.RequestID
GROUP BY i.Severity
ORDER BY AvgResponseTimeMinutes ASC;

-- 10.4 Warehouse Inventory Deficit Alert with Calculated Reorder Quantity
SELECT 
    w.WarehouseName,
    rt.ResourceName,
    rt.Category,
    inv.QuantityAvailable,
    inv.ReorderLevel,
    (inv.ReorderLevel * 2 - inv.QuantityAvailable) AS RecommendedReorderQty,
    GET_INVENTORY_STATUS(inv.WarehouseID, inv.ResourceTypeID) AS HealthBadge
FROM INVENTORY inv
JOIN WAREHOUSES w ON inv.WarehouseID = w.WarehouseID
JOIN RESOURCE_TYPES rt ON inv.ResourceTypeID = rt.ResourceTypeID
WHERE inv.QuantityAvailable <= inv.ReorderLevel
ORDER BY inv.QuantityAvailable ASC;

-- 10.5 Responder Tactical Utilization and Mission Success Metric
SELECT 
    resp.ResponderID,
    resp.TeamName,
    resp.Specialization,
    resp.ExperienceLevel,
    COUNT(m.MissionID) AS TotalMissions,
    SUM(CASE WHEN m.Status = 'COMPLETED' THEN 1 ELSE 0 END) AS CompletedMissions,
    SUM(CASE WHEN m.Status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS ActiveMissions,
    COUNT(fr.ReportID) AS FieldReportsFiled
FROM RESPONDERS resp
LEFT JOIN MISSIONS m ON resp.ResponderID = m.ResponderID
LEFT JOIN FIELD_REPORTS fr ON resp.ResponderID = fr.ResponderID
GROUP BY resp.ResponderID, resp.TeamName, resp.Specialization, resp.ExperienceLevel
ORDER BY TotalMissions DESC;
