import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4

import pystac
import pytest
import rasterio
from fastapi.testclient import TestClient
from rio_cogeo.cogeo import cog_validate
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from forudid_api.config import settings
from forudid_api.db import Asset, Product, Run, engine
from forudid_api.main import app
from forudid_api.seed import BBOX, SIZE, build_fixture, seed, uid
from forudid_api.storage import put_immutable, s3
from forudid_api.styles import STYLES, colormap

client = TestClient(app)


@pytest.fixture(autouse=True)
def enable_test_products(monkeypatch):
    monkeypatch.setattr(settings(), "allow_fixture_products", True)


def test_golden_cog_and_missing_epoch():
    with TemporaryDirectory() as directory:
        path = Path(directory)
        dates = build_fixture(path)
        for kind in ("velocity_los", "temporal_coherence", "velocity_uncertainty", "valid_mask"):
            assert cog_validate(str(path / f"{kind}.tif"))[0]
        with rasterio.open(path / "velocity_los.tif") as raster:
            assert (raster.width, raster.height) == (SIZE, SIZE)
            assert list(raster.bounds) == BBOX
            assert raster.crs.to_epsg() == 4326
            assert raster.overviews(1) == [2, 4]
            assert raster.read(1)[32, 31] == pytest.approx(-0.0712, abs=1e-7)
            assert raster.read(1, masked=True).mask[0, 0]
        data = json.loads((path / "timeseries.json").read_text())
        assert len(dates) == 26
        assert data["displacement"][0][32][31] == 0
        assert data["displacement"][8][32][31] is None
        assert data["displacement"][-1][32][31] == pytest.approx(-0.0712 * 600 / 365.25)


def test_metadata_and_fixture_boundary():
    assert client.get("/health/live").status_code == 200
    assert client.get("/health/ready").status_code == 200
    areas = client.get("/api/v1/aois").json()
    assert "varamin" in [a["slug"] for a in areas]
    response = client.get("/api/v1/products", params={"aoi": "varamin", "kind": "velocity_los"})
    assert response.status_code == 200, response.text
    product = response.json()[0]
    assert product["is_fixture"] is True
    assert product["unit"] == "m/year"
    assert product["reference"]["date"] == product["start_date"]
    assert len(product["assets"]) == 4
    assert "object_key" not in json.dumps(product)
    quality = client.get(f"/api/v1/products/{uid('velocity_los')}/quality").json()
    assert quality["quality"] == "caution"
    assert all(value is None for value in quality["thresholds"].values())


def test_point_and_series_match_golden_pixel():
    point = client.get(
        "/api/v1/points/summary",
        params={"lon": 51.6452, "lat": 35.3241, "product_id": str(uid("velocity_los"))},
    )
    assert point.status_code == 200, point.text
    data = point.json()
    assert data["velocity_los"]["value"] == pytest.approx(-0.0712, abs=1e-7)
    assert data["velocity_uncertainty"]["value"] == pytest.approx(0.006)
    assert data["temporal_coherence"] == pytest.approx(0.89)
    assert data["quality"] == "caution"
    assert data["observations"] == 25
    series = client.get(
        "/api/v1/points/timeseries",
        params={"lon": 51.6452, "lat": 35.3241, "run_id": str(uid("run"))},
    ).json()
    assert series["series"][8]["displacement"] is None
    assert series["series"][0]["displacement"] == 0
    assert series["reference_point_id"] == data["reference"]["id"]


@pytest.mark.parametrize("coordinate", [(0, 0), (51.355, 35.545), (51.95, 35.325)])
def test_nodata_is_not_zero(coordinate):
    result = client.get(
        "/api/v1/points/summary",
        params={"lon": coordinate[0], "lat": coordinate[1], "product_id": str(uid("velocity_los"))},
    )
    assert result.status_code == 200, result.text
    assert result.json()["velocity_los"]["value"] is None
    assert result.json()["quality"] == "nodata"
    assert result.json()["observations"] == 0


