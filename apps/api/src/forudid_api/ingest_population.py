"""Verify and register the official WorldPop 2020 Iran population-count raster."""

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from urllib.request import urlopen
from uuid import NAMESPACE_URL, uuid5

import numpy as np
import rasterio
from rasterio.shutil import copy as raster_copy
from sqlalchemy.orm import Session

from forudid_api.config import settings
from forudid_api.db import DataSource, SourceVersion, engine
from forudid_api.ingest import digest, fetch_file
from forudid_api.publish_historical import json_bytes
from forudid_api.storage import put_file, put_immutable

SOURCE_URL = "https://hub.worldpop.org/geodata/summary?id=31792"
DOWNLOAD_URL = (
    "https://data.worldpop.org/GIS/Population/Global_2000_2020_1km/2020/IRN/"
    "irn_ppp_2020_1km_Aggregated.tif"
)
SOURCE_ID = uuid5(NAMESPACE_URL, SOURCE_URL)
VERSION = "2020-wpgp-31792"
VERSION_ID = uuid5(SOURCE_ID, VERSION)
SIZE = 10536072
SOURCE_SHA256 = "57b7d3a216822608bbc6e26ce64abc8ff5a965c67631023e865eaa886b35a71b"
ETAG = '"a0c488-5a8ac0a22c282"'


def acquire(directory: Path) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    metadata = directory / "provider-metadata.json"
    if not metadata.exists():
        with urlopen(
            "https://www.worldpop.org/rest/data/pop/wpic1km?iso3=IRN", timeout=60
        ) as response:
            records = json.loads(response.read(2_000_000))["data"]
        record = next((item for item in records if item["id"] == "31792"), None)
        if record is None:
            raise ValueError("Pinned WorldPop product is absent from the official registry")
        with metadata.open("xb") as output:
            output.write(json_bytes(record))
    fetch_file(
        DOWNLOAD_URL,
        directory / DOWNLOAD_URL.rsplit("/", 1)[-1],
        SIZE,
        SOURCE_SHA256,
        algorithm="sha256",
    )


