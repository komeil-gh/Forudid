"""Local experimental differential artifacts; never publish hazard classifications."""

import argparse
import hashlib
import importlib.metadata
import json
import shutil
import zipfile
from pathlib import Path
from uuid import NAMESPACE_URL, UUID, uuid5

import numpy as np
import rasterio
from forudid_analysis import gradient
from rasterio.enums import Resampling
from rasterio.warp import calculate_default_transform, reproject
from sqlalchemy import text
from sqlalchemy.orm import Session

from forudid_api import catalog
from forudid_api.db import engine
from forudid_api.ingest import digest
from forudid_api.publish_historical import NOTE, json_bytes

PAYNE_FILES = {
    "vU.zip": (
        "63fafbd6c4c671c629b46f9c34956415",
        "vU/Saveh_Qom_-_Kahak_vU.geo.tif",
        "20287129646e1bae555ea44c11e6807b1c58ff0fbafadcb1196c0664d5a8460e",
    ),
    "angular_distortion.zip": (
        "f7ad706d09b303d0c973e2eab2058f92",
        "angular_distortion/Saveh_Qom_-_Kahak_vU_UTM39_WGS84_bilin.geo_ang_dist_norm_vector_no_nans.tif",
        "17342de2e7b3ea599a17cff74a5d59ef7592d411cf9678cac63d013b196d0b5f",
    ),
}


def metadata(method, inputs):
    return {
        "method_version": method,
        "method_sha256": digest(Path(gradient.__file__)),
        "worker_sha256": digest(Path(__file__)),
        "status": "experimental",
        "scientific_review": None,
        "hazard_classification": False,
        "window_pixels": [3, 3],
        "valid_pixel_rule": "finite centre and at least 3 finite surrounding pixels; rank 3",
        "plane_fit": "ordinary least squares with intercept; Euclidean slope magnitude",
        "runtime": {
            name: importlib.metadata.version(name) for name in ("numpy", "rasterio", "pyproj")
        },
        "disclaimer": NOTE,
        **inputs,
    }


def write_manifest(output, inputs, result):
    signature = hashlib.sha256(json_bytes(inputs)).hexdigest()
    document = {
        "analysis_id": str(uuid5(NAMESPACE_URL, f"forudid:research:{signature}")),
        "signature": signature,
        "inputs": inputs,
        "result": result,
        "artifacts": [
            {"name": p.name, "size_bytes": p.stat().st_size, "sha256": digest(p)}
            for p in sorted(output.glob("*.tif"))
        ],
    }
    with (output / "manifest.json").open("xb") as stream:
        stream.write(json_bytes(document))
    print(json.dumps({"analysis_id": document["analysis_id"], "result": result}), flush=True)


