"""
Best-effort OCR extraction from an electricity bill image (Section 5).

Uses Tesseract via pytesseract (free/open-source, runs locally — no image
data leaves the machine). OCR is always optional: if Tesseract is not
installed, or extraction fails or is inconclusive, the caller falls back to
manual entry without breaking the rest of the app.

Real bill photos are often low-resolution, skewed, or unevenly lit, so the
image is preprocessed (grayscale, upscaled, contrast-boosted, thresholded)
using only Pillow — already a dependency — before being handed to
Tesseract. This measurably improves recognition on phone-camera photos
without adding a new dependency.

Privacy: the uploaded image is processed in memory and never written to
disk or any persistent store (Section 19).
"""
import io
import re
import shutil
import sys
from pathlib import Path
from typing import Optional

from app.models.schemas import OCRResponse

# Windows installers commonly install Tesseract to Program Files without
# adding it to PATH (a silent/unattended install won't prompt for the "add
# to PATH" option). Fall back to the default install location so OCR works
# out of the box even when it isn't on PATH.
_WINDOWS_DEFAULT_TESSERACT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def _resolve_tesseract_cmd() -> Optional[str]:
    if shutil.which("tesseract"):
        return None  # already resolvable on PATH — let pytesseract use its default
    if sys.platform == "win32" and Path(_WINDOWS_DEFAULT_TESSERACT).is_file():
        return _WINDOWS_DEFAULT_TESSERACT
    return None


_hindi_available_cache: Optional[bool] = None


def _hindi_available() -> bool:
    """Whether the Hindi (hin) language pack is installed alongside English."""
    global _hindi_available_cache
    if _hindi_available_cache is None:
        try:
            import pytesseract

            _hindi_available_cache = "hin" in pytesseract.get_languages()
        except Exception:
            _hindi_available_cache = False
    return _hindi_available_cache

_UNITS_PATTERNS = [
    r"(?:total\s+|net\s+billed\s+|billed\s+)?units?\s*(?:consumed|used)?\s*(?:\(kwh\))?\s*[:\-]?\s*(\d{1,6}(?:\.\d+)?)\s*(?:kwh|units)?",
    r"consumption\s*(?:\(kwh\))?\s*[:\-]?\s*(\d{1,6}(?:\.\d+)?)\s*(?:kwh|units)?",
    r"energy\s+consumption\s*[:\-]?\s*(\d{1,6}(?:\.\d+)?)",
    r"(\d{1,6}(?:\.\d+)?)\s*kwh",
]

# Many Indian bills — especially bilingual ones where OCR mangles the
# explicit "units consumed" label — only state consumption implicitly, via
# a meter-reading table (current/present reading vs. previous reading).
# These patterns look for that table's two reading values so consumption
# can be derived as current - previous.
_CURRENT_READING_PATTERNS = [
    r"(?:current|present)\s*(?:meter\s*)?read(?:ing)?\s*[:\-]?\s*(\d{1,6}(?:\.\d+)?)",
]
_PREVIOUS_READING_PATTERNS = [
    r"previous\s*(?:meter\s*)?read(?:ing)?\s*[:\-]?\s*(\d{1,6}(?:\.\d+)?)",
]

# A sane bound for a single billing cycle's consumption — guards against
# treating two unrelated numbers as meter readings (Section: "derive ONLY
# when the bill structure clearly supports it").
_MAX_PLAUSIBLE_UNITS = 20000

# Proximity fallback anchors, tried in order, for when a consumption figure
# exists on the bill but isn't adjacent to its label in the OCR'd text —
# either because the label is printed in Hindi (common on bilingual DISCOM
# bills) or because OCR noise breaks up a strictly adjacent match. Includes
# literal Devanagari phrases seen on real UPPCL-style bills ("नेट बिल्ड
# यूनिट" = "Net Billed Unit", "यूनिट" = "unit"), not just English.
_UNITS_PROXIMITY_ANCHORS = [
    r"नेट\s*बिल्ड\s*यूनिट",
    r"बिल्ड\s*यूनिट",
    r"net\s*billed\s*unit",
    r"यूनिट",
    r"\bkwh\b",
]

