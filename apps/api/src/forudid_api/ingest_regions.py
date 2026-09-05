"""Register the pinned geoBoundaries ADM1 source, retaining source inconsistencies."""

import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen
from uuid import NAMESPACE_URL, uuid5

from shapely import union_all
from shapely.geometry import MultiPolygon, Polygon, mapping, shape
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from forudid_api.config import settings
from forudid_api.db import DataSource, Region, SourceVersion, engine, now
from forudid_api.ingest import digest, fetch_file
from forudid_api.publish_historical import json_bytes
from forudid_api.storage import put_file, put_immutable

SOURCE_URL = "https://www.geoboundaries.org/api/current/gbOpen/IRN/ADM1/"
SOURCE_ID = uuid5(NAMESPACE_URL, SOURCE_URL)
VERSION = "IRN-ADM1-17685810"
VERSION_ID = uuid5(SOURCE_ID, VERSION)
SOURCE_SHA256 = "564a3eeff1e12ec0b3bfc55d027b0a2b05cefab521ee0b2e487446db12dec70d"
DOWNLOAD_URL = "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IRN/ADM1/geoBoundaries-IRN-ADM1.geojson"
NAMES = {
    "Alborz": "البرز",
    "Ardabil": "اردبیل",
    "Bushehr": "بوشهر",
    "Chaharmahal and Bakhtiari": "چهارمحال و بختیاری",
    "East Azerbaijan": "آذربایجان شرقی",
    "Fars": "فارس",
    "Gilan": "گیلان",
    "Golestan": "گلستان",
    "Hamadan": "همدان",
    "Hormozgan": "هرمزگان",
    "Ilam": "ایلام",
    "Isfahan": "اصفهان",
    "Kerman": "کرمان",
    "Kermanshah": "کرمانشاه",
    "Khuzestan": "خوزستان",
    "Kohgiluyeh and Boyer-Ahmad": "کهگیلویه و بویراحمد",
    "Kurdistan": "کردستان",
    "Lorestan": "لرستان",
    "Markazi": "مرکزی",
    "Mazandaran": "مازندران",
    "North Khorasan": "خراسان شمالی",
    "Qazvin": "قزوین",
    "Qom": "قم",
    "Razavi Khorasan": "خراسان رضوی",
    "Semnan": "سمنان",
    "Sistan and Baluchestan": "سیستان و بلوچستان",
    "South Khorasan": "خراسان جنوبی",
    "Tehran": "تهران",
    "West Azerbaijan": "آذربایجان غربی",
    "Yazd": "یزد",
    "Zanjan": "زنجان",
}


