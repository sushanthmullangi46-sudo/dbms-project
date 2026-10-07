-- ====================================================================
-- URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM (UDR-ORP)
-- FILE 04: STORED PROCEDURES (BUSINESS LOGIC & TRANSACTIONS)
-- Target: Oracle Database
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. CREATE_INCIDENT
-- Creates an official incident, records initial zone, and audits creation
-- --------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE CREATE_INCIDENT (
    p_name        IN VARCHAR2,
    p_type        IN VARCHAR2,
    p_severity    IN VARCHAR2,
    p_location_id IN NUMBER,
    p_description IN VARCHAR2,
    p_created_by  IN NUMBER,
    p_incident_id OUT NUMBER
) AS
    v_incident_id NUMBER;
BEGIN
    -- Obtain next sequence value
    SELECT SEQ_INCIDENTS.NEXTVAL INTO v_incident_id FROM DUAL;
    
    INSERT INTO INCIDENTS (
        IncidentID, IncidentName, IncidentType, Severity,
        LocationID, Description, StartTime, Status, CreatedBy, CreatedAt
    ) VALUES (
        v_incident_id, p_name, p_type, p_severity,
        p_location_id, p_description, CURRENT_TIMESTAMP, 'ACTIVE', p_created_by, CURRENT_TIMESTAMP
    );
    
    -- Insert primary incident zone
    INSERT INTO INCIDENT_ZONES (
        IncidentID, LocationID, Severity, PopulationAffected, Notes
    ) VALUES (
        v_incident_id, p_location_id, p_severity, 0, 'Primary epicenter zone initialized.'
    );
    
    -- Audit log
    INSERT INTO INCIDENT_LOGS (
        LogID, IncidentID, UserID, ActionType, Description, Timestamp
    ) VALUES (
        SEQ_INCIDENT_LOGS.NEXTVAL, v_incident_id, p_created_by, 'INCIDENT_CREATED',
        'Incident created: ' || p_name || ' [' || p_type || ' / ' || p_severity || ']',
        CURRENT_TIMESTAMP
    );
    
    p_incident_id := v_incident_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END CREATE_INCIDENT;
/

-- --------------------------------------------------------------------
-- 2. CREATE_REQUEST
-- Creates an emergency request for an incident
-- --------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE CREATE_REQUEST (
    p_incident_id    IN NUMBER,
    p_location_id    IN NUMBER,
    p_requested_by   IN NUMBER,
    p_type           IN VARCHAR2,
    p_priority       IN VARCHAR2,
    p_people_aff     IN NUMBER,
    p_desc           IN VARCHAR2,
    p_request_id     OUT NUMBER
) AS
    v_request_id NUMBER;
BEGIN
    SELECT SEQ_REQUESTS.NEXTVAL INTO v_request_id FROM DUAL;
    
    INSERT INTO REQUESTS (
        RequestID, IncidentID, LocationID, RequestedBy,
        RequestType, Priority, PeopleAffected, Description,
        Status, CreatedAt
    ) VALUES (
        v_request_id, p_incident_id, p_location_id, p_requested_by,
        p_type, p_priority, NVL(p_people_aff, 1), p_desc,
        'PENDING', CURRENT_TIMESTAMP
    );
    
    -- Audit record in incident logs
    INSERT INTO INCIDENT_LOGS (
        LogID, IncidentID, UserID, ActionType, Description, Timestamp
    ) VALUES (
        SEQ_INCIDENT_LOGS.NEXTVAL, p_incident_id, p_requested_by, 'REQUEST_SUBMITTED',
        'Emergency request #' || v_request_id || ' created (' || p_type || ', ' || p_priority || ')',
        CURRENT_TIMESTAMP
    );
    
    p_request_id := v_request_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END CREATE_REQUEST;
/

