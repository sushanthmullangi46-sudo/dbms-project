# LOCAL DEVELOPMENT & ENVIRONMENT SETUP GUIDE
## Urban Disaster Response & Relief Coordination Platform (UDRRMS / UDR-ORP)

---

## 1. System Requirements & Prerequisites

Prior to starting the installation, ensure the host machine meets the following specifications:

| Component | Minimum Version | Recommended | Description |
| :--- | :--- | :--- | :--- |
| **Node.js** | v18.16.0 LTS | v20.x or higher | JavaScript runtime for Gateway & Vite |
| **npm** | v9.5.0 | v10.x | Node package manager |
| **Python** | v3.11.0 | v3.12 or v3.13 | Core backend runtime |
| **pip** | v23.0 | Latest | Python package installer |
| **Database** | SQLite 3.40+ (Included) | Oracle Database 19c/23c | Relational database engine |
| **RAM** | 4 GB | 8 GB or higher | Memory capacity for full-stack processes |
| **Disk Space** | 1.5 GB | 3 GB | Free storage for dependencies and models |

---

## 2. Step-by-Step Installation Instructions

### Step 1: Clone the Repository
```bash
git clone https://github.com/sushanthmullangi46-sudo/dbms-project.git
cd dbms-project
```

### Step 2: Install Node.js Dependencies
Install root project dependencies and frontend packages:
```bash
# Root package dependencies
npm install

# Frontend client dependencies
cd frontend
npm install
cd ..
```

### Step 3: Install Python Backend Dependencies
Install the required Python packages into your Python environment:
```bash
pip install -r backend_py/requirements.txt
```
*(Key packages installed: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `python-jose[cryptography]`, `passlib[bcrypt]`, `pytest`, `httpx`)*

### Step 4: Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
# Server Configuration
PORT=5000
BACKEND_PY_URL=http://127.0.0.1:8000

# Security Credentials
JWT_SECRET_KEY=enterprise_super_secret_jwt_signing_key_2026_udrrms
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Database Configuration (Embedded Relational SQLite Engine)
DATABASE_URL=sqlite:///./database/udrrms.db

# Optional Oracle 19c / 23c Enterprise Connection String
# ORACLE_URL=oracle+cx_oracle://udr_admin:MasterKey2026@localhost:1521/?service_name=ORCLCDB
```

---

## 3. Database Initialization & Seeding

The platform includes an embedded relational database engine pre-populated with master reference data (locations, disaster categories, warehouses, and resource catalog).

To re-initialize or verify the database:
```bash
# Execute automatic migration & seed verification
python -c "from backend_py.app.database import engine, Base; from backend_py.app.seed.seeder import seed_database; Base.metadata.create_all(bind=engine); seed_database()"
```

For **Oracle Database Enterprise** environments:
1. Connect via SQL*Plus or Oracle SQL Developer:
   ```bash
   sqlplus udr_admin/MasterKey2026@localhost:1521/ORCLCDB
   ```
2. Execute the complete DDL schema script:
   ```sql
   @database/01_udrrms_oracle_schema.sql;
   ```

---

## 4. Starting the Application

The platform features a **Single-Entry Unified Gateway** that manages both frontend static distribution and backend microservices:

```bash
# Start the unified full-stack platform
npm start
```

### Server Startup Output:
```
====================================================
URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM
Short Name: UDR-ORP Unified Gateway Service
Database: Permanent Relational SQLite (database/udrrms.db)
====================================================
[PYTHON ENGINE] Spawning FastAPI database engine on port 8000...
INFO:udrrms.main:Initializing UDRRMS Database Tables & Sequences...
INFO:udrrms.main:Verifying seed baseline dataset...
INFO:udrrms.main:UDRRMS FastAPI Service is ready and operational.
[PYTHON ENGINE] FastAPI database engine operational on http://127.0.0.1:8000!
[HTTP SERVER] Running on:
  - Localhost: http://localhost:5000
  - Direct IP: http://127.0.0.1:5000
[ENDPOINTS] Health check available at http://localhost:5000/health
```

---

## 5. Verifying Operational Endpoints

Once started, open your web browser and navigate to:

| Target Interface | URL | Function |
| :--- | :--- | :--- |
| **Full-Stack Application** | [http://localhost:5000](http://localhost:5000) | Complete 4-role portal with live switcher |
| **System Health Check** | [http://localhost:5000/health](http://localhost:5000/health) | Real-time JSON health check |
| **Swagger Interactive Docs**| [http://localhost:5000/docs](http://localhost:5000/docs) | Interactive API exploration |
| **ReDoc API Reference** | [http://localhost:5000/redoc](http://localhost:5000/redoc) | Formal API documentation |

---

## 6. Running Automated Tests

To execute the complete 27-test validation suite:
```bash
python -m pytest -o pythonpath=backend_py backend_py/tests -v
```
All 27 test cases should return `PASSED` within approximately 12 seconds.