def register(directory: Path) -> str:
    metadata = json.loads((directory / "provider-metadata.json").read_text())
    if metadata["boundaryID"] != VERSION or metadata["gjDownloadURL"] != DOWNLOAD_URL:
        raise ValueError("Unexpected boundary source version")
    if metadata["boundaryLicense"] != "Open Data Commons Open Database License 1.0":
        raise ValueError("Boundary source license changed")
    source = directory / "geoBoundaries-IRN-ADM1.geojson"
    if digest(source) != SOURCE_SHA256:
        raise ValueError("Boundary file differs from the pinned official snapshot")
    document = json.loads(source.read_text())
    groups = {}
    for feature in document["features"]:
        properties = feature["properties"]
        geometry = shape(feature["geometry"])
        if (
            properties["shapeGroup"] != "IRN"
            or properties["shapeType"] != "ADM1"
            or not geometry.is_valid
            or geometry.is_empty
        ):
            raise ValueError("Invalid source boundary geometry or identity")
        west, south, east, north = geometry.bounds
        if not (43 <= west < east <= 64 and 24 <= south < north <= 41):
            raise ValueError("Boundary lies outside the expected source geography")
        groups.setdefault(properties["shapeName"], []).append(feature)
    normalized = []
    for name, features in sorted(groups.items()):
        codes = {f["properties"]["shapeISO"] for f in features}
        if len(codes) != 1 or name not in NAMES:
            raise ValueError("Ambiguous region code or untranslated source name")
        geometry = union_all([shape(f["geometry"]) for f in features])
        if isinstance(geometry, Polygon):
            geometry = MultiPolygon([geometry])
        if geometry.geom_type != "MultiPolygon" or not geometry.is_valid:
            raise ValueError("Region union is not a valid multipolygon")
        normalized.append(
            {
                "name_en": name,
                "name_fa": NAMES[name],
                "source_code": codes.pop(),
                "geometry": mapping(geometry),
                "bbox": list(geometry.bounds),
                "source_feature_ids": [f["properties"]["shapeID"] for f in features],
            }
        )
    report = {
        "provider": metadata,
        "source_sha256": digest(source),
        "source_feature_count": len(document["features"]),
        "provider_unit_count": int(metadata["admUnitCount"]),
        "normalized_region_count": len(normalized),
        "normalization": "union-identical-source-name-and-code-1",
        "regions": normalized,
        "quality": {
            "provider_count_matches_file": int(metadata["admUnitCount"])
            == len(document["features"]),
            "missing_source_codes": [r["name_en"] for r in normalized if r["source_code"] is None],
            "historical_year": metadata["boundaryYearRepresented"],
            "independent_boundary_validation": False,
        },
    }
    body = json_bytes(report)

    checksum = hashlib.sha256(body).hexdigest()
    prefix = f"sources/geoboundaries/{VERSION}"
    with Session(engine()) as db, db.begin():
        existing = db.get(SourceVersion, VERSION_ID)
        if existing is not None:
            if existing.checksum_sha256 != checksum or db.scalar(
                select(func.count())
                .select_from(Region)
                .where(Region.source_version_id == VERSION_ID)
            ) != len(normalized):
                raise ValueError("Immutable boundary publication conflict")
            return str(VERSION_ID)
        put_file(f"{prefix}/{source.name}", source, "application/geo+json")
        put_immutable(f"{prefix}/normalization.json", body, "application/json")
        if db.get(DataSource, SOURCE_ID) is None:
            db.add(
                DataSource(
                    id=SOURCE_ID,
                    slug="geoboundaries-iran-adm1",
                    name="مرزهای اداری ایران، منبع تاریخی geoBoundaries",
                    provider="geoBoundaries / OpenStreetMap / Wambacher",
                    source_type="boundary",
                    homepage=SOURCE_URL,
                    citation="geoBoundaries gbOpen IRN ADM1, IRN-ADM1-17685810; "
                    "source year 2017; build December 2023.",
                    license_name="ODbL 1.0",
                    license_url="https://www.openstreetmap.org/copyright",
                    attribution="© OpenStreetMap contributors; Wambacher; geoBoundaries",
                    access_method="pinned_git_download",
                    scientific_status="published_dataset",
                )
            )
            db.flush()
        db.add(
            SourceVersion(
                id=VERSION_ID,
                source_id=SOURCE_ID,
                version=VERSION,
                data_date=None,
                valid_from=None,
                valid_to=None,
                downloaded_at=now(),
                original_uri=DOWNLOAD_URL,
                object_uri=f"s3://{settings().s3_bucket}/{prefix}/normalization.json",
                checksum_sha256=checksum,
                size_bytes=len(body),
                metadata_json={
                    "provider": metadata,
                    "quality": report["quality"],
                    "source_sha256": report["source_sha256"],
                    "region_count": len(normalized),
                },
            )
        )
        db.flush()
        for region in normalized:
            geometry = func.ST_SetSRID(
                func.ST_GeomFromGeoJSON(json.dumps(region["geometry"])), 4326
            )
            area = db.scalar(select(func.ST_Area(func.Geography(geometry))))
            db.add(
                Region(
                    id=uuid5(VERSION_ID, region["name_en"]),
                    source_version_id=VERSION_ID,
                    name_en=region["name_en"],
                    name_fa=region["name_fa"],
                    source_code=region["source_code"],
                    geom=geometry,
                    area_m2=area,
                    bbox=region["bbox"],
                    properties={
                        "source_feature_ids": region["source_feature_ids"],
                        "quality": report["quality"],
                    },
                )
            )
    return str(VERSION_ID)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    directory = parser.parse_args().directory
    directory.mkdir(parents=True, exist_ok=True)
    metadata = directory / "provider-metadata.json"
    if not metadata.exists():
        with urlopen(SOURCE_URL, timeout=60) as response:
            provider = json.loads(response.read(2_000_000))
        with metadata.open("xb") as output:
            output.write(json_bytes(provider))
    fetch_file(
        DOWNLOAD_URL,
        directory / "geoBoundaries-IRN-ADM1.geojson",
        9458408,
        SOURCE_SHA256,
        algorithm="sha256",
    )
    print(register(directory))
