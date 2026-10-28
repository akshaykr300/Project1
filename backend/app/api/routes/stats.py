"""
Dashboard Statistics API Routes
Provides aggregated counts backed by MySQL database.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from backend.app.db.database import get_db, SessionLocal, check_database_connection
from backend.app.models.analysis import AnalysisHistory
from backend.app.schemas.history import DashboardStatsResponse, HistoryItem
from backend.app.ml.predict import get_model_status
from backend.app.core.config import get_settings

router = APIRouter(tags=["Stats"])
settings = get_settings()


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_statistics(
    db: Optional[Session] = Depends(get_db) if SessionLocal else None
):
    """Calculates live metrics from the analysis_history table."""
    model_status = get_model_status(settings.MODEL_WEIGHTS_PATH, settings.CLASS_MAPPING_PATH)
    db_status = check_database_connection()

    if db is None or not db_status.get("connected"):
        return DashboardStatsResponse(
            total_analyses=0,
            suspicious_count=0,
            no_obvious_issues_count=0,
            inconclusive_count=0,
            analysis_incomplete_count=0,
            suspicious_rate_percentage=0.0,
            recent_activity=[],
            model_active=model_status.get("is_trained", False),
            active_model_version=model_status.get("status") if model_status.get("is_trained") else None,
            database_connected=False
        )

    total = db.query(AnalysisHistory).count()
    suspicious = db.query(AnalysisHistory).filter(AnalysisHistory.assessment == "SUSPICIOUS").count()
    no_issues = db.query(AnalysisHistory).filter(AnalysisHistory.assessment == "NO_OBVIOUS_ISSUES").count()
    inconclusive = db.query(AnalysisHistory).filter(AnalysisHistory.assessment == "INCONCLUSIVE").count()
    incomplete = db.query(AnalysisHistory).filter(AnalysisHistory.assessment == "ANALYSIS_INCOMPLETE").count()

    rate = round((suspicious / total) * 100, 2) if total > 0 else 0.0

    recent_records = db.query(AnalysisHistory).order_by(desc(AnalysisHistory.created_at)).limit(5).all()
    recent_items = []
    for r in recent_records:
        recent_items.append(HistoryItem(
            id=r.id,
            analysis_id=r.analysis_id,
            original_filename=r.original_filename,
            file_hash=r.file_hash,
            file_size_bytes=r.file_size_bytes,
            image_dimensions=r.image_dimensions,
            assessment=r.assessment,
            ocr_status=r.ocr_status,
            extracted_amount=r.extracted_amount,
            extracted_upi_id=r.extracted_upi_id,
            extracted_utr=r.extracted_utr,
            extracted_recipient=r.extracted_recipient,
            cnn_status=r.cnn_status,
            cnn_prediction=r.cnn_prediction,
            cnn_confidence=float(r.cnn_confidence) if r.cnn_confidence is not None else None,
            reasons=r.reasons if isinstance(r.reasons, list) else [],
            processing_duration_ms=r.processing_duration_ms,
            created_at=r.created_at.isoformat() if r.created_at else ""
        ))

    return DashboardStatsResponse(
        total_analyses=total,
        suspicious_count=suspicious,
        no_obvious_issues_count=no_issues,
        inconclusive_count=inconclusive,
        analysis_incomplete_count=incomplete,
        suspicious_rate_percentage=rate,
        recent_activity=recent_items,
        model_active=model_status.get("is_trained", False),
        active_model_version="CNN Active v1" if model_status.get("is_trained") else None,
        database_connected=True
    )
