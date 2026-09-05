"""Read the published real country and regional population analyses."""

import os

import pytest


@pytest.mark.skipif(
    not os.environ.get("FORUDID_POPULATION_TESTS"),
    reason="Requires published real population analysis",
)
def test_real_population_result_is_count_preserving_and_versioned():
    from fastapi.testclient import TestClient
    from sqlalchemy import select
    from sqlalchemy.orm import Session

    from forudid_api.db import Region, engine
    from forudid_api.main import app

    client = TestClient(app)
    url = "/api/v1/products/744b6536-b9a7-56c5-85b1-66a629a78b91/population-exposure"
    response = client.get(url)
    assert response.status_code == 200, response.text
    country = response.json()
    m = country["metrics"]
    assert country["population_year"] == 2020 and country["region_id"] is None
    assert country["method_status"] == "experimental"
    assert country["population_source_version_id"] == "488059d8-d3f6-5064-af66-131da47742e3"
    assert m["estimated_total"] == pytest.approx(80382521.05845018, abs=1e-6)
    assert sum(m["estimated_by_numeric_band"]) == pytest.approx(m["estimated_valid_coverage"])
    assert m["estimated_valid_coverage"] + m["estimated_without_deformation_data"] == pytest.approx(
        m["estimated_total"]
    )
    assert 0 < m["coverage_fraction"] < 1 and m["hazard_population"] is None
    assert (
        country["inputs"]["population_raster_sha256"]
        == "ab02286281f539ea90ffaeca7a6f1745c6307c09a0457b2cd2ceb7e38b8a6796"
    )
    with Session(engine()) as db:
        tehran = db.scalar(select(Region.id).where(Region.name_en == "Tehran"))
    regional = client.get(url, params={"region_id": str(tehran)})
    assert regional.status_code == 200, regional.text
    result = regional.json()
    assert (
        result["region_id"] == str(tehran)
        and result["analysis_run_id"] != country["analysis_run_id"]
    )
    assert 0 < result["metrics"]["estimated_total"] < m["estimated_total"]
    assert 0 < result["metrics"]["region"]["coverage_fraction"] < 1
    assert result["inputs"]["region"]["quality"]["historical_year"] == "2017"
    assert client.get(url, params={"run_id": result["analysis_run_id"]}).status_code == 404
    assert (
        client.get(
            url, params={"region_id": str(tehran), "run_id": country["analysis_run_id"]}
        ).status_code
        == 404
    )