def register(directory: Path) -> str:
    metadata = json.loads((directory / "provider-metadata.json").read_text())
    if (metadata["id"], metadata["popyear"], metadata["doi"]) != (
        "31792",
        "2020",
        "10.5258/SOTON/WP00670",
    ) or DOWNLOAD_URL not in metadata["files"]:
        raise ValueError("Unexpected WorldPop product, year, DOI or download URL")
    source = directory / DOWNLOAD_URL.rsplit("/", 1)[-1]
    if not source.exists():
        partial = source.with_suffix(".tif.partial")
        headers = (directory / "download-headers.txt").read_text().lower()
        if partial.stat().st_size != SIZE or f"etag: {ETAG}".lower() not in headers:
            raise ValueError("Population download is incomplete or its provider ETag changed")
        source.hardlink_to(partial)
        partial.unlink()
    if source.stat().st_size != SIZE:
        raise ValueError("Population source size differs from the official snapshot")
    checksum = digest(source)
    if checksum != SOURCE_SHA256:
        raise ValueError("Population file differs from the pinned official snapshot")
    existing_manifest = directory / "manifest.json"
    if (
        existing_manifest.exists()
        and json.loads(existing_manifest.read_text())["source_sha256"] != checksum
    ):
        raise ValueError("Local population source changed")
    normalized = directory / "population-count.cog.tif"
    with rasterio.Env(GDAL_CACHEMAX=32 * 1024 * 1024, GDAL_NUM_THREADS="1"):
        with rasterio.open(source) as original:
            if original.crs is None or original.crs.to_epsg() != 4326 or original.count != 1:
                raise ValueError("Expected the single-band WGS84 WorldPop count product")
            if original.transform.b or original.transform.d:
                raise ValueError("Population grid must be north-up")
            if not normalized.exists():
                pending = normalized.with_suffix(".partial.tif")
                raster_copy(
                    source,
                    pending,
                    driver="COG",
                    BLOCKSIZE=512,
                    COMPRESS="DEFLATE",
                    NUM_THREADS="1",
                    OVERVIEW_RESAMPLING="NEAREST",
                    BIGTIFF="IF_SAFER",
                )
                normalized.hardlink_to(pending)
                pending.unlink()
            total, valid_cells, zeros = 0.0, 0, 0
            maximum = 0.0
            with rasterio.open(normalized) as output:
                if (
                    output.crs != original.crs
                    or output.transform != original.transform
                    or output.shape != original.shape
                ):
                    raise ValueError("Normalized population grid changed")
                if output.tags(ns="IMAGE_STRUCTURE").get("LAYOUT") != "COG":
                    raise ValueError("Population output is not a COG")
                for row in range(0, original.height, 512):
                    for col in range(0, original.width, 512):
                        window = (
                            (row, min(row + 512, original.height)),
                            (col, min(col + 512, original.width)),
                        )
                        a = original.read(1, window=window, masked=True)
                        b = output.read(1, window=window, masked=True)
                        if not np.array_equal(a.data, b.data, equal_nan=True) or not np.array_equal(
                            np.ma.getmaskarray(a), np.ma.getmaskarray(b)
                        ):
                            raise ValueError("Population base pixels changed during normalization")
                        values = a.compressed()
                        if not np.isfinite(values).all() or (values < 0).any():
                            raise ValueError(
                                "Population contains negative or nonfinite valid counts"
                            )
                        total += float(values.sum(dtype=np.float64))
                        valid_cells += int(values.size)
                        zeros += int((values == 0).sum())
                        maximum = max(maximum, float(values.max(initial=0)))
            grid = {
                "crs": original.crs.to_string(),
                "shape": list(original.shape),
                "transform": list(original.transform)[:6],
                "bounds": list(original.bounds),
                "dtype": original.dtypes[0],
                "nodata": original.nodata,
            }
    normalized_sha = digest(normalized)
    manifest = {
        "provider": metadata,
        "source_sha256": checksum,
        "source_size_bytes": SIZE,
        "files": [
            {
                "role": "original",
                "name": source.name,
                "size_bytes": SIZE,
                "checksum_sha256": checksum,
            },
            {
                "role": "population_count",
                "name": normalized.name,
                "size_bytes": normalized.stat().st_size,
                "checksum_sha256": normalized_sha,
            },
        ],
        "provider_etag": ETAG,
        "provider_cryptographic_checksum": None,
        "population_year": 2020,
        "unit": "people/pixel",
        "un_adjusted": False,
        "license": "CC-BY-4.0",
        "license_url": "https://hub.worldpop.org/data/licence.txt",
        "grid": grid,
        "estimated_total": total,
        "valid_cells": valid_cells,
        "valid_zero_cells": zeros,
        "maximum_cell_count": maximum,
        "normalized_sha256": normalized_sha,
        "normalization": "lossless-base-pixels-cog-1",
        "overview_rule": "nearest; overviews are never used for population aggregation",
        "base_pixels_preserved": True,
        "is_fixture": False,
    }
    body = json_bytes(manifest)
    if existing_manifest.exists() and existing_manifest.read_bytes() != body:
        raise ValueError("Immutable population manifest conflict")
    if not existing_manifest.exists():
        existing_manifest.write_bytes(body)
    prefix = f"sources/worldpop-iran/{VERSION}"
    with Session(engine()) as db, db.begin():
        existing = db.get(SourceVersion, VERSION_ID)
        if existing is not None:
            if existing.checksum_sha256 != digest(existing_manifest):
                raise ValueError("Population source version conflict")
            return str(existing.id)
        put_file(f"{prefix}/{source.name}", source, "image/tiff")
        put_file(f"{prefix}/{normalized.name}", normalized, "image/tiff")
        put_immutable(f"{prefix}/manifest.json", body, "application/json")
        if db.get(DataSource, SOURCE_ID) is None:
            db.add(
                DataSource(
                    id=SOURCE_ID,
                    slug="worldpop-iran-2020-1km",
                    name=metadata["title"],
                    provider=metadata["source"],
                    source_type="population",
                    homepage=SOURCE_URL,
                    citation=metadata["citation"],
                    license_name="CC BY 4.0",
                    license_url="https://creativecommons.org/licenses/by/4.0/",
                    attribution="WorldPop and CIESIN (2018), doi:10.5258/SOTON/WP00670",
                    access_method="official_download",
                    scientific_status="published_dataset",
                )
            )
            db.flush()
        db.add(
            SourceVersion(
                id=VERSION_ID,
                source_id=SOURCE_ID,
                version=VERSION,
                data_date=None,
                valid_from=None,
                valid_to=None,
                downloaded_at=datetime.fromtimestamp(source.stat().st_mtime, UTC),
                original_uri=DOWNLOAD_URL,
                object_uri=f"s3://{settings().s3_bucket}/{prefix}/manifest.json",
                checksum_sha256=digest(existing_manifest),
                size_bytes=len(body),
                metadata_json={
                    "manifest": manifest,
                    "population_year": 2020,
                    "validation_status": "local_sha256_and_pixels_verified",
                    "normalized_object_key": f"{prefix}/{normalized.name}",
                },
            )
        )
    return str(VERSION_ID)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    directory = parser.parse_args().directory
    acquire(directory)
    print(register(directory))
