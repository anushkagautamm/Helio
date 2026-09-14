"""Cost and financial-analysis calculations (Sections 10, 12)."""
from typing import Optional

from app.config import COST_BREAKDOWN_FRACTIONS
from app.models.schemas import CostBreakdown


def gross_system_cost_inr(system_capacity_kw: float, cost_per_watt_inr: float) -> float:
    """gross cost = system capacity in watts x cost per watt"""
    watts = system_capacity_kw * 1000
    return watts * cost_per_watt_inr


def cost_breakdown(gross_cost_inr: float) -> CostBreakdown:
    """
    Splits the gross installed cost into module / inverter+BOS /
    installation-EPC components using COST_BREAKDOWN_FRACTIONS, so the
    three always sum back to exactly gross_cost_inr (Section 9 — panel
    price alone must not look like the full installed-system cost).
    """
    module = gross_cost_inr * COST_BREAKDOWN_FRACTIONS["module"]
    inverter_bos = gross_cost_inr * COST_BREAKDOWN_FRACTIONS["inverter_bos"]
    # Installation/EPC takes the remainder rather than its own multiplication,
    # so rounding never leaves the three components short of the total.
    installation_epc = gross_cost_inr - module - inverter_bos
    return CostBreakdown(
        module_cost_inr=round(module, 0),
        inverter_bos_cost_inr=round(inverter_bos, 0),
        installation_epc_cost_inr=round(installation_epc, 0),
    )


def net_system_cost_inr(gross_cost_inr: float, subsidy_inr: float) -> float:
    return max(gross_cost_inr - subsidy_inr, 0.0)


def monthly_savings_inr(monthly_generation_kwh: float, tariff_inr_per_kwh: float) -> float:
    return monthly_generation_kwh * tariff_inr_per_kwh


def annual_savings_inr(monthly_savings: float) -> float:
    return monthly_savings * 12


def payback_period_years(net_cost_inr: float, annual_savings_inr: float) -> Optional[float]:
    """Returns None when there are no savings to pay back the investment with."""
    if annual_savings_inr <= 0:
        return None
    return net_cost_inr / annual_savings_inr


def payback_years_months(payback_years: Optional[float]) -> tuple[Optional[int], Optional[int]]:
    """Split a fractional payback-year figure into whole years + remainder months."""
    if payback_years is None:
        return None, None
    whole_years = int(payback_years)
    remainder_months = round((payback_years - whole_years) * 12)
    if remainder_months == 12:
        whole_years += 1
        remainder_months = 0
    return whole_years, remainder_months
