# 0013 — Martin for vector tiles

Status: accepted architecture; implementation stage 5.

## Problem and decision

National road networks are unsuitable for browser GeoJSON. Martin serves PostGIS MVT; TiTiler retains raster delivery and FastAPI serves metadata and results. Martin runs on internal Compose port 3000 behind `/vector/*`; it needs no separate public port.

Following the [Martin configuration documentation](https://maplibre.org/martin/config-file/), disable automatic discovery. Allow only `tiles_railways`, `tiles_major_roads`, `tiles_exposure_segments` and `tiles_regions`. The database role receives SELECT on these views only. Result views restrict records to published analyses and explicit source versions. Read selection UUIDs from explicit properties. Exclude `all_tags`, private URIs and private data from tiles.

## Dependency and acceptance

Martin and a custom `ST_AsMVT` endpoint were considered. The specification selects Martin; do not duplicate its server in FastAPI. Check upstream maintenance and pin the version/image during installation. Acceptance requires real MVT, asset-ID retrieval, no draft or unauthorized-table exposure, bounded payloads and pilot pan/zoom. GeoJSON remains appropriate for small selections.
