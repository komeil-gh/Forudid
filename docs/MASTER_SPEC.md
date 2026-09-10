# فرودید | FORUDID — Master Engineering Specification

## 0. Project mission

**FORUDID**, known in Persian as «فرودید», is a scientific and operational WebGIS platform for monitoring ground deformation in Iran using Sentinel-1 InSAR.

The project currently runs only on **localhost** and has no public domain. Replace references to domains, public links or production addresses with configured local development addresses, for example:

```text
http://localhost:5173/map
```

Or use another port defined in project configuration.

Version one must not claim to invent an InSAR algorithm. It must turn established scientific processing into a reproducible, versioned and usable workflow.

Users must be able to:

1. View an AOI on the map.
2. View LOS deformation velocity.
3. View coherence and uncertainty.
4. Select a point.
5. Read that point's LOS velocity and QC.
6. View its displacement time series.
7. Identify the date, product, orbit and processing run.
8. Understand the reliability of the displayed value.
9. Share or locally save a link to the same view.
10. Inspect product metadata and provenance.

Project principle:

> Measure one plain correctly before measuring Iran.

Start the MVP with **Varamin** only.

---

# 1. Non-negotiable scientific rules

## 1.1 LOS is not vertical subsidence

Never display statements such as:

```text
Vertical Subsidence = -72 mm/year
```

Unless the product was actually produced through appropriate scientific ascending/descending decomposition.

The primary label in version one must be the following Persian UI text:

**نرخ تغییرشکل در راستای دید ماهواره — LOS Velocity**

Or:

**LOS Velocity (mm/year)**

This is a core project requirement.

## 1.2 Define the sign convention

Every product must contain sign-convention metadata.

The frontend must not infer positive or negative meaning independently of metadata.

Explain the product convention in the legend tooltip.

## 1.3 Displacement is relative

Every time series must include:

* reference date
* reference point/area
* orbit
* processing run
* unit

Users must be able to identify the reference used for the measurement.

## 1.4 QC is part of the product

Every value must make at least the following information available:

* temporal coherence
* uncertainty
* observation count
* orbit direction
* relative orbit / track
* period start
* period end
* latest acquisition
* processing version
* reference point
* quality status

## 1.5 Do not hard-code scientific thresholds

Parameters such as:

* coherence threshold
* maximum temporal baseline
* maximum perpendicular baseline
* minimum valid observations
* uncertainty cutoff

Must belong to a Processing Profile.

All must be versioned and adjustable.

---

# 2. Final frontend decision

## 2.1 Core

Frontend stack:

```text
React 19
TypeScript
Vite 8
pnpm
```

Do not use Next.js.

Do not use SSR.

Use an independent SPA connected to FastAPI.

Produce a static build.

Run locally without depending on `farodid.ir` or any other public domain.

## 2.2 Routing

Use:

```text
@tanstack/react-router
```

The main reason is to keep shareable map state in the URL.

Local example:

```text
/map
  ?aoi=varamin
  &lon=51.6452
  &lat=35.3241
  &z=10.8
  &layer=velocity_los
  &orbit=descending
  &run=019...
  &panel=point
```

Validate search parameters with Zod.

Every significant map view must be bookmarkable and recoverable after local reload.

## 2.3 Server State

Use:

```text
@tanstack/react-query
```

Manage all API information, including:

* AOI
* products
* point statistics
* time series
* acquisitions
* QC
* processing runs

Through TanStack Query.

Do not install Redux.

Do not install Zustand in the MVP.

State architecture:

```text
Shareable application state
        ↓
TanStack Router / URL

Remote/server state
        ↓
TanStack Query

Temporary UI state
        ↓
React local state
```

If state later becomes complex, introduce Zustand only through a separate ADR.

---

# 3. Map stack

Use:

```text
MapLibre GL JS 6.x
react-map-gl 8.x
```

Implement the map component directly in React.

deck.gl is not required for the MVP.

Keep the map-layer architecture capable of later adding:

```text
deck.gl
```

Potential deck.gl uses:

* hundreds of thousands of validation points
* GNSS stations
* infrastructure risk
* wells
* large scatter data
* GPU aggregation
* paths
* advanced geospatial visualization

## 3.1 Map performance rule

Frequent events such as:

```text
mousemove
onHover
onViewStateChange
```

Must not update the entire application state every frame.

Write camera state to the URL only on:

```text
moveend
zoomend
```

Or with appropriate debouncing.

Keep hover state local or in a ref.

---

# 4. Visualization stack

Charts:

```text
Apache ECharts 6
```

Do not import the full bundle without need.

Import only required modules.

The time-series chart must include:

* X = acquisition date
* Y = LOS displacement
* display unit: mm
* reference zero
* tooltip
* uncertainty band when available
* missing observations
* zoom
* reset zoom
* CSV export later

Do not convey quality through color alone.

---

# 5. UI system

Use:

```text
Tailwind CSS 4
shadcn/ui
Radix UI
```

Initial language:

```text
fa
```

Direction:

```html
<html lang="fa" dir="rtl">
```

Enable RTL from the first commit.

Do not defer it until project completion.

Wrap technical numbers, ISO dates, coordinates and identifiers with:

```css
direction: ltr;
unicode-bidi: isolate;
```

Apply this directional isolation consistently.

Display the brand in the UI as:

```text
فرودید | FORUDID
```

---

# 6. Frontend API generation

FastAPI is the source of truth for the API contract.

Do not handwrite frontend API types.

Pipeline:

```text
FastAPI
   ↓
/openapi.json
   ↓
Orval
   ↓
TypeScript API Client
   ↓
TanStack Query hooks
```

Use:

```text
Orval 8
```

Place generated code in:

```text
apps/web/src/generated/api
```

Use this generated-code directory.

Do not edit generated files manually.

CI must check that the generated client is synchronized with OpenAPI.

Make the local API address configurable without depending on internal Docker hostnames or a public domain.

---

# 7. Frontend Testing

Use:

```text
Vitest
React Testing Library
Playwright
```

Unit test:

* utility
* parsers
* URL state
* unit conversion
* legend logic
* API adapters
* quality label logic

Component test:

