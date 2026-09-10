# FORUDID V3

## Ground Deformation Operations, Evidence & Action Platform

---

# 0. Product Identity

Official name:

**FORUDID**

Persian:

**فرودید**

V3 product definition:

> FORUDID V3 is an operational ground-deformation evidence and decision-support platform that converts observations into events, events into investigation priorities, investigations into field actions, and field outcomes into better future decisions.

Core loop:

```text
OBSERVE
   ↓
DETECT
   ↓
VERIFY
   ↓
PRIORITIZE
   ↓
INSPECT
   ↓
ACT
   ↓
LEARN
   └──────────────→ back to PRIORITIZE / DETECT
```

---

# 1. V3 is NOT another monitoring dashboard

Do not turn V3 into:

```text
Map
+
more layers
+
more charts
+
AI button
```

That is insufficient.

V3 must introduce persistent operational concepts:

```text
Deformation Event
Evidence
Watchlist
Case
Action
Inspection
Outcome
Forecast
Driver Hypothesis
Model Feedback
```

These objects are the core of the product.

---

# 2. Product evolution

```text
V1
Ground Motion

"What is the ground doing?"

        ↓

V2
Exposure Intelligence

"What assets/population are exposed?"

        ↓

V3
Operational Intelligence

"What changed?"
"Is it real?"
"What is affected?"
"What should we inspect first?"
"What did we find?"
"What should happen next?"
"What did the system learn?"
```

---

# 3. V3 Product Principle

FORUDID should answer:

```text
1. What changed?
2. When did it change?
3. Is the change credible?
4. Is it accelerating?
5. Is it spatially expanding?
6. Which assets are exposed?
7. What independent evidence supports it?
8. What might be driving it?
9. What should be investigated first?
10. What did field investigation find?
```

FORUDID must NOT automatically answer:

```text
"What will fail?"
```

unless an independently validated asset-specific vulnerability/reliability model exists.

---

# 4. Core V3 moat

The long-term proprietary asset is not the map.

It is:

```text
Satellite evidence
        +
asset context
        +
event history
        +
field inspection
        +
action taken
        +
real-world outcome
        =
FORUDID Evidence–Action–Outcome Dataset
```

Every V3 design decision should preserve this feedback loop.

---

# 5. Architecture inherited from V1/V2

Do not rewrite stable components.

Continue using:

## Frontend

```text
React 19
TypeScript
Vite
TanStack Router
TanStack Query
Zod

MapLibre GL JS
react-map-gl

ECharts

Tailwind
shadcn/ui
Radix

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
```

## Geospatial

```text
TiTiler
Martin

COG
Zarr
HDF5
STAC

S3-compatible object storage
```

## Science

```text
MintPy
Rasterio
GDAL
xarray
NumPy
SciPy
Shapely
PyProj
```

---

# 6. New V3 layers

Add:

```text
Event Engine

Evidence Engine

Case Management

Inspection PWA

Sensor Integration

Driver Intelligence

Forecast Engine

ML Model Registry

Priority Engine

AI Copilot

Optional Critical Asset Twin
```

---

# 7. New overall architecture

```text
                    OBSERVATION SOURCES
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
       ▼                   ▼                    ▼
 Sentinel-1             NISAR             Ground Sensors
       │                   │                    │
       │                   │             GNSS / Level /
       │                   │             Tilt / Piezometer
       │                   │                    │
       └─────────────┬─────┴────────────┬───────┘
                     │                  │
                     ▼                  ▼
              Deformation Products   SensorThings
                     │
                     ▼
                 QC / Normalize
                     │
                     ▼
              TIME-SERIES ENGINE
                     │
                     ▼
              EVENT DETECTION
                     │
                 Candidates
                     │
                     ▼
               EVENT ENGINE
                     │
       ┌─────────────┼────────────────────┐
       │             │                    │
       ▼             ▼                    ▼
   Evidence       Exposure          Driver Context
    Fusion         Engine                Engine
       │             │                    │
       └─────────────┼────────────────────┘
                     ▼
                EVENT DOSSIER
                     │
                     ▼
               PRIORITY ENGINE
                     │
                     ▼
                    CASE
                     │
                     ▼
             FIELD INSPECTION
                     │
                     ▼
                   OUTCOME
                     │
                     ▼
              MODEL FEEDBACK
```

---

# 8. Satellite strategy

V3 must be multi-sensor by architecture.

Supported families:

```text
Sentinel-1

NISAR

other future SAR sources
```

Never hardcode scientific logic around one satellite mission.

---

# 9. Sentinel-1 strategy

Sentinel-1 remains the operational C-band backbone.

Store:

```text
platform
satellite
orbit_direction
relative_orbit
acquisition_time
product_type
processing_version
```

Do not assume old Sentinel-1A acquisition schedule applies to current constellation.

---

# 10. NISAR adapter

Implement:

```text
NISARSourceAdapter
```

Initial supported products:

```text
GUNW
GSLC
```

Optional context:

```text
GCOV
```

Future:

```text
SME2
```

if scientifically useful.

---

# 11. NISAR maturity

Every NISAR asset must include:

```text
product_maturity:
  beta
  provisional
  validated
  unknown
```

V3 UI must display maturity.

Do not merge PROVISIONAL and VALIDATED results silently.

---

# 12. Sensor-specific evidence

Do NOT directly average:

```text
Sentinel-1 LOS
+
NISAR LOS
```

as though they are identical observations.

Evidence records must preserve:

```text
wavelength
view geometry
orbit
reference
resolution
temporal interval
processing method
uncertainty
maturity
quality
```

Fusion happens at evidence/event level unless a scientifically validated geometric decomposition is being performed.

---

# 13. Measurement abstraction

Introduce:

```text
MeasurementComponent

LOS
Vertical
EastWest
NorthSouth
ThreeDimensional
```

And:

```text
MeasurementMethod

direct_los
single_track_vertical_projection
multi_geometry_decomposition
gnss
leveling
sensor
model_derived
```

Never infer one from another.

---

# 14. V3 central object: Deformation Event

Create table:

```text
deformation_events
```

Fields:

```text
id UUID

event_key TEXT UNIQUE

geom GEOMETRY

event_type

status

first_detected_at
estimated_onset_at
last_observed_at

current_velocity
previous_velocity

acceleration_metric

area_current
area_max

growth_rate

dominant_component

confidence_grade

severity_screening_class

scientific_status

created_at
updated_at
```

---

# 15. Event lifecycle

Statuses:

