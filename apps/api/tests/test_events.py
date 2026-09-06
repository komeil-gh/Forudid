import os
from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest

pytestmark = pytest.mark.skipif(
    not os.environ.get("FORUDID_EVENT_TESTS"), reason="Requires the local event migration"
)


def test_event_revisions_visibility_lineage_and_rollback():
    from fastapi.testclient import TestClient
    from sqlalchemy import select, text
    from sqlalchemy.exc import DBAPIError
    from sqlalchemy.orm import Session

    from forudid_api.db import (
        DeformationEvent,
        EventEvidence,
        EventObservation,
        EventRevision,
        Product,
        engine,
        session,
    )
    from forudid_api.events import EventSnapshot, append_revision
    from forudid_api.main import app

    # These numerical/event fixtures are visible only inside this uncommitted test transaction.
    with Session(engine()) as db:
        try:
            product = db.get(Product, UUID("744b6536-b9a7-56c5-85b1-66a629a78b91"))
            assert product
            value = EventSnapshot(
                event_key=f"test-{uuid4()}",
                event_type="test_observation",
                status="candidate",
                geometry={
                    "type": "MultiPolygon",
                    "coordinates": [
                        [[[51, 35], [51.01, 35], [51.01, 35.01], [51, 35.01], [51, 35]]]
                    ],
                },
                first_detected_at=datetime(2026, 9, 6, tzinfo=UTC),
                last_observed_at=datetime(2020, 1, 1, tzinfo=UTC),
                dominant_component="vertical",
                source_processing_run_id=product.processing_run_id,
                reason="Transaction-isolated test",
                actor="test",
                detector_version="test-1",
                association_version="test-1",
                parameters={},
            )
            event = append_revision(db, value)
            assert event.revision_number == 1
            assert append_revision(db, value).revision_number == 1
            with pytest.raises(ValueError, match="revision"):
                append_revision(
                    db, value.model_copy(update={"status": "under_review"}), expected_revision=0
                )
            event = append_revision(
                db, value.model_copy(update={"status": "under_review"}), expected_revision=1
            )
            assert event.revision_number == 2
            revisions = db.scalars(
                select(EventRevision).where(EventRevision.event_id == event.id)
            ).all()
            assert len(revisions) == 2 and revisions[0].metrics["status"] == "candidate"
            with pytest.raises(DBAPIError), db.begin_nested():
                db.execute(
                    text("UPDATE event_revisions SET reason='changed' WHERE event_id=:id"),
                    {"id": event.id},
                )
            with pytest.raises(DBAPIError), db.begin_nested():
                db.execute(text("DELETE FROM deformation_events WHERE id=:id"), {"id": event.id})
            observation = EventObservation(
                event_id=event.id,
                observation_key="test-observation",
                product_id=product.id,
                source_version_id=product.source_version_id,
                interval_start=datetime(2019, 1, 1, tzinfo=UTC),
                interval_end=datetime(2020, 1, 1, tzinfo=UTC),
                available_at=datetime(2024, 1, 1, tzinfo=UTC),
                sensor_family="sentinel1",
                component="vertical",
                measurement_method="single_track_vertical_projection",
                maturity="unknown",
                raw_acquisition_ids=["test-raw-acquisition"],
                quality={"test_only": True},
                metrics={},
            )
            db.add(observation)
            db.flush()
            for key, supports in (("support", True), ("contradiction", False)):
                db.add(
                    EventEvidence(
                        event_id=event.id,
                        evidence_key=key,
                        evidence_type="sentinel1",
                        source_version_id=product.source_version_id,
                        observation_id=observation.id,
                        supports_event=supports,
                        contradicts_event=not supports,
                        independence_group="same-raw-acquisition",
                        quality={},
                        summary=key,
                        metadata_json={},
                    )
                )
            db.flush()
            app.dependency_overrides[session] = lambda: db
            client = TestClient(app)
            assert client.get(f"/api/v1/events/{event.id}").status_code == 404
            # Publication is an internal test operation; no public mutation endpoint exists.
            event = append_revision(
                db,
                value.model_copy(update={"status": "under_review", "publication": "published"}),
                expected_revision=2,
            )
            detail = client.get(f"/api/v1/events/{event.id}")
            assert detail.status_code == 200, detail.text
            assert detail.json()["event"]["confidence_grade"] == "U"
            observed = client.get(f"/api/v1/events/{event.id}/observations").json()["items"][0]
            assert observed["raw_acquisition_ids"] == ["test-raw-acquisition"]
            assert observed["maturity"] == "unknown"
            evidence = client.get(f"/api/v1/events/{event.id}/evidence").json()
            assert len(evidence["items"]) == 2
            assert {item["supports_event"] for item in evidence["items"]} == {True, False}
            assert len({item["independence_group"] for item in evidence["items"]}) == 1
            assert (
                client.get(f"/api/v1/events/{event.id}/timeline").json()["items"][0][
                    "revision_number"
                ]
                == 1
            )
            event = append_revision(
                db,
                value.model_copy(update={"status": "artifact", "publication": "withdrawn"}),
                expected_revision=3,
            )
            assert client.get(f"/api/v1/events/{event.id}").status_code == 404
            assert db.get(DeformationEvent, event.id).status == "artifact"
            db.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))
        finally:
            app.dependency_overrides.pop(session, None)
            db.rollback()
