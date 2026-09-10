"""Precompute reproducible native-grid exposure, one OSM way at a time."""

import argparse
import hashlib
import importlib.metadata
import json
import logging
from pathlib import Path
from uuid import NAMESPACE_URL, UUID, uuid5

import forudid_analysis
import rasterio
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from forudid_api import catalog
from forudid_api.db import (
    AnalysisMethod,
    AnalysisRun,
    AssetExposureSummary,
    DataSource,
    ExposureSegment,
    InfrastructureAsset,
    SourceVersion,
    engine,
    now,
)
from forudid_api.ingest import digest
from forudid_api.publish_historical import NOTE, json_bytes
from forudid_api.storage import put_immutable, read_url

log = logging.getLogger(__name__)


def analyze(
    product_id: UUID,
    source_version_id: UUID,
    *,
    asset_id: UUID | None = None,
    asset_type: str | None = None,
    edges: tuple[float, ...] | None = None,
    local_raster: Path | None = None,
) -> UUID:
    if (asset_id is None) == (asset_type is None) or asset_type not in (None, "road", "railway"):
        raise ValueError("Choose one asset or one infrastructure type")
    if asset_type and local_raster is None:
        raise ValueError("Bulk analysis requires a checksummed local raster")
    method_id = uuid5(NAMESPACE_URL, f"forudid:analysis:{forudid_analysis.METHOD_VERSION}")
    definition = {
        "algorithm_sha256": digest(Path(forudid_analysis.__file__)),
        "description": "Length-weighted native containing-pixel descriptive exposure",
        "hazard_classification": False,
        "independent_scientific_validation": False,
    }
    query = select(InfrastructureAsset.id).where(
        InfrastructureAsset.source_version_id == source_version_id
    )
    query = query.where(
        InfrastructureAsset.id == asset_id
        if asset_id
        else InfrastructureAsset.asset_type == asset_type
    )
    # One bounded worker also prevents two resumptions publishing the same run concurrently.
    with engine().connect() as lock:
        if not lock.scalar(text("SELECT pg_try_advisory_lock(702318)")):
            raise ValueError("An exposure worker is already active")
        lock.commit()
        try:
            with Session(engine()) as db, db.begin():
                product = catalog.product(db, product_id)
                if product.kind not in ("velocity_los", "velocity_vertical") or product.stats.get(
                    "is_fixture"
                ):
                    raise ValueError("Exposure requires a published real velocity product")
                if edges is None:
                    edges = (
                        (-150, -100, -50, 0, 25)
                        if product.kind == "velocity_los"
                        else (0, 50, 100, 200, 400)
                    )
                data = catalog.role_asset(db, product, "data")
                if local_raster is not None and digest(local_raster) != data.checksum_sha256:
                    raise ValueError("Local raster does not match the published product checksum")
                version = db.get(SourceVersion, source_version_id)
                if version is None:
                    raise ValueError("Infrastructure source version is not registered")
                provider = db.get(DataSource, version.source_id)
                if provider is None or provider.source_type != "infrastructure":
                    raise ValueError("Expected an infrastructure source")
                expected = db.scalar(select(func.count()).select_from(query.subquery()))
                if not expected:
                    raise ValueError("No assets match the exact source and scope")
                inputs = {
                    "method_version": forudid_analysis.METHOD_VERSION,
                    "method": definition,
                    "product_id": str(product_id),
                    "product_sha256": data.checksum_sha256,
                    "deformation_source_version_id": str(product.source_version_id),
                    "infrastructure_source_version_id": str(source_version_id),
                    "infrastructure_source_sha256": version.checksum_sha256,
                    "infrastructure_data_date": str(version.data_date),
                    "deformation_period": [product.start_date, product.end_date],
                    "source_unit": product.unit,
                    "measurement_component": product.stats.get("measurement_component"),
                    "measurement_method": product.stats.get("measurement_method"),
                    "sign_convention": product.stats.get("sign_convention"),
                    "reference_description": product.stats.get("reference_description"),
                    "attributions": [provider.attribution, product.stats.get("attribution")],
                    "asset_id": str(asset_id) if asset_id else None,
                    "asset_type": asset_type,
                    "band_edges_mm_year": list(edges),
                    "spacing_fraction": 0.5,
                    "runtime": {
                        name: importlib.metadata.version(name)
                        for name in ("numpy", "rasterio", "pyproj", "shapely")
                    },
                }
                if product.kind == "velocity_los":
                    inputs["reference"] = product.stats.get("reference")
                signature = hashlib.sha256(json_bytes(inputs)).hexdigest()
                run_id = uuid5(method_id, signature)
                method = db.get(AnalysisMethod, method_id)
                if method is None:
                    db.add(
                        AnalysisMethod(
                            id=method_id,
                            version=forudid_analysis.METHOD_VERSION,
                            status="experimental",
                            definition=definition,
                        )
                    )
                    db.flush()
                elif method.definition != definition or method.status == "deprecated":
                    raise ValueError("Method changed or deprecated; register a new method version")
                run = db.get(AnalysisRun, run_id)
                if run is not None and run.status == "published":
                    return run_id
                if run is None:
                    run = AnalysisRun(
                        id=run_id,
                        method_id=method_id,
                        product_id=product_id,
                        source_version_id=source_version_id,
                        signature=signature,
                        inputs=inputs,
                        status="processing",
                        expected_assets=expected,
                    )
                    db.add(run)
                else:
                    if run.inputs != inputs or run.expected_assets != expected:
                        raise ValueError("Analysis input identity conflict")
                    run.status, run.error = "processing", None
                raster_path = str(local_raster) if local_raster else read_url(data.object_key)
                unit = product.unit
                completed = (
                    db.scalar(
                        select(func.count())
                        .select_from(AssetExposureSummary)
                        .where(AssetExposureSummary.analysis_run_id == run_id)
                    )
                    or 0
                )
            pending_assets = query.where(
                ~select(AssetExposureSummary.id)
                .where(
                    AssetExposureSummary.analysis_run_id == run_id,
                    AssetExposureSummary.asset_id == InfrastructureAsset.id,
                )
                .exists()
            )
            log.info(
                "Analysis %s: resuming with %d/%d ways already stored", run_id, completed, expected
            )
            try:
                with (
                    rasterio.Env(GDAL_CACHEMAX=32 * 1024 * 1024, GDAL_NUM_THREADS="1"),
                    rasterio.open(raster_path) as raster,
                ):
                    cursor = None
                    while True:
                        with Session(engine()) as db:
                            page = pending_assets.order_by(InfrastructureAsset.id).limit(100)
                            if cursor is not None:
                                page = page.where(InfrastructureAsset.id > cursor)
                            identities = list(db.scalars(page))
                        if not identities:
                            break
                        for identity in identities:
                            with Session(engine()) as db, db.begin():
                                summary_id = uuid5(run_id, str(identity))
                                if db.get(AssetExposureSummary, summary_id) is not None:
                                    continue
                                geometry = db.scalar(
                                    select(func.ST_AsGeoJSON(InfrastructureAsset.geom)).where(
                                        InfrastructureAsset.id == identity
                                    )
                                )
                                if geometry is None:
                                    raise ValueError("Asset disappeared during analysis")
                                result = forudid_analysis.line_exposure(
                                    raster,
                                    json.loads(geometry)["coordinates"],
                                    unit=unit,
                                    band_edges_mm_year=edges,
                                )
                                result.update(
                                    analysis_run_id=str(run_id),
                                    asset_id=str(identity),
                                    inputs=inputs,
                                    disclaimer=NOTE,
                                )
                                key = f"analysis/{run_id}/{identity}.json"
                                checksum, _ = put_immutable(
                                    key, json_bytes(result), "application/json"
                                )
                                summary = result["summary"]
                                summary["profile_count"] = len(result["profile"])
                                for page_start in range(0, len(result["profile"]), 1000):
                                    put_immutable(
                                        f"{key}.profile-{page_start // 1000}.json",
                                        json_bytes(
                                            result["profile"][page_start : page_start + 1000]
                                        ),
                                        "application/json",
                                    )
                                db.add(
                                    AssetExposureSummary(
                                        id=summary_id,
                                        analysis_run_id=run_id,
                                        asset_id=identity,
                                        total_length_m=summary["total_length_m"],
                                        valid_length_m=summary["valid_length_m"],
                                        coverage_fraction=min(1.0, summary["coverage_fraction"]),
                                        segment_count=len(result["segments"]),
                                        metrics=summary,
                                        profile_key=key,
                                        checksum_sha256=checksum,
                                    )
                                )
                                db.flush()
                                for ordinal, segment in enumerate(result["segments"]):
                                    db.add(
                                        ExposureSegment(
                                            id=uuid5(summary_id, str(ordinal)),
                                            summary_id=summary_id,
                                            ordinal=ordinal,
                                            start_chainage_m=segment["start_chainage_m"],
                                            end_chainage_m=segment["end_chainage_m"],
                                            band_index=segment["band_index"],
                                            geom=func.ST_SetSRID(
                                                func.ST_GeomFromGeoJSON(
                                                    json.dumps(segment["geometry"])
                                                ),
                                                4326,
                                            ),
                                            metrics={
                                                k: v for k, v in segment.items() if k != "geometry"
                                            },
                                        )
                                    )
                        cursor = identities[-1]
                        completed += len(identities)
                        log.info("Analysis %s: %d/%d ways stored", run_id, completed, expected)
                with Session(engine()) as db, db.begin():
                    count = db.scalar(
                        select(func.count())
                        .select_from(AssetExposureSummary)
                        .where(AssetExposureSummary.analysis_run_id == run_id)
                    )
                    run = db.get(AnalysisRun, run_id)
                    if run is None or count != run.expected_assets:
                        raise ValueError("Analysis incomplete; publication refused")
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
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--product", required=True, type=UUID)
    parser.add_argument("--source-version", required=True, type=UUID)
    scope = parser.add_mutually_exclusive_group(required=True)
    scope.add_argument("--asset", type=UUID)
    scope.add_argument("--type", choices=("road", "railway"))
    parser.add_argument(
        "--raster", type=Path, help="Optional local COG; its SHA-256 must match publication"
    )
    args = parser.parse_args()
    print(
        analyze(
            args.product,
            args.source_version,
            asset_id=args.asset,
            asset_type=args.type,
            local_raster=args.raster,
        )
    )