```text
candidate

under_review

corroborated

monitoring

escalated

stable

resolved

seasonal

artifact

rejected
```

Do not delete rejected/artifact events.

They are valuable labels.

---

# 16. Event revisions

Create:

```text
event_revisions
```

Every important event change should be auditable.

Fields:

```text
id

event_id

revision_number

geometry

metrics JSONB

reason

source_processing_run

created_at
```

This allows reconstruction of:

```text
how the event evolved over time
```

---

# 17. Event observations

Create:

```text
event_observations
```

Each acquisition/update contributes observations.

Fields:

```text
event_id

observed_at

product_id

sensor_family

velocity

displacement

acceleration

area

gradient_metrics

coverage

uncertainty

quality

metrics JSONB
```

---

# 18. Event Evidence Graph

Create:

```text
event_evidence
```

Evidence types:

```text
sentinel1

nisar

gnss

leveling

piezometer

tiltmeter

inclinometer

crackmeter

field_inspection

field_photo

hydrology

surface_disturbance

external_report

expert_review
```

Fields:

```text
id

event_id

evidence_type

source_version_id

observation_id

supports_event BOOLEAN
contradicts_event BOOLEAN

quality

independence_group

summary

metadata JSONB

created_at
```

---

# 19. Evidence independence

Two measurements generated from the same raw acquisition should not count as two independent confirmations.

Use:

```text
independence_group
```

Examples:

```text
s1-desc-track-071

s1-asc-track-042

nisar-asc-path-X

gnss-station-XYZ
```

Evidence scoring must account for independence.

---

# 20. Evidence Grade

Introduce transparent event evidence grades.

Example semantic grades:

```text
A
Strongly corroborated

B
Corroborated

C
Single-source credible

D
Uncertain

U
Insufficient evidence
```

Exact rules must live in a versioned:

```text
evidence_profile
```

not hardcoded in frontend.

---

# 21. Example Evidence logic

Conceptually:

```text
A:
ground validation
+
credible satellite evidence

OR

multiple independent satellite geometries
+
strong quality
+
consistent temporal behaviour

B:
multiple independent remote-sensing sources

C:
one high-quality source

D:
weak/conflicting/provisional evidence
```

These are conceptual rules only.

Maintainers must not convert these examples into scientific thresholds without a reviewed profile.

---

# 22. Change detection pipeline

V3 should not monitor a country by running a heavy DL model on every pixel every acquisition.

Use two-stage processing.

```text
Stage 1:
fast statistical screening

        ↓

spatial candidate clustering

        ↓

Stage 2:
expensive refinement only on candidates
```

---

# 23. Stage 1 change detection

Implement several baseline detectors before deep learning:

```text
robust slope change

rolling median deviation

CUSUM-like detection

STPD-compatible detector

robust residual anomaly

seasonally adjusted anomaly
```

Every detector should output:

```text
candidate timestamp

magnitude

direction

confidence/statistic

minimum data support
```

---

# 24. Seasonal handling

Subsidence series often contain seasonality.

Before labeling a change point:

consider:

```text
seasonal component

long-term trend

short-term residual
```

Possible baseline decomposition:

```text
STL
harmonic regression
state-space seasonal component
```

Never treat a recurring annual cycle as acceleration automatically.

---

# 25. Stage 2 ML detector

Implement behind feature flag:

```text
ATGLSTM-style change detector
```

or another model selected after benchmark reproduction.

Do not implement a paper architecture blindly.

First build a benchmark suite:

```text
synthetic TS

real FORUDID labelled events

GNSS-correlated examples

seasonal examples

missing-data examples

atmospheric-noise examples
```

---

# 26. Event spatial clustering

Pixel candidates must be aggregated into meaningful spatial phenomena.

Initial algorithms:

```text
connected components

DBSCAN

HDBSCAN
```

Compare them.

Events should have:

```text
minimum persistence

minimum spatial support

geometry stability
```

before escalation.

---

# 27. Event matching over time

A newly detected blob should be matched to existing event if spatial/temporal continuity indicates the same phenomenon.

Do not generate a new alert every six days.

Implement:

```text
event association
```

based on:

```text
IoU

centroid distance

temporal continuity

metric similarity
```

with versioned parameters.

---

# 28. Alert fatigue protection

Introduce:

```text
hysteresis

cooldown

persistence

deduplication

event lifecycle
```

A noisy acquisition should not trigger repeated alerts.

---

# 29. Important distinction

```text
Observation
≠
Anomaly
≠
Event
≠
Alert
≠
Case
```

Definitions:

```text
Observation
raw/processed measurement

Anomaly
statistically unusual measurement

Event
persistent spatial-temporal phenomenon

Alert
notification generated from event criteria

Case
operational investigation record
```

---

# 30. Event Asset Impact

Create:

```text
event_asset_impacts
```

Fields:

```text
event_id
asset_id

intersection_length
distance_to_event

velocity_metrics
gradient_metrics

coverage

exposure_class

analysis_run_id

created_at
```

Reuse scientifically validated V2 exposure engine.

---

# 31. Asset criticality

V3 may store organization-provided asset importance.

Create:

```text
asset_criticality
```

Possible fields:

```text
asset_id

criticality_class

traffic_importance

replacement_difficulty

redundancy

population_served

owner_priority

metadata
```

This is operational metadata.

Do not pretend OSM data alone provides engineering criticality.

---

# 32. Priority Engine

Initial priority engine must remain transparent.

Inputs may include:

```text
event dynamics

exposure

asset criticality

evidence confidence

inspection recency

data uncertainty
```

Output:

```text
Screening Priority
```

NOT:

```text
failure probability
```

---

# 33. Initial priority classes

Example:

```text
P1 — Inspect first

P2 — Review soon

P3 — Monitor

P4 — Low current priority

U — Insufficient information
```

Rules are versioned.

UI must expose:

```text
Why this priority?
```

---

# 34. Priority explanation

Example:

```text
Priority P1 because:

• acceleration detected
• high-confidence independent evidence
• railway segment intersects event
• last field inspection 14 months ago
• uncertainty remains high near bridge approach
```

Do not hide priority behind one opaque number.

---

# 35. Value-of-Information engine

Add later V3 module:

```text
Inspection Value of Information
```

Goal:

Given limited inspection budget:

```text
which observations would reduce decision uncertainty most?
```

Potential actions:

```text
field inspection

GNSS campaign

leveling

corner reflector installation

piezometer installation

additional survey

drone survey
```

---

# 36. Initial VoI implementation

