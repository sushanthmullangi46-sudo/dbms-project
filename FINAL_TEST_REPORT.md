# UDRRMS / UDR-ORP: AUTOMATED TEST EXECUTION REPORT

**Project**: Urban Disaster Response & Relief Management System (UDRRMS / UDR-ORP)  
**Test Framework**: Pytest 9.2.0 + Python 3.13 + FastAPI TestClient  
**Execution Timestamp**: November 10, 2026  
**Total Tests**: 27  
**Passed**: 27 (100%)  
**Failed**: 0 (0%)  
**Status**: **ALL TESTS PASSED**  

---

## 1. Test Execution Summary

```
============================= test session starts =============================
platform win32 -- Python 3.13.6, pytest-9.2.0, pluggy-1.7.0
rootdir: C:\Users\mdpul\OneDrive\Desktop\DBMS PROJECT
plugins: anyio-4.11.0
collected 27 items

backend_py/tests/test_e2e_reporting_and_map.py::TestE2EReportingAndMap::test_e2e_citizen_report_to_officer_queue_and_map PASSED [  3%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_01_create_citizen_and_verify_account_persists PASSED [  7%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_02_submit_report_and_verify_it_remains PASSED [ 11%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_03_close_reopen_session_and_verify_report_available PASSED [ 14%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_04_stop_restart_backend_and_verify_records_remain PASSED [ 18%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_05_disk_persistence_shutdown_restart_computer_simulation PASSED [ 22%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_06_update_disaster_report_and_verify_persists_after_refresh PASSED [ 25%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_07_allocate_resources_restart_and_verify_inventory PASSED [ 29%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_08_assign_rescue_team_login_as_team_and_verify_assignment PASSED [ 33%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_09_login_as_administrator_and_verify_all_reports_visible PASSED [ 37%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_10_verify_no_duplicate_records_on_refresh PASSED [ 40%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_11_verify_isolation_modifying_one_record_does_not_affect_others PASSED [ 44%]
backend_py/tests/test_persistence_sync_12_tests.py::TestMandatoryPersistenceAndSynchronization::test_12_verify_migrations_and_restarts_do_not_reset_data PASSED [ 48%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_01_citizen_report_submission PASSED [ 51%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_02_report_verification_and_rejection PASSED [ 55%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_03_invalid_state_transitions PASSED [ 59%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_04_severity_assessment_and_override PASSED [ 62%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_05_duplicate_report_handling PASSED [ 66%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_06_team_assignment_and_lifecycle PASSED [ 70%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_07_insufficient_warehouse_stock PASSED [ 74%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_08_transactional_stock_allocation PASSED [ 77%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_09_duplicate_delivery_confirmation PASSED [ 81%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_10_shelter_capacity_enforcement PASSED [ 85%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_11_role_based_access_control PASSED [ 88%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_12_incident_closure_validation PASSED [ 92%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_13_incident_escalation_and_analytics PASSED [ 96%]
backend_py/tests/test_workflow.py::TestUDRRMSWorkflow::test_14_audit_event_generation PASSED [100%]

====================== 27 passed, 132 warnings in 11.67s ======================
```

---

## 2. Test Cases Specification & Verification Matrix

