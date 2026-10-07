-- ====================================================================
-- URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM (UDR-ORP)
-- FILE 03: DATABASE VIEWS
-- Target: Oracle Database
-- ====================================================================

-- 1. V_ACTIVE_INCIDENTS
-- Shows active incidents with locations, request counts, and active missions
CREATE OR REPLACE VIEW V_ACTIVE_INCIDENTS AS
SELECT 
    i.IncidentID,
    i.IncidentName,
    i.IncidentType,
    i.Severity,
    i.Status AS IncidentStatus,
    l.LocationName,
    l.City,
    l.Latitude,
    l.Longitude,
    i.StartTime,
    COUNT(DISTINCT r.RequestID) AS TotalRequests,
    NVL(SUM(CASE WHEN r.Status = 'PENDING' THEN 1 ELSE 0 END), 0) AS PendingRequests,
    COUNT(DISTINCT m.MissionID) AS TotalMissions,
    NVL(SUM(CASE WHEN m.Status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS') THEN 1 ELSE 0 END), 0) AS ActiveMissions
FROM INCIDENTS i
JOIN LOCATIONS l ON i.LocationID = l.LocationID
LEFT JOIN REQUESTS r ON i.IncidentID = r.IncidentID
LEFT JOIN MISSIONS m ON r.RequestID = m.RequestID
WHERE i.Status IN ('ACTIVE', 'ON_HOLD')
GROUP BY 
    i.IncidentID, i.IncidentName, i.IncidentType, i.Severity, 
    i.Status, l.LocationName, l.City, l.Latitude, l.Longitude, i.StartTime;

-- 2. V_RESOURCE_AVAILABILITY
-- Aggregates resource capacity across categories and current deployment states
CREATE OR REPLACE VIEW V_RESOURCE_AVAILABILITY AS
SELECT 
    rt.ResourceTypeID,
    rt.ResourceName,
    rt.Category,
    rt.Unit,
    COUNT(r.ResourceID) AS TotalUnitsRegistered,
    NVL(SUM(r.Quantity), 0) AS TotalQuantity,
    NVL(SUM(CASE WHEN r.AvailabilityStatus = 'AVAILABLE' THEN r.Quantity ELSE 0 END), 0) AS AvailableQuantity,
    NVL(SUM(CASE WHEN r.AvailabilityStatus = 'ALLOCATED' THEN r.Quantity ELSE 0 END), 0) AS AllocatedQuantity,
    NVL(SUM(CASE WHEN r.AvailabilityStatus = 'IN_USE' THEN r.Quantity ELSE 0 END), 0) AS InUseQuantity,
    NVL(SUM(CASE WHEN r.AvailabilityStatus IN ('DAMAGED', 'UNDER_REPAIR', 'UNAVAILABLE') THEN r.Quantity ELSE 0 END), 0) AS UnavailableQuantity
FROM RESOURCE_TYPES rt
LEFT JOIN RESOURCES r ON rt.ResourceTypeID = r.ResourceTypeID
GROUP BY rt.ResourceTypeID, rt.ResourceName, rt.Category, rt.Unit;

-- 3. V_MISSION_DETAILS
-- Comprehensive view joining mission lifecycle, responder, vehicle, and incident context
CREATE OR REPLACE VIEW V_MISSION_DETAILS AS
SELECT 
    m.MissionID,
    m.Status AS MissionStatus,
    m.Priority AS MissionPriority,
    m.StartTime,
    m.ExpectedEndTime,
    m.ActualEndTime,
    r.RequestID,
    r.RequestType,
    r.Priority AS RequestPriority,
    r.Description AS RequestDescription,
    i.IncidentID,
    i.IncidentName,
    i.Severity AS IncidentSeverity,
    req_loc.LocationName AS TargetLocation,
    req_loc.Address AS TargetAddress,
    req_loc.Latitude AS TargetLatitude,
    req_loc.Longitude AS TargetLongitude,
    resp.ResponderID,
    resp.TeamName,
    resp.Specialization,
    resp_user.FullName AS ResponderLeadName,
    resp_user.Phone AS ResponderPhone,
    v.VehicleID,
    v.VehicleType,
    v.RegistrationNumber AS VehicleRegistration,
    assigner.FullName AS AssignedByUserName
FROM MISSIONS m
JOIN REQUESTS r ON m.RequestID = r.RequestID
JOIN INCIDENTS i ON r.IncidentID = i.IncidentID
JOIN LOCATIONS req_loc ON r.LocationID = req_loc.LocationID
JOIN RESPONDERS resp ON m.ResponderID = resp.ResponderID
JOIN USERS resp_user ON resp.UserID = resp_user.UserID
LEFT JOIN VEHICLES v ON m.VehicleID = v.VehicleID
JOIN USERS assigner ON m.AssignedBy = assigner.UserID;

-- 4. V_INVENTORY_STATUS
-- Real-time stock status with calculated StockLevel indicators (NORMAL, LOW, CRITICAL)
CREATE OR REPLACE VIEW V_INVENTORY_STATUS AS
SELECT 
    inv.InventoryID,
    w.WarehouseID,
    w.WarehouseName,
    loc.LocationName AS WarehouseLocation,
    rt.ResourceTypeID,
    rt.ResourceName,
    rt.Category,
    rt.Unit,
    inv.QuantityAvailable,
    inv.ReorderLevel,
    CASE 
        WHEN inv.QuantityAvailable = 0 THEN 'CRITICAL'
        WHEN inv.QuantityAvailable <= inv.ReorderLevel THEN 'LOW'
        ELSE 'NORMAL'
    END AS StockStatus,
    inv.LastUpdated
FROM INVENTORY inv
JOIN WAREHOUSES w ON inv.WarehouseID = w.WarehouseID
JOIN LOCATIONS loc ON w.LocationID = loc.LocationID
JOIN RESOURCE_TYPES rt ON inv.ResourceTypeID = rt.ResourceTypeID;

-- 5. V_PENDING_REQUESTS
-- View for immediate Command Center emergency triage
CREATE OR REPLACE VIEW V_PENDING_REQUESTS AS
SELECT 
    r.RequestID,
    r.RequestType,
    r.Priority,
    r.PeopleAffected,
    r.Description,
    r.CreatedAt,
    i.IncidentID,
    i.IncidentName,
    l.LocationName,
    l.Address,
    l.Latitude,
    l.Longitude,
    u.FullName AS RequestedByName,
    u.Phone AS RequestedByPhone
FROM REQUESTS r
JOIN INCIDENTS i ON r.IncidentID = i.IncidentID
JOIN LOCATIONS l ON r.LocationID = l.LocationID
JOIN USERS u ON r.RequestedBy = u.UserID
WHERE r.Status = 'PENDING';

COMMIT;
