# Population exposure

The default input is [WorldPop Iran 2026, record 77712](https://hub.worldpop.org/geodata/summary?id=77712): constrained 30 arc-second counts, R2025A v1, DOI `10.5258/SOTON/WP00840`, CC BY 4.0. This alpha release is adjusted to UN WPP 2024 totals. It is a modelled annual estimate/projection, produced in 2025, not a 2026 census. Native units are people per cell. The 2020 product remains selectable and its published results remain immutable; differences between these products are not a measured population-growth series because their methods and grids differ.

The retained historical input is the official [WorldPop Iran 2020, 1 km product](https://hub.worldpop.org/geodata/summary?id=31792), DOI `10.5258/SOTON/WP00670`, produced 2020-06-22. It is an unconstrained, non-UN-adjusted model of people per native WGS84 cell, licensed CC BY 4.0. It is not an official census count. The original 100 m acquisition remains incomplete and is not used.

`ingest_population` checks the provider product/year/URL, snapshot size and local SHA-256, preserves original metadata, creates a lossless-base-pixel COG, and compares every base pixel and mask. Overviews use nearest values for inspection and are never used for count aggregation. The provider does not publish a cryptographic checksum for this file; an HTTP ETag is not presented as one.

## Computation

`forudid_analysis.population.population_exposure` allocates native population counts by ellipsoidal cell-overlap area. It rejects density inputs, rotated/non-WGS84 grids, ambiguous scaling and target cells coarser than the population cells. It assumes uniform population density inside each source cell. It does not interpolate counts or multiply unaligned grids directly.

For an administrative polygon, only its bounding windows are read. Interior cells use a mask; boundary cells use actual polygon intersections. Grid parallels and meridians remain rectangles in the [ellipsoidal cylindrical equal-area projection](https://proj.org/en/stable/operations/projections/cea.html), EPSG:6933. Source polygon edges are densified to at most 0.002 degrees before projection. The resulting polygon approximation and native grid resolution remain limitations. Holes and multiple parts are retained.

The result separates total estimated population, population with valid deformation values, population without deformation data, and population outside the deformation raster extent. Valid zero is retained. The historical projected-vertical product uses numeric bands `[0, 50, 100, 200, 400]` mm/year; COMET LOS uses signed bands `[-150, -100, -50, 0, 25]` mm/year. Both are lower-inclusive and upper-exclusive, with explicit underflow/overflow bins. Negative LOS means motion away from the satellite, not vertical subsidence. These bands are not hazard classes. `hazard_population` is null.

Regional deformation mean, median and p95 are area-weighted over valid native cells, independent of population coverage. The original `ellipsoid-cell-overlap-1` method retains at most 100,000 distinct rates for exact quantiles. COMET regional runs use the separately archived `ellipsoid-cell-overlap-2` capacity of 500,000; allocation and exact quantile calculations are unchanged. Inputs exceeding their version's ceiling fail explicitly. NoData is excluded from rate statistics and remains visible in area/population coverage. Existing method files and published results remain immutable.

The single-worker command shares the analysis lock with line analysis. A signature pins method code, ellipsoid, projection, region geometry and source versions, raster checksums, population year, bands and runtime versions. Objects are immutable; the API serves only published runs whose method has not been deprecated. The method is experimental, without independent scientific validation.

```bash
apps/api/.venv/bin/python -m forudid_api.ingest_population data/sources/worldpop-iran/2026-r2025a-77712 --year 2026
apps/api/.venv/bin/python -m forudid_api.analyze_population --product PRODUCT_UUID --population-version SOURCE_VERSION_UUID --population-raster data/sources/worldpop-iran/2026-r2025a-77712/population-count.cog.tif --velocity-raster data/normalized/haghighi-motagh-cog-1/rate.tif
```

Add `--region REGION_UUID` to use one registered historical boundary. Country-footprint results and region results have separate identities. `GET /api/v1/products/{id}/population-exposure` accepts `region_id`, `run_id` and `population_version`; requests never initiate computation. The bilingual `/regions` page selects region and deformation product and reports an explicit unavailable state until a matching result is published.

## Verification

The numerical check covers count conservation on shifted grids, partial-cell clipping, complementary diagonal polygons, a narrow hole, valid zero, NoData, rejection of density units, and deformation coverage outside the population footprint. Run:

```bash
apps/api/.venv/bin/pytest packages/python/forudid_analysis/tests/test_population.py -q
```

These checks establish software behavior on analytic cases. Real-data publication and independently reviewed scientific validity are separate evidence requirements.

## Verified real publication, 2026-09-06

The complete 10,536,072-byte source has SHA-256 `57b7d3a216822608bbc6e26ce64abc8ff5a965c67631023e865eaa886b35a71b`. Its native 1767 × 2312 grid uses Float32 counts, NoData −99999 and 0.0083333333-degree pixels. All original and normalized base values and masks matched. There are 2,241,772 valid cells, including 508 valid zeros. COG SHA-256: `ab02286281f539ea90ffaeca7a6f1745c6307c09a0457b2cd2ceb7e38b8a6796`. Source version: `488059d8-d3f6-5064-af66-131da47742e3`.

Country run `f2eb002e-9c3e-5bab-bf4d-e93197945448` estimates 80,382,521.058 people over the population source footprint; 13,297,898.875 fall within valid historical deformation coverage (16.543%). The remaining 67,084,622.183 lack valid deformation data. This is not an estimate of people in danger.

| Historical region | Run | Estimated population | With deformation data |
| --- | --- | ---: | ---: |
| Tehran | `9af897e3-7f1b-5fa9-83ca-65e30b8d9f94` | 12,523,972.277 | 3,245,429.501 |
| Isfahan | `cb850e71-9b46-58ce-b5df-8438c49b3c25` | 5,504,814.187 | 1,605,840.885 |
| Kerman | `17cf48cb-b82e-54a3-8f4a-41672da91940` | 3,230,374.527 | 901,534.227 |

The real API integration check passed for country and Tehran results, including checksum pins and rejection of a region run when country scope is requested. Desktop and 390px mobile Chrome checks passed against these data: selection/reload, Persian/English text, provenance and document-width bounds. The local screenshots were inspected. Remote CI and a complete rebuilt Compose stack have not been verified in this checkpoint.

All 31 registered historical regions subsequently completed and published. Their summed population is 80,194,923.462, compared with 80,382,521.058 over the WorldPop source footprint. These are different spatial supports; the regional sum must not be substituted for the national source total. The boundary dataset is historical and independently unvalidated, and population is distributed uniformly within its coarse native cells. Schema drift checking reported no pending operations.

The final local API/analysis regression run passed 34 checks with one opt-in check skipped; the previously verified full-raster comparison was not repeated. Ruff, Pyright, TypeScript and the production web build passed. The repeated population/region browser flow passed both desktop and mobile cases. These results belong to the `0.2.0-alpha.5` checkpoint, not a completed V2 release.

## Verified 2026 publication, 2026-09-09

The original official TIFF is 2,294,318 bytes, SHA-256 `ea8b9b1edd91e4428a195b100e9047d61f2080c1e80dad5a589731473a7307e8`. The normalized COG is `ddb7844a54e4cadd8e32fabb39f8a61a083ece7adda525696ab9488bbc38b29c`; its base pixels and masks match the original. Source version: `b626dc10-f9f7-5b67-9f49-889e391c8b15`. The native grid has 1,767 rows and 2,315 columns, 370,631 valid cells including 86 zeros, Float32 counts and NoData −99999. Original TIFF, provider page, release statement, response headers and metadata are retained locally.

Country run `31125156-5ee3-57dc-bb45-0b897b354afa` and all 31 historical-region runs are published, using the unchanged `ellipsoid-cell-overlap-1` method. The country footprint contains an estimated 92,814,664.024 people: 16,559,749.055 intersect valid 2014–2020 deformation measurements (17.842%), while 76,254,914.969 have no valid deformation data. This is spatial overlap across different periods, not present-day measured hazard.

Tehran run `fbc3b5cc-553e-5bcf-9659-bc7de05434bb` estimates 15,464,734.358 people within the historical boundary, including 3,785,354.398 with deformation coverage. All regional totals sum to 92,614,884.230; historical boundary support differs from the national population footprint. Do not substitute this sum for the source total.

`GET /api/v1/population/sources` lists verified versions, newest model year first. The population map displays the selected source's actual raster. `/api/v1/population/sources/{id}/point` returns a native cell count and bounds; it does not invent a population at a coordinate. Tiles use nearest sampling and a documented logarithmic display scale. Browser selection and the `populationVersion` URL parameter also select the matching published regional analysis. The ingestion CLI defaults to 2026; use `--year 2020` explicitly for historical reproduction.

Real API checks passed for source identity, native sampling, PNG tiles, rejected untrusted queries, conservation and independent 2020 retrieval. Tile regression checks also establish that catalog connections are released before raster I/O. Desktop and 390px mobile Chrome flows passed for raster/year agreement, Persian city and coordinate search, native values, year switching and reload. Four additional map-mode/region cases passed with real infrastructure results. Two further desktop/mobile cases verified recovery from a failed tile while native sampling and camera state remained usable. Screenshots were inspected. These checks do not establish independent scientific validation or completion of every master-specification requirement.

## Complete COMET population pairs, 2026-09-10

Both source years now have 32 published COMET LOS results: the country footprint
and all 31 registered historical regions. Previously published 2026 country and
Tehran results were reused. The new 2020 country run is
`747eb08a-3446-549f-a5fc-085a4dc2a13d`; its Tehran run is
`d46964d4-a032-5cac-8451-35dd6f74cf14`. Product identity, population source year
and native raster checksums remain independently pinned.

The real API acceptance traversed all 64 population pairs and all 64 matching
infrastructure aggregates. It verified population and band conservation, exact
scope/version identity, and agreement of each population total with the same
population source and boundary in the historical deformation analysis. Only
Tehran, Qom and Semnan intersect the COMET raster extent; other regions retain
their estimated population and return zero valid deformation coverage and null
mean rate. These are complete missing-coverage results, not absent calculations.
The all-scope acceptance passed in 5.01 seconds after the sequential batches
finished; no scientific validation or nationwide recent deformation is implied.
