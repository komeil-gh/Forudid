# Local V2 command line

Install with `uv sync --project apps/api --frozen`, then use
`uv run --project apps/api forudid --help`. The command calls the existing source
and analysis implementations. It does not introduce another numerical method or
modify the code hashes of published calculations. Commands run in the foreground.

```sh
forudid data list
forudid data list --source SOURCE_UUID --limit 20
forudid data ingest-subsidence SOURCE_DIRECTORY --normalized COG_DIRECTORY
forudid data ingest-osm SOURCE_DIRECTORY
forudid data ingest-population SOURCE_DIRECTORY

forudid analyze asset --asset ASSET_UUID --deformation-product PRODUCT_UUID \
  --source-version OSM_VERSION_UUID --raster RATE_COG
forudid analyze infrastructure --asset-type railway --deformation-product PRODUCT_UUID \
  --source-version OSM_VERSION_UUID --raster RATE_COG --method geodesic-midpoint-1
forudid analyze population --product PRODUCT_UUID --population-version POPULATION_VERSION_UUID \
  --population-raster POPULATION_COG --velocity-raster RATE_COG --region REGION_UUID
forudid analyze region --upstream-run LINE_ANALYSIS_UUID --region REGION_UUID

forudid report asset --analysis-run LINE_ANALYSIS_UUID --asset ASSET_UUID --render
forudid report region --analysis-run POPULATION_ANALYSIS_UUID --region REGION_UUID --render
```

Use the project runner before `forudid` when its virtual environment is not active.
Source commands acquire the pinned versions documented in the source registry;
they are not arbitrary dataset importers. Keep the original directories for
checksum verification and resumability. The subsidence command acquires,
registers, normalizes and publishes in that order, preserving originals.

`data list` uses cursor pagination and public source fields. `--source` returns
that source's versions. Analysis arguments require UUIDs and explicit input
versions. `--product` aliases `--deformation-product`; the only public line method
is the implemented `geodesic-midpoint-1`. The illustrative method names in the
master specification are not aliases for unvalidated scientific methods.

For population and regional infrastructure, omit `--region` to select their
respective complete source footprints. `analyze region` clips one already
published line run; compute regional population separately with `analyze
population --region`. The workers preserve their existing global lock,
checksums, publication guards and resume rules. Run one heavy command at a time.

Reports queue by default and print a JSON job record. `--render` runs that named
job using the local renderer and prints the resulting status. If another worker
holds the shared lock, the report remains queued; a queued result is not a
completed PDF. Downloads use the report API described in [reports](reports.md).
Only Persian is currently supported. CLI checks exercise exact argument routing,
rejection of an unavailable hazard method, real source reads and a real Tehran
report request.
