from app.config import DEFAULT_TARIFF_INR_PER_KWH
from app.services.electricity import effective_tariff_inr_per_kwh


def test_tariff_derived_from_bill_and_units():
    tariff, source = effective_tariff_inr_per_kwh(1800, 250)
    assert tariff == 1800 / 250
    assert "Derived" in source


def test_tariff_falls_back_when_units_missing():
    tariff, source = effective_tariff_inr_per_kwh(1800, None)
    assert tariff == DEFAULT_TARIFF_INR_PER_KWH
    assert "Default" in source


def test_tariff_falls_back_when_bill_missing():
    tariff, source = effective_tariff_inr_per_kwh(None, 250)
    assert tariff == DEFAULT_TARIFF_INR_PER_KWH


def test_tariff_falls_back_on_zero_units():
    """Zero consumption must not trigger a division by zero."""
    tariff, source = effective_tariff_inr_per_kwh(1800, 0)
    assert tariff == DEFAULT_TARIFF_INR_PER_KWH


def test_tariff_falls_back_on_zero_bill():
    tariff, source = effective_tariff_inr_per_kwh(0, 250)
    assert tariff == DEFAULT_TARIFF_INR_PER_KWH
