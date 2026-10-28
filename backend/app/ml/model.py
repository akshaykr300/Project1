"""
CNN Architecture Definition for Fake UPI Screenshot Detection
Uses TensorFlow / Keras to construct a deep convolutional neural network
with Batch Normalization, Dropout, and Binary Classification head.
"""
from typing import Tuple, Optional
import logging

logger = logging.getLogger("fake_upi_shield.ml.model")

try:
    import tensorflow as tf
    from tensorflow.keras import layers, models, regularizers
    TENSORFLOW_AVAILABLE = True
except ImportError:
    tf = None
    layers = None
    models = None
    regularizers = None
    TENSORFLOW_AVAILABLE = False


def build_upi_cnn_model(
    input_shape: Tuple[int, int, int] = (224, 224, 3),
    num_classes: int = 2,
    dropout_rate: float = 0.3
) -> Optional[Any]:
    """
    Constructs a convolutional network designed to capture font edge anomalies,
    jpeg compression artifacts, and layout boundary irregularities.
    """
    if not TENSORFLOW_AVAILABLE:
        raise RuntimeError("TensorFlow is not installed in the environment. Install with: pip install tensorflow")

    model = models.Sequential([
        # Input Layer
        layers.Input(shape=input_shape),

        # Block 1 - Low level edge and font gradient features
        layers.Conv2D(32, (3, 3), padding="same", activation="relu"),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), padding="same", activation="relu"),
        layers.MaxPooling2D(pool_size=(2, 2)),
        layers.Dropout(dropout_rate * 0.5),

        # Block 2 - Text block and spacing patterns
        layers.Conv2D(64, (3, 3), padding="same", activation="relu"),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), padding="same", activation="relu"),
        layers.MaxPooling2D(pool_size=(2, 2)),
        layers.Dropout(dropout_rate * 0.75),

        # Block 3 - Layout composition and tampering boundary artifacts
        layers.Conv2D(128, (3, 3), padding="same", activation="relu"),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), padding="same", activation="relu"),
        layers.MaxPooling2D(pool_size=(2, 2)),
        layers.Dropout(dropout_rate),

        # Dense Classifier Head
        layers.GlobalAveragePooling2D(),
        layers.Dense(128, activation="relu", kernel_regularizer=regularizers.l2(1e-4)),
        layers.BatchNormalization(),
        layers.Dropout(dropout_rate),
        layers.Dense(num_classes, activation="softmax", name="classification_output")
    ], name="FakeUPIShieldCNN")

    return model
