from app.models.schemas import PanelResult
from app.services.recommendation import (
    HIGHLY_SUITABLE,
    NEEDS_ASSESSMENT,
    build_recommendation,
)


def _panel_result(**overrides) -> PanelResult:
    base = dict(
        panel_id="mono_perc",
        panel_name="Mono PERC",
        panel_watt=400,
        cost_per_watt_inr=32,
        panel_count=8,
        system_capacity_kw=3.2,
        monthly_generation_kwh=396.0,
        annual_generation_kwh=4752.0,
        gross_cost_inr=102400,
        subsidy_inr=78000,
        net_cost_inr=24400,
        monthly_savings_inr=2772.0,
        annual_savings_inr=33264.0,
        payback_years=0.73,
        payback_years_int=0,
        payback_months_remainder=9,
        co2_avoided_kg_per_year=3896.6,
        lifetime_co2_avoided_kg=3896.6 * 25,
    )
    base.update(overrides)
    return PanelResult(**base)


def test_zero_panels_needs_assessment():
    panel = _panel_result(panel_count=0, system_capacity_kw=0, payback_years=None, payback_years_int=None, payback_months_remainder=None)
    rec = build_recommendation(panel, monthly_units_kwh=300, roof_area_sqft=100)
    assert rec.rating == NEEDS_ASSESSMENT


def test_short_payback_high_offset_is_highly_suitable():
    panel = _panel_result(payback_years=4.0)
    rec = build_recommendation(panel, monthly_units_kwh=300, roof_area_sqft=800)
    assert rec.rating == HIGHLY_SUITABLE
    assert rec.based_on_panel_id == "mono_perc"
    assert len(rec.reasons) > 0


def test_long_payback_low_offset_is_needs_assessment_or_potentially_suitable():
    panel = _panel_result(payback_years=15.0, annual_generation_kwh=200)
    rec = build_recommendation(panel, monthly_units_kwh=2000, roof_area_sqft=300)
    assert rec.rating in {"Potentially Suitable", NEEDS_ASSESSMENT}


def test_missing_consumption_still_produces_explanation():
    panel = _panel_result()
    rec = build_recommendation(panel, monthly_units_kwh=None, roof_area_sqft=800)
    assert any("not provided" in reason.lower() for reason in rec.reasons)


def test_no_savings_reports_payback_not_available():
    panel = _panel_result(payback_years=None, payback_years_int=None, payback_months_remainder=None, annual_savings_inr=0)
    rec = build_recommendation(panel, monthly_units_kwh=300, roof_area_sqft=800)
    assert any("could not be estimated" in reason.lower() for reason in rec.reasons)
