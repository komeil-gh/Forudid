"""Archive and register the verified Zenodo snapshot; does not publish a product."""

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from forudid_api.config import settings
from forudid_api.db import DataSource, SourceVersion, engine
from forudid_api.ingest import FILES, RECORD, digest
from forudid_api.storage import put_file, s3

SLUG = "haghighi-motagh-2024"
VERSION = "1.0.0"
SOURCE_ID = uuid5(NAMESPACE_URL, "https://doi.org/10.5281/zenodo.10815577")
VERSION_ID = uuid5(SOURCE_ID, VERSION)


def register(directory: Path) -> str:
    manifest_path = directory / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    if (manifest["source"], manifest["version"], manifest["doi"], manifest["license"]) != (
        SLUG,
        VERSION,
        "10.5281/zenodo.10815578",
        "CC-BY-4.0",
    ):
        raise ValueError("Unexpected source manifest")
    if len(manifest["files"]) != len(FILES):
        raise ValueError("Source manifest must include all three rasters")
    verified = []
    for role, (size, md5) in FILES.items():
        name = f"Iran_subsidence_{role}_2014-2020_Sentinel-1_InSAR_desc_v1.0.0.tif"
        item = next(f for f in manifest["files"] if f["role"] == role)
        path = directory / name
        if (
            item["name"] != name
            or item["size_bytes"] != size
            or item["original_uri"] != f"{RECORD}/files/{name}/content"
            or path.stat().st_size != size
            or digest(path, "md5") != md5
            or digest(path) != item["checksum_sha256"]
        ):
            raise ValueError(f"Source integrity check failed: {name}")
        verified.append(path)
    checksum = digest(manifest_path)
    prefix = f"sources/{SLUG}/{VERSION}"
    with Session(engine()) as db, db.begin():
        existing = db.get(SourceVersion, VERSION_ID)
        if existing is not None:
            if existing.checksum_sha256 != checksum:
                raise ValueError("Immutable source version conflict")
            return str(existing.id)
        s3().head_bucket(Bucket=settings().s3_bucket)
        for path in verified:
            put_file(f"{prefix}/{path.name}", path, "image/tiff")
        put_file(f"{prefix}/manifest.json", manifest_path, "application/json")
        timestamp = datetime.now(UTC)
        db.execute(
            insert(DataSource)
            .values(
                id=SOURCE_ID,
                slug=SLUG,
                name="فرونشست ایران، مشاهدات سنتینل ۱ در بازهٔ ۲۰۱۴ تا ۲۰۲۰",
                provider="Mahmud Haghshenas Haghighi; Mahdi Motagh / Zenodo",
                source_type="deformation",
                homepage="https://zenodo.org/records/10815578",
                citation="Haghshenas Haghighi & Motagh (2024), Science Advances, "
                "10(19), eadk3039. doi:10.1126/sciadv.adk3039; "
                "Zenodo doi:10.5281/zenodo.10815578.",
                license_name="CC BY 4.0",
                license_url="https://creativecommons.org/licenses/by/4.0/",
                attribution="Haghshenas Haghighi and Motagh (2024). "
                "Contains modified Copernicus Sentinel data 2014–2020, processed by ESA.",
                access_method="official_versioned_download",
                scientific_status="published_peer_reviewed",
                created_at=timestamp,
                updated_at=timestamp,
            )
            .on_conflict_do_nothing(index_elements=[DataSource.id])
        )
        values = dict(
            id=VERSION_ID,
            source_id=SOURCE_ID,
            version=VERSION,
            downloaded_at=datetime.fromtimestamp(manifest_path.stat().st_mtime, UTC),
            # Source gives years only: do not invent exact first/last acquisition dates.
            data_date=None,
            valid_from=None,
            valid_to=None,
            original_uri="https://doi.org/10.5281/zenodo.10815578",
            object_uri=f"s3://{settings().s3_bucket}/{prefix}/manifest.json",
            checksum_sha256=checksum,
            size_bytes=manifest_path.stat().st_size,
            metadata_json={
                "manifest": manifest,
                "observation_years": [2014, 2020],
                "component": "vertical",
                "method": "descending_los_projection",
                "publication_status": "not_published",
                "validation_status": "checksum_verified",
            },
            created_at=timestamp,
        )
        db.execute(
            insert(SourceVersion)
            .values(**values)
            .on_conflict_do_nothing(index_elements=[SourceVersion.source_id, SourceVersion.version])
        )
        stored = db.get(SourceVersion, VERSION_ID)
        if stored is None or stored.checksum_sha256 != checksum:
            raise ValueError("Immutable source version conflict")
    return str(VERSION_ID)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    print(register(parser.parse_args().directory))
