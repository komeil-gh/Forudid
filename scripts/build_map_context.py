"""Build small, source-pinned cartographic context and a local OSM place index."""

import argparse
import hashlib
import json
from pathlib import Path

import osmium
from shapely.geometry import box, mapping, shape

ROOT = Path(__file__).resolve().parents[1]
COUNTRY_SHA = "3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb"
OSM_SHA = "a32f6ccef5c98039bff2d98a63af2851513c7586d0237625fdf6324394c4b50f"


def checksum(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


class Places(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.places = []

    def node(self, node):
        kind = node.tags.get("place")
        if kind not in ("city", "town") or not node.location.valid():
            return
        name = node.tags.get("name")
        if not name:
            return
        self.places.append(
            {
                "id": node.id,
                "name": name,
                "name_fa": node.tags.get("name:fa", name),
                "name_en": node.tags.get("name:en", name),
                "kind": kind,
                "capital": node.tags.get("capital") == "yes"
                or node.tags.get("capital") == "2",
                "lon": node.location.lon,
                "lat": node.location.lat,
            }
        )


def build(countries: Path, pbf: Path):
    if checksum(countries) != COUNTRY_SHA or checksum(pbf) != OSM_SHA:
        raise ValueError("Context input differs from the reviewed source snapshot")
    extent = box(30, 10, 85, 60)
    features, labels = [], []
    for feature in json.loads(countries.read_text())["features"]:
        geometry = shape(feature["geometry"])
        if not geometry.intersects(extent):
            continue
        p = feature["properties"]
        properties = {
            "code": p["ADM0_A3"],
            "name_en": p["NAME_EN"],
            "name_fa": p["NAME_FA"],
        }
        features.append(
            {
                "type": "Feature",
                "properties": properties,
                "geometry": mapping(geometry.intersection(extent)),
            }
        )
        if extent.covers(
            shape({"type": "Point", "coordinates": [p["LABEL_X"], p["LABEL_Y"]]})
        ):
            labels.append({**properties, "lon": p["LABEL_X"], "lat": p["LABEL_Y"]})
    handler = Places()
    handler.apply_file(str(pbf), locations=False)
    if not any(place["name_en"] == "Tehran" for place in handler.places):
        raise ValueError("The place index failed its Tehran source check")
    output = ROOT / "apps/web/public/map"
    output.mkdir(exist_ok=True)
    context = {"type": "FeatureCollection", "features": features}
    places = {
        "places": sorted(handler.places, key=lambda p: p["id"]),
        "countries": labels,
    }
    manifest = {
        "countries": {
            "provider": "Natural Earth",
            "sha256": COUNTRY_SHA,
            "source_url": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
            "9380cca83db5f9aef52d5e762765100745f84b27/geojson/ne_50m_admin_0_countries.geojson",
            "license": "Public domain",
            "scale": "1:50 million",
            "purpose": "Generalized map context; not analysis or official boundaries",
        },
        "places": {
            "provider": "OpenStreetMap contributors / Geofabrik",
            "sha256": OSM_SHA,
            "source_url": "https://download.geofabrik.de/asia/iran-260904.osm.pbf",
            "snapshot": "2026-09-04T20:21:21Z",
            "license": "ODbL-1.0",
            "filter": "Named city and town nodes; original OSM identifiers and names",
            "count": len(handler.places),
            "coverage": "Imported snapshot only; incomplete",
        },
    }
    for name, content in (("countries.geojson", context), ("places.json", places)):
        body = (
            json.dumps(content, ensure_ascii=False, separators=(",", ":")) + "\n"
        ).encode()
        (output / name).write_bytes(body)
        manifest[name] = {
            "size_bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest(),
        }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--countries", type=Path, required=True)
    parser.add_argument("--osm", type=Path, required=True)
    args = parser.parse_args()
    build(args.countries, args.osm)
