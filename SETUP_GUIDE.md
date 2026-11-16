# UDRRMS Local Setup

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- SQLite (bundled with Python); Oracle is optional

## Install

Run from the project root:

```powershell
npm install
npm --prefix frontend install
python -m pip install -r backend_py/requirements.txt
```

The backend reads configuration from process environment variables. For a persistent local database, the default is `database/udrrms.db`. Set `DATABASE_FILE` to use another file, and set `JWT_SECRET` to a long random value before starting the backend. Set `CORS_ORIGINS` to a comma-separated list of trusted browser origins when the frontend and API use different hosts.

Oracle is selected with `USE_SQLITE_DEV=false` and `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_HOST`, `ORACLE_PORT`, and `ORACLE_SERVICE`. The Oracle-specific scripts in `database/` provide the schema and initialization material.

## Run locally

Open two terminals in the project root:

```powershell
npm run start:backend
```

```powershell
npm run start:frontend
```

The API runs at `http://127.0.0.1:8000`, Swagger is at `http://127.0.0.1:8000/docs`, and Vite prints the frontend URL (normally `http://localhost:3000`). Tables are created and the sample development dataset is seeded on backend startup. The sample records are for coursework demonstrations, not live emergency information.

To serve a built frontend through the Node gateway instead, run `npm run build` followed by `npm start`. The gateway starts or proxies the FastAPI backend and serves `frontend/dist` on port 5000 by default.

## Local development accounts

The seed script provides local-only accounts; all use password `password123`:

- Citizen: `citizen@udrrms.com`
- Officer: `officer@udrrms.com`
- Coordinator: `coordinator@udrrms.com`
- Responder: `rescue@udrrms.com`

Public registration is limited to the Citizen role. Do not expose these seeded accounts or the development JWT secret in a public deployment.

## Verification

```powershell
npm run build
npm test
```

The backend test dependencies are pinned to the Starlette/httpx compatibility range used by FastAPI's test client. Use a clean virtual environment and install `backend_py/requirements.txt` before running the API suite.
