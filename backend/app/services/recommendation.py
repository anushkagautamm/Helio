"""
Transparent, rule-based solar suitability recommendation engine (Section 14).

No machine learning is used. Every rating is derived from a small set of
explicit thresholds applied to numbers the user can already see elsewhere in
the report, and every rating comes with the reasons that produced it.
"""
from app.models.schemas import PanelResult, Recommendation

HIGHLY_SUITABLE = "Highly Suitable"
SUITABLE = "Suitable"
POTENTIALLY_SUITABLE = "Potentially Suitable"
NEEDS_ASSESSMENT = "Needs Further Assessment"


def _offset_ratio(annual_generation_kwh: float, monthly_units_kwh: float | None) -> float | None:
    if not monthly_units_kwh or monthly_units_kwh <= 0:
        return None
    annual_consumption = monthly_units_kwh * 12
    if annual_consumption <= 0:
        return None
    return annual_generation_kwh / annual_consumption


def _payback_score(payback_years: float | None) -> int:
    if payback_years is None:
        return 0
    if payback_years <= 5:
        return 3
    if payback_years <= 8:
        return 2
    if payback_years <= 12:
        return 1
    return 0


def _offset_score(offset_ratio: float | None) -> int:
    if offset_ratio is None:
        return 1  # neutral — insufficient consumption data to judge
    if offset_ratio >= 0.8:
        return 3
    if offset_ratio >= 0.5:
        return 2
    if offset_ratio >= 0.2:
        return 1
    return 0


def build_recommendation(
    panel_result: PanelResult,
    monthly_units_kwh: float | None,
    roof_area_sqft: float,
) -> Recommendation:
    reasons: list[str] = []

    if panel_result.panel_count == 0:
        return Recommendation(
            rating=NEEDS_ASSESSMENT,
            headline=(
                "Your estimated usable roof area is too small to fit even one "
                "standard solar panel with the current assumptions."
            ),
            reasons=[
                f"Roof area of {roof_area_sqft:.0f} sq ft did not yield enough usable, "
                "unshaded area for a single panel under our sizing assumptions.",
                "Consider a professional site visit to check for additional usable "
                "roof space, shading, or structural options.",
            ],
            based_on_panel_id=panel_result.panel_id,
        )

    offset_ratio = _offset_ratio(panel_result.annual_generation_kwh, monthly_units_kwh)
    payback = panel_result.payback_years

    score = _payback_score(payback) + _offset_score(offset_ratio)

    reasons.append(
        f"Estimated system size is {panel_result.system_capacity_kw:.1f} kW "
        f"({panel_result.panel_count} panels), generating about "
        f"{panel_result.annual_generation_kwh:,.0f} kWh/year."
    )

    if offset_ratio is not None:
        reasons.append(
            f"This could offset roughly {offset_ratio * 100:.0f}% of your estimated "
            "annual electricity consumption."
        )
    else:
        reasons.append(
            "Electricity consumption was not provided, so consumption offset could "
            "not be factored in precisely — figures below use the default tariff assumption."
        )

    if payback is not None:
        reasons.append(f"The estimated payback period is approximately {payback:.1f} years.")
    else:
        reasons.append(
            "Payback period could not be estimated because projected savings are zero."
        )

    reasons.append(
        f"Avoiding an estimated {panel_result.co2_avoided_kg_per_year:,.0f} kg of CO2 "
        "emissions per year."
    )

    if score >= 5:
        rating = HIGHLY_SUITABLE
        headline = (
            f"Your roof appears highly suitable for a {panel_result.system_capacity_kw:.1f} kW "
            "solar system, with strong savings and a short payback period."
        )
    elif score >= 3:
        rating = SUITABLE
        headline = (
            f"Your roof appears suitable for a {panel_result.system_capacity_kw:.1f} kW system. "
            "The estimated financial case is reasonably strong."
        )
    elif score >= 1:
        rating = POTENTIALLY_SUITABLE
        headline = (
            f"A {panel_result.system_capacity_kw:.1f} kW system is potentially suitable, but the "
            "financial case is more moderate — review the numbers below carefully."
        )
    else:
        rating = NEEDS_ASSESSMENT
        headline = (
            "Based on the current inputs, the financial case is weak. We recommend a "
            "professional site assessment before proceeding."
        )

    return Recommendation(
        rating=rating,
        headline=headline,
        reasons=reasons,
        based_on_panel_id=panel_result.panel_id,
    )
