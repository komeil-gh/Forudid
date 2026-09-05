"""Publish a verified historical snapshot with its true measurement semantics."""

import argparse
import json
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid5

import pystac
import rasterio
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from forudid_api.config import settings
from forudid_api.db import AOI, Asset, DataSource, Product, QCMetric, Run, SourceVersion, engine
from forudid_api.ingest import digest
from forudid_api.normalize import PIPELINE, verify_cog
from forudid_api.register_source import SOURCE_ID, VERSION_ID
from forudid_api.storage import put_file, put_immutable

REFERENCE = "سطح تصحیح مکانیِ پژوهش اصلی؛ یک نقطهٔ مرجع یکتا برای موزاییک سراسری تعریف نشده است."
SIGN = (
    "مقدار مثبت، اندازهٔ فرونشست قائم برآوردشده است؛ "
    "تبدیل راستای دید نزولی با فرض ناچیزبودن حرکت افقی."
)
NOTE = (
    "FORUDID یک ابزار پایش و غربالگری مکانی است و جایگزین ارزیابی ژئوتکنیکی، "
    "سازه‌ای، نقشه‌برداری زمینی یا بازدید میدانی نیست."
)


def json_bytes(document) -> bytes:
    return json.dumps(document, ensure_ascii=False, sort_keys=True, allow_nan=False).encode()


