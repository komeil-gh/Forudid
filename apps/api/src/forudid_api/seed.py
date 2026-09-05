"""Deterministic synthetic fixtures only. This command never publishes scientific runs."""

import hashlib
import json
import shutil
import subprocess
from datetime import UTC, datetime, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import NAMESPACE_URL, uuid5

import numpy as np
import pystac
import rasterio
from botocore.exceptions import ClientError
from rasterio.shutil import copy as rio_copy
from rasterio.transform import from_bounds
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from forudid_api.config import settings
from forudid_api.db import AOI, Asset, Product, QCMetric, Reference, Run, engine
from forudid_api.storage import put_immutable, s3

BBOX = [51.35, 35.10, 51.95, 35.55]
SIZE = 64
NODATA = -9999.0
FIXTURE_VERSION = "fixture-v2"


def uid(name: str):
    return uuid5(NAMESPACE_URL, f"forudid/{FIXTURE_VERSION}/{name}")


def json_bytes(value) -> bytes:
    return json.dumps(value, ensure_ascii=False, allow_nan=False, sort_keys=True).encode()


def build_fixture(directory: Path):
    y, x = np.mgrid[0:SIZE, 0:SIZE]
    velocity = (0.016 - 0.11 * np.exp(-((x - 39) ** 2 + (y - 33) ** 2) / 330)).astype("float32")
    coherence = (0.55 + 0.4 * np.sin(x / 15) ** 2).astype("float32")
    uncertainty = (0.002 + (1 - coherence) * 0.02).astype("float32")
    mask = (x >= 3) & (y >= 3) & ~((x > 53) & (y < 15))
    # Golden pixel containing 51.6452, 35.3241.
    velocity[32, 31], coherence[32, 31], uncertainty[32, 31] = -0.0712, 0.89, 0.006
    velocity[5, 5] = 0
    arrays = {
        "velocity_los": velocity,
        "temporal_coherence": coherence,
        "velocity_uncertainty": uncertainty,
        "valid_mask": mask.astype("float32"),
    }
    for kind, array in arrays.items():
        values = np.where(mask, array, NODATA).astype("float32")
        source = directory / f"{kind}-source.tif"
        with rasterio.open(
            source,
            "w",
            driver="GTiff",
            height=SIZE,
            width=SIZE,
            count=1,
            dtype="float32",
            crs="EPSG:4326",
            nodata=NODATA,
            transform=from_bounds(BBOX[0], BBOX[1], BBOX[2], BBOX[3], SIZE, SIZE),
        ) as dataset:
            dataset.write(values, 1)
            dataset.update_tags(
                is_fixture="true",
                unit="1" if kind in ("temporal_coherence", "valid_mask") else "m/year",
                version=FIXTURE_VERSION,
            )
        rio_copy(
            source,
            directory / f"{kind}.tif",
            driver="COG",
            compress="DEFLATE",
            blocksize=128,
            overview_count=2,
        )
        source.unlink()
    dates = [
        (datetime(2025, 1, 1, tzinfo=UTC) + timedelta(days=24 * i)).date().isoformat()
        for i in range(26)
    ]
    cube = []
    for i in range(len(dates)):
        displacement = velocity * (24 * i / 365.25)
        cube.append(
            [
                [
                    round(float(displacement[r, c]), 8) if mask[r, c] and i != 8 else None
                    for c in range(SIZE)
                ]
                for r in range(SIZE)
            ]
        )
    timeseries = {
        "bbox": BBOX,
        "width": SIZE,
        "height": SIZE,
        "dates": dates,
        "unit": "m",
        "crs": "EPSG:4326",
        "is_fixture": True,
        "reference_date": dates[0],
        "reference_point_id": str(uid("reference")),
        "run_id": str(uid("run")),
        "displacement": cube,
        "uncertainty": [0.0 if i == 0 else 0.003 for i in range(len(dates))],
    }
    (directory / "timeseries.json").write_bytes(json_bytes(timeseries))
    return dates


