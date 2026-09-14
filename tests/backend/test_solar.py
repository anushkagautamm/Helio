from app.config import PANEL_OPTIONS
from app.services.solar import (
    annual_generation_kwh,
    monthly_generation_kwh,
    monthly_generation_series_kwh,
    panel_count_for_area,
    size_system_for_panel,
    sqft_to_sqm,
    system_capacity_kw,
    usable_roof_area_sqm,
)


def test_sqft_to_sqm_conversion():
    assert sqft_to_sqm(1000) == 1000 * 0.09290304


def test_usable_roof_area_applies_fraction():
    gross_sqm = sqft_to_sqm(1000)
    assert usable_roof_area_sqm(1000) == round(gross_sqm * 0.65, 10) or abs(
        usable_roof_area_sqm(1000) - gross_sqm * 0.65
    ) < 1e-9


def test_panel_count_floors_down():
    # 1.6 sqm per panel -> 5.0 sqm fits exactly 3 panels (not 3.125)
    assert panel_count_for_area(5.0) == 3


def test_panel_count_zero_or_negative_area():
    assert panel_count_for_area(0) == 0
    assert panel_count_for_area(-10) == 0


def test_system_capacity_kw():
    assert system_capacity_kw(10, 400) == 4.0


def test_monthly_generation_formula():
    # system kW x irradiance x 30 x 0.75
    result = monthly_generation_kwh(3.0, 5.5)
    assert result == 3.0 * 5.5 * 30 * 0.75


def test_annual_generation_is_twelve_times_monthly():
    assert annual_generation_kwh(100) == 1200


def test_size_system_never_exceeds_usable_roof_area():
    """The number of panels chosen must physically fit the usable roof area."""
    roof_sqft = 500
    panel = next(p for p in PANEL_OPTIONS if p.id == "mono_perc")
    count, _ = size_system_for_panel(roof_sqft, panel)
    usable_sqm = usable_roof_area_sqm(roof_sqft)
    assert count * 1.6 <= usable_sqm


def test_size_system_zero_roof_area_gives_zero_panels():
    panel = PANEL_OPTIONS[0]
    count, capacity = size_system_for_panel(0, panel)
    assert count == 0
    assert capacity == 0


def test_monthly_generation_series_uses_each_months_irradiance():
    monthly_irradiance = [4.0] * 6 + [6.0] * 6
    series = monthly_generation_series_kwh(3.0, monthly_irradiance)
    assert len(series) == 12
    assert series[0] == round(monthly_generation_kwh(3.0, 4.0), 1)
    assert series[6] == round(monthly_generation_kwh(3.0, 6.0), 1)


def test_monthly_generation_series_empty_input():
    assert monthly_generation_series_kwh(3.0, []) == []
