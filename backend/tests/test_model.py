"""
Unit Tests for Machine Learning Prediction and Status Reporting
"""
import pytest
import numpy as np
from backend.app.ml.predict import get_model_status, predict_screenshot


def test_get_model_status_when_weights_missing():
    """Confirms get_model_status accurately reports MODEL_NOT_TRAINED instead of fabricating metrics."""
    status = get_model_status("non_existent_weights_path.keras")
    assert status["is_trained"] is False
    assert status["status"] == "MODEL_NOT_TRAINED"
    assert "No trained CNN model found" in status["message"]


def test_predict_screenshot_when_model_not_trained():
    """Confirms inference returns MODEL_NOT_TRAINED without throwing unhandled exceptions."""
    dummy_tensor = np.zeros((1, 224, 224, 3), dtype=np.float32)
    res = predict_screenshot(dummy_tensor, weights_path="non_existent_weights_path.keras")
    assert res["status"] == "MODEL_NOT_TRAINED"
    assert res["prediction"] is None
    assert res["probabilities"] is None
    assert "CNN model has not been trained" in res["disclaimer"]
