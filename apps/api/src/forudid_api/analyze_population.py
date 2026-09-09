"""Precompute country population exposure from checksummed native rasters."""

import argparse
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
from uuid import NAMESPACE_URL, UUID, uuid5

import rasterio
from forudid_analysis import population as legacy_method
from forudid_analysis import population_v2
from shapely.geometry import shape
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from forudid_api import catalog
from forudid_api.db import (
    AnalysisMethod,
    AnalysisRun,
    DataSource,
    PopulationExposureResult,
    Region,
    SourceVersion,
    engine,
    now,
)
from forudid_api.ingest import digest
from forudid_api.publish_historical import NOTE, json_bytes
from forudid_api.storage import put_immutable


def analyze(
    product_id: UUID,
    population_version: UUID,
    population_path: Path,
    velocity_path: Path,
    region_id: UUID | None = None,
) -> UUID:
    with Session(engine()) as db:
        item = catalog.product(db, product_id)
        method = population_v2 if item.kind == "velocity_los" and region_id else legacy_method
    method_id = uuid5(NAMESPACE_URL, f"forudid:analysis:{method.METHOD_VERSION}")
    definition = {
        "algorithm_sha256": digest(Path(method.__file__)),
        "ellipsoid": {"a": method.GEOD.a, "es": method.GEOD.es},
        "region_projection": "EPSG:6933",
        "region_max_segment_degrees": method.REGION_MAX_SEGMENT_DEGREES,
        "description": "Ellipsoid-area conservative population count allocation",
        "hazard_classification": False,
        "independent_scientific_validation": False,
    }
    with engine().connect() as lock:
        if not lock.scalar(text("SELECT pg_try_advisory_lock(702318)")):
            raise ValueError("Another analysis worker is active; run this after it finishes")
        lock.commit()
        try:
            with Session(engine()) as db, db.begin():
                region_geometry, region_input = None, None
                if region_id is not None:
                    row = db.execute(
                        select(Region, func.ST_AsGeoJSON(Region.geom)).where(Region.id == region_id)
                    ).first()
                    if row is None:
                        raise ValueError("Register the region first")
                    region, geometry_json = row
                    region_geometry = shape(json.loads(geometry_json))
                    region_version = db.get(SourceVersion, region.source_version_id)
                    if region_version is None:
                        raise ValueError("Region source version disappeared")
                    region_input = {
                        "id": str(region_id),
                        "name_fa": region.name_fa,
                        "name_en": region.name_en,
                        "source_version_id": str(region.source_version_id),
                        "source_sha256": region_version.checksum_sha256,
                        "geometry_sha256": hashlib.sha256(geometry_json.encode()).hexdigest(),
                        "quality": region.properties["quality"],
                    }
                product = catalog.product(db, product_id)
                if product.kind not in ("velocity_vertical", "velocity_los") or product.stats.get(
                    "is_fixture"
                ):
                    raise ValueError("A published real velocity product is required")
                bands = (
                    (-150, -100, -50, 0, 25)
                    if product.kind == "velocity_los"
                    else (0, 50, 100, 200, 400)
                )
                data = catalog.role_asset(db, product, "data")
                version = db.get(SourceVersion, population_version)
                if version is None:
                    raise ValueError("Register the population source first")
                source = db.get(DataSource, version.source_id)
                if source is None or source.source_type != "population":
                    raise ValueError("A registered population source is required")
                manifest = version.metadata_json.get("manifest", {})
                if manifest.get("unit") != "people/pixel" or not manifest.get(
                    "base_pixels_preserved"
                ):
                    raise ValueError("A verified population-count source is required")
                if (
                    digest(population_path) != manifest.get("normalized_sha256")
                    or digest(velocity_path) != data.checksum_sha256
                ):
                    raise ValueError("Local analysis inputs differ from their registered checksums")
                inputs = {
                    "method_version": method.METHOD_VERSION,
                    "method": definition,
                    "population_source_version_id": str(population_version),
                    "population_source_sha256": version.checksum_sha256,
                    "population_raster_sha256": manifest["normalized_sha256"],
                    "product_id": str(product_id),
                    "product_sha256": data.checksum_sha256,
                    "deformation_source_version_id": str(product.source_version_id),
                    "population_year": manifest["population_year"],
                    "population_unit": manifest["unit"],
                    "population_grid": manifest["grid"],
                    "population_estimated_total": manifest["estimated_total"],
                    "population_citation": manifest["provider"]["citation"],
                    "population_license": manifest["license"],
                    "deformation_period": [product.start_date, product.end_date],
                    "measurement_method": product.stats.get("measurement_method"),
                    "sign_convention": product.stats.get("sign_convention"),
                    "scope": "administrative_region"
                    if region_id
                    else "population_source_country_footprint",
                    "region": region_input,
                    "band_edges_mm_year": list(bands),
                    "runtime": {
                        name: importlib.metadata.version(name)
                        for name in ("numpy", "rasterio", "pyproj", "shapely")
                    },
                }
                if product.kind == "velocity_los":
                    inputs["measurement_component"] = "los"
                    inputs["reference"] = product.stats.get("reference")
                signature = hashlib.sha256(json_bytes(inputs)).hexdigest()
                run_id = uuid5(method_id, signature)
                registered = db.get(AnalysisMethod, method_id)
                if registered is None:
                    db.add(
                        AnalysisMethod(
                            id=method_id,
                            version=method.METHOD_VERSION,
                            status="experimental",
                            definition=definition,
                        )
                    )
                    db.flush()
                elif registered.definition != definition or registered.status == "deprecated":
                    raise ValueError("Method changed or deprecated; a new version is required")
                run = db.get(AnalysisRun, run_id)
                if run is not None and run.status == "published":
                    return run_id
                if run is None:
                    db.add(
                        AnalysisRun(
                            id=run_id,
                            method_id=method_id,
                            product_id=product_id,
                            source_version_id=population_version,
                            signature=signature,
                            inputs=inputs,
                            status="processing",
                            expected_assets=0,
                        )
                    )
                else:
                    run.status, run.error = "processing", None
                unit = product.unit
            try:
                with (
                    rasterio.Env(GDAL_CACHEMAX=32 * 1024 * 1024, GDAL_NUM_THREADS="1"),
                    rasterio.open(population_path) as population,
                    rasterio.open(velocity_path) as velocity,
                ):
                    result = method.population_exposure(
                        population,
                        velocity,
                        population_unit="people/pixel",
                        velocity_unit=unit,
                        band_edges_mm_year=bands,
                        region=region_geometry,
                    )
                if region_id is None and not math.isclose(
                    result["estimated_total"],
                    inputs["population_estimated_total"],
                    rel_tol=1e-12,
                    abs_tol=1e-7,
                ):
                    raise ValueError("Population total differs from the verified source manifest")
                result.update(analysis_run_id=str(run_id), inputs=inputs, disclaimer=NOTE)
                key = f"analysis/{run_id}/population.json"
                checksum, _ = put_immutable(key, json_bytes(result), "application/json")
                with Session(engine()) as db, db.begin():
                    db.add(
                        PopulationExposureResult(
                            id=uuid5(run_id, "population"),
                            analysis_run_id=run_id,
                            population_source_version_id=population_version,
                            population_year=inputs["population_year"],
                            region_id=region_id,
                            estimated_total=result["estimated_total"],
                            estimated_valid_coverage=result["estimated_valid_coverage"],
                            metrics=result,
                            object_key=key,
                            checksum_sha256=checksum,
                        )
                    )
                    run = db.get(AnalysisRun, run_id)
                    if run is None:
                        raise ValueError("Analysis run disappeared")
                    run.status, run.finished_at = "published", now()
            except Exception as exc:
                with Session(engine()) as db, db.begin():
                    run = db.get(AnalysisRun, run_id)
                    if run is not None:
                        run.status, run.error = "failed", type(exc).__name__
                raise
            return run_id
        finally:
            lock.execute(text("SELECT pg_advisory_unlock(702318)"))
            lock.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--product", required=True, type=UUID)
    parser.add_argument("--population-version", required=True, type=UUID)
    parser.add_argument("--population-raster", required=True, type=Path)
    parser.add_argument("--velocity-raster", required=True, type=Path)
    parser.add_argument("--region", type=UUID)
    args = parser.parse_args()
    print(
        analyze(
            args.product,
            args.population_version,
            args.population_raster,
            args.velocity_raster,
            args.region,
        )
    )
