# UDRRMS Test Results

## Latest run

- **Result:** 35 passed, 0 failed.
- **Command:** `python -m pytest -o pythonpath=backend_py backend_py/tests -x -q --disable-warnings`
- **Runtime:** Python 3.13.6, pytest 9.2.0, FastAPI TestClient, SQLite.
- **Database:** Fresh temporary SQLite database; the test harness removes it after the run and leaves the configured application database alone.
- **Duration:** 9.23 seconds.

The suite covers citizen registration and reporting, report verification, privacy, officer/responder/coordinator authorization, SOS, mission assignment and status progression, real GPS telemetry submission, resource requests and stock reservation, delivery confirmation, shelter capacity, analytics, audit entries, and persistence checks.

The end-to-end tests run through the API using FastAPI TestClient. They do not exercise the rendered frontend in a browser, external road routing, public hosting, or real device GPS permission. The local test environment emitted deprecation warnings from the installed Python/SQLAlchemy/Starlette stack; these did not fail the suite.