* PointPanel
* LayerPanel
* Legend
* TimeSeriesChart
* ProductSelector

E2E:

* opening the local map
* AOI selection
* velocity display
* point selection
* time-series display
* layer changes
* deep link
* deep-link reload
* mobile bottom sheet

MapLibre itself may be mocked in unit tests.

Run a real map with a fixture COG in Playwright.

---

# 8. Backend Stack

API:

```text
Python
FastAPI
Pydantic v2
SQLAlchemy 2
Alembic
psycopg 3
GeoAlchemy2
PostgreSQL
PostGIS
```

Package management API:

```text
uv
```

Keep the API environment separate from scientific processing.

---

# 9. Separate API and science environments

Never merge these environments.

## API image

Keep the API image lighter:

```text
FastAPI
SQLAlchemy
TiTiler
Pydantic
GeoAlchemy
boto3
PySTAC
```

## Science image

Use Conda/Mamba for science:

```text
MintPy
GDAL
Rasterio
xarray
h5py
zarr
asf_search
hyp3_sdk
PySTAC
rio-cogeo
scientific dependencies
```

Reason:

MintPy/GDAL dependencies must not make routine API deployment fragile.

---

# 10. Raster serving

Use:

```text
TiTiler
```

The MVP does not require TiTiler to be a separate microservice.

Mount it in FastAPI:

```text
FastAPI
├── /api/v1/*
└── /tiles/*
      └── TiTiler routers
```

If tile traffic becomes heavy, separate it without changing the public API.

These routes currently remain local-only.

---

# 11. TiTiler security rule

The public API must not expose routes such as:

```text
/tiles?url=https://anything-user-wants.example/file.tif
```

Never accept arbitrary user-supplied URLs in TiTiler.

Instead use:

```text
/tiles/{asset_id}/{z}/{x}/{y}.png
```

Backend:

1. Receive `asset_id`.
2. Resolve it in the database.
3. Verify that the asset is published.
4. Resolve its internal S3 URI.
5. Pass only that trusted URI to the tiler.

This reduces SSRF and unauthorized-object access risks.

---

# 12. Storage architecture

Keep storage architecture independent of a vendor.

Interface:

```text
S3-compatible Object Storage
```

The application uses the S3 standard only.

Configuration:

```text
S3_ENDPOINT
S3_REGION
S3_ACCESS_KEY
S3_SECRET_KEY
S3_BUCKET
S3_PATH_STYLE
```

Keep object storage private.

Do not make raster buckets public without a later explicit architecture decision.

Development storage can use a local S3-compatible service without a public domain.

---

# 13. Object naming

Never overwrite a scientific product.

Suggested structure:

```text
s3://forudid/
  aoi/
    varamin/
      descending/
        track-071/
          runs/
            {run_uuid}/
              raw-hyp3/
              mintpy/
              publish/
                velocity_los.tif
                temporal_coherence.tif
                uncertainty_velocity.tif
                valid_mask.tif
                timeseries.zarr/
                stac-item.json
                qc-report.json
                provenance.json
```

Make bucket names and prefixes configurable.

Do not create `latest/velocity.tif`.

Resolve the latest product through the database.

---

# 14. Scientific archive vs Web product

Keep these two concepts separate:

## Scientific archive

Preserve the original MintPy output:

```text
HDF5
```

Retain this scientific archive.

## Published web products

```text
COG
Zarr v3
STAC
JSON metadata
```

The relationship is:

```text
MintPy
  │
  ├── HDF5 archival output
  │
  └── publish
       ├── COG
       ├── Zarr
       ├── STAC
       ├── QC
       └── provenance
```

Do not delete HDF5 merely because Zarr was added.

---

# 15. STAC

Produce STAC product metadata from the start.

The MVP does not require:

```text
pgSTAC
stac-fastapi
```

These services are unnecessary initially.

PySTAC is sufficient at first.

Structure:

```text
STAC Catalog
  ↓
Collection: forudid-varamin
  ↓
Item: processing run / velocity product
```

Every STAC Item must include at least:

* geometry
* bbox
* datetime/start_datetime/end_datetime
* orbit direction
* relative orbit
* platform
* processing version
* run ID
* CRS metadata
* unit metadata
* assets

Assets:

```text
velocity_los
temporal_coherence
uncertainty_velocity
timeseries
qc
provenance
```

---

# 16. Database

PostgreSQL/PostGIS is the source of truth for metadata and vectors.

Do not store rasters inside PostgreSQL.

## 16.1 areas_of_interest

```text
id UUID
slug TEXT UNIQUE
name_fa TEXT
name_en TEXT
geom MULTIPOLYGON 4326
bbox JSONB
active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

GIST index:

```text
geom
```

---

# 17. acquisitions

```text
id UUID
external_id TEXT UNIQUE
platform TEXT
acquisition_at TIMESTAMPTZ
relative_orbit INTEGER
orbit_direction ENUM
polarization TEXT
beam_mode TEXT
provider TEXT
geom MULTIPOLYGON
raw_metadata JSONB
created_at TIMESTAMPTZ
```

Indexes:

```text
acquisition_at
relative_orbit
orbit_direction
geom GIST
```

---

# 18. bursts

```text
id UUID
acquisition_id UUID FK
burst_id TEXT
subswath TEXT
burst_index INTEGER
geom MULTIPOLYGON
metadata JSONB
```

Unique:

```text
(acquisition_id, burst_id)
```

---

# 19. insar_pairs

```text
id UUID
aoi_id UUID
reference_acquisition_id UUID
secondary_acquisition_id UUID

relative_orbit INTEGER

temporal_baseline_days INTEGER
perpendicular_baseline_m FLOAT NULL

pair_signature TEXT UNIQUE

status ENUM

created_at
```

Use `pair_signature` for idempotency.

---

# 20. processing_runs

The principal operational table:

```text
id UUID
aoi_id UUID

pipeline_version TEXT
git_sha TEXT
processing_profile TEXT
config JSONB

status ENUM:
  created
  discovering
  submitting
  processing
  downloading
  mintpy
  qc
  validation_required
  publishing
  published
  failed
  cancelled

started_at TIMESTAMPTZ
finished_at TIMESTAMPTZ

