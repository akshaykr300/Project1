"""
Unit Tests for OCR Parsing and Regular Expression Extraction
"""
import pytest
from backend.app.services.ocr import (
    parse_structured_payment_details,
    normalize_extracted_text,
    check_tesseract_installation
)


SAMPLE_AUTHENTIC_OCR = """
Paid to
Rahul Verma
rahul.verma@okaxis
₹ 1,500.00
Payment Successful
15 Oct 2026, 02:45 PM
UPI Transaction ID
428910293847
Google Pay
"""

SAMPLE_SUSPICIOUS_MOCK_OCR = """
Payment Successful
Prank Payment Generator
₹ 50,000
To: testuser@fakepay
Ref No: 1234
Date: 12-10-2026
"""


def test_normalize_text():
    raw = "  Paid  to   \n\n\n Rahul   \t  Verma  "
    norm = normalize_extracted_text(raw)
    assert norm == "Paid to\nRahul Verma"


def test_parse_authentic_upi_fields():
    result = parse_structured_payment_details(SAMPLE_AUTHENTIC_OCR)
    assert result["amount"] == "1500.00"
    assert result["upi_id"] == "rahul.verma@okaxis"
    assert result["utr"] == "428910293847"
    assert result["status_keyword"] == "PAID"
    assert result["recipient_name"] == "Rahul Verma"


def test_parse_suspicious_upi_fields():
    result = parse_structured_payment_details(SAMPLE_SUSPICIOUS_MOCK_OCR)
    assert result["amount"] == "50000"
    # Ref No 1234 is only 4 digits, so standard 12-digit UTR should not be matched
    assert result["utr"] is None


def test_tesseract_check_graceful_response():
    info = check_tesseract_installation("non_existent_binary_path")
    assert isinstance(info, dict)
    assert "installed" in info
    assert "status" in info
