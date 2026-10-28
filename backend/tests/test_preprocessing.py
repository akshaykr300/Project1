"""
Unit Tests for OpenCV / Pillow Preprocessing Service
"""
import io
import pytest
import numpy as np
from PIL import Image

from backend.app.services.preprocessing import (
    safe_decode_image,
    preprocess_for_ocr,
    preprocess_for_cnn,
    compute_blur_laplacian,
    PreprocessingError
)


def create_test_image_bytes(width=400, height=800, color=(255, 255, 255)) -> bytes:
    """Creates a sample in-memory PNG image."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_safe_decode_valid_image():
    """Confirms valid image bytes decode into expected RGB array shape."""
    img_bytes = create_test_image_bytes(300, 600)
    arr = safe_decode_image(img_bytes)
    assert isinstance(arr, np.ndarray)
    assert arr.shape == (600, 300, 3)


def test_safe_decode_corrupt_bytes():
    """Confirms corrupt or empty bytes raise PreprocessingError safely."""
    with pytest.raises(PreprocessingError):
        safe_decode_image(b"not_an_image_binary_data")

    with pytest.raises(PreprocessingError):
        safe_decode_image(b"")


def test_preprocess_for_ocr_diagnostics():
    """Checks that OCR preprocessing outputs valid diagnostics."""
    img_bytes = create_test_image_bytes(360, 720)
    arr = safe_decode_image(img_bytes)
    processed, diag = preprocess_for_ocr(arr)

    assert diag["original_width"] == 360
    assert diag["original_height"] == 720
    assert diag["aspect_ratio"] == 2.0
    assert diag["is_standard_mobile_ratio"] is True
    assert "contrast_score" in diag
    assert "blur_score" in diag


def test_preprocess_for_cnn_tensor_shape():
    """Checks that CNN preprocessing produces normalized (1, 224, 224, 3) float tensor."""
    img_bytes = create_test_image_bytes(500, 500)
    arr = safe_decode_image(img_bytes)
    tensor = preprocess_for_cnn(arr, target_size=(224, 224))

    assert tensor.shape == (1, 224, 224, 3)
    assert tensor.dtype == np.float32
    assert tensor.min() >= 0.0
    assert tensor.max() <= 1.0


def test_compute_blur():
    """Checks blur computation returns a float score."""
    gray = np.zeros((100, 100), dtype=np.uint8)
    score = compute_blur_laplacian(gray)
    assert isinstance(score, float)
    assert score == 0.0
