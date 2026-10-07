-- ====================================================================
-- MASTER DATABASE INITIALIZATION SCRIPT FOR UDR-ORP
-- Runs all schema, sequences, views, procedures, functions, triggers & sample data
-- Usage:
--   sqlplus system/oracle@localhost:1521/xe @database/init_database.sql
-- ====================================================================

SET ECHO ON
SET SERVEROUTPUT ON
SET FEEDBACK ON
WHENEVER SQLERROR CONTINUE

PROMPT ====================================================================
PROMPT STEP 1: INITIALIZING SCHEMA AND CONSTRAINTS (22 NORMALIZED TABLES)
PROMPT ====================================================================
@database/01_schema.sql

PROMPT ====================================================================
PROMPT STEP 2: CREATING SEQUENCES AND PERFORMANCE INDEXES
PROMPT ====================================================================
@database/02_sequences_and_indexes.sql

PROMPT ====================================================================
PROMPT STEP 3: CREATING DATABASE VIEWS
PROMPT ====================================================================
@database/03_views.sql

PROMPT ====================================================================
PROMPT STEP 4: CREATING STORED PROCEDURES (TRANSACTION-SAFE LOGIC)
PROMPT ====================================================================
@database/04_procedures.sql

PROMPT ====================================================================
PROMPT STEP 5: CREATING DATABASE FUNCTIONS & RISK METRICS
PROMPT ====================================================================
@database/05_functions.sql

PROMPT ====================================================================
PROMPT STEP 6: CREATING DATABASE TRIGGERS
PROMPT ====================================================================
@database/06_triggers.sql

PROMPT ====================================================================
PROMPT STEP 7: SEEDING REALISTIC SAMPLE DATA (BANGALORE FLOOD SCENARIO)
PROMPT ====================================================================
@database/07_sample_data.sql

PROMPT ====================================================================
PROMPT VERIFYING DATABASE OBJECTS INITIALIZED
PROMPT ====================================================================
SELECT 'TABLES CREATED: ' || COUNT(*) FROM user_tables;
SELECT 'VIEWS CREATED: ' || COUNT(*) FROM user_views;
SELECT 'PROCEDURES/FUNCTIONS/TRIGGERS: ' || COUNT(*) FROM user_objects WHERE object_type IN ('PROCEDURE', 'FUNCTION', 'TRIGGER');
SELECT 'SAMPLE USERS: ' || COUNT(*) FROM USERS;
SELECT 'SAMPLE INCIDENTS: ' || COUNT(*) FROM INCIDENTS;
SELECT 'SAMPLE REQUESTS: ' || COUNT(*) FROM REQUESTS;
SELECT 'SAMPLE MISSIONS: ' || COUNT(*) FROM MISSIONS;

PROMPT ====================================================================
PROMPT DATABASE INITIALIZATION COMPLETE!
PROMPT ====================================================================
COMMIT;
EXIT;
