"""Real 2026 WorldPop integration; the 2020 source remains independently addressable."""

import os
from pathlib import Path

import pytest

pytestmark = pytest.mark.skipif(
    not os.environ.get("FORUDID_POPULATION_2026_TESTS"),
    reason="Requires real 2026 source and analysis",
)


def test_real_2026_catalog_native_sample_tiles_and_conservative_analysis(monkeypatch):
    import rasterio
    from fastapi.testclient import TestClient

    from forudid_api import population, tiles
    from forudid_api.db import engine
    from forudid_api.ingest_population import source_config
    from forudid_api.main import app

    class ReleasedConnectionReader(population.Reader):
        def tile(self, *args, **kwargs):
            assert engine().pool.checkedout() == 0, (
                "Raster I/O must not reserve a catalog connection"
            )
            return super().tile(*args, **kwargs)

    monkeypatch.setattr(population, "Reader", ReleasedConnectionReader)
    monkeypatch.setattr(tiles, "Reader", ReleasedConnectionReader)

    profile = source_config(2026)
    identity = str(profile["version_id"])
    client = TestClient(app)
    catalog = client.get("/api/v1/population/sources")
    assert catalog.status_code == 200, catalog.text
    sources = catalog.json()["items"]
    assert sources[0]["source_version_id"] == identity
    current = next(row for row in sources if row["source_version_id"] == identity)
    assert current["population_year"] == 2026
    assert current["maturity"] == "alpha" and current["un_adjusted"] is True
    assert current["estimated_total"] == pytest.approx(92814664.02420977, abs=1e-6)
    assert any(row["population_year"] == 2020 for row in sources)
    point = client.get(
        f"/api/v1/population/sources/{identity}/point", params={"lon": 51.4, "lat": 35.7}
    )
    assert point.status_code == 200, point.text
    path = (
        Path(__file__).resolve().parents[3]
        / "data/sources/worldpop-iran/2026-r2025a-77712/population-count.cog.tif"
    )
    with rasterio.open(path) as raster:
        expected = next(raster.sample([(51.4, 35.7)], masked=True))[0]
    assert point.json()["count"] == pytest.approx(float(expected))
    assert point.json()["unit"] == "people/pixel"
    tile = client.get(f"/tiles/population/{identity}/8/164/100.png")
    assert tile.status_code == 200 and tile.content.startswith(b"\x89PNG")
    product = client.get("/api/v1/products/744b6536-b9a7-56c5-85b1-66a629a78b91").json()
    asset = next(a for a in product["assets"] if a["role"] == "data")
    deformation_tile = client.get(f"/tiles/{asset['id']}/8/164/100.png")
    assert deformation_tile.status_code == 200 and deformation_tile.content.startswith(b"\x89PNG")
    assert client.get(f"/tiles/population/{identity}/8/256/100.png").status_code == 422
    assert (
        client.get(f"/tiles/population/{identity}/8/164/100.png?url=file:///etc/passwd").status_code
        == 422
    )
    exposure = "/api/v1/products/744b6536-b9a7-56c5-85b1-66a629a78b91/population-exposure"
    latest = client.get(exposure).json()
    assert latest["population_year"] == 2026
    assert latest["population_source_version_id"] == identity
    m = latest["metrics"]
    assert m["estimated_total"] == pytest.approx(92814664.02420977, abs=1e-6)
    assert sum(m["estimated_by_numeric_band"]) == pytest.approx(m["estimated_valid_coverage"])
    assert m["estimated_valid_coverage"] + m["estimated_without_deformation_data"] == pytest.approx(
        m["estimated_total"]
    )
    historical = client.get(
        exposure, params={"population_version": "488059d8-d3f6-5064-af66-131da47742e3"}
    ).json()
    assert historical["population_year"] == 2020
    assert historical["metrics"]["estimated_total"] == pytest.approx(80382521.05845018, abs=1e-6)