Do NOT start with complex Bayesian neural networks.

Start with transparent heuristic:

```text
uncertainty
×
asset consequence/criticality
×
event dynamics
×
lack of independent evidence
```

Name:

```text
Measurement Priority
```

not formal Bayesian VoI.

---

# 37. Bayesian VoI

Only after uncertainty models are calibrated.

Future:

```text
Prior belief
    ↓
candidate measurement
    ↓
expected posterior
    ↓
change in decision utility
    ↓
value of information
```

This may recommend measuring a poorly known location rather than repeatedly measuring an already obvious hotspot.

---

# 38. Case Management

Alerts should create or update a case.

Create:

```text
cases
```

Fields:

```text
id

event_id

asset_id NULL

title

status

priority

owner

team

created_at

due_at

closed_at

resolution

summary
```

---

# 39. Case statuses

```text
new

triage

investigation_requested

field_visit_scheduled

field_visit_complete

monitoring

action_required

action_complete

closed

false_positive
```

---

# 40. Case actions

Create:

```text
case_actions
```

Examples:

```text
review latest imagery

request GNSS survey

schedule field inspection

inspect drainage

inspect bridge approach

review pumping data

install monitoring sensor

continue monitoring
```

Actions can have:

```text
assignee
due date
completion state
evidence
```

---

# 41. Case timeline

UI must display one unified timeline:

```text
Event detected
↓
NISAR corroborated
↓
Case opened
↓
Engineer reviewed
↓
Field visit requested
↓
Inspection uploaded
↓
Case status changed
↓
Next satellite update
```

---

# 42. Field Inspection PWA

Build an offline-capable inspection application.

Prefer same React ecosystem.

Route:

```text
/field
```

Capabilities:

```text
download assigned cases

offline map

offline asset geometry

offline event summary

inspection checklist

GPS location

photos

notes

measurements

sync later
```

---

# 43. Offline requirement

Field teams may have weak connectivity.

Use:

```text
Service Worker

IndexedDB

local queue

background sync when available
```

Critical inspection forms must work without network.

---

# 44. Inspection model

Create:

```text
field_inspections
```

Fields:

```text
id

case_id

asset_id

event_id

inspector

started_at
completed_at

location

inspection_type

weather/context

outcome

confidence

notes

created_at
synced_at
```

---

# 45. Inspection outcome taxonomy

Use versioned labels.

Initial examples:

```text
ground_motion_indication_confirmed

damage_observed

no_visible_damage

drainage_issue_observed

construction_activity

sensor_or_processing_artifact_suspected

no_access

inconclusive
```

Avoid false binary:

```text
safe / unsafe
```

---

# 46. Inspection observations

Create:

```text
inspection_observations
```

Possible categories:

```text
cracking

differential_level

embankment_deformation

track_geometry_issue

road_surface_deformation

water_leakage

drainage

sinkhole

building_damage

other
```

---

# 47. Field photos

Store:

```text
photo
timestamp
geometry
orientation if available
inspection_id
annotation
```

Never expose private inspection photos publicly by default.

---

# 48. Field photo AI

Do NOT make this V3.0 critical.

After enough labelled local data:

AI may assist with:

```text
crack presence triage

spalling indication

water leakage

surface distress

blurry/invalid photo detection
```

Output:

```text
suggested label
confidence
```

Human confirmation required.

Never:

```text
AI says structure is unsafe
```

---

# 49. Feedback dataset

Every completed inspection becomes a training/evaluation sample.

Create:

```text
model_feedback
```

Links:

```text
event
prediction
priority
inspection
outcome
```

This dataset must not be overwritten when models change.

---

# 50. ML philosophy

FORUDID V3 uses:

```text
Simple model first
Deep model only when justified
```

Every ML task requires:

```text
baseline

training set definition

spatial split

temporal split

calibration evaluation

model card

reproducible version

fallback
```

---

# 51. Never random-split spatial science blindly

For geospatial ML:

use:

```text
spatial block CV

leave-region-out

leave-city-out

temporal holdout
```

as appropriate.

Random train/test splits alone are insufficient.

---

# 52. Model Registry

Create:

```text
model_registry

model_versions
```

Fields:

```text
task

model_family

version

training_dataset_version

feature_schema

hyperparameters

metrics

calibration_metrics

spatial_validation

temporal_validation

artifact_uri

git_sha

status
```

Statuses:

```text
experiment

challenger

champion

retired

rejected
```

---

# 53. ML prediction records

Never return model predictions without provenance.

Create:

```text
ml_predictions
```

Fields:

```text
model_version_id

subject_type
subject_id

prediction

uncertainty

explanation

created_at
```

---

# 54. Learning Priority Engine

Once enough inspection outcomes exist:

Train a model to estimate something defensible such as:

```text
probability that an inspection yields
a relevant field observation
```

NOT:

```text
probability of catastrophic failure
```

Possible models:

```text
Logistic Regression

XGBoost

LightGBM

CatBoost
```

Start with tabular interpretable models.

---

# 55. Priority model features

Possible:

```text
recent velocity

velocity change

acceleration

event growth

differential metric

coverage

uncertainty

evidence grade

sensor agreement

asset type

asset criticality

days since last inspection

hydrological context
```

Do not include fields unavailable at decision time.

Avoid target leakage.

---

# 56. Explainability

For tree models:

support:

```text
SHAP
```

But SHAP describes the model.

It does NOT prove physical causality.

UI language:

```text
Factors influencing this model prediction
```

not:

```text
Causes of subsidence
```

---

# 57. Active Learning

Once field label volume is sufficient:

recommend inspections that improve the model.

Candidate score may consider:

```text
high model uncertainty

novel feature space

high operational consequence

poor geographic representation
```

This creates:

```text
inspect to protect
+
inspect to learn
```

---

# 58. Groundwater / Driver Intelligence

Create a separate module:

```text
Driver Intelligence
```

It must answer:

```text
Which environmental/hydrologic factors
are associated with this deformation pattern?
```

not automatically:

```text
What caused it?
```

---

# 59. Driver data adapters

Architecture supports:

```text
GRACE / GRACE-FO

CHIRPS

ERA5-Land

SoilGrids

groundwater wells

pumping records

land use

crop patterns

geology

aquifer geometry

OPERA surface disturbance

local hydrological datasets
```

---

# 60. GRACE

Use only at appropriate basin/regional scale.

Do not compare a coarse GRACE cell directly with a railway pixel as if both have the same spatial meaning.

Store:

```text
resolution

temporal frequency

uncertainty

aggregation method
```

