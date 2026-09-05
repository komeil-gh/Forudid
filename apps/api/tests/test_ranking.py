import os

import pytest


@pytest.mark.skipif(
    not os.environ.get("FORUDID_RANKING_TESTS"),
    reason="Requires real published full railway analysis",
)
def test_real_ranking_is_sorted_bounded_and_uses_published_whole_assets():
    from fastapi.testclient import TestClient

    from forudid_api.main import app

    client = TestClient(app)
    url = "/api/v1/exposure-ranking"
    params = {
        "product_id": "744b6536-b9a7-56c5-85b1-66a629a78b91",
        "run_id": "f30d71aa-bda6-5098-b050-eed1f9657f0f",
        "limit": 10,
    }
    response = client.get(url, params=params)
    assert response.status_code == 200, response.text
    first = response.json()
    assert first["total"] == 12722 and first["next_offset"] == 10
    values = [r["max_abs_velocity"] for r in first["items"]]
    assert values == sorted(values, reverse=True)
    second = client.get(url, params={**params, "offset": 10}).json()
    assert not {r["asset_id"] for r in first["items"]} & {r["asset_id"] for r in second["items"]}
    selected = client.get(url, params={**params, "q": "963780743"}).json()
    assert selected["total"] == 1
    assert selected["items"][0]["asset_id"] == "29cbefaf-1ef9-594a-9957-68060bf45846"
    assert selected["items"][0]["coverage_fraction"] == pytest.approx(0.5693497973641857)
    assert client.get(url, params={**params, "min_coverage": 1.1}).status_code == 422
    assert client.get(url, params={**params, "sort": "risk_score"}).status_code == 422
    assert client.get(url, params={**params, "limit": 101}).status_code == 422
    absent = client.get(
        url, params={**params, "run_id": "f2eb002e-9c3e-5bab-bf4d-e93197945448"}
    ).json()
    assert absent["analysis_run_id"] is None and absent["items"] == []
    import csv
    import hashlib
    import io

    run = params["run_id"]
    asset = "29cbefaf-1ef9-594a-9957-68060bf45846"
    base = f"/api/v1/analyses/{run}/assets/{asset}"
    document = client.get(base + "/download")
    assert document.status_code == 200
    assert hashlib.sha256(document.content).hexdigest() == document.headers["etag"].strip('"')
    profile = document.json()["profile"]
    exported = client.get(base + "/profile.csv")
    assert exported.status_code == 200
    rows = list(csv.DictReader(io.StringIO(exported.content.decode("utf-8-sig"))))
    assert len(rows) == len(profile)
    assert any(row["velocity_mm_year"] == "" and row["quality"] == "nodata" for row in rows)
    assert float(rows[-1]["end_chainage_m"]) == pytest.approx(profile[-1]["end_chainage_m"])
    assert {row["analysis_run_id"] for row in rows} == {run}
    geometry = client.get(base + "/segments.geojson")
    assert geometry.status_code == 200
    collection = geometry.json()
    assert collection["analysis_run_id"] == run
    assert collection["analysis_json_sha256"] == document.headers["etag"].strip('"')
    summary = client.get(f"/api/v1/assets/{asset}/exposure", params={"run_id": run}).json()
    assert len(collection["features"]) == summary["segment_count"]
    assert all(f["geometry"]["type"] == "LineString" for f in collection["features"])
    assert collection["features"][0]["properties"]["start_chainage_m"] == 0
    assert collection["features"][-1]["properties"]["end_chainage_m"] == pytest.approx(
        selected["items"][0]["total_length_m"]
    )
    assert (
        client.get(
            base.replace(run, "f2eb002e-9c3e-5bab-bf4d-e93197945448") + "/download"
        ).status_code
        == 404
    )
