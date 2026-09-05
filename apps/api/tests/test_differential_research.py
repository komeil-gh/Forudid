"""Check local scientific artifacts against their real inputs, without publishing them."""

import json
import os
from pathlib import Path

import numpy as np
import pytest
import rasterio
from pyproj import Geod

from forudid_api.ingest import digest

ROOT = Path(__file__).resolve().parents[3]


@pytest.mark.skipif(
    not os.environ.get("FORUDID_DIFFERENTIAL_REAL_TESTS"),
    reason="Requires the checksummed native gradient and Payne Qom research artifacts",
)
def test_real_differential_artifacts_have_provenance_and_preserve_validation_gate():
    native = ROOT / "data/research/haghighi-gradient-1"
    payne = ROOT / "data/research/payne-qom-1"
    for directory in (native, payne):
        document = json.loads((directory / "manifest.json").read_text())
        assert document["inputs"]["status"] == "experimental"
        assert document["inputs"]["scientific_review"] is None
        assert document["inputs"]["hazard_classification"] is False
        for artifact in document["artifacts"]:
            assert digest(directory / artifact["name"]) == artifact["sha256"]
    document = json.loads((native / "manifest.json").read_text())
    assert document["result"]["valid_pixels"] == 7840696
    assert document["result"]["max_mm_year_per_m"] == pytest.approx(0.4053728966)
    assert document["inputs"]["duration_years"] is None
    geod = Geod(ellps="WGS84")
    checked = 0
    with (
        rasterio.open(native / "gradient.tif") as out,
        rasterio.open(ROOT / "data/normalized/haghighi-motagh-cog-1/rate.tif") as src,
    ):
        assert digest(Path(src.name)) == document["inputs"]["source_sha256"]
        assert out.transform == src.transform and out.shape == src.shape
        for _, window in out.block_windows(1):
            block = out.read(1, window=window, masked=True)
            locations = np.argwhere(~np.ma.getmaskarray(block))
            if not locations.size:
                continue
            row, col = locations[len(locations) // 2] + [int(window.row_off), int(window.col_off)]
            values = (
                src.read(1, window=((row - 1, row + 2), (col - 1, col + 2)), masked=True)
                .filled(np.nan)
                .astype("float64")
                * 10
            )
            if values.shape != (3, 3):
                continue
            lon, lat = src.xy(row, col)
            dx = geod.inv(lon - src.transform.a / 2, lat, lon + src.transform.a / 2, lat)[2]
            dy = geod.inv(lon, lat + src.transform.e / 2, lon, lat - src.transform.e / 2)[2]
            yy, xx = np.mgrid[-1:2, -1:2]
            matrix = np.column_stack((np.ones(9), xx.ravel() * dx, yy.ravel() * dy))
            valid = np.isfinite(values.ravel())
            fitted = np.linalg.lstsq(matrix[valid], values.ravel()[valid], rcond=None)[0]
            observed = out.read(1, window=((row, row + 1), (col, col + 1)))[0, 0]
            assert observed == pytest.approx(float(np.hypot(*fitted[1:])), rel=1e-6, abs=1e-9)
            checked += 1
            if checked == 12:
                break
    assert checked == 12
    document = json.loads((payne / "manifest.json").read_text())
    result = document["result"]
    assert result["common_valid_pixels"] == 690897
    assert result["rmse"] == pytest.approx(7.553378988e-6, rel=1e-6)
    assert result["maximum_absolute_error"] > 0.0008
    assert result["literature_reproduction_accepted"] is False
    assert document["inputs"]["accepted_literature_tolerance"] is None
    assert all(f["archive_checksum_verified"] for f in document["inputs"]["files"])
