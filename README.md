# Urban Disaster Response & Relief Coordination Management System (UDRRMS)

UDRRMS is a database-backed university project for coordinating citizen emergency reports, incident response teams, relief requests, warehouse inventory, and dispatch records. The local application uses a React frontend, FastAPI backend, SQLAlchemy ORM, and a persistent SQLite development database. Oracle DDL and seed scripts are also included for database coursework.

## Architecture

- **Frontend:** React, Vite, Tailwind CSS, Leaflet, and Recharts (`frontend/`).
- **Backend:** FastAPI routes, SQLAlchemy models/services, JWT authentication, and bcrypt password hashing (`backend_py/app/`).
- **Local database:** SQLite at `database/udrrms.db` by default. Set `USE_SQLITE_DEV=false` and the Oracle environment variables to select Oracle.
- **Database materials:** ORM schema and seed data in `backend_py/app/models/schema.py` and `backend_py/app/seed/seeder.py`; SQL scripts in `database/`.

The app starts the backend and UI separately. Operational screens call the API; the frontend no longer fabricates a successful login, emergency, inventory change, or GPS update when the API is unavailable. A static frontend deployment therefore needs a separately hosted API configured through `VITE_API_BASE_URL`.

## Local setup

Requirements: Node.js/npm and Python 3.11 or later.

```powershell
npm install
npm --prefix frontend install
python -m pip install -r backend_py/requirements.txt
```

Start the API and frontend in separate terminals from the project directory:

```powershell
npm run start:backend
npm run start:frontend
```

Open the Vite URL printed in the frontend terminal. The API is available at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`.

The backend creates missing tables and seeds a **local demonstration dataset** on startup. Seeded incident and warehouse records are sample coursework data, not live emergency information. The database persists between restarts. To use a different SQLite file, set `DATABASE_FILE` to its path before starting the backend. For a hosted frontend, set `VITE_API_BASE_URL` to the reachable API base, such as `https://api.example.test/api/v1`, before building.

### Local development accounts

The development seed creates these accounts with the shared password `password123`:

| Role | Email |
|---|---|
| Citizen | `citizen@udrrms.com` |
| Disaster officer | `officer@udrrms.com` |
| Coordinator | `coordinator@udrrms.com` |
| Field responder | `rescue@udrrms.com` |

These credentials and the seeded accounts are for local demonstrations only. Public registration creates citizen accounts; it cannot grant staff roles.

## Implemented workflows and current integration limits

- Citizen reports and related operational incidents/resource requests are stored in the relational database. Citizens can only list or open their own reports.
- Officers verify reports and create team assignments. Responders can update assignment state and submit GPS points using browser geolocation permission.
- Coordinators can review requests and reserve stock through the inventory workflow. Field resource requests use catalog resource IDs and are persisted for logistics review.
- Map points use incident coordinates and saved GPS records. A road-routing provider is not configured, so the system does not claim a road route or ETA. Straight-line distance is labeled as such.
- Uploaded evidence, externally hosted notifications, production account provisioning, and live GPS/route services require deployment integrations that are not configured in this repository.

## DBMS coursework materials

- [Database design and schema](DATABASE_DESIGN.md)
- [Database schema reference](DATABASE_SCHEMA.md)
- [Entity relationship diagram](ER_DIAGRAM.md)
- [Relational schema](docs/RELATIONAL_SCHEMA.md)
- [Data dictionary](docs/DATA_DICTIONARY.md)
- [API documentation](API_DOCUMENTATION.md)
- [Final project report (Markdown)](FINAL_PROJECT_REPORT/FINAL_PROJECT_REPORT.md)
- SQL DDL, seed data, views, indexes, procedures/functions, triggers, and analytical queries are in `database/`. Review `database/init_database.sql` for the initialization order and use the Oracle-specific scripts when demonstrating Oracle features.

## Useful commands

```powershell
npm run start:backend
npm run start:frontend
npm run build
npm test
```

`npm test` runs the Python pytest suite. The test harness uses and removes a temporary SQLite database instead of writing test records to the application database. See [latest test results](TEST_RESULTS.md).
