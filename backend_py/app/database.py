from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings
import logging

logger = logging.getLogger("udrrms.database")

# Engine initialization
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=False,
        future=True
    )
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Connected to database engine successfully: {settings.DATABASE_URL}")
except Exception as e:
    logger.warning(f"Target Oracle database connection failed: {e}. Falling back to SQLite development adapter.")
    engine = create_engine(
        settings.SQLITE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
        future=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
