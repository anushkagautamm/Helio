from app.services.environment import co2_avoided_kg_per_year, lifetime_co2_avoided_kg


def test_co2_avoided_uses_emission_factor():
    assert co2_avoided_kg_per_year(1000) == 1000 * 0.82


def test_co2_avoided_zero_generation():
    assert co2_avoided_kg_per_year(0) == 0


def test_lifetime_co2_default_25_years():
    assert lifetime_co2_avoided_kg(1000) == 25000


def test_lifetime_co2_custom_years():
    assert lifetime_co2_avoided_kg(1000, lifetime_years=10) == 10000
