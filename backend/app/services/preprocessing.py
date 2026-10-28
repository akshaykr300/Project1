"""
Image Preprocessing Service using OpenCV and Pillow
Handles safe image decoding, grayscale, CLAHE, denoising, Otsu thresholding,
blur detection, aspect ratio calculations, and CNN tensor normalization.
"""
import io
import logging
from typing import Tuple, Dict, Any, Optional
import numpy as np
from PIL import Image

logger = logging.getLogger("fake_upi_shield.preprocessing")

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    cv2 = None
    OPENCV_AVAILABLE = False


class PreprocessingError(Exception):
    """Custom exception raised when image decoding or processing fails safely."""
    pass


def safe_decode_image(image_bytes: bytes) -> np.ndarray:
    """
    Decodes raw image bytes safely into an RGB NumPy array.
    Validates against corrupt, unreadable, or truncated image buffers.
    """
    if not image_bytes or len(image_bytes) < 16:
        raise PreprocessingError("Uploaded file is empty or too small to be a valid image.")

    try:
        pil_image = Image.open(io.BytesIO(image_bytes))
        pil_image.verify()  # Check for header corruption
    except Exception as e:
        raise PreprocessingError(f"Corrupt or invalid image header: {str(e)}")

    # Re-open after verify() closes the file pointer
    try:
        pil_image = Image.open(io.BytesIO(image_bytes))
        if pil_image.mode not in ("RGB", "L", "RGBA"):
            pil_image = pil_image.convert("RGB")
        elif pil_image.mode == "RGBA":
            # Flatten transparency onto white background
            background = Image.new("RGB", pil_image.size, (255, 255, 255))
            background.paste(pil_image, mask=pil_image.split()[3])
            pil_image = background
        elif pil_image.mode == "L":
            pil_image = pil_image.convert("RGB")

        rgb_array = np.array(pil_image)
        if rgb_array.size == 0:
            raise PreprocessingError("Decoded image array is empty.")
        return rgb_array
    except Exception as e:
        raise PreprocessingError(f"Error converting image to RGB array: {str(e)}")


def compute_blur_laplacian(gray_array: np.ndarray) -> float:
    """Computes the variance of the Laplacian to estimate image sharpness."""
    if OPENCV_AVAILABLE and cv2 is not None:
        try:
            return float(cv2.Laplacian(gray_array, cv2.CV_64F).var())
        except Exception:
            pass
    # Fallback variance of differences
    diff_h = np.diff(gray_array, axis=0)
    diff_v = np.diff(gray_array, axis=1)
    return float((np.var(diff_h) + np.var(diff_v)) / 2.0)


def preprocess_for_ocr(rgb_image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Applies image preprocessing tailored for high-accuracy OCR extraction:
    - Grayscale conversion
    - CLAHE (Contrast Limited Adaptive Histogram Equalization)
    - Gentle bilateral filter or Gaussian blur for denoising
    - Otsu adaptive thresholding
    Returns: (processed_image_for_ocr, diagnostics_dict)
    """
    h, w, c = rgb_image.shape
    aspect_ratio = round(h / max(w, 1), 3)
    is_standard_mobile = (1.5 <= aspect_ratio <= 2.5)  # typical 16:9 or 20:9 screenshot

    diagnostics: Dict[str, Any] = {
        "original_width": w,
        "original_height": h,
        "aspect_ratio": aspect_ratio,
        "channels": c,
        "is_standard_mobile_ratio": is_standard_mobile,
        "contrast_score": 0.0,
        "blur_score": 0.0,
        "clahe_applied": False,
        "status": "COMPLETED"
    }

    if OPENCV_AVAILABLE and cv2 is not None:
        try:
            # OpenCV expects BGR for most ops, so convert RGB -> BGR
            bgr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

            # Contrast calculation (standard deviation of gray intensity)
            contrast = float(np.std(gray))
            diagnostics["contrast_score"] = round(contrast, 2)

            # Blur detection
            blur_var = compute_blur_laplacian(gray)
            diagnostics["blur_score"] = round(blur_var, 2)

            # Apply CLAHE to balance uneven phone backlights or cropped dark regions
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced_gray = clahe.apply(gray)
            diagnostics["clahe_applied"] = True

            # Denoise slightly
            denoised = cv2.medianBlur(enhanced_gray, 3)

            # Otsu thresholding creates crisp text edges
            _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            return thresh, diagnostics
        except Exception as e:
            logger.warning(f"OpenCV OCR preprocessing failed: {e}. Falling back to PIL.")

    # Fallback without OpenCV
    pil_img = Image.fromarray(rgb_image).convert("L")
    gray_np = np.array(pil_img)
    diagnostics["contrast_score"] = round(float(np.std(gray_np)), 2)
    diagnostics["blur_score"] = round(compute_blur_laplacian(gray_np), 2)
    return gray_np, diagnostics


def preprocess_for_cnn(rgb_image: np.ndarray, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    """
    Prepares RGB image tensor for CNN inference:
    - Resizes to target_size (default 224x224) using bilinear interpolation
    - Normalizes pixel floats to range [0.0, 1.0]
    - Returns shape (1, target_size[0], target_size[1], 3)
    """
    if OPENCV_AVAILABLE and cv2 is not None:
        resized = cv2.resize(rgb_image, target_size, interpolation=cv2.INTER_AREA)
    else:
        pil_img = Image.fromarray(rgb_image)
        resized = np.array(pil_img.resize(target_size, Image.Resampling.BILINEAR))

    tensor = resized.astype(np.float32) / 255.0
    # Add batch dimension
    return np.expand_dims(tensor, axis=0)