---

# 61. Rainfall

Adapter:

```text
CHIRPS
```

Possible features:

```text
1-month accumulation

3-month anomaly

6-month anomaly

12-month anomaly

SPI-like metrics
```

Scientific implementation must be documented.

---

# 62. ERA5-Land

Potential features:

```text
soil moisture

evapotranspiration

temperature

runoff

snow where relevant
```

Do not import every ERA5 variable without a use case.

---

# 63. Soil / geology

Static context can include:

```text
SoilGrids

bedrock depth

clay thickness

sediment thickness

local boreholes

geological maps
```

Store source quality separately.

---

# 64. Driver lag analysis

For each aquifer/event:

estimate local lag instead of hardcoding national lag.

Methods:

```text
cross correlation

distributed lag regression

Granger-style predictive tests

state-space models
```

Results are:

```text
association / predictive lead-lag
```

not automatic causal proof.

---

# 65. Driver hypothesis object

Create:

```text
event_hypotheses
```

Fields:

```text
event_id

hypothesis_type

support_level

model_method

evidence

counter_evidence

time_lag

model_version

scientific_status
```

Example:

```text
Hypothesis:
Groundwater decline is associated with
the observed long-term compaction.

Support:
Moderate

Evidence:
well levels
GRACE trend
seasonality
geological context
```

---

# 66. Explainable driver model

Baseline:

```text
XGBoost / CatBoost
+
SHAP
```

Benchmark against:

```text
linear model

regularized regression

random forest
```

Complex DL is not the default.

---

# 67. Aquifer Compaction Intelligence

For selected data-rich aquifers V3.x can attempt separation of:

```text
seasonal/recoverable response

long-term/inelastic trend
```

Possible signals:

```text
InSAR

well levels

precipitation

pumping

geology
```

This feature must be scientifically reviewed.

---

# 68. Elastic/inelastic labels

Do not label a component:

```text
irreversible compaction
```

based solely on a filtered time-series curve.

Require supporting hydrogeologic evidence/method.

---

# 69. Hydro model plugin

For selected aquifers:

support external:

```text
MODFLOW
```

models.

FORUDID should ingest:

```text
model scenario

groundwater head

compaction outputs

calibration metadata
```

rather than rewriting MODFLOW.

---

# 70. Physics-informed ML

PINN/physics-informed models are experimental.

Use only where:

```text
physical equations known

boundary conditions adequate

training data sufficient

baseline numerical model exists
```

Must beat/augment existing physical baseline.

No PINN because it sounds advanced.

---

# 71. Forecasting objective

V3 forecasting is:

```text
short-horizon operational forecasting
```

Default horizon:

```text
1–3 future acquisition cycles
```

not 10-year prophecy.

---

# 72. Forecast baselines

Always implement:

```text
last trend

robust linear trend

state-space local trend

Kalman filter
```

before ML.

---

# 73. Forecast ML candidates

Only after baseline:

```text
gradient boosting lag model

LSTM

Temporal Fusion Transformer

PatchTST-like model
```

depending on benchmark.

Do not install all models at once.

---

# 74. Forecast validation

Required:

```text
rolling-origin evaluation

spatial holdout

event-level evaluation

coverage evaluation

prediction interval calibration
```

Report more than RMSE.

---

# 75. Forecast uncertainty

Every forecast returns:

```text
median/expected trajectory

prediction interval

model version

forecast horizon

data quality
```

No point forecast alone.

---

# 76. Alert policy

A forecast alone cannot create a critical alert.

Critical escalation should require:

```text
observed event
+
evidence
+
forecast context
```

Forecasts support decisions; they do not manufacture evidence.

---

# 77. Sensor integration

Ground sensors may include:

```text
GNSS

leveling

piezometers

tiltmeters

inclinometers

crackmeters

settlement gauges

weather stations
```

---

# 78. SensorThings interoperability

Internal model should support mapping to:

```text
OGC SensorThings API
```

concepts:

```text
Thing
Sensor
Datastream
ObservedProperty
Observation
FeatureOfInterest
```

Do not create a proprietary sensor format when a standard mapping is possible.

---

# 79. IoT transport

Do not deploy Kafka by default.

Initial options:

```text
REST ingest

MQTT
```

for real sensor streams.

Add heavy streaming infrastructure only after measured throughput requires it.

---

# 80. Sensor storage

Start with PostgreSQL partitioned tables.

If high-frequency sensor volume later justifies it:

evaluate:

```text
TimescaleDB
```

Do not make it an early hard dependency.

---

# 81. Sensor observation table

```text
sensor_observations
```

Fields:

```text
sensor_id

observed_at

value

unit

quality

raw_value

metadata
```

Composite primary/index strategy optimized for:

```text
sensor_id + observed_at
```

---

# 82. Sensor QC

Each sensor family needs:

```text
valid range

missing-data rules

maintenance/calibration status

clock quality

drift handling

outlier flag
```

Sensor data is not automatically ground truth.

---

# 83. Multi-sensor fusion

Start with evidence-level fusion.

For selected assets with strong geometry:

advanced fusion may use:

```text
Kalman Filter

Extended/Unscented Kalman Filter

Bayesian state estimation
```

Do not use a neural fusion model before classical state estimation baselines.

---

# 84. Critical Asset Twin

Do NOT create:

```text
Digital Twin of Iran
```

Create:

```text
Critical Asset Twin
```

for selected objects only.

Examples:

```text
bridge

dam

tunnel

railway transition zone

metro station
```

---

# 85. Twin eligibility

An asset is eligible only if sufficient data exist:

```text
engineering geometry/BIM

sensor mapping

monitoring history

asset identifiers

inspection history
```

Otherwise it remains an:

```text
Operational GIS Asset
```

---

# 86. BIM support

Future adapter:

```text
IFC
```

Map:

```text
sensor → structural element

event → nearby/foundation element

inspection → structural element
```

Do not build a full BIM authoring tool.

---

# 87. 3D displacement

3D reconstruction is allowed only if sensor/view geometry makes it observable.

Possible sources:

```text
multiple InSAR geometries

GNSS

leveling

structural sensors
```

Never infer full 3D from one LOS track.

---

# 88. Foundation model experimentation

Create optional:

```text
EO Context Embedding
```

module.

Possible sources/models:

```text
TerraMind

TESSERA

future validated EO foundation models
```

---

# 89. What EO foundation models may do

Use embeddings to help with:

```text
land-cover context

construction/disturbance context

surface-change classification

limited-label classification

event neighbourhood similarity
```

