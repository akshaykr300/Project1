"""
Held-out Test Set Model Evaluation Module
Calculates precision, recall, F1-score, accuracy, and confusion matrix on unseen test split.
"""
from typing import Dict, Any, List, Tuple
import os
import numpy as np
from PIL import Image

logger = logging = __import__("logging").getLogger("fake_upi_shield.ml.evaluate")


def evaluate_model_on_test_set(
    model: Any,
    test_items: List[Tuple[str, int]],
    target_size: Tuple[int, int] = (224, 224)
) -> Dict[str, Any]:
    """
    Evaluates trained model on unseen test set items [(filepath, true_label)].
    True labels: 0 for genuine, 1 for suspicious.
    """
    if not test_items:
        return {
            "error": "No test items provided for evaluation.",
            "test_accuracy": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0
        }

    y_true = []
    y_pred = []

    for filepath, label in test_items:
        try:
            with Image.open(filepath) as img:
                if img.mode != "RGB":
                    img = img.convert("RGB")
                resized = img.resize(target_size, Image.Resampling.BILINEAR)
                tensor = np.expand_dims(np.array(resized, dtype=np.float32) / 255.0, axis=0)
                preds = model.predict(tensor, verbose=0)[0]
                pred_label = 1 if preds[1] > preds[0] else 0
                y_true.append(label)
                y_pred.append(pred_label)
        except Exception as e:
            logger.warning(f"Error evaluating test item {filepath}: {e}")

    if not y_true:
        return {"error": "Failed to read test images."}

    y_true_np = np.array(y_true)
    y_pred_np = np.array(y_pred)

    tp = int(np.sum((y_true_np == 1) & (y_pred_np == 1)))
    fp = int(np.sum((y_true_np == 0) & (y_pred_np == 1)))
    fn = int(np.sum((y_true_np == 1) & (y_pred_np == 0)))
    tn = int(np.sum((y_true_np == 0) & (y_pred_np == 0)))

    accuracy = round(float(np.mean(y_true_np == y_pred_np)), 4)
    precision = round(float(tp / max(tp + fp, 1)), 4)
    recall = round(float(tp / max(tp + fn, 1)), 4)
    f1 = round(float(2 * (precision * recall) / max(precision + recall, 1e-6)), 4)

    return {
        "test_sample_count": len(y_true),
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "confusion_matrix": {
            "true_positive": tp,
            "false_positive": fp,
            "false_negative": fn,
            "true_negative": tn
        }
    }
