"""Prepare the verified Varamin ascending snapshot without changing its measurements."""

import argparse
import json
from datetime import datetime
from pathlib import Path

import numpy as np
import rasterio
import zarr
from rasterio.shutil import copy as raster_copy
from rasterio.transform import from_origin

from forudid_api.ingest import digest

PIPELINE = "comet-varamin-native-1"
SOURCE_SHA = "2b1ffa94efafad54882f7a27e567c9fe75f8ccaaad6a6bd7f664c9ded39d5eb5"
SOURCE_URL = (
    "https://comet-subsidencedb.org/static/data/licsbas_data/000001/000001_028A_05385_191813.hdf5"
)
CONTRACT_COMMIT = "a145e6c4217b29eb7348ea95630454a099809098"


def prepare(source: Path, output: Path) -> dict:
    import h5py

    if source.stat().st_size != 513816102 or digest(source) != SOURCE_SHA:
        raise ValueError("This importer requires the verified 2026-08-13 Varamin snapshot")
    manifest = output / "normalization.json"
    if manifest.exists():
        report = json.loads(manifest.read_text())
        if report["pipeline"] != PIPELINE or report["source_sha256"] != SOURCE_SHA:
            raise ValueError("Normalization identity mismatch")
        for item in report["artifacts"]:
            if digest(output / item["name"]) != item["checksum_sha256"]:
                raise ValueError("Existing normalized artifact changed")
        return report
    # A partial directory is never silently reused or overwritten.
    output.mkdir(parents=True, exist_ok=False)
    zarr.config.set({"async.concurrency": 1, "threading.max_workers": 1})
    with (
        h5py.File(source, "r") as original,
        rasterio.Env(GDAL_NUM_THREADS="1", GDAL_CACHEMAX=16 * 1024 * 1024),
    ):
        datasets: dict[str, h5py.Dataset] = {}
        for name in original:
            if not isinstance(name, str):
                raise ValueError("Invalid HDF5 dataset name")
            dataset = original[name]
            if not isinstance(dataset, h5py.Dataset):
                raise ValueError(f"Unexpected HDF5 root object: {name}")
            datasets[name] = dataset
        cube = datasets["cum"]
        if cube.shape != (323, 581, 765) or cube.dtype != np.dtype("float32"):
            raise ValueError("Unexpected source cube")
        dates = [
            datetime.strptime(str(int(v)), "%Y%m%d").date().isoformat()
            for v in datasets["imdates"][:]
        ]
        if dates != sorted(set(dates)) or (dates[0], dates[-1]) != ("2014-10-19", "2026-07-31"):
            raise ValueError("Unexpected source epochs")
        lat, lon, dy, dx = [
            float(datasets[key][()]) for key in ("corner_lat", "corner_lon", "post_lat", "post_lon")
        ]
        if not np.allclose(
            [lat, lon, dy, dx], [35.608, 51.4133333, -0.001, 0.001], rtol=0, atol=1e-10
        ):
            raise ValueError("Unexpected native grid")
        if datasets["refarea"][()] != b"427:428/183:184":
            raise ValueError("Unexpected provider reference area")
        if not np.all(cube[:, 183, 427] == 0) or datasets["vel"][183, 427] != 0:
            raise ValueError("Provider reference values are not zero")
        transform = from_origin(lon - dx / 2, lat - dy / 2, dx, -dy)
        bounds = [lon - dx / 2, lat + dy * (581 - 0.5), lon + dx * (765 - 0.5), lat - dy / 2]
        group = zarr.open_group(str(output / "timeseries.zarr"), mode="w-", zarr_format=2)
        group.attrs.update(
            {
                "dates": dates,
                "unit": "mm",
                "bbox": bounds,
                "width": 765,
                "height": 581,
                "reference_date": dates[0],
                "reference_pixel": [183, 427],
                "source_sha256": SOURCE_SHA,
            }
        )
        series = group.create_array(
            "displacement",
            shape=cube.shape,
            dtype="float32",
            chunks=(323, 32, 32),
            fill_value=float("nan"),
        )
        observations = np.zeros((581, 765), dtype=np.uint16)
        for row in range(0, 581, 32):
            block = cube[:, row : row + 32, :]
            if np.isinf(block).any():
                raise ValueError("Infinite displacement")
            series[:, row : row + 32, :] = block
            if not np.array_equal(block, series[:, row : row + 32, :], equal_nan=True):
                raise ValueError("Zarr conversion changed source values")
            observations[row : row + 32] = np.isfinite(block).sum(axis=0)
            print(f"Verified source cube rows {row}:{min(row + 32, 581)}", flush=True)
        first = cube[0]
        if not np.all(first[np.isfinite(first)] == 0):
            raise ValueError("First epoch is not the temporal reference")
        velocity = datasets["vel"][:]
        if np.isinf(velocity).any() or not np.isfinite(velocity).any():
            raise ValueError("Invalid velocity raster")
        # Float64 preserves the exact float32 input after the explicit mm-to-m conversion.
        meters = velocity.astype(np.float64) / 1000
        intermediate = output / "velocity.native.tif"
        with rasterio.open(
            intermediate,
            "w",
            driver="GTiff",
            width=765,
            height=581,
            count=1,
            dtype="float64",
            crs="EPSG:4326",
            transform=transform,
            nodata=float("nan"),
            tiled=True,
            compress="DEFLATE",
        ) as raster:
            raster.write(meters, 1)
            raster.update_tags(
                UNITS="m/year",
                SOURCE_SHA256=SOURCE_SHA,
                SIGN_CONVENTION="positive_towards_satellite",
            )
        cog = output / "velocity.tif"
        raster_copy(
            intermediate,
            cog,
            driver="COG",
            COMPRESS="DEFLATE",
            NUM_THREADS=1,
            OVERVIEW_RESAMPLING="AVERAGE",
        )
        with rasterio.open(cog) as raster:
            if (
                raster.transform != transform
                or raster.crs.to_epsg() != 4326
                or raster.tags(ns="IMAGE_STRUCTURE").get("LAYOUT") != "COG"
                or not np.array_equal(raster.read(1), meters, equal_nan=True)
            ):
                raise ValueError("COG conversion changed the native grid or velocity")
        intermediate.unlink()
        group.create_array("observations", data=observations, chunks=(32, 32))
        for key in ("coh_avg", "resid_rms", "n_unw", "n_gap", "E.geo", "N.geo", "U.geo"):
            values = datasets[key][:]
            if values.shape != (581, 765) or np.isinf(values).any():
                raise ValueError(f"Invalid provider ancillary field: {key}")
            array = group.create_array(key, data=values, chunks=(32, 32))
            if not np.array_equal(values, array[:], equal_nan=True):
                raise ValueError(f"Ancillary conversion changed {key}")
        report = {
            "pipeline": PIPELINE,
            "source_sha256": SOURCE_SHA,
            "source_url": SOURCE_URL,
            "source_size_bytes": source.stat().st_size,
            "source_last_modified": "2026-08-13T17:06:10Z",
            "contract_repository_commit": CONTRACT_COMMIT,
            "frame": "028A_05385_191813",
            "orbit_direction": "ascending",
            "relative_orbit": 28,
            "dates": dates,
            "shape": list(cube.shape),
            "bbox": bounds,
            "transform": list(transform)[:6],
            "crs": "EPSG:4326",
            "velocity_unit": "m/year",
            "displacement_storage_unit": "mm",
            "sign_convention": "positive_towards_satellite",
            "reference": {
                "pixel": [183, 427],
                "lon": lon + 427 * dx,
                "lat": lat + 183 * dy,
                "date": dates[0],
                "provider_refarea": "427:428/183:184",
            },
            "variant": {"gacos": False, "spatiotemporal_filter": False},
            "quality": {
                "independent_validation": False,
                "temporal_coherence": None,
                "velocity_uncertainty": None,
                "displacement_uncertainty": None,
                "coh_avg": "mean_interferometric_coherence",
                "resid_rms": "interferogram_residual_rms_mm",
                "n_unw": "unwrapped_interferogram_count",
                "observations": "finite_displacement_epoch_count",
            },
            "valid_velocity_pixels": int(np.isfinite(velocity).sum()),
            "velocity_range_m_year": [float(np.nanmin(meters)), float(np.nanmax(meters))],
            "all_base_values_verified": True,
            "publication_status": "normalized",
            "license": "not explicitly specified for this portal snapshot",
            "artifacts": [
                {
                    "name": str(p.relative_to(output)),
                    "size_bytes": p.stat().st_size,
                    "checksum_sha256": digest(p),
                }
                for p in sorted(output.rglob("*"))
                if p.is_file()
            ],
        }
    with manifest.open("x") as stream:
        json.dump(report, stream, indent=2, sort_keys=True, allow_nan=False)
        stream.write("\n")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    result = prepare(args.source, args.output)
    print(json.dumps({k: result[k] for k in ("pipeline", "valid_velocity_pixels", "bbox")}))
