"""
OCR Text Extraction & Parsing Service
Integrates Tesseract OCR via pytesseract with regular expression parsers
for UPI amounts, VPA/UPI IDs, UTR references, timestamps, and status phrases.
"""
import os
import re
import logging
from typing import Dict, Any, Optional, Tuple
import numpy as np
from PIL import Image

logger = logging.getLogger("fake_upi_shield.ocr")

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    pytesseract = None
    PYTESSERACT_AVAILABLE = False


# Common UPI App Handles in India (Google Pay, PhonePe, Paytm, BHIM, Bank VPAs)
UPI_HANDLE_REGEX = re.compile(
    r"[a-zA-Z0-9.\-_]{2,40}@(okaxis|okhdfcbank|okicici|oksbi|ibl|ybl|axl|paytm|upi|barodampay|federal|kotak|allbank|cnrb|idfc|aubank|airtel|freecharge|postbank)",
    re.IGNORECASE
)

# Standard UPI / VPA fallback pattern
GENERIC_VPA_REGEX = re.compile(r"\b[a-zA-Z0-9.\-_]{3,35}@[a-zA-Z]{3,15}\b")

# Rupee Amount Regex (Handles ₹ symbol, Rs., INR, with optional commas and decimals)
AMOUNT_REGEX = re.compile(
    r"(?:₹|Rs\.?|INR|\bAmount\b)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)\b",
    re.IGNORECASE
)

# 12-digit UPI Transaction Reference Number (UTR / Ref No)
UTR_REGEX = re.compile(r"\b(?:UTR|Ref(?:\s*No)?|Txn(?:\s*ID)?|Transaction\s*ID)[:\s#]*([0-9]{12})\b", re.IGNORECASE)
RAW_12DIGIT_REGEX = re.compile(r"\b([0-9]{12})\b")

# Payment Status Keywords
STATUS_KEYWORDS = {
    "PAID": ["paid successfully", "payment successful", "paid to", "successful", "transferred successfully"],
    "COMPLETED": ["completed", "money transferred", "transaction successful"],
    "PENDING": ["payment processing", "processing", "pending", "payment under review"],
    "FAILED": ["payment failed", "transaction declined", "failed", "cancelled"]
}

# Date and Time Regex Patterns
DATE_TIME_PATTERNS = [
    re.compile(r"\b([0-3]?[0-9]\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+[0-9]{4}(?:,?\s+[0-2]?[0-9]:[0-5][0-9](?::[0-5][0-9])?(?:\s*[AaPp][Mm])?)?)\b", re.IGNORECASE),
    re.compile(r"\b([0-3]?[0-9][/\-.][0-1]?[0-9][/\-.][0-9]{2,4}(?:\s+[0-2]?[0-9]:[0-5][0-9])?)\b"),
    re.compile(r"\b([0-2]?[0-9]:[0-5][0-9](?::[0-5][0-9])?\s*(?:AM|PM|am|pm))\b")
]


def configure_tesseract_path(executable_path: str):
    """Sets the Tesseract binary path on Windows / Linux if specified."""
    if PYTESSERACT_AVAILABLE and pytesseract is not None:
        if executable_path and os.path.exists(executable_path):
            pytesseract.pytesseract.tesseract_cmd = executable_path
            logger.info(f"Configured Tesseract executable at: {executable_path}")


def check_tesseract_installation(executable_path: str = "") -> Dict[str, Any]:
    """Tests if Tesseract executable is installed and runnable on the system."""
    if not PYTESSERACT_AVAILABLE:
        return {
            "installed": False,
            "version": None,
            "status": "PYTESSERACT_NOT_INSTALLED",
            "message": "The pytesseract Python package is missing. Install with pip install pytesseract."
        }
    if executable_path and os.path.exists(executable_path):
        pytesseract.pytesseract.tesseract_cmd = executable_path

    try:
        ver = pytesseract.get_tesseract_version()
        return {
            "installed": True,
            "version": str(ver),
            "status": "READY",
            "executable": pytesseract.pytesseract.tesseract_cmd,
            "message": f"Tesseract OCR {ver} is ready."
        }
    except Exception as e:
        return {
            "installed": False,
            "version": None,
            "status": "TESSERACT_BINARY_NOT_FOUND",
            "executable": getattr(pytesseract.pytesseract, "tesseract_cmd", "default"),
            "message": (
                "Tesseract executable was not found on your operating system path. "
                "On Windows, download installer from https://github.com/UB-Mannheim/tesseract/wiki "
                "and set TESSERACT_CMD in backend/.env"
            ),
            "error_details": str(e)
        }


def normalize_extracted_text(raw_text: str) -> str:
    """Cleans up raw OCR string by removing excessive whitespace and non-printable noise."""
    if not raw_text:
        return ""
    # Replace multiple newlines or tabs with single spaces/newlines
    lines = [re.sub(r"[ \t]+", " ", line.strip()) for line in raw_text.splitlines()]
    non_empty = [l for l in lines if l]
    return "\n".join(non_empty)


