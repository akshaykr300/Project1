"""
SQLAlchemy Model for training_jobs table
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(32), nullable=False, default="PENDING", index=True)
    dataset_config = Column(JSON, nullable=False)
    current_epoch = Column(Integer, default=0, nullable=False)
    total_epochs = Column(Integer, default=10, nullable=False)
    progress_percent = Column(Numeric(5, 2), default=0.00, nullable=False)
    logs = Column(Text, nullable=True)
    error_details = Column(Text, nullable=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id", ondelete="SET NULL"), nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    model_version = relationship("ModelVersion", backref="training_jobs")
