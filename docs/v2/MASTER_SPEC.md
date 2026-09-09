# FORUDID V2

## Ground Deformation Exposure & Decision Intelligence Platform

---

# 0. Product name

Official project name:

**FORUDID**

Persian name:

**فرودید**

Use these names throughout the repository, UI, metadata, documentation, comments, API examples and reports.

Do not use the former project name in new UI.

If the existing repository has another name, rename through a controlled migration and preserve Git history.

---

# 1. What is V2?

FORUDID V1 is a platform for viewing and managing ground-deformation data.

FORUDID V2 must do more than add layers to the same map.

V2 transforms the product from:

```text
Ground deformation viewer
```

into:

```text
Ground deformation
        +
assets / population / infrastructure
        +
exposure analysis
        +
screening
        +
reports
        =
decision-support platform
```

This is the product transition.

The main V1 question:

> How much is the ground moving here?

The main V2 question:

> Which assets, infrastructure and populations are exposed to this ground movement, and where should investigation begin?

---

# 2. Core product principle

FORUDID must not simply duplicate products such as the COMET Subsidence Portal.

FORUDID must **add value to existing credible scientific data**.

Therefore, in V2:

* Independent InSAR production is not the main requirement.
* The V1 HyP3/MintPy pipeline may remain.
* Core V2 functionality must not depend on a proprietary InSAR pipeline.
* Any suitable deformation dataset should be ingestible through a Data Source Adapter.

The architecture must be:

```text
source agnostic
```

Apply this architecture throughout.

---

# 3. Product Thesis

The value of FORUDID is not:

> “I also have a subsidence map of Iran.”

Its value must be:

> “I can identify which infrastructure segment or urban area is exposed to which type of deformation, describe data quality, prioritize further investigation and show the evidence supporting the result.”

---

# 4. Required scientific terminology

Keep these four concepts separate in code and UI:

```text
Hazard
Exposure
Vulnerability
Risk
```

## Hazard

A physical characteristic of ground deformation.

Example:

* vertical velocity
* LOS velocity
* deformation gradient
* angular distortion
* horizontal strain

## Exposure

An asset or population intersecting a hazard.

Example:

```text
12.4 km railway
intersects high differential-deformation hazard
```

## Vulnerability

The susceptibility of a structure or system to that hazard.

For example:

* pavement type
* foundation
* bridge type
* maintenance condition
* building age

FORUDID V2 generally does not have this information.

## Risk

Risk is allowed only when the following are available:

```text
Hazard
+
Exposure
+
Vulnerability / consequence model
```

All of these are required.

Therefore, V2 does not produce **Structural Risk** by default.

---

# 5. Allowed V2 terminology

Use:

```text
Hazard
Exposure
Exposure Segment
Priority Screening
Deformation Context
Data Confidence
Scientific Status
```

Do not use without a validated scientific model:

```text
Safe
Unsafe
Danger
Failure Probability
Structural Risk
Collapse Risk
```

---

# 6. Scientific disclaimer

All reports and analysis pages must display the following exact Persian UI notice:

> FORUDID یک ابزار پایش و غربالگری مکانی است و جایگزین ارزیابی ژئوتکنیکی، سازه‌ای، نقشه‌برداری زمینی یا بازدید میدانی نیست.

Absence of detected deformation does not establish safety.

---

# 7. V2 architecture

```text
                         DATA SOURCES
                              │
       ┌──────────────────────┼───────────────────────┐
       │                      │                       │
       ▼                      ▼                       ▼
 Deformation Data          OSM Assets          Population/Data
       │                      │                       │
       │                      │                       │
       └──────────────────────┼───────────────────────┘
                              ▼
                     Source Ingestion Layer
                              │
                              ▼
                         Data Catalog
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
        Raster Products   Vector Assets    Population
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                       Analysis Engine
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
       Point metrics     Line exposure   Area exposure
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                       Analysis Results
                              │
              ┌───────────────┼─────────────────┐
              ▼               ▼                 ▼
             API          Vector Tiles         Reports
              │               │
              └───────────────┼─────────────────┘
                              ▼
                         React / MapLibre
```

---

# 8. Existing V1 stack must remain

Do not rewrite working V1 infrastructure.

Continue using:

## Frontend

```text
React 19
TypeScript
Vite
TanStack Router
TanStack Query
MapLibre GL JS
react-map-gl
ECharts
Tailwind
shadcn/ui
Radix
Zod
Orval
```

## Backend

```text
Python
FastAPI
Pydantic
SQLAlchemy
Alembic
PostgreSQL
PostGIS
TiTiler
```

## Raster/storage

```text
COG
HDF5
Zarr
STAC
S3-compatible object storage
```

---

# 9. New V2 component: Martin

V2 introduces:

```text
Martin Tile Server
```

Purpose:

```text
PostGIS
  ↓
MVT
  ↓
MapLibre
```

Martin is responsible for large vector datasets including:

* national roads
* railway network
* exposure segments
* cities
* optionally buildings

FastAPI remains responsible for:

* business logic
* analysis
* metadata
* reports
* point/profile queries

TiTiler remains responsible for rasters.

Martin handles vectors.

Architecture:

```text
COG
 ↓
TiTiler

PostGIS
 ↓
Martin

metadata / analysis
 ↓
FastAPI

all
 ↓
MapLibre
```

---

# 10. No giant GeoJSON

Never send the full Iran:

```text
railway GeoJSON
road GeoJSON
building GeoJSON
```

to browser.

Use:

```text
MVT
```

for large vector layers.

GeoJSON remains acceptable for:

* selected asset
* one analysis segment set
* user-drawn AOI
* small result collection

---

# 11. Data Source Registry

Create a first-class Data Source model.

Table:

```text
data_sources
```

Fields:

```text
id UUID

slug TEXT UNIQUE

name
provider

source_type:
  deformation
  infrastructure
  population
  building
  boundary
  hydrogeology
  other

homepage_reference
citation_text

license_name
license_reference

attribution_text

access_method

scientific_status:
  published_peer_reviewed
  published_dataset
  provider_operational
  experimental
  unknown

created_at
updated_at
```

