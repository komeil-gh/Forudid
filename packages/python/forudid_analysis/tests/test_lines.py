import json
import math
from pathlib import Path

import numpy as np
import pytest
import rasterio
from pyproj import Geod, Transformer
from rasterio.transform import from_origin

from forudid_analysis import line_exposure

GEOD = Geod(ellps="WGS84")
TO_WGS84 = Transformer.from_crs(32640, 4326, always_xy=True)
BANDS = (0.0, 50.0, 100.0, 200.0)


def line(length=10000):
    lon, lat = TO_WGS84.transform(500002, 3505000)
    end_lon, end_lat, _ = GEOD.fwd(lon, lat, 90, length)
    return [(lon, lat), (end_lon, end_lat)]


def write_raster(path: Path, values: np.ndarray, resolution=100):
    with rasterio.open(
        path,
        "w",
        driver="GTiff",
        width=values.shape[1],
        height=values.shape[0],
        count=1,
        dtype="float32",
        nodata=-999,
        crs="EPSG:32640",
        transform=from_origin(500000, 3510000, resolution, resolution),
    ) as raster:
        raster.write(values.astype("float32"), 1)
        raster.update_tags(1, UNITS="cm/year")


def test_ten_kilometre_zero_profile_keeps_nodata_and_real_substrings(tmp_path):
    values = np.zeros((100, 100), dtype="float32")
    values[:, 40:60] = -999
    path = tmp_path / "software-zero-and-gap.tif"
    write_raster(path, values)
    with rasterio.open(path) as raster:
        result = line_exposure(raster, line(), unit="cm/year", band_edges_mm_year=BANDS)
    summary = result["summary"]
    assert summary["total_length_m"] == pytest.approx(10000, abs=1e-6)
    assert summary["valid_length_m"] == pytest.approx(8000, abs=100)
    assert summary["coverage_fraction"] == pytest.approx(0.8, abs=0.01)
    assert summary["coverage_status"] == "partial"
    assert summary["mean_velocity"] == summary["median_velocity"] == 0
    assert sum(summary["band_lengths_m"]) == pytest.approx(summary["valid_length_m"])
    assert len(result["segments"]) == 3
    assert result["segments"][1]["quality"] == "nodata"
    assert result["sample_spacing_m"] <= result["minimum_checked_pixel_width_m"] / 2
    for segment in result["segments"]:
        assert segment["geometry"]["type"] == "LineString"
        coords = segment["geometry"]["coordinates"]
        length = sum(GEOD.inv(*a, *b)[2] for a, b in zip(coords[:-1], coords[1:], strict=True))
        assert length == pytest.approx(segment["length_m"], abs=0.001)
    assert sum(s["length_m"] for s in result["segments"]) == pytest.approx(10000)
    json.dumps(result, allow_nan=False)


def test_short_last_interval_uses_length_not_sample_count(tmp_path):
    values = np.full((100, 100), 2.0)
    values[:, 10:] = 10.0
    path = tmp_path / "software-step.tif"
    write_raster(path, values)
    length = 1005
    start = line(length)[0]
    boundary = TO_WGS84.transform(501000, 3505000)
    low_length = GEOD.inv(*start, *boundary)[2]
    expected = (20 * low_length + 100 * (length - low_length)) / length
    with rasterio.open(path) as raster:
        result = line_exposure(raster, line(length), unit="cm/year", band_edges_mm_year=BANDS)
    assert result["summary"]["mean_velocity"] == pytest.approx(expected, abs=0.25)
    unweighted = np.mean([p["velocity"] for p in result["profile"]])
    assert abs(unweighted - result["summary"]["mean_velocity"]) > 2


def test_gaussian_bowl_has_expected_peak_and_integral(tmp_path):
    centres = (np.arange(100) + 0.5) * 100 - 5000
    x, y = np.meshgrid(centres, centres)
    values = 20 * np.exp(-(x * x + y * y) / (2 * 1000**2))
    path = tmp_path / "software-gaussian.tif"
    write_raster(path, values)
    with rasterio.open(path) as raster:
        result = line_exposure(raster, line(), unit="cm/year", band_edges_mm_year=BANDS)
    expected_mean = (
        200 * math.sqrt(2 * math.pi) * 1000 / 10000 * math.erf(5000 / (math.sqrt(2) * 1000))
    )
    assert result["summary"]["max_velocity"] == pytest.approx(199.500624, abs=0.001)
    assert result["summary"]["mean_velocity"] == pytest.approx(expected_mean, abs=1)
    assert result["summary"]["coverage_status"] == "complete"
    assert all(s["hazard_class"] is None for s in result["segments"])


def test_all_nodata_is_unavailable_and_units_are_checked(tmp_path):
    path = tmp_path / "software-missing.tif"
    write_raster(path, np.full((100, 100), -999.0))
    with rasterio.open(path) as raster:
        result = line_exposure(raster, line(), unit="cm/year", band_edges_mm_year=BANDS)
        with pytest.raises(ValueError, match="unit disagree"):
            line_exposure(raster, line(), unit="mm/year", band_edges_mm_year=BANDS)
        with pytest.raises(ValueError, match="strictly increasing"):
            line_exposure(raster, line(), unit="cm/year", band_edges_mm_year=(50.0, 50.0))
        with pytest.raises(ValueError, match="half a pixel"):
            line_exposure(
                raster, line(), unit="cm/year", band_edges_mm_year=BANDS, spacing_fraction=2
            )
    assert result["summary"]["coverage_fraction"] == 0
    assert result["summary"]["mean_velocity"] is None
    assert all(p["velocity"] is None for p in result["profile"])
    assert result["segments"][0]["band_index"] is None
    json.dumps(result, allow_nan=False)