# Indian bills use both word orders ("Amount Payable" and "Payable Amount"),
# so both need matching — not just the one that reads more naturally in
# English.
_AMOUNT_PATTERNS = [
    r"(?:total\s+amount\s+payable|amount\s+payable|payable\s+amount|net\s+amount\s+payable|net\s+amount|bill\s+amount|total\s+bill\s+amount|total\s+bill|amount\s+due|current\s+bill\s+amount|current\s+bill)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*(?:\.\d{1,2})?)",
    r"(?:rs\.?|inr|₹)\s*(\d[\d,]*(?:\.\d{1,2})?)",
]

_AMOUNT_IN_WORDS_PATTERN = (
    r"in\s+words\s*[:\-]?\s*([a-z\s]+?)\s*rupees"
)

_TARIFF_PATTERNS = [
    r"(?:tariff|rate)\s*(?:per\s*unit)?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*(?:\.\d{1,4})?)\s*(?:/|per)?\s*(?:kwh|unit)",
    r"(?:rs\.?|inr|₹)\s*(\d[\d,]*(?:\.\d{1,4})?)\s*(?:/|per)\s*(?:kwh|unit)",
]

_PERIOD_PATTERNS = [
    r"(?:billing\s+period|bill\s+period|billing\s+month|for\s+the\s+period)\s*[:\-]?\s*"
    r"(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\s*(?:to|-|–)\s*\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})",
    r"\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\s*(?:to|-|–)\s*\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b",
    r"\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})\b",
]


_NUMBER_WORDS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
    "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
    "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17,
    "eighteen": 18, "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40,
    "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
}
_NUMBER_SCALES = {"hundred": 100, "thousand": 1000, "lakh": 100000, "lac": 100000}


def _words_to_amount(phrase: str) -> Optional[float]:
    """
    Parses a spelled-out amount like 'ten thousand five hundred seventy
    eight' into 10578. This is a fallback for when OCR mangles the printed
    digits but the amount-in-words line — required on most Indian bills —
    still reads cleanly, since its words are longer and more distinctive
    than individual digit glyphs.
    """
    total = 0
    current = 0
    matched_any = False
    for word in re.findall(r"[a-z]+", phrase.lower()):
        if word in _NUMBER_WORDS:
            current += _NUMBER_WORDS[word]
            matched_any = True
        elif word in _NUMBER_SCALES:
            scale = _NUMBER_SCALES[word]
            current = (current or 1) * scale
            if scale >= 1000:
                total += current
                current = 0
            matched_any = True
        elif word == "and":
            continue
        else:
            break  # stop at the first unrecognized word (OCR noise, "only", etc.)
    if not matched_any:
        return None
    return float(total + current)


def _amount_in_words(text: str) -> Optional[float]:
    match = re.search(_AMOUNT_IN_WORDS_PATTERN, text, re.IGNORECASE)
    if not match:
        return None
    return _words_to_amount(match.group(1))


def _extract_meter_readings(text: str) -> tuple[Optional[float], Optional[float]]:
    """Returns (current_reading, previous_reading) if both are found and sane."""
    current = _first_match(_CURRENT_READING_PATTERNS, text)
    previous = _first_match(_PREVIOUS_READING_PATTERNS, text)
    return current, previous


def _closest_number_near(text: str, anchor_pattern: str, window: int = 80) -> Optional[float]:
    """
    Finds the anchor phrase, then returns whichever number is *spatially
    closest* to it within `window` characters on either side — not just the
    one immediately following it. Real bilingual/tabular bills routinely
    separate a label from its value with other OCR'd junk (or print the
    value before the label), so strict adjacency misses values that a
    human glancing at the same line would read instantly.
    """
    match = re.search(anchor_pattern, text, re.IGNORECASE)
    if not match:
        return None

    anchor_start, anchor_end = match.start(), match.end()
    window_start = max(0, anchor_start - window)
    window_end = min(len(text), anchor_end + window)

    best_value = None
    best_distance = None
    for num_match in re.finditer(r"\d[\d,]*(?:\.\d+)?", text[window_start:window_end]):
        abs_start = window_start + num_match.start()
        abs_end = window_start + num_match.end()
        if abs_end <= anchor_start:
            gap_start, gap_end = abs_end, anchor_start
        elif abs_start >= anchor_end:
            gap_start, gap_end = anchor_end, abs_start
        else:
            gap_start, gap_end = anchor_start, anchor_start  # overlapping — treat as closest

        # A label and its value are, in practice, always on the same
        # printed line. A number on a different line is virtually always
        # an unrelated field (as verified against a real bill: the nearest
        # cross-line number to a "Net Billed Unit" label was the payable
        # amount from the line above) — so such candidates are excluded
        # entirely rather than merely penalized.
        if text.count("\n", gap_start, gap_end) > 0:
            continue
        distance = gap_end - gap_start

        try:
            value = float(num_match.group(0).replace(",", ""))
        except ValueError:
            continue

        if best_distance is None or distance < best_distance:
            best_distance = distance
            best_value = value

    return best_value