parent_run_id UUID NULL

log_uri TEXT
error JSONB
created_at
```

Every scientific configuration change creates a new run.

---

# 21. processing_jobs

```text
id UUID
processing_run_id UUID
provider TEXT
job_type TEXT

external_job_id TEXT UNIQUE

status TEXT

submitted_at
completed_at
expires_at

request JSONB
response JSONB
```

Preserve complete HyP3 job metadata.

---

# 22. products

```text
id UUID
processing_run_id UUID
aoi_id UUID

kind ENUM:
  velocity_los
  temporal_coherence
  velocity_uncertainty
  valid_mask
  timeseries

orbit_direction
relative_orbit

start_date
end_date

unit
crs
resolution_metadata JSONB

status ENUM:
  draft
  validated
  published
  superseded

processing_version

stats JSONB
stac_item_id TEXT

created_at
published_at
```

---

# 23. product_assets

```text
id UUID
product_id UUID

role TEXT
object_key TEXT
media_type TEXT

size_bytes BIGINT
checksum_sha256 TEXT
etag TEXT

created_at
```

Store object keys, not presigned URLs.

---

# 24. reference_points

```text
id UUID
processing_run_id UUID

geom POINT
method TEXT
reason TEXT

selected_by TEXT

stability_metrics JSONB
created_at
```

The frontend must be able to display the associated reference point.

---

# 25. qc_metrics

```text
id UUID
processing_run_id UUID
product_id UUID NULL

metric_name TEXT

value_number DOUBLE PRECISION NULL
value_json JSONB NULL

threshold JSONB NULL
passed BOOLEAN NULL

created_at
```

Store thresholds with their run.

---

# 26. validation_observations

For later implementation:

```text
id
source_type:
  GNSS
  leveling
  literature
  field

geom
observed_at

values JSONB
source_reference TEXT
metadata JSONB
```

---

# 27. API structure

Base path:

```text
/api/v1
```

The API currently uses a local project address, for example:

```text
http://localhost:8000/api/v1
```

Read the port from configuration; documentation must not assume a fixed port.

Health:

```text
GET /health/live
GET /health/ready
```

AOI:

```text
GET /api/v1/aois
GET /api/v1/aois/{slug}
```

Products:

```text
GET /api/v1/products
GET /api/v1/products/{id}
GET /api/v1/products/{id}/metadata
GET /api/v1/products/{id}/legend
GET /api/v1/products/{id}/quality
```

Filtering:

```text
?aoi=varamin
&kind=velocity_los
&orbit=descending
&relative_orbit=71
&status=published
```

---

# 28. Point API

```text
GET /api/v1/points/summary
```

Parameters:

```text
lon
lat
product_id
```

Response:

```json
{
  "coordinate": {
    "lon": 51.6452,
    "lat": 35.3241
  },
  "product_id": "uuid",
  "velocity_los": {
    "value": -0.0712,
    "unit": "m/year"
  },
  "velocity_uncertainty": {
    "value": 0.006,
    "unit": "m/year"
  },
  "temporal_coherence": 0.89,
  "observations": 68,
  "orbit_direction": "descending",
  "relative_orbit": 71,
  "reference_id": "uuid",
  "start_date": "2025-01-01",
  "end_date": "2026-08-29",
  "quality": "valid"
}
```

Preserve canonical SI units internally.

Frontend:

```text
m/year → mm/year
```

Convert in the frontend, or provide a separate API presentation value.

Retain the canonical value in the response.

---

# 29. Time Series API

```text
GET /api/v1/points/timeseries
```

Parameters:

```text
lon
lat
run_id
```

Response:

```json
{
  "coordinate": {
    "lon": 51.6452,
    "lat": 35.3241
  },
  "unit": "m",
  "reference_date": "2025-01-01",
  "reference_point_id": "uuid",
  "series": [
    {
      "date": "2025-01-01",
      "displacement": 0.0,
      "uncertainty": null
    }
  ]
}
```

For the MVP, extraction may run server-side from HDF5/Zarr.

Add point-request caching later.

---

# 30. Region statistics API

After the point API:

```text
POST /api/v1/regions/statistics
```

Body:

```json
{
  "product_id": "uuid",
  "geometry": {
    "type": "Polygon",
    "coordinates": []
  }
}
```

Response:

```text
mean
median
min
max
std
valid_pixel_count
coverage_fraction
area_above_threshold
```

Do not accept arbitrary client thresholds unless bounded and validated.

Bound polygon requests by:

* maximum vertices
* maximum geographic area
* timeout
* request size

---

# 31. Tile API

Public within the local environment:

```text
GET /tiles/{asset_id}/{z}/{x}/{y}.png
```

Allow only whitelisted query parameters:

```text
style
```

Example:

```text
?style=velocity-default
```

Do not allow the client to supply:

* arbitrary file path
* arbitrary S3 URL
* arbitrary remote URL
* arbitrary Python expression

Define styles server-side.

---

# 32. Product styles

Registry:

```text
velocity-default
velocity-high-contrast
coherence-default
uncertainty-default
```

Every style must include:

```text
rescale
colormap
nodata behavior
mask behavior
legend ticks
unit
```

Include all of these fields.

The frontend legend must use the same API style metadata.

Do not define the color scale independently of tile rendering.

---

# 33. Frontend routes

```text
/
/map
/areas/$aoiSlug
/products/$productId
/methodology
/about
```

The home page may remain simple.

The product core is `/map`.

These routes must be accessible through the local frontend address, for example:

```text
http://localhost:5173/map
```

---

# 34. Map URL state

Approximate schema:

```text
aoi
lon
lat
z
bearing
pitch
layer
product
run
orbit
from
to
opacity
panel
```

Validate every search parameter.

Invalid URLs must not crash the application.

Fallback:

```text
default Iran extent
```

Or use the default Varamin AOI in the MVP.

---

# 35. Desktop layout

Suggested layout:

```text
┌──────────────────────────────────────────────────────────┐
│ فرودید | FORUDID       Search             Product / About│
├───────────────┬──────────────────────────────────────────┤
│               │                                          │
│ Layer panel   │                                          │
│ سمت راست      │                  MAP                     │
│               │                                          │
│               │                                          │
│               │                                          │
├───────────────┴──────────────────────────────────────────┤
│ Selected Point / Time Series                    ▲        │
└──────────────────────────────────────────────────────────┘
```

RTL:

Place the layer panel on the right.

Use the bottom panel for time series.

Give the map as much space as possible.

---

# 36. Mobile layout

On mobile:

* full-screen map
* top search compact
* floating layer button
* selected point in a bottom sheet
* time series inside the bottom sheet
* no permanent sidebar

Use appropriately sized touch targets.

---

# 37. Layer panel

MVP layers only:

```text
● LOS Velocity
○ Temporal Coherence
○ Velocity Uncertainty
```

Opacity:

```text
0–100%
```

Metadata:

```text
Orbit
Track
Start
End
Processing version
```

Do not add aquifer, road, railway or other layers until the scientific MVP works.

---

# 38. Legend

Velocity legend:

```text
LOS Velocity
mm/year
```

Do not label it merely:

```text
Subsidence
```

The label must identify the measured component.

The legend must include:

* unit
* min/max
* ticks
* nodata
* masked pixels
* sign convention tooltip

Provide all of this context.

---

# 39. Point interaction

Click map:

```text
Map Click
    ↓
