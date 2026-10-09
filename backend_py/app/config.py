import os

class Settings:
    PROJECT_NAME: str = "Urban Disaster Relief and Resource Management System (UDRRMS)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "udrrms_super_secure_secret_key_disaster_ops_2026_jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Target Oracle Database Connection
    ORACLE_USER: str = os.getenv("ORACLE_USER", "system")
    ORACLE_PASSWORD: str = os.getenv("ORACLE_PASSWORD", "oracle")
    ORACLE_HOST: str = os.getenv("ORACLE_HOST", "localhost")
    ORACLE_PORT: str = os.getenv("ORACLE_PORT", "1521")
    ORACLE_SERVICE: str = os.getenv("ORACLE_SERVICE", "xe")
    
    # Primary DB Target: Oracle. Development Fallback: SQLite
    USE_SQLITE_DEV: bool = os.getenv("USE_SQLITE_DEV", "true").lower() in ("true", "1", "yes")
    SQLITE_URL: str = "sqlite:///./udrrms.db"

    @property
    def DATABASE_URL(self) -> str:
        if self.USE_SQLITE_DEV:
            return self.SQLITE_URL
        return f"oracle+oracledb://{self.ORACLE_USER}:{self.ORACLE_PASSWORD}@{self.ORACLE_HOST}:{self.ORACLE_PORT}/?service_name={self.ORACLE_SERVICE}"

settings = Settings()
