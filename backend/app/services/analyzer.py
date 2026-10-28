"""
Transparent Decision and Evidence Synthesis Service
Combines OCR extracted details, OpenCV preprocessing diagnostics, CNN predictions,
and heuristic verification rules to produce an explainable, cautious assessment.
"""
import uuid
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Tuple
import numpy as np

from backend.app.services.preprocessing import preprocess_for_ocr, preprocess_for_cnn
from backend.app.services.ocr import extract_text_from_image
from backend.app.ml.predict import predict_screenshot


def evaluate_heuristics(
    extracted_fields: Dict[str, Any],
    preprocessing_diag: Dict[str, Any],
    normalized_text: str
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Evaluates rule-based heuristic checks against extracted payment details
    and image physical diagnostics.
    """
    reasons: List[str] = []
    tampering_indicators: List[str] = []

    amount = extracted_fields.get("amount")
    utr = extracted_fields.get("utr")
    upi_id = extracted_fields.get("upi_id")
    timestamp = extracted_fields.get("timestamp")
    status_kw = extracted_fields.get("status_keyword")

    has_valid_amount = bool(amount and len(amount) > 0)
    has_valid_utr = bool(utr and len(utr) == 12 and utr.isdigit())
    has_upi_id = bool(upi_id)
    has_timestamp = bool(timestamp)

    # Check 1: Missing standard transaction reference
    if not utr:
        reasons.append("Missing standard 12-digit UPI transaction reference number (UTR).")
        tampering_indicators.append("MISSING_UTR")
    elif len(utr) != 12 or not utr.isdigit():
        reasons.append(f"Invalid transaction reference length ({len(utr)} digits instead of standard 12).")
        tampering_indicators.append("MALFORMED_UTR")

    # Check 2: Missing payment amount
    if not has_valid_amount:
        reasons.append("Could not extract a readable numerical transaction amount from the image.")
        tampering_indicators.append("MISSING_AMOUNT")

    # Check 3: Status keyword check
    suspicious_status = False
    if status_kw in ("FAILED", "PENDING"):
        suspicious_status = True
        reasons.append(f"Image displays payment status as '{status_kw}', not completed.")
        tampering_indicators.append(f"STATUS_{status_kw}")

    # Check 4: Missing recipient / UPI handle
    if not has_upi_id:
        reasons.append("No valid UPI VPA handle (e.g. @okaxis, @ybl, @upi) identified.")
        tampering_indicators.append("MISSING_UPI_VPA")

    # Check 5: Aspect ratio / Resolution check
    res_warning = False
    orig_w = preprocessing_diag.get("original_width", 0)
    orig_h = preprocessing_diag.get("original_height", 0)
    if orig_w < 300 or orig_h < 300:
        res_warning = True
        reasons.append(f"Very low image resolution ({orig_w}x{orig_h}px). High risk of compression or thumbnail artifacting.")
        tampering_indicators.append("LOW_RESOLUTION")

    # Check 6: Visual sharpness / blur
    blur_score = preprocessing_diag.get("blur_score", 0.0)
    if blur_score < 15.0 and orig_w >= 400:
        reasons.append("Significant image blur detected, which degrades OCR reliability and may conceal digital manipulation.")
        tampering_indicators.append("IMAGE_BLUR")

    # Check 7: Text noise or obvious fake generator signatures
    lower_norm = normalized_text.lower()
    fake_generator_keywords = ["fake upi", "prank payment", "spoof pay", "demo payment receipt", "fakepay"]
    for kw in fake_generator_keywords:
        if kw in lower_norm:
            reasons.append(f"Detected explicit mock/prank application signature: '{kw}'.")
            tampering_indicators.append("SPOOF_KEYWORD_DETECTED")

    heuristics_result = {
        "has_valid_amount": has_valid_amount,
        "has_valid_utr": has_valid_utr,
        "has_upi_id": has_upi_id,
        "has_timestamp": has_timestamp,
        "suspicious_status_found": suspicious_status,
        "font_inconsistency_score": 0.0,
        "resolution_warning": res_warning,
        "tampering_indicators": tampering_indicators
    }

    return heuristics_result, reasons


def synthesize_assessment(
    ocr_status: str,
    cnn_result: Dict[str, Any],
    heuristics: Dict[str, Any],
    reasons: List[str]
) -> Tuple[str, List[str], List[str]]:
    """
    Combines evidence into one of four cautious categories:
    - SUSPICIOUS
    - NO_OBVIOUS_ISSUES
    - INCONCLUSIVE
    - ANALYSIS_INCOMPLETE
    """
    limitations: List[str] = [
        "A screenshot is not legal or operational proof of an electronic fund transfer.",
        "Fraudulent actors can generate pixel-perfect counterfeit receipts using spoof apps.",
        "Always cross-reference the customer UTR in your business bank statement or UPI merchant console."
    ]

    # If OCR completely failed and CNN is uninitialized
    if ocr_status in ("NOT_INSTALLED", "FAILED") and cnn_result.get("status") == "MODEL_NOT_TRAINED":
        assessment = "ANALYSIS_INCOMPLETE"
        reasons.insert(0, "OCR engine was unavailable or failed to parse text, and CNN model is not trained.")
        return assessment, reasons, limitations

    # Critical red flags warranting SUSPICIOUS
    tampering = heuristics.get("tampering_indicators", [])
    if (
        "SPOOF_KEYWORD_DETECTED" in tampering
        or "STATUS_FAILED" in tampering
        or "MALFORMED_UTR" in tampering
        or (cnn_result.get("status") == "INFERENCE_SUCCESS" and cnn_result.get("prediction") == "suspicious" and cnn_result.get("confidence", 0) > 0.70)
    ):
        assessment = "SUSPICIOUS"
        return assessment, reasons, limitations

    # If both amount and UTR are missing
    if not heuristics.get("has_valid_amount") and not heuristics.get("has_valid_utr"):
        assessment = "INCONCLUSIVE"
        reasons.append("Crucial transaction fields (both amount and UTR reference) could not be identified.")
        return assessment, reasons, limitations

    # Moderate warnings
    if len(tampering) >= 2 or heuristics.get("suspicious_status_found"):
        assessment = "SUSPICIOUS"
        return assessment, reasons, limitations

    # If no red flags found
    if len(reasons) == 0:
        assessment = "NO_OBVIOUS_ISSUES"
        reasons.append("Standard payment metadata fields (amount, transaction reference, UPI ID) were successfully extracted.")
        reasons.append("No common tampering signatures or layout anomalies were detected.")
    else:
        # Minor warnings exist
        assessment = "INCONCLUSIVE"

    return assessment, reasons, limitations


def run_full_analysis(
    rgb_image: np.ndarray,
    original_filename: str,
    file_bytes_len: int,
    tesseract_cmd: str = "",
    weights_path: str = "backend/app/ml/weights/fake_upi_cnn_active.keras",
    class_mapping_path: str = "backend/app/ml/weights/class_mapping.json"
) -> Dict[str, Any]:
    """
    End-to-end analysis orchestrator.
    """
    start_time = datetime.utcnow()
    analysis_id = f"upi_chk_{uuid.uuid4().hex[:12]}"

    # SHA256 of image bytes
    file_hash = hashlib.sha256(rgb_image.tobytes()).hexdigest()

    # Step 1: Preprocessing for OCR
    ocr_processed_img, preprocessing_diag = preprocess_for_ocr(rgb_image)

    # Step 2: OCR extraction
    raw_text, normalized_text, structured_details, ocr_conf, ocr_status = extract_text_from_image(
        ocr_processed_img, tesseract_cmd=tesseract_cmd
    )
    structured_details["ocr_confidence"] = ocr_conf

    # Step 3: CNN Preprocessing and Inference
    cnn_tensor = preprocess_for_cnn(rgb_image)
    cnn_result = predict_screenshot(cnn_tensor, weights_path=weights_path, class_mapping_path=class_mapping_path)

    # Step 4: Rule-based heuristic verification
    heuristics, reasons = evaluate_heuristics(structured_details, preprocessing_diag, normalized_text)

    # Step 5: Evidence synthesis
    assessment, final_reasons, limitations = synthesize_assessment(
        ocr_status, cnn_result, heuristics, reasons
    )

    duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

    return {
        "analysis_id": analysis_id,
        "filename": original_filename,
        "file_hash": file_hash,
        "file_size_bytes": file_bytes_len,
        "image_dimensions": f"{preprocessing_diag['original_width']}x{preprocessing_diag['original_height']}",
        "ocr_status": ocr_status,
        "extracted_fields": structured_details,
        "raw_ocr_text": raw_text,
        "preprocessing": preprocessing_diag,
        "cnn_result": cnn_result,
        "heuristics": heuristics,
        "assessment": assessment,
        "reasons": final_reasons,
        "limitations": limitations,
        "processing_duration_ms": duration_ms,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