coordinate
    ↓
GET point summary
    ↓
show point marker
    ↓
GET time series
    ↓
open bottom panel
```

Cancel the previous request when another point is selected.

The TanStack Query key must include:

```text
productId
rounded lon
rounded lat
```

Include all of these values in the key.

Coordinate rounding must match raster resolution.

---

# 40. Point detail UI

Display:

```text
مختصات
51.6452, 35.3241

LOS Velocity
-71.2 mm/year

Uncertainty
±6.0 mm/year

Temporal coherence
0.89

Observations
68

Orbit
Descending

Relative orbit
71

Period
2025-01-01 → 2026-08-29

Reference
REF-...

Processing
v...
```

Do not remove a poor-quality value; display it with an explicit status.

For example:

```text
کیفیت پایین — برای استناد مناسب نیست
```

---

# 41. UI quality model

For example:

```text
valid
caution
invalid
nodata
```

The status must come from backend QC.

The frontend must not invent scientific thresholds.

Color must not be the only indicator.

Use both an icon and text.

---

# 42. Accessibility

All selected-point data shown only on canvas/WebGL must also be readable in the DOM.

Requirements:

* keyboard navigation
* visible focus
* semantic buttons
* ARIA labels
* chart textual summary
* adequate contrast
* color-independent status
* reduced-motion support

---

# 43. Basemap

Do not use a public demo tile provider as a production basemap without permission.

The basemap is currently configured for local development only; do not assume a public domain or production service is available.

Basemap configuration:

```text
VITE_BASEMAP_STYLE_URL
VITE_BASEMAP_ATTRIBUTION
```

Use these configuration fields.

Make the provider replaceable.

Never hide attribution.

---

# 44. Repository structure

Monorepo:

```text
forudid/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   ├── public/
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── api/
│       ├── src/forudid_api/
│       ├── tests/
│       └── pyproject.toml
│
├── packages/
│   └── python/
│       └── forudid_core/
│           ├── domain/
│           ├── db/
│           ├── storage/
│           └── stac/
│
├── pipeline/
│   ├── discovery/
│   ├── pairing/
│   ├── hyp3/
│   ├── mintpy/
│   ├── qc/
│   ├── publish/
│   ├── profiles/
│   └── tests/
│
├── infra/
│   ├── compose/
│   ├── caddy/
│   └── docker/
│
├── fixtures/
│   ├── sample-cog/
│   ├── sample-timeseries/
│   └── sample-stac/
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── science/
│   └── operations/
│
├── scripts/
│
├── compose.yml
├── Makefile
├── .env.example
└── README.md
```

Repository and package names must match the current `forudid` brand.

---

# 45. Frontend folder structure

```text
apps/web/src/

app/
  router.tsx
  providers.tsx

routes/
  index.tsx
  map.tsx
  areas.$aoiSlug.tsx
  products.$productId.tsx
  methodology.tsx
  about.tsx

features/
  map/
  layers/
  products/
  points/
  timeseries/
  quality/
  aoi/

components/
  ui/
  layout/

generated/
  api/

lib/
  api/
  units/
  geo/
  format/
  config/

styles/

test/
```

Feature-first architecture.

Do not create an undifferentiated component collection in:

```text
components/
```

Keep components organized by feature.

---

# 46. Backend folder structure

```text
apps/api/src/forudid_api/

main.py

api/
  v1/
    aois.py
    products.py
    points.py
    regions.py
    acquisitions.py
    runs.py

db/
  models/
  repositories/
  session.py

schemas/

services/
  products/
  points/
  statistics/
  tiles/

tiler/

core/
  config.py
  logging.py
  errors.py
  security.py
```

API handlers must not execute complex SQL directly.

Keep repository/service separation simple and proportionate.

Avoid overengineering.

---

# 47. Scientific pipeline commands

Provide a pipeline CLI.

For example:

```text
forudid discover
forudid pair
forudid submit-hyp3
forudid fetch-hyp3
forudid run-mintpy
forudid qc
forudid publish
```

And:

```text
forudid run \
  --aoi varamin \
  --profile varamin-desc-20x4-v1
```

Every step must be idempotent.

A failed run must not restart from scratch.

---

# 48. Processing Profile

Example:

```yaml
name: varamin-desc-20x4-v1

aoi: varamin

platform:
  - SENTINEL-1

orbit_direction: DESCENDING

polarization: VV

period:
  years: 2

hyp3:
  looks: 20x4

pairing:
  strategy: sbas
  max_temporal_baseline_days: null
  max_perpendicular_baseline_m: null
  minimum_network_degree: null

quality:
  temporal_coherence_threshold: null
  minimum_observations: null

publish:
  velocity: true
  coherence: true
  uncertainty: true
  timeseries: true
