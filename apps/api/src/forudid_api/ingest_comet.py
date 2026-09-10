"""Repeat the reviewed COMET acquisition without replacing published measurements."""

import fcntl
import json
from datetime import UTC, datetime
from pathlib import Path
from urllib.request import Request, urlopen
from uuid import uuid4

from forudid_api.ingest import digest, fetch_file
from forudid_api.prepare_comet import SOURCE_SHA, SOURCE_URL, prepare

FILENAME = SOURCE_URL.rsplit("/", 1)[-1]
SIZE = 513816102
LAST_MODIFIED = "Thu, 13 Aug 2026 17:06:10 GMT"


def check_source(directory: Path) -> dict:
    """Record live metadata separately from local byte verification, including failures."""
    directory.mkdir(parents=True, exist_ok=True)
    result = {
        "checked_at": datetime.now(UTC).isoformat(),
        "source_url": SOURCE_URL,
        "reviewed_sha256": SOURCE_SHA,
        "status": "failed",
        "remote_bytes_verified": False,
    }
    checks = directory / "checks"
    checks.mkdir(exist_ok=True)
    try:
        with urlopen(Request(SOURCE_URL, method="HEAD"), timeout=60) as response:
            length = response.headers.get("Content-Length")
            modified = response.headers.get("Last-Modified")
            result.update(
                http_status=response.status,
                content_length=int(length) if length is not None else None,
                last_modified=modified,
                etag=response.headers.get("ETag"),
            )
            result["status"] = (
                "metadata_matches_reviewed_snapshot"
                if response.status == 200 and length == str(SIZE) and modified == LAST_MODIFIED
                else "review_required"
            )
        source = directory / FILENAME
        result["local_bytes_verified"] = (
            source.exists() and source.stat().st_size == SIZE and digest(source) == SOURCE_SHA
        )
        return result
    except Exception as error:
        result["status"] = "failed"
        result["error_type"] = type(error).__name__
        raise
    finally:
        with (checks / f"{uuid4()}.json").open("x") as stream:
            json.dump(result, stream, indent=2, sort_keys=True)
            stream.write("\n")


def ingest(directory: Path, normalized: Path) -> str:
    from forudid_api.publish_comet import publish

    directory.mkdir(parents=True, exist_ok=True)
    normalized.parent.mkdir(parents=True, exist_ok=True)
    with (directory / ".ingest.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise ValueError("COMET ingestion already active for this directory") from error
        check = check_source(directory)
        if check["status"] != "metadata_matches_reviewed_snapshot":
            raise ValueError("COMET source metadata changed or is incomplete; review required")
        source = directory / FILENAME
        fetch_file(SOURCE_URL, source, SIZE, SOURCE_SHA, algorithm="sha256")
        if not normalized.exists():
            # Failed conversions stay inspectable; a retry starts a separate attempt.
            attempt = normalized.with_name(f".{normalized.name}.{uuid4()}.partial")
            prepare(source, attempt)
            attempt.rename(normalized)
        return publish(source, normalized)