def parse_structured_payment_details(text: str) -> Dict[str, Any]:
    """
    Parses normalized text using deterministic regex rules.
    Does NOT invent missing data; missing fields are assigned None.
    """
    result: Dict[str, Any] = {
        "amount": None,
        "currency": "INR",
        "upi_id": None,
        "utr": None,
        "timestamp": None,
        "recipient_name": None,
        "status_keyword": None,
    }

    if not text:
        return result

    # 1. Parse Status Keyword
    lower_text = text.lower()
    for category, phrases in STATUS_KEYWORDS.items():
        for phrase in phrases:
            if phrase in lower_text:
                result["status_keyword"] = category
                break
        if result["status_keyword"]:
            break

    # 2. Parse UPI ID / VPA
    vpa_match = UPI_HANDLE_REGEX.search(text) or GENERIC_VPA_REGEX.search(text)
    if vpa_match:
        result["upi_id"] = vpa_match.group(0).strip().lower()

    # 3. Parse UTR / Transaction Reference (12 digits)
    utr_match = UTR_REGEX.search(text)
    if utr_match:
        result["utr"] = utr_match.group(1).strip()
    else:
        # Search for standalone 12-digit number common in UPI receipts
        raw_12 = RAW_12DIGIT_REGEX.findall(text)
        if raw_12:
            # Avoid matching standard timestamps or phone numbers if possible
            result["utr"] = raw_12[0].strip()

    # 4. Parse Amount
    # Look for patterns like ₹ 500, Rs. 1,250.00, or clean numbers near "paid"
    for line in text.splitlines():
        if any(sym in line for sym in ["₹", "Rs", "rs", "INR", "Paid", "Amount", "Transfer"]):
            amt_matches = AMOUNT_REGEX.findall(line)
            valid_amts = [m for m in amt_matches if m.replace(",", "").replace(".", "").isdigit()]
            if valid_amts:
                # Pick the most plausible amount
                result["amount"] = valid_amts[0].replace(",", "")
                break

    if not result["amount"]:
        # Secondary pass across whole text
        all_amts = AMOUNT_REGEX.findall(text)
        for a in all_amts:
            clean = a.replace(",", "").replace(".", "")
            if clean.isdigit() and 1 <= len(clean) <= 8 and float(a.replace(",", "")) > 0:
                result["amount"] = a.replace(",", "")
                break

    # 5. Parse Date / Time
    for pattern in DATE_TIME_PATTERNS:
        dt_match = pattern.search(text)
        if dt_match:
            result["timestamp"] = dt_match.group(1).strip()
            break

    # 6. Parse Recipient Name (Heuristic: Line after 'Paid to' or 'To:')
    lines = text.splitlines()
    for idx, line in enumerate(lines):
        clean_line = line.strip().lower()
        if clean_line.startswith(("paid to", "to ", "sent to", "paying to")):
            # If the rest of the line has a name
            sub = line.split(":", 1)[-1] if ":" in line else line[7:]
            if len(sub.strip()) > 2 and "@" not in sub:
                result["recipient_name"] = sub.strip()
                break
            elif idx + 1 < len(lines):
                next_line = lines[idx + 1].strip()
                if len(next_line) > 2 and "@" not in next_line and not any(k in next_line.lower() for k in ["rupee", "rs", "₹", "upi"]):
                    result["recipient_name"] = next_line
                    break

    return result


def extract_text_from_image(
    image_input: Any,
    tesseract_cmd: Optional[str] = None
) -> Tuple[str, str, Dict[str, Any], Optional[float], str]:
    """
    Extracts text from an image (NumPy array or PIL Image).
    Returns:
      (raw_text, normalized_text, structured_details, confidence, ocr_status)
    """
    tess_status = check_tesseract_installation(tesseract_cmd or "")
    if not tess_status["installed"]:
        return (
            "",
            "",
            parse_structured_payment_details(""),
            None,
            "NOT_INSTALLED"
        )

    try:
        if isinstance(image_input, np.ndarray):
            pil_img = Image.fromarray(image_input)
        else:
            pil_img = image_input

        # Run pytesseract image_to_data for confidence calculations
        data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT)
        confidences = [int(c) for c in data["conf"] if str(c).isdigit() and int(c) >= 0]
        avg_confidence = round(float(np.mean(confidences)), 2) if confidences else None

        raw_text = pytesseract.image_to_string(pil_img, config="--psm 6")
        normalized_text = normalize_extracted_text(raw_text)
        structured = parse_structured_payment_details(normalized_text)

        status = "SUCCESS" if normalized_text.strip() else "PARTIAL"
        return raw_text, normalized_text, structured, avg_confidence, status
    except Exception as e:
        logger.error(f"Tesseract OCR processing failed: {e}")
        return "", "", parse_structured_payment_details(""), None, "FAILED"