```

`null` means the scientific threshold still needs to be determined through validation and the profile.

Do not invent scientific parameter values.

---

# 49. Sentinel discovery

Use:

```text
asf_search
```

For every AOI:

1. geometry query
2. Sentinel-1 relevant acquisitions
3. orbit filtering
4. relative orbit consistency
5. polarization consistency
6. burst coverage
7. database persistence

Also preserve raw provider metadata.

Discovery must be repeatable.

---

# 50. Pair network

Build the SBAS network first.

Treat the network as a graph.

Before submission, check:

```text
is graph connected?
```

This check is required.

If disconnected:

Stop the run with a QC error.

Version pair-generation output.

For every pair, preserve:

```text
reference
secondary
temporal baseline
perpendicular baseline when available
burst set
signature
```

Store these values.

---

# 51. HyP3 integration

Use:

```text
hyp3_sdk
```

Job submission must be idempotent.

Before submission, hash:

```text
pair_signature
+
processing options
+
burst ids
```

Use the combined hash for identity.

Do not resubmit if a matching job already exists.

Keep HyP3 Multi-Burst as the MVP Sentinel-1 path.

Promptly copy completed job outputs into project-owned object storage.

Never treat provider storage as the project's permanent archive.

---

# 52. HyP3 job lifecycle

```text
created
  ↓
submitted
  ↓
running
  ↓
succeeded
  ↓
downloading
  ↓
archived
```

Failure:

```text
failed
```

Store failures with:

```text
provider message
retry count
last attempt
```

Retain this failure context.

---

# 53. Integrity

After download, record:

```text
SHA-256
size
file list
```

Persist the integrity record.

Upload to S3.

Then verify integrity again.

Only afterward set:

```text
archived = true
```

Do not mark an unverified upload archived.

---

# 54. MintPy

Use the standard MintPy workflow.

Store MintPy configuration for each processing run.

Include the run command, dependency versions and configuration in provenance.

Preserve outputs such as:

```text
timeseries.h5
velocity.h5
temporalCoherence.h5
geometry*.h5
```

As scientific artifacts.

---

# 55. Reproducibility

Every processing run must identify:

```text
git_sha
pipeline_version
container_digest
MintPy version
GDAL version
HyP3 processing type
processing profile
input acquisitions
input pairs
reference point
```

Do not publish without this metadata.

---

# 56. QC Pipeline

QC must be an independent step.

Minimum checks:

### Network QC

```text
connected network
number of acquisitions
number of pairs
date coverage
```

### Raster QC

```text
dimensions
CRS
transform
nodata
finite coverage
range sanity
```

### Time-series QC

```text
number of observations
missing epochs
temporal coherence
residual metrics where available
```

### Unwrapping QC

Preserve every metric available from the selected workflow.

### Reference QC

```text
reference point exists
reference point metadata exists
reference area is valid
```

### Product QC

```text
COG valid
STAC valid
checksums available
all required assets exist
```

---

# 57. Publication Gate

MVP publication requires manual scientific approval.

Flow:

```text
processing complete
      ↓
QC computed
      ↓
validation_required
      ↓
manual scientific review
      ↓
validated
      ↓
publish
```

Never publish a run merely because its process exited with code zero.

---

# 58. COG publication

Create a COG for every published web raster.

At minimum:

```text
velocity_los.tif
temporal_coherence.tif
velocity_uncertainty.tif
valid_mask.tif
```

Validate COGs in CI and the publication pipeline.

Build overviews.

Declare NoData explicitly.

Preserve CRS and transform.

---

# 59. Zarr

Published time cube:

```text
timeseries.zarr
```

Conceptual structure:

```text
time
y
x

displacement[time,y,x]
```

Include coordinate arrays and attributes:

```text
unit
crs
reference
processing_run_id
```

Preserve all these attributes.

Zarr supports web/cloud analysis.

Keep the HDF5 archive.

---

# 60. Unit policy

Canonical:

```text
displacement = meter
velocity = meter/year
uncertainty_velocity = meter/year
coherence = dimensionless 0..1
```

Display:

```text
mm
mm/year
```

Put all unit conversions in a shared utility.

Components must not manually repeat:

```text
value * 1000
```

Reuse the unit utility.

---

# 61. Time policy

All operational timestamps use:

```text
UTC
TIMESTAMPTZ
ISO 8601
```

Preserve provider acquisition dates.

Persian localization is presentation only.

---

# 62. Coordinate policy

PostGIS vectors:

```text
EPSG:4326
```

Use this CRS for PostGIS vectors.

Do not change a scientific raster's CRS merely for frontend convenience.

TiTiler handles tile reprojection to Web Mercator.

Store each product's CRS in metadata.

---

# 63. Observability

Use structured logging from the start.

Relevant logs should include, when available:

```text
request_id
run_id
job_id
aoi_id
product_id
```

Use JSON logs in production.

Local logs must also be readable and filterable for debugging.

Provide a frontend error boundary.

API exceptions return standardized error codes.

Example:

```json
{
  "error": {
    "code": "PRODUCT_NOT_PUBLISHED",
    "message": "..."
  }
}
```

Do not send stack traces to users.

---

# 64. Security

## Public

Only read APIs are public in the MVP.

Public currently means accessible within local development. No endpoint is yet published on the public internet.

Keep processing APIs private.

## Secrets

Never commit:

```text
Earthdata credentials
HyP3 credentials/tokens
S3 secrets
DB password
```

`.env.example` contains variable names only.

## CORS

Allow explicitly configured origins only.

Declare local origins such as `http://localhost:5173` explicitly in configuration.

Do not allow `*` in production.

## S3

bucket private.

API/worker credentials least privilege.

## Statistics endpoint

Enforce limits on:

* polygon size
* geometry complexity
* timeout
* request size
* rate

## TiTiler

Arbitrary URLs are prohibited.

---

# 65. Caching

MVP:

Use browser caching for immutable tile assets.

Product assets are immutable, so use:

```text
Cache-Control: public, max-age=..., immutable
```

Where appropriate for the deployment.

Use shorter caches for metadata APIs.

Any `latest` endpoint must have a short cache.

Add a tile CDN later.

Do not add Redis caching to the MVP without evidence that it is needed.

Local caching must accommodate fixtures and must not leave development data stale.

---

# 66. Docker Compose MVP

Services:

```text
postgres
object-storage
api
worker
web
reverse-proxy
```

Do not add:

