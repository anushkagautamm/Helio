from app.config import PRODUCT_CATALOG
from app.services.products import (
    compute_deltas,
    estimate_with_product,
    get_product,
    list_manufacturers,
    list_products,
    products_for_manufacturer,
    to_product_info,
)


def test_list_products_returns_full_catalog():
    assert list_products() == PRODUCT_CATALOG
    assert len(list_products()) > 0


def test_list_manufacturers_deduplicated_and_ordered():
    manufacturers = list_manufacturers()
    assert len(manufacturers) == len(set(manufacturers))
    assert "Waaree" in manufacturers
    assert "Adani Solar" in manufacturers


def test_products_for_manufacturer_filters_correctly():
    waaree_products = products_for_manufacturer("Waaree")
    assert len(waaree_products) > 0
    assert all(p.manufacturer == "Waaree" for p in waaree_products)


def test_get_product_found_and_not_found():
    assert get_product("waaree_aditya") is not None
    assert get_product("nonexistent_id") is None


def test_to_product_info_marks_price_available_correctly():
    priced = to_product_info(get_product("waaree_aditya"))
    assert priced.price_available is True

    unpriced = to_product_info(get_product("renewsys_deserv_extreme"))
    assert unpriced.price_available is False
    assert unpriced.price_per_watt_min is None


def test_estimate_with_product_returns_none_when_price_unavailable():
    spec = get_product("premier_energies_almm")
    result = estimate_with_product(
        spec,
        roof_area_sqft=800,
        irradiance_kwh_per_m2_day=5.5,
        monthly_irradiance=[5.5] * 12,
        tariff_inr_per_kwh=7.0,
        monthly_units_kwh=300,
        is_special_category=False,
    )
    assert result is None


def test_estimate_with_product_computes_full_result_when_priced():
    spec = get_product("waaree_aditya")  # 390-420W, Rs 22-26/W
    result = estimate_with_product(
        spec,
        roof_area_sqft=800,
        irradiance_kwh_per_m2_day=5.5,
        monthly_irradiance=[5.5] * 12,
        tariff_inr_per_kwh=7.0,
        monthly_units_kwh=300,
        is_special_category=False,
    )
    assert result is not None
    assert result.panel_watt == 405  # midpoint of 390-420
    assert result.cost_per_watt_inr == 24.0  # midpoint of 22-26
    assert result.panel_count > 0
    assert result.gross_cost_inr > 0
    assert result.cost_breakdown is not None
    # Cost breakdown must sum back to the gross cost it was derived from.
    total = (
        result.cost_breakdown.module_cost_inr
        + result.cost_breakdown.inverter_bos_cost_inr
        + result.cost_breakdown.installation_epc_cost_inr
    )
    assert abs(total - result.gross_cost_inr) <= 2


def test_estimate_with_product_never_exceeds_roof_capacity():
    """Reuses the same solar.py sizing logic — product estimates must respect the same roof-area physics."""
    spec = get_product("waaree_bifacial")
    result = estimate_with_product(
        spec,
        roof_area_sqft=300,
        irradiance_kwh_per_m2_day=5.5,
        monthly_irradiance=[5.5] * 12,
        tariff_inr_per_kwh=7.0,
        monthly_units_kwh=None,
        is_special_category=False,
    )
    assert result is not None
    from app.services.solar import usable_roof_area_sqm

    usable_sqm = usable_roof_area_sqm(300)
    assert result.panel_count * 1.6 <= usable_sqm


def test_compute_deltas_reflects_real_differences():
    spec_a = get_product("waaree_aditya")  # ~405W
    spec_b = get_product("waaree_aditya_pro")  # ~555W, higher wattage

    kwargs = dict(
        roof_area_sqft=800,
        irradiance_kwh_per_m2_day=5.5,
        monthly_irradiance=[5.5] * 12,
        tariff_inr_per_kwh=7.0,
        monthly_units_kwh=300,
        is_special_category=False,
    )
    result_a = estimate_with_product(spec_a, **kwargs)
    result_b = estimate_with_product(spec_b, **kwargs)

    deltas = compute_deltas(result_b, result_a)
    # Same roof -> same panel count (geometry-limited), but higher wattage
    # per panel means more capacity and more generation.
    assert deltas.panel_count_delta == 0
    assert deltas.system_capacity_kw_delta > 0
    assert deltas.annual_generation_kwh_delta > 0
