"""Native counts and display tiles from verified, immutable population sources."""

import math
from typing import Annotated, Literal
from uuid import UUID

import numpy as np
import rasterio
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request, Response
from pydantic import BaseModel
from rio_tiler.errors import TileOutsideBounds
from rio_tiler.io.rasterio import Reader
from sqlalchemy import select
from sqlalchemy.orm import Session

from forudid_api.catalog import missing
from forudid_api.config import settings
from forudid_api.db import DataSource, SourceVersion, session
from forudid_api.storage import read_url

router = APIRouter(tags=["population"])
DB = Annotated[Session, Depends(session)]
TICKS = [0, 10, 100, 1000, 10000, 30000]
COLORS = ["#fff7ec", "#fee8c8", "#fdbb84", "#fc8d59", "#d7301f", "#7f0000"]


class PopulationSource(BaseModel):
    source_version_id: UUID
    source_id: UUID
    population_year: int
    name: str
    citation: str
    license: str
    source_url: str
    maturity: str
    un_adjusted: bool
    constrained: bool | None
    temporal_semantics: str
    estimated_total: float
    bounds: list[float]
    unit: Literal["people/pixel"] = "people/pixel"
    cell_size_degrees: float
    checksum_sha256: str
    tile_template: str
    legend_ticks: list[int]
    legend_colors: list[str]
    display_scale: Literal["log1p"] = "log1p"


class PopulationSources(BaseModel):
    items: list[PopulationSource]


class PopulationPoint(BaseModel):
    source_version_id: UUID
    population_year: int
    lon: float
    lat: float
    count: float | None
    unit: Literal["people/pixel"] = "people/pixel"
    cell_bounds: list[float] | None
    status: Literal["value", "nodata", "outside_extent"]


def verified_sources():
    return (
        select(SourceVersion, DataSource)
        .join(DataSource)
        .where(
            DataSource.source_type == "population",
            SourceVersion.metadata_json["validation_status"].astext
            == "local_sha256_and_pixels_verified",
            SourceVersion.metadata_json["manifest"]["is_fixture"].as_boolean().is_(False),
            SourceVersion.metadata_json["manifest"]["base_pixels_preserved"].as_boolean().is_(True),
        )
    )


def version(db: Session, identity: UUID) -> SourceVersion:
    row = db.execute(verified_sources().where(SourceVersion.id == identity)).first()
    if row is None:
        raise missing("POPULATION_SOURCE_NOT_AVAILABLE")
    return row[0]


@router.get(
    "/api/v1/population/sources",
    response_model=PopulationSources,
    operation_id="listPopulationSources",
)
def sources(db: DB):
    rows = db.execute(verified_sources()).all()
    items = []
    for item, source in rows:
        manifest = item.metadata_json["manifest"]
        provider = manifest["provider"]
        items.append(
            PopulationSource(
                source_version_id=item.id,
                source_id=source.id,
                population_year=manifest["population_year"],
                name=source.name,
                citation=source.citation,
                license=source.license_name,
                source_url=source.homepage,
                maturity=provider.get("maturity", "published"),
                un_adjusted=manifest["un_adjusted"],
                constrained=provider.get("constrained"),
                temporal_semantics=provider.get(
                    "temporal_semantics", "Modelled population estimate"
                ),
                estimated_total=manifest["estimated_total"],
                bounds=manifest["grid"]["bounds"],
                cell_size_degrees=manifest["grid"]["transform"][0],
                checksum_sha256=manifest["normalized_sha256"],
                tile_template=f"/tiles/population/{item.id}/{{z}}/{{x}}/{{y}}.png",
                legend_ticks=TICKS,
                legend_colors=COLORS,
            )
        )
    return PopulationSources(
        items=sorted(items, key=lambda row: (-row.population_year, str(row.source_version_id)))
    )


@router.get(
    "/api/v1/population/sources/{identity}/point",
    response_model=PopulationPoint,
    operation_id="getPopulationPoint",
)
def point(
    identity: UUID,
    db: DB,
    lon: Annotated[float, Query(ge=-180, le=180, allow_inf_nan=False)],
    lat: Annotated[float, Query(ge=-90, le=90, allow_inf_nan=False)],
):
    item = version(db, identity)
    object_key = item.metadata_json["normalized_object_key"]
    year = item.metadata_json["population_year"]
    db.close()
    count, bounds, status = None, None, "outside_extent"
    with rasterio.Env(
        GDAL_HTTP_TIMEOUT=10,
        GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
        GDAL_CACHEMAX=16 * 1024 * 1024,
    ):
        with rasterio.open(read_url(object_key)) as raster:
            row, col = raster.index(lon, lat)
            if 0 <= row < raster.height and 0 <= col < raster.width:
                value = raster.read(1, window=((row, row + 1), (col, col + 1)), masked=True)[0, 0]
                west, north = raster.xy(row, col, offset="ul")
                east, south = raster.xy(row, col, offset="lr")
                bounds = [west, south, east, north]
                if not np.ma.is_masked(value) and math.isfinite(float(value)):
                    count, status = float(value), "value"
                else:
                    status = "nodata"
    return PopulationPoint(
        source_version_id=identity,
        population_year=year,
        lon=lon,
        lat=lat,
        count=count,
        cell_bounds=bounds,
        status=status,
    )


@router.get(
    "/tiles/population/{identity}/{z}/{x}/{y}.png",
    response_class=Response,
    operation_id="getPopulationTile",
)
def tile(
    request: Request,
    identity: UUID,
    db: DB,
    z: Annotated[int, Path(ge=0, le=18)],
    x: Annotated[int, Path(ge=0)],
    y: Annotated[int, Path(ge=0)],
):
    if request.query_params or x >= 2**z or y >= 2**z:
        raise HTTPException(422, "Invalid tile parameters")
    item = version(db, identity)
    object_key, checksum = item.metadata_json["normalized_object_key"], item.checksum_sha256
    # Tile bursts must not occupy catalog connections while reading object storage.
    db.close()
    try:
        with rasterio.Env(
            GDAL_HTTP_TIMEOUT=10,
            GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
            GDAL_CACHEMAX=16 * 1024 * 1024,
        ):
            with Reader(input=read_url(object_key), options={}) as reader:
                img = reader.tile(x, y, z, tilesize=256, resampling_method="nearest")
        img.array = np.ma.array(
            np.log1p(np.maximum(img.array.data, 0)), mask=np.ma.getmaskarray(img.array)
        )
        img.rescale([(0, math.log1p(TICKS[-1]))])
        stops = np.log1p(TICKS) / math.log1p(TICKS[-1]) * 255
        rgb = [[int(color[i : i + 2], 16) for i in (1, 3, 5)] for color in COLORS]
        cmap = {
            i: (
                int(np.interp(i, stops, [c[0] for c in rgb])),
                int(np.interp(i, stops, [c[1] for c in rgb])),
                int(np.interp(i, stops, [c[2] for c in rgb])),
                255,
            )
            for i in range(256)
        }
        payload = img.render(img_format="PNG", colormap=cmap)
    except TileOutsideBounds:
        return Response(status_code=204)
    return Response(
        payload,
        media_type="image/png",
        headers={
            "Cache-Control": f"public, max-age={settings().tile_cache_seconds}, immutable",
            "ETag": f'"{checksum}-population-log1p-1-{z}-{x}-{y}"',
        },
    )
