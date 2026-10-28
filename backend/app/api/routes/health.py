"""
Health Check and Environment Verification Routes
"""
from fastapi import APIRouter
from backend.app.core.config import get_settings
from backend.app.db.database import check_database_connection
from backend.app.services.ocr import check_tesseract_installation
from backend.app.ml.predict import get_model_status

router = APIRouter(tags=["Health"])
settings = get_settings()


@router.get("/health")
def get_system_health():
    """Overall application health and dependency statuses."""
    db_info = check_database_connection()
    tess_info = check_tesseract_installation(settings.TESSERACT_CMD)
    model_info = get_model_status(settings.MODEL_WEIGHTS_PATH, settings.CLASS_MAPPING_PATH)

    overall_status = "HEALTHY" if db_info.get("connected") else "DEGRADED"

    return {
        "status": overall_status,
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database": db_info,
        "tesseract_ocr": tess_info,
        "cnn_model": model_info
    }


@router.get("/health/database")
def get_database_health():
    """Detailed live MySQL connectivity and table presence audit."""
    return check_database_connection()
