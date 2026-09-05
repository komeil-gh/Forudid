# Iran infrastructure snapshot — V2 milestone 4

Source: [Geofabrik Iran](https://download.geofabrik.de/asia/iran.html),
`iran-260904.osm.pbf`, 229,201,696 bytes. The PBF header records replication time
`2026-09-04T20:21:21Z`; this is separate from download time and is not a claim
about when each infrastructure feature was built or surveyed.

- Provider MD5: `474e3be4c6bc276996679f493e75f853`.
- Original SHA-256: `a32f6ccef5c98039bff2d98a63af2851513c7586d0237625fdf6324394c4b50f`.
- Normalized NDJSON SHA-256: `24991b0d01e2b15f76d89e12106df9eddedaa328fd643d86049383d9e08d42a1`.
- Registered source version: `b540a66b-41c4-58a9-9a68-e63f5ffb226d`.
- Original, normalized geometries and normalization report are archived in private
  object storage under `sources/geofabrik-iran/260904/`.

## Reproduce

```sh
uv run --project apps/api alembic -c apps/api/alembic.ini upgrade head
uv run --project apps/api python -m forudid_api.ingest_osm data/sources/geofabrik-iran/260904
FORUDID_OSM_TESTS=1 uv run --project apps/api pytest apps/api/tests/test_osm.py -q
```

PyOsmium 4.3.1 uses one parser worker, a two-item read queue and a disk-backed
sparse node index. PostGIS ingestion uses batches of 500 rows in a transaction;
the snapshot becomes visible atomically. Working node indexes are removed after
normalization. Original downloads and verified normalized results are preserved.

## Verified local counts — 2026-09-05

| Selection | Imported ways |
| --- | ---: |
| railway=rail | 12,722 |
| highway=motorway | 3,190 |
| highway=trunk | 25,523 |
| highway=primary | 28,375 |
| highway=secondary | 63,305 |
| Total | 133,115 |

All selected ways had complete, non-degenerate geometry. PostgreSQL confirmed
valid, non-empty LineStrings and positive geodesic lengths. The geometry GIST
index, bounded API pagination, bounding-box rejection and real feature reads
passed. The parser test independently exercises missing nodes, duplicate points,
excluded residential roads, missing names and checksum conflicts with software
test data that is never published.

A sampled unnamed closed way `way/1164145248` remains a closed LineString with
205.2 m length, not a zero-length line inferred from identical endpoints.
`way/1239576696` retains the source name «راه آهن مشهد - بافق» and its 7.1 m
source-way length. These examples illustrate why a way is not a complete route.

## Contract and limits

`GET /api/v1/assets` returns bounded metadata with an explicit source version and
cursor. `GET /api/v1/assets/{uuid}` returns one GeoJSON feature with attribution.
The identity combines source version, OSM way ID and asset type. Original tags,
OSM version and Persian/English names remain in properties. Unnamed ways stay
unnamed; only consecutive duplicate coordinates are removed. Length is computed
by `ST_Length(geom::geography)` in metres, never from angular geometry length.

This MVP analyzes raw ways; route grouping has not been established. Link roads,
residential roads, abandoned rail, buildings and other asset types are outside
the current selection. OSM completeness and positional accuracy are unknown.
Parallel tracks, divided carriageways and overlaps must not be described as
deduplicated route kilometres. Bridge/tunnel tags are retained for interpretation.
The 2026 infrastructure snapshot does not establish infrastructure presence during
the deformation observation period 2014–2020.

Attribution: © OpenStreetMap contributors; extract by Geofabrik, licensed under
[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