---

# 90. What EO foundation models must NOT do

Do not use them to:

```text
invent displacement

replace InSAR

produce engineering risk

fill missing scientific measurements
with generated imagery
```

Generated data is never observational evidence.

---

# 91. Surface disturbance context

A deformation event near:

```text
construction

mining

earthworks

new road

surface clearing
```

may require different interpretation.

Use optical/SAR disturbance products as context evidence.

Do not automatically label disturbance as cause.

---

# 92. AI Copilot

V3 can contain a Persian-first operational Copilot.

But the LLM must never become the scientific calculation engine.

Architecture:

```text
User language
    ↓
LLM
    ↓
Validated Query DSL
    ↓
Allowlisted deterministic tools
    ↓
FORUDID APIs
    ↓
Structured evidence
    ↓
LLM explanation
```

---

# 93. Example Copilot questions

```text
«کدام ۱۰ قطعه راه‌آهن
در ۶۰ روز اخیر شتاب بیشتری نشان داده‌اند؟»

«کدام eventها هم توسط Sentinel-1
و هم NISAR تأیید شده‌اند؟»

«کدام پرونده‌های P1 هنوز بازدید میدانی نشده‌اند؟»

«چرا این قطعه P1 شده؟»

«برای این رویداد یک خلاصه مدیریتی بساز.»

«کجا نصب یک GNSS جدید
بیشترین ارزش اطلاعاتی را دارد؟»
```

---

# 94. Query DSL

Do not let LLM generate arbitrary SQL.

Example internal request:

```json
{
  "operation": "rank_assets",
  "filters": {
    "asset_type": "railway",
    "lookback_days": 60,
    "event_status": ["corroborated", "monitoring"]
  },
  "sort": [
    {
      "field": "acceleration_metric",
      "direction": "desc"
    }
  ],
  "limit": 10
}
```

Validate with Pydantic/Zod.

---

# 95. Copilot evidence rule

Every numeric statement generated by Copilot must map to:

```text
API response

event ID

case ID

analysis run

source version
```

Copilot may summarize.

Copilot may not invent values.

---

# 96. Copilot output

For analytical answers show:

```text
answer

data period

evidence grade

source products

limitations
```

when appropriate.

---

# 97. Copilot permissions

Separate tools:

```text
read

draft

action
```

By default LLM may:

```text
read
draft
```

It may NOT autonomously:

```text
close case

publish analysis

send critical alert

change scientific threshold

delete evidence
```

---

# 98. Copilot action confirmation

Potentially consequential actions require explicit user confirmation.

Example:

```text
Create inspection request?

Send report?

Assign case?
```

---

# 99. AI generated reports

LLM can draft narrative sections.

All tables, metrics and figures come from deterministic pipelines.

Final report metadata records:

```text
narrative_generated_by_ai BOOLEAN

model/version

reviewed_by
```

---

# 100. Event UI

Main map gains:

```text
Events
```

mode.

Event marker/geometry encodes:

```text
status

confidence

recent dynamics
```

not simply red = danger.

---

# 101. Event card

Display:

```text
Event ID

First detected

Estimated onset

Latest observation

Current behaviour

Acceleration status

Area change

Evidence grade

Affected assets

Open cases

Data sources
```

---

# 102. Event dossier

Route:

```text
/events/$eventId
```

Tabs:

```text
Overview

Evolution

Evidence

Assets

Drivers

Forecast

Cases

Inspections

Sources
```

---

# 103. Event evolution chart

Show:

```text
velocity/change

event area

confidence

acquisition dates

change points

inspection dates
```

All on aligned timeline where possible.

---

# 104. Evidence panel

Display each item independently:

```text
Sentinel-1 Desc
Consistent
High QC

Sentinel-1 Asc
No coverage

NISAR L-band
Consistent
PROVISIONAL

GNSS
No station

Field inspection
Pending
```

This is more useful than one mysterious confidence score.

---

# 105. Contradictory evidence

Contradiction must be first-class.

Example:

```text
Sentinel suggests acceleration.

NISAR does not reproduce it.

Possible reasons:
different geometry
different sampling dates
processing artifact
surface coherence
```

Do not hide conflict by averaging.

---

# 106. Watchlists

Users can watch:

```text
asset

route

region

aquifer

event
```

Create:

```text
watchlists
watchlist_items
```

---

# 107. Notification policies

Each watchlist can define:

```text
new corroborated event

evidence upgrade

significant acceleration

new exposed segment

inspection overdue

case status change
```

---

# 108. Notification channels

Architecture:

```text
in-app
email
web push
```

Later:

```text
SMS / organizational integrations
```

Do not hardwire provider.

---

# 109. Case inbox

Operational homepage should NOT open with a beautiful national map.

For decision-makers:

```text
Needs attention

New corroborated events

P1 cases

Inspections due

New evidence

Recently resolved
```

Then map.

---

# 110. Role-oriented UI

Possible roles:

```text
Analyst

Field inspector

Asset manager

Hydrologist

Administrator
```

Do not show every scientific control to every role.

---

# 111. Model monitoring

ML models can degrade.

Track:

```text
input drift

prediction distribution

calibration drift

inspection yield

false-positive rate

false-negative evidence where measurable
```

---

# 112. Champion / Challenger

Never silently replace production model.

```text
Champion
      │
      ├── production
      │
Challenger
      │
      └── shadow evaluation
```

Promotion requires review.

---

# 113. Event detector evaluation

Important operational metrics:

```text
precision

recall

F1

false events / month

median detection delay

event localization error

agreement with independent observations
```

Not just pixel accuracy.

---

# 114. Priority model evaluation

Evaluate:

```text
inspection yield at top K

precision@K

calibration

geographic fairness

event-type breakdown

asset-type breakdown
```

A model used for prioritization should be judged by usefulness of its ranked list.

---

# 115. Forecast evaluation

Use:

```text
MAE / RMSE

interval coverage

interval width

change-direction accuracy

event-level performance
```

Do not select model by R² alone.

---

# 116. Data leakage rules

Never include future:

```text
inspection outcome

future event classification

future sensor observations
```

in historical training features.

Build feature snapshots:

```text
as_of_timestamp
```

---

# 117. Feature Store

Do not deploy a complex feature-store platform initially.

Use versioned tables/materialized datasets:

```text
event_feature_snapshots

asset_feature_snapshots
```

Every training row has:

```text
as_of
feature_schema_version
```

---

# 118. Event Feature Snapshot