def publish(source: Path, directory: Path) -> str:
    report_path = directory / "normalization.json"
    report = json.loads(report_path.read_text())
    manifest = json.loads((source / "manifest.json").read_text())
    if (
        report["pipeline"] != PIPELINE
        or digest(source / "manifest.json") != report["source_sha256"]
    ):
        raise ValueError("Unexpected normalization source or pipeline")
    artifacts = {a["role"]: a for a in report["artifacts"]}
    with rasterio.Env(GDAL_CACHEMAX=32 * 1024 * 1024, GDAL_NUM_THREADS="1"):
        for item in manifest["files"]:
            original = source / item["name"]
            artifact = artifacts[item["role"]]
            output = directory / artifact["name"]
            if (
                digest(original) != item["checksum_sha256"]
                or digest(output) != artifact["checksum_sha256"]
            ):
                raise ValueError("Publication input checksum mismatch")
            verify_cog(original, output)
    signature = digest(report_path)
    run_id = uuid5(VERSION_ID, f"{PIPELINE}/{signature}")
    cfg = settings()
    prefix = f"historical/iran/{run_id}"
    started = datetime.now(UTC)
    with Session(engine()) as db, db.begin():
        db.execute(text("SELECT pg_advisory_xact_lock(702316)"))
        version = db.get(SourceVersion, VERSION_ID)
        provider = db.get(DataSource, SOURCE_ID)
        if (
            version is None
            or provider is None
            or version.checksum_sha256 != report["source_sha256"]
        ):
            raise ValueError("Register the verified original source first")
        existing = db.get(Run, run_id)
        if existing is not None:
            if (
                existing.config.get("normalization_sha256") != signature
                or existing.status != "published"
            ):
                raise ValueError("Historical publication conflict")
            return str(run_id)
        bbox = report["bounds"]
        west, south, east, north = bbox
        ring = [[west, south], [east, south], [east, north], [west, north], [west, south]]
        area = db.scalar(select(AOI).where(AOI.slug == "iran"))
        if area is None:
            area = AOI(
                id=uuid5(SOURCE_ID, "iran-grid"),
                slug="iran",
                name_fa="ایران؛ مجموعهٔ تاریخی",
                name_en="Iran historical source footprint",
                bbox=bbox,
                geom=f"SRID=4326;MULTIPOLYGON((({west} {south},{east} {south},"
                f"{east} {north},{west} {north},{west} {south})))",
            )
            db.add(area)
            db.flush()
        elif area.bbox != bbox:
            raise ValueError("Existing AOI has a different footprint")
        git_sha = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
        run = Run(
            id=run_id,
            aoi_id=area.id,
            pipeline_version=PIPELINE,
            git_sha=git_sha,
            processing_profile="published-source-cog-normalization",
            config={
                "is_fixture": False,
                "source_version_id": str(VERSION_ID),
                "normalization_sha256": signature,
                "measurement_method": "descending_los_projection",
            },
            status="publishing",
            started_at=started,
        )
        db.add(run)
        db.flush()
        quality = {
            "quality": "caution",
            "is_fixture": False,
            "thresholds": {},
            "reasons": [
                "مجموعهٔ تاریخی ۲۰۱۴ تا ۲۰۲۰؛ وضعیت کنونی زمین را نشان نمی‌دهد.",
                "عدم‌قطعیت پیکسلی و سری زمانی در این مجموعه ارائه نشده است.",
                "مقادیر خارج از پوشش، فاقد داده‌اند و نشانهٔ پایداری زمین نیستند.",
            ],
            "metrics": {
                "valid_pixels": report["valid_pixels"],
                "valid_zero_pixels": report["valid_zero_pixels"],
                "base_pixels_match_originals": True,
                "independent_scientific_validation": False,
            },
        }
        db.add(
            QCMetric(
                processing_run_id=run_id,
                metric_name="source_pixel_preservation",
                value_json=quality["metrics"],
                passed=True,
            )
        )
        start, end = (
            datetime(2014, 1, 1, tzinfo=UTC),
            datetime(2020, 12, 31, 23, 59, 59, tzinfo=UTC),
        )
        collection = pystac.Collection(
            id=f"iran-historical-{run_id}",
            description=provider.citation,
            extent=pystac.Extent(
                pystac.SpatialExtent([bbox]), pystac.TemporalExtent([[start, end]])
            ),
            license="CC-BY-4.0",
        )
        collection.set_self_href(f"s3://{cfg.s3_bucket}/{prefix}/collection.json")
        put_file(f"{prefix}/normalization.json", report_path, "application/json")
        put_file(f"{prefix}/mask.tif", directory / artifacts["mask"]["name"], "image/tiff")
        publisher = Path(__file__)
        put_file(f"{prefix}/publisher.py", publisher, "text/x-python")
        for kind, role, unit in (
            ("velocity_vertical", "rate", "cm/year"),
            ("seasonal_amplitude", "seasonal_amplitude", "cm"),
        ):
            identity = uuid5(run_id, kind)
            sign = (
                SIGN
                if role == "rate"
                else "دامنهٔ قله‌تا‌قلهٔ فصلی؛ کمیتی نامنفی در مؤلفهٔ قائم برآوردشده."
            )
            item = Product(
                id=identity,
                processing_run_id=run_id,
                source_version_id=VERSION_ID,
                aoi_id=area.id,
                kind=kind,
                orbit_direction="descending",
                relative_orbit=None,
                start_date="2014",
                end_date="2020",
                unit=unit,
                crs=report["crs"],
                resolution_metadata={
                    "shape": report["shape"],
                    "transform": report["transform"],
                    "pixel_size_degrees": [
                        abs(report["transform"][0]),
                        abs(report["transform"][4]),
                    ],
                },
                status="published",
                processing_version=PIPELINE,
                stac_item_id=str(identity),
                published_at=started,
                stats={
                    "is_fixture": False,
                    "product_version": f"Iran 2014–2020 · {PIPELINE}",
                    "last_acquisition": None,
                    "time_precision": "year",
                    "reference": None,
                    "reference_description": REFERENCE,
                    "sign_convention": sign,
                    "measurement_component": "vertical",
                    "measurement_method": "descending_los_projection",
                    "timeseries_available": False,
                    "quality": quality,
                    "attribution": provider.attribution,
                },
            )
            db.add(item)
            db.flush()
            key = f"{prefix}/{kind}/data.tif"
            checksum, etag = put_file(key, directory / artifacts[role]["name"], "image/tiff")
            db.add(
                Asset(
                    id=uuid5(identity, "data"),
                    product_id=identity,
                    role="data",
                    object_key=key,
                    media_type="image/tiff; application=geotiff; profile=cloud-optimized",
                    size_bytes=artifacts[role]["size_bytes"],
                    checksum_sha256=checksum,
                    etag=etag,
                )
            )
            stac = pystac.Item(
                id=str(identity),
                geometry={"type": "Polygon", "coordinates": [ring]},
                bbox=bbox,
                datetime=None,
                start_datetime=start,
                end_datetime=end,
                properties={
                    "forudid:time_precision": "year",
                    "forudid:dates_are_calendar_bounds": True,
                    "forudid:source_version_id": str(VERSION_ID),
                    "forudid:run_id": str(run_id),
                    "forudid:measurement_component": "vertical",
                    "forudid:measurement_method": "descending_los_projection",
                    "forudid:reference_description": REFERENCE,
                    "forudid:sign_convention": sign,
                    "forudid:is_fixture": False,
                    "license": "CC-BY-4.0",
                    "proj:code": report["crs"],
                    "sat:orbit_state": "descending",
                    "sci:citation": provider.citation,
                },
            )
            stac.set_self_href(f"s3://{cfg.s3_bucket}/{prefix}/{kind}/metadata.json")
            collection.add_item(stac)
            stac.add_asset(
                kind,
                pystac.Asset(
                    href=f"s3://{cfg.s3_bucket}/{key}",
                    roles=["data"],
                    media_type=pystac.MediaType.COG,
                    extra_fields={"file:checksum": f"1220{checksum}", "forudid:unit": unit},
                ),
            )
            stac.add_link(pystac.Link(rel="derived_from", target=provider.homepage))
            provenance = {
                "source_version_id": str(VERSION_ID),
                "source_manifest_sha256": version.checksum_sha256,
                "normalization_sha256": signature,
                "pipeline": PIPELINE,
                "base_git_revision": git_sha,
                "publisher_source_sha256": digest(publisher),
                "source": provider.homepage,
                "input_files": manifest["files"],
                "outputs": artifacts,
                "semantics": report["semantics"],
                "disclaimer": NOTE,
                "is_fixture": False,
                "scientifically_validated": False,
            }
            stac.validate()
            for asset_role, document in (
                ("metadata", stac.to_dict()),
                ("provenance", provenance),
                ("quality", quality),
            ):
                key = f"{prefix}/{kind}/{asset_role}.json"
                body = json_bytes(document)
                checksum, etag = put_immutable(key, body, "application/json")
                db.add(
                    Asset(
                        id=uuid5(identity, asset_role),
                        product_id=identity,
                        role=asset_role,
                        object_key=key,
                        media_type="application/json",
                        size_bytes=len(body),
                        checksum_sha256=checksum,
                        etag=etag,
                    )
                )
        collection.validate()
        put_immutable(
            f"{prefix}/collection.json", json_bytes(collection.to_dict()), "application/json"
        )
        run.status, run.finished_at = "published", datetime.now(UTC)
    return str(run_id)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("normalized", type=Path)
    args = parser.parse_args()
    print(publish(args.source, args.normalized))