---

# 12. Source Versions

Never treat a source as timeless.

Create:

```text
source_versions
```

Fields:

```text
id
source_id

version

data_date
valid_from
valid_to

downloaded_at

original_uri
object_uri

sha256
size_bytes

metadata JSONB

created_at
```

Every analysis result must reference exact source versions.

---

# 13. Primary V2 deformation baseline

Implement an adapter for:

```text
Haghighi & Motagh
Iran nationwide subsidence dataset
2014–2020
Zenodo
```

Input assets include:

```text
annual subsidence rate GeoTIFF
seasonal amplitude GeoTIFF
subsidence mask GeoTIFF
```

License/attribution metadata must be recorded.

Do not strip original metadata.

Original files should be archived immutable.

---

# 14. COMET adapter

Create an adapter interface for:

```text
COMET-LiCS Land Subsidence data
```

BUT:

Do not reverse-engineer or scrape undocumented web UI endpoints.

Initial implementation may support:

```text
manual file import
official download import
manifest import
```

If a stable documented machine endpoint exists later, add it via a separate adapter.

COMET-derived results must clearly indicate:

```text
measurement_direction = LOS
```

unless decomposition has explicitly occurred.

---

# 15. Generic deformation adapter interface

Define:

```python
class DeformationSourceAdapter:
    discover()
    fetch()
    validate()
    normalize()
    register()
```

Normalized product metadata must contain:

```text
measurement_component:
  los
  vertical
  east_west
  north_south

source_method

vertical_estimation_method

time_start
time_end

pixel_size_x
pixel_size_y

crs

unit

sign_convention

reference_frame

quality_metadata

citation

license
```

---

# 16. Important distinction: vertical methods

These are NOT equivalent:

```text
LOS measurement

single-track LOS projected to vertical

ascending + descending decomposition

GNSS-referenced decomposition
```

Store method explicitly.

UI must display it.

Do not reduce all of them to:

```text
Vertical Subsidence
```

without context.

---

# 17. Infrastructure data

Primary infrastructure source V2:

```text
OpenStreetMap
```

For bulk Iran import use:

```text
Geofabrik Iran PBF
```

Do NOT use Overpass for the national bulk ingestion pipeline.

Overpass may later be used for small exploratory queries only.

---

# 18. OSM attribution

Every UI/report that displays OSM-derived data must preserve required attribution.

Store:

```text
source
source_version
license
attribution
```

with the imported features.

Do not remove provenance.

---

# 19. OSM ingestion

Pipeline command:

```bash
forudid data ingest osm-iran
```

Steps:

```text
download Iran PBF
       ↓
checksum
       ↓
archive original
       ↓
extract required features
       ↓
normalize tags
       ↓
load PostGIS
       ↓
build indexes
       ↓
refresh vector tile views
```

Use a reproducible CLI workflow.

Recommended tools:

```text
osmium-tool
GDAL/ogr2ogr
PostGIS
```

Do not build a custom OSM parser unless necessary.

---

# 20. Railway feature extraction

At minimum ingest:

```text
railway=rail
```

Preserve relevant properties:

```text
osm_id
name
name:fa
name:en

railway
service
usage

electrified
tracks
gauge
maxspeed

bridge
tunnel
layer

operator
ref

all_tags JSONB
```

Do not assume OSM completeness.

---

# 21. Road feature extraction

MVP V2 categories:

```text
motorway
trunk
primary
secondary
```

Store original highway tag.

Do not immediately include every residential road.

Later extension:

```text
tertiary
service
local
```

if needed.

---

# 22. Asset normalization

Create:

```text
assets
```

Fields:

```text
id UUID

source_version_id

external_id

asset_type:
  railway
  road
  building
  utility
  custom

asset_class

name

geom GEOMETRY

properties JSONB

data_quality JSONB

created_at
```

Indexes:

```text
GIST geom

asset_type
asset_class
external_id
```

---

# 23. Linear assets

For road/rail create a normalized network representation.

Do not assume one OSM way equals one meaningful asset.

Introduce:

```text
asset_routes
```

and:

```text
asset_route_members
```

so multiple source geometries can form one analytical route.

V2 MVP may also analyse raw OSM features if route grouping is unavailable.

---

# 24. User-supplied infrastructure

Allow a user/admin analyst later to upload:

```text
GeoJSON
GeoPackage
Shapefile ZIP
```

for a private project corridor.

MVP import may be admin/CLI only.

Do not expose public arbitrary file upload until security controls exist.

---

# 25. Population data

Implement a population source adapter.

Preferred initial source:

```text
WorldPop
```

Alternative:

```text
GHSL GHS-POP
```

Store exact:

```text
dataset
year
resolution
method
license
citation
```

Never label population estimate as official census count.

UI wording:

```text
Estimated exposed population
```

---

# 26. Buildings

Building footprint analysis is **optional V2.1**, not MVP blocking.

Potential source:

```text
Microsoft Global ML Building Footprints
```

But every imported region requires a completeness check.

Store:

```text
coverage_status
known_gaps
source_date
```

Never infer:

```text
no footprint = no building
```

---

# 27. Hydrogeology

Do not invent an open national aquifer dataset.

Architecture must support:

```text
hydrogeology_layers
```

but no production aquifer boundary source should be hardcoded without verified:

```text
license
provenance
date
resolution
authority
```

Allow manual ingestion later.

---

# 28. Three analysis levels

FORUDID V2 supports:

```text
point
line
polygon
```

---

# 29. Point analysis

Point result includes:

```text
velocity

component

uncertainty if available

quality

source

measurement period

pixel resolution

reference information

scientific status
```

This largely extends V1.

---

# 30. Line exposure analysis

This is a central V2 feature.

Input:

```text
asset geometry
+
deformation product
```

Output:

```text
profile samples
exposure segments
summary statistics
```

---

# 31. Densification