@pytest.mark.parametrize(
    "params",
    [
        {"lon": "nan", "lat": 35},
        {"lon": 181, "lat": 35},
        {"lon": 51, "lat": -91},
        {"lon": "x", "lat": 35},
    ],
)
def test_coordinate_validation(params):
    result = client.get(
        "/api/v1/points/summary", params={**params, "product_id": str(uid("velocity_los"))}
    )
    assert result.status_code == 422
    assert result.json()["error"]["code"] == "INVALID_PARAMETERS"


def test_tile_and_legend_share_style():
    response = client.get(f"/tiles/{uid('asset/velocity_los')}/10/658/404.png")
    assert response.status_code == 200, response.text if response.status_code != 200 else ""
    assert response.content[:8] == b"\x89PNG\r\n\x1a\n"
    assert "immutable" in response.headers["cache-control"]
    legend = client.get(f"/api/v1/products/{uid('velocity_los')}/legend").json()
    assert legend["ticks"] == STYLES[legend["style"]][1]
    cmap = colormap(legend["style"])
    assert cmap[0] == (157, 41, 51, 255)
    assert cmap[255] == (8, 124, 131, 255)


@pytest.mark.parametrize(
    "query",
    [
        "url=http://127.0.0.1",
        "expression=b1*2",
        "rescale=0,1",
        "style=coherence-default",
        "path=/etc/passwd",
    ],
)
def test_tile_rejects_untrusted_options(query):
    response = client.get(f"/tiles/{uid('asset/velocity_los')}/10/658/404.png?{query}")
    assert response.status_code == 422


def test_unpublished_and_unknown_assets_are_inaccessible():
    assert client.get(f"/tiles/{uuid4()}/10/658/404.png").status_code == 404
    with Session(engine()) as db:
        run = db.get(Run, uid("run"))
        original = run.status
        run.status = "validation_required"
        db.commit()
        try:
            assert (
                client.get(f"/tiles/{uid('asset/velocity_los')}/10/658/404.png").status_code == 404
            )
            assert client.get(f"/api/v1/products/{uid('velocity_los')}").status_code == 404
            assert (
                client.get(
                    "/api/v1/points/timeseries",
                    params={"lon": 51.6, "lat": 35.3, "run_id": str(run.id)},
                ).status_code
                == 404
            )
        finally:
            run.status = original
            db.commit()


def test_seed_idempotency_and_object_integrity():
    with Session(engine()) as db:
        before = db.scalar(select(func.count()).select_from(Product))
    seed()
    with Session(engine()) as db:
        assert db.scalar(select(func.count()).select_from(Product)) == before
        for asset in db.scalars(select(Asset)).all():
            response = s3().get_object(Bucket=settings().s3_bucket, Key=asset.object_key)
            with response["Body"] as body:
                assert hashlib.sha256(body.read()).hexdigest() == asset.checksum_sha256
    key = f"test-only/{uuid4()}/immutable.json"
    try:
        put_immutable(key, b"{}", "application/json")
        with pytest.raises(ValueError, match="checksum mismatch"):
            put_immutable(key, b'{"changed":true}', "application/json")
    finally:
        s3().delete_object(Bucket=settings().s3_bucket, Key=key)


def test_openapi_contract_is_current():
    root = Path(__file__).resolve().parents[3]
    assert json.loads((root / "docs/openapi.json").read_text()) == app.openapi()
    response = client.get("/api/v1/products/not-a-uuid")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_PARAMETERS"
    schema = app.openapi()["paths"]["/api/v1/products/{product_id}"]["get"]["responses"]
    assert schema["422"]["content"]["application/json"]["schema"]["$ref"].endswith("/ErrorResponse")


def test_stac_schema_collection_links_and_units():
    result = client.get(f"/api/v1/products/{uid('velocity_los')}/metadata")
    assert result.status_code == 200
    document = result.json()
    assert pystac.validation.validate_dict(document)
    assert any(link["rel"] == "collection" for link in document["links"])
    assert document["assets"]["velocity_los"]["forudid:unit"] == "m/year"