def _units_proximity_fallback(text: str) -> Optional[float]:
    for anchor in _UNITS_PROXIMITY_ANCHORS:
        value = _closest_number_near(text, anchor)
        if value is not None and 0 < value <= _MAX_PLAUSIBLE_UNITS:
            return value
    return None


class UnitsResolution:
    def __init__(self, value, source, confidence, note, current=None, previous=None):
        self.value = value
        self.source = source
        self.confidence = confidence
        self.note = note
        self.current = current
        self.previous = previous


def _resolve_units(text: str) -> UnitsResolution:
    """
    Resolves monthly consumption from whatever the bill actually states,
    per this priority:

    1. A directly labelled "units consumed" figure, cross-checked against a
       meter-reading-derived figure when both are present.
    2. A consumption figure derived from current - previous meter reading,
       ONLY when both readings were found, current > previous, and the
       difference is within a plausible single-cycle range — never guessed
       from arbitrary numbers on the page.
    3. Neither — reported as unavailable rather than guessed, so the caller
       falls back to manual entry.
    """
    stated = _first_match(_UNITS_PATTERNS, text)
    current, previous = _extract_meter_readings(text)

    derived = None
    if current is not None and previous is not None and current > previous:
        diff = current - previous
        if 0 < diff <= _MAX_PLAUSIBLE_UNITS:
            derived = diff

    if stated is not None and derived is not None:
        tolerance = max(5.0, stated * 0.05)
        if abs(stated - derived) <= tolerance:
            return UnitsResolution(
                stated, "stated", "high",
                f"Matches the meter reading difference ({current:g} − {previous:g} = {derived:g}).",
                current, previous,
            )
        return UnitsResolution(
            stated, "stated", "medium",
            (
                f"Stated units ({stated:g}) don't quite match the meter reading difference "
                f"({current:g} − {previous:g} = {derived:g}). Using the stated figure — please check it."
            ),
            current, previous,
        )

    if stated is not None:
        return UnitsResolution(stated, "stated", "high", "Found directly stated on the bill.")

    if derived is not None:
        return UnitsResolution(
            derived, "derived_meter_diff", "medium",
            f"Derived from meter readings: {current:g} − {previous:g} = {derived:g}.",
            current, previous,
        )

    # Last resort: a consumption figure exists on most real bills even when
    # neither a clean "units: X" line nor two clean meter readings could be
    # matched — found instead by proximity to a units/kWh marker (including
    # Hindi labels on bilingual bills). Lower confidence because it's a
    # heuristic, not a direct label-value match — the user should double
    # check it.
    proximity = _units_proximity_fallback(text)
    if proximity is not None:
        return UnitsResolution(
            proximity, "proximity_match", "low",
            (
                f"Found {proximity:g} near a units/kWh marker on the bill. This bill's layout "
                "made a precise match difficult — please double-check this figure."
            ),
        )

    return UnitsResolution(
        None, "unavailable", "none",
        "Couldn't find a stated consumption figure or a usable pair of meter readings on this bill.",
    )


class AmountResolution:
    def __init__(self, value, source, confidence):
        self.value = value
        self.source = source
        self.confidence = confidence


def _resolve_amount(text: str) -> AmountResolution:
    stated = _first_match(_AMOUNT_PATTERNS, text)
    if stated is not None:
        return AmountResolution(stated, "stated", "high")

    # Digit OCR is fragile on noisy scans; the spelled-out amount-in-words
    # line (present on most Indian bills) is a more resilient fallback.
    words = _amount_in_words(text)
    if words is not None:
        return AmountResolution(words, "amount_in_words", "medium")

    return AmountResolution(None, "unavailable", "none")