Before raster sampling, linear geometry must be densified.

Sampling distance must derive from data resolution.

Rule:

```text
sample spacing <= raster pixel width
```

Exact choice belongs to analysis profile.

Do not blindly hardcode 100 m globally.

Store:

```text
sample_spacing_m
```

with result.

---

# 32. Line profile

For every sample:

```text
chainage_m

lon
lat

velocity
uncertainty

quality

gradient proxy if available

angular distortion if valid

hazard_class if valid
```

Result can be rendered as:

```text
distance along asset
          vs
deformation metric
```

---

# 33. Asset profile chart

Frontend must show:

```text
X = chainage / distance
Y1 = deformation velocity

optional:
Y2 = differential deformation metric
```

Also show important map-linked points.

Hover profile:

```text
moves marker on map
```

Hover map segment:

```text
highlights profile interval
```

---

# 34. Descriptive velocity exposure

This mode is always available when velocity product exists.

Metrics:

```text
asset length with valid data

coverage percentage

median velocity

mean velocity

p05
p95

minimum
maximum

maximum absolute velocity

length by configured velocity band
```

These are descriptive exposure metrics.

Do NOT call them structural risk.

---

# 35. Differential deformation proxy

If a vertical velocity field exists but does NOT meet validated angular-distortion methodology requirements:

calculate only:

```text
vertical velocity spatial gradient proxy
```

Label explicitly:

```text
Deformation Gradient Proxy
Experimental
```

Do not label it:

```text
Angular Distortion Hazard
```

---

# 36. Validated angular distortion mode

Add a separate analysis method:

```text
payne_2025_angular_distortion
```

Do not enable public status until validated.

Scientific concept:

```text
β = Δd / l
```

where the methodology derives differential displacement over the time period from vertical velocity and computes the local spatial gradient.

Implementation must follow the referenced scientific methodology rather than inventing a shortcut.

Required metadata:

```text
vertical velocity source

time span

pixel width

window size

valid pixel rule

gradient method

classification method

method version
```

---

# 37. Angular distortion implementation guardrail

Implement the algorithm behind:

```text
experimental feature flag
```

until:

1. unit tests pass.
2. synthetic tests pass.
3. known literature examples are reproduced within an accepted tolerance.
4. scientific review is completed.

No public report may call the product validated before those conditions are met.

---

# 38. Resolution sensitivity

Angular distortion is resolution-sensitive.

Therefore every differential hazard result must display:

```text
Input pixel size
Analysis pixel size
Window size
Method
```

Do not compare 50 m and 100 m beta values as if directly identical without qualification.

---

# 39. Hazard classification

When the validated Payne-style method is active, classification profile may include:

```text
low
medium
high
very_high
```

using literature-derived thresholds.

Threshold definitions belong in a versioned scientific profile.

Never duplicate threshold values across frontend/backend files.

One server-side source of truth.

---

# 40. Scientific Profiles

Create table:

```text
analysis_methods
```

Fields:

```text
id

slug

name

version

method_type

parameters JSONB

scientific_reference

status:
  experimental
  review
  validated
  deprecated

created_at
```

Examples:

```text
velocity_exposure_v1
gradient_proxy_v1
payne_2025_beta_v1
population_exposure_v1
```

---

# 41. Exposure segment generation

For a line asset:

```text
densified samples
        ↓
metric values
        ↓
classification
        ↓
group contiguous classes
        ↓
generate line substrings
```

Create real geometries representing affected route intervals.

Each segment:

```text
start_chainage
end_chainage
length
class
metrics
```

---

# 42. exposure_segments table

```text
id

analysis_run_id
asset_id

geom LINESTRING

start_chainage_m
end_chainage_m
length_m

hazard_class

max_velocity
median_velocity

max_gradient
max_beta

data_coverage

confidence

metrics JSONB
```

GIST index on geom.

---

# 43. Infrastructure exposure summary

For each asset/route:

```text
total_length_km

valid_data_length_km

coverage_percent

medium_plus_length_km

high_plus_length_km

very_high_length_km

max_velocity

p95_velocity

max_differential_metric

p95_differential_metric

number_of_exposure_segments

longest_exposure_segment

data_confidence
```

Only populate hazard-specific metrics if scientifically available.

---

# 44. Do not create fake risk scores

MVP must NOT use arbitrary formula such as:

```text
0.5 velocity
+ 0.3 gradient
+ 0.2 population
```

and call it risk.

Default ranking should use transparent sortable metrics.

Example sorting:

```text
hazard class
↓
high-class exposed length
↓
maximum differential metric
↓
data confidence
```

---

# 45. Screening Priority

FORUDID may offer:

```text
Screening Priority
```

but it must be clearly defined as:

> ordering for further investigation, not probability of failure.

Initial levels:

```text
Review first
Review
Monitor
Insufficient data
```

These should preferably derive from transparent rules and remain versioned.

---

# 46. Population exposure

Input:

```text
hazard raster/mask
+
population raster
```

Output:

```text
estimated population by hazard class

total population inside valid hazard coverage

population inside deformation zones

percentage
```

Store both source rasters and year.

---

# 47. Population alignment

Never directly multiply mismatched raster grids.

Pipeline must explicitly handle:

```text
CRS
pixel alignment
resolution
nodata
population count semantics
```

When resampling population counts:

use mass-preserving methodology.

Do not treat population raster like continuous elevation.

---

# 48. Population result table

```text
population_exposure_results
```

Fields:

```text
id

analysis_run_id

region_id

population_source_version_id

hazard_product_id

population_year

estimated_total

estimated_valid_coverage

estimated_low
estimated_medium
estimated_high
estimated_very_high

method

metrics JSONB
```

---

# 49. Area/polygon analysis

User can:

```text
select predefined region
```

or later:

```text
draw polygon
```

Return:

```text
area

valid coverage

velocity statistics

hazard area by class

estimated exposed population

road length

rail length

building count when available
```

---

# 50. Polygon security limits

User geometry must be validated.

Limits:

