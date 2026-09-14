"""
Solar resource data from the NASA POWER API (Section 6).

Uses the ALLSKY_SFC_SW_DWN climatology parameter (long-term average daily
solar irradiance, kWh/m^2/day) for the selected latitude/longitude.

This is a planning-level estimate, not a bankable resource assessment. If the
API is unreachable or returns unusable data, a clearly labelled fallback
value is used instead so the rest of the analysis can still proceed.
"""
import time

import httpx

from app.config import (
    FALLBACK_IRRADIANCE_KWH_PER_M2_DAY,
    NASA_CACHE_TTL_SECONDS,
    NASA_POWER_BASE_URL,
)
from app.models.schemas import SolarResource

_cache: dict[tuple[float, float], tuple[float, SolarResource]] = {}

_MONTH_KEYS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]


def _round_coord(value: float) -> float:
    # Round to ~1km precision so nearby points share a cache entry.
    return round(value, 2)


def _flat_monthly_series(annual_avg: float) -> list[float]:
    """Used only as part of the fallback path, when no real monthly data exists."""
    return [round(annual_avg, 2)] * 12


async def get_solar_resource(lat: float, lon: float) -> SolarResource:
    key = (_round_coord(lat), _round_coord(lon))
    cached = _cache.get(key)
    if cached and (time.time() - cached[0]) <= NASA_CACHE_TTL_SECONDS:
        return cached[1]

    params = {
        "parameters": "ALLSKY_SFC_SW_DWN",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "format": "JSON",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{NASA_POWER_BASE_URL}", params=params)
            response.raise_for_status()
            data = response.json()

        param_data = data["properties"]["parameter"]["ALLSKY_SFC_SW_DWN"]
        annual_avg = float(param_data["ANN"])

        # NASA POWER uses -999 (or similar) as a fill value for unavailable data.
        if annual_avg <= 0:
            raise ValueError("NASA POWER returned an invalid irradiance value")

        # The same climatology response already carries JAN..DEC long-term
        # monthly averages — real data, not a fabricated seasonal curve.
        monthly = [round(float(param_data[m]), 2) for m in _MONTH_KEYS]
        if any(v <= 0 for v in monthly):
            monthly = _flat_monthly_series(annual_avg)

        result = SolarResource(
            irradiance_kwh_per_m2_day=round(annual_avg, 2),
            monthly_irradiance_kwh_per_m2_day=monthly,
            source="NASA POWER (ALLSKY_SFC_SW_DWN, long-term average)",
            is_fallback=False,
            note=(
                "Long-term average daily solar irradiance at this location, from "
                "NASA POWER. Used as a planning-level input, not a certified "
                "resource assessment."
            ),
        )
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        result = SolarResource(
            irradiance_kwh_per_m2_day=FALLBACK_IRRADIANCE_KWH_PER_M2_DAY,
            monthly_irradiance_kwh_per_m2_day=_flat_monthly_series(FALLBACK_IRRADIANCE_KWH_PER_M2_DAY),
            source="Fallback assumption",
            is_fallback=True,
            note=(
                "NASA POWER data was unavailable for this location, so a generic "
                f"fallback of {FALLBACK_IRRADIANCE_KWH_PER_M2_DAY} kWh/m²/day was used. "
                "This is NOT measured local data — treat generation estimates with "
                "extra caution."
            ),
        )

    _cache[key] = (time.time(), result)
    return result
