"""Acquire the pinned, published Iran dataset without publishing unreviewed rasters."""

import argparse
import fcntl
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen
from uuid import uuid4

RECORD = "https://zenodo.org/api/records/10815578"
FILES = {
    "rate": (38571343, "c0a19300c161940dc2e6a8de267cef4f"),
    "seasonal_amplitude": (34749648, "5e1f826223ffd53102ff0a9b8f21667b"),
    "mask": (1559304, "734c58f4f2f2fbc7017d705f9b81fe3d"),
}


def digest(path: Path, algorithm: str = "sha256") -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, algorithm).hexdigest()


def fetch_file(url: str, path: Path, size: int, checksum: str, *, algorithm: str = "md5") -> None:
    """Resume pinned HTTP bytes; only a complete checksum match becomes a source."""
    if size <= 0 or algorithm not in ("md5", "sha256") or (
        len(checksum) != hashlib.new(algorithm).digest_size * 2
        or any(c not in "0123456789abcdef" for c in checksum)
    ):
        raise ValueError("Expected a positive source size and a lowercase pinned checksum")
    # The checksum scopes resumable bytes; unrelated legacy partials remain untouched.
    partial = path.with_name(f"{path.name}.{algorithm}-{checksum}.partial")
    with partial.with_suffix(".lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise ValueError(f"Source download already active: {path.name}") from error
        _fetch_file(url, path, partial, size, checksum, algorithm)


def _fetch_file(url: str, path: Path, partial: Path, size: int, checksum: str, algorithm: str):
    if path.exists():
        if path.stat().st_size != size or digest(path, algorithm) != checksum:
            raise ValueError(f"Existing source checksum mismatch: {path.name}")
        return
    if partial.exists():
        if partial.stat().st_size == size and digest(partial, algorithm) == checksum:
            path.hardlink_to(partial)
            partial.unlink()
            return
        if partial.stat().st_size >= size:
            partial.rename(partial.with_name(f"{partial.name}.{uuid4().hex}.rejected"))
    offset = partial.stat().st_size if partial.exists() else 0
    headers = {"Accept-Encoding": "identity"}
    if offset and url.startswith(("https://", "http://")):
        headers["Range"] = f"bytes={offset}-"
    with urlopen(Request(url, headers=headers), timeout=60) as response:
        if response.headers.get("Content-Encoding", "identity") != "identity":
            raise ValueError("Encoded response cannot preserve source byte offsets")
        if response.status == 206:
            expected_range = f"bytes {offset}-{size - 1}/{size}"
            if not offset or response.headers.get("Content-Range") != expected_range:
                raise ValueError("Unexpected source Content-Range; partial bytes retained")
        elif response.status in (200, None):
            # A server may ignore Range. Preserve the attempt before starting from zero.
            if offset:
                partial.rename(partial.with_name(f"{partial.name}.{uuid4().hex}.superseded"))
            offset = 0
        else:
            raise ValueError(f"Unexpected source response: {response.status}")
        length = response.headers.get("Content-Length")
        if length is not None and int(length) != size - offset:
            raise ValueError("Source size changed; review the pinned version")
        total = offset
        with partial.open("ab") as target:
            while chunk := response.read(1024 * 1024):
                total += len(chunk)
                if total > size:
                    raise ValueError("Source exceeds published size")
                target.write(chunk)
    if total != size or digest(partial, algorithm) != checksum:
        raise ValueError(f"Downloaded source checksum mismatch: {path.name}")
    # Exclusive creation also protects against a concurrent ingestion.
    path.hardlink_to(partial)
    partial.unlink()


def acquire(directory: Path) -> dict:
    directory.mkdir(parents=True, exist_ok=True)
    with urlopen(RECORD, timeout=60) as response:
        record = json.load(response)
    if record["metadata"]["doi"] != "10.5281/zenodo.10815578":
        raise ValueError("Unexpected dataset DOI")
    if record["metadata"]["license"]["id"] != "cc-by-4.0":
        raise ValueError("Source license changed; review required")
    entries = []
    for role, (size, md5) in FILES.items():
        name = f"Iran_subsidence_{role}_2014-2020_Sentinel-1_InSAR_desc_v1.0.0.tif"
        item = next(f for f in record["files"] if f["key"] == name)
        url = f"{RECORD}/files/{name}/content"
        if item["size"] != size or item["checksum"] != f"md5:{md5}":
            raise ValueError(f"Published source changed: {name}")
        path = directory / name
        fetch_file(url, path, size, md5)
        entries.append(
            {
                "role": role,
                "name": name,
                "original_uri": url,
                "size_bytes": size,
                "checksum_sha256": digest(path),
                "provider_checksum": f"md5:{md5}",
            }
        )
        print(f"Verified {name}", flush=True)
    manifest = {
        "source": "haghighi-motagh-2024",
        "version": "1.0.0",
        "doi": "10.5281/zenodo.10815578",
        "license": "CC-BY-4.0",
        "files": entries,
    }
    body = json.dumps(manifest, sort_keys=True, indent=2).encode() + b"\n"
    path = directory / "manifest.json"
    if path.exists():
        if path.read_bytes() != body:
            raise ValueError("Immutable manifest conflict")
    else:
        with path.open("xb") as target:
            target.write(body)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    acquire(args.directory)


if __name__ == "__main__":
    main()
