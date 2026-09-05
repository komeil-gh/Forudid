"""Read precomputed exposure only; requests never launch analysis."""

import json
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from forudid_api.catalog import missing
from forudid_api.db import (
    AnalysisMethod,
    AnalysisRun,
    AssetExposureSummary,
    ExposureSegment,
    session,
)
from forudid_api.publish_historical import NOTE
from forudid_api.storage import read_json

router = APIRouter(prefix="/api/v1", tags=["exposure"])
DB = Annotated[Session, Depends(session)]


class ExposureSummary(BaseModel):
    analysis_run_id: UUID
    asset_id: UUID
    method_version: str
    method_status: str
    unit: Literal["mm/year"] = "mm/year"
    total_length_m: float
    valid_length_m: float
    coverage_fraction: float
    segment_count: int
    metrics: dict[str, Any]
    inputs: dict[str, Any]
    checksum_sha256: str
    disclaimer: str = NOTE


class ProfileSample(BaseModel):
    chainage_m: float
    start_chainage_m: float
    end_chainage_m: float
    lon: float
    lat: float
    velocity: float | None
    quality: Literal["source_value", "nodata"]
    band_index: int | None
    uncertainty: float | None
    gradient_proxy: float | None
    angular_distortion: float | None
    hazard_class: str | None


class ProfilePage(BaseModel):
    analysis_run_id: UUID
    asset_id: UUID
    items: list[ProfileSample]
    next_page: int | None
    total: int


def published_summary(
    db: Session, asset_id: UUID, run_id: UUID | None, product_id: UUID | None = None
):
    query = (
        select(AssetExposureSummary, AnalysisRun, AnalysisMethod)
        .join(AnalysisRun, AssetExposureSummary.analysis_run_id == AnalysisRun.id)
        .join(AnalysisMethod, AnalysisRun.method_id == AnalysisMethod.id)
        .where(
            AssetExposureSummary.asset_id == asset_id,
            AnalysisRun.status == "published",
            AnalysisMethod.status != "deprecated",
        )
    )
    if run_id:
        query = query.where(AnalysisRun.id == run_id)
    if product_id:
        query = query.where(AnalysisRun.product_id == product_id)
    row = db.execute(
        query.order_by(AnalysisRun.finished_at.desc(), AnalysisRun.id).limit(1)
    ).first()
    if row is None:
        raise missing("EXPOSURE_NOT_AVAILABLE")
    return row


@router.get(
    "/assets/{asset_id}/exposure", response_model=ExposureSummary, operation_id="getAssetExposure"
)
def summary(asset_id: UUID, db: DB, run_id: UUID | None = None, product_id: UUID | None = None):
    item, run, method = published_summary(db, asset_id, run_id, product_id)
    return ExposureSummary(
        analysis_run_id=run.id,
        asset_id=asset_id,
        method_version=method.version,
        method_status=method.status,
        total_length_m=item.total_length_m,
        valid_length_m=item.valid_length_m,
        coverage_fraction=item.coverage_fraction,
        segment_count=item.segment_count,
        metrics=item.metrics,
        inputs=run.inputs,
        checksum_sha256=item.checksum_sha256,
    )


@router.get(
    "/analyses/{run_id}/assets/{asset_id}/profile",
    response_model=ProfilePage,
    operation_id="getAssetProfile",
)
def profile(run_id: UUID, asset_id: UUID, db: DB, page: Annotated[int, Query(ge=0, le=199)] = 0):
    item, _, _ = published_summary(db, asset_id, run_id)
    total = item.metrics["profile_count"]
    samples = read_json(f"{item.profile_key}.profile-{page}.json") if page * 1000 < total else []
    return ProfilePage(
        analysis_run_id=run_id,
        asset_id=asset_id,
        items=samples,
        total=total,
        next_page=page + 1 if (page + 1) * 1000 < total else None,
    )


class SegmentInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    ordinal: int
    start_chainage_m: float
    end_chainage_m: float
    band_index: int | None
    metrics: dict[str, Any]


class SegmentPage(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    analysis_run_id: UUID
    asset_id: UUID
    features: list[dict[str, Any]]
    next_offset: int | None


@router.get(
    "/analyses/{run_id}/assets/{asset_id}/segments",
    response_model=SegmentPage,
    operation_id="getExposureSegments",
)
def segments(
    run_id: UUID,
    asset_id: UUID,
    db: DB,
    offset: Annotated[int, Query(ge=0, le=200000)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
):
    item, _, _ = published_summary(db, asset_id, run_id)
    rows = db.execute(
        select(ExposureSegment, func.ST_AsGeoJSON(ExposureSegment.geom))
        .where(ExposureSegment.summary_id == item.id, ExposureSegment.ordinal >= offset)
        .order_by(ExposureSegment.ordinal)
        .limit(limit + 1)
    ).all()
    return SegmentPage(
        analysis_run_id=run_id,
        asset_id=asset_id,
        features=[
            {
                "type": "Feature",
                "id": str(row.id),
                "geometry": json.loads(geometry),
                "properties": SegmentInfo.model_validate(row).model_dump(mode="json"),
            }
            for row, geometry in rows[:limit]
        ],
        next_offset=offset + limit if len(rows) > limit else None,
    )
