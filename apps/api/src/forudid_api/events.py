"""Versioned event records; read requests never detect or publish events."""

import hashlib
import json
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from geoalchemy2.shape import from_shape
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator
from pyproj import Geod
from shapely.geometry import MultiPolygon, shape
from shapely.geometry.polygon import orient
from sqlalchemy import exists, func, or_, select, text
from sqlalchemy.orm import Session

from forudid_api.catalog import missing
from forudid_api.db import (
    DeformationEvent,
    EventEvidence,
    EventObservation,
    EventRevision,
    Product,
    Run,
    now,
    session,
)
from forudid_api.publish_historical import NOTE, json_bytes
from forudid_api.regions import MultiPolygonGeometry

Lifecycle = Literal[
    "candidate",
    "under_review",
    "corroborated",
    "monitoring",
    "escalated",
    "stable",
    "resolved",
    "seasonal",
    "artifact",
    "rejected",
]
Component = Literal["los", "vertical", "east_west", "north_south", "three_dimensional"]
router = APIRouter(prefix="/api/v1/events", tags=["events"])
DB = Annotated[Session, Depends(session)]


class EventSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    event_key: str = Field(min_length=1, max_length=200)
    event_type: str = Field(min_length=1, max_length=80)
    geometry: MultiPolygonGeometry
    status: Lifecycle = "candidate"
    publication: Literal["draft", "published", "withdrawn"] = "draft"
    first_detected_at: AwareDatetime
    estimated_onset_at: AwareDatetime | None = None
    last_observed_at: AwareDatetime
    current_velocity: float | None = None
    previous_velocity: float | None = None
    acceleration_metric: float | None = None
    growth_rate: float | None = None
    dominant_component: Component
    source_processing_run_id: UUID
    reason: str = Field(min_length=1, max_length=2000)
    actor: str = Field(min_length=1, max_length=200)
    detector_version: str = Field(min_length=1, max_length=100)
    association_version: str = Field(min_length=1, max_length=100)
    parameters: dict[str, Any]

    @model_validator(mode="after")
    def valid_snapshot(self):
        geometry = shape(self.geometry.model_dump())
        if geometry.is_empty or not geometry.is_valid:
            raise ValueError("Event geometry must be a valid nonempty MultiPolygon")
        west, south, east, north = geometry.bounds
        if not (-180 <= west <= east <= 180 and -90 <= south <= north <= 90):
            raise ValueError("Event geometry must use WGS84 longitude/latitude")
        if self.estimated_onset_at and self.estimated_onset_at > self.last_observed_at:
            raise ValueError("Estimated onset cannot follow the latest observation")
        if len(json_bytes(self.parameters)) > 65536:
            raise ValueError("Event parameters exceed 64 KiB")
        return self


