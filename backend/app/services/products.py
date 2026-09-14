"""
Real manufacturer/product catalogue access + recalculation for the optional
"Compare Actual Products" feature (advanced, secondary to the main
technology-level recommendation).

Deliberately reuses the exact same calculation functions the main
/api/analyze pipeline uses (solar.py, finance.py, subsidy.py,
environment.py) — this module adds no new calculation methodology, it just
runs the existing one with a specific product's real wattage/price instead
of a generic technology-tier assumption.
"""
from app.config import PRODUCT_CATALOG, ProductSpec
from app.models.schemas import PanelResult, ProductEstimateDeltas, ProductInfo
from app.services import finance, solar
from app.services.environment import co2_avoided_kg_per_year, lifetime_co2_avoided_kg
from app.services.subsidy import estimate_subsidy_breakdown, estimate_subsidy_inr


def list_products() -> list[ProductSpec]:
    return PRODUCT_CATALOG


def list_manufacturers() -> list[str]:
    seen: list[str] = []
    for p in PRODUCT_CATALOG:
        if p.manufacturer not in seen:
            seen.append(p.manufacturer)
    return seen


def products_for_manufacturer(manufacturer: str) -> list[ProductSpec]:
    return [p for p in PRODUCT_CATALOG if p.manufacturer == manufacturer]


def get_product(product_id: str) -> ProductSpec | None:
    return next((p for p in PRODUCT_CATALOG if p.id == product_id), None)


def to_product_info(spec: ProductSpec) -> ProductInfo:
    return ProductInfo(
        id=spec.id,
        manufacturer=spec.manufacturer,
        model=spec.model,
        watt_min=spec.watt_min,
        watt_max=spec.watt_max,
        technology=spec.technology,
        efficiency_percent=spec.efficiency_percent,
        price_per_watt_min=spec.price_per_watt_min,
        price_per_watt_max=spec.price_per_watt_max,
        price_available=spec.price_per_watt_min is not None,
        almm_listed=spec.almm_listed,
        warranty_years=spec.warranty_years,
        source_name=spec.source_name,
        source_url=spec.source_url,
        source_date=spec.source_date,
    )


def _representative_watt(spec: ProductSpec) -> int:
    return round((spec.watt_min + spec.watt_max) / 2)


def _representative_price_per_watt(spec: ProductSpec) -> float | None:
    if spec.price_per_watt_min is None or spec.price_per_watt_max is None:
        return None
    return (spec.price_per_watt_min + spec.price_per_watt_max) / 2


def estimate_with_product(
    spec: ProductSpec,
    roof_area_sqft: float,
    irradiance_kwh_per_m2_day: float,
    monthly_irradiance: list[float],
    tariff_inr_per_kwh: float,
    monthly_units_kwh: float | None,
    is_special_category: bool,
) -> PanelResult | None:
    """
    Runs the exact same sizing/financial/subsidy/environmental pipeline as
    the main analyze route, using this product's real wattage and
    (midpoint) price instead of a generic technology-tier assumption.
    Returns None if the product has no publicly available price — cost,
    subsidy, savings and payback cannot be estimated without one, and
    Helio does not fabricate a number to fill the gap.
    """
    price_per_watt = _representative_price_per_watt(spec)
    if price_per_watt is None:
        return None

    watt = _representative_watt(spec)
    usable_sqm = solar.usable_roof_area_sqm(roof_area_sqft)
    panel_count = solar.panel_count_for_area(usable_sqm)
    capacity_kw = solar.system_capacity_kw(panel_count, watt)

    monthly_gen = solar.monthly_generation_kwh(capacity_kw, irradiance_kwh_per_m2_day)
    annual_gen = solar.annual_generation_kwh(monthly_gen)
    monthly_series = solar.monthly_generation_series_kwh(capacity_kw, monthly_irradiance)

    gross_cost = finance.gross_system_cost_inr(capacity_kw, price_per_watt)
    breakdown = finance.cost_breakdown(gross_cost)
    subsidy = estimate_subsidy_inr(capacity_kw, is_special_category)
    subsidy_tiers = estimate_subsidy_breakdown(capacity_kw, is_special_category)
    net_cost = finance.net_system_cost_inr(gross_cost, subsidy)
    m_savings = finance.monthly_savings_inr(monthly_gen, tariff_inr_per_kwh)
    a_savings = finance.annual_savings_inr(m_savings)
    payback = finance.payback_period_years(net_cost, a_savings)
    payback_yr, payback_mo = finance.payback_years_months(payback)
    co2 = co2_avoided_kg_per_year(annual_gen)
    lifetime_co2 = lifetime_co2_avoided_kg(co2)

    offset_percent = (
        round(min(annual_gen / (monthly_units_kwh * 12), 5) * 100, 1)
        if monthly_units_kwh and monthly_units_kwh > 0
        else None
    )

    return PanelResult(
        panel_id=f"product:{spec.id}",
        panel_name=f"{spec.manufacturer} {spec.model}",
        panel_watt=watt,
        cost_per_watt_inr=round(price_per_watt, 2),
        panel_count=panel_count,
        system_capacity_kw=round(capacity_kw, 2),
        monthly_generation_kwh=round(monthly_gen, 1),
        annual_generation_kwh=round(annual_gen, 1),
        monthly_generation_series_kwh=monthly_series,
        gross_cost_inr=round(gross_cost, 0),
        cost_breakdown=breakdown,
        subsidy_inr=round(subsidy, 0),
        subsidy_breakdown=subsidy_tiers,
        net_cost_inr=round(net_cost, 0),
        monthly_savings_inr=round(m_savings, 0),
        annual_savings_inr=round(a_savings, 0),
        payback_years=round(payback, 2) if payback is not None else None,
        payback_years_int=payback_yr,
        payback_months_remainder=payback_mo,
        co2_avoided_kg_per_year=round(co2, 1),
        lifetime_co2_avoided_kg=round(lifetime_co2, 1),
        consumption_offset_percent=offset_percent,
    )


def compute_deltas(result: PanelResult, baseline: PanelResult) -> ProductEstimateDeltas:
    payback_delta = None
    if result.payback_years is not None and baseline.payback_years is not None:
        payback_delta = round(result.payback_years - baseline.payback_years, 2)

    return ProductEstimateDeltas(
        panel_count_delta=result.panel_count - baseline.panel_count,
        system_capacity_kw_delta=round(result.system_capacity_kw - baseline.system_capacity_kw, 2),
        gross_cost_inr_delta=round(result.gross_cost_inr - baseline.gross_cost_inr, 0),
        annual_generation_kwh_delta=round(result.annual_generation_kwh - baseline.annual_generation_kwh, 1),
        annual_savings_inr_delta=round(result.annual_savings_inr - baseline.annual_savings_inr, 0),
        payback_years_delta=payback_delta,
    )
