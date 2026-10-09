-- ==============================================================================
-- URBAN DISASTER RELIEF AND RESOURCE MANAGEMENT SYSTEM (UDRRMS)
-- FILE: 03_analytical_queries.sql
-- PURPOSE: Production-style Analytical and Operational SQL Queries (Oracle Target)
-- ==============================================================================

-- 1. TOTAL INCIDENTS BY DISASTER TYPE AND WARD
SELECT 
    dl.ward_name,
    dr.disaster_type,
    COUNT(dr.report_id) AS total_reports,
    SUM(dr.people_affected) AS total_affected,
    SUM(dr.injuries_reported) AS total_injuries
FROM DISASTER_REPORT dr
JOIN DISASTER_LOCATION dl ON dr.location_id = dl.location_id
GROUP BY dl.ward_name, dr.disaster_type
ORDER BY total_affected DESC;

-- 2. INCIDENTS BREAKDOWN BY SEVERITY LEVEL (P1-P4)
SELECT 
    d.severity_level,
    COUNT(d.disaster_id) AS total_incidents,
    ROUND(AVG(d.severity_score), 2) AS avg_score,
    COUNT(CASE WHEN d.status = 'ACTIVE' THEN 1 END) AS active_count,
    COUNT(CASE WHEN d.status = 'CLOSED' THEN 1 END) AS closed_count
FROM DISASTER d
GROUP BY d.severity_level
ORDER BY d.severity_level ASC;

-- 3. AVERAGE VERIFICATION TIME (MINUTES)
SELECT 
    ROUND(AVG((dr.verified_at - dr.submitted_at) * 24 * 60), 2) AS avg_verification_minutes,
    MIN(ROUND((dr.verified_at - dr.submitted_at) * 24 * 60, 2)) AS min_verification_minutes,
    MAX(ROUND((dr.verified_at - dr.submitted_at) * 24 * 60, 2)) AS max_verification_minutes
FROM DISASTER_REPORT dr
WHERE dr.verified_at IS NOT NULL;

-- 4. RESOURCE DEMAND VERSUS FULFILLED DEMAND (BY RESOURCE CATALOG)
SELECT 
    r.resource_name,
    r.category,
    r.unit,
    NVL(SUM(ri.quantity_requested), 0) AS total_demanded,
    NVL(SUM(ra.quantity_allocated), 0) AS total_allocated,
    NVL(SUM(d.quantity_received), 0) AS total_delivered,
    CASE 
        WHEN NVL(SUM(ri.quantity_requested), 0) > 0 
        THEN ROUND((NVL(SUM(d.quantity_received), 0) / SUM(ri.quantity_requested)) * 100, 2)
        ELSE 100.0
    END AS fulfillment_percentage
FROM RESOURCE r
LEFT JOIN REQUEST_ITEM ri ON r.resource_id = ri.resource_id
LEFT JOIN RESOURCE_ALLOCATION ra ON ri.request_id = ra.request_id
LEFT JOIN DELIVERY d ON ra.allocation_id = d.allocation_id AND d.status = 'DELIVERED'
GROUP BY r.resource_name, r.category, r.unit
ORDER BY total_demanded DESC;

-- 5. WAREHOUSE INVENTORY CONSUMPTION AND LOW STOCK ALERTS
SELECT 
    w.warehouse_name,
    r.resource_name,
    i.quantity_available,
    i.quantity_reserved,
    (i.quantity_available + i.quantity_reserved) AS total_stock,
    i.reorder_threshold,
    CASE 
        WHEN i.quantity_available <= i.reorder_threshold THEN 'CRITICAL_REORDER_REQUIRED'
        WHEN i.quantity_available <= (i.reorder_threshold * 1.5) THEN 'WARNING_LOW_STOCK'
        ELSE 'OPTIMAL'
    END AS inventory_status
FROM INVENTORY i
JOIN WAREHOUSE w ON i.warehouse_id = w.warehouse_id
JOIN RESOURCE r ON i.resource_id = r.resource_id
ORDER BY w.warehouse_name, i.quantity_available ASC;

-- 6. SHELTER OCCUPANCY AND REMAINING CAPACITIES
SELECT 
    s.shelter_name,
    dl.location_name,
    s.capacity,
    s.current_occupancy,
    (s.capacity - s.current_occupancy) AS available_places,
    ROUND((s.current_occupancy / s.capacity) * 100, 1) AS occupancy_rate_percent,
    s.status
FROM SHELTER s
JOIN DISASTER_LOCATION dl ON s.location_id = dl.location_id
ORDER BY occupancy_rate_percent DESC;

-- 7. RESCUE TEAM UTILIZATION AND MISSION COMPLETION STATUS
SELECT 
    rt.team_name,
    a.agency_name,
    rt.specialization,
    rt.readiness_status,
    COUNT(ta.assignment_id) AS total_missions_assigned,
    COUNT(CASE WHEN ta.status = 'COMPLETED' THEN 1 END) AS missions_completed,
    COUNT(CASE WHEN ta.status IN ('ASSIGNED', 'ACKNOWLEDGED', 'EN_ROUTE', 'ON_SCENE') THEN 1 END) AS missions_active
FROM RESPONSE_TEAM rt
JOIN AGENCY a ON rt.agency_id = a.agency_id
LEFT JOIN TEAM_ASSIGNMENT ta ON rt.team_id = ta.team_id
GROUP BY rt.team_name, a.agency_name, rt.specialization, rt.readiness_status
ORDER BY total_missions_assigned DESC;

-- 8. UNRESOLVED ASSISTANCE REQUESTS
SELECT 
    dr.report_reference_id,
    u.full_name AS citizen_name,
    u.phone AS contact_number,
    dr.disaster_type,
    dr.status AS report_status,
    dr.urgent_medical_needed,
    dr.evacuation_needed
FROM DISASTER_REPORT dr
JOIN USER_ACCOUNT u ON dr.reporter_user_id = u.user_id
WHERE dr.status != 'CLOSED' AND (dr.urgent_medical_needed = 1 OR dr.evacuation_needed = 1);

-- 9. COMPLETE AUDIT HISTORY LOG OF AN OPERATIONAL INCIDENT
SELECT 
    al.log_id,
    al.timestamp,
    al.action,
    al.actor_name,
    al.details
FROM AUDIT_LOG al
WHERE al.entity_name = 'DISASTER'
ORDER BY al.timestamp ASC;
