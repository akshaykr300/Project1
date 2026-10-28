"""
History API Routes
Paginated history retrieval, single analysis detail, and explicit user-driven deletion.
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
import math

from backend.app.db.database import get_db, SessionLocal
from backend.app.models.analysis import AnalysisHistory
from backend.app.schemas.history import HistoryListResponse, HistoryItem

router = APIRouter(tags=["History"])


@router.get("/history", response_model=HistoryListResponse)
def get_analysis_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    assessment: Optional[str] = Query(None),
    db: Optional[Session] = Depends(get_db) if SessionLocal else None
):
    """Returns paginated analysis history from MySQL."""
    if db is None:
        return HistoryListResponse(items=[], total_count=0, page=page, page_size=page_size, total_pages=0)

    query = db.query(AnalysisHistory)
    if assessment:
        query = query.filter(AnalysisHistory.assessment == assessment)

    total_count = query.count()
    offset = (page - 1) * page_size
    records = query.order_by(desc(AnalysisHistory.created_at)).offset(offset).limit(page_size).all()

    items: List[HistoryItem] = []
    for r in records:
        items.append(HistoryItem(
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

    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 0

    return HistoryListResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/history/{analysis_id}")
def get_analysis_detail(
    analysis_id: str,
    db: Optional[Session] = Depends(get_db) if SessionLocal else None
):
    """Retrieves complete details for a single analysis record."""
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="MySQL database is not connected.")

    record = db.query(AnalysisHistory).filter(AnalysisHistory.analysis_id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")

    return {
        "analysis_id": record.analysis_id,
        "filename": record.original_filename,
        "file_hash": record.file_hash,
        "file_size_bytes": record.file_size_bytes,
        "image_dimensions": record.image_dimensions,
        "ocr_status": record.ocr_status,
        "extracted_fields": {
            "amount": record.extracted_amount,
            "upi_id": record.extracted_upi_id,
            "utr": record.extracted_utr,
            "timestamp": record.extracted_timestamp,
            "recipient_name": record.extracted_recipient,
            "status_keyword": record.extracted_status_text,
        },
        "raw_ocr_text": record.raw_ocr_text,
        "cnn_result": {
            "status": record.cnn_status,
            "prediction": record.cnn_prediction,
            "confidence": float(record.cnn_confidence) if record.cnn_confidence is not None else None,
        },
        "assessment": record.assessment,
        "reasons": record.reasons,
        "heuristic_flags": record.heuristic_flags,
        "processing_duration_ms": record.processing_duration_ms,
        "created_at": record.created_at.isoformat() if record.created_at else ""
    }


@router.delete("/history/{analysis_id}")
def delete_history_record(
    analysis_id: str,
    db: Optional[Session] = Depends(get_db) if SessionLocal else None
):
    """Permanently deletes a single analysis record after explicit user action."""
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="MySQL database is not connected.")

    record = db.query(AnalysisHistory).filter(AnalysisHistory.analysis_id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")

    db.delete(record)
    db.commit()
    return {"success": True, "message": f"Analysis record {analysis_id} deleted permanently."}
