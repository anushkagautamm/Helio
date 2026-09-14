from app.models.schemas import (
    AnalyzeResponse,
    ElectricityInfo,
    PanelResult,
    Recommendation,
    RoofInfo,
    SolarResource,
)
from app.services.quote import compare_quote_to_estimate, extract_quote_from_text
from app.models.schemas import QuoteInfo


SAMPLE_QUOTE_TEXT = """
Installer Name: Sunrise Solar Solutions
Panel Manufacturer: Waaree
Panel Model: Aditya WSM-540
No. of Panels: 10
System Capacity: 5.4 kWp
Inverter Brand: Luminous
Total Project Price: Rs. 3,25,000
Installation Charges: Rs. 15,000
Subsidy Assumed: Rs. 78,000
Mounting Structure: RCC rooftop, GI structure
Warranty: 25 years performance warranty
"""


def _panel_result(**overrides) -> PanelResult:
    base = dict(
        panel_id="mono_perc",
        panel_name="Mono PERC",
        panel_watt=400,
        cost_per_watt_inr=48,
        panel_count=8,
        system_capacity_kw=3.2,
        monthly_generation_kwh=396.0,
        annual_generation_kwh=4752.0,
        gross_cost_inr=153600,
        subsidy_inr=78000,
        net_cost_inr=75600,
        monthly_savings_inr=2772.0,
        annual_savings_inr=33264.0,
        payback_years=2.27,
        payback_years_int=2,
        payback_months_remainder=3,
        co2_avoided_kg_per_year=3896.6,
        lifetime_co2_avoided_kg=3896.6 * 25,
    )
    base.update(overrides)
    return PanelResult(**base)


def _analysis(panel: PanelResult) -> AnalyzeResponse:
    return AnalyzeResponse(
        location=None,
        roof=RoofInfo(gross_area_sqft=800, gross_area_sqm=74.3, usable_area_sqm=52.0, usable_fraction=0.7),
        electricity=ElectricityInfo(
            monthly_units_kwh=300, monthly_bill_inr=2500, tariff_inr_per_kwh=7.0,
            tariff_source="Derived from your bill",
        ),
        solar_resource=SolarResource(
            irradiance_kwh_per_m2_day=5.5, monthly_irradiance_kwh_per_m2_day=[5.5] * 12,
            source="NASA POWER", is_fallback=False, note="",
        ),
        panel_results=[panel],
        recommended_panel_id=panel.panel_id,
        recommendation=Recommendation(
            rating="Highly Suitable", headline="Great fit", reasons=["short payback"],
            based_on_panel_id=panel.panel_id,
        ),
        assumptions={},
    )


def test_extract_quote_from_text_finds_expected_fields():
    result = extract_quote_from_text(SAMPLE_QUOTE_TEXT)
    assert result.success is True
    assert result.quote.installer_name is not None
    assert result.quote.panel_manufacturer is not None
    assert result.quote.panel_count == 10
    assert result.quote.system_capacity_kw == 5.4
    assert result.quote.total_price_inr == 325000
    assert result.quote.installation_charges_inr == 15000
    assert result.quote.subsidy_assumed_inr == 78000
    assert "Panel wattage" in result.fields_missing or result.quote.panel_watt is None


def test_extract_quote_from_text_no_matches_returns_unsuccessful():
    result = extract_quote_from_text("This is a random unrelated document with no quote fields.")
    assert result.success is False
    assert result.fields_found == []


def test_compare_quote_never_uses_judgmental_language():
    panel = _panel_result()
    analysis = _analysis(panel)
    quote = QuoteInfo(
        system_capacity_kw=6.0, panel_count=12, panel_watt=500,
        total_price_inr=250000, subsidy_assumed_inr=78000,
    )
    response = compare_quote_to_estimate(quote, analysis)
    # "good or bad" appears deliberately in the summary as an explicit
    # disclaimer of what this comparison is NOT doing — only the per-field
    # notes (which render as verdicts on this specific quote) must avoid
    # judgmental language entirely.
    banned_words = ["bad", "scam", "overpriced", "rip-off", "ripoff", "fraud"]
    notes_text = " ".join(item.note.lower() for item in response.items)
    for word in banned_words:
        assert word not in notes_text


def test_compare_quote_matches_baseline_produces_consistent_note():
    panel = _panel_result()
    analysis = _analysis(panel)
    quote = QuoteInfo(
        system_capacity_kw=panel.system_capacity_kw, panel_count=panel.panel_count,
        total_price_inr=panel.gross_cost_inr,
    )
    response = compare_quote_to_estimate(quote, analysis)
    capacity_item = next(i for i in response.items if i.label == "System capacity")
    assert "consistent" in capacity_item.note.lower()


def test_compare_quote_handles_missing_fields_gracefully():
    panel = _panel_result()
    analysis = _analysis(panel)
    quote = QuoteInfo()  # nothing filled in
    response = compare_quote_to_estimate(quote, analysis)
    assert len(response.items) > 0
    assert all(item.quote_value == "Not stated on the quote" for item in response.items if item.label in {"System capacity", "Total price (before subsidy)"})


def test_compare_quote_uses_recommended_panel_by_default():
    panel = _panel_result(panel_id="bifacial")
    analysis = _analysis(panel)
    response = compare_quote_to_estimate(QuoteInfo(), analysis)
    capacity_item = next(i for i in response.items if i.label == "System capacity")
    assert f"{panel.system_capacity_kw:g}" in capacity_item.helio_value
