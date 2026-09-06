# V3 entry audit — 2026-09-06

Baseline: `cef5acd`, tag `v0.2.0`. The user requires real product data and V2
completion before V3. [V2 MVP acceptance](../v2/acceptance.md) is complete locally:
46 Python checks, 14 frontend checks, 32 browser scenarios covered on the built
Compose stack, real nationwide infrastructure and selected-region population,
and actual Persian reports. This supersedes the initial pre-V2 inventory below
without changing the historical [V2 audit](../v2/audit.md).

## Working modules

- React/Vite/TanStack/MapLibre/ECharts, bilingual RTL shell, source catalog,
  product/quality metadata, native-grid points, raster and vector maps.
- Python source registry and immutable object storage; verified original files,
  unchanged COG normalization and STAC publication.
- Real full-network geodesic line exposure, archived profiles/segments,
  conservative population allocation and historical-boundary clipping.
- Ranking, shared URLs, JSON/CSV/GeoJSON exports and independent PDF jobs.
- One-worker local CLI; PostGIS, MinIO, Martin and Caddy Compose integration.

Published numerical method files are hash-pinned and must not be edited to add
V3 behavior. V3 may consume descriptive exposure with its experimental status;
it must not relabel it independently scientifically validated. Research gradient
and Payne comparisons remain separate from product hazard classification.

## Schema inventory

The 17 baseline tables in `apps/api/src/forudid_api/db.py` are:

| Area | Tables |
| --- | --- |
| Catalog | areas_of_interest, data_sources, source_versions, products, product_assets |
| Processing/quality | processing_runs, reference_points, qc_metrics, analysis_methods, analysis_runs |
| Infrastructure | assets, asset_exposure_summaries, exposure_segments |
| Regions/population | regions, population_exposure_results, regional_infrastructure_results |
| Reporting | screening_reports |

Head migration is `b2a951ce8d03`. Existing source/analysis/report records must be
preserved. Source IDs, product IDs and processing runs are real foreign keys.
Product source dates can have year-only precision; they are not acquisition
timestamps. Observation records need their own explicit interval and component.

## API and pipeline inventory

The exported V2 OpenAPI has 33 paths: AOIs, products and metadata/quality/provenance,
points, processing runs, sources/versions, infrastructure assets and exposure,
ranking, analysis profile/segment exports, regions, population/infrastructure
summaries, reports, raster tiles and health. Martin separately publishes only
`railways` and `major_roads`. No V3 event, case, inspection, sensor or auth endpoint
exists at this baseline. Report POST is a local job request, not organization auth.

The real data pipelines are `ingest`/`register_source`/`normalize`/
`publish_historical`, `ingest_osm`, `ingest_regions`, `ingest_population`, `analyze`,
`analyze_population`, `analyze_regions`, `research_differential` and `report_worker`.
`forudid` exposes their existing supported entry points. The `seed` module remains
software-test support; it is not public evidence or an operational satellite feed.

## Technical debt and migration risks

- No real pixel time series or current acquisition pipeline is connected. The
  2014–2020 rate and seasonal amplitude cannot yield a new event timestamp,
  acceleration or forecast. A real temporal source must be acquired and verified.
- No NISAR product is imported. Search/import must retain maturity, viewing
  geometry and raw lineage; C- and L-band LOS cannot be directly averaged.
- Scientific evidence grades, detector trigger parameters and operational
  priority profiles have not been reviewed. Examples in the specification are
  not thresholds. Unknown grades and unavailable metrics remain explicit.
- Existing `products` assumes satellite orbit and internal processing provenance.
  Ground-sensor observations need a separate contract rather than fabricated orbit
  metadata. Measurement component and method must be preserved independently.
- Event lifecycle must be distinct from public publication. Observation, revision
  and evidence histories must be append-only; a retraction/new revision preserves
  rejected/artifact labels. Concurrent updates require locking and idempotency.
- Source independence must retain raw acquisition IDs and temporal overlap, not
  merely count dataset names. Contradiction remains visible.
- Auth, organization scope, audit logs and ownership checks are prerequisites for
  private cases, field photos and offline inspection synchronization. No public
  operational mutation is introduced before those controls.
- Migrations are additive. Do not downgrade populated historical tables. V3
  round trips use a fresh database or transaction-isolated test data, and every
  schema change must leave V2 read paths working.
- Host PDF rendering is accepted; a containerized renderer and remote CI run are
  not. Large frontend chunks remain. Keep one heavy worker and avoid redundant
  national recomputation or downloading large radar scenes onto limited local disk.

## First vertical slice

Milestone 1 adds event, observation, revision and evidence records with real
foreign keys, versioned provenance, separate publication and append-only history.
Read APIs expose only published eligible records. Controlled synthetic rows are
transaction-isolated tests, never demo product data. The real environment can
truthfully have an empty event list until suitable temporal observations exist.
No ML library, invented event, automated evidence grade or engineering safety
claim is needed for this slice. Later milestones add detection and event UI,
then operational sources and protected investigation workflows in that order.
