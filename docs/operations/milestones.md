# Delivery status

This record separates implementation, workflow acceptance and scientific validation. Failed or skipped checks do not complete a milestone. Historical entries below describe their dated checkpoints, not current runtime health. The V2 MVP acceptance does not establish completion of every V2 or V3 master requirement.

## Local unveiling preparation — 2026-09-10

The target remains local; no domain or deployment host has been supplied.
Version `0.3.0-alpha.6` fixes source-aware infrastructure navigation, the map's
invalid-product reset, mobile About-page overflow, and Persian LOS labels.
Asset and regional periods now use the actual selected product and the selected
language's calendar. New Persian PDFs also localize dates, retaining original
machine dates and the final rendered HTML in immutable report artifacts.

Published exposure reads now recheck the source product in the shared resolver,
so withdrawing a product hides its profile, segments and all download formats.
The report queue reclaims interrupted processing only while holding its exclusive
session lock. Its metadata session closes before object reads and rendering.
A dedicated, resource-limited Compose report worker has been added and passed
the local container acceptance described below.

About and methodology content now load on demand. The production entry JavaScript
fell from 739.36 kB (228.77 kB gzip) to 404.41 kB (125.43 kB gzip). This is an
artifact-size measurement, not a measured page-load latency. Map and chart chunks
still exceed the build warning threshold. CI's historical population ingestion
now explicitly requests 2020, preventing the new 2026 default from being written
under the old source directory.

The real API run passed 43 tests; two optional checks were skipped. The separate
real Martin check then passed, including denied private-table reads and writes.
All 11 numerical tests and 17 frontend unit tests passed. The three real report
tests passed again after date localization; archived localized HTML and its
checksum passed a further assertion. TypeScript, ESLint, Ruff, Pyright and the
production frontend build passed; Alembic reported no schema drift.
The final combined browser run passed all 50 desktop/mobile cases in 2.3 minutes
against the production frontend build, local API, restricted Martin, PostGIS/S3
and host report worker. It covers actual source/asset/region navigation, real
pixels and epochs, date changes, URL reload, unavailable sources, tile failures
and PDF checksums. The event contract test uses isolated browser responses;
the real event-catalog test confirms the catalog is empty. Desktop/mobile map,
methodology, About and PDF pages were visually inspected. Public release,
scientific validation and V3 milestone completion remain separate gates in the
coverage ledger.

The complete local Compose stack then became healthy and passed 10 further
desktop/mobile checks through `127.0.0.1:58080`. With no host API or report worker
running, the container rendered a new report for real OSM way `1459082285`:
`cbc2f104-2837-5cdc-afaf-c99e96d3e59e`, PDF SHA-256
`2fc8c059d7487ec80fdb124c614d2690bad50fa7c5465cd16887aed298bafd52`.
The PDF was downloaded, checked against its API checksum and visually inspected.
The runtime manifest records Chromium `152.0.7977.82`, Node `v22.22.3` and
Playwright `1.62.1`. API and worker renderer/template/font hashes match; the API
image contains no Chromium. The worker runs as UID 10001 with 0.5 CPU and
768 MiB limits, zero restarts and no OOM kill at this checkpoint.

Packaging provenance: repeated slow Chromium downloads prevented completion of
the final cold build. The tested images instead reuse existing local dependency
runtimes with the current source copied in and `uv sync --frozen --no-dev --offline`
completed successfully. The web image packages the already tested production
frontend output in Caddy. No dependencies were relaxed. This validates these
local artifacts and Compose behavior, not a clean-machine rebuild or remote CI.
The regular source Dockerfiles remain the clean-build path.

| Local image | SHA-256 |
| --- | --- |
| API and initializer | `3a760dda6008ef0bd27a6481107ba0bf3358de2506cdff2f280425c1ddc4da0e` |
| Report worker | `72bd03add111b58b88e7dfe1ee34b791c935e9318d6e44c6d7a9694a99bdf7f5` |
| Web | `526f27fe1227c9ef4ec0c20073e4d205a6c6c0c2dc47bd9077cafd7b3af7fa2b` |

