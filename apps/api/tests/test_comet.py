"""Compare the real provider pixel and all epochs through the published APIs."""

import os
import warnings
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from forudid_api.main import app

pytestmark = pytest.mark.skipif(
    not os.environ.get("FORUDID_COMET_TESTS"), reason="Requires the verified COMET pilot"
)


def test_real_native_comet_pixels_epochs_reference_and_independent_capabilities(monkeypatch):
    import h5py

    from forudid_api import points
    from forudid_api.db import engine

    client = TestClient(app)
    products = client.get("/api/v1/products", params={"aoi": "varamin-comet"}).json()
    rate = next(p for p in products if p["kind"] == "velocity_los")
    assert rate["timeseries_available"] and not rate["is_fixture"]
    assert rate["orbit_direction"] == "ascending" and rate["relative_orbit"] == 28
    assert rate["start_date"] == "2014-10-19" and rate["last_acquisition"] == "2026-07-31"
    assert rate["measurement_component"] == "los"
    legend = client.get(f"/api/v1/products/{rate['id']}/legend").json()
    assert legend["style"] == "comet-los-v1" and legend["ticks"][0] == -0.15
    requested = []
    storage = points.s3()

    class RecordedStorage:
        def get_object(self, **kwargs):
            assert engine().pool.checkedout() == 0
            requested.append(kwargs["Key"])
            return storage.get_object(**kwargs)

    monkeypatch.setattr(points, "s3", lambda: RecordedStorage())
    source = Path(__file__).resolve().parents[3] / (
        "data/discovery/comet/2026-09-09/000001_028A_05385_191813.hdf5"
    )
    with h5py.File(source, "r") as original:
        row, col = 308, 287
        lon, lat = 51.4133333 + col * 0.001, 35.608 - row * 0.001
        summary = client.get(
            "/api/v1/points/summary",
            params={
                "product_id": rate["id"],
                "lon": lon,
                "lat": lat,
            },
        )
        assert summary.status_code == 200, summary.text
        point = summary.json()
        expected = float(original["vel"][row, col]) / 1000
        assert point["measurement"] == {"value": expected, "unit": "m/year"}
        assert point["velocity_los"]["value"] == expected
        assert point["sampled_coordinate"] == pytest.approx({"lon": lon, "lat": lat})
        assert point["velocity_uncertainty"]["value"] is None
        assert point["temporal_coherence"] is None and point["quality"] == "caution"
        original_values = original["cum"][:, row, col]
        assert point["observations"] == int(np.isfinite(original_values).sum())
        response = client.get(
            "/api/v1/points/timeseries",
            params={
                "run_id": rate["processing_run_id"],
                "lon": lon,
                "lat": lat,
            },
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert len(data["series"]) == 323 and data["unit"] == "m"
        for value, epoch in zip(original_values, data["series"], strict=True):
            assert epoch["displacement"] == (float(value) / 1000 if np.isfinite(value) else None)
            assert epoch["uncertainty"] is None
    assert len(requested) == 4
    assert len(set(requested)) == 2  # Only metadata and the selected spatial chunk.
    requested.clear()
    outside = client.get(
        "/api/v1/points/timeseries",
        params={
            "run_id": rate["processing_run_id"],
            "lon": 0,
            "lat": 0,
        },
    ).json()
    assert all(epoch["displacement"] is None for epoch in outside["series"])
    assert requested == []
    ref = rate["reference"]["coordinate"]
    reference = client.get(
        "/api/v1/points/timeseries",
        params={
            "run_id": rate["processing_run_id"],
            **ref,
        },
    ).json()
    assert all(epoch["displacement"] == 0 for epoch in reference["series"])
    metadata = client.get(f"/api/v1/products/{rate['id']}/metadata").json()
    assert metadata["properties"]["license"] == "other"


def test_real_comet_tile_preserves_nodata_without_invalid_cast():
    from rasterio.io import MemoryFile

    client = TestClient(app)
    products = client.get("/api/v1/products", params={"aoi": "varamin-comet"}).json()
    rate = next(p for p in products if p["kind"] == "velocity_los")
    asset = next(a for a in rate["assets"] if a["role"] == "data")
    url = f"/tiles/{asset['id']}/8/164/101.png"
    with warnings.catch_warnings():
        warnings.simplefilter("error", RuntimeWarning)
        response = client.get(url)
    assert response.status_code == 200
    with MemoryFile(response.content) as image, image.open() as raster:
        alpha = raster.read(4)
        assert np.any(alpha == 0) and np.any(alpha == 255)


def test_real_comet_population_keeps_signed_bands_and_separate_region_method():
    client = TestClient(app)
    product = "5323cc4f-57ec-5347-a85d-14f4887e5d27"
    for region, expected, version in (
        (None, 1657239.3294914013, "ellipsoid-cell-overlap-1"),
        ("637d5b9a-e103-54e0-8379-60beb1b21b40", 1636661.7765239528, "ellipsoid-cell-overlap-2"),
    ):
        response = client.get(
            f"/api/v1/products/{product}/population-exposure",
            params={"region_id": region} if region else {},
        )
        assert response.status_code == 200, response.text
        result = response.json()
        metrics = result["metrics"]
        assert result["population_year"] == 2026 and result["method_version"] == version
        assert result["inputs"]["measurement_component"] == "los"
        assert metrics["band_edges_mm_year"] == [-150, -100, -50, 0, 25]
        assert metrics["estimated_valid_coverage"] == pytest.approx(expected, abs=1e-7)
        assert sum(metrics["estimated_by_numeric_band"]) == pytest.approx(expected, abs=1e-7)
        assert metrics["hazard_population"] is None
