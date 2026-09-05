"""Real input integration; synthetic rasters live only in the numerical package tests."""

import os
from pathlib import Path
from uuid import UUID

import pytest


@pytest.mark.skipif(
    not os.environ.get("FORUDID_EXPOSURE_TESTS"), reason="Requires real OSM and raster publication"
)
def test_real_profile_publication_idempotence_pagination_and_visibility():
    from fastapi.testclient import TestClient
    from sqlalchemy import func, select
    from sqlalchemy.orm import Session

    from forudid_api.analyze import analyze
    from forudid_api.db import AnalysisRun, AssetExposureSummary, ExposureSegment, engine, session
    from forudid_api.ingest_osm import VERSION_ID
    from forudid_api.main import app
    from forudid_api.storage import read_json

    identity = UUID("29cbefaf-1ef9-594a-9957-68060bf45846")  # OSM way/963780743
    product = UUID("744b6536-b9a7-56c5-85b1-66a629a78b91")
    raster = Path(__file__).resolve().parents[3] / "data/normalized/haghighi-motagh-cog-1/rate.tif"
    run = analyze(product, VERSION_ID, asset_id=identity, local_raster=raster)
    assert analyze(product, VERSION_ID, asset_id=identity, local_raster=raster) == run
    client = TestClient(app)
    response = client.get(
        f"/api/v1/assets/{identity}/exposure",
        params={"product_id": str(product), "run_id": str(run)},
    )
    assert response.status_code == 200, response.text
    summary = response.json()
    assert summary["analysis_run_id"] == str(run)
    assert summary["total_length_m"] == pytest.approx(19429.67018, abs=0.01)
    assert summary["coverage_fraction"] == pytest.approx(0.5693498, abs=0.000001)
    assert summary["metrics"]["mean_velocity"] == pytest.approx(93.4907, abs=0.001)
    assert summary["method_status"] == "experimental"
    assert summary["inputs"]["deformation_period"] == ["2014", "2020"]
    assert summary["inputs"]["infrastructure_data_date"] == "2026-09-04"
    base = f"/api/v1/analyses/{run}/assets/{identity}"
    profile = client.get(f"{base}/profile").json()
    assert len(profile["items"]) == profile["total"] > 500
    assert profile["next_page"] is None
    assert any(p["velocity"] is None for p in profile["items"])
    assert all(p["hazard_class"] is None and p["uncertainty"] is None for p in profile["items"])
    assert client.get(f"{base}/profile", params={"page": 1}).json()["items"] == []
    assert client.get(f"{base}/profile", params={"page": -1}).status_code == 422
    segments = client.get(f"{base}/segments", params={"limit": 2}).json()
    assert len(segments["features"]) == 2 and segments["next_offset"] == 2
    assert all(f["geometry"]["type"] == "LineString" for f in segments["features"])
    with Session(engine()) as db:
        stored = db.scalar(
            select(AssetExposureSummary).where(AssetExposureSummary.analysis_run_id == run)
        )
        assert stored is not None
        archived = read_json(stored.profile_key)
        assert archived["profile"] == profile["items"]
        assert archived["summary"]["valid_length_m"] == summary["valid_length_m"]
        assert (
            db.scalar(
                select(func.count())
                .select_from(AssetExposureSummary)
                .where(AssetExposureSummary.analysis_run_id == run)
            )
            == 1
        )
        length = db.scalar(
            select(
                func.sum(ExposureSegment.end_chainage_m - ExposureSegment.start_chainage_m)
            ).where(ExposureSegment.summary_id == stored.id)
        )
        assert length == pytest.approx(summary["total_length_m"], abs=1e-6)
        record = db.get(AnalysisRun, run)
        assert record is not None
        record.status = "processing"
        db.flush()
        app.dependency_overrides[session] = lambda: db
        try:
            assert (
                client.get(
                    f"/api/v1/assets/{identity}/exposure", params={"run_id": str(run)}
                ).status_code
                == 404
            )
            assert client.get(f"{base}/profile").status_code == 404
        finally:
            app.dependency_overrides.pop(session)
            db.rollback()
