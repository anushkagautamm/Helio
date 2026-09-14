from fastapi import APIRouter

from app.config import (
    CO2_EMISSION_FACTOR_KG_PER_KWH,
    DEFAULT_TARIFF_INR_PER_KWH,
    FALLBACK_IRRADIANCE_KWH_PER_M2_DAY,
    PANEL_AREA_SQM,
    PANEL_OPTIONS,
    SUBSIDY_SOURCE,
    SYSTEM_LIFETIME_YEARS,
    SYSTEM_PERFORMANCE_FACTOR,
    USABLE_ROOF_FRACTION,
)
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ElectricityInfo,
    LocationResult,
    PanelResult,
    RoofInfo,
    SubsidyMeta,
)
from app.services.electricity import effective_tariff_inr_per_kwh
from app.services.environment import co2_avoided_kg_per_year, lifetime_co2_avoided_kg
from app.services.finance import (
    annual_savings_inr,
    cost_breakdown,
    gross_system_cost_inr,
    monthly_savings_inr,
    net_system_cost_inr,
    payback_period_years,
    payback_years_months,
)
from app.services.nasa_power import get_solar_resource
from app.services.recommendation import build_recommendation
from app.services.solar import (
    annual_generation_kwh,
    monthly_generation_kwh,
    monthly_generation_series_kwh,
    size_system_for_panel,
    sqft_to_sqm,
    usable_roof_area_sqm,
)
from app.services.subsidy import (
    estimate_subsidy_breakdown,
    estimate_subsidy_inr,
    is_special_category_state,
)

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    roof_info = RoofInfo(
        gross_area_sqft=request.roof_area_sqft,
        gross_area_sqm=round(sqft_to_sqm(request.roof_area_sqft), 2),
        usable_area_sqm=round(usable_roof_area_sqm(request.roof_area_sqft), 2),
        usable_fraction=USABLE_ROOF_FRACTION,
    )

    tariff, tariff_source = effective_tariff_inr_per_kwh(
        request.monthly_bill_inr, request.monthly_units_kwh
    )
    electricity_info = ElectricityInfo(
        monthly_units_kwh=request.monthly_units_kwh,
        monthly_bill_inr=request.monthly_bill_inr,
        tariff_inr_per_kwh=tariff,
        tariff_source=tariff_source,
    )

    solar_resource = await get_solar_resource(request.lat, request.lon)
    is_special = is_special_category_state(request.location_label)

    panel_results: list[PanelResult] = []
    for panel in PANEL_OPTIONS:
        count, capacity_kw = size_system_for_panel(request.roof_area_sqft, panel)
        monthly_gen = monthly_generation_kwh(capacity_kw, solar_resource.irradiance_kwh_per_m2_day)
        annual_gen = annual_generation_kwh(monthly_gen)
        monthly_series = monthly_generation_series_kwh(
            capacity_kw, solar_resource.monthly_irradiance_kwh_per_m2_day
        )
        gross_cost = gross_system_cost_inr(capacity_kw, panel.cost_per_watt)
        breakdown = cost_breakdown(gross_cost)
        subsidy = estimate_subsidy_inr(capacity_kw, is_special)
        subsidy_breakdown = estimate_subsidy_breakdown(capacity_kw, is_special)
        net_cost = net_system_cost_inr(gross_cost, subsidy)
        m_savings = monthly_savings_inr(monthly_gen, tariff)
        a_savings = annual_savings_inr(m_savings)
        payback = payback_period_years(net_cost, a_savings)
        payback_yr_int, payback_mo = payback_years_months(payback)
        co2 = co2_avoided_kg_per_year(annual_gen)
        lifetime_co2 = lifetime_co2_avoided_kg(co2)
        offset_percent = (
            round(min(annual_gen / (request.monthly_units_kwh * 12), 5) * 100, 1)
            if request.monthly_units_kwh and request.monthly_units_kwh > 0
            else None
        )

        panel_results.append(
            PanelResult(
                panel_id=panel.id,
                panel_name=panel.name,
                panel_watt=panel.watt,
                cost_per_watt_inr=panel.cost_per_watt,
                panel_count=count,
                system_capacity_kw=round(capacity_kw, 2),
                monthly_generation_kwh=round(monthly_gen, 1),
                annual_generation_kwh=round(annual_gen, 1),
                monthly_generation_series_kwh=monthly_series,
                gross_cost_inr=round(gross_cost, 0),
                cost_breakdown=breakdown,
                subsidy_inr=round(subsidy, 0),
                subsidy_breakdown=subsidy_breakdown,
                net_cost_inr=round(net_cost, 0),
                monthly_savings_inr=round(m_savings, 0),
                annual_savings_inr=round(a_savings, 0),
                payback_years=round(payback, 2) if payback is not None else None,
                payback_years_int=payback_yr_int,
                payback_months_remainder=payback_mo,
                co2_avoided_kg_per_year=round(co2, 1),
                lifetime_co2_avoided_kg=round(lifetime_co2, 1),
                consumption_offset_percent=offset_percent,
            )
        )

    fitting = [p for p in panel_results if p.panel_count > 0]
    if fitting:
        mono = next((p for p in fitting if p.panel_id == "mono_perc"), None)
        recommended = mono or min(
            fitting,
            key=lambda p: p.payback_years if p.payback_years is not None else float("inf"),
        )
    else:
        recommended = next(p for p in panel_results if p.panel_id == "mono_perc")

    recommendation = build_recommendation(recommended, request.monthly_units_kwh, request.roof_area_sqft)

    location_result = LocationResult(
        lat=request.lat,
        lon=request.lon,
        display_name=request.location_label or f"{request.lat:.4f}, {request.lon:.4f}",
    )

    assumptions = {
        "Usable roof fraction": f"{USABLE_ROOF_FRACTION * 100:.0f}% of gross roof area is assumed usable",
        "Panel footprint": f"{PANEL_AREA_SQM} m² of roof area per panel (assumption)",
        "System performance factor": (
            f"{SYSTEM_PERFORMANCE_FACTOR * 100:.0f}% overall performance ratio "
            "(inverter, wiring, soiling, temperature losses)"
        ),
        "Default electricity tariff": f"Rs {DEFAULT_TARIFF_INR_PER_KWH}/kWh, used only if bill data is insufficient",
        "CO2 emission factor": f"{CO2_EMISSION_FACTOR_KG_PER_KWH} kg CO2 avoided per kWh generated",
        "Fallback solar irradiance": f"{FALLBACK_IRRADIANCE_KWH_PER_M2_DAY} kWh/m²/day, used only if NASA POWER is unavailable",
        "PM Surya Ghar subsidy": (
            "Rs 33,000/kW (first 2 kW) + Rs 19,800/kW (2-3 kW), capped at Rs 85,800 — special-category "
            "State/UT rate — estimate only"
            if is_special
            else "Rs 30,000/kW (first 2 kW) + Rs 18,000/kW (2-3 kW), capped at Rs 78,000 — estimate only"
        ),
        "Cost breakdown split": (
            "Gross system cost is split into module (~58%), inverter/BOS (~24%), and installation/EPC "
            "(~18%) — a planning-level industry rule-of-thumb, not a certified cost audit"
        ),
        "System lifetime (for lifetime CO2 figure)": f"{SYSTEM_LIFETIME_YEARS} years, assuming flat annual generation (no degradation modelled)",
    }

    subsidy_meta = SubsidyMeta(
        source_name=SUBSIDY_SOURCE["name"],
        source_url=SUBSIDY_SOURCE["url"],
        effective_date=SUBSIDY_SOURCE["effective_date"],
        accessed_date=SUBSIDY_SOURCE["accessed_date"],
        is_special_category_state=is_special,
        note=SUBSIDY_SOURCE["note"],
    )

    return AnalyzeResponse(
        location=location_result,
        roof=roof_info,
        electricity=electricity_info,
        solar_resource=solar_resource,
        panel_results=panel_results,
        recommended_panel_id=recommended.panel_id,
        recommendation=recommendation,
        assumptions=assumptions,
        subsidy_meta=subsidy_meta,
    )
