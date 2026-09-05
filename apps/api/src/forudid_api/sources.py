"""Public, bounded registry reads. Storage locations and arbitrary metadata stay private."""

from datetime import date, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from forudid_api.catalog import missing
from forudid_api.db import DataSource, SourceVersion, session

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])
DB = Annotated[Session, Depends(session)]


class SourceInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    slug: str
    name: str
    provider: str
    source_type: str
    homepage: str
    citation: str
    license_name: str
    license_url: str
    attribution: str
    access_method: str
    scientific_status: str


class VersionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    source_id: UUID
    version: str
    data_date: date | None
    valid_from: date | None
    valid_to: date | None
    downloaded_at: datetime
    checksum_sha256: str
    size_bytes: int
    observation_years: list[int]
    component: str | None
    method: str | None
    validation_status: str
    files: list["SourceFileInfo"]


class SourceFileInfo(BaseModel):
    role: str
    name: str
    size_bytes: int
    checksum_sha256: str


def version_info(row: SourceVersion) -> VersionInfo:
    metadata = row.metadata_json
    return VersionInfo(
        id=row.id,
        source_id=row.source_id,
        version=row.version,
        data_date=row.data_date,
        valid_from=row.valid_from,
        valid_to=row.valid_to,
        downloaded_at=row.downloaded_at,
        checksum_sha256=row.checksum_sha256,
        size_bytes=row.size_bytes,
        observation_years=metadata.get("observation_years", []),
        component=metadata.get("component"),
        method=metadata.get("method"),
        validation_status=metadata.get("validation_status", "unknown"),
        files=[
            SourceFileInfo.model_validate(f) for f in metadata.get("manifest", {}).get("files", [])
        ],
    )


class SourcePage(BaseModel):
    items: list[SourceInfo]
    next_cursor: UUID | None


class VersionPage(BaseModel):
    items: list[VersionInfo]
    next_cursor: UUID | None


@router.get("", response_model=SourcePage, operation_id="listSources")
def sources(db: DB, limit: Annotated[int, Query(ge=1, le=100)] = 20, cursor: UUID | None = None):
    query = select(DataSource).order_by(DataSource.id).limit(limit + 1)
    if cursor is not None:
        query = query.where(DataSource.id > cursor)
    rows = db.scalars(query).all()
    return SourcePage(
        items=[SourceInfo.model_validate(s) for s in rows[:limit]],
        next_cursor=rows[limit - 1].id if len(rows) > limit else None,
    )


@router.get("/{source_id}", response_model=SourceInfo, operation_id="getSource")
def source(source_id: UUID, db: DB):
    item = db.get(DataSource, source_id)
    if item is None:
        raise missing("SOURCE_NOT_FOUND")
    return SourceInfo.model_validate(item)


@router.get("/{source_id}/versions", response_model=VersionPage, operation_id="listSourceVersions")
def versions(
    source_id: UUID,
    db: DB,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    cursor: UUID | None = None,
):
    source(source_id, db)
    query = (
        select(SourceVersion)
        .where(SourceVersion.source_id == source_id)
        .order_by(SourceVersion.id)
        .limit(limit + 1)
    )
    if cursor is not None:
        query = query.where(SourceVersion.id > cursor)
    rows = db.scalars(query).all()
    return VersionPage(
        items=[version_info(v) for v in rows[:limit]],
        next_cursor=rows[limit - 1].id if len(rows) > limit else None,
    )
