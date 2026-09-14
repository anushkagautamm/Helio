from app.services.finance import (
    annual_savings_inr,
    cost_breakdown,
    gross_system_cost_inr,
    monthly_savings_inr,
    net_system_cost_inr,
    payback_period_years,
    payback_years_months,
)


def test_gross_system_cost():
    # 3 kW = 3000 W, at Rs 32/W
    assert gross_system_cost_inr(3.0, 32) == 96000


def test_net_system_cost_subtracts_subsidy():
    assert net_system_cost_inr(96000, 60000) == 36000


def test_net_system_cost_never_negative():
    assert net_system_cost_inr(50000, 78000) == 0.0


def test_monthly_and_annual_savings():
    monthly = monthly_savings_inr(300, 7.0)
    assert monthly == 2100
    assert annual_savings_inr(monthly) == 2100 * 12


def test_payback_period_basic():
    assert payback_period_years(100000, 20000) == 5.0


def test_payback_period_zero_savings_is_none():
    assert payback_period_years(100000, 0) is None
    assert payback_period_years(100000, -500) is None


def test_payback_years_months_split():
    years, months = payback_years_months(5.5)
    assert years == 5
    assert months == 6


def test_payback_years_months_rounds_up_to_next_year():
    # 4.999999 years should round to 5 years, 0 months, not 4 years 12 months
    years, months = payback_years_months(4.9999)
    assert years == 5
    assert months == 0


def test_payback_years_months_none_passthrough():
    assert payback_years_months(None) == (None, None)


def test_cost_breakdown_sums_to_gross_within_rounding():
    result = cost_breakdown(384000)
    total = result.module_cost_inr + result.inverter_bos_cost_inr + result.installation_epc_cost_inr
    assert abs(total - 384000) <= 2  # independent per-component rounding, negligible drift


def test_cost_breakdown_module_is_largest_component():
    result = cost_breakdown(384000)
    assert result.module_cost_inr > result.inverter_bos_cost_inr
    assert result.module_cost_inr > result.installation_epc_cost_inr


def test_cost_breakdown_zero_cost():
    result = cost_breakdown(0)
    assert result.module_cost_inr == 0
    assert result.inverter_bos_cost_inr == 0
    assert result.installation_epc_cost_inr == 0
