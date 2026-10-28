"""
Unit Tests for Rule-based Heuristics and Evidence Synthesis Logic
"""
import pytest
from backend.app.services.analyzer import evaluate_heuristics, synthesize_assessment


def test_heuristics_detects_missing_utr():
    fields = {
        "amount": "250.00",
        "utr": None,
        "upi_id": "merchant@okhdfcbank",
        "timestamp": "12 Oct 2026",
        "status_keyword": "PAID"
    }
    diag = {"original_width": 1080, "original_height": 2400, "blur_score": 150.0}
    heuristics, reasons = evaluate_heuristics(fields, diag, "Paid to merchant")

    assert heuristics["has_valid_utr"] is False
    assert "MISSING_UTR" in heuristics["tampering_indicators"]
    assert any("Missing standard 12-digit" in r for r in reasons)


def test_heuristics_detects_spoof_keyword():
    fields = {
        "amount": "1000",
        "utr": "123456789012",
        "upi_id": "test@okaxis",
        "timestamp": "10:30 AM",
        "status_keyword": "PAID"
    }
    diag = {"original_width": 1080, "original_height": 2400, "blur_score": 100.0}
    heuristics, reasons = evaluate_heuristics(fields, diag, "This is generated with FakePay app")

    assert "SPOOF_KEYWORD_DETECTED" in heuristics["tampering_indicators"]


def test_synthesize_assessment_categories():
    # 1. Clean case
    h_clean = {"tampering_indicators": [], "has_valid_amount": True, "has_valid_utr": True, "suspicious_status_found": False}
    ass, reasons, _ = synthesize_assessment("SUCCESS", {"status": "MODEL_NOT_TRAINED"}, h_clean, [])
    assert ass == "NO_OBVIOUS_ISSUES"

    # 2. Suspicious case
    h_susp = {"tampering_indicators": ["SPOOF_KEYWORD_DETECTED"], "has_valid_amount": True, "has_valid_utr": True, "suspicious_status_found": False}
    ass, _, _ = synthesize_assessment("SUCCESS", {"status": "MODEL_NOT_TRAINED"}, h_susp, ["Detected spoof keyword"])
    assert ass == "SUSPICIOUS"

    # 3. Inconclusive case (missing both amount and UTR)
    h_inconc = {"tampering_indicators": ["MISSING_AMOUNT", "MISSING_UTR"], "has_valid_amount": False, "has_valid_utr": False, "suspicious_status_found": False}
    ass, _, _ = synthesize_assessment("SUCCESS", {"status": "MODEL_NOT_TRAINED"}, h_inconc, ["Missing amount", "Missing UTR"])
    assert ass == "INCONCLUSIVE"
