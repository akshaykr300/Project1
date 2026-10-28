"""
SQLAlchemy Model for model_versions table
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from backend.app.db.database import Base


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    version_name = Column(String(64), unique=True, nullable=False, index=True)
    file_path = Column(String(255), nullable=False)
    architecture = Column(String(128), nullable=False, default="CustomCNN_v1")
    input_shape = Column(String(32), nullable=False, default="(224, 224, 3)")
    dataset_metadata = Column(JSON, nullable=False)
    training_metrics = Column(JSON, nullable=True)
    test_metrics = Column(JSON, nullable=True)
    class_mapping = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
