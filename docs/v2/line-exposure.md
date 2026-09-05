# Native-grid line exposure

The `forudid_analysis` package implements `geodesic-midpoint-1`: descriptive
exposure to an explicitly versioned velocity raster. This is an experimental
screening method, not a structural hazard model or a probability of failure.

## Measurement contract

Input lines are WGS84 OSM ways. Chainage uses the WGS84 ellipsoid. Sampling
intervals are half the smallest physical native pixel axis checked at nine grid
locations; every profile position is also checked against the actual local pixel
width. Excessive distortion fails explicitly. The final shorter interval keeps
its actual length. Samples use the native containing pixel without interpolation
or scientific-raster reprojection. Values are converted to mm/year using the
declared source unit, scale and offset.

Mean and quantiles use valid interval lengths as weights. Quantiles use the inverse
empirical CDF. Valid zero remains zero; NoData remains null and contributes to
missing length. Contiguous numeric bins and NoData gaps produce actual LineString
substrings with original interior vertices and geodesic cut endpoints. Bin edges
are lower-inclusive and upper-exclusive, recorded in each run. The default edges
0, 50, 100, 200, 400 mm/year are descriptive visualization bins, not hazard thresholds.
Sampling is an approximation at the raster scale, not exact pixel-boundary tracing.
Uncertainty, gradient, angular distortion and hazard class remain unavailable.

## Persistence and execution

Additive migration `89a3ce782491` creates methods, analysis runs, asset summaries
and indexed exposure segments. A stable signature includes method source hash,
deformation product checksum, source-version identities and checksums, scope,
parameters, source semantics and numerical dependency versions. Changed method
code under an existing method version is rejected. Inputs are stored as well as
hashed. Published profiles are immutable private objects with SHA-256 verification.

One worker holds an advisory lock, reads at most 100 asset IDs at a time and
commits each asset with its segments. GDAL uses one thread and a 32 MiB block
cache. A line exceeding 200,000 samples is rejected rather than silently coarsened.
Completed asset records survive interruption. A rerun skips completed assets;
publication requires the full expected count. Failed/incomplete runs are not
served. Downgrade refuses to destroy existing analysis runs.

```sh
uv run --project apps/api python -m forudid_api.analyze \
  --product 744b6536-b9a7-56c5-85b1-66a629a78b91 \
  --source-version b540a66b-41c4-58a9-9a68-e63f5ffb226d \
  --asset 29cbefaf-1ef9-594a-9957-68060bf45846 \
  --raster data/normalized/haghighi-motagh-cog-1/rate.tif
```

Replace `--asset` with `--type railway` or `--type road` for a sequential snapshot
run. Bulk analysis requires a local raster whose SHA-256 matches publication.
Neither API requests nor the browser launch processing.

## API and map

- `/api/v1/assets/{asset_id}/exposure`: latest published summary, optionally pinned
  to `run_id` and/or `product_id`.
- `/api/v1/analyses/{run_id}/assets/{asset_id}/profile`: at most 1,000 samples per
  page, read from separately archived pages.
- `/api/v1/analyses/{run_id}/assets/{asset_id}/segments`: at most 100 GeoJSON
  features per page, with real chainage and missing-data quality.

The selected-asset panel displays length coverage and length-weighted statistics.
The distance chart preserves missing intervals and interval boundaries. Hover or
keyboard-accessible table buttons locate a sample on the map. Long profiles have
explicit pagination; a missing analysis is shown as unavailable. All reads retain
the analysis identity and historical source dates.

## Local evidence, 2026-09-05

Real pilot: OSM `way/963780743`, راه آهن تهران - مشهد, 2026-09-04 snapshot,
against the Haghighi/Motagh 2014–2020 estimated vertical subsidence raster:

- Total way length: 19,429.670 m; valid length: 11,062.279 m.
- Coverage: 56.93498%; valid-length mean: 93.4907 mm/year.
- Analysis run: `7f849309-dded-5e37-a541-7a005e76d41d`.
- Four numerical tests and one real persistence/API test passed. The latter
  verifies idempotence, archived profile equality, segment length conservation,
  pagination and invisibility of an incomplete run.
- Desktop and 390 px mobile Chrome checks passed for real values, NoData, profile
  selection, reload and document overflow. Alembic reports no schema drift.

The full railway run `f30d71aa-bda6-5098-b050-eed1f9657f0f` subsequently published
all 12,722 imported ways. Their summed geodesic length is 16,044,032.450 m, with
2,479,053.454 m covered by valid velocity data. 1,904 ways have some valid coverage;
13,893 contiguous segments retain numeric-band changes and NoData gaps.

The 2026 asset snapshot is not proof that the same asset geometry existed in
2014–2020. These way lengths are not deduplicated route lengths. Independent
scientific validation, road completion, population/region analysis and
reports remain separate V2 work; this milestone does not complete V2.
