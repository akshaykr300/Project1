"""
CNN Model Training Pipeline
Handles data loading, image data generators with augmentation for training split,
compilation, training loop, callbacks, saving model weights, and registering model version.
"""
import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Callable, Optional
import numpy as np
from PIL import Image

logger = logging.getLogger("fake_upi_shield.ml.train")


def train_cnn_pipeline(
    dataset_root: str = "data/dataset",
    output_dir: str = "backend/app/ml/weights",
    epochs: int = 10,
    batch_size: int = 16,
    learning_rate: float = 0.001,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    progress_callback: Optional[Callable[[int, int, float, str], None]] = None
) -> Dict[str, Any]:
    """
    Executes end-to-end CNN training with validation and held-out test evaluation.
    """
    from backend.app.ml.dataset import split_dataset, get_dataset_summary
    from backend.app.ml.model import build_upi_cnn_model, TENSORFLOW_AVAILABLE
    from backend.app.ml.evaluate import evaluate_model_on_test_set

    if not TENSORFLOW_AVAILABLE:
        raise RuntimeError("TensorFlow is not available. Please install tensorflow in Python environment.")

    import tensorflow as tf

    summary = get_dataset_summary(dataset_root)
    if not summary["dataset_ready"]:
        raise ValueError(
            f"Cannot train: insufficient dataset samples (genuine: {summary['genuine_count']}, "
            f"suspicious: {summary['suspicious_count']}). Need at least 10 samples per class."
        )

    splits = split_dataset(dataset_root, train_ratio, val_ratio, test_ratio)
    train_items = splits["train"]
    val_items = splits["val"]
    test_items = splits["test"]

    os.makedirs(output_dir, exist_ok=True)
    target_size = (224, 224)

    # Load arrays into memory for training
    def load_arrays(items):
        X = []
        Y = []
        for fpath, label in items:
            try:
                with Image.open(fpath) as img:
                    if img.mode != "RGB":
                        img = img.convert("RGB")
                    resized = img.resize(target_size, Image.Resampling.BILINEAR)
                    X.append(np.array(resized, dtype=np.float32) / 255.0)
                    # One-hot encode: 0 -> [1, 0], 1 -> [0, 1]
                    Y.append([1.0, 0.0] if label == 0 else [0.0, 1.0])
            except Exception as e:
                logger.warning(f"Error loading {fpath}: {e}")
        return np.array(X, dtype=np.float32), np.array(Y, dtype=np.float32)

    X_train, Y_train = load_arrays(train_items)
    X_val, Y_val = load_arrays(val_items)

    if len(X_train) == 0 or len(X_val) == 0:
        raise RuntimeError("Failed to load valid training or validation image tensors.")

    # Build model
    model = build_upi_cnn_model(input_shape=(224, 224, 3), num_classes=2)
    optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(
        optimizer=optimizer,
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    # Training loop with epoch logging
    logs = []
    for epoch in range(1, epochs + 1):
        hist = model.fit(
            X_train, Y_train,
            validation_data=(X_val, Y_val),
            batch_size=batch_size,
            epochs=1,
            verbose=0
        )
        t_loss = float(hist.history["loss"][0])
        t_acc = float(hist.history["accuracy"][0])
        v_loss = float(hist.history["val_loss"][0])
        v_acc = float(hist.history["val_accuracy"][0])

        log_line = f"Epoch {epoch}/{epochs} - loss: {t_loss:.4f} - acc: {t_acc:.4f} - val_loss: {v_loss:.4f} - val_acc: {v_acc:.4f}"
        logs.append(log_line)
        logger.info(log_line)

        pct = round((epoch / epochs) * 100, 2)
        if progress_callback:
            progress_callback(epoch, epochs, pct, log_line)

    # Save model weights and metadata
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    version_name = f"fake_upi_cnn_{timestamp_str}"
    model_save_path = os.path.join(output_dir, "fake_upi_cnn_active.keras")
    versioned_save_path = os.path.join(output_dir, f"{version_name}.keras")

    model.save(model_save_path)
    model.save(versioned_save_path)

    class_mapping = {"0": "genuine", "1": "suspicious"}
    mapping_path = os.path.join(output_dir, "class_mapping.json")
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump(class_mapping, f, indent=2)

    # Evaluate on held-out test split
    test_results = evaluate_model_on_test_set(model, test_items, target_size)

    return {
        "success": True,
        "version_name": version_name,
        "model_file_path": model_save_path,
        "training_epochs": epochs,
        "final_train_accuracy": t_acc,
        "final_val_accuracy": v_acc,
        "test_metrics": test_results,
        "logs": "\n".join(logs)
    }
