"""Validate native historical rasters and create COGs with bounded memory."""

import argparse
import json
from contextlib import ExitStack
from pathlib import Path

import numpy as np
import rasterio
from rasterio.shutil import copy as raster_copy

from forudid_api.ingest import FILES, digest

PIPELINE = "haghighi-motagh-cog-1"
UNITS = {"rate": "cm/year", "seasonal_amplitude": "cm", "mask": "None"}


def verify_cog(original: Path, output: Path) -> None:
    """Independently compare every base-resolution pixel without loading a whole raster."""
    with rasterio.open(original) as source, rasterio.open(output) as result:
        if (
            source.shape != result.shape
            or source.transform != result.transform
            or source.crs != result.crs
            or source.nodata != result.nodata
            or source.dtypes != result.dtypes
            or not result.overviews(1)
            or result.tags(ns="IMAGE_STRUCTURE").get("LAYOUT") != "COG"
        ):
            raise ValueError("COG geometry or encoding mismatch")
        for row in range(0, source.height, 64):
            window = ((row, min(row + 64, source.height)), (0, source.width))
            if not np.array_equal(source.read(1, window=window), result.read(1, window=window)):
                raise ValueError("COG changed source pixel values")


def normalize(source: Path, output: Path) -> dict:
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = source / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    expected_manifest = "bdcdcbdab22ba8a06ede98b180ac56b7341a5fbb5ecf50033fdb4078c917c1f3"
    if digest(manifest_path) != expected_manifest:
        raise ValueError("Unexpected original source manifest")
    paths = {f["role"]: source / f["name"] for f in manifest["files"]}
    for item in manifest["files"]:
        path = paths[item["role"]]
        if path.stat().st_size != FILES[item["role"]][0] or digest(path) != item["checksum_sha256"]:
            raise ValueError("Original raster checksum mismatch")
    report_path = output / "normalization.json"
    if report_path.exists():
        report = json.loads(report_path.read_text())
        if report["pipeline"] != PIPELINE or report["source_sha256"] != expected_manifest:
            raise ValueError("Normalization version conflict")
        for artifact in report["artifacts"]:
            if digest(output / artifact["name"]) != artifact["checksum_sha256"]:
                raise ValueError("Existing COG checksum mismatch")
        return report
    with rasterio.Env(GDAL_CACHEMAX=32 * 1024 * 1024, GDAL_NUM_THREADS="1"), ExitStack() as stack:
        rasters = {role: stack.enter_context(rasterio.open(path)) for role, path in paths.items()}
        rate = rasters["rate"]
        for role, raster in rasters.items():
            if (
                raster.count != 1
                or raster.shape != rate.shape
                or raster.crs != rate.crs
                or raster.transform != rate.transform
                or raster.tags().get("UNITS") != UNITS[role]
                or raster.scales != (1.0,)
                or raster.offsets != (0.0,)
            ):
                raise ValueError(f"Unexpected grid or units: {role}")
            if role != "mask" and raster.nodata != -999:
                raise ValueError("Unexpected source NoData")
        valid_count, zero_count = 0, 0
        minimum, maximum, total = float("inf"), float("-inf"), 0.0
        peak = None
        for row in range(0, rate.height, 64):
            window = ((row, min(row + 64, rate.height)), (0, rate.width))
            values = rate.read(1, window=window, masked=True)
            amplitude = rasters["seasonal_amplitude"].read(1, window=window, masked=True)
            mask = rasters["mask"].read(1, window=window)
            valid = ~np.ma.getmaskarray(values)
            if (
                not np.isin(mask, [0, 1]).all()
                or not np.array_equal(valid, mask == 1)
                or not np.array_equal(valid, ~np.ma.getmaskarray(amplitude))
            ):
                raise ValueError("Source mask/rate/amplitude coverage mismatch")
            selected = values.compressed()
            if selected.size:
                if (
                    not np.isfinite(selected).all()
                    or not np.isfinite(amplitude.compressed()).all()
                    or (selected < 0).any()
                    or (amplitude.compressed() < 0).any()
                ):
                    raise ValueError("Invalid source subsidence magnitude or amplitude")
                valid_count += int(selected.size)
                zero_count += int((selected == 0).sum())
                minimum = min(minimum, float(selected.min()))
                total += float(selected.sum(dtype=np.float64))
                if float(selected.max()) > maximum:
                    maximum = float(selected.max())
                    y, x = np.unravel_index(values.argmax(), values.shape)
                    lon, lat = rate.xy(row + int(y), int(x))
                    peak = {"lon": lon, "lat": lat, "value": maximum, "unit": "cm/year"}
        if valid_count == 0:
            raise ValueError("No valid source pixels")
        report = {
            "pipeline": PIPELINE,
            "source_sha256": expected_manifest,
            "crs": rate.crs.to_string(),
            "shape": list(rate.shape),
            "transform": list(rate.transform)[:6],
            "bounds": list(rate.bounds),
            "valid_pixels": valid_count,
            "valid_zero_pixels": zero_count,
            "grid_coverage_fraction": valid_count / (rate.width * rate.height),
            "rate_statistics": {
                "minimum": minimum,
                "maximum": maximum,
                "mean": total / valid_count,
                "unit": "cm/year",
            },
            "peak_sample": peak,
            "artifacts": [],
            "semantics": {
                "component": "vertical",
                "method": "descending_los_projection",
                "sign_convention": "positive_subsidence_magnitude",
                "assumption": "horizontal deformation negligible",
                "amplitude": "seasonal_peak_to_peak",
                "observation_years": [2014, 2020],
                "reference": "spatial_correction_surface_paper_equation_1",
                "timeseries_available": False,
                "uncertainty_available": False,
                "nodata": "outside reported subsidence coverage; not evidence of zero motion",
            },
        }
        print(f"Validated {valid_count} source pixels; creating COGs with one thread", flush=True)
        for role, path in paths.items():
            destination = output / f"{role}.tif"
            partial = destination.with_suffix(".partial.tif")
            if not destination.exists():
                raster_copy(
                    path,
                    partial,
                    driver="COG",
                    COMPRESS="DEFLATE",
                    BLOCKSIZE=512,
                    NUM_THREADS=1,
                    OVERVIEW_RESAMPLING="NEAREST" if role == "mask" else "AVERAGE",
                )
                destination.hardlink_to(partial)
                partial.unlink()
            verify_cog(path, destination)
            report["artifacts"].append(
                {
                    "role": role,
                    "name": destination.name,
                    "checksum_sha256": digest(destination),
                    "size_bytes": destination.stat().st_size,
                }
            )
            print(f"Created {destination.name}", flush=True)
    with report_path.open("x") as target:
        json.dump(report, target, indent=2, sort_keys=True, allow_nan=False)
        target.write("\n")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    normalize(args.source, args.output)
