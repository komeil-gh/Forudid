import math
from uuid import UUID

import numpy as np
import rasterio
from rasterio.warp import transform
from sqlalchemy.orm import Session

from forudid_api import catalog
from forudid_api.db import Product
from forudid_api.schemas import Coordinate, Kind, PointSummary, Quantity, TimeSeries
from forudid_api.storage import read_json, read_url


def series_data(db: Session, run_id: UUID):
    item = catalog.run_product(db, run_id, "timeseries")
    return read_json(catalog.role_asset(db, item, "data").object_key)


def pixel(data: dict, lon: float, lat: float) -> tuple[int, int] | None:
    west, south, east, north = data["bbox"]
    if not west <= lon < east or not south < lat <= north:
        return None
    return (
        math.floor((north - lat) / (north - south) * data["height"]),
        math.floor((lon - west) / (east - west) * data["width"]),
    )


def timeseries(db: Session, run_id: UUID, coordinate: Coordinate) -> TimeSeries:
    item = catalog.run_product(db, run_id, "velocity_los")
    if item.relative_orbit is None:
        raise catalog.missing("TIMESERIES_NOT_AVAILABLE")
    data = series_data(db, run_id)
    index = pixel(data, coordinate.lon, coordinate.lat)
    epochs = []
    for i, date in enumerate(data["dates"]):
        value = data["displacement"][i][index[0]][index[1]] if index else None
        epochs.append(
            {
                "date": date,
                "displacement": value,
                "uncertainty": data["uncertainty"][i] if value is not None else None,
            }
        )
    return TimeSeries(
        coordinate=coordinate,
        run_id=run_id,
        unit="m",
        orbit_direction=item.orbit_direction,
        relative_orbit=item.relative_orbit,
        reference_date=item.stats["reference"]["date"],
        reference_point_id=item.stats["reference"]["id"],
        is_fixture=item.stats["is_fixture"],
        series=epochs,
    )


def sample_product(
    db: Session, item: Product, coordinate: Coordinate
) -> tuple[float | None, Coordinate | None]:
    asset = catalog.role_asset(db, item, "data")
    with rasterio.Env(
        GDAL_HTTP_TIMEOUT=10,
        GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
        GDAL_CACHEMAX=16 * 1024 * 1024,
    ):
        with rasterio.open(read_url(asset.object_key)) as raster:
            projected = transform("EPSG:4326", raster.crs, [coordinate.lon], [coordinate.lat])
            row, col = raster.index(projected[0][0], projected[1][0])
            if not 0 <= row < raster.height or not 0 <= col < raster.width:
                return None, None
            values = raster.read(1, window=((row, row + 1), (col, col + 1)), masked=True)
            cx, cy = raster.xy(row, col)
            geographic = transform(raster.crs, "EPSG:4326", [cx], [cy])
            center = Coordinate(lon=geographic[0][0], lat=geographic[1][0])
            if np.ma.getmaskarray(values)[0, 0]:
                return None, center
            value = float(values[0, 0]) * raster.scales[0] + raster.offsets[0]
            return (value if math.isfinite(value) else None), center


def summary(db: Session, product_id: UUID, coordinate: Coordinate) -> PointSummary:
    requested = catalog.product(db, product_id)
    historical = requested.source_version_id is not None
    item = (
        requested
        if historical
        else catalog.run_product(db, requested.processing_run_id, "velocity_los")
    )
    value, center = sample_product(db, item, coordinate)
    uncertainty, coherence, observations = None, None, None
    if not historical:
        uncertainty, _ = sample_product(
            db, catalog.run_product(db, item.processing_run_id, "velocity_uncertainty"), coordinate
        )
        coherence, _ = sample_product(
            db, catalog.run_product(db, item.processing_run_id, "temporal_coherence"), coordinate
        )
        observations = sum(
            e.displacement is not None
            for e in timeseries(db, item.processing_run_id, coordinate).series
        )
    quality = "nodata" if value is None else item.stats["quality"]["quality"]
    reasons = list(item.stats["quality"]["reasons"])
    if value is None:
        reasons.append("در این پیکسل داده موجود نیست؛ نبود داده به معنای نبود تغییرشکل نیست.")
    return PointSummary(
        coordinate=coordinate,
        sampled_coordinate=center,
        product_id=product_id,
        run_id=item.processing_run_id,
        measurement=Quantity(value=value, unit=item.unit),
        measurement_kind=Kind(item.kind),
        velocity_los=Quantity(value=None if historical else value, unit="m/year"),
        velocity_uncertainty=Quantity(value=uncertainty, unit=item.unit),
        temporal_coherence=coherence,
        observations=observations,
        orbit_direction=item.orbit_direction,
        relative_orbit=item.relative_orbit,
        start_date=item.start_date,
        end_date=item.end_date,
        last_acquisition=item.stats["last_acquisition"],
        processing_version=item.processing_version,
        reference=item.stats["reference"],
        reference_description=item.stats.get("reference_description"),
        quality=quality,
        quality_reasons=reasons,
        is_fixture=item.stats["is_fixture"],
    )
