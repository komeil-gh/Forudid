"""Register the verified COMET pilot with explicit provider and quality limitations."""

import argparse
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

import pystac
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from forudid_api.config import settings
from forudid_api.db import AOI, Asset, DataSource, Product, Run, SourceVersion, engine
from forudid_api.ingest import digest
from forudid_api.prepare_comet import PIPELINE, SOURCE_SHA, SOURCE_URL, prepare
from forudid_api.publish_historical import json_bytes
from forudid_api.storage import put_file, put_immutable

SOURCE_ID = uuid5(NAMESPACE_URL, "https://comet-subsidencedb.org/region/000001")
VERSION_ID = uuid5(SOURCE_ID, SOURCE_SHA)
SIGN = "مقدار مثبت، حرکت به سوی ماهواره و مقدار منفی، دورشدن از ماهواره است؛ مؤلفهٔ قائم نیست."
ATTRIBUTION = (
    "COMET LiCS Land Subsidence Portal; Payne et al. (2022), Living Planet Symposium. "
    "LiCSAR / LiCSBAS; contains modified Copernicus Sentinel data 2014–2026. "
    "Processed by COMET using JASMIN."
)


def publish(source: Path, directory: Path) -> str:
    report = prepare(source, directory)
    signature = digest(directory / "normalization.json")
    run_id = uuid5(VERSION_ID, f"{PIPELINE}/{signature}")
    prefix = f"comet/varamin/{run_id}"
    with Session(engine()) as db:
        previous = db.get(Run, run_id)
        if previous is not None:
            if (
                previous.status != "published"
                or previous.config["normalization_sha256"] != signature
            ):
                raise ValueError("COMET publication identity conflict")
            return str(run_id)
    # Network transfers do not reserve a database connection.
    put_file(f"{prefix}/original.hdf5", source, "application/x-hdf5")
    put_file(f"{prefix}/normalization.json", directory / "normalization.json", "application/json")
    publisher = Path(__file__)
    put_file(f"{prefix}/publisher.py", publisher, "text/x-python")
    cube_files = [
        a for a in report["artifacts"] if a["name"].startswith("timeseries.zarr/displacement/")
    ]
    for index, artifact in enumerate(cube_files):
        put_file(
            f"{prefix}/{artifact['name']}", directory / artifact["name"], "application/octet-stream"
        )
        if index % 32 == 0:
            print(f"Archived time-series chunks {index}/{len(cube_files)}", flush=True)
    velocity_checksum, velocity_etag = put_file(
        f"{prefix}/velocity.tif", directory / "velocity.tif", "image/tiff"
    )
    descriptor = {
        "storage": "zarr-v2",
        "prefix": f"{prefix}/timeseries.zarr/displacement",
        "dates": report["dates"],
        "bbox": report["bbox"],
        "height": 581,
        "width": 765,
        "unit": "mm",
        "chunks": [323, 32, 32],
        "checksums": {Path(a["name"]).name: a["checksum_sha256"] for a in cube_files},
    }
    now = datetime.now(UTC)
    west, south, east, north = report["bbox"]
    ring = [[west, south], [east, south], [east, north], [west, north], [west, south]]
    quality = {
        "quality": "caution",
        "is_fixture": False,
        "thresholds": {},
        "reasons": [
            "دادهٔ ارائه‌دهنده مستقل اعتبارسنجی نشده است؛ "
            "این محصولِ خام فیلتر مکانی‌زمانی و تصحیح GACOS ندارد.",
            "همدوسی زمانی و عدم‌قطعیت نرخ یا جابه‌جایی ارائه نشده‌اند.",
            "مجوز مشخص بازتوزیع این نسخه تأیید نشده است؛ شرایط منبع باید بررسی شود.",
        ],
        "metrics": {**report["quality"], "all_base_values_verified": True},
    }
    reference = {
        "id": str(uuid5(run_id, "provider-reference")),
        "coordinate": {"lon": report["reference"]["lon"], "lat": report["reference"]["lat"]},
        "date": report["dates"][0],
        "method": "provider_licsbas_reference_pixel",
        "reason": "پیکسل مرجع ثبت‌شده در فایل اصلی؛ پایداری آن مستقل تأیید نشده است.",
    }
    start = datetime.fromisoformat(report["dates"][0]).replace(tzinfo=UTC)
    end = datetime.fromisoformat(report["dates"][-1]).replace(tzinfo=UTC)
    collection = pystac.Collection(
        id=f"comet-varamin-{run_id}",
        description=ATTRIBUTION,
        license="other",
        extent=pystac.Extent(
            pystac.SpatialExtent([report["bbox"]]), pystac.TemporalExtent([[start, end]])
        ),
    )
    bucket = settings().s3_bucket
    collection.set_self_href(f"s3://{bucket}/{prefix}/collection.json")
    with Session(engine()) as db, db.begin():
        db.execute(text("SELECT pg_advisory_xact_lock(702316)"))
        if db.get(Run, run_id) is not None:
            raise ValueError("Concurrent COMET publication; verify the existing run")
        if db.get(DataSource, SOURCE_ID) is None:
            db.add(
                DataSource(
                    id=SOURCE_ID,
                    slug="comet-varamin",
                    name="سری زمانی راستای دید ورامین",
                    provider="COMET",
                    source_type="deformation",
                    homepage="https://comet-subsidencedb.org/region/000001",
                    citation=ATTRIBUTION,
                    attribution=ATTRIBUTION,
                    license_name="Not explicitly specified for this portal snapshot",
                    license_url="https://comet-subsidencedb.org/technical-information",
                    access_method="official_manual_hdf5_download",
                    scientific_status="experimental",
                )
            )
            db.flush()
        previous_version = db.get(SourceVersion, VERSION_ID)
        if previous_version is None:
            db.add(
                SourceVersion(
                    id=VERSION_ID,
                    source_id=SOURCE_ID,
                    version=f"028A-20260813-{SOURCE_SHA[:12]}",
                    data_date=end.date(),
                    valid_from=start.date(),
                    valid_to=end.date(),
                    downloaded_at=datetime.fromtimestamp(source.stat().st_mtime, UTC),
                    original_uri=SOURCE_URL,
                    object_uri=f"s3://{bucket}/{prefix}/original.hdf5",
                    checksum_sha256=SOURCE_SHA,
                    size_bytes=source.stat().st_size,
                    metadata_json={
                        "frame": report["frame"],
                        "variant": report["variant"],
                        "independent_validation": False,
                        "normalization_sha256": signature,
                    },
                )
            )
        elif previous_version.checksum_sha256 != SOURCE_SHA:
            raise ValueError("Immutable source conflict")
        area = db.scalar(select(AOI).where(AOI.slug == "varamin-comet"))
        if area is None:
            area = AOI(
                id=uuid5(SOURCE_ID, "native-grid"),
                slug="varamin-comet",
                name_fa="ورامین؛ پوشش COMET",
                name_en="Varamin COMET footprint",
                bbox=report["bbox"],
                geom=f"SRID=4326;MULTIPOLYGON((({west} {south},"
                f"{east} {south},{east} {north},{west} {north},{west} {south})))",
            )
            db.add(area)
        elif area.bbox != report["bbox"]:
            raise ValueError("Existing COMET area has a different footprint")
        db.flush()
        run = Run(
            id=run_id,
            aoi_id=area.id,
            pipeline_version=PIPELINE,
            git_sha=subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(),
            processing_profile="provider-native-los-normalization",
            status="publishing",
            started_at=now,
            config={
                "is_fixture": False,
                "normalization_sha256": signature,
                "source_version_id": str(VERSION_ID),
            },
        )
        db.add(run)
        db.flush()
        for kind, unit in (("velocity_los", "m/year"), ("timeseries", "m")):
            identity = uuid5(run_id, kind)
            product = Product(
                id=identity,
                processing_run_id=run_id,
                source_version_id=VERSION_ID,
                aoi_id=area.id,
                kind=kind,
                orbit_direction="ascending",
                relative_orbit=28,
                start_date=report["dates"][0],
                end_date=report["dates"][-1],
                unit=unit,
                crs="EPSG:4326",
                resolution_metadata={
                    "shape": [581, 765],
                    "transform": report["transform"],
                    "pixel_size_degrees": [0.001, 0.001],
                },
                status="published",
                processing_version=PIPELINE,
                stac_item_id=str(identity),
                published_at=now,
                stats={
                    "is_fixture": False,
                    "quality": quality,
                    "product_version": "COMET Varamin · 2014–2026 · ascending · unfiltered",
                    "last_acquisition": report["dates"][-1],
                    "time_precision": "day",
                    "reference": reference,
                    "sign_convention": SIGN,
                    "measurement_component": "los",
                    "measurement_method": "provider_licsbas_los",
                    "timeseries_available": True,
                    "attribution": ATTRIBUTION,
                },
            )
            db.add(product)
            db.flush()
            stac = pystac.Item(
                id=str(identity),
                geometry={"type": "Polygon", "coordinates": [ring]},
                bbox=report["bbox"],
                datetime=None,
                start_datetime=start,
                end_datetime=end,
                properties={
                    "license": "other",
                    "forudid:source_version_id": str(VERSION_ID),
                    "forudid:sign_convention": SIGN,
                    "forudid:is_fixture": False,
                },
            )
            stac.set_self_href(f"s3://{bucket}/{prefix}/{kind}/metadata.json")
            collection.add_item(stac)
            stac.add_link(pystac.Link(rel="derived_from", target=SOURCE_URL))
            if kind == "velocity_los":
                key, media = f"{prefix}/velocity.tif", pystac.MediaType.COG
                checksum, etag = velocity_checksum, velocity_etag
                size = (directory / "velocity.tif").stat().st_size
            else:
                key, media = f"{prefix}/timeseries.json", "application/json"
                payload = json_bytes(descriptor)
                checksum, etag = put_immutable(key, payload, media)
                size = len(payload)
            db.add(
                Asset(
                    id=uuid5(identity, "data"),
                    product_id=identity,
                    role="data",
                    object_key=key,
                    media_type=media,
                    checksum_sha256=checksum,
                    etag=etag,
                    size_bytes=size,
                )
            )
            stac.add_asset(
                "data", pystac.Asset(href=f"s3://{bucket}/{key}", media_type=media, roles=["data"])
            )
            stac.validate()
            provenance = {
                "source_version_id": str(VERSION_ID),
                "source_sha256": SOURCE_SHA,
                "normalization_sha256": signature,
                "publisher_sha256": digest(publisher),
                "scientifically_validated": False,
                "is_fixture": False,
                "measurement_component": "los",
                "variant": report["variant"],
            }
            for role, document in (
                ("metadata", stac.to_dict()),
                ("quality", quality),
                ("provenance", provenance),
            ):
                payload = json_bytes(document)
                key = f"{prefix}/{kind}/{role}.json"
                checksum, etag = put_immutable(key, payload, "application/json")
                db.add(
                    Asset(
                        id=uuid5(identity, role),
                        product_id=identity,
                        role=role,
                        object_key=key,
                        media_type="application/json",
                        size_bytes=len(payload),
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