```text
max vertices
max area
valid polygon
no self-intersection
request size
analysis timeout
```

Heavy analyses must use predefined/cached results.

---

# 51. Precomputation first

Do NOT calculate nationwide overlay dynamically on every request.

Batch-precompute:

```text
Iran railway exposure
major road exposure
city exposure
population exposure
```

API serves results.

Interactive custom geometry is secondary.

---

# 52. Analysis Runs

Create:

```text
analysis_runs
```

Fields:

```text
id UUID

analysis_method_id

deformation_product_id

asset_source_version_id NULL
population_source_version_id NULL

parameters JSONB

status

started_at
finished_at

git_sha
application_version

result_summary JSONB

error JSONB
```

All results must be reproducible from this table.

---

# 53. Idempotency

Generate:

```text
analysis_signature
```

from:

```text
method version
deformation product
source versions
parameters
```

Same exact analysis should not be recomputed unnecessarily.

---

# 54. Data Confidence

Confidence is about data suitability, not infrastructure safety.

Example dimensions:

```text
deformation_source_quality

valid_pixel_coverage

uncertainty availability

measurement_component

asset_data_completeness

population_data_age
```

Frontend may show:

```text
High data confidence
Medium data confidence
Low data confidence
Insufficient data
```

Rules must be versioned.

---

# 55. Frontend application modes

Main application `/map` gets three primary modes:

```text
تغییرشکل زمین
زیرساخت
جمعیت و مناطق
```

English internal identifiers:

```text
deformation
infrastructure
population
```

---

# 56. Infrastructure mode

Layout:

```text
┌─────────────────────────────────────────────────────────┐
│ FORUDID / فرودید                Search / Data / About  │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│ Assets       │                                          │
│              │                 MAP                      │
│ Railway      │                                          │
│ Roads        │                                          │
│              │                                          │
│ Filters      │                                          │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│ Selected asset profile / exposure segments             │
└─────────────────────────────────────────────────────────┘
```

RTL accordingly.

---

# 57. Infrastructure sidebar

Controls:

```text
نوع زیرساخت
  راه‌آهن
  راه‌های اصلی

داده تغییرشکل
  product selector

نوع تحلیل
  نرخ تغییرشکل
  gradient proxy
  differential hazard if validated

فیلتر
  exposed only
  coverage
  class
```

---

# 58. Asset ranking panel

Show a sortable table:

```text
Asset / route
Valid coverage
High+ exposed length
Max deformation
Max differential metric
Data confidence
```

Do not present a mysterious score.

---

# 59. Selecting an asset

Click railway/road:

```text
highlight asset
        ↓
zoom to asset
        ↓
load exposure summary
        ↓
load exposure segments
        ↓
load profile
        ↓
open detail panel
```

---

# 60. Asset Detail Page

Route:

```text
/assets/$assetId
```

Sections:

```text
Overview
Map
Exposure
Profile
Data quality
Sources
Downloads
```

---

# 61. Asset Overview

Example:

```text
تهران–قم

نوع:
راه‌آهن

طول تحلیل‌شده:
...

پوشش داده:
...

طول واقع در کلاس High+:
...

بیشترین نرخ تغییرشکل:
...

بیشترین differential metric:
...

Data confidence:
...

Deformation dataset:
...

Infrastructure source:
...
```

---

# 62. Segment table

List:

```text
Segment
Start km
End km
Length
Hazard class
Velocity
Differential metric
Coverage
```

Click row:

```text
zoom to map segment
```

---

# 63. Segment detail

Show:

```text
geometry
chainage
source pixels
metric distribution
nearby context
data quality
```

Never say:

```text
this railway will fail
```

---

# 64. Map visual hierarchy

Do not create rainbow chaos.

At one time the user should understand:

1. deformation background
2. infrastructure network
3. selected exposure segments

Selected asset has strongest visual prominence.

Non-selected assets remain subdued.

---

# 65. Deformation layer

Raster:

```text
TiTiler
```

Vector:

```text
Martin
```

Selected line/polygon:

```text
GeoJSON source
```

This separation should remain.

---

# 66. Vector tile layer design

At national zoom:

* major railway
* major roads

At higher zoom:

* detailed segments
* names
* secondary properties

Do not render millions of features at low zoom.

Use Martin/PostGIS views with zoom-aware simplification if required.

---

# 67. Buildings display

When building module is enabled:

do not render every building nationwide at every zoom.

Minimum zoom threshold.

Prefer:

```text
MVT
```

from Martin.

Potential later approach:

```text
PMTiles
```

for mostly static building archive.

---

# 68. Population mode

Display:

```text
population density
+
deformation/hazard
```

Summary:

```text
Estimated population exposed
by class
```

Use term:

```text
estimated
```

everywhere necessary.

---

# 69. City/region detail

Route:

```text
/regions/$regionId
```

Shows:

```text
deformation statistics

area by hazard class

estimated exposed population

road exposure

rail exposure

data sources

data quality
```

---

# 70. Comparison

Allow comparing two regions/assets only after single-item pages are stable.

Potential URL:

```text
/compare?type=region&a=...&b=...
```

Not V2 MVP blocking.

---

# 71. Profile API

```text
GET /api/v1/assets/{id}/profile
```

Parameters:

```text
analysis_run_id
```

Response:

```json
{
  "asset_id": "...",
  "unit": "m/year",
  "samples": [
    {
      "chainage_m": 0,
      "lon": 0,
      "lat": 0,
      "velocity": null,
      "uncertainty": null,
      "gradient_proxy": null,
      "angular_distortion": null,
      "hazard_class": null,
      "quality": "valid"
    }
  ]
}
```

---

# 72. Asset exposure API

```text
GET /api/v1/assets/{id}/exposure
```

Returns:

```text
summary
analysis method
deformation source
asset source
segments
confidence
```

Pagination for large segment lists.

---

# 73. Asset discovery API

```text
GET /api/v1/assets
```

Filters:

```text
asset_type
asset_class
bbox
search
exposure_class
analysis_run
```

