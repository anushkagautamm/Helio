"""
"Compare My Solar Quote" — optional advanced feature.

Extracts structured details from an installer quotation (image upload, via
the same Tesseract OCR pipeline used for electricity bills) and compares
them against Helio's own calculated estimate for the same home, using
careful, hedged, non-judgmental language.

Reuses app.services.ocr's preprocessing + Tesseract invocation rather than
duplicating it. Never blindly trusts extracted values — every extracted
field is meant to be shown to the user for confirmation/editing before any
comparison happens (enforced by the route/frontend, not this module).
"""
import re
from typing import Optional

from app.models.schemas import (
    AnalyzeResponse,
    PanelResult,
    QuoteComparisonItem,
    QuoteComparisonResponse,
    QuoteExtractResponse,
    QuoteInfo,
)
from app.services.ocr import run_ocr_on_image_bytes

_INSTALLER_PATTERNS = [
    r"(?:installer|company|vendor|contractor|epc)\s*(?:name)?\s*[:\-]\s*([a-z][a-z0-9 &.\-]{2,60})",
]

_MANUFACTURER_PATTERNS = [
    r"(?:panel|module)\s*(?:manufacturer|brand|make)\s*[:\-]\s*([a-z][a-z0-9 &.\-]{2,40})",
    r"\b(waaree|tata\s*power\s*solar|tata\s*solar|adani\s*solar|adani|vikram\s*solar|renewsys|premier\s*energies|emmvee)\b",
]

_MODEL_PATTERNS = [
    r"(?:panel|module)\s*model\s*[:\-]\s*([a-z0-9][a-z0-9 \-]{1,40})",
    r"\bmodel\s*(?:no\.?|number)?\s*[:\-]\s*([a-z0-9][a-z0-9 \-]{1,40})",
]

_PANEL_WATT_PATTERNS = [
    r"(\d{3,4})\s*w(?:att)?p?\b(?!/)",
]

_PANEL_COUNT_PATTERNS = [
    r"(?:no\.?\s*of\s*panels|number\s*of\s*panels|panel\s*(?:qty|quantity|count))\s*[:\-]\s*(\d{1,3})",
    r"(\d{1,3})\s*(?:x|nos\.?|panels)\b",
]

_CAPACITY_PATTERNS = [
    r"(?:system\s*capacity|plant\s*capacity|capacity)\s*[:\-]?\s*(\d{1,3}(?:\.\d+)?)\s*kwp?\b",
    r"(\d{1,3}(?:\.\d+)?)\s*kwp\b",
]

_INVERTER_PATTERNS = [
    r"inverter\s*(?:brand|make|manufacturer)?\s*[:\-]\s*([a-z][a-z0-9 &.\-]{2,40})",
]

_TOTAL_PRICE_PATTERNS = [
    r"(?:total\s*(?:project\s*)?(?:price|cost|amount)|grand\s*total|quotation\s*(?:value|amount))\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*(?:\.\d{1,2})?)",
]

_INSTALLATION_CHARGE_PATTERNS = [
    r"install(?:ation|ing)?\s*(?:charges?|cost|fee)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*(?:\.\d{1,2})?)",
]

_SUBSIDY_PATTERNS = [
    r"subsidy\s*(?:assumed|amount|included|considered)?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*(?:\.\d{1,2})?)",
]

_MOUNTING_PATTERNS = [
    r"mounting\s*(?:structure|type)?\s*[:\-]\s*([a-z][a-z0-9 \-]{2,40})",
]

_WARRANTY_PATTERNS = [
    r"warranty\s*[:\-]?\s*([a-z0-9][a-z0-9 ,\-]{2,60})",
]


def _first_number(patterns: list[str], text: str) -> Optional[float]:
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw = match.group(1).replace(",", "")
            try:
                return float(raw)
            except ValueError:
                continue
    return None


def _first_text(patterns: list[str], text: str) -> Optional[str]:
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip().title()
    return None


