import os
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest

pytestmark = pytest.mark.skipif(
    not os.environ.get("FORUDID_REGION_INFRA_TESTS"), reason="Requires local PostGIS"
)


def test_clipped_lengths_preserve_holes_nodata_and_band_balance():
    from pyproj import Geod
    from sqlalchemy import func, select, text
    from sqlalchemy.orm import Session

    from forudid_api.analyze_regions import aggregate, clipped_length
    from forudid_api.db import engine

    geod = Geod(ellps="WGS84")
    line = func.ST_GeomFromText("LINESTRING(51 35,51.03 35)", 4326)
    boundary = func.ST_GeomFromText(
        "POLYGON((50.99 34.99,51.04 34.99,51.04 35.01,50.99 35.01,50.99 34.99),"
        "(51.01 34.995,51.02 34.995,51.02 35.005,51.01 35.005,51.01 34.995))",
        4326,
    )
    with Session(engine()) as db:
        try:
            expected = 2 * geod.inv(51, 35, 51.01, 35)[2]
            assert db.scalar(select(clipped_length(line, boundary))) == pytest.approx(
                expected, abs=0.001
            )
            outside = func.ST_GeomFromText("POLYGON((52 34,53 34,53 36,52 36,52 34))", 4326)
            assert db.scalar(select(clipped_length(line, outside))) == 0
            # Transaction-local numerical fixtures shadow only these two tables in this session.
            db.execute(
                text(
                    "CREATE TEMP TABLE asset_exposure_summaries "
                    "(id uuid, asset_id uuid, analysis_run_id uuid) ON COMMIT DROP"
                )
            )
            db.execute(
                text(
                    "CREATE TEMP TABLE exposure_segments "
                    "(summary_id uuid, band_index integer, geom geometry(LineString,4326)) "
                    "ON COMMIT DROP"
                )
            )
            run, summary, asset = uuid4(), uuid4(), uuid4()
            db.execute(
                text("INSERT INTO asset_exposure_summaries VALUES (:summary,:asset,:run)"),
                {"summary": summary, "asset": asset, "run": run},
            )
            for band, start, end in [(1, 51, 51.01), (None, 51.01, 51.02), (2, 51.02, 51.03)]:
                db.execute(
                    text(
                        "INSERT INTO exposure_segments "
                        "VALUES (:summary,:band,ST_GeomFromText(:line,4326))"
                    ),
                    {
                        "summary": summary,
                        "band": band,
                        "line": f"LINESTRING({start} 35,{end} 35)",
                    },
                )
            upstream = SimpleNamespace(
                id=run, expected_assets=1, inputs={"band_edges_mm_year": [0, 50, 100, 200, 400]}
            )
            whole = aggregate(db, upstream, None)
            clipped = aggregate(db, upstream, SimpleNamespace(geom=boundary))
            assert whole["way_count"] == whole["ways_with_valid_data"] == 1
            assert whole["nodata_length_m"] == pytest.approx(expected / 2, abs=0.001)
            assert whole["coverage_fraction"] == pytest.approx(2 / 3)
            assert clipped["nodata_length_m"] == 0
            assert clipped["total_length_m"] == pytest.approx(expected, abs=0.001)
            assert sum(clipped["length_by_numeric_band_m"]) == clipped["valid_length_m"]
            assert clipped["coverage_fraction"] == 1
            assert clipped["hazard_length_m"] is None
        finally:
            db.rollback()


@pytest.mark.skipif(
    not os.environ.get("FORUDID_REGION_INFRA_REAL_TESTS"),
    reason="Requires published regional results",
)
def test_real_region_results_are_published_scoped_and_reproducible():
    from fastapi.testclient import TestClient
    from sqlalchemy import select
    from sqlalchemy.orm import Session

    from forudid_api.analyze_regions import analyze
    from forudid_api.db import AnalysisRun, Region, RegionalInfrastructureResult, engine
    from forudid_api.main import app
    from forudid_api.storage import read_json

    client = TestClient(app)
    product = "744b6536-b9a7-56c5-85b1-66a629a78b91"
    with Session(engine()) as db:
        region = db.scalar(select(Region).where(Region.name_en == "Tehran"))
        assert region
        for kind, count in [("railway", 12722), ("road", 120393)]:
            url = f"/api/v1/products/{product}/infrastructure-exposure"
            country = client.get(url, params={"asset_type": kind})
            assert country.status_code == 200, country.text
            assert country.json()["metrics"]["way_count"] == count
            expected_length = 16044032.450061 if kind == "railway" else 142796850.032911
            assert country.json()["metrics"]["total_length_m"] == pytest.approx(
                expected_length, abs=0.1, rel=0
            )
            response = client.get(url, params={"asset_type": kind, "region_id": str(region.id)})
            assert response.status_code == 200, response.text
            result = response.json()
            metrics = result["metrics"]
            assert (
                0
                < metrics["valid_length_m"]
                < metrics["total_length_m"]
                < country.json()["metrics"]["total_length_m"]
            )
            assert metrics["total_length_m"] == pytest.approx(
                metrics["valid_length_m"] + metrics["nodata_length_m"]
            )
            run = db.get(AnalysisRun, UUID(result["analysis_run_id"]))
            archived = db.scalar(
                select(RegionalInfrastructureResult).where(
                    RegionalInfrastructureResult.analysis_run_id == run.id
                )
            )
            assert run.status == "published" and archived
            assert read_json(archived.object_key)["metrics"] == metrics
            assert analyze(archived.upstream_run_id, region.id) == run.id
            assert (
                client.get(url, params={"asset_type": kind, "run_id": str(run.id)}).status_code
                == 404
            )
