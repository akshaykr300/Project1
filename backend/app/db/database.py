"""
Database Engine and Session Configuration
Provides SQLAlchemy base, engine creation, and MySQL connection health verification.
"""
import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import get_settings

logger = logging.getLogger("fake_upi_shield.database")

settings = get_settings()

# Engine created with pooling and pre-ping to handle disconnected MySQL threads
try:
    engine = create_engine(
        settings.database_url,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_pre_ping=True,
        echo=False
    )
except Exception as e:
    logger.warning(f"Could not initialize MySQL engine with configured URL: {e}")
    # Fallback dummy engine handle if environment credentials are not yet configured
    engine = None

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for injecting database session into FastAPI routes."""
    if SessionLocal is None:
        raise RuntimeError("Database engine is not initialized. Please verify your MySQL configuration in backend/.env")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> dict:
    """Verifies live MySQL connectivity and validates presence of required tables."""
    if engine is None:
        return {
            "connected": False,
            "status": "ENGINE_UNINITIALIZED",
            "message": "Database engine not initialized. Check DB_HOST, DB_USER, DB_PASSWORD in backend/.env",
            "tables_found": []
        }
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).scalar()
            tables_result = connection.execute(text("SHOW TABLES;"))
            tables = [row[0] for row in tables_result.fetchall()]

            required_tables = ["analysis_history", "model_versions", "training_jobs"]
            missing_tables = [t for t in required_tables if t not in tables]

            return {
                "connected": result == 1,
                "status": "HEALTHY" if not missing_tables else "MISSING_TABLES",
                "database_name": settings.DB_NAME,
                "host": settings.DB_HOST,
                "port": settings.DB_PORT,
                "tables_found": tables,
                "missing_tables": missing_tables,
                "message": "Connected successfully to MySQL" if not missing_tables else f"Connected to MySQL, but missing tables: {', '.join(missing_tables)}. Run database/schema.sql."
            }
    except Exception as exc:
        logger.error(f"MySQL connection failed: {exc}")
        return {
            "connected": False,
            "status": "CONNECTION_FAILED",
            "error_type": type(exc).__name__,
            "message": str(exc),
            "hint": "Ensure MySQL Server is running on your host machine and database/schema.sql has been executed."
        }