Example:

```text
event_id

as_of

velocity_30d

velocity_change_60d

event_area

area_growth

evidence_count

independent_evidence_count

evidence_grade

coverage

uncertainty

rainfall_anomaly

groundwater_trend

asset_count

critical_asset_count

days_since_inspection
```

---

# 119. Privacy and security

Field inspection information may be non-public.

Introduce visibility:

```text
public

organization

restricted
```

at:

```text
case
inspection
photo
sensor
custom asset
```

level.

---

# 120. Public vs enterprise product

Public FORUDID may show:

```text
published deformation

public exposure

public events

public sources

methodology
```

Restricted workspace may include:

```text
private assets

field inspections

sensor feeds

maintenance notes

case workflow

private reports
```

Architecture must separate visibility.

---

# 121. Audit log

Operational actions require:

```text
audit_log
```

Record:

```text
actor

action

subject

timestamp

before/after where appropriate
```

Important for:

```text
case change

scientific publication

threshold change

model promotion

alert policy
```

---

# 122. Reproducibility

Every event must trace back to:

```text
product versions

processing runs

detector version

detector parameters

event association version

evidence profile version
```

---

# 123. Event reprocessing

When better science/data arrives:

do not rewrite history invisibly.

Create new revision.

Preserve previous:

```text
candidate → artifact
```

decision.

False positives are important training data.

---

# 124. Data maturity

Every source can have:

```text
experimental

provisional

validated

operational

deprecated
```

This should propagate into evidence confidence.

---

# 125. Processing independence

Do not make FORUDID dependent on one paid cloud-processing service.

Introduce:

```text
ProcessingProviderAdapter
```

Possible:

```text
external provider

self-hosted processor

published product source
```

The event/product layer must not care where processing ran.

---

# 126. Self-hosted science path

Long-term architecture should support open/self-hosted Sentinel processing.

Keep separate from V3 event logic.

Possible scientific tools can evolve independently.

V3 must work even if one processor/provider is unavailable.

---

# 127. Workflow orchestration

At V3, scheduled workflows become justified.

Use:

```text
Prefect 3
```

for:

```text
data discovery

ingestion

scheduled processing

event updates

evidence reconciliation

driver feature refresh

forecast runs
```

---

# 128. Do not use Prefect for business workflow

Cases/actions remain in application DB.

Do not model:

```text
engineer assigned case
```

as a Prefect flow.

---

# 129. Pipeline schedule

Conceptually:

```text
discover acquisitions
     ↓
ingest/process
     ↓
QC
     ↓
update time series
     ↓
run fast detector
     ↓
cluster candidates
     ↓
refine candidates
     ↓
match/update events
     ↓
recompute evidence
     ↓
recompute impacts
     ↓
recompute priority
     ↓
notify if policy satisfied
```

---

# 130. Failure isolation

If NISAR ingestion fails:

Sentinel processing continues.

If forecast fails:

observed event remains available.

If driver model fails:

event evidence remains intact.

ML is never a single point of failure for basic monitoring.

---

# 131. New V3 APIs

```text
GET /api/v1/events

GET /api/v1/events/{id}

GET /api/v1/events/{id}/timeline

GET /api/v1/events/{id}/evidence

GET /api/v1/events/{id}/assets

GET /api/v1/events/{id}/drivers

GET /api/v1/events/{id}/forecast
```

---

# 132. Case APIs

```text
GET /api/v1/cases

POST /api/v1/cases

GET /api/v1/cases/{id}

PATCH /api/v1/cases/{id}

POST /api/v1/cases/{id}/actions
```

Authorization required for mutations.

---

# 133. Inspection APIs

```text
GET /api/v1/inspections

POST /api/v1/inspections

GET /api/v1/inspections/{id}

POST /api/v1/inspections/{id}/observations

POST /api/v1/inspections/{id}/attachments

POST /api/v1/inspections/{id}/complete
```

Support idempotency key for offline synchronization.

---

# 134. Sensor APIs

Provide internal adapters.

Where interoperability matters expose/map to SensorThings-compatible structures.

Do not expose private sensors publicly.

---

# 135. Priority API

```text
GET /api/v1/priorities
```

Filters:

```text
region

asset type

event type

minimum evidence

case status

time window
```

Returns explanations.

---

# 136. AI query API

```text
POST /api/v1/assistant/query
```

Internally:

```text
language
→ intent
→ DSL
→ deterministic tools
→ evidence packet
→ narrative
```

Log:

```text
query
tool calls
evidence IDs
answer version
```

---

# 137. Assistant safety

If data are insufficient:

answer:

```text
اطلاعات کافی برای این نتیجه وجود ندارد.
```

Never fill gaps with generic model knowledge.

---

# 138. AI report drafting

Allowed:

```text
summarize event

compare periods

draft inspection brief

draft management summary

explain evidence
```

Not allowed:

```text
invent measurements

assign engineering safety certification

change risk thresholds
```

---

# 139. New frontend routes

```text
/events

/events/$eventId

/cases

/cases/$caseId

/field

/watchlists

/models

/sources

/operations
```

Admin-only:

```text
/admin/models

/admin/scientific-profiles
```

---

# 140. Operations Dashboard

Main operational dashboard:

```text
Today's changes

New events

Evidence upgrades

Accelerating events

Assets affected

P1 cases

Overdue inspections

Low-confidence important areas
```

---

# 141. Evidence Matrix UI

Useful visualization:

```text
               S1 Desc   S1 Asc   NISAR   GNSS   Field
Event A          ✓         ✓        ✓       —       ✓
Event B          ✓         —        ?       —       —
Event C          ✓         ✕        —       ✓       —
```

Do not collapse everything immediately into one color.

---

# 142. Event map layers

```text
Candidate events

Corroborated events

Monitoring events

Exposed assets

Inspection points

Ground sensors
```

Visibility depends on role.

---

# 143. Investigation mode

A case page should combine:

```text
event geometry

asset

time series

evidence matrix

driver context

field observations

forecast

actions
```

This is the core V3 workspace.

---

# 144. Suggested Action Engine

Initial actions are rules/templates, not AI autonomy.

Example:

```text
IF:
high-priority event
AND
only one satellite geometry
AND
critical asset
THEN:
suggest independent measurement
```

Another:

```text
IF:
field inspection older than configured interval
AND
event accelerating
THEN:
suggest field inspection
```

Rules versioned.

---

# 145. Recommendation explanation

Every recommendation:

```text
Suggested action

Reason

Evidence

Expected information gain

Limitations
```

