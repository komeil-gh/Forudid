from types import SimpleNamespace
from uuid import uuid4

import numpy as np
import pytest
import rasterio
from rasterio.transform import from_origin

from forudid_api import points
from forudid_api.schemas import Coordinate


def test_quality_raster_preserves_zero_units_cell_and_missing_data(tmp_path, monkeypatch):
    grid = from_origin(40, 36, 0.01, 0.01)
    paths = {}
    for kind, values in {
        "temporal_coherence": [[0, 0.85], [-9999, 0.2]],
        "velocity_uncertainty": [[0.004, 0.005], [-9999, 0.006]],
    }.items():
        path = tmp_path / f"{kind}.tif"
        with rasterio.open(path, "w", driver="GTiff", width=2, height=2, count=1,
                           dtype="float32", crs="EPSG:4326", transform=grid, nodata=-9999) as dst:
            dst.write(np.array(values, dtype="float32"), 1)
        paths[kind] = str(path)
    item = SimpleNamespace(
        id=uuid4(), kind="temporal_coherence", unit="1", processing_run_id=uuid4(),
        orbit_direction="descending", relative_orbit=71, start_date="2025-01-01",
        end_date="2025-02-01", processing_version="test", stats={
            "timeseries_available": False, "is_fixture": True,
            "quality": {"quality": "caution", "reasons": ["Software test only"]},
            "reference": None, "last_acquisition": None,
        },
    )
    companion = SimpleNamespace(kind="velocity_uncertainty", unit="m/year")
    db = SimpleNamespace(close=lambda: None, scalars=lambda _: [companion])
    monkeypatch.setattr(points.catalog, "product", lambda *_: item)
    monkeypatch.setattr(points.catalog, "role_asset", lambda _, product, __:
                        SimpleNamespace(object_key=paths[product.kind]))
    monkeypatch.setattr(points, "read_url", lambda key: key)
    result = points.summary(db, item.id, Coordinate(lon=40.002, lat=35.998))
    assert result.measurement_kind == "temporal_coherence"
    assert result.measurement.value == 0 and result.measurement.unit == "1"
    assert result.velocity_los.value is None
    assert result.velocity_uncertainty.value == pytest.approx(0.004)
    assert result.velocity_uncertainty.unit == "m/year"
    assert result.sampled_coordinate == Coordinate(lon=40.005, lat=35.995)
    assert [(p.lon, p.lat) for p in result.sampled_cell] == [
        (40, 36), (40.01, 36), (40.01, 35.99), (40, 35.99), (40, 36),
    ]
    before_edge = points.summary(db, item.id, Coordinate(lon=40.0099999, lat=35.998))
    after_edge = points.summary(db, item.id, Coordinate(lon=40.0100001, lat=35.998))
    assert before_edge.measurement.value == 0
    assert after_edge.measurement.value == pytest.approx(0.85)
    missing = points.summary(db, item.id, Coordinate(lon=40.002, lat=35.982))
    assert missing.measurement.value is None and missing.quality == "nodata"
    assert missing.sampled_coordinate is not None and len(missing.sampled_cell) == 5
    outside = points.summary(db, item.id, Coordinate(lon=39, lat=35))
    assert outside.measurement.value is None
    assert outside.sampled_coordinate is None and outside.sampled_cell is None
