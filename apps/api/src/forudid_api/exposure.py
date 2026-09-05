"""Read precomputed exposure only; requests never launch analysis."""

import csv
import io
import json
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Float, func, select
from sqlalchemy.orm import Session
from starlette.background import BackgroundTask

from forudid_api.catalog import missing, product
from forudid_api.config import settings
from forudid_api.db import (
    AnalysisMethod,
    AnalysisRun,
    AssetExposureSummary,
    ExposureSegment,
    InfrastructureAsset,
    PopulationExposureResult,
    Region,
    session,
)
from forudid_api.publish_historical import NOTE
from forudid_api.storage import read_json, s3

router = APIRouter(prefix="/api/v1", tags=["exposure"])
DB = Annotated[Session, Depends(session)]


class RankedAsset(BaseModel):
    asset_id: UUID
    external_id: str
    name: str | None
    asset_type: str
    asset_class: str
    total_length_m: float
    valid_length_m: float
    coverage_fraction: float
    mean_velocity: float | None
    p95_velocity: float | None
    max_abs_velocity: float | None


class AssetRanking(BaseModel):
    analysis_run_id: UUID | None
    method_version: str | None
    method_status: str | None
    items: list[RankedAsset]
    total: int
    next_offset: int | None
    inputs: dict[str, Any]
    unit: Literal["mm/year"] = "mm/year"
    scope: str
    disclaimer: str = NOTE


@router.get("/exposure-ranking", response_model=AssetRanking, operation_id="getExposureRanking")
def ranking(
    db: DB,
    product_id: UUID,
    asset_type: Literal["railway", "road"] = "railway",
    run_id: UUID | None = None,
    region_id: UUID | None = None,
    q: Annotated[str | None, Query(max_length=80)] = None,
    min_coverage: Annotated[float, Query(ge=0, le=1)] = 0,
    sort: Literal[
        "max_abs_velocity", "p95_velocity", "mean_velocity", "valid_length_m", "coverage_fraction"
    ] = "max_abs_velocity",
    direction: Literal["asc", "desc"] = "desc",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0, le=200000)] = 0,
):
    product(db, product_id)
    run_query = (
        select(AnalysisRun, AnalysisMethod)
        .join(AnalysisMethod)
        .where(
            AnalysisRun.product_id == product_id,
            AnalysisRun.status == "published",
            AnalysisMethod.status != "deprecated",
            AnalysisRun.inputs["asset_type"].astext == asset_type,
        )
    )
    if run_id is not None:
        run_query = run_query.where(AnalysisRun.id == run_id)
    row = db.execute(
        run_query.order_by(AnalysisRun.finished_at.desc(), AnalysisRun.id).limit(1)
    ).first()
    scope = "whole_assets_intersecting_region" if region_id else "whole_assets"
    region = db.get(Region, region_id) if region_id else None
    if region_id and region is None:
        raise missing("REGION_NOT_FOUND")
    if row is None:
        return AssetRanking(
            analysis_run_id=None,
            method_version=None,
            method_status=None,
            items=[],
            total=0,
            next_offset=None,
            inputs={},
            scope=scope,
        )
    run, method = row
    query = (
        select(AssetExposureSummary, InfrastructureAsset)
        .join(InfrastructureAsset, AssetExposureSummary.asset_id == InfrastructureAsset.id)
        .where(
            AssetExposureSummary.analysis_run_id == run.id,
            AssetExposureSummary.coverage_fraction >= min_coverage,
        )
    )
    if q:
        query = query.where(
            InfrastructureAsset.name.icontains(q, autoescape=True)
            | InfrastructureAsset.external_id.icontains(q, autoescape=True)
        )
    if region is not None:
        query = query.where(func.ST_Intersects(InfrastructureAsset.geom, region.geom))
    order = (
        getattr(AssetExposureSummary, sort)
        if sort in ("valid_length_m", "coverage_fraction")
        else AssetExposureSummary.metrics[sort].astext.cast(Float)
    )
    order = order.asc().nullslast() if direction == "asc" else order.desc().nullslast()
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.execute(
        query.order_by(order, InfrastructureAsset.id).offset(offset).limit(limit)
    ).all()
    return AssetRanking(
        analysis_run_id=run.id,
        method_version=method.version,
        method_status=method.status,
        total=total,
        next_offset=offset + limit if offset + limit < total else None,
        inputs=run.inputs,
        scope=scope,
        items=[
            RankedAsset(
                asset_id=asset.id,
                external_id=asset.external_id,
                name=asset.name,
                asset_type=asset.asset_type,
                asset_class=asset.asset_class,
                total_length_m=summary.total_length_m,
                valid_length_m=summary.valid_length_m,
                coverage_fraction=summary.coverage_fraction,
                mean_velocity=summary.metrics.get("mean_velocity"),
                p95_velocity=summary.metrics.get("p95_velocity"),
                max_abs_velocity=summary.metrics.get("max_abs_velocity"),
            )
            for summary, asset in rows
        ],
    )


