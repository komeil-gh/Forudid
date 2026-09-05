"""Precompute clipped infrastructure lengths from published descriptive segments."""

import argparse
import hashlib
import math
from pathlib import Path
from uuid import NAMESPACE_URL, UUID, uuid5

from geoalchemy2 import Geography
from sqlalchemy import case, cast, func, select, text
from sqlalchemy.orm import Session

from forudid_api import catalog
from forudid_api.db import (
    AnalysisMethod,
    AnalysisRun,
    AssetExposureSummary,
    ExposureSegment,
    Region,
    RegionalInfrastructureResult,
    SourceVersion,
    engine,
    now,
)
from forudid_api.ingest import digest
from forudid_api.publish_historical import NOTE, json_bytes
from forudid_api.storage import put_immutable

METHOD_VERSION = "region-segment-clip-1"


def clipped_length(line, boundary=None):
    geometry = (
        line
        if boundary is None
        else case(
            (func.ST_CoveredBy(line, boundary), line),
            else_=func.ST_CollectionExtract(func.ST_Intersection(line, boundary), 2),
        )
    )
    return func.ST_Length(cast(geometry, Geography(srid=4326)), True)


def aggregate(db: Session, upstream: AnalysisRun, region: Region | None):
    edges = upstream.inputs["band_edges_mm_year"]
    length = clipped_length(ExposureSegment.geom, region.geom if region else None)
    query = (
        select(AssetExposureSummary.asset_id, ExposureSegment.band_index, func.sum(length))
        .join(ExposureSegment, ExposureSegment.summary_id == AssetExposureSummary.id)
        .where(AssetExposureSummary.analysis_run_id == upstream.id)
    )
    if region:
        query = query.where(func.ST_Intersects(ExposureSegment.geom, region.geom))
    query = (
        query.group_by(AssetExposureSummary.asset_id, ExposureSegment.band_index)
        .order_by(AssetExposureSummary.asset_id)
        .execution_options(yield_per=100)
    )
    bins = [0.0] * (len(edges) + 1)
    missing, count, covered_count = 0.0, 0, 0
    previous, previous_covered = None, None
    for asset_id, band, meters in db.execute(query):
        if not math.isfinite(meters) or meters < 0:
            raise ValueError("Invalid clipped length")
        if meters == 0:
            continue
        if asset_id != previous:
            count += 1
            previous = asset_id
        if band is None:
            missing += meters
        else:
            if not 0 <= band < len(bins):
                raise ValueError("Segment band does not match the upstream band profile")
            bins[band] += meters
            if asset_id != previous_covered:
                covered_count += 1
                previous_covered = asset_id
    valid = math.fsum(bins)
    total = math.fsum([valid, missing])
    if region is None and count != upstream.expected_assets:
        raise ValueError("Country segment inventory differs from the complete parent analysis")
    return {
        "way_count": count,
        "ways_with_valid_data": covered_count,
        "total_length_m": total,
        "valid_length_m": valid,
        "nodata_length_m": missing,
        "coverage_fraction": valid / total if total else None,
        "length_by_numeric_band_m": bins,
        "band_edges_mm_year": edges,
        "hazard_length_m": None,
    }


