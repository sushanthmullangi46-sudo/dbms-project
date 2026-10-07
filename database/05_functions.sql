-- ====================================================================
-- URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM (UDR-ORP)
-- FILE 05: DATABASE FUNCTIONS
-- Target: Oracle Database
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. GET_AVAILABLE_RESOURCE_COUNT
-- Returns total available quantity of a specific resource type across providers
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION GET_AVAILABLE_RESOURCE_COUNT (
    p_resource_type_id IN NUMBER
) RETURN NUMBER AS
    v_total NUMBER := 0;
BEGIN
    SELECT NVL(SUM(Quantity), 0)
    INTO v_total
    FROM RESOURCES
    WHERE ResourceTypeID = p_resource_type_id
      AND AvailabilityStatus = 'AVAILABLE';
      
    RETURN v_total;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END GET_AVAILABLE_RESOURCE_COUNT;
/

-- --------------------------------------------------------------------
-- 2. CALCULATE_RESPONSE_TIME
-- Calculates the duration between request creation and mission arrival in minutes
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION CALCULATE_RESPONSE_TIME (
    p_mission_id IN NUMBER
) RETURN NUMBER AS
    v_req_time   TIMESTAMP;
    v_start_time TIMESTAMP;
    v_diff_mins  NUMBER := 0;
BEGIN
    SELECT r.CreatedAt, m.StartTime
    INTO v_req_time, v_start_time
    FROM MISSIONS m
    JOIN REQUESTS r ON m.RequestID = r.RequestID
    WHERE m.MissionID = p_mission_id;
    
    -- Oracle TIMESTAMP difference in minutes: (days * 24 * 60)
    v_diff_mins := ROUND(EXTRACT(DAY FROM (v_start_time - v_req_time)) * 1440 +
                         EXTRACT(HOUR FROM (v_start_time - v_req_time)) * 60 +
                         EXTRACT(MINUTE FROM (v_start_time - v_req_time)) +
                         EXTRACT(SECOND FROM (v_start_time - v_req_time)) / 60, 2);
                         
    RETURN NVL(v_diff_mins, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END CALCULATE_RESPONSE_TIME;
/

-- --------------------------------------------------------------------
-- 3. GET_INCIDENT_REQUEST_COUNT
-- Returns total number of emergency requests generated for an incident
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION GET_INCIDENT_REQUEST_COUNT (
    p_incident_id IN NUMBER
) RETURN NUMBER AS
    v_count NUMBER := 0;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM REQUESTS
    WHERE IncidentID = p_incident_id;
    
    RETURN v_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END GET_INCIDENT_REQUEST_COUNT;
/

-- --------------------------------------------------------------------
-- 4. GET_INVENTORY_STATUS
-- Returns stock status classification (NORMAL, LOW, CRITICAL, or NOT_FOUND)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION GET_INVENTORY_STATUS (
    p_warehouse_id     IN NUMBER,
    p_resource_type_id IN NUMBER
) RETURN VARCHAR2 AS
    v_qty     NUMBER;
    v_reorder NUMBER;
BEGIN
    SELECT QuantityAvailable, ReorderLevel
    INTO v_qty, v_reorder
    FROM INVENTORY
    WHERE WarehouseID = p_warehouse_id
      AND ResourceTypeID = p_resource_type_id;
      
    IF v_qty = 0 THEN
        RETURN 'CRITICAL';
    ELSIF v_qty <= v_reorder THEN
        RETURN 'LOW';
    ELSE
        RETURN 'NORMAL';
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'NOT_FOUND';
    WHEN OTHERS THEN
        RETURN 'UNKNOWN';
END GET_INVENTORY_STATUS;
/

-- --------------------------------------------------------------------
-- 5. CALCULATE_DISASTER_RISK_SCORE
-- Computes numeric index (1 to 100) based on severity, affected population, & requests
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION CALCULATE_DISASTER_RISK_SCORE (
    p_incident_id IN NUMBER
) RETURN NUMBER AS
    v_sev          VARCHAR2(20);
    v_base_score   NUMBER := 20;
    v_pop_total    NUMBER := 0;
    v_req_count    NUMBER := 0;
    v_final_score  NUMBER;
BEGIN
    SELECT Severity INTO v_sev FROM INCIDENTS WHERE IncidentID = p_incident_id;
    
    CASE v_sev
        WHEN 'CRITICAL' THEN v_base_score := 50;
        WHEN 'HIGH'     THEN v_base_score := 35;
        WHEN 'MEDIUM'   THEN v_base_score := 20;
        WHEN 'LOW'      THEN v_base_score := 10;
        ELSE v_base_score := 15;
    END CASE;
    
    SELECT NVL(SUM(PopulationAffected), 0) INTO v_pop_total 
    FROM INCIDENT_ZONES WHERE IncidentID = p_incident_id;
    
    SELECT COUNT(*) INTO v_req_count 
    FROM REQUESTS WHERE IncidentID = p_incident_id;
    
    -- Score formula capped at 100
    v_final_score := v_base_score + LEAST(30, ROUND(v_pop_total / 1000)) + LEAST(20, v_req_count * 2);
    
    RETURN LEAST(100, v_final_score);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END CALCULATE_DISASTER_RISK_SCORE;
/

COMMIT;
