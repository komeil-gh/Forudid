import os

import pytest
from fastapi.testclient import TestClient

from forudid_api.main import app
from forudid_api.seed import uid

client = TestClient(app)


def test_fixture_products_are_hidden_by_default():
    assert client.get("/api/v1/products", params={"aoi": "varamin"}).json() == []
    assert client.get(f"/api/v1/products/{uid('velocity_los')}").status_code == 404
    assert client.get(f"/tiles/{uid('asset/velocity_los')}/10/658/404.png").status_code == 404
    assert client.get(f"/api/v1/runs/{uid('run')}").status_code == 404


@pytest.mark.skipif(
    not os.environ.get("FORUDID_REAL_SOURCE_TESTS"), reason="Requires published real snapshot"
)
def test_historical_measurement_and_missing_capabilities():
    response = client.get("/api/v1/products")
    assert response.status_code == 200, response.text
    products = response.json()
    assert {p["kind"] for p in products} == {"velocity_vertical", "seasonal_amplitude"}
    rate = next(p for p in products if p["kind"] == "velocity_vertical")
    assert rate["is_fixture"] is False
    assert rate["timeseries_available"] is False
    assert rate["reference"] is None and rate["relative_orbit"] is None
    assert rate["time_precision"] == "year" and rate["last_acquisition"] is None
    params = {"product_id": rate["id"], "lon": 55.65368745, "lat": 30.86962006}
    response = client.get("/api/v1/points/summary", params=params)
    assert response.status_code == 200, response.text
    point = response.json()
    assert point["measurement"] == {"value": 37.0, "unit": "cm/year"}
    assert point["velocity_los"]["value"] is None
    assert point["velocity_uncertainty"]["value"] is None
    assert point["observations"] is None
    assert point["quality"] == "caution"
    assert (
        client.get(
            "/api/v1/points/timeseries",
            params={
                "run_id": rate["processing_run_id"],
                "lon": 55.65368745,
                "lat": 30.86962006,
            },
        ).status_code
        == 404
    )
    point = client.get("/api/v1/points/summary", params={**params, "lon": 0, "lat": 0}).json()
    assert point["measurement"]["value"] is None and point["quality"] == "nodata"
    stac = client.get(f"/api/v1/products/{rate['id']}/metadata").json()
    assert stac["properties"]["forudid:measurement_method"] == "descending_los_projection"
    assert stac["assets"]["velocity_vertical"]["forudid:unit"] == "cm/year"