## Current data and map update — 2026-09-09

WorldPop 2026 R2025A v1 is registered with verified originals and lossless base-pixel COG conversion. Country and all 31 historical-region results are published. The map renders the selected population raster, supports independently addressable 2020 results, native-cell inspection and real local city/coordinate search. Six real population browser cases and four map-mode/region cases passed on desktop and mobile; screenshots were inspected. Population inspection remains available when the deformation catalog fails. See [population evidence](../v2/population-exposure.md). This is a modelled population estimate, not a census.

The official COMET Varamin ascending HDF5 snapshot is normalized and registered locally with 323 actual acquisition dates through 2026-07-31. Its native LOS rate and point series are connected to the map, with unavailable uncertainty and independent validation explicit. Both desktop/mobile source-to-chart checks passed. This adds a recent pilot footprint, not nationwide current coverage; see [COMET evidence](../v2/comet-varamin.md).

Separate COMET/WorldPop 2026 country and Tehran analyses are published. The
Tehran run uses the separately versioned exact-quantile capacity change in
`ellipsoid-cell-overlap-2`; the original algorithm file remains unchanged.
The final combined run passed all 14 real desktop/mobile cases in 1.2 minutes,
including source selection, chart reload, both population source years, region
navigation, tile retry, catalog failure isolation and report prerequisites.
All 16 frontend unit tests passed. The API regression run passed 30 tests with
14 optional integrations skipped; a subsequent real COMET plus full numerical
run passed 14 tests after adding the LOS population pair. Ruff, Pyright,
TypeScript and source/test ESLint checks passed. This is local verification,
not remote CI, scientific approval or completion of the full master specs.

The API and web images built sequentially and became healthy against the retained
PostGIS and object store. The API reported `0.3.0-alpha.4`, listed population
years 2026/2020 and returned all 323 COMET epochs through the local reverse proxy.
Ten real desktop/mobile source, population, navigation and recovery cases then
passed on the built Compose stack in 48 seconds. Image identities were
`sha256:5a7329cd95b80b1690b6d95bbb5a05217c631e613fdb5249c2249761d9c9868a`
(API) and `sha256:2cce46d9120650128872e4b45f3a94c54108d51faa9d92a8f0cba24dddb5de12`
(web). Large frontend chunk warnings remain. No remote repository or deployment
target is configured, so no public release is claimed.

## V3 foundations already delivered

`0.3.0-alpha.1` added four event/revision/observation/evidence tables, internal versioned writes and read APIs restricted to published data. PostGIS rollback and migration roundtrip passed; see [event foundation](../v3/event-foundation.md). No real operational event was registered at that checkpoint.

The second stage implemented numerical seasonal-trend detection, clustering and geometric association; see [method and operational limits](../v3/statistical-detector.md). It defines no default operational threshold.

`0.3.0-alpha.3` connected event listing/details, map, history, observations and evidence to the API; see [UI acceptance](../v3/event-ui.md). Real NISAR metadata was discovered, but measurements were not ingested; see [source discovery](../v3/operational-source-discovery.md).

## Historical V2 delivery

The real 2014–2020 source was registered, normalized without changing base pixels and published; see [historical products](../v2/historical-products.md). Local checks also covered 133,115 real OSM infrastructure segments, Martin MVT and per-feature selection; see [infrastructure](../v2/osm-infrastructure.md) and [vector tiles](../v2/vector-tiles.md). Analysis of all 12,722 railway and 120,393 major-road features completed and was published.

