from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from app.config import settings
from app.database import Base, engine
from app.seed.seeder import seed_database
import logging

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("udrrms.main")

# Lifespan startup handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing UDRRMS Database Tables & Sequences...")
    Base.metadata.create_all(bind=engine)
    logger.info("Verifying seed baseline dataset...")
    seed_database()
    logger.info("UDRRMS FastAPI Service is ready and operational.")
    yield
    logger.info("Shutting down UDRRMS FastAPI Service...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
## Urban Disaster Relief and Resource Management System (UDRRMS)
Enterprise multi-agency disaster response, incident verification, severity assessment,
rescue team dispatch, resource allocation, evacuation, and shelter management platform.

### Sequential 13-Stage Disaster Workflow:
1. **Stage 1:** Disaster Report Submitted (`SUBMITTED`)
2. **Stage 2:** Report Verification (`VERIFIED`, `REJECTED`, `AWAITING_INFORMATION`)
3. **Stage 3:** Severity Assessment (P1-P4 explainable scoring & override)
4. **Stage 4:** Incident Activation (`ACTIVE`)
5. **Stage 5:** Emergency Resource Assessment (`PENDING_APPROVAL`)
6. **Stage 6:** Rescue Team Assignment (`ASSIGNED` -> `ACKNOWLEDGED` -> `EN_ROUTE` -> `ON_SCENE` -> `COMPLETED`)
7. **Stage 7:** Resource Approval and Allocation (Transactional stock reservation)
8. **Stage 8:** Dispatch and Delivery Tracking (`PREPARING` -> `DISPATCHED` -> `IN_TRANSIT` -> `DELIVERED`)
9. **Stage 9:** Evacuation and Shelter Management (Capacity enforcement)
10. **Stage 10:** Medical Assistance (Hospital referrals)
11. **Stage 11:** Incident Monitoring and Escalation
12. **Stage 12:** Recovery and Incident Closure (Validation checklist)
13. **Stage 13:** Post-Incident Analytics (KPIs, Charts, CSV export)
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.use_cors = True
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from app.routers import (
    auth, reports, verification, incidents, teams,
    resources, deliveries, shelters, medical, analytics, map_nodes
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(verification.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(teams.router, prefix=settings.API_V1_STR)
app.include_router(resources.router, prefix=settings.API_V1_STR)
app.include_router(deliveries.router, prefix=settings.API_V1_STR)
app.include_router(shelters.router, prefix=settings.API_V1_STR)
app.include_router(medical.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(map_nodes.router, prefix=settings.API_V1_STR)

@app.get(f"{settings.API_V1_STR}/dashboard", tags=["Operational Analytics & Post-Incident Intelligence"])
def top_level_dashboard(
    current_user = Depends(auth.get_current_user),
    db = Depends(analytics.get_db)
):
    return analytics.get_dashboard_alias(current_user, db)

@app.get("/", tags=["System Status"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "target_db": "Oracle Database (with SQLite Adapter)"
    }

@app.get("/health", tags=["System Status"])
def health():
    return {
        "status": "UP",
        "timestamp": datetime.utcnow().isoformat() if "datetime" in globals() else "2026-10-09T21:30:00Z",
        "service": "UDRRMS FastAPI Backend Engine"
    }
