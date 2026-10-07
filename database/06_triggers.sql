-- ====================================================================
-- URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM (UDR-ORP)
-- FILE 06: DATABASE TRIGGERS
-- Target: Oracle Database
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. TRG_PREVENT_INVALID_MISSION_EDITS
-- Enforces Business Rules 4 and 5:
-- A completed mission cannot be restarted.
-- A cancelled mission cannot be marked completed.
-- --------------------------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_PREVENT_INVALID_MISSION_EDITS
BEFORE UPDATE ON MISSIONS
FOR EACH ROW
BEGIN
    -- Rule 4: Completed mission cannot be restarted or transitioned
    IF :OLD.Status = 'COMPLETED' AND :NEW.Status <> 'COMPLETED' THEN
        RAISE_APPLICATION_ERROR(-20031, 'Rule 4 Violation: A completed mission cannot be modified or restarted.');
    END IF;

    -- Rule 5: Cancelled mission cannot be marked completed
    IF :OLD.Status = 'CANCELLED' AND :NEW.Status = 'COMPLETED' THEN
        RAISE_APPLICATION_ERROR(-20032, 'Rule 5 Violation: A cancelled mission cannot be marked as completed.');
    END IF;

    -- Automatically set ActualEndTime upon transition to COMPLETED if not already set
    IF :NEW.Status = 'COMPLETED' AND :OLD.Status <> 'COMPLETED' AND :NEW.ActualEndTime IS NULL THEN
        :NEW.ActualEndTime := CURRENT_TIMESTAMP;
    END IF;
END;
/

-- --------------------------------------------------------------------
-- 2. TRG_MISSION_COMPLETION_RELEASE
-- Automatically releases responder and vehicle when a mission completes
-- --------------------------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_MISSION_COMPLETION_RELEASE
AFTER UPDATE OF Status ON MISSIONS
FOR EACH ROW
WHEN (NEW.Status = 'COMPLETED' AND OLD.Status <> 'COMPLETED')
BEGIN
    -- Make responder available
    UPDATE RESPONDERS
    SET CurrentStatus = 'AVAILABLE',
        AvailabilityStatus = 'AVAILABLE'
    WHERE ResponderID = :NEW.ResponderID;

    -- Make vehicle available if assigned
    IF :NEW.VehicleID IS NOT NULL THEN
        UPDATE VEHICLES
        SET Status = 'AVAILABLE'
        WHERE VehicleID = :NEW.VehicleID;
    END IF;

    -- Mark corresponding emergency request as RESOLVED
    UPDATE REQUESTS
    SET Status = 'RESOLVED',
        ResolvedAt = CURRENT_TIMESTAMP
    WHERE RequestID = :NEW.RequestID;
END;
/

-- --------------------------------------------------------------------
-- 3. TRG_INVENTORY_SAFEGUARD
-- Enforces Rule 3: Inventory cannot become negative and updates timestamp
-- --------------------------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_INVENTORY_SAFEGUARD
BEFORE INSERT OR UPDATE ON INVENTORY
FOR EACH ROW
BEGIN
    IF :NEW.QuantityAvailable < 0 THEN
        RAISE_APPLICATION_ERROR(-20033, 'Rule 3 Violation: Negative inventory quantities are prohibited.');
    END IF;
    :NEW.LastUpdated := CURRENT_TIMESTAMP;
END;
/

-- --------------------------------------------------------------------
-- 4. TRG_INCIDENT_AUDIT_LOG
-- Audits critical incident updates (severity or status transitions)
-- --------------------------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_INCIDENT_AUDIT_LOG
AFTER UPDATE ON INCIDENTS
FOR EACH ROW
WHEN (OLD.Status <> NEW.Status OR OLD.Severity <> NEW.Severity)
BEGIN
    INSERT INTO INCIDENT_LOGS (
        LogID, IncidentID, UserID, ActionType, Description, Timestamp
    ) VALUES (
        SEQ_INCIDENT_LOGS.NEXTVAL,
        :NEW.IncidentID,
        :NEW.CreatedBy,
        'INCIDENT_UPDATED',
        'Incident status changed from ' || :OLD.Status || ' to ' || :NEW.Status ||
        ' (Severity: ' || :OLD.Severity || ' -> ' || :NEW.Severity || ')',
        CURRENT_TIMESTAMP
    );
END;
/

COMMIT;
