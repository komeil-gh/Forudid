import json
from pathlib import Path

import pytest
import rasterio
from rio_cogeo.cogeo import cog_validate

from forudid_api.normalize import verify_cog

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "data/sources/haghighi-motagh-2024/1.0.0"
OUTPUT = ROOT / "data/normalized/haghighi-motagh-cog-1"


@pytest.mark.skipif(
    not (OUTPUT / "normalization.json").exists(), reason="Requires real Zenodo COGs"
)
def test_real_cogs_preserve_every_source_pixel_and_native_grid():
    report = json.loads((OUTPUT / "normalization.json").read_text())
    manifest = json.loads((SOURCE / "manifest.json").read_text())
    assert report["valid_pixels"] == 7_842_872
    assert report["rate_statistics"]["maximum"] == 37
    with rasterio.Env(GDAL_CACHEMAX=32 * 1024 * 1024, GDAL_NUM_THREADS="1"):
        for item in manifest["files"]:
            cog = OUTPUT / f"{item['role']}.tif"
            assert cog_validate(str(cog), strict=True)[0]
            verify_cog(SOURCE / item["name"], cog)