```text
Kubernetes
Kafka
Celery
RabbitMQ
Elasticsearch
GraphQL
service mesh
```

The local reverse proxy must provide internal routes without a public domain.

---

# 67. Workflow engine

For the MVP:

```text
Python CLI + persisted processing state
```

This is sufficient.

Add Prefect only when:

* new acquisitions are ingested automatically
* scheduling is required
* centralized retries are required
* multiple workers are needed
* workflow monitoring is required

At that point, add:

```text
Prefect 3
```

Use that version family.

Do not introduce it earlier.

---

# 68. Reverse proxy

Use a simple reverse proxy.

Routes:

```text
/          → web
/api/*     → FastAPI
/tiles/*   → FastAPI/TiTiler
```

These routes must currently be accessible through localhost.

Add TLS when deploying to a public or production environment.

The frontend must not know internal container hostnames.

---

# 69. MVP Development Strategy

Do not start directly with Sentinel data.

First build a complete vertical slice using fixtures.

## Stage A — Fake science, real software

Use:

```text
sample velocity COG
sample coherence COG
sample timeseries JSON/Zarr
```

The goal is:

```text
DB
→ API
→ Tile
→ Map
→ Click
→ Point API
→ Chart
```

Make this complete path work.

This stage uses fixture data with real architecture.

---

# 70. Milestone 0 — Repository Foundation

Implementation tasks:

1. Create the monorepo.
2. Write the README.
3. Add `.editorconfig`.
4. Create `.env.example`.
5. Create the base Docker Compose stack.
6. Create baseline CI.
7. Create the ADR structure.
8. Initialize the frontend.
9. Initialize FastAPI.
10. Create the initial PostGIS migration.

Acceptance:

```text
docker compose up
```

Must start the entire development stack.

Frontend health OK.

API health OK.

DB health OK.

No domain is required for this milestone. All services must use local addresses and documented configuration.

---

# 71. Milestone 1 — Frontend Shell

Build:

```text
React
Vite
TanStack Router
TanStack Query
Tailwind
shadcn
RTL
MapLibre
```

Routes:

```text
/
/map
/methodology
/about
```

Map empty shell.

Acceptance:

* Persian RTL
* responsive
* no console errors
* route reload works
* URL state works
* local execution without a public-domain dependency

---

# 72. Milestone 2 — Data Model

Create Alembic migrations for:

```text
areas_of_interest
products
product_assets
processing_runs
reference_points
qc_metrics
```

Seed Varamin.

Acceptance:

```text
alembic upgrade head
alembic downgrade -1
alembic upgrade head
```

All steps must pass.

---

# 73. Milestone 3 — Sample Product

Upload a small fixture COG to object storage.

Create its database product.

API:

```text
GET /products
GET /products/{id}
```

Implement these endpoints.

The tile endpoint must work with an asset ID.

Acceptance:

The COG must render in local MapLibre.

---

# 74. Milestone 4 — Real WebGIS MVP UI

Build:

* LayerPanel
* Legend
* ProductSelector
* Opacity control
* metadata dialog
* loading states
* error states
* empty states

Acceptance:

Users can switch between velocity, coherence and uncertainty fixtures.

---

# 75. Milestone 5 — Point Query

API point sampling.

Click map.

Point panel.

Acceptance:

Selecting known coordinates returns the expected fixture value.

Cover this with an E2E check.

---

# 76. Milestone 6 — Time Series

Timeseries fixture.

API endpoint.

ECharts panel.

Acceptance:

click point → chart.

URL refresh preserves the selected context.

---

# 77. Milestone 7 — QC UI

Backend QC schema.

Frontend:

```text
uncertainty
coherence
observations
reference
processing version
quality
```

Display these fields.

Acceptance:

Never display a velocity in the detail panel without quality context.

---

# 78. Milestone 8 — STAC Publisher

Add PySTAC.

Generate a STAC Item for the sample product.

Validate the STAC document.

Acceptance:

Every published product has valid STAC metadata.

---

# 79. Milestone 9 — Sentinel Discovery

Begin real scientific data work at this stage.

`asf_search` integration.

For Varamin:

```text
Sentinel-1
Descending
target track
target burst coverage
1–2 years
```

Store metadata in the database.

Acceptance:

Repeating a query must not create duplicates.

---

# 80. Milestone 10 — SBAS Pair Builder

Acquisitions → graph.

Connectivity validation.

Persist pairs.

Acceptance:

* deterministic output
* no duplicate pairs
* disconnected networks are detected

---

# 81. Milestone 11 — HyP3 Integration

Job submission.

Job polling.

Download.

Archive.

Checksum.

Acceptance:

Archive at least one real pair through the complete workflow.

---

# 82. Milestone 12 — Full Varamin HyP3 Stack

Process every pair in the approved profile.

Failure recovery.

Acceptance:

All required interferograms must be archived.

---

# 83. Milestone 13 — MintPy Runner

Science container.

MintPy config.

Run tracking.

Output archive.

Acceptance:

Produce real Varamin outputs:

```text
timeseries
velocity
coherence
geometry
```

All listed outputs must exist.

---

# 84. Milestone 14 — Scientific QC

Produce the QC report.

Until manual approval, keep the run in:

```text
validation_required
```

Do not advance it before approval.

Acceptance:

Provide machine-readable and human-readable QC reports.

---

# 85. Milestone 15 — Production Publisher

MintPy output:

```text
HDF5
 ↓
publish
 ├ COG velocity
 ├ COG coherence
 ├ COG uncertainty
 ├ Zarr timeseries
 ├ STAC
 ├ QC JSON
 └ provenance JSON
```

Acceptance:

Record every checksum.

COG validates.

STAC validates.

The frontend displays the real product locally.

---

# 86. Milestone 16 — First Scientific Release

Varamin.

Only:

```text
Descending
LOS
```

The frontend must not display a vertical product for this release.

Create a release:

```text
Varamin LOS v1
```

With a fixed processing version.

This establishes the actual project MVP.

Release references at this stage identify a local version or specific project build, not a public domain.

---

# 87. Phase 2 — Automation

After Varamin succeeds:

new acquisition detection.

Flow:

