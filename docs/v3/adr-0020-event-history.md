# 0020 — Preserve event history independently of publication

Status: accepted for the V3 event foundation, 2026-09-06.

V2 publishes immutable descriptive analyses. V3 must represent evolving phenomena
without changing old observations or turning an artifact label into lost history.
The event's lifecycle therefore does not determine its publication. Public reads
require explicit publication and eligible source products.

Use one current event row and append-only revision, observation and evidence rows.
The current revision is enforced by a deferred composite foreign key; PostgreSQL
triggers prevent silent history rewriting. Serialize updates by event key and
require an expected revision for a changed snapshot. Preserve raw acquisition IDs
alongside human-readable independence groups. Never grade evidence by counting
dataset names alone, and retain contradictory assertions.

Reuse SQLAlchemy, PostGIS, Pydantic, Shapely and PyProj. Do not introduce a graph
database, workflow engine or ML dependency for four related record types. Evidence
grading and operational priority require their own reviewed versioned profiles;
the initial service returns unknown grade and unavailable severity.

## Statistical and UI extensions

The first detector uses the existing NumPy/Rasterio/Shapely stack and explicit
profiles. No operational default thresholds, ML or evidence grades are inferred.
Continuity requires one unambiguous spatial/temporal/reference match; ambiguous
merges remain reviewable. See [method limits](statistical-detector.md).

The event dossier reuses MapCanvas with an optional polygon layer and disabled
point-inspection actions. Existing raster/infrastructure behavior remains the
default. Read-only pages have independent timeline, observation and evidence
queries; partial source failures do not hide the whole dossier. No new dependency
or organization mutation is introduced.