-- --------------------------------------------------------------------
-- 3. ALLOCATE_RESOURCE (Transaction-Safe Resource Allocation)
-- Locks resource row, verifies quantity & availability, deducts/allocates,
-- updates mission/request, logs inventory transaction and audits.
-- --------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE ALLOCATE_RESOURCE (
    p_mission_id   IN NUMBER,
    p_resource_id  IN NUMBER,
    p_quantity     IN NUMBER,
    p_allocated_by IN NUMBER
) AS
    v_avail_status VARCHAR2(30);
    v_cur_qty      NUMBER;
    v_res_name     VARCHAR2(100);
    v_res_type_id  NUMBER;
    v_req_id       NUMBER;
    v_inc_id       NUMBER;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Allocation quantity must be greater than zero.');
    END IF;

    -- 1. Check & Lock Resource row
    SELECT AvailabilityStatus, Quantity, ResourceName, ResourceTypeID
    INTO v_avail_status, v_cur_qty, v_res_name, v_res_type_id
    FROM RESOURCES
    WHERE ResourceID = p_resource_id
    FOR UPDATE;

    IF v_avail_status NOT IN ('AVAILABLE', 'ALLOCATED') THEN
        RAISE_APPLICATION_ERROR(-20002, 'Resource ' || v_res_name || ' is currently ' || v_avail_status || ' and cannot be allocated.');
    END IF;

    IF v_cur_qty < p_quantity THEN
        RAISE_APPLICATION_ERROR(-20003, 'Insufficient quantity. Available: ' || v_cur_qty || ', Requested: ' || p_quantity);
    END IF;

    -- 2. Deduct resource quantity and set status
    UPDATE RESOURCES
    SET Quantity = Quantity - p_quantity,
        AvailabilityStatus = CASE WHEN (Quantity - p_quantity) = 0 THEN 'ALLOCATED' ELSE 'AVAILABLE' END
    WHERE ResourceID = p_resource_id;

    -- 3. Insert or update MISSION_RESOURCES record
    MERGE INTO MISSION_RESOURCES mr
    USING (SELECT p_mission_id AS m_id, p_resource_id AS r_id FROM DUAL) src
    ON (mr.MissionID = src.m_id AND mr.ResourceID = src.r_id)
    WHEN MATCHED THEN
        UPDATE SET mr.QuantityAllocated = mr.QuantityAllocated + p_quantity
    WHEN NOT MATCHED THEN
        INSERT (MissionID, ResourceID, QuantityAllocated, QuantityUsed, QuantityReturned)
        VALUES (p_mission_id, p_resource_id, p_quantity, 0, 0);

    -- 4. Find linked Request and Incident for audit tracking
    SELECT m.RequestID, r.IncidentID
    INTO v_req_id, v_inc_id
    FROM MISSIONS m
    JOIN REQUESTS r ON m.RequestID = r.RequestID
    WHERE m.MissionID = p_mission_id;

    -- Update Request item allocated quantity if matching type exists
    UPDATE REQUEST_ITEMS
    SET QuantityAllocated = LEAST(QuantityAllocated + p_quantity, QuantityRequired)
    WHERE RequestID = v_req_id AND ResourceTypeID = v_res_type_id;

    -- 5. Audit Log
    INSERT INTO INCIDENT_LOGS (
        LogID, IncidentID, UserID, ActionType, Description, Timestamp
    ) VALUES (
        SEQ_INCIDENT_LOGS.NEXTVAL, v_inc_id, p_allocated_by, 'RESOURCE_ALLOCATED',
        'Allocated ' || p_quantity || ' unit(s) of ' || v_res_name || ' to Mission #' || p_mission_id,
        CURRENT_TIMESTAMP
    );

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END ALLOCATE_RESOURCE;
/

-- --------------------------------------------------------------------
-- 4. CREATE_MISSION
-- Creates mission ensuring responder and vehicle are conflict-free
-- --------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE CREATE_MISSION (
    p_request_id   IN NUMBER,
    p_responder_id IN NUMBER,
    p_vehicle_id   IN NUMBER,
    p_assigned_by  IN NUMBER,
    p_priority     IN VARCHAR2,
    p_exp_end_time IN TIMESTAMP,
    p_mission_id   OUT NUMBER
) AS
    v_mission_id   NUMBER;
    v_resp_status  VARCHAR2(30);
    v_veh_status   VARCHAR2(30);
    v_inc_id       NUMBER;
    v_active_resp  NUMBER;
    v_active_veh   NUMBER;
