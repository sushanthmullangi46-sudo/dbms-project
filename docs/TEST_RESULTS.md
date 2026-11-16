# UDRRMS Automated Test Results

See the current run summary in [TEST_RESULTS.md](../TEST_RESULTS.md). The pytest suite uses an isolated temporary SQLite file and removes it when the run ends.

The 35 tests cover the existing advanced API features, citizen report-to-map flow, four-role incident synchronization, persistence, workflow state transitions, transactional stock allocation, delivery receipts, role checks, shelter limits, audit logs, and analytical endpoints.

## Limits of this run

- API workflow tests use FastAPI TestClient; the React UI was build-checked but not browser-automated.
- External routing/ETA services are not configured. Tests assert that ETA is unavailable instead of accepting simulated values.
- GPS tests submit coordinates to the API. They do not exercise a physical device or browser permission prompt.
