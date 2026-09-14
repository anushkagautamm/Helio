"""Electricity bill interpretation and tariff derivation (Section 5)."""
from typing import Optional

from app.config import DEFAULT_TARIFF_INR_PER_KWH


def effective_tariff_inr_per_kwh(
    bill_amount_inr: Optional[float], units_kwh: Optional[float]
) -> tuple[float, str]:
    """
    effective tariff = bill amount / electricity units

    Falls back to the configured default tariff, clearly labelled, whenever
    either input is missing, zero, or negative.
    """
    if bill_amount_inr and units_kwh and bill_amount_inr > 0 and units_kwh > 0:
        return round(bill_amount_inr / units_kwh, 4), "Derived from your bill (amount / units)"
    return (
        DEFAULT_TARIFF_INR_PER_KWH,
        f"Default assumption (₹{DEFAULT_TARIFF_INR_PER_KWH:.0f}/kWh) — insufficient bill data",
    )
