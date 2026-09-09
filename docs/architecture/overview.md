# Local platform architecture

React 19 and Vite 8 build a static SPA. TanStack Router and Zod keep validated,
shareable state in the URL; Query caches remote data; React holds transient dialog
state. Desktop layer and point panels become sheets on mobile.

FastAPI exports the typed contract and Orval 8 generates the client and hooks.
PostGIS is the metadata authority. Objects are private in S3-compatible storage.
TiTiler serves only published asset identifiers. Raster rescaling and colour maps
share the server registry that supplies legends. COG masks keep NoData transparent.
The verified population-source API separately serves native counts and population
tiles; a population year does not change the historical deformation period.

The local map uses generalized Natural Earth country context and a place index
extracted from the pinned OSM snapshot. These display layers are not analysis
boundaries. National infrastructure remains Martin MVT, rather than browser-side
national GeoJSON. Population selection is retained across the map and region page.

## Fixture boundary

`forudid_api.seed` generates synthetic test data, not scientific processing output.
Its temporal input is a small JSON cube, as allowed for the fixture stage. A real
cube requires chunked Zarr 3 access, and a real MintPy archive must retain HDF5.
The public API hides fixtures by default.

The API environment excludes MintPy, Conda and HyP3 processing dependencies.
Rasterio supports TiTiler and native sampling. Source ingestion and analysis use
explicit foreground commands; the original Compose worker is the fixture command.

## Performance and error contracts

- Camera state enters the URL at the end of a move; selected-point coordinates remain independent.
- Point query keys include product/run and coordinates. AbortSignal passes through Query to fetch.
- ECharts loads lazily with the required modules. MapLibre loads with map routes.
- API errors have a public Persian message and request ID; stack traces and signed URLs stay private.
- A time-series failure does not stop the map. Failed QC/summary requests must not show unqualified values.
- Product listing batches AOI and asset reads to avoid N+1 queries.
- Population years select immutable source versions. Default analysis selection orders by population year, then publication time.

## Dependencies and purpose

| Group | Purpose |
| --- | --- |
| React, Vite, TypeScript, Tailwind | The specified static frontend stack |
| TanStack Router/Query, Zod | Validated URLs, caching and cancellation |
| MapLibre, react-map-gl | WebGL2 tile map and interaction |
| ECharts | Temporal plots, zoom, missing observations and uncertainty bands |
| Radix and button utilities | Accessible dialogs, focus management and consistent primitives |
| Self-hosted Persian fonts, Lucide | Persian typography and semantic icons |
| FastAPI/Pydantic, SQLAlchemy/Alembic, psycopg/GeoAlchemy | Typed API, migrations and PostGIS |
| TiTiler, boto3, PySTAC validation | COG, S3 and standard metadata validation |
| Orval, Vitest, Playwright, Ruff, Pyright, pytest | Contract generation and verification |

Operational authentication, notifications, automated workflows and public hosting
are not established by the existing V2/V3 foundation. See the version-specific
audits for requirements and their actual implementation state.
