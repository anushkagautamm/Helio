"""Environmental impact calculation (Section 13)."""
from app.config import CO2_EMISSION_FACTOR_KG_PER_KWH, SYSTEM_LIFETIME_YEARS


def co2_avoided_kg_per_year(annual_generation_kwh: float) -> float:
    """CO2 avoided = annual solar generation x 0.82 kg CO2/kWh (configurable assumption)."""
    return annual_generation_kwh * CO2_EMISSION_FACTOR_KG_PER_KWH


def lifetime_co2_avoided_kg(annual_co2_avoided_kg: float, lifetime_years: int = SYSTEM_LIFETIME_YEARS) -> float:
    """
    Illustrative lifetime CO2 avoidance, assuming flat annual generation over
    a configurable system lifetime. Real panel output degrades over time —
    this is a simple, clearly-labelled planning figure, not a degradation model.
    """
    return annual_co2_avoided_kg * lifetime_years
