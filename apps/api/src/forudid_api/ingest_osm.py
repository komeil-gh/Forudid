"""Acquire, normalize and archive a dated Iran OSM snapshot with bounded working sets."""

import argparse
import json
import math
from collections import Counter
from datetime import UTC, datetime
from importlib.metadata import version
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import NAMESPACE_URL, uuid5

import osmium
from osmium.filter import EntityFilter
from osmium.io import ThreadPool
from osmium.osm import WAY, Way
from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from forudid_api.config import settings
from forudid_api.db import DataSource, InfrastructureAsset, SourceVersion, engine
from forudid_api.ingest import digest, fetch_file
from forudid_api.storage import put_file

SNAPSHOT = "260904"
FILENAME = f"iran-{SNAPSHOT}.osm.pbf"
URL = f"https://download.geofabrik.de/asia/{FILENAME}"
SIZE = 229201696
MD5 = "474e3be4c6bc276996679f493e75f853"
PIPELINE = "osm-iran-ways-1"
SOURCE_ID = uuid5(NAMESPACE_URL, "https://download.geofabrik.de/asia/iran.html")
VERSION_ID = uuid5(SOURCE_ID, SNAPSHOT)
ROAD_CLASSES = {"motorway", "trunk", "primary", "secondary"}


def normalize(path: Path, directory: Path) -> dict:
    """Keep source ways intact; do not invent routes, names or missing coordinates."""
    directory.mkdir(parents=True, exist_ok=True)
    output = directory / "assets.ndjson"
    report_path = directory / "normalization.json"
    source_sha = digest(path)
    if report_path.exists():
        report = json.loads(report_path.read_text())
        if (
            report["source_sha256"] != source_sha
            or report["pipeline"] != PIPELINE
            or digest(output) != report["output_sha256"]
        ):
            raise ValueError("Immutable OSM normalization conflict")
        return report
    counts: Counter = Counter()
    with TemporaryDirectory(prefix="osm-normalize-", dir=directory) as temporary:
        root = Path(temporary)
        fp = osmium.FileProcessor(path, thread_pool=ThreadPool(1, 2))
        timestamp = fp.header.get("osmosis_replication_timestamp")
        fp.with_locations(f"sparse_file_array,{root / 'nodes.idx'}")
        fp.with_filter(EntityFilter(WAY))
        with (root / "assets.ndjson").open("w") as target:
            for way in fp:
                if not isinstance(way, Way):
                    continue
                tags = dict(way.tags)
                kinds = []
                if tags.get("railway") == "rail":
                    kinds.append(("railway", "rail"))
                if tags.get("highway") in ROAD_CLASSES:
                    kinds.append(("road", tags["highway"]))
                if not kinds:
                    continue
                counts["selected_ways"] += 1
                coords: list[tuple[float, float]] = []
                missing = False
                duplicates = 0
                for node in way.nodes:
                    if not node.location.valid():
                        missing = True
                        break
                    point = (node.lon, node.lat)
                    if not all(math.isfinite(v) for v in point):
                        missing = True
                        break
                    if coords and coords[-1] == point:
                        duplicates += 1
                    else:
                        coords.append(point)
                if missing or len(coords) < 2:
                    counts["rejected_missing_nodes" if missing else "rejected_degenerate"] += 1
                    continue
                geometry = {"type": "LineString", "coordinates": coords}
                for kind, asset_class in kinds:
                    record = {
                        "external_id": f"way/{way.id}",
                        "asset_type": kind,
                        "asset_class": asset_class,
                        "name": tags.get("name:fa") or tags.get("name"),
                        "geometry": geometry,
                        "properties": {
                            "osm_id": way.id,
                            "osm_version": way.version,
                            "all_tags": tags,
                        },
                        "data_quality": {
                            "source_feature": "raw_osm_way",
                            "consecutive_duplicate_nodes_removed": duplicates,
                            "completeness": "unknown",
                            "name_missing": not bool(tags.get("name:fa") or tags.get("name")),
                        },
                    }
                    target.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
                    counts[kind] += 1
                    counts[f"class/{asset_class}"] += 1
                if counts["selected_ways"] % 10000 == 0:
                    print(f"Normalized {counts['selected_ways']} selected OSM ways", flush=True)
        report = {
            "pipeline": PIPELINE,
            "source_sha256": source_sha,
            "output_sha256": digest(root / "assets.ndjson"),
            "replication_timestamp": timestamp or None,
            "tool": {"osmium": version("osmium")},
            "counts": dict(sorted(counts.items())),
            "selection": {"railway": ["rail"], "highway": sorted(ROAD_CLASSES)},
            "geometry": "EPSG:4326 LineString; consecutive duplicate coordinates removed only",
            "route_grouping": False,
            "completeness": "unknown",
        }
        (root / "normalization.json").write_text(
            json.dumps(report, indent=2, sort_keys=True) + "\n"
        )
        if output.exists():
            if digest(output) != report["output_sha256"]:
                raise ValueError("Existing normalized OSM output differs")
        else:
            output.hardlink_to(root / "assets.ndjson")
        report_path.hardlink_to(root / "normalization.json")
    return report


