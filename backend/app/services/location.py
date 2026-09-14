"""
Location search via Nominatim/OpenStreetMap (Section 3).

Usage policy compliance:
- A descriptive User-Agent identifies this application on every request.
- Requests are only made when the user explicitly submits a search (no
  autocomplete / keystroke-triggered calls).
- Results are cached in-process for GEOCODE_CACHE_TTL_SECONDS to avoid
  repeat-hitting the public Nominatim instance for the same query.
"""
import time

import httpx

from app.config import GEOCODE_CACHE_TTL_SECONDS, NOMINATIM_BASE_URL, NOMINATIM_USER_AGENT
from app.models.schemas import LocationResult

_cache: dict[str, tuple[float, list[LocationResult]]] = {}


class LocationLookupError(Exception):
    pass


def _cache_get(key: str) -> list[LocationResult] | None:
    entry = _cache.get(key)
    if not entry:
        return None
    stored_at, results = entry
    if time.time() - stored_at > GEOCODE_CACHE_TTL_SECONDS:
        del _cache[key]
        return None
    return results


def _cache_set(key: str, results: list[LocationResult]) -> None:
    _cache[key] = (time.time(), results)


async def search_location(query: str) -> list[LocationResult]:
    key = query.strip().lower()
    if not key:
        raise LocationLookupError("Please enter a location to search for.")

    cached = _cache_get(key)
    if cached is not None:
        return cached

    params = {
        "q": query,
        "format": "jsonv2",
        "limit": 5,
        "countrycodes": "in",
        "addressdetails": 0,
    }
    headers = {"User-Agent": NOMINATIM_USER_AGENT}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{NOMINATIM_BASE_URL}/search", params=params, headers=headers
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        raise LocationLookupError(
            "Could not reach the location search service. Please check your "
            "connection and try again."
        ) from exc

    if not data:
        raise LocationLookupError(
            "No matching location found. Try a more specific city, pincode, or locality."
        )

    results = [
        LocationResult(
            lat=float(item["lat"]),
            lon=float(item["lon"]),
            display_name=item.get("display_name", query),
        )
        for item in data
    ]
    _cache_set(key, results)
    return results


_reverse_cache: dict[tuple[float, float], tuple[float, LocationResult]] = {}


async def reverse_geocode(lat: float, lon: float) -> LocationResult:
    """
    Best-effort reverse geocode for a map-picked point. Falls back to plain
    coordinates (never raises) since a missing place name shouldn't block the
    user from continuing with a location they picked on the map.
    """
    key = (round(lat, 5), round(lon, 5))
    cached = _cache_get_reverse(key)
    if cached is not None:
        return cached

    fallback = LocationResult(lat=lat, lon=lon, display_name=f"{lat:.5f}, {lon:.5f}")

    params = {"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 16}
    headers = {"User-Agent": NOMINATIM_USER_AGENT}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{NOMINATIM_BASE_URL}/reverse", params=params, headers=headers
            )
            response.raise_for_status()
            data = response.json()
        display_name = data.get("display_name")
        if not display_name:
            return fallback
        result = LocationResult(lat=lat, lon=lon, display_name=display_name)
    except (httpx.HTTPError, ValueError):
        result = fallback

    _reverse_cache[key] = (time.time(), result)
    return result


def _cache_get_reverse(key: tuple[float, float]) -> LocationResult | None:
    entry = _reverse_cache.get(key)
    if not entry:
        return None
    stored_at, result = entry
    if time.time() - stored_at > GEOCODE_CACHE_TTL_SECONDS:
        del _reverse_cache[key]
        return None
    return result
