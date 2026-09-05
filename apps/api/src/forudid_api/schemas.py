from datetime import datetime
from enum import StrEnum
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


class Kind(StrEnum):
    velocity_los = "velocity_los"
    temporal_coherence = "temporal_coherence"
    velocity_uncertainty = "velocity_uncertainty"
    valid_mask = "valid_mask"
    timeseries = "timeseries"
    velocity_vertical = "velocity_vertical"
    seasonal_amplitude = "seasonal_amplitude"


class Coordinate(BaseModel):
    lon: float = Field(ge=-180, le=180, allow_inf_nan=False)
    lat: float = Field(ge=-90, le=90, allow_inf_nan=False)


class Area(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    slug: str
    name_fa: str
    name_en: str
    bbox: list[float]
    active: bool


class ReferenceInfo(BaseModel):
    id: UUID
    coordinate: Coordinate
    method: str
    reason: str
    date: str


class AssetInfo(BaseModel):
    id: UUID
    role: str
    media_type: str
    checksum_sha256: str
    size_bytes: int


class ProductInfo(BaseModel):
    id: UUID
    processing_run_id: UUID
    source_version_id: UUID | None
    aoi_id: UUID
    aoi_slug: str
    kind: Kind
    orbit_direction: Literal["ascending", "descending"]
    relative_orbit: int | None
    start_date: str
    end_date: str
    last_acquisition: str | None
    unit: str
    crs: str
    resolution_metadata: dict[str, Any]
    processing_version: str
    product_version: str
    status: Literal["published"]
    is_fixture: bool
    sign_convention: str
    reference: ReferenceInfo | None
    reference_description: str | None
    measurement_component: str
    measurement_method: str
    time_precision: Literal["day", "year"]
    timeseries_available: bool
    attribution: str
    bbox: list[float]
    assets: list[AssetInfo]


class Legend(BaseModel):
    style: str
    label: str
    unit: str
    display_unit: str
    ticks: list[float]
    colors: list[str]
    sign_convention: str
    nodata: str
    masked: str


class Quantity(BaseModel):
    value: float | None
    unit: str


QualityStatus = Literal["valid", "caution", "invalid", "nodata"]


class Quality(BaseModel):
    quality: QualityStatus
    reasons: list[str]
    is_fixture: bool
    thresholds: dict[str, float | int | None]
    metrics: dict[str, Any]


class PointSummary(BaseModel):
    coordinate: Coordinate
    sampled_coordinate: Coordinate | None
    product_id: UUID
    run_id: UUID
    measurement: Quantity
    measurement_kind: Kind
    velocity_los: Quantity
    velocity_uncertainty: Quantity
    temporal_coherence: float | None
    observations: int | None
    orbit_direction: str
    relative_orbit: int | None
    start_date: str
    end_date: str
    last_acquisition: str | None
    processing_version: str
    reference: ReferenceInfo | None
    reference_description: str | None
    quality: QualityStatus
    quality_reasons: list[str]
    is_fixture: bool


class Epoch(BaseModel):
    date: str
    displacement: float | None
    uncertainty: float | None


class TimeSeries(BaseModel):
    coordinate: Coordinate
    run_id: UUID
    orbit_direction: str
    relative_orbit: int
    unit: Literal["m"]
    reference_date: str
    reference_point_id: UUID
    is_fixture: bool
    series: list[Epoch]


class RunInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    aoi_id: UUID
    pipeline_version: str
    processing_profile: str
    git_sha: str
    status: str
    config: dict[str, Any]
    started_at: datetime | None
    finished_at: datetime | None
