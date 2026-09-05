"""Read versioned historical administrative boundaries."""

import json
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from forudid_api.catalog import missing
from forudid_api.db import DataSource, Region, SourceVersion, session

router = APIRouter(prefix="/api/v1/regions", tags=["regions"])
DB = Annotated[Session, Depends(session)]


class RegionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    source_version_id: UUID
    name_en: str
    name_fa: str
    source_code: str | None
    area_m2: float
    bbox: list[float]
    properties: dict[str, Any]


class RegionPage(BaseModel):
    items: list[RegionInfo]
    source_version_id: UUID | None
    next_offset: int | None


class MultiPolygonGeometry(BaseModel):
    type: Literal["MultiPolygon"] = "MultiPolygon"
    coordinates: list[list[list[tuple[float, float]]]]


class RegionFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: UUID
    properties: RegionInfo
    geometry: MultiPolygonGeometry
    attribution: str
    license_url: str
    source_year: str


@router.get("", response_model=RegionPage, operation_id="listRegions")
def regions(
    db: DB,
    source_version_id: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    offset: Annotated[int, Query(ge=0, le=100000)] = 0,
):
    if source_version_id is None:
        source_version_id = db.scalar(
            select(SourceVersion.id)
            .where(select(Region.id).where(Region.source_version_id == SourceVersion.id).exists())
            .order_by(SourceVersion.created_at.desc(), SourceVersion.id)
            .limit(1)
        )
    if source_version_id is None:
        return RegionPage(items=[], source_version_id=None, next_offset=None)
    items = db.scalars(
        select(Region)
        .where(Region.source_version_id == source_version_id)
        .order_by(Region.name_en, Region.id)
        .offset(offset)
        .limit(limit + 1)
    ).all()
    return RegionPage(
        items=[RegionInfo.model_validate(r) for r in items[:limit]],
        source_version_id=source_version_id,
        next_offset=offset + limit if len(items) > limit else None,
    )


@router.get("/{region_id}", response_model=RegionFeature, operation_id="getRegion")
def region(region_id: UUID, db: DB):
    row = db.execute(
        select(Region, func.ST_AsGeoJSON(Region.geom), DataSource, SourceVersion)
        .join(SourceVersion, Region.source_version_id == SourceVersion.id)
        .join(DataSource, SourceVersion.source_id == DataSource.id)
        .where(Region.id == region_id)
    ).first()
    if row is None:
        raise missing("REGION_NOT_FOUND")
    item, geometry, provider, version = row
    return RegionFeature(
        id=item.id,
        properties=RegionInfo.model_validate(item),
        geometry=json.loads(geometry),
        attribution=provider.attribution,
        license_url=provider.license_url,
        source_year=version.metadata_json["quality"]["historical_year"],
    )