Never return national geometries in ordinary listing.

Return metadata and IDs.

Geometry comes from tiles or detail endpoint.

---

# 74. Region statistics API

```text
GET /api/v1/regions/{id}/exposure
```

Returns:

```text
deformation
population
road
rail
quality
sources
```

---

# 75. Source API

```text
GET /api/v1/data-sources

GET /api/v1/data-sources/{id}

GET /api/v1/source-versions/{id}
```

Users must be able to inspect where data came from.

---

# 76. Analysis metadata

Every API analytical response contains:

```text
analysis_run_id

method
method_version

deformation_product_id

source_versions

generated_at

scientific_status
```

---

# 77. Downloads

Allow download of selected result:

```text
CSV
GeoJSON
```

Possible later:

```text
GeoPackage
```

Do not allow arbitrary full raw provider data download without respecting source license.

---

# 78. Report generation

V2 should generate a reproducible screening report.

Endpoint:

```text
POST /api/v1/reports
```

Input:

```text
analysis
asset/region
language
```

Output:

```text
report job
```

Precomputed report generation can run in worker.

---

# 79. Report contents

Infrastructure report:

```text
FORUDID
فرودید

Asset
Date

Executive summary

Map

Exposure summary

Exposure segments

Longitudinal profile

Data confidence

Scientific limitations

Data sources

Analysis methodology

Attributions

Processing IDs
```

---

# 80. Report language

Initial:

```text
fa
```

architecture supports:

```text
en
```

All Persian reports RTL.

Identifiers and coordinates isolated LTR.

---

# 81. Report terminology

Report title example:

```text
گزارش غربالگری مواجهه با تغییرشکل زمین
```

NOT:

```text
گزارش ایمنی راه‌آهن
```

---

# 82. Report disclaimer

Must state:

* derived from remote sensing/geospatial data
* screening purpose
* not structural inspection
* not engineering certification
* results depend on input dataset resolution and quality
* source dates

---

# 83. Reproducible report

Report metadata:

```text
report_id
analysis_run_id
application_version
generated_at
source_version_ids
```

Same report can be traced later.

---

# 84. Report implementation

Prefer backend deterministic HTML template.

Possible stack:

```text
Jinja2
HTML/CSS
PDF renderer
```

Do not couple reports to screenshots of interactive React UI.

Map figures can be generated separately.

PDF generation failure must not break analysis.

---

# 85. Source attribution page

FORUDID needs:

```text
/data
```

or:

```text
/sources
```

listing all datasets.

Each source:

```text
provider
description
version/date
license
citation
quality notes
```

---

# 86. Scientific methodology page

Create:

```text
/methodology
```

Sections:

```text
What InSAR measures

LOS vs vertical

Exposure vs risk

Velocity exposure

Differential deformation

Angular distortion

Population exposure

Limitations
```

This page is part of product trust.

---

# 87. Known source limitations

The Data Catalog UI must support structured limitations.

Example fields:

```text
coverage_limitations
temporal_limitations
spatial_resolution_limitations
validation_notes
known_gaps
```

---

# 88. COMET quality note

When COMET source is used, surface its quality metadata.

Never silently present it as equivalent to a fully independently validated engineering survey.

---

# 89. Building coverage limitations

If Microsoft Building Footprints is used:

coverage completeness must be evaluated.

Known no-data patches must not be interpreted as absence of structures.

Building module should have:

```text
coverage mask
```

or at minimum quality status.

---

# 90. OSM data limitation

OSM is community-maintained.

UI/report attribution should not imply:

```text
complete official national infrastructure inventory
```

Instead:

```text
infrastructure geometry derived from OpenStreetMap
```

---

# 91. Analysis engine package

Create:

```text
packages/python/forudid_analysis/
```

Structure:

```text
profiles/
sampling/
raster/
lines/
polygons/
population/
hazard/
exposure/
quality/
reports/
```

Do not place heavy scientific analytics directly inside FastAPI request handlers.

---

# 92. CLI

Add:

```bash
forudid data list

forudid data ingest-subsidence
forudid data ingest-osm
forudid data ingest-population

forudid analyze asset
forudid analyze infrastructure
forudid analyze population
forudid analyze region

forudid report asset
forudid report region
```

---

# 93. Example infrastructure command

```bash
forudid analyze infrastructure \
  --asset-type railway \
  --deformation-product PRODUCT_ID \
  --method velocity-exposure-v1
```

Later:

```bash
forudid analyze infrastructure \
  --asset-type railway \
  --deformation-product PRODUCT_ID \
  --method payne-2025-beta-v1
```

only if that method is validated for the product.

---

# 94. No hidden analysis

Every CLI analysis must print/store:

```text
method
source IDs
parameters
output ID
```

---

# 95. Raster sampling implementation

Use:

```text
Rasterio
NumPy
Shapely
PyProj
```

Reproject asset geometry into raster CRS for sampling.

Do not reproject the scientific raster solely for convenience if avoidable.

Preserve:

```text
native grid
```

for scientific analysis.

---

# 96. Geodesic distance

Chainage calculations must use a suitable projected CRS or geodesic method.

Do not compute kilometre lengths directly in EPSG:4326 degrees.

---

# 97. Nodata

Nodata is first-class.

A segment crossing no valid deformation data must be:

```text
insufficient_data
```

not:

```text
zero deformation
```

---

# 98. Coverage

For every asset:

```text
coverage =
valid sampled length / total sampled length
```

Expose percentage.

Ranking must not unfairly rank a poorly covered asset as safe.

---

# 99. Uncertainty

If uncertainty raster exists:

sample it.

Expose:

```text
median uncertainty
p95 uncertainty
max uncertainty
```

Do not fabricate uncertainty if source has none.

Use:

```text
uncertainty unavailable
```

---

# 100. Raster gradient testing

Gradient implementation must have synthetic unit tests:

## flat raster

Expected:

```text
gradient = 0
```

## linear plane

Expected gradient analytically known.

## nodata window

