# Delivery status

This record separates implementation, workflow acceptance and scientific validation. Failed or skipped checks do not complete a milestone. Historical entries below describe their dated checkpoints, not current runtime health. The V2 MVP acceptance does not establish completion of every V2 or V3 master requirement.

## Complete local workflow and handoff acceptance — 2026-09-11

Version `0.3.0-alpha.11` completes the available public-data walkthrough through
actual file delivery. Failed or nonexistent selected intervals no longer fall
back to a whole-way highlight. Retry/reset controls remain reachable above the
legend on mobile. Full-map navigation retains the exact asset, product, analysis
and interval, and source changes clear old analysis/interval and profile markers.
Ranking CSVs now include source version, component, dates and sign convention.

Acceptance evidence:

- The full API/numerical run passed 69 tests; its one opt-in differential research
  check was then enabled and passed separately (70 distinct tests in total).
  This includes actual raster preservation, PostGIS, source visibility, native
  sampling, exposure, population, regional aggregates, report recovery and
  transaction-isolated event history. Experimental methods remain experimental.
- All 64 desktop/mobile browser tests passed in one final run with one worker,
  including real infrastructure, source comparison, 323 epochs, population
  versions, map modes, interval failure/recovery, asset and region PDFs, source
  registry and event states. Error-path contract fixtures remained isolated to
  tests. A comparison layout check now reads both rectangles in one rendered
  frame, avoiding false failures during asynchronous panel resizing.
- `make check-source` passed: Ruff, Pyright, TypeScript, ESLint, 25 Python source
  tests, 19 frontend tests, archive-boundary check and production build. The
  source-only CLI skip is exercised in the full API run. Alembic reported no
  schema drift; the lockfile passed its offline consistency check.
