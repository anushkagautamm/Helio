"""Solar sizing and generation-estimate calculations (Sections 8-9)."""
import math

from app.config import (
    DAYS_PER_MONTH,
    MONTHS_PER_YEAR,
    PANEL_AREA_SQM,
    SQFT_TO_SQM,
    SYSTEM_PERFORMANCE_FACTOR,
    USABLE_ROOF_FRACTION,
    PanelSpec,
)


def sqft_to_sqm(area_sqft: float) -> float:
    return area_sqft * SQFT_TO_SQM


def usable_roof_area_sqm(gross_area_sqft: float) -> float:
    """Usable roof area in square metres, after applying the usable fraction."""
    return sqft_to_sqm(gross_area_sqft) * USABLE_ROOF_FRACTION


def panel_count_for_area(usable_area_sqm: float) -> int:
    """Maximum whole panels that physically fit the usable roof area."""
    if usable_area_sqm <= 0:
        return 0
    return math.floor(usable_area_sqm / PANEL_AREA_SQM)


def system_capacity_kw(panel_count: int, panel_watt: int) -> float:
    return (panel_count * panel_watt) / 1000


def monthly_generation_kwh(system_kw: float, irradiance_kwh_per_m2_day: float) -> float:
    """
    monthly generation = system kW x solar irradiance x 30 x 0.75

    This is a preliminary planning estimate, not an engineering-grade
    simulation. SYSTEM_PERFORMANCE_FACTOR bundles inverter, wiring, soiling
    and temperature losses into one configurable assumption.
    """
    return system_kw * irradiance_kwh_per_m2_day * DAYS_PER_MONTH * SYSTEM_PERFORMANCE_FACTOR


def annual_generation_kwh(monthly_kwh: float) -> float:
    return monthly_kwh * MONTHS_PER_YEAR


def monthly_generation_series_kwh(system_kw: float, monthly_irradiance: list[float]) -> list[float]:
    """
    Per-month generation estimate (Jan..Dec) using each month's own long-term
    average irradiance, so the seasonal shape reflects real NASA POWER data
    rather than a flat average repeated twelve times.
    """
    return [round(monthly_generation_kwh(system_kw, irr), 1) for irr in monthly_irradiance]


def size_system_for_panel(gross_roof_area_sqft: float, panel: PanelSpec) -> tuple[int, float]:
    """Return (panel_count, system_capacity_kw) that fits the usable roof area."""
    usable_sqm = usable_roof_area_sqm(gross_roof_area_sqft)
    count = panel_count_for_area(usable_sqm)
    capacity_kw = system_capacity_kw(count, panel.watt)
    return count, capacity_kw
