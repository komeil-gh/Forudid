# فرودید | FORUDID

A local platform for ground-deformation evidence, infrastructure exposure and
population analysis in Iran, with traceable sources and immutable versions.
The product interface is Persian-first with English support.

Original code and documentation are licensed under [Apache-2.0](LICENSE).
See [third-party notices](THIRD_PARTY_NOTICES.md), [contributing](CONTRIBUTING.md)
and [security](SECURITY.md). This alpha source distribution includes no scientific
measurements or prepopulated database. Results described below refer to the
documented local analyses, not data bundled with a fresh checkout. The
[source-release guide](docs/operations/open-source-release.md) defines the
publication boundary and reproducible packaging command.

## Implementation and specification coverage

[V2](docs/v2/MASTER_SPEC.md) extends the original WebGIS into infrastructure and
population exposure analysis. The [V1 audit](docs/v2/audit.md), [V2 architectural
decisions](docs/v2/adr/) and [local MVP acceptance](docs/v2/acceptance.md) record
that development. MVP acceptance does not mean every master-specification
requirement, scientific method or operational workflow has been completed.
The [coverage ledger](docs/operations/specification-coverage.md) records the
remaining requirements and the evidence needed to close them.

The published Haghighi–Motagh data cover 2014–2020: estimated vertical subsidence
rate and peak-to-peak seasonal amplitude. These are descending-LOS projections
assuming negligible horizontal motion, not measurements of current conditions.
The source does not provide pixel time series or uncertainty; the interface does
not invent them. All three normalized COGs preserve the original base pixels and
masks. See [normalization](docs/v2/raster-normalization.md). V1 fixtures remain
available only for explicit software tests and are hidden by the default API.

The separate [COMET Varamin source](docs/v2/comet-varamin.md) provides ascending
LOS rates and 323 native displacement epochs from 2014-10-19 to 2026-07-31.
Its real raster, reference pixel, point chart and source selection are connected.
It covers one frame, remains independently unvalidated, and has no supplied
pixel uncertainty or temporal coherence. Its redistribution terms remain an
explicit public-deployment gate.

The home page links directly to the Varamin pilot as well as the historical
nationwide map. `/compare`, available from a selected point or the source catalog,
shows two separately selected rate products at the same coordinate. Native
pixels, dates, components, signs, references and source identities remain visible.
There is no subtraction or fusion, and shared satellite observations are not
treated as independent error evidence.

The imported OSM snapshot contains 12,722 railway ways and 120,393 major-road
ways. Both complete line analyses are published. Martin serves vector tiles;
`/assets` provides search, ranking, shareable details, profiles, segment selection
and JSON/CSV/GeoJSON downloads. See [infrastructure](docs/v2/osm-infrastructure.md),
[vector tiles](docs/v2/vector-tiles.md), [line analysis](docs/v2/line-exposure.md)
and [asset exploration](docs/v2/asset-exploration.md).

WorldPop 2026 R2025A v1 is registered alongside the preserved 2020 source. It is an
alpha, constrained, UN-adjusted model estimate/projection produced in 2025, not a
2026 census. Its verified native raster sums to 92,814,664.024 estimated people.
The population map, native-cell inspection and exposure API select source versions
explicitly; the default source is the latest registered population year. Country and all 31 historical-region analyses are published. Ten real map/population
browser cases passed on desktop and mobile. Historical
2020 country and all 31 regional results remain reproducible. See [population
methods and evidence](docs/v2/population-exposure.md) and [regions](docs/v2/regions.md).

Both WorldPop years now have separate COMET LOS analyses for the country and
all 31 historical regions (64 population results). WorldPop 2026 estimates
1,657,239.329 estimated people within valid source coverage across the country,
and 1,636,661.777 within the historical Tehran boundary. Signed numerical bands
retain LOS meaning. These counts are not hazard populations. The regional result
uses the separately versioned `ellipsoid-cell-overlap-2` method; existing
`ellipsoid-cell-overlap-1` code and results remain unchanged.
COMET also has its own complete road and railway analyses and all 64 regional
infrastructure aggregates. Outside its footprint, completed results retain
population and asset totals while explicitly reporting missing deformation
coverage. The `--all-regions` CLI runs scopes sequentially and reuses published
results.