def extract_quote_from_text(text: str) -> QuoteExtractResponse:
    """
    Runs field extraction over already-OCR'd (or manually pasted) quote
    text. Split out from extract_quote_from_image_bytes so both the OCR
    path and any future "paste text" path share one extraction pass.
    """
    normalized = text.lower()

    quote = QuoteInfo(
        installer_name=_first_text(_INSTALLER_PATTERNS, normalized),
        panel_manufacturer=_first_text(_MANUFACTURER_PATTERNS, normalized),
        panel_model=_first_text(_MODEL_PATTERNS, normalized),
        panel_watt=_first_number(_PANEL_WATT_PATTERNS, normalized),
        panel_count=(
            int(v) if (v := _first_number(_PANEL_COUNT_PATTERNS, normalized)) is not None else None
        ),
        system_capacity_kw=_first_number(_CAPACITY_PATTERNS, normalized),
        inverter_brand=_first_text(_INVERTER_PATTERNS, normalized),
        total_price_inr=_first_number(_TOTAL_PRICE_PATTERNS, normalized),
        installation_charges_inr=_first_number(_INSTALLATION_CHARGE_PATTERNS, normalized),
        subsidy_assumed_inr=_first_number(_SUBSIDY_PATTERNS, normalized),
        mounting_structure=_first_text(_MOUNTING_PATTERNS, normalized),
        warranty_info=_first_text(_WARRANTY_PATTERNS, normalized),
    )

    field_labels = {
        "installer_name": "Installer name",
        "panel_manufacturer": "Panel manufacturer",
        "panel_model": "Panel model",
        "panel_watt": "Panel wattage",
        "panel_count": "Number of panels",
        "system_capacity_kw": "System capacity",
        "inverter_brand": "Inverter brand",
        "total_price_inr": "Total price",
        "installation_charges_inr": "Installation charges",
        "subsidy_assumed_inr": "Subsidy assumed",
        "mounting_structure": "Mounting structure",
        "warranty_info": "Warranty",
    }
    fields_found = [label for field, label in field_labels.items() if getattr(quote, field) is not None]
    fields_missing = [label for field, label in field_labels.items() if getattr(quote, field) is None]

    if not fields_found:
        return QuoteExtractResponse(
            success=False,
            quote=quote,
            fields_found=fields_found,
            fields_missing=fields_missing,
            raw_text=text,
            message=(
                "We couldn't reliably find any quote details in this document. "
                "You can enter the details manually below, or review the raw scanned text."
            ),
        )

    return QuoteExtractResponse(
        success=True,
        quote=quote,
        fields_found=fields_found,
        fields_missing=fields_missing,
        raw_text=text,
        message=(
            "We found these details from your quote — please check they look right, and fill in "
            "or correct anything before comparing it to Helio's estimate."
        ),
    )


def extract_quote_from_image_bytes(image_bytes: bytes) -> QuoteExtractResponse:
    text, error = run_ocr_on_image_bytes(image_bytes)
    if text is None:
        return QuoteExtractResponse(success=False, quote=QuoteInfo(), message=error)
    return extract_quote_from_text(text)


def _fmt_inr(value: Optional[float]) -> str:
    if value is None:
        return "Not stated on the quote"
    return f"₹{value:,.0f}"


def _fmt_num(value, unit: str = "") -> str:
    if value is None:
        return "Not stated on the quote"
    return f"{value:g}{unit}"


