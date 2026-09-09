# V1 audit for FORUDID V2

Audit date: 2026-09-05. Baseline: `c250a67` / `v0.1.0`, with content-page changes in `d0642f3` and `03e3417`. Independent page, CSS, version and branding edits were present in the worktree and were outside this audit. This historical record preserves what was known then; later acceptance is documented separately.

## Finding

V1 was a local WebGIS using synthetic fixtures, not a complete scientific Varamin product. Its stack could be retained for V2, but product modeling and sampling were not yet source-independent. Stage-zero architecture and decisions were documented while runtime acceptance remained open: Docker Desktop was unreachable. Stage-two catalog delivery could not be accepted before migration and API checks on real PostGIS.

The [V2 specification](MASTER_SPEC.md) defines new capabilities. Preserve [V1](../MASTER_SPEC.md) and history. New ADRs revise the requirement that every product be LOS generated through HyP3/MintPy, while reference integrity, real data, provenance and local-only development remain mandatory.

## Existing architecture and retained boundaries

| Path | Responsibility at audit time | V2 decision |
| --- | --- | --- |
| `apps/web/src/app/router.tsx` | SPA shell, URLs and pages | Retain; add routes after corresponding APIs |
| `apps/web/src/routes/map.tsx` | Product/layer/point selection and dialogs | Retain; add modes and source selection incrementally |
| `apps/web/src/features/map/MapCanvas.tsx` | MapLibre raster and small GeoJSON | Retain; use Martin/MVT for national networks |
| `apps/web/src/generated/api/forudid.ts` | Orval client from OpenAPI | Regenerate only |
| `apps/api/src/forudid_api/main.py` | Read API, errors and request IDs | Retain; add catalog and result endpoints |
| `apps/api/src/forudid_api/catalog.py` | Product/asset publication guards | Preserve gates and add external provenance |
| `apps/api/src/forudid_api/tiles.py` | Asset-ID-restricted TiTiler | Extend deliberately for new kinds/components |
| `apps/api/src/forudid_api/points.py` | Fixture and time-series sampling | Generalize before external ingestion |
| `apps/api/src/forudid_api/storage.py` | Private S3, checksums, immutable writes | Preserve contract; add large-file streaming |
| `apps/api/src/forudid_api/seed.py` | Small COG/STAC fixture | Retain only for V1 regression |
| `compose.yml`, `infra/` | PostGIS, MinIO, initializer, API, web, Caddy | Retain; add explicitly exposed Martin views in stage 5 |

Do not rewrite React 19, Vite 8, TypeScript, TanStack, MapLibre 6, ECharts, Tailwind/Radix, FastAPI, SQLAlchemy/Alembic, TiTiler or object storage. HDF5/Zarr remain future publication paths; the existing cube is small JSON. The existing worker only seeds fixtures and is not a scientific engine.

## V1 tables

Source: `apps/api/src/forudid_api/db.py` and migration `98916efed35d_initial_catalog`. Extracted from code; live database migration state could not be reread during this audit.

| Table | Model | Principal data and relationships |
| --- | --- | --- |
| `areas_of_interest` | AOI | Unique slug, MultiPolygon/4326, bbox, names, active |
| `processing_runs` | Run | AOI, configuration, profile, Git SHA, status, parent run |
| `products` | Product | Required AOI/run, kind, orbit/track, period, unit, statistics, STAC ID |
| `product_assets` | Asset | Product file, unique object key, checksum, size, media type |
| `reference_points` | Reference | Run, Point/4326, method, reason, reviewer, stability metadata |
| `qc_metrics` | QCMetric | Run/product, number or JSON, threshold, pass state |

The existing Asset is a product file; V2 `assets` means spatial infrastructure. Use a distinct Python model such as `InfrastructureAsset`. Do not rename or remove `product_assets`. V2 migrations are additive; never rewrite an applied V1 migration. Downgrades concern only their own migration and temporary-database tests.

## Existing API routes

All listed routes were GETs, with no public heavy analysis, arbitrary import or publication API. Sources: `main.py`, `tiles.py`, and `docs/openapi.json`.

| Route | Purpose |
| --- | --- |
| `/health/live` | Process liveness |
| `/health/ready` | PostGIS and bucket availability |
| `/api/v1/aois` | Active areas |
| `/api/v1/aois/{slug}` | Area details |
| `/api/v1/products` | Published products filtered by AOI/kind/orbit/track/run |
| `/api/v1/products/{product_id}` | Product details |
| `/api/v1/products/{product_id}/legend` | Server colors and units |
| `/api/v1/products/{product_id}/quality` | Product quality |
| `/api/v1/products/{product_id}/metadata` | STAC |
| `/api/v1/products/{product_id}/provenance` | Production history |
| `/api/v1/points/summary` | Coordinates and product ID |
| `/api/v1/points/timeseries` | Coordinates and run ID |
| `/api/v1/runs/{run_id}` | Published run |
| `/tiles/{asset_id}/{z}/{x}/{y}.png` | Published raster; only the style query is allowed |

FastAPI also provides `/docs`, `/redoc` and `/openapi.json`. V2 source, asset, region, report and vector routes did not yet exist.

## Frontend routes

| Route | Responsibility |
| --- | --- |
| `/` | Short introduction and fixture entry |
| `/map` | Map and LOS point |
| `/methodology` | Independent `routes/methodology.tsx` page |
| `/about` | Independent `routes/about.tsx` with author-owned text |

The About page's authored text is outside V2 architectural changes. Persian and Latin names were already correct; no repository rename/history rewrite was needed. Review uncommitted branding only against its selected design record, not assumptions or rejected alternatives.

## Prioritized debt and correction points