def _first_match(patterns: list[str], text: str) -> Optional[float]:
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw = match.group(1).replace(",", "")
            try:
                return float(raw)
            except ValueError:
                continue
    return None


def _first_text_match(patterns: list[str], text: str) -> Optional[str]:
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


def _preprocess_for_ocr(image):
    """Grayscale + upscale + autocontrast + light threshold, Pillow-only."""
    from PIL import ImageOps

    image = image.convert("L")  # grayscale

    # Upscale small photos — Tesseract does noticeably better above ~1500px wide.
    if image.width < 1500:
        scale = 1500 / image.width
        image = image.resize((int(image.width * scale), int(image.height * scale)))

    image = ImageOps.autocontrast(image)
    # Light binarization: push mid-tones toward black/white to sharpen text edges
    # without destroying anti-aliased characters (threshold is intentionally soft).
    image = image.point(lambda px: 0 if px < 140 else 255)
    return image


def run_ocr_on_image_bytes(image_bytes: bytes) -> tuple[Optional[str], Optional[str]]:
    """
    Shared Tesseract invocation used for both electricity-bill OCR and solar
    quote-document OCR (Section: quote upload should reuse the existing OCR
    pipeline rather than duplicating it). Returns (text, error_message) —
    exactly one of the two is None. `error_message` is already phrased for
    direct display to the user (manual-entry fallback wording).
    """
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        return None, (
            "OCR is unavailable in this environment (pytesseract/Pillow not "
            "installed). Please enter the details manually."
        )

    tesseract_cmd = _resolve_tesseract_cmd()
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    try:
        image = Image.open(io.BytesIO(image_bytes))
        processed = _preprocess_for_ocr(image)
        # Indian electricity bills and solar quotes are routinely bilingual
        # (Hindi + English). Without the Hindi model, Tesseract force-fits
        # Devanagari glyphs into English letter shapes, producing garbage
        # that also corrupts recognition of the surrounding English text
        # and numbers.
        ocr_lang = "eng+hin" if _hindi_available() else "eng"
        text = pytesseract.pytesseract.image_to_string(processed, lang=ocr_lang, config="--psm 6")
        if not text or not text.strip():
            # Some documents (dense layouts, receipts) read better with sparse-text mode.
            text = pytesseract.pytesseract.image_to_string(processed, lang=ocr_lang, config="--psm 11")
    except Exception as exc:  # Tesseract binary missing, corrupt image, etc.
        return None, (
            "Could not read the uploaded image automatically "
            f"({exc.__class__.__name__}). Please enter the details manually."
        )

    if not text or not text.strip():
        return None, "No readable text was found in the image. Please enter the details manually."

    return text, None


def extract_from_image_bytes(image_bytes: bytes) -> OCRResponse:
    text, error = run_ocr_on_image_bytes(image_bytes)
    if text is None:
        return OCRResponse(success=False, message=error)

    normalized = text.lower()
    units_res = _resolve_units(normalized)
    amount_res = _resolve_amount(normalized)
    tariff = _first_match(_TARIFF_PATTERNS, normalized)
    period = _first_text_match(_PERIOD_PATTERNS, normalized)

    if units_res.value is None and amount_res.value is None:
        return OCRResponse(
            success=False,
            units_source=units_res.source,
            units_confidence=units_res.confidence,
            units_note=units_res.note,
            amount_source=amount_res.source,
            amount_confidence=amount_res.confidence,
            raw_text=text,
            message=(
                "We couldn't reliably read this bill — not even the meter reading table. "
                "You can still enter your usage and bill amount manually — it only takes a "
                "few seconds — or review the raw scanned text below."
            ),
        )

    message = "We found these details from your bill — please check they look right before continuing."
    if units_res.value is None:
        message = (
            "We found some details, but not your electricity consumption — please enter "
            "that field manually below."
        )

    return OCRResponse(
        success=True,
        units_kwh=units_res.value,
        units_source=units_res.source,
        units_confidence=units_res.confidence,
        units_note=units_res.note,
        current_meter_reading=units_res.current,
        previous_meter_reading=units_res.previous,
        bill_amount_inr=amount_res.value,
        amount_source=amount_res.source,
        amount_confidence=amount_res.confidence,
        billing_period=period,
        detected_tariff_inr_per_kwh=tariff,
        raw_text=text,
        message=message,
    )
