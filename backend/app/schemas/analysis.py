"""
Pydantic schemas for image analysis requests, responses, and intermediate artifacts
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ExtractedFields(BaseModel):
    amount: Optional[str] = Field(None, description="Extracted payment amount, e.g. 500.00")
    currency: Optional[str] = Field("INR", description="Currency identifier")
    upi_id: Optional[str] = Field(None, description="Payee/Beneficiary UPI VPA, e.g. merchant@okhdfcbank")
    utr: Optional[str] = Field(None, description="12-digit UTR or transaction reference number")
    timestamp: Optional[str] = Field(None, description="Extracted date and time of transaction")
    recipient_name: Optional[str] = Field(None, description="Extracted payee name")
    status_keyword: Optional[str] = Field(None, description="Status text detected: Paid, Successful, Failed, Pending")
    ocr_confidence: Optional[float] = Field(None, description="Average OCR extraction confidence (0-100)")


class PreprocessingDiagnostics(BaseModel):
    original_width: int
    original_height: int
    aspect_ratio: float
    channels: int
    is_standard_mobile_ratio: bool
    contrast_score: float
    blur_score: float
    clahe_applied: bool
    status: str = "COMPLETED"


class CNNInferenceResult(BaseModel):
    status: str = Field("MODEL_NOT_TRAINED", description="MODEL_NOT_TRAINED, INFERENCE_SUCCESS, or INFERENCE_FAILED")
    model_version: Optional[str] = None
    prediction: Optional[str] = None
    probabilities: Optional[Dict[str, float]] = None
    confidence: Optional[float] = None
    disclaimer: str = "Trained classifier output is non-conclusive and requires independent bank confirmation."


class HeuristicFindings(BaseModel):
    has_valid_amount: bool
    has_valid_utr: bool
    has_upi_id: bool
    has_timestamp: bool
    suspicious_status_found: bool
    font_inconsistency_score: float
    resolution_warning: bool
    tampering_indicators: List[str] = []


class AnalysisResponse(BaseModel):
    analysis_id: str
    filename: str
    file_hash: str
    file_size_bytes: int
    image_dimensions: str
    ocr_status: str
    extracted_fields: ExtractedFields
    raw_ocr_text: Optional[str] = None
    preprocessing: PreprocessingDiagnostics
    cnn_result: CNNInferenceResult
    heuristics: HeuristicFindings
    assessment: str = Field(..., description="SUSPICIOUS, NO_OBVIOUS_ISSUES, INCONCLUSIVE, or ANALYSIS_INCOMPLETE")
    reasons: List[str]
    limitations: List[str]
    processing_duration_ms: int
    timestamp: str
    disclaimer: str = (
        "Screenshots alone cannot prove that a genuine bank transfer occurred. "
        "Always independently verify transactions in your official bank or UPI app merchant ledger."
    )
