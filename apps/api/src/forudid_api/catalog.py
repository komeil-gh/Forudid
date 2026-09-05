from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, true
from sqlalchemy.orm import Session

from forudid_api.config import settings
from forudid_api.db import AOI, Asset, Product, Run
from forudid_api.schemas import AssetInfo, ProductInfo


def missing(code: str = "PRODUCT_NOT_PUBLISHED") -> HTTPException:
    return HTTPException(404, detail={"code": code, "message": "دادهٔ منتشرشده پیدا نشد."})


def visible_product():
    return (
        true()
        if settings().allow_fixture_products
        else Product.stats["is_fixture"].as_boolean().is_(False)
    )


def product(db: Session, product_id: UUID) -> Product:
    item = db.scalar(
        select(Product)
        .join(Run)
        .where(
            Product.id == product_id,
            Product.status == "published",
            Run.status == "published",
            visible_product(),
        )
    )
    if item is None:
        raise missing()
    return item


def asset(db: Session, asset_id: UUID) -> tuple[Asset, Product]:
    found = db.execute(
        select(Asset, Product)
        .join(Product)
        .join(Run)
        .where(
            Asset.id == asset_id,
            Product.status == "published",
            Run.status == "published",
            visible_product(),
        )
    ).first()
    if found is None:
        raise missing("ASSET_NOT_PUBLISHED")
    return found[0], found[1]


def run_product(db: Session, run_id: UUID, kind: str) -> Product:
    item = db.scalar(
        select(Product)
        .join(Run)
        .where(
            Product.processing_run_id == run_id,
            Product.kind == kind,
            Product.status == "published",
            Run.status == "published",
            visible_product(),
        )
    )
    if item is None:
        raise missing()
    return item


def role_asset(db: Session, item: Product, role: str) -> Asset:
    found = db.scalar(select(Asset).where(Asset.product_id == item.id, Asset.role == role))
    if found is None:
        raise missing("ASSET_NOT_PUBLISHED")
    return found


def info(
    db: Session, item: Product, area: AOI | None = None, assets: list[Asset] | None = None
) -> ProductInfo:
    area = area or db.get(AOI, item.aoi_id)
    assert area is not None
    if assets is None:
        assets = list(db.scalars(select(Asset).where(Asset.product_id == item.id)).all())
    values: dict[str, Any] = {
        key: getattr(item, key)
        for key in (
            "id",
            "processing_run_id",
            "source_version_id",
            "aoi_id",
            "kind",
            "orbit_direction",
            "relative_orbit",
            "start_date",
            "end_date",
            "unit",
            "crs",
            "resolution_metadata",
            "processing_version",
            "status",
        )
    }
    return ProductInfo(
        **values,
        aoi_slug=area.slug,
        bbox=area.bbox,
        last_acquisition=item.stats["last_acquisition"],
        is_fixture=item.stats["is_fixture"],
        product_version=item.stats["product_version"],
        sign_convention=item.stats["sign_convention"],
        reference=item.stats["reference"],
        reference_description=item.stats.get("reference_description"),
        measurement_component=item.stats.get("measurement_component", "los"),
        measurement_method=item.stats.get("measurement_method", "los"),
        time_precision=item.stats.get("time_precision", "day"),
        timeseries_available=item.stats.get("timeseries_available", item.stats["is_fixture"]),
        attribution=item.stats.get("attribution", ""),
        assets=[
            AssetInfo(
                id=a.id,
                role=a.role,
                media_type=a.media_type,
                checksum_sha256=a.checksum_sha256,
                size_bytes=a.size_bytes,
            )
            for a in assets
        ],
    )
