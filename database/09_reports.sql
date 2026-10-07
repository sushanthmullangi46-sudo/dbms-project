-- ====================================================================
-- URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM (UDR-ORP)
-- FILE 09: SYSTEM REPORTS (SQL BACKED ANALYTICS)
-- Target: Oracle Database
-- ====================================================================

-- --------------------------------------------------------------------
-- REPORT 1: ACTIVE INCIDENTS WITH GEOGRAPHIC & MISSION METRICS
-- --------------------------------------------------------------------
SELECT 
    i.IncidentID,
    i.IncidentName,
    i.IncidentType,
    i.Severity,
    l.LocationName,
    l.City,
    i.StartTime,
    COUNT(DISTINCT r.RequestID) AS TotalRequests,
    COUNT(DISTINCT m.MissionID) AS ActiveMissions,
    CALCULATE_DISASTER_RISK_SCORE(i.IncidentID) AS CompositeRiskScore
FROM INCIDENTS i
JOIN LOCATIONS l ON i.LocationID = l.LocationID
LEFT JOIN REQUESTS r ON i.IncidentID = r.IncidentID
LEFT JOIN MISSIONS m ON r.RequestID = m.RequestID AND m.Status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS')
WHERE i.Status = 'ACTIVE'
GROUP BY i.IncidentID, i.IncidentName, i.IncidentType, i.Severity, l.LocationName, l.City, i.StartTime
ORDER BY CompositeRiskScore DESC;

-- --------------------------------------------------------------------
-- REPORT 2: CRITICAL EMERGENCY REQUESTS PENDING ACTION
-- --------------------------------------------------------------------
SELECT 
    r.RequestID,
    r.RequestType,
    r.Priority,
    r.PeopleAffected,
    r.Description,
    r.CreatedAt,
    i.IncidentName,
    l.LocationName,
    l.Latitude,
    l.Longitude,
    u.FullName AS ContactPerson,
    u.Phone AS ContactPhone
FROM REQUESTS r
JOIN INCIDENTS i ON r.IncidentID = i.IncidentID
JOIN LOCATIONS l ON r.LocationID = l.LocationID
JOIN USERS u ON r.RequestedBy = u.UserID
WHERE r.Status IN ('PENDING', 'APPROVED') AND r.Priority IN ('CRITICAL', 'HIGH')
ORDER BY r.Priority DESC, r.PeopleAffected DESC, r.CreatedAt ASC;

-- --------------------------------------------------------------------
-- REPORT 3: MOST REQUESTED RESOURCE TYPES ACROSS ALL INCIDENTS
-- --------------------------------------------------------------------
SELECT 
    rt.ResourceTypeID,
    rt.ResourceName,
    rt.Category,
    rt.Unit,
    COUNT(ri.RequestItemID) AS FrequencyRequested,
    SUM(ri.QuantityRequired) AS TotalUnitsRequested,
    SUM(ri.QuantityAllocated) AS TotalUnitsAllocated,
    ROUND((SUM(ri.QuantityAllocated) / NULLIF(SUM(ri.QuantityRequired), 0)) * 100, 2) AS FulfillmentRatePct
FROM RESOURCE_TYPES rt
JOIN REQUEST_ITEMS ri ON rt.ResourceTypeID = ri.ResourceTypeID
GROUP BY rt.ResourceTypeID, rt.ResourceName, rt.Category, rt.Unit
ORDER BY TotalUnitsRequested DESC;

-- --------------------------------------------------------------------
-- REPORT 4: OVERALL RESOURCE CAPACITY & DEPLOYMENT UTILIZATION
-- --------------------------------------------------------------------
SELECT 
    rt.Category,
    COUNT(r.ResourceID) AS AssetItemsCount,
    SUM(r.Quantity) AS TotalStock,
    SUM(CASE WHEN r.AvailabilityStatus = 'AVAILABLE' THEN r.Quantity ELSE 0 END) AS AvailableQty,
    SUM(CASE WHEN r.AvailabilityStatus IN ('ALLOCATED', 'IN_USE') THEN r.Quantity ELSE 0 END) AS DeployedQty,
    SUM(CASE WHEN r.AvailabilityStatus IN ('DAMAGED', 'UNDER_REPAIR') THEN r.Quantity ELSE 0 END) AS OutOfServiceQty,
    ROUND((SUM(CASE WHEN r.AvailabilityStatus IN ('ALLOCATED', 'IN_USE') THEN r.Quantity ELSE 0 END) / 
           NULLIF(SUM(r.Quantity), 0)) * 100, 2) AS UtilizationRatePct
FROM RESOURCE_TYPES rt
LEFT JOIN RESOURCES r ON rt.ResourceTypeID = r.ResourceTypeID
GROUP BY rt.Category
ORDER BY UtilizationRatePct DESC;