BEGIN
    -- 1. Check responder availability
    SELECT COUNT(*) INTO v_active_resp
    FROM MISSIONS
    WHERE ResponderID = p_responder_id 
      AND Status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS');
      
    IF v_active_resp > 0 THEN
        RAISE_APPLICATION_ERROR(-20010, 'Rule 1 Violation: Responder already has an active ongoing mission.');
    END IF;

    -- 2. Check vehicle availability if provided
    IF p_vehicle_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_active_veh
        FROM MISSIONS
        WHERE VehicleID = p_vehicle_id 
          AND Status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS');
          
        IF v_active_veh > 0 THEN
            RAISE_APPLICATION_ERROR(-20011, 'Rule 2 Violation: Vehicle is already assigned to an active mission.');
        END IF;
    END IF;

    -- 3. Create mission
    SELECT SEQ_MISSIONS.NEXTVAL INTO v_mission_id FROM DUAL;

    INSERT INTO MISSIONS (
        MissionID, RequestID, ResponderID, VehicleID,
        AssignedBy, StartTime, ExpectedEndTime, Status, Priority, CreatedAt
    ) VALUES (
        v_mission_id, p_request_id, p_responder_id, p_vehicle_id,
        p_assigned_by, CURRENT_TIMESTAMP, p_exp_end_time, 'ASSIGNED', NVL(p_priority, 'MEDIUM'), CURRENT_TIMESTAMP
    );

    -- 4. Update responder status to ASSIGNED
    UPDATE RESPONDERS
    SET CurrentStatus = 'ASSIGNED', AvailabilityStatus = 'BUSY'
    WHERE ResponderID = p_responder_id;

    -- 5. Update vehicle status to ALLOCATED
    IF p_vehicle_id IS NOT NULL THEN
        UPDATE VEHICLES
        SET Status = 'ALLOCATED'
        WHERE VehicleID = p_vehicle_id;
    END IF;

    -- 6. Update Request Status to ALLOCATED
    UPDATE REQUESTS
    SET Status = 'ALLOCATED'
    WHERE RequestID = p_request_id;

    -- 7. Audit Log
    SELECT IncidentID INTO v_inc_id FROM REQUESTS WHERE RequestID = p_request_id;
    
    INSERT INTO INCIDENT_LOGS (
        LogID, IncidentID, UserID, ActionType, Description, Timestamp
    ) VALUES (
        SEQ_INCIDENT_LOGS.NEXTVAL, v_inc_id, p_assigned_by, 'MISSION_CREATED',
        'Mission #' || v_mission_id || ' initiated for Request #' || p_request_id,
        CURRENT_TIMESTAMP
    );

    p_mission_id := v_mission_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END CREATE_MISSION;
/

-- --------------------------------------------------------------------
-- 5. UPDATE_MISSION_STATUS
-- Enforces valid state machine transitions
-- ASSIGNED -> ACCEPTED -> EN_ROUTE -> ARRIVED -> IN_PROGRESS -> COMPLETED
-- --------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE UPDATE_MISSION_STATUS (
    p_mission_id   IN NUMBER,
    p_new_status   IN VARCHAR2,
    p_updated_by   IN NUMBER,
    p_notes        IN VARCHAR2 DEFAULT NULL
) AS
    v_curr_status  VARCHAR2(30);
    v_resp_id      NUMBER;
    v_veh_id       NUMBER;
    v_req_id       NUMBER;
    v_inc_id       NUMBER;
    v_is_valid     BOOLEAN := FALSE;
