# Historical administrative boundaries

The registered source is [geoBoundaries gbOpen Iran ADM1](https://www.geoboundaries.org/api/current/gbOpen/IRN/ADM1/), boundary ID `IRN-ADM1-17685810`, representing 2017, built in December 2023. Its source attribution is OpenStreetMap / Wambacher and its licence is ODbL 1.0. It is not represented as the current official Iranian administrative boundary.

The exact source file is pinned to [geoBoundaries commit 9469f09](https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IRN/ADM1/geoBoundaries-IRN-ADM1.geojson). It contains 9,458,408 bytes and has local SHA-256 `564a3eeff1e12ec0b3bfc55d027b0a2b05cefab521ee0b2e487446db12dec70d`.

Provider metadata reports 33 units, while the file has 32 geometries and 31 unique source names. Mazandaran has two parts with different source feature IDs; these are dissolved only because both source name and source code match. Both feature IDs remain attached to the normalized region. Tehran has no source ISO code; the code stays null. Historical source codes are not silently replaced with current ones.

All original and normalized geometries passed validity checks. The 31 normalized MultiPolygons, their Persian names, source IDs, bounding boxes and PostGIS geodesic areas are persisted under source version `ae917448-5096-50cd-8dc4-e2322315537a`. The original GeoJSON and normalization report are archived with immutable checksums. This does not establish independent boundary accuracy.

`GET /api/v1/regions` returns bounded metadata; `GET /api/v1/regions/{id}` returns one GeoJSON feature with attribution, licence and represented year. Population analysis uses its own explicitly recorded equal-area boundary approximation; its area can differ slightly from the catalog's geodesic area.

```bash
apps/api/.venv/bin/python -m forudid_api.ingest_regions data/sources/geoboundaries/IRN-ADM1-17685810
FORUDID_REGION_TESTS=1 apps/api/.venv/bin/pytest apps/api/tests/test_regions.py -q
```

The real integration check verifies idempotent registration, 31 regions, the source count discrepancy, both Mazandaran feature IDs, Tehran's missing code, valid geometry and bounded pagination. Independent source review and current-boundary comparison remain unavailable.
