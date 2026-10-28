"""
Pydantic schemas for analysis history, dashboard statistics, training jobs, and system health
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class HistoryItem(BaseModel):
    id: int
    analysis_id: str
    original_filename: str
    file_hash: str
    file_size_bytes: int
    image_dimensions: str
    assessment: str
    ocr_status: str
    extracted_amount: Optional[str] = None
    extracted_upi_id: Optional[str] = None
    extracted_utr: Optional[str] = None
    extracted_recipient: Optional[str] = None
    cnn_status: str
    cnn_prediction: Optional[str] = None
    cnn_confidence: Optional[float] = None
    reasons: List[str]
    processing_duration_ms: int
    created_at: str

    class Config:
        from_attributes = True


class HistoryListResponse(BaseModel):
    items: List[HistoryItem]
    total_count: int
    page: int
    page_size: int
    total_pages: int


class DashboardStatsResponse(BaseModel):
    total_analyses: int
    suspicious_count: int
    no_obvious_issues_count: int
    inconclusive_count: int
    analysis_incomplete_count: int
    suspicious_rate_percentage: float
    recent_activity: List[HistoryItem]
    model_active: bool
    active_model_version: Optional[str] = None
    database_connected: bool


class TrainingDatasetStatus(BaseModel):
    dataset_ready: bool
    genuine_count: int
    suspicious_count: int
    total_samples: int
    dataset_path: str
    minimum_samples_recommended: int = 50
    class_imbalance_ratio: float
    warnings: List[str] = []


class TrainingStartRequest(BaseModel):
    epochs: int = Field(10, ge=1, le=100)
    batch_size: int = Field(16, ge=4, le=128)
    learning_rate: float = Field(0.001, gt=0, le=0.1)
    train_split: float = Field(0.70, gt=0.4, lt=0.9)
    val_split: float = Field(0.15, gt=0.05, lt=0.4)
    test_split: float = Field(0.15, gt=0.05, lt=0.4)


class TrainingJobStatusResponse(BaseModel):
    job_id: str
    status: str
    current_epoch: int
    total_epochs: int
    progress_percent: float
    logs: Optional[str] = None
    error_details: Optional[str] = None
    model_version_name: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class SystemHealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    database: Dict[str, Any]
    tesseract: Dict[str, Any]
    cnn_model: Dict[str, Any]