def append_revision(
    db: Session, snapshot: EventSnapshot, *, expected_revision=None, is_fixture=False
):
    """Internal transaction operation: caller commits; same input is idempotent."""
    value = snapshot.model_dump(mode="json")
    checksum = hashlib.sha256(json_bytes(value)).hexdigest()
    db.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))"),
        {"key": "forudid:event:" + snapshot.event_key},
    )
    event = db.scalar(
        select(DeformationEvent)
        .where(DeformationEvent.event_key == snapshot.event_key)
        .with_for_update()
    )
    if event:
        if is_fixture != event.is_fixture:
            raise ValueError("Cannot change an event's fixture identity")
        current = db.scalar(
            select(EventRevision).where(
                EventRevision.event_id == event.id,
                EventRevision.revision_number == event.revision_number,
            )
        )
        if current and current.input_sha256 == checksum:
            return event
        if expected_revision != event.revision_number:
            raise ValueError("Event revision changed; reload before updating")
        if snapshot.first_detected_at != event.first_detected_at:
            raise ValueError("First detection time is immutable")
        event.revision_number += 1
    else:
        if expected_revision not in (None, 0):
            raise ValueError("Initial event revision must be zero")
        event = DeformationEvent(
            event_key=snapshot.event_key, revision_number=1, is_fixture=is_fixture
        )
        db.add(event)
    geometry = shape(value["geometry"])
    if not isinstance(geometry, MultiPolygon):
        raise ValueError("Event geometry must be a MultiPolygon")
    geod = Geod(ellps="WGS84")
    area = sum(abs(geod.geometry_area_perimeter(orient(polygon))[0]) for polygon in geometry.geoms)
    for field in (
        "event_type",
        "status",
        "publication",
        "first_detected_at",
        "estimated_onset_at",
        "last_observed_at",
        "current_velocity",
        "previous_velocity",
        "acceleration_metric",
        "growth_rate",
        "dominant_component",
    ):
        setattr(event, field, getattr(snapshot, field))
    event.geom = from_shape(geometry, srid=4326)
    event.area_current, event.area_max = area, max(event.area_max or 0, area)
    event.updated_at = now()
    event.confidence_grade, event.scientific_status = "U", "experimental"
    event.severity_screening_class = None
    db.flush()
    provenance = {
        key: value[key] for key in ("detector_version", "association_version", "parameters")
    }
    metrics = {
        key: value[key]
        for key in (
            "status",
            "publication",
            "first_detected_at",
            "estimated_onset_at",
            "last_observed_at",
            "current_velocity",
            "previous_velocity",
            "acceleration_metric",
            "growth_rate",
            "dominant_component",
        )
    }
    metrics.update(
        area_current=area,
        area_max=event.area_max,
        confidence_grade="U",
        scientific_status="experimental",
        velocity_unit="mm/year",
        area_unit="m2",
    )
    db.add(
        EventRevision(
            event_id=event.id,
            revision_number=event.revision_number,
            geom=from_shape(geometry, srid=4326),
            metrics=metrics,
            reason=snapshot.reason,
            actor=snapshot.actor,
            source_processing_run_id=snapshot.source_processing_run_id,
            provenance=provenance,
            input_sha256=checksum,
        )
    )
    db.flush()
    return event


class EventInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    event_key: str
    event_type: str
    status: Lifecycle
    revision_number: int
    first_detected_at: AwareDatetime
    estimated_onset_at: AwareDatetime | None
    last_observed_at: AwareDatetime
    current_velocity: float | None
    previous_velocity: float | None
    acceleration_metric: float | None
    area_current: float
    area_max: float
    growth_rate: float | None
    dominant_component: Component
    confidence_grade: Literal["A", "B", "C", "D", "U"]
    scientific_status: str
    severity_screening_class: str | None
    updated_at: AwareDatetime
    velocity_unit: Literal["mm/year"] = "mm/year"
    area_unit: Literal["m2"] = "m2"


class EventPage(BaseModel):
    items: list[EventInfo]
    next_cursor: UUID | None
    disclaimer: str = NOTE


def public_events():
    observations = select(EventObservation.id).where(
        EventObservation.event_id == DeformationEvent.id
    )
    unavailable = (
        observations.join(Product, Product.id == EventObservation.product_id)
        .join(Run, Run.id == Product.processing_run_id)
        .where(
            or_(
                Product.status != "published",
                Run.status != "published",
                Product.stats["is_fixture"].as_boolean().is_(True),
            )
        )
    )
    return select(DeformationEvent).where(
        DeformationEvent.publication == "published",
        DeformationEvent.is_fixture.is_(False),
        exists(observations),
        ~exists(unavailable),
    )


def public_event(db, event_id):
    event = db.scalar(public_events().where(DeformationEvent.id == event_id))
    if event is None:
        raise missing("EVENT_NOT_FOUND")
    return event


@router.get("", response_model=EventPage, operation_id="listEvents")
def list_events(
    db: DB,
    cursor: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    status: Lifecycle | None = None,
):
    query = public_events().order_by(DeformationEvent.id).limit(limit + 1)
    if cursor:
        query = query.where(DeformationEvent.id > cursor)
    if status:
        query = query.where(DeformationEvent.status == status)
    rows = db.scalars(query).all()
    return EventPage(
        items=[EventInfo.model_validate(row) for row in rows[:limit]],
        next_cursor=rows[limit - 1].id if len(rows) > limit else None,
    )