def native_proxy(product_id: UUID, source: Path, output: Path):
    with engine().connect() as lock:
        if not lock.scalar(text("SELECT pg_try_advisory_lock(702318)")):
            raise ValueError("An analysis worker is already active")
        lock.commit()
        try:
            with Session(engine()) as db:
                product = catalog.product(db, product_id)
                asset = catalog.role_asset(db, product, "data")
                if product.kind != "velocity_vertical" or product.stats.get("is_fixture"):
                    raise ValueError("A published real vertical velocity product is required")
                if digest(source) != asset.checksum_sha256:
                    raise ValueError("Raster checksum differs from the published product")
                unit = product.unit
                inputs = metadata(
                    gradient.METHOD_VERSION,
                    {
                        "product_id": str(product_id),
                        "source_version_id": str(product.source_version_id),
                        "source_sha256": asset.checksum_sha256,
                        "source_unit": unit,
                        "period": [product.start_date, product.end_date],
                        "source_semantics": product.stats,
                        "output_unit": "mm/year/m",
                        "duration_years": None,
                        "resampling": "none; native geographic grid",
                        "metric_axes": "WGS84 distances per row; local tangent approximation",
                    },
                )
            factor = {"cm/year": 10, "mm/year": 1, "m/year": 1000}.get(unit)
            if factor is None:
                raise ValueError("Unsupported velocity unit")
            output.mkdir(parents=True, exist_ok=False)
            count, total, maximum = 0, 0.0, 0.0
            with rasterio.Env(GDAL_CACHEMAX=32 * 1024 * 1024, GDAL_NUM_THREADS="1"):
                with rasterio.open(source) as src:
                    if src.crs.to_epsg() != 4326 or src.count != 1:
                        raise ValueError("Native proxy requires a single-band EPSG:4326 raster")
                    band_unit = src.tags(1).get("UNITS")
                    if band_unit and band_unit != unit:
                        raise ValueError("Raster band and product units disagree")
                    dx, dy = gradient.native_pixel_metres(src.transform, np.arange(src.height))
                    inputs.update(
                        {
                            "input_crs": str(src.crs),
                            "analysis_crs": str(src.crs),
                            "input_transform": list(src.transform)[:6],
                            "analysis_transform": list(src.transform)[:6],
                            "width": src.width,
                            "height": src.height,
                            "pixel_width_m_range": [float(dx.min()), float(dx.max())],
                            "pixel_height_m_range": [float(dy.min()), float(dy.max())],
                        }
                    )
                    profile = src.profile.copy()
                    profile.update(
                        dtype="float32",
                        nodata=-9999,
                        compress="deflate",
                        predictor=3,
                        tiled=True,
                        blockxsize=256,
                        blockysize=256,
                        num_threads=1,
                    )
                    with rasterio.open(output / "gradient.tif", "w", **profile) as dst:
                        dst.update_tags(1, UNITS="mm/year/m", STATUS="experimental")
                        for row in range(0, src.height, 256):
                            height = min(256, src.height - row)
                            for col in range(0, src.width, 256):
                                width = min(256, src.width - col)
                                values = src.read(
                                    1,
                                    window=(
                                        (row - 1, row + height + 1),
                                        (col - 1, col + width + 1),
                                    ),
                                    boundless=True,
                                    masked=True,
                                    out_dtype="float64",
                                ).filled(np.nan)
                                values = (values * src.scales[0] + src.offsets[0]) * factor
                                result = np.full((height, width), np.nan)
                                if np.any(np.isfinite(values[1:-1, 1:-1])):
                                    result = gradient.plane_gradient(
                                        values, dx[row : row + height], dy[row : row + height]
                                    )
                                finite = result[np.isfinite(result)]
                                if finite.size:
                                    count += int(finite.size)
                                    total += float(finite.sum())
                                    maximum = max(maximum, float(finite.max()))
                                dst.write(
                                    np.where(np.isfinite(result), result, -9999).astype("float32"),
                                    1,
                                    window=((row, row + height), (col, col + width)),
                                )
                            if row % 2048 == 0:
                                print(
                                    f"Native gradient rows {row + height}/{src.height}", flush=True
                                )
            write_manifest(
                output,
                inputs,
                {
                    "valid_pixels": count,
                    "mean_mm_year_per_m": total / count if count else None,
                    "max_mm_year_per_m": maximum if count else None,
                    "summary_precision": "float64 before float32 raster storage",
                },
            )
        finally:
            lock.execute(text("SELECT pg_advisory_unlock(702318)"))
            lock.commit()


