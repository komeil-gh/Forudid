"""Bounded reads of versioned OSM ways; geometry is fetched only for a selected asset."""

import json
import math
from datetime import date
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from forudid_api.catalog import missing
from forudid_api.db import DataSource, InfrastructureAsset, SourceVersion, session

router = APIRouter(prefix="/api/v1/assets", tags=["infrastructure"])
DB = Annotated[Session, Depends(session)]


class InfrastructureInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    source_version_id: UUID
    external_id: str
    asset_type: Literal["road", "railway"]
    asset_class: str
    name: str | None
    length_m: float
    properties: dict[str, Any]
    data_quality: dict[str, Any]


class InfrastructurePage(BaseModel):
    items: list[InfrastructureInfo]
    next_cursor: UUID | None
    source_version_id: UUID | None


class LineGeometry(BaseModel):
    type: Literal["LineString"] = "LineString"
    coordinates: list[tuple[float, float]]


class InfrastructureFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: UUID
    geometry: LineGeometry
    properties: InfrastructureInfo
    attribution: str
    license_url: str
    data_date: date | None


@router.get("", response_model=InfrastructurePage, operation_id="listInfrastructureAssets")
def assets(
    db: DB,
    source_version_id: UUID | None = None,
    asset_type: Literal["road", "railway"] | None = None,
    asset_class: Annotated[str | None, Query(max_length=40)] = None,
    bbox: Annotated[str | None, Query(max_length=120)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    cursor: UUID | None = None,
):
    envelope = None
    if bbox is not None:
        try:
            west, south, east, north = map(float, bbox.split(","))
            if not (
                all(math.isfinite(v) for v in (west, south, east, north))
                and -180 <= west < east <= 180
                and -90 <= south < north <= 90
            ):
                raise ValueError
        except ValueError as exc:
            raise HTTPException(422, detail="Invalid geographic bounding box") from exc
        envelope = func.ST_MakeEnvelope(west, south, east, north, 4326)
    if source_version_id is None:
        source_version_id = db.scalar(
            select(SourceVersion.id)
            .where(
                select(InfrastructureAsset.id)
                .where(InfrastructureAsset.source_version_id == SourceVersion.id)
                .exists()
            )
            .order_by(SourceVersion.data_date.desc().nullslast(), SourceVersion.id)
            .limit(1)
        )
    if source_version_id is None:
        return InfrastructurePage(items=[], next_cursor=None, source_version_id=None)
    query = select(InfrastructureAsset).where(
        InfrastructureAsset.source_version_id == source_version_id
    )
    for column, value in (
        (InfrastructureAsset.asset_type, asset_type),
        (InfrastructureAsset.asset_class, asset_class),
    ):
        if value is not None:
            query = query.where(column == value)
    if envelope is not None:
        query = query.where(func.ST_Intersects(InfrastructureAsset.geom, envelope))
    if cursor is not None:
        query = query.where(InfrastructureAsset.id > cursor)
    rows = db.scalars(query.order_by(InfrastructureAsset.id).limit(limit + 1)).all()
    return InfrastructurePage(
        items=[InfrastructureInfo.model_validate(row) for row in rows[:limit]],
        next_cursor=rows[limit - 1].id if len(rows) > limit else None,
        source_version_id=source_version_id,
    )


@router.get(
    "/{asset_id}", response_model=InfrastructureFeature, operation_id="getInfrastructureAsset"
)
def asset(asset_id: UUID, db: DB):
    row = db.execute(
        select(
            InfrastructureAsset,
            func.ST_AsGeoJSON(InfrastructureAsset.geom),
            DataSource.attribution,
            DataSource.license_url,
            SourceVersion.data_date,
        )
        .join(SourceVersion, InfrastructureAsset.source_version_id == SourceVersion.id)
        .join(DataSource, SourceVersion.source_id == DataSource.id)
        .where(InfrastructureAsset.id == asset_id)
    ).first()
    if row is None:
        raise missing("ASSET_NOT_FOUND")
    item, geometry, attribution, license_url, data_date = row
    return InfrastructureFeature(
        id=item.id,
        geometry=json.loads(geometry),
        properties=InfrastructureInfo.model_validate(item),
        attribution=attribution,
        license_url=license_url,
        data_date=data_date,
    )