```text
discover
  ↓
diff with DB
  ↓
new acquisition
  ↓
pair
  ↓
HyP3
  ↓
archive
  ↓
MintPy update/reprocess
  ↓
QC
  ↓
manual approval
  ↓
publish
```

Prefect may be added at this stage.

---

# 88. Phase 3 — Multiple Basins

Suggested order:

```text
Varamin
↓
Tehran / Karaj
↓
Isfahan
↓
Rafsanjan
↓
Mashhad
↓
major subsidence basins
```

Each AOI has an independent profile.

---

# 89. Phase 4 — Context layers

After scientific acceptance:

```text
aquifers
groundwater wells
railway
roads
cities
agriculture
land use
faults
GNSS
```

For small vectors:

```text
GeoJSON API
```

For national dynamic vectors:

```text
MVT
```

A vector tile server such as Martin may be added later.

Not in the original MVP.

---

# 90. Phase 5 — Ascending + Descending

When both tracks are valid:

```text
Ascending LOS
+
Descending LOS
↓
decomposition
```

Possible products:

```text
Vertical
East-West
```

Only with explicit assumptions and uncertainty.

If negligible north-south motion is assumed, state that explicitly in metadata and UI.

---

# 91. Phase 6 — Infrastructure Risk

For example:

```text
Railway geometry
       +
validated deformation product
       ↓
intersection / zonal statistics
       ↓
risk context
```

The UI may report:

```text
18.3 km of railway
intersects high-deformation zone
```

Scientific or engineering risk must not be defined solely by a raster threshold.

---

# 92. Phase 7 — Alerts

Do not implement alerts before a valid baseline exists.

Do not use:

```text
if velocity < -50:
  ALERT
```

Instead, later use:

```text
current trend
+
historical baseline
+
uncertainty
+
quality
+
persistence
+
spatial consistency
↓
candidate alert
↓
validation
```

Start with internal analyst alerts.

Public alerts require validation.

---

# 93. Performance budgets

Frontend:

* fast first map interaction
* route-level code splitting
* ECharts lazy load
* lazy-load deck.gl only if used
* lazy-load nonessential panels
* do not bundle large images

Map:

* tile source
* do not download entire rasters
* do not send very large GeoJSON directly to the browser

API:

* fast point requests
* DB indexes
* tile caching
* no N+1 queries

---

# 94. Browser support

Target:

* current Chrome
* current Firefox
* current Edge
* current Safari
* modern Android/iOS browsers

Document the WebGL2 requirement.

If the browser lacks WebGL2:

Display an understandable error page.

---

# 95. Coding rules TypeScript

```text
strict = true
```

Prohibited:

```text
any
```

Unless justified in a comment.

Use:

* discriminated unions
* Zod at runtime boundaries
* generated API types
* exhaustive switch

Split oversized components.

Do not accumulate business logic inside JSX.

---

# 96. Coding rules Python

* type hints
* Ruff
* Pyright
* pytest
* Pydantic boundaries
* do not return SQLAlchemy models directly from API handlers
* DB transactions explicit
* timezone-aware datetime
* use Decimal only when necessary

---

# 97. Scientific tests

Maintain a small golden fixture.

For example, a few specified pixels and epochs.

Regression checks cover:

* dimensions
* date count
* velocity sample
* coherence sample
* spatial extent
* nodata
* unit

Within explicit scientific tolerances.

Software refactoring must not change scientific regression expectations without justification.

---

# 98. API contract tests

OpenAPI snapshot.

Generated TypeScript client.

CI:

If OpenAPI changes but the generated client is not committed:

FAIL.

---

# 99. Docker image policy

Do not deploy production builds using a mutable `latest` tag.

After stabilization, record:

* exact version
* lock files
* image digest

Preserve these pins.

Scientific runs must record their container digest.

---

# 100. Database migration policy

Never rewrite published migrations.

Every schema change requires:

A new migration.

Production startup must not run destructive migrations without an explicit deployment step.

---

# 101. Product versioning

Keep three version types separate:

```text
application_version
pipeline_version
product_version
```

Example:

```text
app: 0.4.0
pipeline: insar-v2.1.0
product: varamin-desc-071-2026q3-v1
```

Do not confuse these versions.

---

# 102. Provenance JSON

Conceptual example:

```json
{
  "run_id": "...",
  "pipeline_version": "...",
  "git_sha": "...",
  "container_digest": "...",
  "provider": "ASF HyP3",
  "processor": "MintPy",
  "orbit_direction": "descending",
  "relative_orbit": 71,
  "inputs": [],
  "pair_network": [],
  "processing_profile": "...",
  "reference": {},
  "outputs": [],
  "created_at": "..."
}
```

---

# 103. Error handling UI

Four general states:

```text
loading
error
empty
success
```

No endless spinners.

Error message:

* Persian
* understandable
* retry when appropriate

Send technical error details to the development console.

---

# 104. Offline/degraded behavior

A basemap failure must not crash a healthy scientific overlay or API workflow.

A time-series failure must leave the map usable.

A QC failure must not leave a velocity value without a warning.

Isolate failures between features.

Missing domains or external services must not crash the local application. Explain degraded states clearly.

---

# 105. Search

The MVP searches internal AOIs only:

```text
ورامین
```

Do not add an external geocoder before provider and licensing are settled.

Add a geocoding abstraction later.

---

# 106. Localization

Do not scatter hard-coded UI strings throughout components.

Even when Persian is the only language, use:

```text
messages/fa.ts
```

Or another simple localization structure.

Keep it possible to add English later.

Do not translate scientific identifiers:

```text
LOS
Ascending
Descending
Temporal Coherence
```

They may be accompanied by Persian explanations.

---

# 107. ADRs

Create these ADRs from the start:

```text
0001-react-vite-over-next-svelte.md
0002-fastapi-separate-backend.md
0003-maplibre-react-map-gl.md
0004-titiler-mounted-in-api.md
0005-s3-compatible-storage.md
0006-stac-product-catalog.md
0007-hdf5-archive-zarr-publish.md
0008-los-not-vertical.md
0009-no-workflow-engine-in-mvp.md
0010-localhost-first-development.md
```

Every subsequent significant change requires an ADR.

---

