"""Keep the API suite isolated from the user's configured application database."""

import os
import tempfile
import uuid
from pathlib import Path

_test_database = Path(tempfile.gettempdir()) / f"udrrms-pytest-{uuid.uuid4().hex}.sqlite"
os.environ["DATABASE_FILE"] = str(_test_database)

# Some persistence tests open settings.DB_FILE directly instead of using the
# SQLAlchemy engine, so keep that value aligned with the disposable test file.
from app.config import settings

settings.DB_FILE = _test_database


def pytest_sessionstart(session):
    from app.database import Base, engine
    from app.seed.seeder import seed_database

    Base.metadata.create_all(bind=engine)
    seed_database()


def pytest_sessionfinish(session, exitstatus):
    from app.database import engine

    engine.dispose()
    for suffix in ("", "-wal", "-shm"):
        try:
            Path(f"{_test_database}{suffix}").unlink(missing_ok=True)
        except OSError:
            # Windows may briefly retain a file handle at interpreter shutdown.
            pass