| Version | Delivered scope and evidence |
| --- | --- |
| `0.2.0-alpha.6` | Country and 31 historical-region population, infrastructure listing, shareable details and JSON/CSV/GeoJSON downloads; [asset exploration](../v2/asset-exploration.md), [population](../v2/population-exposure.md) |
| `0.2.0-alpha.7` | Historically clipped regional exposure and three map modes; [regions](../v2/regions.md) |
| `0.2.0-alpha.8` | Segment table, actual geometry selection and URL recovery; four desktop/mobile checks |
| `0.2.0-alpha.9` | Experimental gradient over the complete real dataset and the Payne Qom comparison; three analytical/real-file checks; [gradient](../v2/gradient-proxy.md), [unresolved differences](../v2/payne-2025-research.md) |
| `0.2.0-alpha.10` | Persian infrastructure PDF with real generation, failure, recovery and desktop/mobile downloads; [reports](../v2/reports.md) |
| `0.2.0-alpha.11` | Regional/country reports pinned to population and both infrastructure analysis types; three real API/PDF and four browser checks |
| `0.2.0-rc.1` | Unified CLI; 46 API/geospatial and 14 UI checks, lint and types passed; API/web/initializer images built |
| `0.2.0` | Healthy Compose stack and all 32 browser cases; [MVP scope and acceptance](../v2/acceptance.md); missing Expat in the image fixed |

Differential scientific acceptance remains open; structural hazard is disabled. The MVP was used as the prerequisite for initial V3 foundations. Historical data never replace new observations. The user's subsequent direction is to close the full V2 gaps before further V3 expansion.

## Historical V1 acceptance table

| Stage | Implementation | Evidence at that checkpoint |
| --- | --- | --- |
| 0 — Repository | Monorepo, Compose, Dockerfiles, API contract and CI | Two image builds passed; complete Compose acceptance unverified |
| 1 — Shell | Persian/RTL, React/Vite, URLs, routes and errors | Build/types passed; disconnected-API behavior passed on desktop/mobile build |
| 2 — Model | Six PostGIS tables and Varamin seed | Upgrade → downgrade → upgrade passed |
| 3 — Fixture | Private COG and asset-ID tiles | COG validation, PNG and golden pixel passed |
| 4 — UI | Three layers, opacity, legend and metadata | Six frontend checks passed; full E2E pending |
| 5 — Point | COG sampling and NoData | Golden value and coordinate boundaries passed |
| 6 — Time series | JSON fixture cube, chart, missing epochs and uncertainty band | Data check passed; reload required another stack run |
| 7 — QC UI | Explicit caution, coherence, uncertainty, reference and counts | Failure-isolation coverage written; complete suite not green |
| 8 — STAC | Catalog/Collection/Item, metadata and provenance | Official STAC validation passed |
| 9–16 | Not implemented at the checkpoint | Real discovery, profile, HyP3, MintPy and scientific approval required |

## Version 0.1.0 evidence — 2026-09-05

Twenty API/raster/STAC checks passed against local PostGIS/S3. After the 422 error contract fix, independent COG and OpenAPI checks passed again. Six frontend tests, lint, TypeScript, Ruff, Pyright and build passed. Initial database migration roundtrip passed. API and frontend images built; a later worker correction still required a final rebuild.

Two Playwright cases against the final build verified the map worker, API-disconnected state, no overflow and URL-copy access on desktop/mobile. The full E2E suite was not green: 8 of 12 passed previously, and a rerun stopped on a data disconnection. That did not accept milestones 0–8.

A missing STAC Collection link was fixed in a new run; the previous version was retained and superseded. The MapLibre 6 worker URL was fixed using a separate Vite worker according to the [official installation documentation](https://maplibre.org/maplibre-gl-js/docs/).

## Historical environment blocker

Docker Desktop entered `stopping` and returned API 500. The active context had also changed to `colima-cankav-builder`; the user's context was preserved. The shared engine was not restarted. Complete Compose and 14 browser checks required Docker recovery. CI was written but had not run on a remote CI service.

Temporary API/Vite services were to be stopped after checking; persistent volumes were retained. Playwright Chromium download failed with a regional CDN 403, so checks used installed Chrome with a temporary profile. This did not establish support for every target browser.