-- --------------------------------------------------------------------
-- REPORT 5: FIELD RESPONDER WORKLOAD & READINESS
-- --------------------------------------------------------------------
SELECT 
    resp.ResponderID,
    resp.TeamName,
    resp.Specialization,
    resp.ExperienceLevel,
    resp.CurrentStatus,
    COUNT(m.MissionID) AS LifetimeMissions,
    SUM(CASE WHEN m.Status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS ActiveMissionsRunning
FROM RESPONDERS resp
LEFT JOIN MISSIONS m ON resp.ResponderID = m.ResponderID
GROUP BY resp.ResponderID, resp.TeamName, resp.Specialization, resp.ExperienceLevel, resp.CurrentStatus
ORDER BY ActiveMissionsRunning DESC, LifetimeMissions DESC;

-- --------------------------------------------------------------------
-- REPORT 6: AVERAGE RESPONSE TIME BY INCIDENT SEVERITY
-- --------------------------------------------------------------------
SELECT 
    i.Severity,
    COUNT(m.MissionID) AS CompletedMissionsCount,
    ROUND(AVG(CALCULATE_RESPONSE_TIME(m.MissionID)), 2) AS AvgResponseMinutes,
    ROUND(MIN(CALCULATE_RESPONSE_TIME(m.MissionID)), 2) AS FastestResponseMinutes,
    ROUND(MAX(CALCULATE_RESPONSE_TIME(m.MissionID)), 2) AS SlowestResponseMinutes
FROM INCIDENTS i
JOIN REQUESTS r ON i.IncidentID = r.IncidentID
JOIN MISSIONS m ON r.RequestID = m.RequestID
GROUP BY i.Severity
ORDER BY AvgResponseMinutes ASC;

-- --------------------------------------------------------------------
-- REPORT 7: WAREHOUSE INVENTORY SHORTAGE & DEFICIT ALERT
-- --------------------------------------------------------------------
SELECT 
    w.WarehouseName,
    rt.ResourceName,
    rt.Category,
    rt.Unit,
    inv.QuantityAvailable,
    inv.ReorderLevel,
    (inv.ReorderLevel - inv.QuantityAvailable) AS ShortageUnits,
    GET_INVENTORY_STATUS(inv.WarehouseID, inv.ResourceTypeID) AS ShortageSeverity
FROM INVENTORY inv
JOIN WAREHOUSES w ON inv.WarehouseID = w.WarehouseID
JOIN RESOURCE_TYPES rt ON inv.ResourceTypeID = rt.ResourceTypeID
WHERE inv.QuantityAvailable <= inv.ReorderLevel
ORDER BY inv.QuantityAvailable ASC;

-- --------------------------------------------------------------------
-- REPORT 8: MISSION COMPLETION & OPERATIONAL OUTCOME STATISTICS
-- --------------------------------------------------------------------
SELECT 
    m.Status AS MissionFinalStatus,
    COUNT(m.MissionID) AS MissionCount,
    ROUND(COUNT(m.MissionID) * 100.0 / (SELECT COUNT(*) FROM MISSIONS), 2) AS PercentageOfTotal
FROM MISSIONS m
GROUP BY m.Status
ORDER BY MissionCount DESC;

-- --------------------------------------------------------------------
-- REPORT 9: INCIDENT RESOLUTION RATE & DURATION SUMMARY
-- --------------------------------------------------------------------
SELECT 
    i.IncidentType,
    COUNT(i.IncidentID) AS TotalIncidentsRecorded,
    SUM(CASE WHEN i.Status = 'RESOLVED' OR i.Status = 'CLOSED' THEN 1 ELSE 0 END) AS ResolvedIncidents,
    SUM(CASE WHEN i.Status = 'ACTIVE' THEN 1 ELSE 0 END) AS CurrentlyActiveIncidents,
    ROUND(SUM(CASE WHEN i.Status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(COUNT(i.IncidentID), 0), 2) AS ResolutionRatePct
FROM INCIDENTS i
GROUP BY i.IncidentType
ORDER BY TotalIncidentsRecorded DESC;

-- --------------------------------------------------------------------
-- REPORT 10: RESOURCE CONSUMPTION PER DISASTER INCIDENT
-- --------------------------------------------------------------------
SELECT 
    i.IncidentID,
    i.IncidentName,
    i.IncidentType,
    rt.ResourceName,
    rt.Category,
    SUM(mr.QuantityAllocated) AS UnitsAllocated,
    SUM(mr.QuantityUsed) AS UnitsConsumed,
    SUM(mr.QuantityReturned) AS UnitsReturned
FROM INCIDENTS i
JOIN REQUESTS r ON i.IncidentID = r.IncidentID
JOIN MISSIONS m ON r.RequestID = m.RequestID
JOIN MISSION_RESOURCES mr ON m.MissionID = mr.MissionID
JOIN RESOURCES res ON mr.ResourceID = res.ResourceID
JOIN RESOURCE_TYPES rt ON res.ResourceTypeID = rt.ResourceTypeID
GROUP BY i.IncidentID, i.IncidentName, i.IncidentType, rt.ResourceName, rt.Category
ORDER BY UnitsConsumed DESC;
