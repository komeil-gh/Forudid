"""Acquire the pinned, published Iran dataset without publishing unreviewed rasters."""

import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

RECORD = "https://zenodo.org/api/records/10815578"
FILES = {
    "rate": (38571343, "c0a19300c161940dc2e6a8de267cef4f"),
    "seasonal_amplitude": (34749648, "5e1f826223ffd53102ff0a9b8f21667b"),
    "mask": (1559304, "734c58f4f2f2fbc7017d705f9b81fe3d"),
}


def digest(path: Path, algorithm: str = "sha256") -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, algorithm).hexdigest()


def fetch_file(url: str, path: Path, size: int, md5: str) -> None:
    """Atomic verified download; a changed existing snapshot is never overwritten."""
    if path.exists():
        if path.stat().st_size != size or digest(path, "md5") != md5:
            raise ValueError(f"Existing source checksum mismatch: {path.name}")
        return
    partial = path.with_suffix(path.suffix + ".partial")
    with urlopen(url, timeout=60) as response, partial.open("wb") as target:
        total = 0
        while chunk := response.read(1024 * 1024):
            total += len(chunk)
            if total > size:
                raise ValueError("Source exceeds published size")
            target.write(chunk)
    if total != size or digest(partial, "md5") != md5:
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
