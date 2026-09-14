"""
GPS-assisted rooftop polygon area estimation (Section 4).

Converts a small set of lat/lon points walked around a roof perimeter into
an approximate area using an equirectangular projection (adequate at
rooftop scale) followed by the shoelace formula. This is explicitly an
ESTIMATE: consumer GPS accuracy is typically several metres, which can
easily translate into large relative errors on a small polygon.
"""
import math

from app.config import SQFT_TO_SQM
from app.models.schemas import GPSPoint

EARTH_RADIUS_M = 6371000.0


def _to_local_xy(points: list[GPSPoint]) -> list[tuple[float, float]]:
    """Project lat/lon points to local metre-scale x/y around their centroid."""
    ref_lat = sum(p.lat for p in points) / len(points)
    ref_lat_rad = math.radians(ref_lat)

    xy = []
    for p in points:
        x = math.radians(p.lon) * EARTH_RADIUS_M * math.cos(ref_lat_rad)
        y = math.radians(p.lat) * EARTH_RADIUS_M
        xy.append((x, y))
    return xy


def polygon_area_sqm(points: list[GPSPoint]) -> float:
    """Shoelace formula applied to locally-projected points."""
    if len(points) < 3:
        return 0.0

    xy = _to_local_xy(points)
    n = len(xy)
    area = 0.0
    for i in range(n):
        x1, y1 = xy[i]
        x2, y2 = xy[(i + 1) % n]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2.0


def sqm_to_sqft(area_sqm: float) -> float:
    return area_sqm / SQFT_TO_SQM


def haversine_distance_m(p1: GPSPoint, p2: GPSPoint) -> float:
    """Great-circle distance between two points, in metres."""
    lat1, lat2 = math.radians(p1.lat), math.radians(p2.lat)
    dlat = lat2 - lat1
    dlon = math.radians(p2.lon - p1.lon)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))
