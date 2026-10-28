"""
Model Loading and Inference Module
Provides safe, truthful CNN predictions. If no trained weights file is present,
returns MODEL_NOT_TRAINED status and never invents synthetic predictions.
"""
import os
import json
import logging
from typing import Dict, Any, Optional
import numpy as np

logger = logging.getLogger("fake_upi_shield.ml.predict")

# Cache loaded model in memory
_CACHED_MODEL = None
_CACHED_MODEL_PATH = None
_CACHED_CLASS_MAPPING = None


def get_model_status(
    weights_path: str = "backend/app/ml/weights/fake_upi_cnn_active.keras",
    class_mapping_path: str = "backend/app/ml/weights/class_mapping.json"
) -> Dict[str, Any]:
    """
    Checks if a valid trained model file and class mapping exist on disk.
    Does not invent fake status.
    """
    weights_exist = os.path.isfile(weights_path)
    mapping_exist = os.path.isfile(class_mapping_path)

    if not weights_exist:
        return {
            "is_trained": False,
            "status": "MODEL_NOT_TRAINED",
            "weights_path": os.path.abspath(weights_path),
            "file_size_bytes": 0,
            "message": (
                "No trained CNN model found at the specified path. "
                "The system will continue using OpenCV visual preprocessing and rule-based OCR heuristics, "
                "but CNN inference will remain unexecuted until a model is trained."
            )
        }

    try:
        size = os.path.getsize(weights_path)
        mapping = {}
        if mapping_exist:
            with open(class_mapping_path, "r", encoding="utf-8") as f:
                mapping = json.load(f)

        return {
            "is_trained": True,
            "status": "READY",
            "weights_path": os.path.abspath(weights_path),
            "file_size_bytes": size,
            "class_mapping": mapping,
            "message": "Trained CNN model is available for live inference."
        }
    except Exception as e:
        return {
            "is_trained": False,
            "status": "LOAD_ERROR",
            "weights_path": weights_path,
            "error_details": str(e),
            "message": f"Failed reading model weights: {e}"
        }


def load_inference_model(weights_path: str, class_mapping_path: str):
    """Safely loads Keras model from disk if available."""
    global _CACHED_MODEL, _CACHED_MODEL_PATH, _CACHED_CLASS_MAPPING

    if _CACHED_MODEL is not None and _CACHED_MODEL_PATH == weights_path:
        return _CACHED_MODEL, _CACHED_CLASS_MAPPING

    if not os.path.isfile(weights_path):
        return None, None

    try:
        import tensorflow as tf
        model = tf.keras.models.load_model(weights_path)
        mapping = {"0": "genuine", "1": "suspicious"}
        if os.path.isfile(class_mapping_path):
            with open(class_mapping_path, "r", encoding="utf-8") as f:
                mapping = json.load(f)

        _CACHED_MODEL = model
        _CACHED_MODEL_PATH = weights_path
        _CACHED_CLASS_MAPPING = mapping
        logger.info(f"Loaded CNN model from {weights_path}")
        return model, mapping
    except Exception as e:
        logger.error(f"Failed to load CNN model: {e}")
        return None, None


def predict_screenshot(
    preprocessed_tensor: np.ndarray,
    weights_path: str = "backend/app/ml/weights/fake_upi_cnn_active.keras",
    class_mapping_path: str = "backend/app/ml/weights/class_mapping.json"
) -> Dict[str, Any]:
    """
    Executes inference using the trained CNN.
    If model is missing, returns status='MODEL_NOT_TRAINED' with no fabricated predictions.
    """
    model_status = get_model_status(weights_path, class_mapping_path)
    if not model_status["is_trained"]:
        return {
            "status": "MODEL_NOT_TRAINED",
            "model_version": None,
            "prediction": None,
            "probabilities": None,
            "confidence": None,
            "disclaimer": "CNN model has not been trained on this machine yet. Inference was not executed."
        }

    model, mapping = load_inference_model(weights_path, class_mapping_path)
    if model is None:
        return {
            "status": "INFERENCE_FAILED",
            "model_version": None,
            "prediction": None,
            "probabilities": None,
            "confidence": None,
            "disclaimer": "Model could not be loaded into memory."
        }

    try:
        # Validate input shape: (1, 224, 224, 3)
        if preprocessed_tensor.shape != (1, 224, 224, 3):
            raise ValueError(f"Unexpected tensor shape {preprocessed_tensor.shape}. Expected (1, 224, 224, 3).")

        raw_preds = model.predict(preprocessed_tensor, verbose=0)[0]
        prob_genuine = float(raw_preds[0])
        prob_suspicious = float(raw_preds[1])

        predicted_class = "suspicious" if prob_suspicious > prob_genuine else "genuine"
        confidence = prob_suspicious if predicted_class == "suspicious" else prob_genuine

        return {
            "status": "INFERENCE_SUCCESS",
            "model_version": os.path.basename(weights_path),
            "prediction": predicted_class,
            "probabilities": {
                "genuine": round(prob_genuine, 4),
                "suspicious": round(prob_suspicious, 4)
            },
            "confidence": round(confidence, 4),
            "disclaimer": "Trained CNN classification indicates statistical similarity to training data; it does not constitute bank verification."
        }
    except Exception as e:
        logger.error(f"Inference prediction error: {e}")
        return {
            "status": "INFERENCE_FAILED",
            "model_version": os.path.basename(weights_path),
            "error_details": str(e),
            "prediction": None,
            "probabilities": None,
            "confidence": None,
            "disclaimer": f"Inference execution failed: {str(e)}"
        }