def seed():
    cfg = settings()
    try:
        s3().head_bucket(Bucket=cfg.s3_bucket)
    except ClientError as exc:
        if exc.response["Error"]["Code"] not in ("404", "NoSuchBucket"):
            raise
        s3().create_bucket(Bucket=cfg.s3_bucket)
    with Session(engine()) as db, db.begin(), TemporaryDirectory() as temp:
        db.execute(text("SELECT pg_advisory_xact_lock(702315)"))
        if db.get(Run, uid("run")):
            print("Fixture run already exists; preserved")
            return
        directory = Path(temp)
        dates = build_fixture(directory)
        timestamp = datetime(2025, 8, 24, tzinfo=UTC)
        west, south, east, north = BBOX
        ring = [[west, south], [east, south], [east, north], [west, north], [west, south]]
        area = db.scalar(select(AOI).where(AOI.slug == "varamin"))
        if area is None:
            area = AOI(
                id=uid("aoi"),
                slug="varamin",
                name_fa="دشت ورامین",
                name_en="Varamin",
                bbox=BBOX,
                geom=f"SRID=4326;MULTIPOLYGON((({west} {south},{east} {south},"
                f"{east} {north},{west} {north},{west} {south})))",
            )
            db.add(area)
            db.flush()
        result = (
            subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True)
            if shutil.which("git")
            else None
        )
        git_sha = (
            result.stdout.strip() if result and result.returncode == 0 else "uncommitted-fixture"
        )
        run = Run(
            id=uid("run"),
            aoi_id=area.id,
            pipeline_version=FIXTURE_VERSION,
            git_sha=git_sha,
            processing_profile="synthetic-fixture-v1",
            config={
                "is_fixture": True,
                "scientifically_validated": False,
                "source_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            },
            status="published",
            started_at=timestamp,
            finished_at=timestamp,
        )
        db.add(run)
        db.flush()
        ref_lon, ref_lat = west + 5.5 * (east - west) / SIZE, north - 5.5 * (north - south) / SIZE
        ref = {
            "id": str(uid("reference")),
            "coordinate": {"lon": ref_lon, "lat": ref_lat},
            "method": "synthetic-zero",
            "reason": "مرجع ساختگی آزمون نرم‌افزار",
            "date": dates[0],
        }
        db.add(
            Reference(
                id=uid("reference"),
                processing_run_id=run.id,
                geom=f"SRID=4326;POINT({ref_lon} {ref_lat})",
                method=ref["method"],
                reason=ref["reason"],
                selected_by="fixture-generator",
                stability_metrics={"is_fixture": True},
            )
        )
        quality = {
            "quality": "caution",
            "reasons": ["دادهٔ آزمایشی؛ برای استناد علمی نیست."],
            "is_fixture": True,
            "thresholds": {
                "temporal_coherence_threshold": None,
                "minimum_observations": None,
                "uncertainty_cutoff": None,
            },
            "metrics": {"epochs": len(dates), "missing_epochs": 1, "scientific_approval": False},
        }
        db.add(
            QCMetric(
                processing_run_id=run.id,
                metric_name="fixture_only",
                value_json=quality,
                passed=None,
                threshold=None,
            )
        )
        prefix = f"{cfg.s3_prefix}/varamin/descending/track-071/runs/{run.id}/publish"
        outputs = []
        kinds = [
            "velocity_los",
            "temporal_coherence",
            "velocity_uncertainty",
            "valid_mask",
            "timeseries",
        ]
        products = []
        for kind in kinds:
            item = Product(
                id=uid(kind),
                processing_run_id=run.id,
                aoi_id=area.id,
                kind=kind,
                orbit_direction="descending",
                relative_orbit=71,
                start_date=dates[0],
                end_date=dates[-1],
                unit="m"
                if kind == "timeseries"
                else "1"
                if kind in ("temporal_coherence", "valid_mask")
                else "m/year",
                crs="EPSG:4326",
                resolution_metadata={
                    "width": SIZE,
                    "height": SIZE,
                    "pixel_size_degrees": [(east - west) / SIZE, (north - south) / SIZE],
                },
                status="published",
                processing_version=FIXTURE_VERSION,
                stats={
                    "is_fixture": True,
                    "last_acquisition": dates[-1],
                    "product_version": "varamin-synthetic-v1",
                    "reference": ref,
                    "sign_convention": (
                        "قرارداد این fixture: منفی دورشدن از ماهواره؛ مثبت نزدیک‌شدن به ماهواره."
                    ),
                    "quality": quality,
                },
                stac_item_id=str(run.id),
                published_at=timestamp,
            )
            db.add(item)
            db.flush()
            filename = f"{kind}.json" if kind == "timeseries" else f"{kind}.tif"
            media = (
                "application/json"
                if kind == "timeseries"
                else "image/tiff; application=geotiff; profile=cloud-optimized"
            )
            body = (directory / filename).read_bytes()
            checksum, etag = put_immutable(f"{prefix}/{filename}", body, media)
            db.add(
                Asset(
                    id=uid(f"asset/{kind}"),
                    product_id=item.id,
                    role="data",
                    object_key=f"{prefix}/{filename}",
                    media_type=media,
                    size_bytes=len(body),
                    checksum_sha256=checksum,
                    etag=etag,
                )
            )
            outputs.append(
                {
                    "kind": kind,
                    "key": f"{prefix}/{filename}",
                    "checksum_sha256": checksum,
                    "size_bytes": len(body),
                    "media_type": media,
                }
            )
            products.append(item)
        stac = pystac.Item(
            id=str(run.id),
            geometry={"type": "Polygon", "coordinates": [ring]},
            bbox=BBOX,
            datetime=None,
            start_datetime=datetime.fromisoformat(dates[0]).replace(tzinfo=UTC),
            end_datetime=datetime.fromisoformat(dates[-1]).replace(tzinfo=UTC),
            properties={
                "platform": "synthetic-fixture",
                "sat:orbit_state": "descending",
                "sat:relative_orbit": 71,
                "processing:version": FIXTURE_VERSION,
                "forudid:run_id": str(run.id),
                "forudid:is_fixture": True,
                "proj:code": "EPSG:4326",
                "forudid:reference": ref,
            },
        )
        root_catalog = pystac.Catalog(id="forudid", description="FORUDID synthetic local fixtures")
        root_catalog.set_self_href(f"s3://{cfg.s3_bucket}/{prefix}/catalog.json")
        collection = pystac.Collection(
            id="forudid-varamin",
            description="Synthetic software test data; not satellite observations",
            extent=pystac.Extent(
                pystac.SpatialExtent([BBOX]),
                pystac.TemporalExtent(
                    [
                        [
                            datetime.fromisoformat(dates[0]).replace(tzinfo=UTC),
                            datetime.fromisoformat(dates[-1]).replace(tzinfo=UTC),
                        ]
                    ]
                ),
            ),
            license="proprietary",
        )
        collection.set_self_href(f"s3://{cfg.s3_bucket}/{prefix}/collection.json")
        stac.set_self_href(f"s3://{cfg.s3_bucket}/{prefix}/stac-item.json")
        root_catalog.add_child(collection)
        collection.add_item(stac)
        for output in outputs:
            stac.add_asset(
                output["kind"],
                pystac.Asset(
                    href=f"s3://{cfg.s3_bucket}/{output['key']}",
                    media_type=output["media_type"],
                    roles=["data"],
                    extra_fields={
                        "file:checksum": f"1220{output['checksum_sha256']}",
                        "forudid:unit": next(p.unit for p in products if p.kind == output["kind"]),
                    },
                ),
            )
        provenance = {
            "run_id": str(run.id),
            "pipeline_version": FIXTURE_VERSION,
            "git_sha": git_sha,
            "is_fixture": True,
            "scientifically_validated": False,
            "container_digest": None,
            "processor": "deterministic fixture generator",
            "source_sha256": run.config["source_sha256"],
            "inputs": [],
            "reference": ref,
            "outputs": outputs,
            "created_at": timestamp.isoformat(),
        }
        source_key = f"{prefix}/fixture-generator.py"
        put_immutable(source_key, Path(__file__).read_bytes(), "text/x-python")
        provenance["source_uri"] = f"s3://{cfg.s3_bucket}/{source_key}"
        for role, filename, document in (
            ("quality", "qc-report.json", quality),
            ("provenance", "provenance.json", provenance),
        ):
            stac.add_asset(
                role,
                pystac.Asset(
                    href=f"s3://{cfg.s3_bucket}/{prefix}/{filename}",
                    media_type="application/json",
                    roles=["metadata"],
                ),
            )
            body = json_bytes(document)
            for item in products:
                key = f"{prefix}/{item.kind}/{filename}"
                checksum, etag = put_immutable(key, body, "application/json")
                db.add(
                    Asset(
                        id=uid(f"{item.kind}/{role}"),
                        product_id=item.id,
                        role=role,
                        object_key=key,
                        media_type="application/json",
                        size_bytes=len(body),
                        checksum_sha256=checksum,
                        etag=etag,
                    )
                )
            put_immutable(f"{prefix}/{filename}", body, "application/json")
        stac.validate()
        collection.validate()
        root_catalog.validate()
        stac_dict = stac.to_dict()
        for filename, document in (
            ("stac-item.json", stac_dict),
            ("collection.json", collection.to_dict()),
            ("catalog.json", root_catalog.to_dict()),
        ):
            put_immutable(f"{prefix}/{filename}", json_bytes(document), "application/json")
        for item in products:
            body = json_bytes(stac_dict)
            key = f"{prefix}/{item.kind}/stac-item.json"
            checksum, etag = put_immutable(key, body, "application/json")
            db.add(
                Asset(
                    id=uid(f"{item.kind}/metadata"),
                    product_id=item.id,
                    role="metadata",
                    object_key=key,
                    media_type="application/json",
                    size_bytes=len(body),
                    checksum_sha256=checksum,
                    etag=etag,
                )
            )
        for previous in db.scalars(
            select(Product).where(
                Product.processing_run_id != run.id, Product.status == "published"
            )
        ):
            if previous.stats.get("is_fixture") is True:
                previous.status = "superseded"
        print(f"Synthetic fixture stored: run {run.id}; {len(products)} products")


if __name__ == "__main__":
    seed()
