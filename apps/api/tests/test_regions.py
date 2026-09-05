import os
from pathlib import Path

import pytest


@pytest.mark.skipif(
    not os.environ.get("FORUDID_REGION_TESTS"), reason="Requires real historical boundaries"
)
def test_real_regions_preserve_source_discrepancies_and_geometry():
    from fastapi.testclient import TestClient
    from sqlalchemy import func, select
    from sqlalchemy.orm import Session

    from forudid_api.db import Region, engine
    from forudid_api.ingest_regions import VERSION_ID, register
    from forudid_api.main import app

    directory = Path(__file__).resolve().parents[3] / "data/sources/geoboundaries/IRN-ADM1-17685810"
    assert register(directory) == str(VERSION_ID)
    client = TestClient(app)
    response = client.get("/api/v1/regions")
    assert response.status_code == 200, response.text
    page = response.json()
    assert len(page["items"]) == 31 and page["next_offset"] is None
    assert page["source_version_id"] == str(VERSION_ID)
    mazandaran = next(r for r in page["items"] if r["name_en"] == "Mazandaran")
    assert mazandaran["name_fa"] == "مازندران"
    assert len(mazandaran["properties"]["source_feature_ids"]) == 2
    assert mazandaran["properties"]["quality"]["provider_count_matches_file"] is False
    tehran = next(r for r in page["items"] if r["name_en"] == "Tehran")
    assert tehran["source_code"] is None
    detail = client.get(f"/api/v1/regions/{tehran['id']}").json()
    assert detail["source_year"] == "2017" and detail["geometry"]["type"] == "MultiPolygon"
    assert "OpenStreetMap" in detail["attribution"]
    assert client.get("/api/v1/regions", params={"limit": 1}).json()["next_offset"] == 1
    assert client.get("/api/v1/regions", params={"limit": 101}).status_code == 422
    with Session(engine()) as db:
        invalid = db.scalar(
            select(func.count()).select_from(Region).where(~func.ST_IsValid(Region.geom))
        )
        assert invalid == 0
