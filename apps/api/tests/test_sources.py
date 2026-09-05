import hashlib
from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from forudid_api.db import DataSource, SourceVersion, engine, session
from forudid_api.ingest import fetch_file
from forudid_api.main import app


def test_download_integrity_and_conflict(tmp_path):
    origin, output = tmp_path / "original", tmp_path / "download"
    origin.write_bytes(b"real byte integrity check")
    checksum = hashlib.md5(origin.read_bytes()).hexdigest()
    fetch_file(origin.as_uri(), output, origin.stat().st_size, checksum)
    fetch_file(origin.as_uri(), output, origin.stat().st_size, checksum)
    assert output.read_bytes() == origin.read_bytes()
    output.write_bytes(b"corrupt")
    with pytest.raises(ValueError, match="Existing source checksum mismatch"):
        fetch_file(origin.as_uri(), output, origin.stat().st_size, checksum)
    assert output.read_bytes() == b"corrupt"
    with pytest.raises(ValueError, match="checksum mismatch"):
        fetch_file(origin.as_uri(), tmp_path / "invalid", origin.stat().st_size, "0" * 32)
    assert not (tmp_path / "invalid").exists()
    interrupted = tmp_path / "sha-download.partial"
    interrupted.write_bytes(b"preserved partial source")
    downloaded = tmp_path / "sha-download"
    fetch_file(
        origin.as_uri(),
        downloaded,
        origin.stat().st_size,
        hashlib.sha256(origin.read_bytes()).hexdigest(),
        algorithm="sha256",
    )
    assert downloaded.read_bytes() == origin.read_bytes()
    assert interrupted.read_bytes() == b"preserved partial source"


def test_registry_pagination_privacy_and_database_immutability():
    # A rollback leaves no test sources or versions in the product catalog.
    with Session(engine()) as db:
        ids = sorted([uuid4(), uuid4(), uuid4()])
        for identity in ids:
            db.add(
                DataSource(
                    id=identity,
                    slug=str(identity),
                    name="test",
                    provider="test",
                    source_type="deformation",
                    homepage="https://example.org",
                    citation="test",
                    license_name="test",
                    license_url="https://example.org",
                    attribution="test",
                    access_method="test",
                    scientific_status="experimental",
                )
            )
        db.flush()
        version = SourceVersion(
            source_id=ids[0],
            version="test",
            downloaded_at=datetime.now(UTC),
            original_uri="https://example.org?credential=private",
            object_uri="s3://private/path",
            checksum_sha256="a" * 64,
            size_bytes=3_000_000_000,
            metadata_json={"secret": "private", "observation_years": [2014, 2020]},
        )
        db.add(version)
        db.flush()
        app.dependency_overrides[session] = lambda: db
        try:
            with TestClient(app) as client:
                page = client.get("/api/v1/sources", params={"limit": 1}).json()
                seen = []
                while True:
                    seen.extend(s["id"] for s in page["items"])
                    if page["next_cursor"] is None:
                        break
                    page = client.get(
                        "/api/v1/sources",
                        params={
                            "limit": 1,
                            "cursor": page["next_cursor"],
                        },
                    ).json()
                assert len(seen) == len(set(seen))
                assert set(map(str, ids)).issubset(seen)
                result = client.get(f"/api/v1/sources/{ids[0]}/versions")
                assert result.status_code == 200
                assert "private" not in result.text and "secret" not in result.text
                assert result.json()["items"][0]["size_bytes"] == 3_000_000_000
                assert client.get("/api/v1/sources?limit=101").status_code == 422
                assert client.get(f"/api/v1/sources/{uuid4()}/versions").status_code == 404
            for sql in (
                "UPDATE source_versions SET version='mutated' WHERE id=:id",
                "DELETE FROM source_versions WHERE id=:id",
            ):
                with pytest.raises(DBAPIError, match="immutable"), db.begin_nested():
                    db.execute(text(sql), {"id": version.id})
        finally:
            app.dependency_overrides.pop(session, None)
            db.rollback()
