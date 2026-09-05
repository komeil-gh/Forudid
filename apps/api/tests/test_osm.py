import json
import os
from pathlib import Path

import pytest

from forudid_api.ingest_osm import normalize


@pytest.mark.skipif(not os.environ.get("FORUDID_OSM_TESTS"), reason="Requires imported real OSM")
def test_real_infrastructure_api_and_spatial_index():
    from fastapi.testclient import TestClient
    from sqlalchemy import text
    from sqlalchemy.orm import Session

    from forudid_api.db import engine
    from forudid_api.ingest_osm import VERSION_ID
    from forudid_api.main import app

    client = TestClient(app)
    response = client.get("/api/v1/assets", params={"asset_type": "railway", "limit": 2})
    assert response.status_code == 200, response.text
    page = response.json()
    assert page["source_version_id"] == str(VERSION_ID)
    assert len(page["items"]) == 2 and page["next_cursor"]
    row = page["items"][0]
    assert row["length_m"] > 0 and row["properties"]["all_tags"]["railway"] == "rail"
    detail = client.get(f"/api/v1/assets/{row['id']}").json()
    assert detail["geometry"]["type"] == "LineString"
    assert len(detail["geometry"]["coordinates"]) >= 2
    assert "OpenStreetMap" in detail["attribution"]
    assert "object_uri" not in detail and "risk" not in row
    following = client.get(
        "/api/v1/assets",
        params={
            "asset_type": "railway",
            "limit": 2,
            "cursor": page["next_cursor"],
            "source_version_id": page["source_version_id"],
        },
    ).json()
    assert {r["id"] for r in following["items"]}.isdisjoint(r["id"] for r in page["items"])
    assert client.get("/api/v1/assets", params={"bbox": "0,0,1,1"}).json()["items"] == []
    for bbox in ("NaN,0,1,1", "1,1,0,0", "0,0,1", "-181,0,1,1"):
        assert client.get("/api/v1/assets", params={"bbox": bbox}).status_code == 422
    assert client.get("/api/v1/assets", params={"limit": 101}).status_code == 422
    with Session(engine()) as db:
        count, invalid = db.execute(
            text(
                "SELECT count(*), count(*) FILTER (WHERE "
                "NOT ST_IsValid(geom) OR ST_IsEmpty(geom) OR length_m <= 0) FROM assets "
                "WHERE source_version_id=:version"
            ),
            {"version": VERSION_ID},
        ).one()
        assert count > 1000 and invalid == 0
        index = db.scalar(
            text(
                "SELECT indexdef FROM pg_indexes WHERE tablename='assets' "
                "AND indexname='idx_assets_geom'"
            )
        )
        assert "USING gist" in index


def test_osm_preserves_tags_and_rejects_incomplete_geometry(tmp_path: Path):
    source = tmp_path / "software-test.osm"
    source.write_text("""<osm version="0.6">
      <node id="1" lat="30" lon="55"/>
      <node id="2" lat="30.01" lon="55.01"/>
      <way id="10" version="2"><nd ref="1"/><nd ref="1"/><nd ref="2"/>
        <tag k="railway" v="rail"/><tag k="name:fa" v="آزمون نرم‌افزار"/>
        <tag k="gauge" v="1435"/></way>
      <way id="11"><nd ref="1"/><nd ref="2"/><tag k="highway" v="primary"/></way>
      <way id="12"><nd ref="1"/><nd ref="2"/><tag k="highway" v="residential"/></way>
      <way id="13"><nd ref="1"/><nd ref="99"/><tag k="railway" v="rail"/></way>
      <way id="14"><nd ref="1"/><nd ref="1"/><tag k="railway" v="rail"/></way>
    </osm>""")
    output = tmp_path / "normalized"
    report = normalize(source, output)
    assert report["counts"] == {
        "selected_ways": 4,
        "railway": 1,
        "road": 1,
        "class/rail": 1,
        "class/primary": 1,
        "rejected_missing_nodes": 1,
        "rejected_degenerate": 1,
    }
    rows = [json.loads(line) for line in (output / "assets.ndjson").read_text().splitlines()]
    assert rows[0]["name"] == "آزمون نرم‌افزار"
    assert rows[0]["properties"]["all_tags"]["gauge"] == "1435"
    assert rows[0]["data_quality"]["consecutive_duplicate_nodes_removed"] == 1
    assert rows[0]["geometry"]["coordinates"] == [[55, 30], [55.01, 30.01]]
    assert rows[1]["name"] is None and rows[1]["data_quality"]["name_missing"]
    assert normalize(source, output) == report
    (output / "assets.ndjson").write_text("changed")
    with pytest.raises(ValueError, match="conflict"):
        normalize(source, output)