class RegionMetrics(BaseModel):
    area_m2: float
    valid_deformation_area_m2: float
    coverage_fraction: float
    mean_mm_year: float | None
    median_mm_year: float | None
    p95_mm_year: float | None
    maximum_mm_year: float | None
    boundary_projection: str
    boundary_max_segment_degrees: float
    area_weighted: bool


class PopulationMetrics(BaseModel):
    estimated_total: float
    estimated_valid_coverage: float
    estimated_without_deformation_data: float
    estimated_outside_deformation_extent: float
    coverage_fraction: float | None
    estimated_by_numeric_band: list[float]
    band_edges_mm_year: list[float]
    hazard_population: None = None
    allocation_assumption: str
    alignment_method: str
    region: RegionMetrics | None = None


class PopulationSummary(BaseModel):
    analysis_run_id: UUID
    product_id: UUID
    population_source_version_id: UUID
    population_year: int
    region_id: UUID | None
    method_version: str
    method_status: str
    metrics: PopulationMetrics
    inputs: dict[str, Any]
    checksum_sha256: str
    disclaimer: str = NOTE


@router.get(
    "/products/{product_id}/population-exposure",
    response_model=PopulationSummary,
    operation_id="getPopulationExposure",
)
def population_summary(
    product_id: UUID, db: DB, run_id: UUID | None = None, region_id: UUID | None = None
):
    product(db, product_id)
    query = (
        select(PopulationExposureResult, AnalysisRun, AnalysisMethod)
        .join(AnalysisRun, PopulationExposureResult.analysis_run_id == AnalysisRun.id)
        .join(AnalysisMethod, AnalysisRun.method_id == AnalysisMethod.id)
        .where(
            AnalysisRun.product_id == product_id,
            AnalysisRun.status == "published",
            AnalysisMethod.status != "deprecated",
        )
    )
    if run_id is not None:
        query = query.where(AnalysisRun.id == run_id)
    query = query.where(PopulationExposureResult.region_id == region_id)
    row = db.execute(
        query.order_by(AnalysisRun.finished_at.desc(), AnalysisRun.id).limit(1)
    ).first()
    if row is None:
        raise missing("POPULATION_EXPOSURE_NOT_AVAILABLE")
    result, run, method = row
    return PopulationSummary(
        analysis_run_id=run.id,
        product_id=product_id,
        population_source_version_id=result.population_source_version_id,
        population_year=result.population_year,
        region_id=result.region_id,
        method_version=method.version,
        method_status=method.status,
        metrics=result.metrics,
        inputs=run.inputs,
        checksum_sha256=result.checksum_sha256,
    )


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


