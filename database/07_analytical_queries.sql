-- ====================================================================
-- URBAN DISASTER RESPONSE & RELIEF COORDINATION PLATFORM (UDRRMS / UDR-ORP)
-- FILE 07: 12 MANDATORY ANALYTICAL SQL QUERIES & DERIVED REPORT
-- Target: Oracle Database 19c / 21c / 23c / PostgreSQL / SQLite
-- Standard: SQL JOIN, LEFT JOIN, GROUP BY, HAVING, and Aggregates
-- ====================================================================

-- --------------------------------------------------------------------
-- QUERY 1: Disaster Reports by Hazard Category (JOIN, COUNT, GROUP BY)
-- --------------------------------------------------------------------
SELECT 
    dt.type_name AS hazard_category,
    COUNT(dr.report_id) AS total_reports,
    SUM(dr.people_affected) AS total_citizens_impacted,
    SUM(dr.trapped_persons) AS total_trapped
FROM DISASTER_TYPES dt
LEFT JOIN DISASTER_REPORTS dr ON dt.type_id = dr.disaster_type_id
GROUP BY dt.type_name
ORDER BY total_reports DESC;

-- --------------------------------------------------------------------
-- QUERY 2: Active Disasters by Priority & Severity Distribution
-- --------------------------------------------------------------------
SELECT 
    d.severity_level,
    COUNT(d.disaster_id) AS incident_count,
    ROUND(COUNT(d.disaster_id) * 100.0 / (SELECT COUNT(*) FROM DISASTERS), 1) AS percentage_of_total
FROM DISASTERS d
GROUP BY d.severity_level
ORDER BY d.severity_level ASC;

-- --------------------------------------------------------------------
-- QUERY 3: Disaster Reports Grouped by Municipal Geographic Ward
-- --------------------------------------------------------------------
SELECT 
    l.ward_name,
    l.risk_zone,
    COUNT(dr.report_id) AS incident_count,
    SUM(dr.injuries_reported) AS total_injuries,
    SUM(CASE WHEN dr.urgent_medical_needed = 'Y' THEN 1 ELSE 0 END) AS medical_emergencies
FROM LOCATIONS l
JOIN DISASTER_REPORTS dr ON l.location_id = dr.location_id
GROUP BY l.ward_name, l.risk_zone
HAVING COUNT(dr.report_id) > 0
ORDER BY incident_count DESC;