correct behavior.

## CRS/pixel resolution

correct physical units.

---

# 101. Differential method golden tests

Create test fixtures reproducing known simple surfaces.

For validated literature method, create a golden dataset and expected beta ranges.

Method status remains experimental until these tests exist.

---

# 102. Database extensions

Add migrations for:

```text
data_sources
source_versions

assets
asset_routes
asset_route_members

analysis_methods
analysis_runs

exposure_segments
asset_exposure_summaries

population_exposure_results

reports
```

Do not destroy V1 tables.

---

# 103. asset_exposure_summaries

```text
id

analysis_run_id
asset_id

total_length_m
valid_length_m
coverage_fraction

mean_velocity
median_velocity
p05_velocity
p95_velocity

max_abs_velocity

medium_length_m
high_length_m
very_high_length_m

max_gradient
max_beta

segment_count

data_confidence

metrics JSONB
```

Unique:

```text
analysis_run_id + asset_id
```

---

# 104. Reports table

```text
id
analysis_run_id

subject_type
subject_id

language

status

object_uri

sha256

created_at
completed_at

metadata JSONB
```

---

# 105. Martin integration

Add service:

```text
martin
```

to Compose V2.

Expose internally:

```text
martin:3000
```

Reverse proxy public path:

```text
/vector/*
```

Do not expose unrestricted database tables.

Use explicit Martin config.

---

# 106. Martin sources

Publish only safe views.

Examples:

```text
tiles_railways
tiles_major_roads
tiles_exposure_segments
tiles_regions
```

Do not autodiscover and expose every PostGIS table in production.

---

# 107. Tile view properties

Only include properties needed for map:

```text
id
name
class
exposure_class
confidence
```

Do not serialize giant `all_tags` JSON into every tile.

---

# 108. API vs tiles

Tiles provide:

```text
visual geometry
basic IDs
```

API provides:

```text
detail
metrics
provenance
analysis
```

Map feature click:

```text
feature id
   ↓
API fetch
```

---

# 109. Frontend feature structure

Add:

```text
features/
  infrastructure/
  exposure/
  profiles/
  regions/
  population/
  sources/
  reports/
```

Keep deformation module from V1.

---

# 110. URL state

Infrastructure map state:

```text
mode=infrastructure

assetType=railway

analysis=...

asset=...

layer=...

metric=...

class=...

lon
lat
z
```

A selected analysis view must be shareable.

---

# 111. Search

Search should support:

```text
asset name
region
city
route
```

Do not call external geocoder for every keystroke.

Internal indexed search first.

---

# 112. Map click priority

When map has multiple layers:

click priority:

```text
selected exposure segment
asset
region
raster point
```

Prevent ambiguous popups.

---

# 113. Exposure segment styling

Use distinct styling for:

```text
normal asset
selected asset
exposure segment
selected exposure segment
```

Hazard class uses color plus pattern/icon/text where possible.

Do not rely on color alone.

---

# 114. Accessibility

Tables must provide the same key information as map.

A user must be able to inspect exposure results without depending exclusively on visual map colors.

---

# 115. Mobile

Mobile is not full desktop GIS.

Mobile supports:

```text
view
search
select asset
summary
segments
profile
share
```

Complex multi-dataset configuration can remain optimized for desktop.

---

# 116. Performance

National map:

* vector tiles
* raster tiles
* no full national GeoJSON
* no building layer before appropriate zoom
* API pagination
* indexed PostGIS queries

---

# 117. Precomputed overview metrics

Homepage infrastructure summary may show:

```text
Railway analysed
...

Road analysed
...

High-priority screening segments
...

Data coverage
...
```

Only when analysis run is published.

---

# 118. Publication lifecycle

Analysis:

```text
draft
processing
review_required
published
superseded
failed
```

Public UI uses only:

```text
published
```

unless developer mode.

---

# 119. Manual scientific review

Differential hazard analyses must pass:

```text
review_required
```

before public publication.

Velocity-only descriptive analyses may have simpler validation but still require data validation.

---

# 120. Data publication status

Source product:

```text
raw
normalized
validated
published
deprecated
```

Keep raw source immutable.

---

# 121. ETL provenance

Every ingestion run stores:

```text
input URL/path
download time
checksum
tool versions
commands/config
output checksum
```

---

# 122. OSM update strategy

MVP:

manual periodic snapshot.

Do not implement minutely OSM replication yet.

Snapshot IDs allow reproducibility.

Example:

```text
osm-iran-2026-09-03
```

---

# 123. Population update strategy

Population year/version is explicit.

Never silently replace 2025 data with 2026 and keep previous analysis ID.

New source version requires new analysis run.

---

# 124. Comparative trend

V2 does NOT pretend static 2014–2020 dataset is current 2026 condition.

UI must display:

```text
Observation period: 2014–2020
```

prominently.

---

# 125. Time freshness indicator

For every deformation product derive:

```text
data_end_date
```

Display:

```text
Latest observation / period end
```

Do not call old data "current".

---

# 126. Freshness levels

Optional UI:

```text
recent
historical
```

but the threshold must be simple product metadata, not scientific hazard.

---

# 127. Multi-source comparison

Future capability:

```text
Haghighi-Motagh
vs
COMET
vs
FORUDID processing
```

Do not merge values into one raster without a validated harmonization methodology.

Instead allow comparison.

---

# 128. Source switcher

Map UI:

```text
داده تغییرشکل:
[dataset]
```

Shows:

```text
source
period
component
resolution
method
```

before selection.

---

# 129. Avoid false precision

If source resolution is ~100m:

do not report chainage hazard boundary to centimetres.

Display sensible precision.

Example:

```text
12.4 km
```

not:

```text
12.437281 km
```

---

# 130. Asset naming

OSM name may be missing.

Fallback:

```text
Railway segment #...
```

Do not fabricate route names.

Route naming/enrichment is a separate task.

---

# 131. Custom route analysis

Later allow analyst to construct a route by selecting connected segments.