# 108. Things Maintainers must NOT add

Do not add these without an explicit request:

```text
Next.js
Redux
Zustand
GraphQL
Apollo
Kubernetes
Kafka
RabbitMQ
Celery
Elasticsearch
microservices
service mesh
AI/LLM
authentication system
alert system
real-time websocket
Redis
pgSTAC
deck.gl
public domain configuration
```

Some may become useful later, but are not defaults.

---

# 109. Definition of Done for each milestone

A milestone is complete only when:

1. Implementation is complete.
2. Tests pass.
3. Lint passes.
4. Type checking passes.
5. Documentation is updated.
6. Compose still starts successfully.
7. Migrations remain healthy.
8. No secrets are committed.
9. Milestone acceptance criteria pass.
10. No critical TODO is hidden.
11. The functionality runs and can be reviewed locally.
12. No dependency on a nonexistent domain has been introduced.

---

# 110. Implementation instructions

Build this project milestone by milestone.

At the start of each milestone:

1. Read the relevant existing files.
2. Extract acceptance criteria.
3. Design the smallest complete implementation.
4. Then implement it.

At completion, run:

```text
lint
typecheck
unit tests
integration tests relevant to milestone
build
```

All relevant checks are required.

A failed test means the milestone is not complete.

For each new dependency, explain:

```text
why it is needed
why existing dependencies cannot do it
```

Do not assume public deployment. Current tests, links and acceptance criteria must work locally and use the **فرودید | FORUDID** brand.

---

# 111. Implementation order

Do not implement HyP3 first.

Correct sequence:

```text
Repository
 ↓
Frontend shell
 ↓
DB
 ↓
Fixture COG
 ↓
TiTiler
 ↓
Map
 ↓
Point API
 ↓
Time series
 ↓
QC UI
 ↓
STAC
 ↓
Sentinel discovery
 ↓
Pair network
 ↓
HyP3
 ↓
MintPy
 ↓
QC science
 ↓
Publish
 ↓
Varamin v1
```

The goal is to isolate WebGIS failures from scientific-processing failures.

---

# 112. Final MVP architecture

```text
                        Sentinel-1
                            │
                            ▼
                        asf_search
                            │
                            ▼
                      Acquisition DB
                            │
                            ▼
                     SBAS Pair Builder
                            │
                            ▼
                    HyP3 Multi-Burst
                            │
                            ▼
                    Internal S3 Archive
                            │
                            ▼
                          MintPy
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
       HDF5 Scientific               Publish Worker
           Archive                         │
                               ┌───────────┼───────────┐
                               ▼           ▼           ▼
                              COG        Zarr 3       STAC
                               │           │           │
                               └───────────┴───────────┘
                                           │
                                  S3-compatible storage
                                           │
                         ┌─────────────────┴──────────────┐
                         │                                │
                         ▼                                ▼
                PostgreSQL/PostGIS                  FastAPI
                                                         │
                                            ┌────────────┴─────────────┐
                                            │                          │
                                            ▼                          ▼
                                      Business REST              TiTiler Router
                                            │                          │
                                            └────────────┬─────────────┘
                                                         │
                                                       OpenAPI
                                                         │
                                                       Orval
                                                         │
                                                         ▼
                                                  React + Vite
                                                         │
                       ┌─────────────────────────────────┼──────────────────────┐
                       ▼                                 ▼                      ▼
                TanStack Router                    TanStack Query          MapLibre
                                                                                │
                                                                           react-map-gl
                                                                                │
                                                               deck.gl only when needed
                                                         │
                                                       ECharts
```

First run and validate every component locally. Public domains, public TLS, CDN and internet deployment are outside the current MVP.

---

# 113. Final stack

## Frontend

```text
React 19
TypeScript
Vite 8
pnpm

TanStack Router
TanStack Query
Zod

MapLibre GL JS 6
react-map-gl 8

ECharts 6

Tailwind CSS 4
shadcn/ui
Radix UI

Orval

Vitest
React Testing Library
Playwright
```

## Backend

```text
Python
FastAPI
Pydantic 2
SQLAlchemy 2
Alembic
psycopg 3
GeoAlchemy2

PostgreSQL
PostGIS

TiTiler

PySTAC
boto3
```

## Scientific processing

```text
Python scientific environment
Conda/Mamba

asf_search
hyp3_sdk
HyP3 Multi-Burst

MintPy

GDAL
Rasterio
rio-cogeo
xarray
h5py
Zarr 3
PySTAC
```

## Storage

```text
S3-compatible Object Storage
COG
HDF5
Zarr 3
STAC JSON
```

## Workflow

```text
MVP:
Python CLI / worker

Later:
Prefect 3
```

## Deployment

```text
Docker
Docker Compose
reverse proxy
static frontend

Current:
localhost-first development

No public domain initially
No Kubernetes initially
```

---

# 114. First processing target

The only initial scientific target:

```text
AOI:
Varamin

Size:
approximately 50 × 50 km

Orbit:
Descending

HyP3 profile:
20x4

Temporal coverage:
1–2 years

Outputs:
LOS velocity
temporal coherence
velocity uncertainty
LOS time series
QC
metadata
```

Do not add a second AOI before this chain is scientifically accepted.

---

# 115. MVP Final Acceptance Test

The MVP succeeds only when a user can:

1. Open the local map, such as `http://localhost:5173/map`.
2. See the **فرودید | FORUDID** brand.
3. View Varamin.
4. View real `LOS Velocity`.
5. Read a legend in `mm/year`.
6. Select coherence.
7. Select uncertainty.
8. Select a point.
9. Read LOS velocity.
10. Read uncertainty.
11. Read temporal coherence.
12. Read observation count.
13. View a real time series.
14. Identify orbit and track.
15. Identify processing version.
16. Identify the reference.
17. Copy and reload the same view URL.
18. Inspect product metadata/STAC.
19. Encounter no incorrect labeling of LOS as vertical subsidence.
20. Access product QC and provenance.
21. Reproduce and audit the same processing run.
22. Use all core functionality locally without a public domain.

This defines FORUDID version one.

Anything beyond it—national coverage, alerts, decomposition, infrastructure risk and automation—belongs to later phases.