def payne_qom(archives: Path, output: Path, *, enabled=False):
    if not enabled:
        raise ValueError("Use --enable-experimental-angular-distortion for local research only")
    # Fixed literature example bounds memory and keeps the comparison reproducible.
    for name, (md5, _, _) in PAYNE_FILES.items():
        if digest(archives / name, "md5") != md5:
            raise ValueError(f"Provider archive checksum mismatch: {name}")
    output.mkdir(parents=True, exist_ok=False)
    files = []
    for name, (md5, member, sha) in PAYNE_FILES.items():
        path = output / Path(member).name
        with zipfile.ZipFile(archives / name) as archive, archive.open(member) as src:
            with path.open("xb") as dst:
                shutil.copyfileobj(src, dst, length=1024 * 1024)
        if digest(path) != sha:
            raise ValueError("Literature member checksum mismatch")
        files.append(
            {
                "archive": name,
                "archive_md5": md5,
                "archive_sha256": digest(archives / name),
                "member": member,
                "member_sha256": sha,
                "archive_checksum_verified": True,
            }
        )
    with rasterio.Env(GDAL_CACHEMAX=32 * 1024 * 1024, GDAL_NUM_THREADS="1"):
        with (
            rasterio.open(output / Path(PAYNE_FILES["vU.zip"][1]).name) as src,
            rasterio.open(output / Path(PAYNE_FILES["angular_distortion.zip"][1]).name) as ref,
        ):
            transform, width, height = calculate_default_transform(
                src.crs, "EPSG:32639", src.width, src.height, *src.bounds, resolution=100
            )
            velocity = np.full((height, width), np.nan)
            reproject(
                src.read(1),
                velocity,
                src_transform=src.transform,
                src_crs=src.crs,
                src_nodata=np.nan,
                dst_transform=transform,
                dst_crs="EPSG:32639",
                dst_nodata=np.nan,
                resampling=Resampling.bilinear,
                num_threads=1,
                warp_mem_limit=32,
            )
            beta = np.full_like(velocity, np.nan)
            beta[1:-1, 1:-1] = gradient.payne_candidate(
                velocity, pixel_width_m=100, duration_years=8, enabled=enabled
            )
            compared = np.full((ref.height, ref.width), np.nan)
            reproject(
                beta,
                compared,
                src_transform=transform,
                src_crs="EPSG:32639",
                src_nodata=np.nan,
                dst_transform=ref.transform,
                dst_crs=ref.crs,
                dst_nodata=np.nan,
                resampling=Resampling.bilinear,
                num_threads=1,
                warp_mem_limit=32,
            )
            reference = ref.read(1)
            shared = np.isfinite(reference) & np.isfinite(compared)
            error = compared[shared] - reference[shared]
            if not error.size:
                raise ValueError("No common valid literature pixels")
            profile = ref.profile.copy()
            profile.update(dtype="float32", nodata=np.nan, compress="deflate")
            with rasterio.open(output / "candidate-on-reference-grid.tif", "w", **profile) as dst:
                dst.write(compared.astype("float32"), 1)
                dst.update_tags(1, UNITS="1", STATUS="experimental")
            inputs = metadata(
                gradient.PAYNE_VERSION,
                {
                    "reference_doi": "10.1029/2024JB030367",
                    "dataset_doi": "10.5281/zenodo.13754200",
                    "license": "CC-BY-4.0",
                    "files": files,
                    "source_unit": "mm/year",
                    "output_unit": "1",
                    "duration_years": 8.0,
                    "period": ["2014-10", "2022-12"],
                    "input_crs": str(src.crs),
                    "input_transform": list(src.transform)[:6],
                    "analysis_crs": "EPSG:32639",
                    "analysis_transform": list(transform)[:6],
                    "analysis_pixel_width_m": 100,
                    "analysis_shape": [height, width],
                    "comparison_crs": str(ref.crs),
                    "comparison_transform": list(ref.transform)[:6],
                    "resampling": "bilinear to default UTM39 100m grid and back to author grid",
                    "unresolved_assumptions": [
                        "Rounded paper duration 8.0 years; exact acquisition duration unavailable",
                        "Author original UTM grid origin and resampling sequence unavailable",
                        "Finite centre required; author centre handling unspecified",
                        "File velocity unit inferred from source paper maps; band has no unit tag",
                    ],
                    "accepted_literature_tolerance": None,
                },
            )
            write_manifest(
                output,
                inputs,
                {
                    "reference_valid_pixels": int(np.isfinite(reference).sum()),
                    "candidate_valid_pixels": int(np.isfinite(compared).sum()),
                    "common_valid_pixels": int(error.size),
                    "bias": float(error.mean()),
                    "mae": float(np.abs(error).mean()),
                    "rmse": float(np.sqrt(np.mean(error**2))),
                    "p95_absolute_error": float(np.quantile(np.abs(error), 0.95)),
                    "maximum_absolute_error": float(np.abs(error).max()),
                    "reference_max": float(np.nanmax(reference)),
                    "candidate_max": float(np.nanmax(compared)),
                    "literature_reproduction_accepted": False,
                    "reason": "No independently accepted tolerance or scientific review",
                },
            )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="mode", required=True)
    native = commands.add_parser("gradient")
    native.add_argument("--product", type=UUID, required=True)
    native.add_argument("--raster", type=Path, required=True)
    native.add_argument("--output", type=Path, required=True)
    payne = commands.add_parser("payne-qom")
    payne.add_argument("--archives", type=Path, required=True)
    payne.add_argument("--output", type=Path, required=True)
    payne.add_argument("--enable-experimental-angular-distortion", action="store_true")
    args = parser.parse_args()
    if args.mode == "gradient":
        native_proxy(args.product, args.raster, args.output)
    else:
        payne_qom(args.archives, args.output, enabled=args.enable_experimental_angular_distortion)


if __name__ == "__main__":
    main()