def compare_quote_to_estimate(
    quote: QuoteInfo, analysis: AnalyzeResponse, compare_to_panel_id: Optional[str] = None
) -> QuoteComparisonResponse:
    """
    Compares a user-supplied installer quote against Helio's own calculated
    estimate for the same home. Uses deliberately hedged, plain-English
    language — Helio has no way to verify the quote independently, so it
    never labels a quote "bad", "a scam", or "overpriced"; it only points
    out differences worth asking the installer about.
    """
    panel_id = compare_to_panel_id or analysis.recommended_panel_id
    baseline: Optional[PanelResult] = next(
        (p for p in analysis.panel_results if p.panel_id == panel_id), None
    )
    if baseline is None and analysis.panel_results:
        baseline = analysis.panel_results[0]

    items: list[QuoteComparisonItem] = []

    if baseline is None:
        return QuoteComparisonResponse(
            items=items,
            summary="Helio doesn't have a calculated estimate to compare this quote against yet.",
        )

    if quote.system_capacity_kw is not None:
        diff = quote.system_capacity_kw - baseline.system_capacity_kw
        if abs(diff) <= 0.3:
            note = "Appears consistent with Helio's indicative estimate for your roof and usage."
        elif diff > 0:
            note = (
                "Larger than Helio's indicative estimate — worth asking the installer why a bigger "
                "system was proposed (it may reflect a site visit Helio can't replicate)."
            )
        else:
            note = (
                "Smaller than Helio's indicative estimate — worth asking the installer whether this "
                "fully covers your usable roof area and typical consumption."
            )
        items.append(
            QuoteComparisonItem(
                label="System capacity",
                helio_value=_fmt_num(baseline.system_capacity_kw, " kW"),
                quote_value=_fmt_num(quote.system_capacity_kw, " kW"),
                note=note,
            )
        )
    else:
        items.append(
            QuoteComparisonItem(
                label="System capacity",
                helio_value=_fmt_num(baseline.system_capacity_kw, " kW"),
                quote_value="Not stated on the quote",
                note="Cannot be compared without the system capacity from the quote.",
            )
        )

    if quote.panel_count is not None:
        diff = quote.panel_count - baseline.panel_count
        if diff == 0:
            note = "Matches Helio's estimated panel count for your usable roof area."
        else:
            note = (
                "Differs from Helio's estimated panel count — this alone isn't a problem, since panel "
                "wattage and roof layout both affect the count, but it's worth understanding why."
            )
        items.append(
            QuoteComparisonItem(
                label="Number of panels",
                helio_value=str(baseline.panel_count),
                quote_value=str(quote.panel_count),
                note=note,
            )
        )

    if quote.panel_watt is not None:
        note = (
            "Higher-wattage panels than Helio's baseline technology assumption — this can be a "
            "reasonable upgrade, and would mean fewer panels for the same capacity."
            if quote.panel_watt > baseline.panel_watt
            else "Lower-wattage panels than Helio's baseline technology assumption."
            if quote.panel_watt < baseline.panel_watt
            else "Matches Helio's baseline panel wattage assumption."
        )
        items.append(
            QuoteComparisonItem(
                label="Panel wattage",
                helio_value=_fmt_num(baseline.panel_watt, " W"),
                quote_value=_fmt_num(quote.panel_watt, " W"),
                note=note,
            )
        )

    if quote.total_price_inr is not None:
        diff_pct = (quote.total_price_inr - baseline.gross_cost_inr) / baseline.gross_cost_inr * 100
        if abs(diff_pct) <= 10:
            note = "Broadly in line with Helio's indicative gross cost estimate for a system this size."
        elif diff_pct > 10:
            note = (
                f"About {diff_pct:.0f}% higher than Helio's indicative gross cost estimate — worth "
                "asking the installer for an itemized breakdown (panels, inverter, mounting, labour) "
                "to see what accounts for the difference."
            )
        else:
            note = (
                f"About {abs(diff_pct):.0f}% lower than Helio's indicative gross cost estimate — this "
                "can happen with genuine discounts or a smaller-than-assumed system, but it's worth "
                "confirming exactly what's included before signing."
            )
        items.append(
            QuoteComparisonItem(
                label="Total price (before subsidy)",
                helio_value=_fmt_inr(baseline.gross_cost_inr),
                quote_value=_fmt_inr(quote.total_price_inr),
                note=note,
            )
        )
    else:
        items.append(
            QuoteComparisonItem(
                label="Total price (before subsidy)",
                helio_value=_fmt_inr(baseline.gross_cost_inr),
                quote_value="Not stated on the quote",
                note="Cannot be compared without a total price from the quote.",
            )
        )

    if quote.subsidy_assumed_inr is not None:
        diff = quote.subsidy_assumed_inr - baseline.subsidy_inr
        if abs(diff) <= 2000:
            note = "Matches Helio's estimated PM Surya Ghar subsidy for a system this size."
        else:
            note = (
                "Differs from Helio's estimated PM Surya Ghar subsidy — subsidy eligibility depends on "
                "ALMM-listed equipment and other conditions Helio can't fully verify, so it's worth "
                "confirming this figure directly with the installer or the subsidy portal."
            )
        items.append(
            QuoteComparisonItem(
                label="Subsidy assumed",
                helio_value=_fmt_inr(baseline.subsidy_inr),
                quote_value=_fmt_inr(quote.subsidy_assumed_inr),
                note=note,
            )
        )

    summary = (
        "This is a plain comparison between what your quote states and Helio's own calculated "
        "estimate for your home — it is not a verdict on whether the quote is good or bad. Differences "
        "can come from site-specific factors (shading, roof condition, equipment choice) that Helio's "
        "estimate can't see. Use it as a starting point for questions to your installer, not a final answer."
    )
    return QuoteComparisonResponse(items=items, summary=summary)
