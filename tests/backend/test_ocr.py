"""
Tests for the pure regex-extraction logic in app.services.ocr. These don't
need the Tesseract binary — they exercise the same functions that
extract_from_image_bytes() runs on whatever text Tesseract produced.
"""
from app.services.ocr import (
    _AMOUNT_PATTERNS,
    _MAX_PLAUSIBLE_UNITS,
    _PERIOD_PATTERNS,
    _TARIFF_PATTERNS,
    _UNITS_PATTERNS,
    _amount_in_words,
    _closest_number_near,
    _extract_meter_readings,
    _first_match,
    _first_text_match,
    _resolve_amount,
    _resolve_units,
    _units_proximity_fallback,
    _words_to_amount,
)

# Real (English-only) OCR output captured from a genuine bilingual UPPCL
# (Uttar Pradesh) electricity bill, before Hindi-language support was added.
# Kept as a fixture documenting the known baseline: this text is garbled
# enough that neither a stated-units figure nor a clean meter-reading pair
# survives — extraction correctly reports "unavailable" rather than
# guessing from noise, and the bill amount still recovers via the
# amount-in-words fallback.
REAL_BILINGUAL_BILL_OCR_TEXT = """
Paschimanchal Vidyut Vitaran Nigam Ltd.
Electricity Bill Account No.: 8052-075-000
Bill Date 02-AUG-2026 Due Date 17-AUG-2026 2a WAT Payable Amount 10578
Net Billed Unit Payable bs Due date
In Words Ten Thousand Five Hundred Seventy Eight Rupees Only
Meter Number Type Status Demand Reading Date Current Previous MF Units Months Remark
""".lower()

# Real OCR output from the SAME bill, this time after Hindi-language support
# was installed — a substantial quality jump: Devanagari renders as actual
# Hindi instead of English-shaped garbage. The consumption label itself is
# printed in Hindi ("नेट बिल्ड यूनिट" = "Net Billed Unit"), immediately
# followed by "1520.29"; a second "1520" appears later near "KWH" in the
# meter table, separated from it by more OCR noise. Neither is adjacent
# enough for the strict _UNITS_PATTERNS match — this is exactly the case
# the proximity fallback exists for.
REAL_BILINGUAL_BILL_OCR_TEXT_WITH_HINDI = """
पश्चिमांचल विद्युत वितरण निगम लिमिटेड
देय धनराशि Payable Amount 10878
नेट बिल्ड यूनिट/ 1520.29 an fafa तक धनराशि
Net Billed Unit Payable bs Due date
In Words Ten Thousand Five Hundred Seventy Eight Rupees Only
ws HL KH की aa लय 17 Pate ge ing ae 1520 हक 1 rele KWH i Oh
""".lower()


def test_amount_four_digits_no_comma():
    """Regression: '1777.00' used to match only '177' (see fix history)."""
    text = "total amount payable: rs. 1777.00"
    assert _first_match(_AMOUNT_PATTERNS, text) == 1777.0


def test_amount_five_digits_no_comma():
    text = "amount due rs 12500"
    assert _first_match(_AMOUNT_PATTERNS, text) == 12500.0


def test_amount_with_comma_grouping():
    text = "total bill amount: rs. 1,777.50"
    assert _first_match(_AMOUNT_PATTERNS, text) == 1777.50


def test_amount_indian_lakh_style_grouping():
    text = "net amount payable rs 1,00,000.00"
    assert _first_match(_AMOUNT_PATTERNS, text) == 100000.0


def test_amount_fallback_currency_symbol_pattern():
    text = "please pay ₹ 2450 by the due date"
    assert _first_match(_AMOUNT_PATTERNS, text) == 2450.0


def test_units_consumed_basic():
    text = "units consumed: 250 kwh"
    assert _first_match(_UNITS_PATTERNS, text) == 250.0


def test_units_large_value_not_truncated():
    text = "consumption (kwh): 1234 kwh"
    assert _first_match(_UNITS_PATTERNS, text) == 1234.0


def test_tariff_per_unit():
    text = "tariff: rs 7.11 per unit"
    assert _first_match(_TARIFF_PATTERNS, text) == 7.11