BEGIN
    SELECT Status, ResponderID, VehicleID, RequestID
    INTO v_curr_status, v_resp_id, v_veh_id, v_req_id
    FROM MISSIONS
    WHERE MissionID = p_mission_id
    FOR UPDATE;

    SELECT IncidentID INTO v_inc_id FROM REQUESTS WHERE RequestID = v_req_id;

    -- State transition validation
    IF v_curr_status = 'ASSIGNED' AND p_new_status IN ('ACCEPTED', 'CANCELLED') THEN
        v_is_valid := TRUE;
    ELSIF v_curr_status = 'ACCEPTED' AND p_new_status IN ('EN_ROUTE', 'CANCELLED', 'ON_HOLD') THEN
        v_is_valid := TRUE;
    ELSIF v_curr_status = 'EN_ROUTE' AND p_new_status IN ('ARRIVED', 'ON_HOLD') THEN
        v_is_valid := TRUE;
    ELSIF v_curr_status = 'ARRIVED' AND p_new_status IN ('IN_PROGRESS', 'ON_HOLD') THEN
        v_is_valid := TRUE;
    ELSIF v_curr_status = 'IN_PROGRESS' AND p_new_status IN ('COMPLETED', 'ON_HOLD', 'CANCELLED') THEN
        v_is_valid := TRUE;
    ELSIF v_curr_status = 'ON_HOLD' AND p_new_status IN ('IN_PROGRESS', 'EN_ROUTE', 'CANCELLED') THEN
        v_is_valid := TRUE;
    ELSE
        v_is_valid := FALSE;
    END IF;

    IF NOT v_is_valid THEN
        RAISE_APPLICATION_ERROR(-20020, 'Invalid mission transition: Cannot change from ' || v_curr_status || ' to ' || p_new_status);
    END IF;

    -- Update Mission status
    UPDATE MISSIONS
    SET Status = p_new_status
    WHERE MissionID = p_mission_id;

    -- Synchronize Responder status
    IF p_new_status IN ('EN_ROUTE', 'ARRIVED', 'IN_PROGRESS') THEN
        UPDATE RESPONDERS SET CurrentStatus = 'ON_MISSION' WHERE ResponderID = v_resp_id;
        IF v_veh_id IS NOT NULL THEN
            UPDATE VEHICLES SET Status = 'IN_USE' WHERE VehicleID = v_veh_id;
        END IF;
        UPDATE REQUESTS SET Status = 'IN_PROGRESS' WHERE RequestID = v_req_id;
    ELSIF p_new_status = 'COMPLETED' THEN
        -- Delegated to COMPLETE_MISSION or handled here
        UPDATE MISSIONS SET ActualEndTime = CURRENT_TIMESTAMP WHERE MissionID = p_mission_id;
        UPDATE RESPONDERS SET CurrentStatus = 'AVAILABLE', AvailabilityStatus = 'AVAILABLE' WHERE ResponderID = v_resp_id;
        IF v_veh_id IS NOT NULL THEN
            UPDATE VEHICLES SET Status = 'AVAILABLE' WHERE VehicleID = v_veh_id;
        END IF;
        UPDATE REQUESTS SET Status = 'RESOLVED', ResolvedAt = CURRENT_TIMESTAMP WHERE RequestID = v_req_id;
    ELSIF p_new_status = 'CANCELLED' THEN
        UPDATE RESPONDERS SET CurrentStatus = 'AVAILABLE', AvailabilityStatus = 'AVAILABLE' WHERE ResponderID = v_resp_id;
        IF v_veh_id IS NOT NULL THEN
            UPDATE VEHICLES SET Status = 'AVAILABLE' WHERE VehicleID = v_veh_id;
        END IF;
        UPDATE REQUESTS SET Status = 'PENDING' WHERE RequestID = v_req_id;
    END IF;

    -- Audit log
    INSERT INTO INCIDENT_LOGS (
        LogID, IncidentID, UserID, ActionType, Description, Timestamp
    ) VALUES (
        SEQ_INCIDENT_LOGS.NEXTVAL, v_inc_id, p_updated_by, 'MISSION_STATUS_UPDATED',
        'Mission #' || p_mission_id || ' status changed from ' || v_curr_status || ' to ' || p_new_status || NVL2(p_notes, ' (' || p_notes || ')', ''),
        CURRENT_TIMESTAMP
    );

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END UPDATE_MISSION_STATUS;
/

-- --------------------------------------------------------------------
-- 6. COMPLETE_MISSION
-- Finalizes mission, sets ActualEndTime, frees assets and audits
-- --------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE COMPLETE_MISSION (
    p_mission_id  IN NUMBER,
    p_finished_by IN NUMBER,
    p_notes       IN VARCHAR2 DEFAULT NULL
) AS
BEGIN
    UPDATE_MISSION_STATUS(p_mission_id, 'COMPLETED', p_finished_by, p_notes);
END COMPLETE_MISSION;
/

COMMIT;