Experimental full-raster gradients and a real Payne-paper example have been run;
[gradient](docs/v2/gradient-proxy.md) and [research comparison](docs/v2/payne-2025-research.md)
record the limitations and unresolved differences. No structural hazard or safety
classification is enabled. Persian infrastructure, regional and country PDFs pin
their analysis inputs. The [CLI](docs/v2/cli.md) calls the same source, analysis and
[report](docs/v2/reports.md) implementations.

The V3 foundation includes append-only event history, observations and evidence,
read APIs, an experimental statistical detector, and `/events` list/detail/map
views. See [foundation](docs/v3/event-foundation.md), [detector](docs/v3/statistical-detector.md),
[interface](docs/v3/event-ui.md) and [audit](docs/v3/audit.md). No real operational
event has yet been established. Historical deformation is not a current event.
Real NISAR metadata discovery is documented separately from measurement ingestion.

## Local execution

Prerequisites: Docker Desktop/Engine with Compose and Python for initial settings.

```sh
python3 scripts/init_env.py
docker compose up --build
```

The initialization script generates random local credentials and preserves an
existing `.env`. Never commit credentials or `.env`; `.env.example` lists settings.
The one-shot `initialize` service runs forward migrations and creates the private
bucket. It does not automatically seed fixtures. The API does not migrate on startup.
The independent `report-worker` consumes PDF requests without a host terminal or
host browser. It renders one job at a time, with 0.5 CPU and 768 MiB limits.
Reports and heavy analyses share the resource lock, so queued PDFs wait for an
active analysis to finish. The UI explains this while keeping data inspection
available.
Build services sequentially on memory-constrained machines; do not run heavy
analysis during browser-image installation.

After the stack is ready:

- [Map](http://localhost:58080/map)
- [Sources](http://localhost:58080/sources)
- [Population and regions](http://localhost:58080/regions)
- [API readiness](http://localhost:58080/health/ready)

`LOCAL_PORT`, `API_PORT`, `DB_PORT` and `S3_PORT` configure the proxy, API, PostGIS
and object-storage ports. These links use initialization defaults. All exposed
ports bind to `127.0.0.1`; the frontend uses same-origin routes.

```sh
docker compose down
```

This stops the project's services and preserves data volumes. Use an explicit
context when other projects may change it, for example
`docker --context desktop-linux compose up --build`. Do not use `down -v` unless
permanent data deletion is intended. Stop foreground development servers with Ctrl+C.

## Development outside containers

Use Node 22.12+, pnpm 11.24.0, uv and Python 3.13.

```sh
pnpm install --frozen-lockfile
uv sync --project apps/api --frozen
python3 scripts/init_env.py
docker compose up -d postgres object-storage
uv run --project apps/api alembic -c apps/api/alembic.ini upgrade head
uv run --project apps/api python -m forudid_api.initialize
```

Run these in separate terminals from the repository root:

```sh
uv run --project apps/api uvicorn forudid_api.main:app --host 127.0.0.1 --port 58000
pnpm dev
```

Match the uvicorn port to `API_PORT` and `VITE_API_PROXY_TARGET`. Vite reads
`WEB_PORT` and proxy settings from the root `.env`; its default [map](http://localhost:5173/map)
is on port 5173. For infrastructure, run Martin 1.15.0 as described in the
[vector guide](docs/v2/vector-tiles.md). Stop all servers started for development
when finished, without stopping unrelated user processes.

## Verification

```sh
uv run --project apps/api ruff check apps/api/src apps/api/tests
uv run --project apps/api pyright --project apps/api
uv run --project apps/api pytest apps/api/tests -q
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @forudid/web exec playwright install chromium
pnpm test:e2e
```

Legacy API tests need this project's PostGIS/S3 and explicit
`python -m forudid_api.seed`; fixture visibility is enabled only inside those tests.
Browser checks need running servers. Use `WEB_BASE_URL=http://localhost:58080`
for the built Compose stack. If test Chromium is unavailable, installed Chrome
can be selected with `PLAYWRIGHT_CHANNEL=chrome`; it uses a temporary profile.
Screenshots go to `/tmp/forudid-qa`. Real 2026 checks use
`FORUDID_POPULATION_2026_TESTS=1` after source registration and analysis publication.

## Real source ingestion

After migration, run from the repository root:

```sh
uv run --project apps/api python -m forudid_api.ingest data/sources/haghighi-motagh-2024/1.0.0
uv run --project apps/api python -m forudid_api.register_source data/sources/haghighi-motagh-2024/1.0.0
uv run --project apps/api python -m forudid_api.normalize data/sources/haghighi-motagh-2024/1.0.0 data/normalized/haghighi-motagh-cog-1
uv run --project apps/api python -m forudid_api.publish_historical data/sources/haghighi-motagh-2024/1.0.0 data/normalized/haghighi-motagh-cog-1
uv run --project apps/api python -m forudid_api.ingest_osm data/sources/geofabrik-iran/260904
uv run --project apps/api forudid data ingest-population data/sources/worldpop-iran/2026-r2025a-77712 --year 2026
```

Historical acquisition checks the three pinned Zenodo rasters against published
MD5 values. Registration verifies SHA-256, streams originals into private storage
and atomically records source/version metadata. Identical input is idempotent;
a checksum conflict fails. Normalization retains the grid and base values;
publication adds STAC, quality and provenance. Large originals remain in `data/`
and S3, outside Git. `/sources` exposes only public source metadata.

Use `FORUDID_REAL_SOURCE_TESTS=1`, `FORUDID_OSM_TESTS=1` and
`FORUDID_MARTIN_TESTS=1` for their corresponding real-data checks. Keep
`ALLOW_FIXTURE_PRODUCTS=false` for normal use. The 2026 OSM snapshot is not
contemporaneous with 2014–2020 deformation and its completeness is unverified.

## API contract

```sh
uv run --project apps/api python scripts/export_openapi.py
pnpm generate:api
git diff --exit-code -- docs/openapi.json apps/web/src/generated/api
```

FastAPI is the contract authority. Regenerate the client instead of editing it.
CI checks synchronization. Population source listing, native-cell sampling and
tiles use verified source identifiers; exposure additionally accepts
`population_version`, `region_id` and `run_id`.

## Map and data contracts

The default map has local Natural Earth geographic context and a source-pinned
OSM place index. These generalized display features are not official boundaries
or analysis inputs. National road and rail data use MVT. Population mode renders
the actual population raster and exposes its year, source, logarithmic display
scale and native approximately 1 km resolution. Zoom does not add data precision.
`VITE_BASEMAP_STYLE_URL` and `VITE_BASEMAP_ATTRIBUTION` can select a properly
licensed external provider. Attribution remains accessible. WebGL2 is required.

The explicit test fixture contains 64 × 64 pixels, 26 dates and one missing epoch.
At `51.6452, 35.3241`, the expected fixture values are `-71.2 mm/year`, uncertainty
`6.0 mm/year`, coherence `0.89` and 25 valid observations. Its quality is always
caution and its data are synthetic.

Objects are written with `If-None-Match` and verified by SHA-256 after upload.
Existing objects are never overwritten. A corrected fixture gets a new run and
supersedes the old product. Buckets remain private. Published deformation tiles
accept only the `style` query parameter; population tiles accept no query options.
Arbitrary remote URLs, local paths and raster expressions are not accepted.

## Remaining scientific and operational work

The [original specification](docs/MASTER_SPEC.md), [architecture](docs/architecture/overview.md),
[milestones](docs/operations/milestones.md), [scientific requirements](docs/science/validation.md)
and [ADRs](docs/adr/) retain the full requirements and historical decisions.

Real HyP3/MintPy processing and the isolated scientific environment are not
completed. Provider-native COMET HDF5/Zarr publication is implemented, but it is
not an independently processed and reviewed Forudid LOS product. Fixture track 071
is not evidence for a real track choice. A scientific product needs a completed
profile, QC and recorded manual review before publication. Operational V3 source
measurements, evidence review and action workflows remain distinct requirements;
the existence of a database schema or a page does not establish their completion.
