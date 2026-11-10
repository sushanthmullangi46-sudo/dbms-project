-- ====================================================================
-- URBAN DISASTER RESPONSE & RELIEF COORDINATION PLATFORM (UDRRMS / UDR-ORP)
-- FILE 03: PERFORMANCE B-TREE INDEXES (16 DEDICATED INDEXES)
-- Target: Oracle Database 19c / 21c / 23c
-- Standard: Sub-10ms Join & Predicate Query Execution
-- ====================================================================

-- 1. DISASTER REPORTS INDEXES
CREATE INDEX idx_reports_status ON DISASTER_REPORTS(status);
CREATE INDEX idx_reports_location ON DISASTER_REPORTS(location_id);
CREATE INDEX idx_reports_user ON DISASTER_REPORTS(reported_by_user_id);
CREATE INDEX idx_reports_created ON DISASTER_REPORTS(created_at);

-- 2. DISASTERS (INCIDENTS) INDEXES
CREATE INDEX idx_incidents_status ON DISASTERS(status);
CREATE INDEX idx_incidents_severity ON DISASTERS(severity_level);
CREATE INDEX idx_incidents_location ON DISASTERS(location_id);
CREATE INDEX idx_incidents_activated ON DISASTERS(activated_at);

-- 3. TACTICAL MISSIONS INDEXES
CREATE INDEX idx_missions_status ON MISSIONS(status);
CREATE INDEX idx_missions_incident ON MISSIONS(incident_id);
CREATE INDEX idx_missions_team ON MISSIONS(assigned_team_id);

-- 4. WAREHOUSE & INVENTORY INDEXES
CREATE INDEX idx_inventory_warehouse ON INVENTORY(warehouse_id);
CREATE INDEX idx_inventory_resource ON INVENTORY(resource_id);

-- 5. RESOURCE ALLOCATIONS & DELIVERIES
CREATE INDEX idx_alloc_request ON RESOURCE_ALLOCATIONS(request_id);
CREATE INDEX idx_alloc_status ON RESOURCE_ALLOCATIONS(allocation_status);
CREATE INDEX idx_delivery_alloc ON DELIVERIES(allocation_id);

-- 6. AUDIT LOGS INDEX
CREATE INDEX idx_audit_created ON AUDIT_LOGS(created_at);

COMMIT;