Store route definition separately from source OSM topology.

---

# 132. Building exposure V2.1

When enabled:

```text
building footprints
       ↓
sample hazard
       ↓
building exposure
```

Metrics:

```text
building count in valid area

count by hazard class

footprint area

coverage quality
```

Do NOT estimate structural vulnerability from footprint geometry alone.

---

# 133. No ML in V2 core

Do not add:

```text
XGBoost
neural networks
LLM risk prediction
AI hazard model
```

The value of V2 should first be demonstrated with transparent geospatial analysis.

---

# 134. Explainability

Every result should be explainable through:

```text
Source
Method
Inputs
Metric
Threshold/classification
Coverage
Limitations
```

No black-box scoring.

---

# 135. Product telemetry

Optional privacy-conscious telemetry later.

Not MVP blocking.

No third-party analytics until privacy decision is made.

---

# 136. Testing stack

Frontend:

```text
Vitest
React Testing Library
Playwright
```

Backend:

```text
pytest
```

Spatial/science:

```text
pytest
synthetic rasters
golden geometries
```

---

# 137. Integration fixture

Create a small synthetic V2 fixture:

```text
10 × 10 km raster

one railway crossing deformation bowl

one road

one region polygon

small population raster
```

Expected results known mathematically.

Use this fixture before ingesting all Iran data.

---

# 138. Synthetic railway acceptance

Fixture:

```text
railway length = known

high exposure section = known length
```

Test expected:

```text
coverage
segment boundaries
profile
statistics
```

within tolerance.

---

# 139. Real pilot area

After synthetic fixture:

pilot V2 should be:

```text
Tehran / Varamin / Qom corridor
```

with:

```text
railway
major roads
```

Do NOT initially compute all infrastructure in Iran.

---

# 140. Why Tehran–Qom/Varamin pilot

Pilot should have:

* known significant subsidence
* major transport infrastructure
* enough spatial variation
* visually understandable results
* manageable analysis size

Exact corridor may be adjusted based on actual source coverage.

---

# 141. V2 Milestone 0 — Audit V1

Before writing V2 code:

Codex must:

1. inspect repository.
2. identify current architecture.
3. list V1 tables.
4. list API routes.
5. list frontend routes.
6. identify technical debt.
7. create V2 ADRs.
8. do not rewrite stable working modules.

Deliver:

```text
docs/v2/audit.md
```

---

# 142. Milestone 1 — Branding

Rename visible application to:

```text
FORUDID
فرودید
```

Update:

* title
* metadata
* README
* app shell
* reports
* docs

Do not alter historical citations unnecessarily.

---

# 143. Milestone 2 — Data Catalog

Implement:

```text
data_sources
source_versions
```

UI:

```text
/sources
```

Acceptance:

one source can be registered with:

```text
citation
license
version
checksum
```

---

# 144. Milestone 3 — Nationwide deformation baseline

Ingest Haghighi–Motagh dataset.

Archive original.

Normalize to internal products.

Create COG where necessary.

Register STAC metadata.

Acceptance:

FORUDID displays nationwide historical deformation product with correct period and attribution.

---

# 145. Milestone 4 — OSM Infrastructure

Download/import Iran OSM snapshot.

Extract:

```text
railway
motorway
trunk
primary
secondary
```

PostGIS indexes.

Acceptance:

count features.

random geometry inspection.

provenance recorded.

---

# 146. Milestone 5 — Martin

Add Martin.

Create explicit views.

MapLibre renders:

```text
railways
major roads
```

using vector tiles.

Acceptance:

no national GeoJSON download.

responsive pan/zoom.

---

# 147. Milestone 6 — Synthetic Exposure Engine

Build synthetic fixture.

Implement:

```text
line densification
raster sampling
chainage
coverage
statistics
segment grouping
```

Acceptance:

golden tests pass.

---

# 148. Milestone 7 — Velocity Exposure

Run first real:

```text
railway × deformation raster
```

No differential hazard yet.

Generate:

```text
profile
summary
segments by descriptive bands
```

Label correctly.

---

# 149. Milestone 8 — Infrastructure UI

Build:

```text
infrastructure mode
asset list
asset selection
summary
profile
segment table
map highlight
```

Deep-linkable.

---

# 150. Milestone 9 — Pilot Corridor

Select Tehran/Varamin/Qom study corridor based on data.

Produce a publishable pilot analysis.

Acceptance:

one real route can be explored end-to-end.

---

# 151. Milestone 10 — Population

Ingest WorldPop or approved GHSL source.

Create region population exposure.

Acceptance:

population count mass-conservation test passes.

---

# 152. Milestone 11 — Region Dashboard

Create:

```text
region page
```

showing:

```text
deformation
population exposure
road exposure
rail exposure
source info
```

---

# 153. Milestone 12 — Gradient Proxy

Implement:

```text
experimental deformation gradient proxy
```

Clearly marked experimental.

Unit tests.

Do not present as validated angular distortion.

---

# 154. Milestone 13 — Angular Distortion Research Implementation

Implement literature method behind feature flag.

Requirements:

* scientific reference
* method doc
* unit tests
* golden tests
* resolution metadata
* review status

No public release yet.

---

# 155. Milestone 14 — Scientific Validation

Compare output against:

```text
published examples
known profiles
known synthetic results
```

Document discrepancies.

Only then status can move:

```text
experimental
→
review
→
validated
```

---

# 156. Milestone 15 — Exposure Segments

Enable differential-hazard exposure segments only for a validated method/product combination.

Generate exact corridor screening outputs.

---

# 157. Milestone 16 — Reports

Create Persian infrastructure screening PDF.

Acceptance:

report identifies:

```text
asset
sources
period
method
metrics
segments
limitations
analysis ID
```

---

# 158. Milestone 17 — CSV/GeoJSON Export

Export:

```text
asset summary CSV

profile CSV

exposure segments GeoJSON
```

Include metadata/header/sidecar for source IDs and method.

---

# 159. Milestone 18 — Buildings optional