def publish(path: Path, directory: Path, report: dict) -> str:
    if path.name != FILENAME or path.stat().st_size != SIZE or digest(path, "md5") != MD5:
        raise ValueError("Expected the pinned, checksum-verified Iran extract")
    if (
        digest(path) != report["source_sha256"]
        or digest(directory / "assets.ndjson") != report["output_sha256"]
    ):
        raise ValueError("OSM artifact checksum mismatch")
    expected = report["counts"].get("railway", 0) + report["counts"].get("road", 0)
    if not expected or report["pipeline"] != PIPELINE:
        raise ValueError("Empty or incompatible infrastructure normalization")
    timestamp = datetime.fromisoformat(report["replication_timestamp"])
    if timestamp.tzinfo is None:
        raise ValueError("Source replication timestamp must include its timezone")
    prefix = f"sources/geofabrik-iran/{SNAPSHOT}"
    with Session(engine()) as db, db.begin():
        db.execute(text("SELECT pg_advisory_xact_lock(702317)"))
        existing = db.get(SourceVersion, VERSION_ID)
        if existing is not None:
            count = db.scalar(
                select(func.count())
                .select_from(InfrastructureAsset)
                .where(InfrastructureAsset.source_version_id == VERSION_ID)
            )
            if (
                existing.checksum_sha256 != report["source_sha256"]
                or count != expected
                or existing.metadata_json.get("normalization") != report
            ):
                raise ValueError("Immutable infrastructure snapshot conflict")
            return str(VERSION_ID)
        for artifact, media in [
            (path, "application/vnd.openstreetmap.data+pbf"),
            (directory / "assets.ndjson", "application/x-ndjson"),
            (directory / "normalization.json", "application/json"),
        ]:
            put_file(f"{prefix}/{artifact.name}", artifact, media)
        db.execute(
            insert(DataSource)
            .values(
                id=SOURCE_ID,
                slug="geofabrik-iran",
                name="راه و راه‌آهن ایران در OpenStreetMap",
                provider="OpenStreetMap contributors / Geofabrik",
                source_type="infrastructure",
                homepage="https://download.geofabrik.de/asia/iran.html",
                citation="OpenStreetMap contributors, Iran extract distributed by Geofabrik.",
                license_name="ODbL 1.0",
                license_url="https://opendatacommons.org/licenses/odbl/1-0/",
                attribution="© OpenStreetMap contributors; extract by Geofabrik",
                access_method="official_versioned_download",
                scientific_status="published_dataset",
            )
            .on_conflict_do_nothing(index_elements=[DataSource.id])
        )
        db.add(
            SourceVersion(
                id=VERSION_ID,
                source_id=SOURCE_ID,
                version=SNAPSHOT,
                data_date=timestamp.date(),
                valid_from=None,
                valid_to=None,
                downloaded_at=datetime.fromtimestamp(path.stat().st_mtime, UTC),
                original_uri=URL,
                object_uri=f"s3://{settings().s3_bucket}/{prefix}/{FILENAME}",
                checksum_sha256=report["source_sha256"],
                size_bytes=SIZE,
                metadata_json={
                    "normalization": report,
                    "validation_status": "geometry_checked",
                    "manifest": {
                        "files": [
                            {
                                "name": FILENAME,
                                "role": "infrastructure",
                                "size_bytes": SIZE,
                                "checksum_sha256": report["source_sha256"],
                            }
                        ]
                    },
                },
            )
        )
        db.flush()
        statement = text("""
            WITH g AS (SELECT ST_SetSRID(ST_GeomFromGeoJSON(:geometry),4326) AS geom)
            INSERT INTO assets (id,created_at,source_version_id,external_id,asset_type,
                asset_class,name,geom,length_m,properties,data_quality)
            SELECT :id,now(),:source_version_id,:external_id,:asset_type,:asset_class,:name,
                geom,ST_Length(geom::geography),CAST(:properties AS jsonb),
                CAST(:data_quality AS jsonb) || jsonb_build_object('is_simple',ST_IsSimple(geom))
            FROM g
        """)
        batch = []
        with (directory / "assets.ndjson").open() as stream:
            for line in stream:
                item = json.loads(line)
                item["id"] = uuid5(VERSION_ID, f"{item['external_id']}/{item['asset_type']}")
                item["source_version_id"] = VERSION_ID
                for key in ("geometry", "properties", "data_quality"):
                    item[key] = json.dumps(item[key], ensure_ascii=False)
                batch.append(item)
                if len(batch) == 500:
                    db.execute(statement, batch)
                    batch.clear()
            if batch:
                db.execute(statement, batch)
        count = db.scalar(
            select(func.count())
            .select_from(InfrastructureAsset)
            .where(InfrastructureAsset.source_version_id == VERSION_ID)
        )
        if count != expected:
            raise ValueError("Imported asset count differs from normalization report")
    return str(VERSION_ID)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    args.directory.mkdir(parents=True, exist_ok=True)
    path = args.directory / FILENAME
    fetch_file(URL, path, SIZE, MD5)
    normalized = args.directory / PIPELINE
    report = normalize(path, normalized)
    print(publish(path, normalized, report), flush=True)


if __name__ == "__main__":
    main()