-- --------------------------------------------------------------------
-- QUERY 4: Rescue Team Assignment & Readiness Summary
-- --------------------------------------------------------------------
SELECT 
    rt.team_id,
    rt.team_name,
    rt.specialization,
    rt.status AS readiness_status,
    COUNT(m.mission_id) AS total_missions_assigned,
    SUM(CASE WHEN m.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS active_field_deployments
FROM RESPONSE_TEAMS rt
LEFT JOIN MISSIONS m ON rt.team_id = m.assigned_team_id
GROUP BY rt.team_id, rt.team_name, rt.specialization, rt.status
ORDER BY total_missions_assigned DESC;

-- --------------------------------------------------------------------
-- QUERY 5: Rescue Mission Completion Statistics & Success Rate
-- --------------------------------------------------------------------
SELECT 
    rt.specialization,
    COUNT(m.mission_id) AS total_deployed,
    SUM(CASE WHEN m.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_missions,
    ROUND(SUM(CASE WHEN m.status = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(m.mission_id), 0), 1) AS completion_percentage
FROM RESPONSE_TEAMS rt
JOIN MISSIONS m ON rt.team_id = m.assigned_team_id
GROUP BY rt.specialization;

-- --------------------------------------------------------------------
-- QUERY 6: Relief Resource Demand vs. Fulfilled Supply Quantities
-- --------------------------------------------------------------------
SELECT 
    r.resource_id,
    r.resource_name,
    r.category,
    COALESCE(SUM(ri.quantity_requested), 0) AS total_units_requested,
    COALESCE(SUM(ri.quantity_approved), 0) AS total_units_approved,
    COALESCE(SUM(ra.quantity_allocated), 0) AS total_units_allocated,
    ROUND(COALESCE(SUM(ra.quantity_allocated), 0) * 100.0 / NULLIF(SUM(ri.quantity_requested), 0), 1) AS fulfillment_rate_pct
FROM RESOURCES r
LEFT JOIN REQUEST_ITEMS ri ON r.resource_id = ri.resource_id
LEFT JOIN RESOURCE_ALLOCATIONS ra ON ri.request_id = ra.request_id
GROUP BY r.resource_id, r.resource_name, r.category
ORDER BY total_units_requested DESC;

-- --------------------------------------------------------------------
-- QUERY 7: Regional Warehouse Inventory Ledger Summary
-- --------------------------------------------------------------------
SELECT 
    w.warehouse_name,
    COUNT(i.resource_id) AS catalog_skus_stocked,
    SUM(i.quantity_available) AS total_available_stock,
    SUM(i.quantity_reserved) AS total_reserved_stock,
    SUM(i.quantity_available + i.quantity_reserved) AS total_on_hand
FROM WAREHOUSES w
JOIN INVENTORY i ON w.warehouse_id = i.warehouse_id
GROUP BY w.warehouse_name
ORDER BY total_on_hand DESC;

-- --------------------------------------------------------------------
-- QUERY 8: Low-Stock Inventory Trigger Alert Report
-- --------------------------------------------------------------------
SELECT 
    w.warehouse_name,
    r.resource_name,
    i.quantity_available,
    i.reorder_threshold,
    i.unit,
    (i.reorder_threshold - i.quantity_available) AS shortage_deficit
FROM INVENTORY i
JOIN WAREHOUSES w ON i.warehouse_id = w.warehouse_id
JOIN RESOURCES r ON i.resource_id = r.resource_id
WHERE i.quantity_available <= i.reorder_threshold
ORDER BY shortage_deficit DESC;

-- --------------------------------------------------------------------
-- QUERY 9: Supply Convoy Dispatch History & Transit Manifests
-- --------------------------------------------------------------------
SELECT 
    d.dispatch_reference,
    d.status AS dispatch_status,
    v.vehicle_number,
    v.vehicle_type,
    r.resource_name,
    ra.quantity_allocated AS quantity_dispatched,
    d.dispatched_at,
    d.delivered_at
FROM DELIVERIES d
JOIN RESOURCE_ALLOCATIONS ra ON d.allocation_id = ra.allocation_id
JOIN INVENTORY i ON ra.inventory_id = i.inventory_id
JOIN RESOURCES r ON i.resource_id = r.resource_id
LEFT JOIN VEHICLES v ON d.transport_vehicle_id = v.vehicle_id
ORDER BY d.dispatched_at DESC;

-- --------------------------------------------------------------------
-- QUERY 10: Logistics Delivery Completion Rate & Deficit Analysis
-- --------------------------------------------------------------------
SELECT 
    d.status AS transit_status,
    COUNT(d.delivery_id) AS delivery_count,
    ROUND(COUNT(d.delivery_id) * 100.0 / (SELECT COUNT(*) FROM DELIVERIES), 1) AS pct_of_dispatches
FROM DELIVERIES d
GROUP BY d.status;

-- --------------------------------------------------------------------
-- QUERY 11: Emergency Triage Verification Response Time
-- --------------------------------------------------------------------
SELECT 
    dr.report_reference_id,
    dt.type_name,
    dr.created_at AS report_timestamp,
    dr.verified_at AS verification_timestamp,
    ROUND((JULIANDAY(dr.verified_at) - JULIANDAY(dr.created_at)) * 24 * 60, 1) AS verification_duration_minutes,
    u.full_name AS verified_by_officer
FROM DISASTER_REPORTS dr
JOIN DISASTER_TYPES dt ON dr.disaster_type_id = dt.type_id
JOIN USER_ACCOUNTS u ON dr.verified_by_user_id = u.user_id
WHERE dr.status = 'VERIFIED'
ORDER BY verification_duration_minutes ASC;

-- --------------------------------------------------------------------
-- QUERY 12: Municipal Evacuation Relief Camp Occupancy Tracking
-- --------------------------------------------------------------------
SELECT 
    s.shelter_name,
    l.ward_name,
    s.capacity,
    s.current_occupancy,
    (s.capacity - s.current_occupancy) AS available_beds,
    ROUND(s.current_occupancy * 100.0 / s.capacity, 1) AS occupancy_percentage,
    CASE 
        WHEN s.current_occupancy >= s.capacity THEN 'FULL / CAPACITY CEILING REACHED'
        WHEN s.current_occupancy >= s.capacity * 0.8 THEN 'HIGH OCCUPANCY'
        ELSE 'AVAILABLE'
    END AS capacity_alert_status
FROM SHELTERS s
JOIN LOCATIONS l ON s.location_id = l.location_id
ORDER BY occupancy_percentage DESC;

-- --------------------------------------------------------------------
-- MASTER DERIVED REPORT: End-to-End Operational Supply & Rescue Matrix
-- Joins: Reports -> Disasters -> Missions -> Teams -> Requests -> 
--        Allocations -> Inventory -> Warehouses -> Deliveries
-- --------------------------------------------------------------------
SELECT 
    dr.report_reference_id,
    dis.incident_code,
    dt.type_name AS hazard_type,
    dis.severity_level,
    l.location_name,
    rt.team_name AS assigned_rescue_squad,
    m.status AS mission_state,
    r.resource_name AS relief_commodity,
    ra.quantity_allocated,
    w.warehouse_name AS supplying_depot,
    del.dispatch_reference,
    del.status AS delivery_transit_status
FROM DISASTER_REPORTS dr
JOIN DISASTERS dis ON dr.report_id = dis.disaster_id OR dis.source_report_id = dr.report_id
JOIN DISASTER_TYPES dt ON dis.disaster_type_id = dt.type_id
JOIN LOCATIONS l ON dis.location_id = l.location_id
LEFT JOIN MISSIONS m ON dis.disaster_id = m.incident_id
LEFT JOIN RESPONSE_TEAMS rt ON m.assigned_team_id = rt.team_id
LEFT JOIN RESOURCE_REQUESTS rr ON dis.disaster_id = rr.incident_id
LEFT JOIN RESOURCE_ALLOCATIONS ra ON rr.request_id = ra.request_id
LEFT JOIN INVENTORY inv ON ra.inventory_id = inv.inventory_id
LEFT JOIN RESOURCES r ON inv.resource_id = r.resource_id
LEFT JOIN WAREHOUSES w ON inv.warehouse_id = w.warehouse_id
LEFT JOIN DELIVERIES del ON ra.allocation_id = del.allocation_id
ORDER BY dis.disaster_id DESC;

