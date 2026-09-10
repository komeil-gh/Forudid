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
forudid data ingest-population SOURCE_DIRECTORY --year 2026
forudid data check-comet SOURCE_DIRECTORY
forudid data ingest-comet SOURCE_DIRECTORY --normalized NORMALIZED_DIRECTORY

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
Population ingestion defaults to 2026; use `--year 2020` for the retained historical source.
Source commands acquire the pinned versions documented in the source registry;
they are not arbitrary dataset importers. Keep the original directories for
checksum verification and resumability. The subsidence command acquires,
registers, normalizes and publishes in that order, preserving originals.

COMET commands require `uv sync --project apps/api --frozen --group ingest`.
`check-comet` archives a timestamped provider-header check and separately verifies
any local original. Exit code 2 means changed or incomplete provider metadata;
network failures also retain a check record and exit unsuccessfully. Matching
headers do not establish remote byte equality or a newly observed acquisition.
`ingest-comet` requires the reviewed Varamin snapshot, verifies its full SHA-256,
normalizes and publishes through the existing immutable pipeline. A provider
change stops ingestion for review; it never overwrites the current product.
See [COMET operations](comet-varamin.md#repeatable-acquisition-and-recovery).

Pinned source downloads now resume HTTP ranges under an exclusive local lock.
Rerun the same command after a network interruption. A complete checksum match
is mandatory before the final source name is created. Unsupported ranges restart
from zero while retaining the earlier partial; malformed ranges and source
changes fail without publishing. Checksum-scoped partials, rejected attempts and
older unscoped partials remain available for inspection. No retry loop or
background scheduler is started by these foreground commands.

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
