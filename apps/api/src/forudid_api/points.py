import math
from uuid import UUID

import numpy as np
from rio_tiler.io.rasterio import Reader
from sqlalchemy.orm import Session

from forudid_api import catalog
from forudid_api.schemas import Coordinate, PointSummary, Quantity, TimeSeries
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


def summary(db: Session, product_id: UUID, coordinate: Coordinate) -> PointSummary:
    requested = catalog.product(db, product_id)
    item = catalog.run_product(db, requested.processing_run_id, "velocity_los")
    data = series_data(db, item.processing_run_id)
    index = pixel(data, coordinate.lon, coordinate.lat)
    values: dict[str, float | None] = {}
    center = None
    for kind in ("velocity_los", "velocity_uncertainty", "temporal_coherence"):
        value = None
        if index:
            related = catalog.run_product(db, item.processing_run_id, kind)
            source = catalog.role_asset(db, related, "data")
            with Reader(input=read_url(source.object_key), options={}) as reader:
                point = reader.point(coordinate.lon, coordinate.lat)
                if not bool(np.ma.getmaskarray(point.array).flat[0]):
                    value = float(point.array[0])
        values[kind] = value
    observations = sum(
        e.displacement is not None
        for e in timeseries(db, item.processing_run_id, coordinate).series
    )
    if index:
        west, south, east, north = data["bbox"]
        center = Coordinate(
            lon=west + (index[1] + 0.5) * (east - west) / data["width"],
            lat=north - (index[0] + 0.5) * (north - south) / data["height"],
        )
    quality = "nodata" if values["velocity_los"] is None else item.stats["quality"]["quality"]
    return PointSummary(
        coordinate=coordinate,
        sampled_coordinate=center,
        product_id=product_id,
        run_id=item.processing_run_id,
        velocity_los=Quantity(value=values["velocity_los"], unit="m/year"),
        velocity_uncertainty=Quantity(value=values["velocity_uncertainty"], unit="m/year"),
        temporal_coherence=values["temporal_coherence"],
        observations=observations,
        orbit_direction=item.orbit_direction,
        relative_orbit=item.relative_orbit,
        start_date=item.start_date,
        end_date=item.end_date,
        last_acquisition=item.stats["last_acquisition"],
        processing_version=item.processing_version,
        reference=item.stats["reference"],
        quality=quality,
        quality_reasons=["دادهٔ ساختگی است؛ برای استناد علمی مناسب نیست."]
        if item.stats["is_fixture"]
        else item.stats["quality"]["reasons"],
        is_fixture=item.stats["is_fixture"],
    )
