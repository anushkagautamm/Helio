"""PM Surya Ghar central subsidy calculation (Section 11).

Reference: MNRE "Guidelines for PM-Surya Ghar: Muft Bijli Yojana, Central
Financial Assistance to Residential Consumers", effective 13 Feb 2024 (see
SUBSIDY_SOURCE in config.py for the full citation). This module produces an
ESTIMATE only — official eligibility and disbursed amounts depend on DISCOM
verification and the applicable government order at the time of application.
"""
from app.config import (
    SPECIAL_CATEGORY_STATES,
    SUBSIDY_MAX_INR,
    SUBSIDY_MAX_INR_SPECIAL,
    SUBSIDY_TIER1_KW,
    SUBSIDY_TIER1_RATE,
    SUBSIDY_TIER1_RATE_SPECIAL,
    SUBSIDY_TIER2_KW,
    SUBSIDY_TIER2_RATE,
    SUBSIDY_TIER2_RATE_SPECIAL,
)
from app.models.schemas import SubsidyTierBreakdown


def is_special_category_state(location_label: str | None) -> bool:
    """
    Whether a geocoded location string names one of the Special Category
    States/UTs that get a higher PM Surya Ghar CFA rate (Uttarakhand,
    Himachal Pradesh, J&K, Ladakh, the North-East states, A&N Islands,
    Lakshadweep). A simple substring check against the official list — good
    enough for a planning estimate; genuine eligibility is decided by the
    DISCOM, not by this heuristic.
    """
    if not location_label:
        return False
    label = location_label.lower()
    return any(state in label for state in SPECIAL_CATEGORY_STATES)


def _rates(is_special_category: bool) -> tuple[float, float, float]:
    if is_special_category:
        return SUBSIDY_TIER1_RATE_SPECIAL, SUBSIDY_TIER2_RATE_SPECIAL, SUBSIDY_MAX_INR_SPECIAL
    return SUBSIDY_TIER1_RATE, SUBSIDY_TIER2_RATE, SUBSIDY_MAX_INR


def estimate_subsidy_inr(system_capacity_kw: float, is_special_category: bool = False) -> float:
    """
    First 2 kW: Rs 30,000/kW (Rs 33,000/kW in special-category States/UTs)
    Additional capacity from 2-3 kW: Rs 18,000/kW (Rs 19,800/kW special)
    Capped at Rs 78,000 (Rs 84,600 special) regardless of capacity above 3 kW.
    """
    if system_capacity_kw <= 0:
        return 0.0

    tier1_rate, tier2_rate, max_inr = _rates(is_special_category)

    tier1_kw = min(system_capacity_kw, SUBSIDY_TIER1_KW)
    subsidy = tier1_kw * tier1_rate

    if system_capacity_kw > SUBSIDY_TIER1_KW:
        tier2_kw = min(system_capacity_kw, SUBSIDY_TIER2_KW) - SUBSIDY_TIER1_KW
        subsidy += tier2_kw * tier2_rate

    return min(subsidy, max_inr)


def estimate_subsidy_breakdown(
    system_capacity_kw: float, is_special_category: bool = False
) -> list[SubsidyTierBreakdown]:
    """
    Itemized version of estimate_subsidy_inr, for transparent UI/PDF display.
    Only includes tiers that actually apply to this system size, and never
    exceeds the overall subsidy cap even if the two tiers alone would.
    """
    if system_capacity_kw <= 0:
        return []

    tier1_rate, tier2_rate, max_inr = _rates(is_special_category)
    breakdown: list[SubsidyTierBreakdown] = []
    running_total = 0.0

    tier1_kw = min(system_capacity_kw, SUBSIDY_TIER1_KW)
    if tier1_kw > 0:
        amount = min(tier1_kw * tier1_rate, max_inr - running_total)
        breakdown.append(
            SubsidyTierBreakdown(
                label=f"First {tier1_kw:.2g} kW",
                kw_in_tier=round(tier1_kw, 2),
                rate_per_kw_inr=tier1_rate,
                amount_inr=round(amount, 0),
            )
        )
        running_total += amount

    if system_capacity_kw > SUBSIDY_TIER1_KW and running_total < max_inr:
        tier2_kw = min(system_capacity_kw, SUBSIDY_TIER2_KW) - SUBSIDY_TIER1_KW
        if tier2_kw > 0:
            amount = min(tier2_kw * tier2_rate, max_inr - running_total)
            breakdown.append(
                SubsidyTierBreakdown(
                    label=f"Additional {tier2_kw:.2g} kW (2-3 kW slab)",
                    kw_in_tier=round(tier2_kw, 2),
                    rate_per_kw_inr=tier2_rate,
                    amount_inr=round(amount, 0),
                )
            )

    return breakdown