class EventDetail(BaseModel):
    event: EventInfo
    geometry: MultiPolygonGeometry
    disclaimer: str = NOTE


@router.get("/{event_id}", response_model=EventDetail, operation_id="getEvent")
def get_event(event_id: UUID, db: DB):
    event = public_event(db, event_id)
    geometry = db.scalar(
        select(func.ST_AsGeoJSON(DeformationEvent.geom)).where(DeformationEvent.id == event_id)
    )
    if geometry is None:
        raise missing("EVENT_GEOMETRY_NOT_FOUND")
    return EventDetail(event=EventInfo.model_validate(event), geometry=json.loads(geometry))


class RevisionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    revision_number: int
    metrics: dict[str, Any]
    reason: str
    source_processing_run_id: UUID
    provenance: dict[str, Any]
    input_sha256: str
    created_at: AwareDatetime


class RevisionPage(BaseModel):
    items: list[RevisionInfo]
    next_revision: int | None


@router.get("/{event_id}/timeline", response_model=RevisionPage, operation_id="getEventTimeline")
def timeline(
    event_id: UUID,
    db: DB,
    after: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    public_event(db, event_id)
    rows = db.scalars(
        select(EventRevision)
        .where(EventRevision.event_id == event_id, EventRevision.revision_number > after)
        .order_by(EventRevision.revision_number)
        .limit(limit + 1)
    ).all()
    return RevisionPage(
        items=[RevisionInfo.model_validate(row) for row in rows[:limit]],
        next_revision=rows[limit - 1].revision_number if len(rows) > limit else None,
    )


class EvidenceInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    evidence_type: str
    source_version_id: UUID
    observation_id: UUID | None
    supersedes_id: UUID | None
    supports_event: bool
    contradicts_event: bool
    independence_group: str
    quality: dict[str, Any]
    summary: str
    created_at: AwareDatetime


class EvidencePage(BaseModel):
    items: list[EvidenceInfo]
    next_cursor: UUID | None


class ObservationInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    product_id: UUID
    source_version_id: UUID
    interval_start: AwareDatetime
    interval_end: AwareDatetime
    available_at: AwareDatetime
    sensor_family: str
    component: Component
    measurement_method: str
    maturity: Literal["beta", "provisional", "validated", "unknown"]
    raw_acquisition_ids: list[str]
    velocity: float | None
    displacement: float | None
    acceleration: float | None
    area: float | None
    coverage: float | None
    uncertainty: float | None
    quality: dict[str, Any]
    metrics: dict[str, Any]


class ObservationPage(BaseModel):
    items: list[ObservationInfo]
    next_cursor: UUID | None


@router.get(
    "/{event_id}/observations", response_model=ObservationPage, operation_id="getEventObservations"
)
def observations(
    event_id: UUID,
    db: DB,
    cursor: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    public_event(db, event_id)
    query = (
        select(EventObservation)
        .where(EventObservation.event_id == event_id)
        .order_by(EventObservation.id)
    )
    if cursor:
        query = query.where(EventObservation.id > cursor)
    rows = db.scalars(query.limit(limit + 1)).all()
    return ObservationPage(
        items=[ObservationInfo.model_validate(row) for row in rows[:limit]],
        next_cursor=rows[limit - 1].id if len(rows) > limit else None,
    )


@router.get("/{event_id}/evidence", response_model=EvidencePage, operation_id="getEventEvidence")
def evidence(
    event_id: UUID,
    db: DB,
    cursor: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    public_event(db, event_id)
    query = (
        select(EventEvidence).where(EventEvidence.event_id == event_id).order_by(EventEvidence.id)
    )
    if cursor:
        query = query.where(EventEvidence.id > cursor)
    rows = db.scalars(query.limit(limit + 1)).all()
    return EvidencePage(
        items=[EvidenceInfo.model_validate(row) for row in rows[:limit]],
        next_cursor=rows[limit - 1].id if len(rows) > limit else None,
    )
