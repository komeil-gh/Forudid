# Historical products — V2 milestone 3

The default catalog now serves the published Haghighi–Motagh 2014–2020 source.
Fixture products, tiles, areas and processing runs are excluded by the API unless
`ALLOW_FIXTURE_PRODUCTS=true` is explicitly enabled for software testing.
Compose initialization creates storage and migrates the database; it never seeds
synthetic products automatically.

## Reproducible publication

- Source version: `a4f8d6d4-dbd8-5471-8c71-b7edefb72df7`.
- Normalization run: `6f8b3ae9-63ac-56c2-b383-c3f7a3623112`.
- Pipeline: `haghighi-motagh-cog-1`.
- Outputs: estimated vertical subsidence magnitude (`cm/year`) and seasonal
  peak-to-peak amplitude (`cm`). The UI converts presentation units to `mm/year`
  and `mm`; base raster values remain unchanged.
- Every original and normalized asset is checksummed. Publication compares every
  base pixel before storing immutable COG, STAC, quality and provenance objects.
- The database transaction publishes only after object storage succeeds. The run
  records actual COG normalization, not a new Sentinel-1 processing experiment.

Acquisition, normalization and publication commands are in the
[local setup guide](../operations/local-guide.md#real-source-ingestion).
Original integrity evidence is in [source-registry.md](source-registry.md), and
full-grid preservation evidence is in [raster-normalization.md](raster-normalization.md).

## Scientific meaning and limits

The provider projects descending LOS observations onto the vertical direction
assuming negligible horizontal movement. This is not ascending/descending
decomposition. The source is historical and does not describe present conditions.
The reference is a spatial correction surface, not a single reference point.
Exact acquisition dates, per-pixel time series, coherence and uncertainty were
not supplied; the API returns absence explicitly and the UI does not fabricate
these capabilities. NoData does not mean stable ground. Valid zero remains zero.

The Iran AOI is the rectangular raster footprint, not an administrative boundary.
Pixel size is exposed in native angular units. Coverage statistics describe the
raster rectangle only. The period is known to year precision; STAC calendar
extent bounds are marked as bounds rather than exact acquisition dates.

The map attributes Haghshenas Haghighi & Motagh and the CC BY 4.0 dataset.
The publication is a faithful presentation of an external research product;
`scientifically_validated=false` records the absence of independent FORUDID
scientific validation. Display color breaks are visualization choices, not
structural risk thresholds.

## Local acceptance evidence — 2026-09-05

- Three strict COG validations and full base-pixel comparisons passed.
- Live database/storage tests verify fixture exclusion, native point sampling,
  NoData, source linkage, nullable unavailable measurements and STAC semantics.
- The real maximum pixel at `55.65368745, 30.86962006` returns `37 cm/year`;
  the browser displays `370.0 mm/year` before and after reload.
- Fourteen map scenarios passed across desktop and 390 px mobile Chrome,
  including real tiles, metadata, layer changes, URL recovery and failure states.
- Historical point views make no time-series request and render no invented chart.
- Final suite: 25 API tests, 10 frontend tests, TypeScript, Pyright, scoped Ruff,
  ESLint and production frontend build passed. Alembic reports no schema drift.
  Four focused browser checks passed again after the final attribution change.

These are local software and source-preservation checks, not production or
independent geotechnical validation. CI is configured but has not run remotely.
V2 remains incomplete: real infrastructure ingestion, vector tiles, exposure
analysis, population, reports and exports follow this milestone. V3 stays deferred.
