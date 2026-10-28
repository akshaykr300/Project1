"""
SQLAlchemy Model for analysis_history table
"""
from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, String, DateTime, Text, JSON, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    analysis_id = Column(String(64), unique=True, nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)
    file_size_bytes = Column(Integer, nullable=False)
    image_dimensions = Column(String(32), nullable=False)
    ocr_status = Column(String(32), nullable=False, default="SUCCESS")
    extracted_amount = Column(String(64), nullable=True)
    extracted_upi_id = Column(String(128), nullable=True)
    extracted_utr = Column(String(64), nullable=True)
    extracted_timestamp = Column(String(128), nullable=True)
    extracted_recipient = Column(String(128), nullable=True)
    extracted_status_text = Column(String(64), nullable=True)
    raw_ocr_text = Column(Text, nullable=True)
    cnn_status = Column(String(32), nullable=False, default="MODEL_NOT_TRAINED")
    model_version_id = Column(Integer, ForeignKey("model_versions.id", ondelete="SET NULL"), nullable=True)
    cnn_prediction = Column(String(32), nullable=True)
    cnn_confidence = Column(Numeric(5, 4), nullable=True)
    assessment = Column(String(32), nullable=False, default="INCONCLUSIVE", index=True)
    reasons = Column(JSON, nullable=False)
    heuristic_flags = Column(JSON, nullable=False)
    processing_duration_ms = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    model_version = relationship("ModelVersion", backref="analyses")
