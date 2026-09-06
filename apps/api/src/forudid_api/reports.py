"""Queue and download immutable reports from published real analyses."""

import hashlib
import json
from datetime import datetime
from typing import Annotated, Literal
from uuid import NAMESPACE_URL, UUID, uuid5

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from starlette.background import BackgroundTask

from forudid_api import catalog
from forudid_api.config import settings
from forudid_api.db import (
    DataSource,
    InfrastructureAsset,
    ScreeningReport,
    SourceVersion,
    now,
    session,
)
from forudid_api.exposure import published_summary
from forudid_api.publish_historical import json_bytes
from forudid_api.report_worker import renderer_identity
from forudid_api.storage import s3

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])
DB = Annotated[Session, Depends(session)]


class ReportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    analysis_run_id: UUID
    asset_id: UUID
    language: Literal["fa"] = "fa"


class ReportInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    analysis_run_id: UUID
    asset_id: UUID
    language: Literal["fa"]
    status: Literal["queued", "processing", "completed", "failed"]
    created_at: datetime
    generated_at: datetime | None
    checksum_sha256: str | None
    html_sha256: str | None
    error_code: str | None


def available_report(db: Session, report_id: UUID):
    report = db.get(ScreeningReport, report_id)
    if report is None:
        raise catalog.missing("REPORT_NOT_FOUND")
    _, run, _ = published_summary(db, report.asset_id, report.analysis_run_id)
    catalog.product(db, run.product_id)
    return report


@router.post("", status_code=202, response_model=ReportInfo, operation_id="createScreeningReport")
def create_report(request: ReportRequest, db: DB):
    summary, run, method = published_summary(db, request.asset_id, request.analysis_run_id)
    product = catalog.product(db, run.product_id)
    if product.stats.get("is_fixture"):
        raise catalog.missing("REAL_ANALYSIS_REQUIRED")
    asset = db.get(InfrastructureAsset, request.asset_id)
    if asset is None:
        raise catalog.missing("ASSET_NOT_FOUND")
    sources = []
    for source_id in (run.source_version_id, product.source_version_id):
        version = db.get(SourceVersion, source_id)
        source = db.get(DataSource, version.source_id) if version else None
        if version is None or source is None:
            raise catalog.missing("SOURCE_NOT_FOUND")
        sources.append(
            {
                "name": source.name,
                "citation": source.citation,
                "homepage": source.homepage,
                "license": source.license_name,
                "license_url": source.license_url,
                "attribution": source.attribution,
                "version_id": str(version.id),
                "version": version.version,
                "data_date": str(version.data_date) if version.data_date else None,
                "sha256": version.checksum_sha256,
            }
        )
    geometry = db.scalar(
        select(func.ST_AsGeoJSON(InfrastructureAsset.geom)).where(
            InfrastructureAsset.id == asset.id
        )
    )
    if geometry is None:
        raise catalog.missing("ASSET_GEOMETRY_NOT_FOUND")
    inputs = {
        "renderer": renderer_identity(),
        "application_version": settings().application_version,
        "language": request.language,
        "analysis_run_id": str(run.id),
        "asset_id": str(asset.id),
        "analysis_json_sha256": summary.checksum_sha256,
        "analysis_inputs": run.inputs,
        "method_version": method.version,
        "method_status": method.status,
        "product_quality": product.stats.get("quality", {}),
        "sources": sources,
        "asset": {
            "name": asset.name,
            "external_id": asset.external_id,
            "type": asset.asset_type,
            "class": asset.asset_class,
            "geometry": json.loads(geometry),
            "data_quality": asset.data_quality,
        },
    }
    identity = uuid5(
        NAMESPACE_URL, "forudid:report:" + hashlib.sha256(json_bytes(inputs)).hexdigest()
    )
    db.execute(
        insert(ScreeningReport)
        .values(
            id=identity,
            created_at=now(),
            analysis_run_id=run.id,
            asset_id=asset.id,
            language=request.language,
            status="queued",
            inputs=inputs,
        )
        .on_conflict_do_nothing(index_elements=[ScreeningReport.id])
    )
    db.execute(
        update(ScreeningReport)
        .where(ScreeningReport.id == identity, ScreeningReport.status == "failed")
        .values(status="queued", error_code=None)
    )
    db.commit()
    return available_report(db, identity)


@router.get("/{report_id}", response_model=ReportInfo, operation_id="getScreeningReport")
def get_report(report_id: UUID, db: DB):
    return available_report(db, report_id)


@router.get("/{report_id}/download", operation_id="downloadScreeningReport")
def download_report(report_id: UUID, db: DB):
    report = available_report(db, report_id)
    if report.status != "completed" or report.object_key is None:
        raise HTTPException(
            409, detail={"code": "REPORT_NOT_READY", "message": "گزارش آماده نیست."}
        )
    response = s3().get_object(Bucket=settings().s3_bucket, Key=report.object_key)
    body = response["Body"]

    def chunks():
        try:
            yield from body.iter_chunks(chunk_size=65536)
        finally:
            body.close()

    return StreamingResponse(
        chunks(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="forudid-{report_id}.pdf"',
            "Content-Length": str(response["ContentLength"]),
            "ETag": f'"{report.checksum_sha256}"',
            "X-Analysis-Run-ID": str(report.analysis_run_id),
        },
        background=BackgroundTask(body.close),
    )