---

# 146. Measurement planning

Allow analysts to define:

```text
budget

available instruments

max inspections

geographic constraints
```

System can rank:

```text
where should we measure next?
```

This is a strategic V3 differentiator.

---

# 147. Measurement types

Possible:

```text
GNSS campaign

level survey

field inspection

piezometer

corner reflector

tiltmeter

drone survey
```

No automatic installation order.

It is a planning recommendation.

---

# 148. Critical asset sensor design

Future module can suggest sensor locations based on:

```text
event geometry

gradient

asset geometry

current evidence gaps

accessibility

expected information value
```

Always expert-reviewable.

---

# 149. Federated learning

NOT V3 default.

Only consider if multiple organizations have private:

```text
well data

inspection data

sensor data
```

and cannot centralize it.

Then evaluate federated learning.

Do not build infrastructure before a real multi-owner requirement exists.

---

# 150. Notification severity

Never use:

```text
red = imminent failure
```

Possible:

```text
Information

Review

Investigation recommended

Urgent review
```

with explicit definitions.

---

# 151. Scientific status vs operational priority

Keep separate:

```text
Evidence confidence:
A

Operational priority:
P1
```

A low-confidence event can still merit inspection if consequence is high.

A high-confidence event may be low priority if no important asset is exposed.

---

# 152. Short-horizon forecast UI

Show:

```text
Observed

Forecast

Prediction interval
```

Use visually distinct forecast region.

Include:

```text
Forecast horizon

Model

Last training/update

Validation metric
```

---

# 153. Driver UI

Display:

```text
Potential associated drivers
```

Example:

```text
Groundwater decline
Strong model association

Rainfall deficit
Moderate association

Soil clay content
Static susceptibility factor

Construction disturbance
Recent nearby signal
```

No causal wording unless justified.

---

# 154. Scenario mode

Only for validated hydro models.

Potential:

```text
What-if pumping reduction

recharge scenario

climate scenario
```

Output must say:

```text
scenario simulation
```

not prediction of what will definitely happen.

---

# 155. Foundation model context UI

If used:

do not show embedding values to normal users.

Use derived, reviewed context categories.

Store:

```text
model version

embedding year

source imagery

classifier version
```

---

# 156. Field-to-model loop

Workflow:

```text
Event
 ↓
Case
 ↓
Inspection
 ↓
Outcome
 ↓
Label review
 ↓
Training dataset
 ↓
Challenger model
 ↓
Shadow validation
 ↓
Possible promotion
```

This loop should be visible in architecture docs.

---

# 157. V3 data model additions

Add:

```text
deformation_events
event_revisions
event_observations
event_evidence
event_asset_impacts

event_hypotheses

watchlists
watchlist_items

alerts

cases
case_actions

field_inspections
inspection_observations
inspection_attachments

sensor_systems
sensors
sensor_observations

asset_criticality

analysis_profiles

model_registry
model_versions
ml_predictions
model_feedback

event_feature_snapshots
asset_feature_snapshots

forecast_runs
forecast_values

driver_features

notifications

audit_log
```

---

# 158. V3 package structure

```text
packages/python/

forudid_events/
  detection/
  clustering/
  association/
  evidence/
  lifecycle/

forudid_drivers/
  hydrology/
  geology/
  feature_engineering/
  attribution/

forudid_ml/
  datasets/
  validation/
  models/
  calibration/
  explainability/
  registry/

forudid_forecast/
  baselines/
  models/
  evaluation/

forudid_sensors/
  adapters/
  qc/
  sensorthings/

forudid_operations/
  cases/
  priority/
  inspections/
  recommendations/
  voi/
```

---

# 159. V3 frontend feature structure

```text
features/

events/

evidence/

operations/

cases/

inspections/

watchlists/

sensors/

drivers/

forecast/

models/

assistant/
```

Do not put V3 business logic into generic map components.

---

# 160. V3 Milestone 0 — Audit

Before implementation:

Maintainers must inspect V1/V2.

Produce:

```text
docs/v3/audit.md
```

Include:

```text
working modules

technical debt

schema inventory

API inventory

pipeline inventory

migration risks
```

Do not rewrite stable code.

---

# 161. Milestone 1 — Event Data Model

Implement:

```text
events

event observations

event revisions

evidence
```

with synthetic fixtures.

No ML yet.

---

# 162. Milestone 2 — Statistical Event Detector

Implement:

```text
robust trend-change baseline

seasonality handling

candidate generation

spatial clustering

event association
```

Synthetic tests first.

---

# 163. Milestone 3 — Event UI

Build:

```text
event map

event list

event dossier

timeline

evidence panel
```

Use fixture events.

---

# 164. Milestone 4 — Sentinel operational update

Connect current Sentinel product source/pipeline.

A new acquisition should update existing events rather than creating duplicate alerts.

---

# 165. Milestone 5 — NISAR Adapter

Implement NISAR search/import.

Record product maturity.

Do not perform sensor fusion yet.

Display NISAR as independent evidence.

---

# 166. Milestone 6 — Evidence Engine

Implement:

```text
evidence independence

support/contradiction

grade

history
```

Keep grade rules transparent.

---

# 167. Milestone 7 — V2 Exposure Integration

Event automatically links to:

```text
railways

roads

regions
```

through V2 exposure engine.

---

# 168. Milestone 8 — Case Management

Event can create case.

Build:

```text
case inbox

case detail

actions

assignment

status timeline
```

---

# 169. Milestone 9 — Field PWA

Offline:

```text
assigned cases

maps

inspection forms

photos

GPS

sync
```

This milestone is strategically important.

---

# 170. Milestone 10 — Outcome Feedback

Completed inspections become structured outcomes.

Build feedback dataset/export.

No model training yet.

---

# 171. Milestone 11 — Hybrid CPD Research

Reproduce benchmark:

```text
statistical detector

candidate DL detector
```

Compare:

```text
accuracy

latency

GNSS agreement where available
```

Only then enable hybrid production detector.

---

# 172. Milestone 12 — Driver Data

Ingest pilot:

```text
CHIRPS

ERA5-Land

GRACE

SoilGrids
```

for selected basin.

Build normalized driver features.

---

# 173. Milestone 13 — Driver Attribution

Start with:

```text
linear baseline

XGBoost/CatBoost

SHAP
```

Spatial CV mandatory.

Output:

```text
driver hypothesis
```

not causal fact.

---

# 174. Milestone 14 — Short Forecast Baselines

Implement:

