import json
import logging
import time
from typing import Annotated, Any, Literal
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from forudid_api import (
    catalog,
    events,
    exposure,
    infrastructure,
    points,
    population,
    regions,
    reports,
    sources,
    styles,
)
from forudid_api.config import settings
from forudid_api.db import AOI, Asset, Product, Run, session
from forudid_api.schemas import (
    Area,
    Coordinate,
    ErrorResponse,
    Kind,
    Legend,
    PointSummary,
    ProductInfo,
    Quality,
    RunInfo,
    TimeSeries,
)
from forudid_api.storage import read_json, s3
from forudid_api.tiles import PublishedTiler

app = FastAPI(
    title="FORUDID",
    version=settings().application_version,
    responses={code: {"model": ErrorResponse} for code in (400, 404, 422, 503)},
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings().cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(PublishedTiler().router, prefix="/tiles", tags=["tiles"])
app.include_router(sources.router)
app.include_router(infrastructure.router)
app.include_router(exposure.router)
app.include_router(regions.router)
app.include_router(reports.router)
app.include_router(events.router)
app.include_router(population.router)
DB = Annotated[Session, Depends(session)]
Lon = Annotated[float, Query(ge=-180, le=180, allow_inf_nan=False)]
Lat = Annotated[float, Query(ge=-90, le=90, allow_inf_nan=False)]
log = logging.getLogger("uvicorn.error")


@app.middleware("http")
async def request_log(request: Request, call_next):
    request_id, started = str(uuid4()), time.monotonic()
    try:
        response = await call_next(request)
    except Exception as exc:
        log.error(
            json.dumps(
                {
                    "request_id": request_id,
                    "code": "INTERNAL_ERROR",
                    "exception_type": type(exc).__name__,
                }
            )
        )
        response = JSONResponse(
            status_code=503,
            content={
                "error": {
                    "code": "SERVICE_UNAVAILABLE",
                    "message": "سرویس داده در دسترس نیست؛ دوباره تلاش کنید.",
                }
            },
        )
    response.headers["X-Request-ID"] = request_id
    log.info(
        json.dumps(
            {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round((time.monotonic() - started) * 1000),
            }
        )
    )
    return response


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    detail = (
        exc.detail
        if isinstance(exc.detail, dict)
        else {"code": "REQUEST_REJECTED", "message": "درخواست معتبر نیست یا داده در دسترس نیست."}
    )
    return JSONResponse(status_code=exc.status_code, content={"error": detail})


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {"code": "INVALID_PARAMETERS", "message": "پارامترهای درخواست معتبر نیستند."}
        },
    )


@app.get("/health/live", operation_id="getLiveness")
def live() -> dict[str, str]:
    return {"status": "ok", "application_version": settings().application_version}


@app.get("/health/ready", operation_id="getReadiness")
def ready(db: DB) -> dict[str, str]:
    db.execute(text("SELECT id FROM areas_of_interest LIMIT 1"))
    s3().head_bucket(Bucket=settings().s3_bucket)
    return {"status": "ok"}


@app.get("/api/v1/aois", operation_id="listAreas", response_model=list[Area])
def areas(db: DB):
    query = (
        select(AOI)
        .join(Product, Product.aoi_id == AOI.id)
        .join(Run, Run.id == Product.processing_run_id)
        .where(
            AOI.active,
            Product.status == "published",
            Run.status == "published",
            catalog.visible_product(),
        )
        .distinct()
    )
    return [Area.model_validate(a) for a in db.scalars(query).all()]


@app.get("/api/v1/aois/{slug}", operation_id="getArea", response_model=Area)
def area(slug: str, db: DB):
    item = db.scalar(select(AOI).where(AOI.slug == slug, AOI.active))
    if item is None:
        raise catalog.missing("AOI_NOT_FOUND")
    return Area.model_validate(item)


@app.get("/api/v1/products", operation_id="listProducts", response_model=list[ProductInfo])
def products(
    db: DB,
    aoi: str = "iran",
    kind: Kind | None = None,
    orbit: Literal["ascending", "descending"] | None = None,
    relative_orbit: Annotated[int | None, Query(ge=1, le=175)] = None,
    status: Literal["published"] = "published",
    run: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0, le=100000)] = 0,
):
    query = (
        select(Product)
        .join(AOI)
        .join(Run, Product.processing_run_id == Run.id)
        .where(
            AOI.slug == aoi,
            Product.status == status,
            Run.status == "published",
            catalog.visible_product(),
        )
    )
    for column, value in (
        (Product.kind, kind),
        (Product.orbit_direction, orbit),
        (Product.relative_orbit, relative_orbit),
        (Product.processing_run_id, run),
    ):
        if value is not None:
            query = query.where(column == value)
    items = db.scalars(
        query.order_by(Product.created_at.desc(), Product.id).offset(offset).limit(limit)
    ).all()
    area = db.scalar(select(AOI).where(AOI.slug == aoi))
    assets = db.scalars(select(Asset).where(Asset.product_id.in_([p.id for p in items]))).all()
    grouped: dict[UUID, list[Asset]] = {}
    for asset in assets:
        grouped.setdefault(asset.product_id, []).append(asset)
    return [catalog.info(db, p, area, grouped.get(p.id, [])) for p in items]


@app.get("/api/v1/products/{product_id}", operation_id="getProduct", response_model=ProductInfo)
def get_product(product_id: UUID, db: DB):
    return catalog.info(db, catalog.product(db, product_id))


@app.get("/api/v1/products/{product_id}/legend", operation_id="getLegend", response_model=Legend)
def get_legend(product_id: UUID, db: DB):
    item = catalog.product(db, product_id)
    if item.kind not in styles.DEFAULT_STYLE:
        raise catalog.missing("LEGEND_NOT_AVAILABLE")
    return styles.legend(item)


@app.get("/api/v1/products/{product_id}/quality", operation_id="getQuality", response_model=Quality)
def get_quality(product_id: UUID, db: DB):
    return Quality.model_validate(catalog.product(db, product_id).stats["quality"])


@app.get("/api/v1/products/{product_id}/metadata", operation_id="getMetadata")
def get_metadata(product_id: UUID, db: DB) -> dict[str, Any]:
    item = catalog.product(db, product_id)
    return read_json(catalog.role_asset(db, item, "metadata").object_key)


@app.get("/api/v1/products/{product_id}/provenance", operation_id="getProvenance")
def get_provenance(product_id: UUID, db: DB) -> dict[str, Any]:
    item = catalog.product(db, product_id)
    return read_json(catalog.role_asset(db, item, "provenance").object_key)


@app.get("/api/v1/points/summary", operation_id="getPointSummary", response_model=PointSummary)
def point_summary(lon: Lon, lat: Lat, product_id: UUID, db: DB):
    return points.summary(db, product_id, Coordinate(lon=lon, lat=lat))


@app.get("/api/v1/points/timeseries", operation_id="getTimeSeries", response_model=TimeSeries)
def get_series(lon: Lon, lat: Lat, run_id: UUID, db: DB):
    return points.timeseries(db, run_id, Coordinate(lon=lon, lat=lat))


@app.get("/api/v1/runs/{run_id}", operation_id="getRun", response_model=RunInfo)
def get_run(run_id: UUID, db: DB):
    run = db.get(Run, run_id)
    if (
        run is None
        or run.status != "published"
        or (not settings().allow_fixture_products and run.config.get("is_fixture"))
    ):
        raise catalog.missing("RUN_NOT_PUBLISHED")
    return RunInfo.model_validate(run)
