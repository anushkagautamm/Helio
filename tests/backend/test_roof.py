import math

import pytest

from app.models.schemas import GPSPoint
from app.services.roof import EARTH_RADIUS_M, haversine_distance_m, polygon_area_sqm, sqm_to_sqft


def _square_points(side_m: float) -> list[GPSPoint]:
    """
    Build a square whose side is exactly `side_m` metres at the equator, so
    the shoelace-on-projected-coordinates result can be checked precisely.
    """
    delta_deg = math.degrees(side_m / EARTH_RADIUS_M)
    return [
        GPSPoint(lat=0.0, lon=0.0),
        GPSPoint(lat=0.0, lon=delta_deg),
        GPSPoint(lat=delta_deg, lon=delta_deg),
        GPSPoint(lat=delta_deg, lon=0.0),
    ]


def test_polygon_area_of_square_is_side_squared():
    points = _square_points(10.0)
    area = polygon_area_sqm(points)
    assert area == pytest.approx(100.0, rel=1e-6)


def test_polygon_area_fewer_than_three_points_is_zero():
    assert polygon_area_sqm([GPSPoint(lat=0, lon=0), GPSPoint(lat=0, lon=1)]) == 0.0


def test_sqm_to_sqft_conversion():
    assert sqm_to_sqft(1) == pytest.approx(10.7639, rel=1e-3)


def test_haversine_small_distance():
    delta_deg = math.degrees(10.0 / EARTH_RADIUS_M)
    p1 = GPSPoint(lat=0.0, lon=0.0)
    p2 = GPSPoint(lat=delta_deg, lon=0.0)
    distance = haversine_distance_m(p1, p2)
    assert distance == pytest.approx(10.0, rel=1e-3)


def test_haversine_zero_distance_for_identical_points():
    p = GPSPoint(lat=12.9716, lon=77.5946)
    assert haversine_distance_m(p, p) == pytest.approx(0.0, abs=1e-9)
