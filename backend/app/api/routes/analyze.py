"""
Image Analysis Endpoint
Accepts multipart/form-data image upload, validates size and format,
executes preprocessing, OCR, CNN, and heuristic logic, and saves result to MySQL.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.core.config import get_settings
from backend.app.db.database import get_db, SessionLocal
from backend.app.models.analysis import AnalysisHistory
from backend.app.schemas.analysis import AnalysisResponse
from backend.app.services.preprocessing import safe_decode_image, PreprocessingError
from backend.app.services.analyzer import run_full_analysis

router = APIRouter(tags=["Analysis"])
settings = get_settings()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_payment_screenshot(
    file: UploadFile = File(...),
    db: Optional[Session] = Depends(get_db) if SessionLocal else None
):
    """
    Receives an image of a UPI payment confirmation screenshot, processes visual features,
    extracts payment fields via OCR, queries CNN inference, runs heuristic checks,
    and stores record in the database.
    """
    # 1. Validate file extension
    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.allowed_extensions_list)}."
        )

    # 2. Read bytes and check size
    image_bytes = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # 3. Safe image decoding
    try:
        rgb_image = safe_decode_image(image_bytes)
    except PreprocessingError as pe:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Image decoding error: {str(pe)}"
        )

    # 4. Execute Analysis Engine
    result = run_full_analysis(
        rgb_image=rgb_image,
        original_filename=file.filename or "uploaded_screenshot.png",
        file_bytes_len=len(image_bytes),
        tesseract_cmd=settings.TESSERACT_CMD,
        weights_path=settings.MODEL_WEIGHTS_PATH,
        class_mapping_path=settings.CLASS_MAPPING_PATH
    )

    # 5. Persist to MySQL database if connection is configured
    if db is not None:
        try:
            fields = result["extracted_fields"]
            record = AnalysisHistory(
                analysis_id=result["analysis_id"],
                original_filename=result["filename"][:255],
                file_hash=result["file_hash"],
                file_size_bytes=result["file_size_bytes"],
                image_dimensions=result["image_dimensions"],
                ocr_status=result["ocr_status"],
                extracted_amount=fields.get("amount"),
                extracted_upi_id=fields.get("upi_id"),
                extracted_utr=fields.get("utr"),
                extracted_timestamp=fields.get("timestamp"),
                extracted_recipient=fields.get("recipient_name"),
                extracted_status_text=fields.get("status_keyword"),
                raw_ocr_text=result["raw_ocr_text"],
                cnn_status=result["cnn_result"]["status"],
                cnn_prediction=result["cnn_result"].get("prediction"),
                cnn_confidence=result["cnn_result"].get("confidence"),
                assessment=result["assessment"],
                reasons=result["reasons"],
                heuristic_flags=result["heuristics"],
                processing_duration_ms=result["processing_duration_ms"]
            )
            db.add(record)
            db.commit()
        except Exception as db_err:
            # If database write fails, roll back safely but still return the analysis to the user
            db.rollback()
            result["reasons"].append(f"Note: Database persistence encountered an issue: {str(db_err)}")

    return result