def test_tariff_slash_kwh_format():
    text = "rate rs 8.5/kwh"
    assert _first_match(_TARIFF_PATTERNS, text) == 8.5


def test_billing_period_date_range():
    text = "billing period: 01/08/2026 to 31/08/2026"
    result = _first_text_match(_PERIOD_PATTERNS, text)
    assert result == "01/08/2026 to 31/08/2026"


def test_billing_period_month_year_fallback():
    text = "statement for august 2026"
    result = _first_text_match(_PERIOD_PATTERNS, text)
    assert result == "august 2026"


def test_no_match_returns_none():
    assert _first_match(_AMOUNT_PATTERNS, "no numbers here") is None
    assert _first_text_match(_PERIOD_PATTERNS, "no dates here") is None


def test_amount_reversed_word_order_payable_amount():
    """Regression: real Indian bills often say 'Payable Amount', not 'Amount Payable'."""
    text = "payable amount 10578"
    assert _first_match(_AMOUNT_PATTERNS, text) == 10578.0


def test_units_billed_unit_phrasing():
    text = "net billed unit 245 kwh"
    assert _first_match(_UNITS_PATTERNS, text) == 245.0


def test_words_to_amount_simple():
    assert _words_to_amount("ten thousand five hundred seventy eight") == 10578.0


def test_words_to_amount_with_lakh():
    assert _words_to_amount("two lakh fifty thousand") == 250000.0


def test_words_to_amount_stops_at_unrecognized_word():
    # OCR garbage after the real words shouldn't corrupt the parsed amount.
    assert _words_to_amount("ten thousand five hundred seventy eight xyzq garbage") == 10578.0


def test_words_to_amount_no_recognizable_words_returns_none():
    assert _words_to_amount("xyzq garbage only") is None


def test_amount_in_words_full_line_from_real_bill():
    text = "amount payable rs in words ten thousand five hundred seventy eight rupees only"
    assert _amount_in_words(text) == 10578.0


def test_amount_falls_back_to_words_when_digits_unreadable():
    """
    Regression for the real bill that surfaced this: OCR garbled the printed
    digits (e.g. 'fay able Amount if 1087s') but the amount-in-words line
    read cleanly — extraction should still recover the correct amount.
    """
    text = (
        "wat fay able amount if 1087s "
        "in words ten thousand five hundred seventy eight rupees only"
    )
    digit_amount = _first_match(_AMOUNT_PATTERNS, text)
    assert digit_amount != 10578.0  # confirms the digits really are unreadable here
    assert _amount_in_words(text) == 10578.0


# ---------------------------------------------------------------------------
# Meter-reading derivation (current - previous), validation, and confidence
# ---------------------------------------------------------------------------

def test_extract_meter_readings_basic():
    text = "current reading: 15644 previous reading: 15029"
    current, previous = _extract_meter_readings(text)
    assert current == 15644.0
    assert previous == 15029.0


def test_extract_meter_readings_present_reading_synonym():
    text = "present reading 4210 previous reading 3990"
    current, previous = _extract_meter_readings(text)
    assert current == 4210.0
    assert previous == 3990.0


def test_extract_meter_readings_missing_returns_none():
    current, previous = _extract_meter_readings("no meter table here")
    assert current is None
    assert previous is None


def test_resolve_units_derives_from_meter_when_not_stated():
    text = "current reading: 15644 previous reading: 15029"
    result = _resolve_units(text)
    assert result.value == 615.0
    assert result.source == "derived_meter_diff"
    assert result.confidence == "medium"
    assert "15644" in result.note and "15029" in result.note


def test_resolve_units_prefers_stated_and_confirms_match():
    text = "units consumed: 615 kwh current reading: 15644 previous reading: 15029"
    result = _resolve_units(text)
    assert result.value == 615.0
    assert result.source == "stated"
    assert result.confidence == "high"


def test_resolve_units_stated_mismatch_flagged_but_stated_wins():
    text = "units consumed: 900 kwh current reading: 15644 previous reading: 15029"
    result = _resolve_units(text)
    assert result.value == 900.0  # stated value still used
    assert result.source == "stated"
    assert result.confidence == "medium"  # but flagged as inconsistent
    assert "don't quite match" in result.note


