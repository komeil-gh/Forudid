"""Numerical examples only; none are published as real observations or events."""

from dataclasses import replace

import numpy as np
import pytest
from rasterio.transform import from_origin
from shapely.geometry import MultiPolygon, box

from forudid_analysis.events import (
    AssociationProfile,
    TrendProfile,
    associate,
    cluster_candidates,
    screen_series,
)


def test_seasonal_trend_outliers_missing_data_and_release_cutoff():
    profile = TrendProfile("numerical-test-only", 750, 20, 500, 100, 365.25, 1, 10, 3, 1.345)
    days = np.arange(0, 1501, 12, dtype=float)
    seasonal = 20 * np.sin(2 * np.pi * days / 365.25)
    values = 5 * days / 365.25 + seasonal
    baseline = screen_series(days, values, days, as_of_day=1500, profile=profile)
    assert not baseline["candidate"]
    assert baseline["slope_change_mm_year"] == pytest.approx(0, abs=1e-7)
    changed = values + 30 * np.maximum(0, days - 750) / 365.25
    changed[40] += 300  # An isolated atmospheric-like excursion in the old window.
    changed[::13] = np.nan
    detected = screen_series(days, changed, days, as_of_day=1500, profile=profile)
    assert detected["candidate"] and detected["direction"] == "increasing"
    assert detected["slope_change_mm_year"] == pytest.approx(30, abs=0.2)
    assert detected["scientific_status"] == "experimental"
    delayed = days.copy()
    delayed[days > 750] = 1600
    assert (
        screen_series(days, changed, delayed, as_of_day=1500, profile=profile)["reason"]
        == "stale_series"
    )
    noisy = values.copy()
    noisy[40] += 300
    assert not screen_series(days, noisy, days, as_of_day=1500, profile=profile)["candidate"]
    noisy[(days > 650) & (days < 850)] = np.nan
    assert (
        screen_series(days, noisy, days, as_of_day=1500, profile=profile)["reason"]
        == "observation_gap"
    )
    with pytest.raises(ValueError, match="increase"):
        screen_series([2, 1], [1, 2], [2, 2], as_of_day=3, profile=profile)
    with pytest.raises(ValueError, match="seasonal"):
        replace(profile, min_span_days=100)


def test_spatial_support_continuity_and_ambiguous_merges():
    mask = np.array([[1, 1, 0], [0, 1, 0], [0, 0, 1]], dtype=bool)
    blobs = cluster_candidates(mask, from_origin(51, 35, 0.001, 0.001), minimum_pixels=2)
    assert len(blobs) == 1 and blobs[0]["pixel_count"] == 3 and blobs[0]["area_m2"] > 0
    profile = AssociationProfile("numerical-test-only", 0.5, 1000, 30, 10)
    record = {
        "id": "event-a",
        "geometry": MultiPolygon([box(51, 35, 51.01, 35.01)]),
        "observed_day": 100,
        "velocity_mm_year": 30,
        "component": "los",
        "reference_id": "ref-a",
    }
    candidate = record | {"observed_day": 112, "velocity_mm_year": 32}
    assert associate(candidate, [record], profile=profile)["event_id"] == "event-a"
    ambiguous = associate(candidate, [record, record | {"id": "event-b"}], profile=profile)
    assert ambiguous["status"] == "ambiguous" and ambiguous["event_id"] is None
    for mismatch in (
        {"component": "vertical"},
        {"reference_id": "ref-b"},
        {"observed_day": 200},
        {"velocity_mm_year": None},
    ):
        assert associate(candidate | mismatch, [record], profile=profile)["event_id"] is None
    touching = candidate | {"geometry": MultiPolygon([box(51.01, 35, 51.02, 35.01)])}
    assert associate(touching, [record], profile=profile)["status"] == "new_candidate"
    with pytest.raises(ValueError, match="unique"):
        associate(candidate, [record, record], profile=profile)