| Priority | Code evidence | Impact and planned correction |
| --- | --- | --- |
| P1 | Required `Product.processing_run_id`; Run joins | External products cannot bypass internal runs; stage 3 adds source FK/provenance while preserving V1 readers |
| P1 | Kinds limited to velocity_los/coherence/uncertainty/mask/timeseries | Stage 3 adds explicit metric/component/method for vertical and seasonal amplitude |
| P1 | Point summary depends on JSON cube and all three rasters | Missing uncertainty/time series must not break sampling; independent native-grid reads and explicit nulls |
| P1 | Time series always requires velocity_los and run | Declare capabilities; never fabricate a time series for a static dataset |
| P1 | `put_immutable` takes bytes and rereads the whole object | Stream checksums/uploads before large PBF/raster ingestion; preserve no-overwrite behavior |
| P1 | Tile gates depend on role/kind/publication | Validate external rasters before publication; arbitrary URLs remain prohibited |
| P2 | Integer asset size and string product dates | Add BIGINT before large files; additive Date/range validation migration |
| P2 | Unpaginated products | Add pagination and indexes for new national endpoints, then V1 |
| P2 | Fixed Varamin AOI in Zod and selection | Real source switching and internal search in stages 3 and 8 |
| P2 | Accepted but unused URL `from/to` | Do not imply unapplied filters; define period contract in stage 3 |
| P2 | Fixed LOS labels and layer array | Read component/unit/capability metadata; relabeling alone is insufficient |
| P2 | Large build chunk warning | Map/chart are already lazy; measure real UI before adding parallel libraries |
| P2 | Sanitized errors but limited cause logs | Database timeout and credential-free exception-type logging before stage-two runtime gate |

## Initial source research

[Zenodo version 1.0.0, record 10815578](https://zenodo.org/records/10815578) contains rate, seasonal amplitude and mask for 2014–2020 under CC BY 4.0. Rate and amplitude are projected from descending LOS into vertical, not decomposed from ascending/descending. Version DOI: `10.5281/zenodo.10815578`. Actual band units, scale/offset, NoData, CRS, resolution, sign and reference still required file/paper inspection. No dataset had been downloaded or ingested at this audit. Preserve author/Copernicus attribution and original metadata with the source version.

[Geofabrik Iran](https://download.geofabrik.de/asia/iran.html) offers dated PBF snapshots with ODbL 1.0/OSM Contributors attribution. Pin the exact snapshot and local SHA-256; `latest` is not an identity. No actual feature count or corridor coverage had yet been verified.

The [WorldPop API](https://www.worldpop.org/sdi/introapi/) documents discovery. Exact Iran product, year, method, count/density semantics, citation and license remained open. Do not generalize one product's license to all families.

The likely Payne reference was identified as [10.1029/2024JB030367](https://doi.org/10.1029/2024JB030367). This identified the paper only: method/supplement extraction, reproduction and scientific review were not complete. It supplied no accepted threshold or beta value.

## Decisions and delivery sequence

Nine requested V2 ADRs live in [adr](adr/). Their separate directory avoids collision with V1 localhost ADR `0010` while preserving history.

| Stage | Acceptance slice | Principal gate |
| --- | --- | --- |
| 0 | Audit, code map, debt and ADRs | Code/baseline evidence; Compose blocked at the time |
| 1 | Correct shell/title/docs naming and pivot explanation | Preserve author copy, RTL and V1 routes |
| 2 | CLI registration → source version → API → `/sources` | Citation/license/version/checksum, idempotency, pagination, real migration |
| 3 | One real Haghighi–Motagh version | Immutable original, COG/STAC, correct component/method/period/attribution |
| 4 | OSM snapshot → rail/major roads | Original tags, counts, geometry inspection, provenance |
| 5 | Martin → MVT → map | Allowed views only, no national GeoJSON, no draft exposure |
| 6 | Analytical 10 × 10 km fixture and two lines | Known length/chainage/NoData/coverage/segments/tolerance |
| 7–9 | Real corridor → profile/summary/segments → UI | Descriptive analysis, deep links, linked table/map selection, provenance |
| 10–11 | Population dataset → region | Conservation, grid/NoData, explicit estimated population/year |
| 12–15 | Experimental proxy then differential research | Disabled flag; validated only after reproduction and scientific review |
| 16–17 | Persian report and CSV/GeoJSON | Method/source IDs, period, limits, React-independent PDF, traceable exports |
| 18 | Buildings | Optional V2.1; not an MVP blocker |

## Next-stage acceptance criteria

An analyst must be able to identify the exact source/version behind a result. Metadata registration alone does not establish ingestion or scientific validity.

- CLI accepts valid citation, license, provider and version; calculate SHA-256 from the actual file.
- Repeating identical input creates no duplicate; a conflicting checksum under the same identity fails.
- Source versions are immutable; input changes create new versions.
- The three source GETs in section 75 and `/sources` loading/error/empty states work.
- No private URI or credential reaches the browser; do not expose arbitrary public imports.
- Additive migration, temporary-database roundtrip, real API integration, Orval synchronization and RTL browser checks pass.

This stage needs no new scientific dependency: argparse/pathlib/hashlib, Pydantic, SQLAlchemy and existing UI components suffice. Add adapters when their actual stage is implemented.

## Open scientific assumptions

Actual file units/sign/reference/grid, precise input method and period, minimum quality, descriptive bands, resolution-based spacing, population semantics/conservation, real corridor coverage, OSM completeness and valid Payne method/threshold/window remained unresolved. Never fill them with invented values. Missing uncertainty is null; zero differs from NoData; no detected deformation does not establish structural safety.

## Change and migration scope

This was stage-zero documentation only, with no new migration, dependency or endpoint. See [verification](verification.md) for checks from that turn. [V1 milestone records](../operations/milestones.md) are historical evidence, not proof of current stack health.
