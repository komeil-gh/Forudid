# Event and evidence foundation

Milestone 1 adds four tables: `deformation_events`, `event_revisions`,
`event_observations` and `event_evidence`. They preserve foreign keys to existing
products, source versions and processing runs. No V2 numerical implementation or
published input was changed. No new Python or frontend dependency is introduced.

An event has a lifecycle independent of `draft`/`published`/`withdrawn` visibility.
Only a published, nonfixture event with observations backed by published,
nonfixture products and processing runs is readable publicly. An empty real
event catalog is valid; the historical V2 mean-rate raster is not converted into
fabricated recent events. A rejected/artifact event is retained.

`append_revision` is an internal transaction function, not a public mutation API.
It validates WGS84 polygon geometry, aware timestamps, finite scalar metrics and
bounded parameters; locks by event key; accepts exact-input retries idempotently;
and requires the expected current revision for a changed event. Each update adds
a geometry/metric/provenance snapshot with actor, reason and input hash. A deferred
composite foreign key requires the event's current revision to exist. Database
triggers reject event deletion, unversioned updates and edits/deletion of history.
The caller owns the transaction. Event areas are WGS84 ellipsoid areas, in m²;
normalized event velocities are mm/year. Missing metrics remain null.

First detection time is when the system first detected the event. Observation
time is the acquisition/measurement time; historical processing can occur years
later. The model deliberately does not require detection before observation.
Estimated onset, when known, cannot follow the last observation. Observations
separately preserve interval start/end and availability time, component,
measurement method, source maturity, quality and raw acquisition IDs. Measurement
units, reference geometry and uncertainties must be declared by a later real
source adapter before numerical ingestion; this slice generates none of them.

Evidence preserves source version, observation identity, support/contradiction,
independence group and an optional superseded evidence link. The same acquisition
can yield two processing results, but its raw lineage is retained for the later
independence engine. This slice does not count sources to assign a grade. The
revision service leaves grade `U`, scientific status `experimental` and screening
severity unavailable until a reviewed versioned policy is implemented. Conflicting
evidence is returned independently. A single assertion cannot simultaneously
support and contradict; separate assertions retain both positions.

Read contracts use bounded pagination:

- `GET /api/v1/events` and `GET /api/v1/events/{id}`
- `GET /api/v1/events/{id}/timeline`
- `GET /api/v1/events/{id}/observations`
- `GET /api/v1/events/{id}/evidence`

The public timeline excludes actor identifiers. Internal evidence metadata and
object storage locations are not part of the evidence response. Private case,
inspection and publication mutations remain unavailable pending organization
authentication and audit controls. No ML detector, alert or priority policy runs.

## Acceptance

The transaction-isolated PostGIS test exercises initial/repeated/changed revisions,
stale update rejection, preserved prior state, append-only history, event deletion
rejection, hidden drafts, published reads, raw lineage/maturity, separate supporting
and contradictory evidence, and retained withdrawn artifacts. All test rows are
rolled back and never exposed by the running external API. Ruff and Pyright pass;
Alembic reports no schema drift. A dedicated temporary database with PostGIS
passed upgrade to head, downgrade to the V2 head, upgrade to head, and schema check;
the temporary database was removed afterward. There are no real operational events
or real detector acceptance claims in this milestone. Six focused event/source/
historical-product/exposure integration checks passed; generated OpenAPI and the
TypeScript client compile together.