def analyze(upstream_id: UUID, region_id: UUID | None = None) -> UUID:
    method_id = uuid5(NAMESPACE_URL, f"forudid:analysis:{METHOD_VERSION}")
    definition = {
        "algorithm_sha256": digest(Path(__file__)),
        "intersection": "EPSG:4326 geometry XY intersection, linear edges",
        "length": "PostGIS geography WGS84 inverse geodesic on clipped segments",
        "scope": "summed OSM ways, not deduplicated network length",
        "boundary_touches": "zero-length point intersections excluded; coincident edges included",
        "hazard_classification": False,
        "independent_scientific_validation": False,
    }
    with engine().connect() as lock:
        if not lock.scalar(text("SELECT pg_try_advisory_lock(702318)")):
            raise ValueError("Another analysis worker is active")
        lock.commit()
        try:
            with Session(engine()) as db, db.begin():
                db.execute(text("SET LOCAL max_parallel_workers_per_gather = 0"))
                db.execute(text("SET LOCAL work_mem = '8MB'"))
                db.execute(text("SET LOCAL statement_timeout = '180s'"))
                upstream = db.get(AnalysisRun, upstream_id)
                if upstream is None or upstream.status != "published":
                    raise ValueError("A published full infrastructure analysis is required")
                parent_method = db.get(AnalysisMethod, upstream.method_id)
                if parent_method is None or parent_method.status == "deprecated":
                    raise ValueError("The upstream method is unavailable")
                asset_type = upstream.inputs.get("asset_type")
                if asset_type not in ("road", "railway") or upstream.inputs.get("asset_id"):
                    raise ValueError("The upstream scope must be a complete infrastructure type")
                catalog.product(db, upstream.product_id)
                region = db.get(Region, region_id) if region_id else None
                if region_id and region is None:
                    raise ValueError("Register the requested region first")
                region_input = None
                if region:
                    version = db.get(SourceVersion, region.source_version_id)
                    if version is None:
                        raise ValueError("Boundary source version is unavailable")
                    geometry = db.scalar(
                        select(func.ST_AsEWKB(Region.geom)).where(Region.id == region.id)
                    )
                    if geometry is None:
                        raise ValueError("Boundary geometry is unavailable")
                    region_input = {
                        "id": str(region.id),
                        "name_fa": region.name_fa,
                        "name_en": region.name_en,
                        "source_version_id": str(region.source_version_id),
                        "source_sha256": version.checksum_sha256,
                        "geometry_sha256": hashlib.sha256(bytes(geometry)).hexdigest(),
                        "quality": region.properties["quality"],
                    }
                inputs = {
                    "method_version": METHOD_VERSION,
                    "method": definition,
                    "postgis_version": db.scalar(text("SELECT postgis_full_version()")),
                    "upstream_run_id": str(upstream_id),
                    "upstream_signature": upstream.signature,
                    "upstream_inputs": upstream.inputs,
                    "region": region_input,
                    "scope": "clipped_administrative_region"
                    if region
                    else "entire_infrastructure_snapshot",
                }
                signature = hashlib.sha256(json_bytes(inputs)).hexdigest()
                run_id = uuid5(method_id, signature)
                registered = db.get(AnalysisMethod, method_id)
                if registered is None:
                    db.add(
                        AnalysisMethod(
                            id=method_id,
                            version=METHOD_VERSION,
                            status="experimental",
                            definition=definition,
                        )
                    )
                    db.flush()
                elif registered.definition != definition or registered.status == "deprecated":
                    raise ValueError("Method changed or deprecated; a new version is required")
                existing = db.get(AnalysisRun, run_id)
                if existing and existing.status == "published":
                    return run_id
                if existing:
                    raise ValueError("Unexpected existing unpublished regional run")
                metrics = aggregate(db, upstream, region)
                document = {
                    "analysis_run_id": str(run_id),
                    "inputs": inputs,
                    "metrics": metrics,
                    "disclaimer": NOTE,
                }
                key = f"analysis/{run_id}/regional-infrastructure.json"
                checksum, _ = put_immutable(key, json_bytes(document), "application/json")
                db.add(
                    AnalysisRun(
                        id=run_id,
                        method_id=method_id,
                        product_id=upstream.product_id,
                        source_version_id=upstream.source_version_id,
                        signature=signature,
                        inputs=inputs,
                        status="published",
                        expected_assets=metrics["way_count"],
                        finished_at=now(),
                    )
                )
                db.flush()
                db.add(
                    RegionalInfrastructureResult(
                        id=uuid5(run_id, "regional-infrastructure"),
                        analysis_run_id=run_id,
                        upstream_run_id=upstream_id,
                        region_id=region_id,
                        asset_type=asset_type,
                        metrics=metrics,
                        object_key=key,
                        checksum_sha256=checksum,
                    )
                )
            return run_id
        finally:
            lock.execute(text("SELECT pg_advisory_unlock(702318)"))
            lock.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream-run", type=UUID, required=True)
    scope = parser.add_mutually_exclusive_group()
    scope.add_argument("--region", type=UUID)
    scope.add_argument("--all-regions", action="store_true")
    args = parser.parse_args()
    if args.all_regions:
        with Session(engine()) as db:
            regions = list(db.scalars(select(Region.id).order_by(Region.id)))
        for region_id in [None, *regions]:
            print(region_id, analyze(args.upstream_run, region_id), flush=True)
    else:
        print(analyze(args.upstream_run, args.region))
