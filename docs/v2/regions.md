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

## Clipped infrastructure exposure

`region-segment-clip-1` aggregates only published, complete road/railway analyses.
The worker intersects descriptive segment geometry with each historical boundary
in EPSG:4326 XY coordinates, extracts line portions and measures their WGS84
inverse-geodesic length in metres. Fully covered segments avoid intersection.
This is an explicit linear-edge boundary approximation, not a geodesic polygon
intersection. See the primary PostGIS documentation for
[intersection](https://postgis.net/docs/ST_Intersection.html) and
[geodesic length](https://postgis.net/docs/ST_Length.html).

Numeric bands remain descriptive. Valid zero belongs to its numeric band; NoData
has separate length. The total is constructed from the same clipped segments as
valid and missing lengths, preserving that balance. A way touching only a boundary
point contributes no length or count. A way coinciding with a shared boundary is
included in both region results; region sums are not a disjoint national inventory.
Neither parallel ways nor overlapping source geometries are deduplicated.

The national result covers the entire imported infrastructure snapshot. This is
not the population raster footprint or the union of regional polygons. Source
footprints and represented dates stay explicit on the dashboard.

Migration `e6c8f210ab34` adds immutable regional result identities and parent-run
links. Inputs include the upstream signature, boundary version and geometry hash,
method source hash and PostGIS version. One advisory-locked worker limits query
parallelism to zero additional workers and working memory to 8 MiB. Each region
publishes atomically; interrupted runs can reuse previously published regions.

```sh
apps/api/.venv/bin/python -m forudid_api.analyze_regions \
  --upstream-run f30d71aa-bda6-5098-b050-eed1f9657f0f --all-regions
apps/api/.venv/bin/python -m forudid_api.analyze_regions \
  --upstream-run 6ae7ccf5-0f5f-56c6-ae70-406dad9072e4 --all-regions
```

`GET /api/v1/products/{product}/infrastructure-exposure` accepts `asset_type`,
optional `region_id` and `run_id`. Both result and parent analysis must remain
published and nondeprecated. A regional run cannot be read as a national result.
The API serves stored metrics; it does not clip geometry on a page request.

The numerical PostGIS check uses transaction-local test geometries to verify
holes, disjoint regions, geodesic length, zero-rate-band coverage and NoData balance.
It does not alter the persistent source tables.

## Verified Tehran and national results, 2026-09-06

| Scope | Type | Ways | Total length (m) | Valid length (m) | Valid coverage |
| --- | --- | ---: | ---: | ---: | ---: |
| Entire imported snapshot | Railway | 12,722 | 16,044,032.450 | 2,479,053.454 | 15.4516% |
| Entire imported snapshot | Major roads | 120,393 | 142,796,850.033 | 15,416,292.349 | 10.7960% |
| Historical Tehran | Railway | 1,238 | 969,305.636 | 380,494.870 | 39.2544% |
| Historical Tehran | Major roads | 14,128 | 6,731,941.781 | 1,521,776.764 | 22.6053% |

National railway/road result IDs are respectively
`43afd0f0-d572-5ad1-9495-2212affc0728` and
`6ac61d23-8081-5a65-8775-85783854ad96`; Tehran IDs are
`3b5ba137-4149-5d14-89f3-55f7464bbcbf` and
`46edf9b6-b56a-5741-97b3-9b49dfd814d1`.

Both sequential runs completed: 32 published results per type, consisting of
the national snapshot and all 31 registered historical regions (64 in total).
The final applicable API/numerical suite passed 38 checks. Previously verified
full-raster preservation checks were not repeated because raster code and inputs
did not change. Repeating the Tehran calculation returns the existing result ID.

The real API check matches archived metrics, rejects region/country scope
confusion and verifies national lengths against the published parent runs.
Migration checks show no model/schema drift. The bilingual region dashboard
passed desktop/mobile checks including isolation of a simulated road API outage.
Only the numerical regional test is enabled in standard CI; full-snapshot
acceptance requires `FORUDID_REGION_INFRA_REAL_TESTS=1` and was run locally.

## Map modes

`/map` exposes deformation, infrastructure and population modes. The infrastructure
panel reuses published rankings and pins the selected analysis in the URL. Its
region filter selects whole intersecting ways, while this dashboard's regional
statistics are clipped. Population mode selects one historical boundary and
reuses the population result without recomputing rasters. Mode, region, ranking
filters, viewport and selection survive reload.

Historical boundaries are outlined over the deformation background; the fill is
not a population-density or hazard colour scale. Attribution remains visible.
CSS flow keeps the legend and guidance apart as text and attribution heights
change. Desktop/390 px Chrome tests verify real selection, Tehran population,
source attribution, URL restoration, non-overlap and document width.

## Complete COMET infrastructure pairs, 2026-09-10

The separate COMET LOS product `5323cc4f-57ec-5347-a85d-14f4887e5d27` now has
32 published railway aggregates and 32 published major-road aggregates: the
complete imported snapshot plus every registered historical region. Upstream
runs are `e8e610a9-7950-5871-a087-ed70b2cbc82b` and
`4c4708a2-afcb-5e50-b57a-aacdf473d08d`, respectively. The existing
`region-segment-clip-1` method and boundary version remain unchanged.

The product's raster extent intersects only the historical Tehran, Qom and
Semnan regions. A completed region outside that extent retains its imported
infrastructure length and reports zero valid deformation coverage. This is
missing measurement coverage, not zero ground motion or a missing analysis.
LOS edges remain `[-150, -100, -50, 0, 25]` mm/year; hazard lengths remain null.
The batch runs sequentially through the common CLI's `--all-regions` option.
