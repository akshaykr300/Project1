"""
Training Management API Routes
Dataset inspection, background job triggering, status monitoring, and job history.
"""
import uuid
import threading
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List, Dict, Any

from backend.app.core.config import get_settings
from backend.app.db.database import get_db, SessionLocal
from backend.app.models.training_job import TrainingJob
from backend.app.models.model_version import ModelVersion
from backend.app.schemas.history import TrainingDatasetStatus, TrainingStartRequest, TrainingJobStatusResponse
from backend.app.ml.dataset import get_dataset_summary

router = APIRouter(tags=["Training"])
settings = get_settings()

# In-memory job registry for environments where background task executes
_JOB_STATUS_CACHE: Dict[str, Dict[str, Any]] = {}
_ACTIVE_TRAINING_LOCK = threading.Lock()


@router.get("/training/dataset", response_model=TrainingDatasetStatus)
def check_training_dataset():
    """Audits local dataset directories and sample counts."""
    summary = get_dataset_summary(settings.DATASET_ROOT)
    return TrainingDatasetStatus(
        dataset_ready=summary["dataset_ready"],
        genuine_count=summary["genuine_count"],
        suspicious_count=summary["suspicious_count"],
        total_samples=summary["total_samples"],
        dataset_path=summary["dataset_path"],
        class_imbalance_ratio=summary["class_imbalance_ratio"],
        warnings=summary["warnings"]
    )


def run_training_worker(job_id: str, request_params: Dict[str, Any]):
    """Background worker for CNN model training."""
    from backend.app.ml.train import train_cnn_pipeline

    def progress_callback(epoch: int, total: int, pct: float, log_line: str):
        if job_id in _JOB_STATUS_CACHE:
            _JOB_STATUS_CACHE[job_id]["current_epoch"] = epoch
            _JOB_STATUS_CACHE[job_id]["total_epochs"] = total
            _JOB_STATUS_CACHE[job_id]["progress_percent"] = pct
            current_logs = _JOB_STATUS_CACHE[job_id].get("logs", "")
            _JOB_STATUS_CACHE[job_id]["logs"] = current_logs + log_line + "\n"

    try:
        _JOB_STATUS_CACHE[job_id]["status"] = "RUNNING"
        _JOB_STATUS_CACHE[job_id]["started_at"] = datetime.utcnow().isoformat() + "Z"

        result = train_cnn_pipeline(
            dataset_root=settings.DATASET_ROOT,
            epochs=request_params.get("epochs", 10),
            batch_size=request_params.get("batch_size", 16),
            learning_rate=request_params.get("learning_rate", 0.001),
            train_ratio=request_params.get("train_split", 0.70),
            val_ratio=request_params.get("val_split", 0.15),
            test_ratio=request_params.get("test_split", 0.15),
            progress_callback=progress_callback
        )

        _JOB_STATUS_CACHE[job_id]["status"] = "COMPLETED"
        _JOB_STATUS_CACHE[job_id]["progress_percent"] = 100.0
        _JOB_STATUS_CACHE[job_id]["model_version_name"] = result["version_name"]
        _JOB_STATUS_CACHE[job_id]["completed_at"] = datetime.utcnow().isoformat() + "Z"

    except Exception as exc:
        _JOB_STATUS_CACHE[job_id]["status"] = "FAILED"
        _JOB_STATUS_CACHE[job_id]["error_details"] = str(exc)
        _JOB_STATUS_CACHE[job_id]["completed_at"] = datetime.utcnow().isoformat() + "Z"


@router.post("/training/start", response_model=TrainingJobStatusResponse)
def start_model_training(
    req: TrainingStartRequest,
    background_tasks: BackgroundTasks,
    db: Optional[Session] = Depends(get_db) if SessionLocal else None
):
    """Initiates a background training job after validating dataset prerequisites."""
    summary = get_dataset_summary(settings.DATASET_ROOT)
    if not summary["dataset_ready"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Dataset not ready: found {summary['genuine_count']} genuine and "
                f"{summary['suspicious_count']} suspicious images. At least 10 samples per class are required."
            )
        )

    # Check for active running job
    for jid, data in _JOB_STATUS_CACHE.items():
        if data.get("status") in ("RUNNING", "PENDING"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A training job ({jid}) is already currently executing."
            )

    job_id = f"job_trn_{uuid.uuid4().hex[:8]}"
    _JOB_STATUS_CACHE[job_id] = {
        "job_id": job_id,
        "status": "PENDING",
        "current_epoch": 0,
        "total_epochs": req.epochs,
        "progress_percent": 0.0,
        "logs": "Training job queued...\n",
        "error_details": None,
        "model_version_name": None,
        "started_at": None,
        "completed_at": None
    }

    # Queue background task
    background_tasks.add_task(run_training_worker, job_id, req.dict())

    # Optional DB record
    if db is not None:
        try:
            db_job = TrainingJob(
                job_id=job_id,
                status="PENDING",
                dataset_config=req.dict(),
                total_epochs=req.epochs,
                progress_percent=0.0,
                logs="Queued"
            )
            db.add(db_job)
            db.commit()
        except Exception:
            db.rollback()

    return TrainingJobStatusResponse(**_JOB_STATUS_CACHE[job_id])


@router.get("/training/{job_id}", response_model=TrainingJobStatusResponse)
def get_training_job_status(job_id: str):
    """Retrieves real-time status and logs for a specific training job."""
    if job_id not in _JOB_STATUS_CACHE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Training job {job_id} not found.")
    return TrainingJobStatusResponse(**_JOB_STATUS_CACHE[job_id])


@router.get("/training/jobs")
def list_training_jobs():
    """Lists recent training jobs."""
    jobs_list = list(_JOB_STATUS_CACHE.values())
    return {"jobs": jobs_list, "total": len(jobs_list)}
