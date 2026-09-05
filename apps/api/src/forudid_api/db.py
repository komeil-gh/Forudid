from collections.abc import Generator
from datetime import UTC, date, datetime
from functools import lru_cache
from typing import Any
from uuid import UUID, uuid4

from geoalchemy2 import Geometry
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    String,
    UniqueConstraint,
    create_engine,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from forudid_api.config import settings


def now() -> datetime:
    return datetime.now(UTC)


class Base(DeclarativeBase):
    pass


class Record(Base):
    __abstract__ = True
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class AOI(Record):
    __tablename__ = "areas_of_interest"
    slug: Mapped[str] = mapped_column(unique=True)
    name_fa: Mapped[str]
    name_en: Mapped[str]
    geom = mapped_column(Geometry("MULTIPOLYGON", srid=4326))
    bbox: Mapped[list[float]] = mapped_column(JSONB)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class DataSource(Record):
    __tablename__ = "data_sources"
    __table_args__ = (
        CheckConstraint(
            "source_type IN ('deformation','infrastructure','population',"
            "'building','boundary','hydrogeology','other')",
            name="source_type",
        ),
        CheckConstraint(
            "scientific_status IN ('published_peer_reviewed','published_dataset',"
            "'provider_operational','experimental','unknown')",
            name="source_science",
        ),
    )
    slug: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str]
    provider: Mapped[str]
    source_type: Mapped[str]
    homepage: Mapped[str]
    citation: Mapped[str]
    license_name: Mapped[str]
    license_url: Mapped[str]
    attribution: Mapped[str]
    access_method: Mapped[str]
    scientific_status: Mapped[str]
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class SourceVersion(Record):
    __tablename__ = "source_versions"
    __table_args__ = (
        UniqueConstraint("source_id", "version", name="source_version_unique"),
        CheckConstraint("size_bytes >= 0", name="source_size_nonnegative"),
        CheckConstraint("checksum_sha256 ~ '^[0-9a-f]{64}$'", name="source_sha256"),
    )
    source_id: Mapped[UUID] = mapped_column(ForeignKey("data_sources.id"), index=True)
    version: Mapped[str]
    data_date: Mapped[date | None]
    valid_from: Mapped[date | None]
    valid_to: Mapped[date | None]
    downloaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    original_uri: Mapped[str]
    object_uri: Mapped[str]
    checksum_sha256: Mapped[str] = mapped_column(String(64))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    metadata_json: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB)


class InfrastructureAsset(Record):
    __tablename__ = "assets"
    __table_args__ = (
        UniqueConstraint("source_version_id", "external_id", "asset_type", name="asset_identity"),
        CheckConstraint("asset_type IN ('railway','road')", name="infrastructure_type"),
        CheckConstraint("length_m > 0", name="infrastructure_length"),
        CheckConstraint(
            "ST_IsValid(geom) AND NOT ST_IsEmpty(geom)", name="infrastructure_geometry"
        ),
    )
    source_version_id: Mapped[UUID] = mapped_column(ForeignKey("source_versions.id"), index=True)
    external_id: Mapped[str] = mapped_column(index=True)
    asset_type: Mapped[str] = mapped_column(index=True)
    asset_class: Mapped[str] = mapped_column(index=True)
    name: Mapped[str | None]
    geom = mapped_column(Geometry("LINESTRING", srid=4326), nullable=False)
    length_m: Mapped[float] = mapped_column(Float)
    properties: Mapped[dict[str, Any]] = mapped_column(JSONB)
    data_quality: Mapped[dict[str, Any]] = mapped_column(JSONB)


class Run(Record):
    __tablename__ = "processing_runs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('created','discovering','submitting','processing','downloading','mintpy',"
            "'qc','validation_required','publishing','published','failed','cancelled')",
            name="run_status",
        ),
    )
    aoi_id: Mapped[UUID] = mapped_column(ForeignKey("areas_of_interest.id"), index=True)
    pipeline_version: Mapped[str]
    git_sha: Mapped[str]
    processing_profile: Mapped[str]
    config: Mapped[dict[str, Any]] = mapped_column(JSONB)
    status: Mapped[str]
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    parent_run_id: Mapped[UUID | None] = mapped_column(ForeignKey("processing_runs.id"))
    log_uri: Mapped[str | None]
    error: Mapped[dict[str, Any] | None] = mapped_column(JSONB)


class Product(Record):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','validated','published','superseded')", name="product_status"
        ),
        CheckConstraint(
            "kind IN ('velocity_los','temporal_coherence','velocity_uncertainty',"
            "'valid_mask','timeseries','velocity_vertical','seasonal_amplitude')",
            name="product_kind",
        ),
        CheckConstraint("orbit_direction IN ('ascending','descending')", name="product_orbit"),
    )
    processing_run_id: Mapped[UUID] = mapped_column(ForeignKey("processing_runs.id"), index=True)
    source_version_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("source_versions.id"), index=True
    )
    aoi_id: Mapped[UUID] = mapped_column(ForeignKey("areas_of_interest.id"), index=True)
    kind: Mapped[str]
    orbit_direction: Mapped[str]
    relative_orbit: Mapped[int | None]
    start_date: Mapped[str]
    end_date: Mapped[str]
    unit: Mapped[str]
    crs: Mapped[str]
    resolution_metadata: Mapped[dict[str, Any]] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(index=True)
    processing_version: Mapped[str]
    stats: Mapped[dict[str, Any]] = mapped_column(JSONB)
    stac_item_id: Mapped[str]
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Asset(Record):
    __tablename__ = "product_assets"
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id"), index=True)
    role: Mapped[str]
    object_key: Mapped[str] = mapped_column(unique=True)
    media_type: Mapped[str]
    size_bytes: Mapped[int]
    checksum_sha256: Mapped[str] = mapped_column(String(64))
    etag: Mapped[str]


class Reference(Record):
    __tablename__ = "reference_points"
    processing_run_id: Mapped[UUID] = mapped_column(ForeignKey("processing_runs.id"), index=True)
    geom = mapped_column(Geometry("POINT", srid=4326))
    method: Mapped[str]
    reason: Mapped[str]
    selected_by: Mapped[str]
    stability_metrics: Mapped[dict[str, Any]] = mapped_column(JSONB)


class QCMetric(Record):
    __tablename__ = "qc_metrics"
    processing_run_id: Mapped[UUID] = mapped_column(ForeignKey("processing_runs.id"), index=True)
    product_id: Mapped[UUID | None] = mapped_column(ForeignKey("products.id"))
    metric_name: Mapped[str]
    value_number: Mapped[float | None]
    value_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    threshold: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    passed: Mapped[bool | None]


@lru_cache
def engine():
    return create_engine(settings().database_url.get_secret_value(), pool_pre_ping=True)


def session() -> Generator[Session]:
    with Session(engine()) as db:
        yield db