def test_resolve_units_does_not_derive_when_current_less_than_previous():
    """A meter can't go backwards in one cycle — don't fabricate a negative/rollover diff."""
    text = "current reading: 100 previous reading: 5000"
    result = _resolve_units(text)
    assert result.value is None
    assert result.source == "unavailable"


def test_resolve_units_does_not_derive_implausibly_large_diff():
    text = f"current reading: {_MAX_PLAUSIBLE_UNITS + 500} previous reading: 10"
    result = _resolve_units(text)
    assert result.value is None
    assert result.source == "unavailable"


def test_resolve_units_unavailable_when_nothing_found():
    result = _resolve_units("no useful information here")
    assert result.value is None
    assert result.source == "unavailable"
    assert result.confidence == "none"


def test_resolve_amount_stated_is_high_confidence():
    result = _resolve_amount("payable amount 10578")
    assert result.value == 10578.0
    assert result.source == "stated"
    assert result.confidence == "high"


def test_resolve_amount_words_fallback_is_medium_confidence():
    result = _resolve_amount("in words ten thousand five hundred seventy eight rupees only")
    assert result.value == 10578.0
    assert result.source == "amount_in_words"
    assert result.confidence == "medium"


def test_resolve_amount_unavailable_when_nothing_found():
    result = _resolve_amount("no amount information here")
    assert result.value is None
    assert result.source == "unavailable"
    assert result.confidence == "none"


def test_real_bilingual_bill_recovers_amount_but_not_units():
    """
    Documents the real-world baseline captured from an actual UPPCL bill
    under English-only OCR: the amount recovers (10578, matching both the
    digits and the words-in-full line), but units correctly report
    unavailable rather than guessing from the heavily garbled meter table —
    exactly the "do not guess" requirement.
    """
    units_result = _resolve_units(REAL_BILINGUAL_BILL_OCR_TEXT)
    amount_result = _resolve_amount(REAL_BILINGUAL_BILL_OCR_TEXT)

    assert units_result.value is None
    assert units_result.source == "unavailable"
    assert amount_result.value == 10578.0


# ---------------------------------------------------------------------------
# Proximity fallback — for Hindi-labelled or noise-separated units figures
# ---------------------------------------------------------------------------

def test_closest_number_near_prefers_nearest_over_farther():
    text = "some junk 9999 far away ... kwh 42 right here"
    # "42" is much closer to "kwh" than "9999" is.
    assert _closest_number_near(text, r"kwh") == 42.0


def test_closest_number_near_finds_number_before_anchor():
    text = "1520 kwh reading noted"
    assert _closest_number_near(text, r"kwh") == 1520.0


def test_closest_number_near_no_anchor_match_returns_none():
    assert _closest_number_near("nothing relevant", r"kwh") is None


def test_units_proximity_fallback_hindi_label():
    text = "नेट बिल्ड यूनिट/ 1520.29 कुछ और टेक्स्ट"
    assert _units_proximity_fallback(text) == 1520.29


def test_units_proximity_fallback_respects_max_plausible_bound():
    text = f"यूनिट {_MAX_PLAUSIBLE_UNITS + 5000} noise kwh"
    # Implausibly large "unit" reading near the anchor should be rejected,
    # not blindly accepted just because it was closest.
    assert _units_proximity_fallback(text) is None


def test_real_bilingual_bill_with_hindi_recovers_units_via_proximity():
    """
    The improved-OCR capture of the same real bill: once Hindi text renders
    correctly, the Devanagari consumption label becomes visible and the
    proximity fallback recovers a plausible units figure that the strict
    adjacent-match patterns still can't reach (label-then-number adjacency
    isn't how this bill's bilingual layout actually reads).
    """
    result = _resolve_units(REAL_BILINGUAL_BILL_OCR_TEXT_WITH_HINDI)
    assert result.value == 1520.29
    assert result.source == "proximity_match"
    assert result.confidence == "low"