| Test Case ID | Test Suite | Test Scenario / Objective | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-E2E-01** | `test_e2e_reporting_and_map` | Complete flow: Citizen submission &rarr; Officer queue &rarr; GIS marker &rarr; Verification &rarr; Supplemental update | Report creates incident; marker visible on map; officer verifies report | HTTP 201 on submit, HTTP 200 on queue/map/verify/update | **PASSED** |
| **TC-PERS-01** | `test_persistence_sync` | Create citizen account and verify account persistence | Account readable in persistent DB | Account exists in DB with hashed password | **PASSED** |
| **TC-PERS-02** | `test_persistence_sync` | Submit disaster report and verify persistence | Report record stored on disk | Report retrieved with generated reference code | **PASSED** |
| **TC-PERS-03** | `test_persistence_sync` | Close & reopen database session and verify report availability | Report remains available after session reset | Verified report intact across sessions | **PASSED** |
| **TC-PERS-04** | `test_persistence_sync` | Stop & restart backend engine and verify data persistence | All data tables persist without data loss | All 27 tables contain identical record counts | **PASSED** |
| **TC-PERS-05** | `test_persistence_sync` | Computer shutdown simulation (unmount DB file & reconnect) | Database engine mounts without corruption | DB reopens cleanly with integrity check ok | **PASSED** |
| **TC-PERS-06** | `test_persistence_sync` | Update disaster report and verify persistence after refresh | Status change remains persistent | Report status remains `VERIFIED` after reload | **PASSED** |
| **TC-PERS-07** | `test_persistence_sync` | Allocate resources, restart backend, and verify inventory balance | Stock reservation preserved after restart | Available stock reflects deduction; reserved reflects increment | **PASSED** |
| **TC-PERS-08** | `test_persistence_sync` | Assign rescue team, login as team, verify assignment | Team sees assigned mission in their queue | Mission visible under team profile | **PASSED** |
| **TC-PERS-09** | `test_persistence_sync` | Login as administrator and verify visibility of all reports | Complete cross-sector report visibility | Officer receives full list across all wards | **PASSED** |
| **TC-PERS-10** | `test_persistence_sync` | Verify no duplicate records created on rapid consecutive page refreshes | No redundant records generated | Query count before == query count after 5 refreshes | **PASSED** |
| **TC-PERS-11** | `test_persistence_sync` | Verify transactional record isolation (mutating one record leaves others untouched) | Neighboring records remain unchanged | Target record mutated; all other rows retain initial state | **PASSED** |
| **TC-PERS-12** | `test_persistence_sync` | Verify migration check and restart does not reset existing data | Pre-existing rows preserved | Pre-existing rows unmodified after re-seeding guard check | **PASSED** |
| **TC-WF-01** | `test_workflow` | Citizen report submission validation | HTTP 201 with reference code and SUBMITTED status | HTTP 201, `RPT-20261110-XXXXXX` generated | **PASSED** |
| **TC-WF-02** | `test_workflow` | Report verification and rejection workflow | Verification creates disaster; rejection records reason | VERIFIED transitions to ACTIVE incident; REJECTED recorded | **PASSED** |
| **TC-WF-03** | `test_workflow` | Invalid state transitions rejection (e.g. closing already closed incident) | HTTP 400 Bad Request with error detail | HTTP 400 returned with invalid transition message | **PASSED** |
| **TC-WF-04** | `test_workflow` | Severity assessment and officer override | Casualty count auto-indexes priority; officer can override | Auto-assessed P1; successfully overridden to P2 | **PASSED** |
| **TC-WF-05** | `test_workflow` | Duplicate report detection and clustering | Near-duplicate alerts cluster under master incident | Clustered under parent incident with link log | **PASSED** |
| **TC-WF-06** | `test_workflow` | Team assignment lifecycle (ASSIGNED &rarr; EN_ROUTE &rarr; ON_SCENE &rarr; COMPLETED) | Team status updates sequentially | Team moves through each stage cleanly | **PASSED** |
| **TC-WF-07** | `test_workflow` | Insufficient warehouse stock prevention | Rejects allocation when quantity requested > available | HTTP 400 Insufficient stock raised | **PASSED** |
| **TC-WF-08** | `test_workflow` | Transactional stock allocation and reservation | Available stock decreases; reserved stock increases atomically | Available -500, Reserved +500 verified | **PASSED** |
| **TC-WF-09** | `test_workflow` | Duplicate delivery confirmation prevention | Cannot deliver already completed shipment | HTTP 400 Delivery already finalized raised | **PASSED** |
| **TC-WF-10** | `test_workflow` | Shelter capacity enforcement | Rejects check-in when occupancy exceeds capacity | HTTP 400 Shelter capacity reached raised | **PASSED** |
| **TC-WF-11** | `test_workflow` | Role-based authorization enforcement | Citizens cannot access officer/admin endpoints | HTTP 403 Forbidden raised for citizen | **PASSED** |
| **TC-WF-12** | `test_workflow` | Incident closure audit validation | Validates all checklist items before allowing closure | All tasks verified complete; incident marked CLOSED | **PASSED** |
| **TC-WF-13** | `test_workflow` | Incident escalation and analytics integration | Escalation updates analytics dashboard immediately | Escalation flag set; analytics dashboard reflects state | **PASSED** |
| **TC-WF-14** | `test_workflow` | System audit trail generation | Operations record immutable audit logs with timestamps | Audit logs verified for verification, dispatch, and closure | **PASSED** |
