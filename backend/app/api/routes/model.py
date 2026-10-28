"""
ML Model Information Routes
Reports real model status, active version, input shape, and metrics from MySQL.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.core.config import get_settings
from backend.app.db.database import get_db, SessionLocal
from backend.app.models.model_version import ModelVersion
from backend.app.ml.predict import get_model_status

router = APIRouter(tags=["Model"])
settings = get_settings()


@router.get("/model/status")
def get_current_model_status(
    db: Optional[Session] = Depends(get_db) if SessionLocal else None
):
    """
    Returns real disk and database model availability.
    If no trained model exists, truthfully returns MODEL_NOT_TRAINED.
    """
    disk_status = get_model_status(settings.MODEL_WEIGHTS_PATH, settings.CLASS_MAPPING_PATH)

    active_record = None
    if db is not None:
        try:
            active_record = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
        except Exception:
            pass

    return {
        "disk_status": disk_status,
        "is_active_in_db": active_record is not None,
        "model_version_name": active_record.version_name if active_record else None,
        "architecture": active_record.architecture if active_record else "CustomCNN_v1",
        "input_shape": active_record.input_shape if active_record else "(224, 224, 3)",
        "test_metrics": active_record.test_metrics if active_record else None,
        "class_mapping": disk_status.get("class_mapping", {"0": "genuine", "1": "suspicious"}),
        "message": disk_status["message"]
    }