Only after infrastructure V2 works.

Import selected pilot area, not nationwide first.

Run coverage audit.

Then building exposure.

---

# 160. V2 MVP Definition

FORUDID V2 MVP is achieved when:

1. historical nationwide deformation source is ingested.
2. source provenance is visible.
3. Iran railway and major roads are imported.
4. infrastructure uses MVT, not giant GeoJSON.
5. a user can select a railway/road.
6. its deformation profile appears.
7. valid-data coverage is visible.
8. exposed intervals are generated.
9. each interval is clickable.
10. source period is visible.
11. data quality/confidence is visible.
12. descriptive velocity exposure works.
13. population exposure works for selected regions.
14. reports can be generated.
15. exposure is never mislabeled as structural risk.
16. scientific method version is auditable.
17. URLs are shareable.
18. Persian RTL works.
19. tests cover geospatial calculations.
20. the pilot provides information not already given by a plain subsidence map.

---

# 161. V2 Success Question

The project is successful only if a user can answer something like:

> “Which sections of this railway intersect substantial deformation, how many kilometers are involved, what period does the data represent, how good is it, and where should a field investigation start?”

A colored raster alone does not satisfy V2.

---

# 162. V2 Non-Goals

Do not build yet:

```text
full structural risk model

failure prediction

earthquake prediction

automated engineering safety certification

real-time national alerts

AI decision engine

nationwide building risk

groundwater forecasting

Kubernetes

microservice explosion
```

---

# 163. V2.1 / V3 candidates

After V2 validation:

```text
new COMET data integration

FORUDID own InSAR updates

ascending/descending decomposition

validated angular distortion nationwide

building exposure

aquifer datasets

GNSS validation

asset owner private uploads

historical change comparison

automatic update workflow

expert annotations

field inspection integration

alert candidates
```

---

# 164. Future expert inspection module

Possible future schema:

```text
field_observations
```

Could contain:

```text
crack observed
date
photos
asset
chainage
severity
surveyor
```

This could eventually connect remote sensing hazard to observed damage.

Not V2 MVP.

---

# 165. Future vulnerability model

Only after real engineering inputs exist.

Possible inputs:

```text
asset type
foundation
age
maintenance
bridge/embankment
geology
observed damage
```

Only then start calling outputs:

```text
risk
```

---

# 166. Scientific documentation

Create:

```text
docs/science/
```

Files:

```text
deformation-components.md

velocity-exposure.md

gradient-proxy.md

angular-distortion.md

population-exposure.md

terminology-hazard-exposure-risk.md

data-limitations.md
```

---

# 167. V2 ADRs

Create:

```text
0010-v2-decision-support-pivot.md
0011-data-source-registry.md
0012-osm-geofabrik-infrastructure.md
0013-martin-vector-tiles.md
0014-exposure-not-risk.md
0015-precompute-exposure.md
0016-differential-hazard-feature-gate.md
0017-worldpop-population.md
0018-building-footprints-optional.md
```

---

# 168. Codex engineering rules

Codex must not invent scientific assumptions.

When a required scientific parameter is uncertain:

1. make it configuration.
2. document it.
3. mark method experimental.
4. add TODO for scientific validation.

Never silently choose a number because it produces a nice map.

---

# 169. Dependency rules

Before adding a dependency:

document:

```text
problem
candidate choices
selected library
why selected
maintenance status
```

No duplicated libraries for same purpose.

---

# 170. Version pinning

Pin major dependencies.

Lock files committed.

Docker images pinned.

Analysis run records software versions where scientifically relevant.

---

# 171. Quality gate per milestone

Before milestone is complete run:

Frontend:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Backend:

```text
ruff
pyright
pytest
```

Spatial:

```text
synthetic analysis tests
```

Compose smoke test.

---

# 172. Final architecture

```text
                     DEFORMATION SOURCES
                           │
               ┌───────────┴───────────┐
               │                       │
        Published datasets       FORUDID pipeline
               │                       │
               └───────────┬───────────┘
                           ▼
                    Product Catalog
                           │
                     COG / Zarr / STAC
                           │
              ┌────────────┴─────────────┐
              │                          │
              ▼                          ▼
          TiTiler                    Analysis Engine
                                         ▲
                                         │
                  ┌──────────────────────┼───────────────────┐
                  │                      │                   │
                  ▼                      ▼                   ▼
             OSM Assets             Population          Other Data
                  │                      │
                  ▼                      ▼
              PostGIS                 Raster
                  │
                  ▼
                Martin
                  │
                  └──────────────┐
                                 │
              ┌──────────────────┴─────────────────┐
              │                                    │
              ▼                                    ▼
           FastAPI                               Tiles
              │                                    │
              └──────────────────┬─────────────────┘
                                 ▼
                         React / MapLibre
                                 │
                ┌────────────────┼─────────────────┐
                ▼                ▼                 ▼
             Explorer     Infrastructure       Regions
                              │
                              ▼
                           Profiles
                              │
                              ▼
                     Exposure Segments
                              │
                              ▼
                          Reports
```

---

# 173. Final product principle

FORUDID should always answer three questions:

```text
What do we observe?
What is exposed?
How confident are we?
```

and avoid claiming a fourth question unless scientifically justified:

```text
What will fail?
```

---

# 174. Final instruction to Codex

Do not implement all milestones in one uncontrolled generation.

Work sequentially.

For every milestone:

1. inspect existing code.
2. identify affected modules.
3. write/update tests.
4. implement smallest complete vertical slice.
5. run quality gates.
6. update docs.
7. report changed files.
8. report migrations.
9. report unresolved scientific assumptions.
10. proceed only with architecture consistent with this specification.

The primary V2 target is not nationwide complexity.

The primary target is:

```text
ONE scientifically credible deformation dataset
        +
ONE real transport corridor
        +
transparent exposure analytics
        +
profile
        +
segments
        +
source provenance
        +
quality
        +
a useful screening report
```

Once that works and provides a decision-maker with genuinely useful information, scale it to Iran.