```text
robust trend

state-space

Kalman
```

Benchmark.

No LSTM yet.

---

# 175. Milestone 15 — ML Forecast Challenger

Only if enough data.

Compare ML against baseline under rolling/spatial validation.

Promote only on meaningful improvement.

---

# 176. Milestone 16 — Priority Engine

First deterministic.

Inputs:

```text
event dynamics

exposure

evidence

criticality

inspection age
```

Explain every priority.

---

# 177. Milestone 17 — Learning Priority

When real inspection labels exist:

train challenger model for:

```text
inspection yield
```

Use:

```text
spatial/temporal CV

calibration

SHAP

shadow deployment
```

---

# 178. Milestone 18 — Measurement Priority

Implement heuristic:

```text
high consequence

high uncertainty

low corroboration

dynamic event
```

Rank candidate measurements/inspections.

---

# 179. Milestone 19 — Bayesian VoI Research

Only after calibrated uncertainty models.

Prototype on one corridor.

Compare with:

```text
inspect highest hazard first
```

Measure whether VoI strategy obtains better information per inspection.

---

# 180. Milestone 20 — AI Copilot

Only after deterministic APIs are mature.

Build:

```text
query DSL

tool registry

citation/evidence packet

Persian response

permission layer
```

No arbitrary SQL.

---

# 181. Milestone 21 — Critical Asset Twin Pilot

Choose ONE data-rich asset.

Example:

```text
bridge

tunnel

dam
```

Integrate:

```text
InSAR

GNSS/sensors

inspection

asset geometry
```

No national digital twin.

---

# 182. Milestone 22 — SensorThings Integration

Build standards adapter for external monitoring systems.

Support one real pilot sensor family first.

---

# 183. Milestone 23 — Aquifer Intelligence Pilot

Choose ONE aquifer with:

```text
good InSAR

well records

driver data

geology
```

Build:

```text
lag

seasonal response

long-term trend

driver hypothesis

scenario adapter
```

---

# 184. V3.0 MVP definition

V3.0 succeeds when:

1. new deformation observations update an event system.
2. pixels are no longer the main alert object.
3. event onset/evolution is tracked.
4. event geometry evolves through revisions.
5. evidence from multiple sources can be compared.
6. NISAR can be ingested as independent evidence.
7. product maturity is visible.
8. events connect to exposed assets.
9. event priority is transparent.
10. an event can open an operational case.
11. a case can request field inspection.
12. field inspection works offline.
13. inspection results return to FORUDID.
14. false positives/artifacts are retained as labels.
15. operations dashboard shows cases, not merely pixels.
16. all conclusions preserve provenance.
17. no output claims structural failure.
18. no AI model can bypass scientific QC.
19. source/evidence conflict remains visible.
20. the feedback loop is operational.

---

# 185. V3.1 success

V3.1 adds:

```text
hybrid change detection

hydrological context

short-horizon forecast

driver hypotheses

learning priority model
```

only after real outcome labels exist.

---

# 186. V3.2 success

V3.2 adds:

```text
measurement planning

value-of-information

selected critical asset twin

sensor fusion

aquifer scenario support
```

---

# 187. V3 Non-goals

Do NOT build by default:

```text
nationwide structural digital twin

catastrophic failure prediction

earthquake prediction

unvalidated structural risk score

AI-generated scientific measurements

black-box national risk map

multi-year deterministic forecasts

autonomous engineering decisions

nationwide IoT sensor deployment

Kafka architecture without need

federated learning without real partners

foundation models everywhere
```

---

# 188. Hard AI rule

Before adding AI ask:

```text
What exact decision improves?

What baseline does AI beat?

What independent labels exist?

How will uncertainty be measured?

Can the result be explained?

What happens when the model fails?
```

If these questions cannot be answered:

do not deploy the model.

---

# 189. Product differentiation rule

Before adding a V3 feature ask:

```text
Can TRE / Sixense / SkyGeo already
provide essentially the same value?
```

If yes:

do not treat it as FORUDID's differentiator.

FORUDID differentiation should concentrate on:

```text
Iran-specific operational intelligence

open/provenance-first architecture

multi-source evidence grading

hydrogeologic context

field outcome feedback

inspection learning

measurement value-of-information

Persian-first operational AI

transparent scientific uncertainty
```

---

# 190. Strategic dataset

Protect and version:

```text
EVENT
   +
EVIDENCE
   +
ASSET
   +
PRIORITY
   +
INSPECTION
   +
ACTION
   +
OUTCOME
```

This graph is more strategically valuable than another nationwide raster.

---

# 191. Pilot strategy

Do not begin V3 over all Iran.

Pilot:

```text
one known deformation corridor

+
railway/road assets

+
current Sentinel observations

+
NISAR where available

+
small field-inspection workflow
```

Ideal pilot must generate real cases and real outcomes.

---

# 192. Pilot validation question

After several update cycles ask:

```text
Did FORUDID identify anything
that caused a human to inspect,
verify, reprioritize or understand
an asset better?
```

If not:

more AI and more layers will not solve the product problem.

---

# 193. Final V3 architecture principle

```text
Science produces observations.

Algorithms identify candidate events.

Evidence determines credibility.

Exposure determines relevance.

Operations determine action.

Field work produces outcomes.

Outcomes improve future decisions.
```

---

# 194. Final instruction to Maintainers

Do not build V3 in one generation.

For every milestone:

1. inspect existing architecture.
2. identify precise decision/user value.
3. write acceptance tests.
4. implement a minimal vertical slice.
5. run unit/integration/spatial tests.
6. verify scientific assumptions.
7. store provenance.
8. document limitations.
9. avoid hidden thresholds.
10. update ADRs.
11. report new dependencies.
12. report unresolved scientific questions.

If a feature involves ML:

also report:

```text
baseline

training labels

validation scheme

uncertainty/calibration

model limitations

fallback
```

If a feature involves an alert:

also report:

```text
observation

event evidence

asset exposure

triggering policy

cooldown/persistence

human action expected
```

If a feature involves an engineering claim:

stop implementation unless its scientific/engineering basis is explicitly defined and reviewed.

---

# 195. FORUDID V3 North Star

FORUDID V3 should not win because it has the prettiest subsidence map.

It should win because, when the ground begins behaving differently, it can tell an organization:

> something changed here;

> this is the evidence;

> these assets are affected;

> this is how certain we are;

> these are the places worth checking first;

> this is what the field team found;

> and this new evidence has now improved what the system will look for next time.

That is FORUDID V3.