- The [local railway handoff](../v3/railway-pilot.md#completed-local-handoff--2026-09-11)
  contains a verified four-page Persian PDF and all 120 native profile samples,
  both interval geometries, source records, report manifest and an unfilled user
  evaluation record. PDF bytes match the report checksum; report input SHA-256
  matches the downloaded analysis. All 12 files match the ZIP contents. All PDF
  pages were rendered and visually inspected.

The packet lives under ignored `data/pilots/`; it is not bundled with public
source. These software and delivery steps are complete and are not assigned to
the project owner. No participant, owner approval, field observation, calibrated
probability or demonstrated decision improvement has been invented. Those
external evidence gates remain explicit; speculative copilot, forecast, twin and
Bayesian VoI work remains deferred under the owner's pilot-first direction.

## Native-pixel inspection and practical railway workflow — 2026-09-11

Version `0.3.0-alpha.10` fixes quality-layer sampling: selecting coherence or
velocity uncertainty now reads that raster and preserves its unit, rather than
returning the LOS velocity. Native pixel centres and corners are returned for
valid and masked cells; outside-extent points have no cell. Coordinate rounding
before sampling is removed to avoid moving clicks across pixel boundaries.

The map shows and fits the sampled cell, uses explicit nearest resampling,
compacts point panels without time series, clears the selection marker when
closed, and separates the population footprint from deformation references.
Cell fitting accounts for search and legend overlays. Railway previews include
the raster legend and fit short selected intervals more closely. The map asset
panel now uses the selected product's actual observation period instead of a
hardcoded 2014–2020 interval.

The home page opens the real OSM Tehran–Mashhad railway candidate documented in
[the pilot protocol](../v3/railway-pilot.md). Its profile, interval geometry,
valid/missing lengths and pinned source are inspectable. This is a software
walkthrough; a route-owner review, user session and measured decision outcome
have not occurred. V3 delivery is now gated by that task rather than speculative
assistant, forecast or twin features.

Local acceptance:

- `make check-source` passed: archive-boundary check, Ruff, Pyright, 25 Python
  tests, 19 frontend unit tests, lint, TypeScript and production build. One
  opt-in CLI integration check was skipped in the source-only suite.
- Ten targeted API tests passed against the existing historical, COMET and
  WorldPop 2026 data, including an isolated quality-raster regression. The
  live historical response was independently compared with native raster row
  10898, column 14655: value 37 cm/year, centre and all five closed-ring corners
  matched the immutable local COG exactly.
- Thirty-two browser checks passed with one worker on desktop 1440×1008 and
  mobile 390×844: raster loading, retry/NoData, source/year selection, precise
  coordinates, native-cell navigation, 323 real epochs, source comparison,
  railway intervals, URL restoration and bilingual observation periods.
- Browser plugin not available; the repository's Playwright setup used installed
  Chrome. Rendered native-cell and railway screens were visually inspected;
  screenshots remain local under `/tmp/forudid-qa/`.
- The dependency lock passed its offline check. Existing dependency deprecation
  and large frontend chunk warnings remain; they did not fail these checks.

No new measurements, event publications, analysis recalculations or field
outcomes were fabricated. Source versions and numerical method hashes are
unchanged. These checks establish local software behavior, not geodetic or
structural validation, hosted availability or user decision improvement.

## Complete COMET exposure and source comparison — 2026-09-10

Version `0.3.0-alpha.8` closes the COMET road and regional exposure gaps. All
120,393 major-road ways are published, including 1,719 ways with valid COMET
samples and 1,210,383.4092125613 m of valid summed way length. Both infrastructure
types have country plus all 31 historical-region aggregates (64 results).
WorldPop 2026 and 2020 each have all 32 COMET scopes (64 population results).
The existing numerical methods and source versions remain immutable. Batches
use the common CLI's sequential, resumable `--all-regions` option.

The home page now opens the Varamin pilot directly. `/compare` displays two
explicitly selected published rate products at one coordinate, retaining native
pixels, periods, components, signs, references and source IDs. No subtraction,
fusion or independent-validation claim is introduced. An inspected mobile
spacing defect in the new point-to-comparison link was corrected and covered by
a real geometry assertion on desktop and mobile.
The shared numeric URL validator now rejects empty, null, boolean and structured
coordinates before conversion. Invalid camera values restore defaults; invalid
optional point coordinates remain absent. Numeric zero is preserved. A regression
test reproduced the previous empty-to-zero coercion and passed after the fix;
the comparison route reuses the same validator.

Seventeen real COMET, CLI and recovery checks passed in 4.71 seconds; a separate
all-scope API acceptance passed in 5.01 seconds, covering every one of the 128
regional pairs, conservation, source/year identity and missing-coverage semantics.
The transaction-local PostGIS clipping check also passed. All 18 frontend unit
tests, Ruff, Pyright, TypeScript, ESLint, the frozen offline dependency check and
production web build passed. The exported OpenAPI version is now alpha.8; its
schema shape and generated client did not change.

Forty existing map/content/source/event/exposure/infrastructure/population/region
browser cases passed on the local alpha.8 candidate. Fourteen COMET cases then
passed in 1.8 minutes and all four opt-in historical report cases passed in
9.7 seconds. After the point-link layout fix, the six affected comparison
and time-series cases passed again in 45 seconds. Following the shared-coordinate
fix, all 14 COMET cases and all 14 historical/offline map cases passed on the final
image across two runs (16 cases in 1.7 minutes; 12 opt-in cases in 34.6 seconds). Screenshots
were inspected. Four real country/Tehran PDFs for both population years passed
PDF/HTML hash and input-manifest verification; the six pages of the 2026 Tehran
PDF were visually reviewed. See [report identities](../v2/reports.md#complete-comet-regional-reports-2026-09-10).

The earlier four report browser timeouts occurred while road analysis held the
shared resource lock. The jobs stayed queued; after the sequential analysis
finished, rendering and all four checks succeeded. The UI now explains the
resource wait. No timeout was hidden by increasing the test limit.

Packaging reused verified local dependency runtimes with current application
source and successful `uv sync --frozen --no-dev --offline`; the web packages the
tested production build in Caddy. This verifies these local artifacts, not a
clean-machine build or remote CI. The API returned `0.3.0-alpha.8`, readiness
returned HTTP 200, and the final API/report/web containers had zero restarts and
no OOM termination.

| Local image | SHA-256 |
| --- | --- |
| API and initializer | `4dfaff099b0e8fea119549f057df14a1fd8b4e8368dca3c61b25d5a5ddb7b928` |
| Report worker | `4221057e9b44680cb9b5a7df1b7f67ba171bfc059d7da7b9c50e7296eaf15a5a` |
| Web | `275b47f90704b5ca8cbf954d7c9d2e7bc704a232d567e86b595d4af8251f800e` |

Large map/chart build chunks remain a packaging warning. V3 operational updates,
NISAR measurements, organization/field workflows and scientific review remain
open under the [coverage ledger](specification-coverage.md). The owner confirmed
that no Earthdata account or organization/asset pilot is available. No event,
inspection, outcome or validation was fabricated. No remote repository or
deployment host is configured, so this is a local release.

## COMET acquisition and railway exposure — 2026-09-10

Version `0.3.0-alpha.7` adds foreground COMET metadata checking and integrated
pinned ingestion. The shared downloader now resumes checksum-scoped HTTP ranges
under an exclusive lock; empty/interrupted downloads, ignored ranges, malformed
ranges and changed bytes retain explicit recovery behavior. Failed normalization
attempts remain separate from complete outputs. A changed provider snapshot stops
for review rather than changing an existing scientific source identity.

Real range recovery fetched the final 1 MiB of the official COMET original and
verified the assembled 513,816,102-byte SHA-256. Two integrated ingestions returned
the existing publication ID. All 12,722 imported railway ways were then analyzed
against the actual COMET LOS raster: 244 ways have valid data, totaling
360,375.00715000805 m. Signed numerical bands and the provider reference are
retained; historical analysis identities are unchanged. Country and Tehran
railway aggregates are published. Exact identities and limits are in
[COMET operations](../v2/comet-varamin.md).

The final targeted API run passed 16 checks with one unrelated opt-in CLI report
check skipped. All 11 numerical checks and 17 frontend unit checks passed, as did
Ruff, Pyright, TypeScript, ESLint, the frozen offline lock check and the production
frontend build. Ten real desktop/mobile cases passed against the local Compose
stack in 44 seconds. After adding the real PDF action, both railway browser cases
passed again in 34.6 seconds, including PDF SHA-256 verification. The native COG
and every returned sample of the selected COMET railway profile matched.
Persian/English dates, signed rates, source identity, interval URL restoration
and narrow-width layout passed. Desktop and mobile screenshots were inspected.

The container report worker generated real COMET railway report
`16f0b488-0649-500d-a825-4c0cc5277533`, 486,553 bytes, SHA-256
`52abb64810cc12f785f016b9a035c0753784cf9998d06b198c0ed8ac8707fdaf`.
No host API or report worker was used for this browser/PDF acceptance.

Packaging reused the previously verified local dependency runtimes and completed
`uv sync --frozen --no-dev --offline`; the web image uses the tested production
build. This is local runtime packaging, not a new clean-machine build. The final
Compose stack became healthy. Its image identities are:

| Local image | SHA-256 |
| --- | --- |
| API and initializer | `9374d8800ad742c0a03143efe54bfd139b9b9385876abad6f6e21e54001f64a9` |
| Report worker | `3b05ab0d3b7be67531866d67b3187f0c636c013ced2b5f0e99fe7c1fd6e67fc7` |
| Web | `d7fa0ad94f34f9e90f688df8bc519cc34da7cda18e18e76a702add737bc4a5dd` |

The COMET major-road pair and complete regional PDFs remain open. V3 milestone 4
is partial: scheduled changed-snapshot acceptance and reviewed event updates are
not implemented. NISAR measurements, private organization workflows and the other
scientific milestones retain their documented evidence gates. No public host or
remote repository is configured, and no remote deployment is claimed.

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
