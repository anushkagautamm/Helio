import pytest

from app.services.subsidy import (
    estimate_subsidy_breakdown,
    estimate_subsidy_inr,
    is_special_category_state,
)


@pytest.mark.parametrize(
    "capacity_kw,expected",
    [
        (0, 0),
        (1, 30000),
        (2, 60000),
        (2.5, 60000 + 0.5 * 18000),
        (3, 78000),
        (4, 78000),  # capped above 3 kW
        (10, 78000),  # capped, larger system
    ],
)
def test_subsidy_tiers(capacity_kw, expected):
    assert estimate_subsidy_inr(capacity_kw) == pytest.approx(expected)


def test_subsidy_never_exceeds_cap():
    for kw in [3.01, 5, 20, 100]:
        assert estimate_subsidy_inr(kw) == 78000


def test_subsidy_negative_capacity_is_zero():
    assert estimate_subsidy_inr(-1) == 0.0


def test_breakdown_matches_total_for_various_sizes():
    for kw in [0.5, 1, 2, 2.5, 3, 4, 10]:
        breakdown = estimate_subsidy_breakdown(kw)
        assert sum(tier.amount_inr for tier in breakdown) == pytest.approx(estimate_subsidy_inr(kw))


def test_breakdown_empty_for_zero_capacity():
    assert estimate_subsidy_breakdown(0) == []


def test_breakdown_single_tier_below_2kw():
    breakdown = estimate_subsidy_breakdown(1.5)
    assert len(breakdown) == 1
    assert breakdown[0].kw_in_tier == 1.5
    assert breakdown[0].rate_per_kw_inr == 30000


def test_breakdown_two_tiers_between_2_and_3kw():
    breakdown = estimate_subsidy_breakdown(2.5)
    assert len(breakdown) == 2
    assert breakdown[0].amount_inr == 60000
    assert breakdown[1].kw_in_tier == 0.5
    assert breakdown[1].amount_inr == 9000


def test_breakdown_capped_above_3kw():
    breakdown = estimate_subsidy_breakdown(10)
    assert sum(tier.amount_inr for tier in breakdown) == 78000


# ---------------------------------------------------------------------------
# Special-category States/UTs get a higher MNRE-published rate
# ---------------------------------------------------------------------------

def test_special_category_detection_positive():
    assert is_special_category_state("Shimla, Himachal Pradesh, India")
    assert is_special_category_state("Gangtok, Sikkim")
    assert is_special_category_state("Port Blair, Andaman and Nicobar Islands")


def test_special_category_detection_negative():
    assert not is_special_category_state("Bengaluru, Karnataka, India")
    assert not is_special_category_state(None)
    assert not is_special_category_state("")


@pytest.mark.parametrize(
    "capacity_kw,expected",
    [
        (1, 33000),
        (2, 66000),
        (2.5, 66000 + 0.5 * 19800),
        (3, 66000 + 19800),  # = 85800 = the special-category cap itself
        (10, 85800),  # capped above 3 kW
    ],
)
def test_special_category_subsidy_tiers(capacity_kw, expected):
    result = estimate_subsidy_inr(capacity_kw, is_special_category=True)
    assert result == pytest.approx(expected)


def test_special_category_breakdown_sums_to_total():
    for kw in [1, 2, 2.5, 3, 10]:
        breakdown = estimate_subsidy_breakdown(kw, is_special_category=True)
        assert sum(t.amount_inr for t in breakdown) == pytest.approx(
            estimate_subsidy_inr(kw, is_special_category=True)
        )


def test_general_category_is_default_and_unaffected():
    """Backward compatibility: omitting the flag must match pre-existing behaviour."""
    for kw in [1, 2, 2.5, 3, 10]:
        assert estimate_subsidy_inr(kw) == estimate_subsidy_inr(kw, is_special_category=False)