@router.get("/analyses/{run_id}/assets/{asset_id}/download", operation_id="downloadAssetAnalysis")
def download_analysis(run_id: UUID, asset_id: UUID, db: DB):
    item, run, _ = published_summary(db, asset_id, run_id)
    product(db, run.product_id)
    response = s3().get_object(Bucket=settings().s3_bucket, Key=item.profile_key)
    body = response["Body"]

    def chunks():
        try:
            yield from body.iter_chunks(chunk_size=65536)
        finally:
            body.close()

    return StreamingResponse(
        chunks(),
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{asset_id}-{run_id}.json"',
            "Content-Length": str(response["ContentLength"]),
            "ETag": f'"{item.checksum_sha256}"',
        },
        background=BackgroundTask(body.close),
    )


@router.get(
    "/analyses/{run_id}/assets/{asset_id}/profile.csv", operation_id="downloadAssetProfileCsv"
)
def download_profile_csv(run_id: UUID, asset_id: UUID, db: DB):
    item, run, method = published_summary(db, asset_id, run_id)
    product(db, run.product_id)
    key, count, checksum = item.profile_key, item.metrics["profile_count"], item.checksum_sha256
    source = run.inputs["deformation_source_version_id"]
    infrastructure = run.inputs["infrastructure_source_version_id"]
    version = method.version

    def chunks():
        stream = io.StringIO(newline="")
        writer = csv.writer(stream)
        writer.writerow(
            [
                "analysis_run_id",
                "asset_id",
                "deformation_source_version_id",
                "infrastructure_source_version_id",
                "chainage_m",
                "start_chainage_m",
                "end_chainage_m",
                "lon",
                "lat",
                "velocity_mm_year",
                "quality",
                "method_version",
                "analysis_json_sha256",
            ]
        )
        yield "\ufeff" + stream.getvalue()
        for page in range((count + 999) // 1000):
            stream.seek(0)
            stream.truncate(0)
            writer.writerows(
                [
                    str(run_id),
                    str(asset_id),
                    source,
                    infrastructure,
                    sample["chainage_m"],
                    sample["start_chainage_m"],
                    sample["end_chainage_m"],
                    sample["lon"],
                    sample["lat"],
                    sample["velocity"],
                    sample["quality"],
                    version,
                    checksum,
                ]
                for sample in read_json(f"{key}.profile-{page}.json")
            )
            yield stream.getvalue()

    return StreamingResponse(
        chunks(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{asset_id}-{run_id}-profile.csv"',
            "X-Analysis-JSON-SHA256": checksum,
        },
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
    "/analyses/{run_id}/assets/{asset_id}/segments.geojson",
    operation_id="downloadExposureSegments",
)
def download_segments(run_id: UUID, asset_id: UUID, db: DB):
    item, run, method = published_summary(db, asset_id, run_id)
    product(db, run.product_id)
    metadata = {
        "type": "FeatureCollection",
        "analysis_run_id": str(run_id),
        "asset_id": str(asset_id),
        "inputs": run.inputs,
        "method_version": method.version,
        "method_status": method.status,
        "unit": "mm/year",
        "analysis_json_sha256": item.checksum_sha256,
        "disclaimer": NOTE,
    }
    summary_id = item.id

    def chunks():
        yield json.dumps(metadata, ensure_ascii=False, allow_nan=False)[:-1] + ',"features":['
        first = True
        query = (
            select(ExposureSegment, func.ST_AsGeoJSON(ExposureSegment.geom))
            .where(ExposureSegment.summary_id == summary_id)
            .order_by(ExposureSegment.ordinal)
            .execution_options(yield_per=100)
        )
        for segment, geometry in db.execute(query):
            feature = {
                "type": "Feature",
                "id": str(segment.id),
                "geometry": json.loads(geometry),
                "properties": SegmentInfo.model_validate(segment).model_dump(mode="json"),
            }
            yield ("" if first else ",") + json.dumps(feature, allow_nan=False)
            first = False
        yield "]}"

    return StreamingResponse(
        chunks(),
        media_type="application/geo+json",
        headers={
            "Content-Disposition": f'attachment; filename="{asset_id}-{run_id}-segments.geojson"',
            "X-Analysis-JSON-SHA256": item.checksum_sha256,
        },
    )


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
