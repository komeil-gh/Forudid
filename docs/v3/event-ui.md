# Event read interface

Version `0.3.0-alpha.3` adds `/events` and `/events/{event_id}`. The catalog reads
only the public event API. The real catalog currently contains no operational
events. Its empty state explains why a historical mean-rate raster does not
establish a recent change, and links to the available source registry.

The dossier displays current polygon geometry, lifecycle, evidence grade,
measurement component, observation/detection dates, area and nullable rate. The
map reuses the existing MapCanvas; point inspection is disabled in the dossier.
No hazard colours, automatic classifications or fabricated values are added.

Timeline, observations and evidence have separate requests and bounded pagination.
A failed evidence request leaves geometry, observations and history readable and
can be retried independently. Revisions retain reason, processing-run identity
and input checksum. Observations distinguish acquisition interval from availability,
show raw acquisition IDs and provider maturity, and retain missing metrics.
Contradictory evidence and shared independence groups remain visible.

Persian/RTL and English use the existing language switch. Dates follow the selected
locale; source identifiers remain directionally isolated and wrap on narrow screens.
All reads remain public-data reads. Cases, field submissions, publication changes
and organization access controls are not part of this milestone.

## Acceptance evidence

The real empty catalog passed on desktop and 390px mobile. Two browser-only
contract tests then passed for a dossier with unavailable rates, insufficient
evidence, provisional maturity, raw lineage, a recoverable evidence error,
contradiction, timeline pagination and English language switching. No rows were
inserted into the database. The first test-response version treated the string
`after=0` as truthy; correcting the fixture to compare its numeric value restored
the intended two-page test. Product pagination did not require a fix.

Mobile screenshot was visually reviewed: shaped Persian text, polygon and controls,
stacked panels, missing-data labels, and wrapped identifiers are readable with no
horizontal overflow. The dossier screenshot is explicitly a UI test, not a real
event or scientific result.

The rebuilt API, initializer and web images started successfully with the applied
V3 migration. Alembic inside the API container reports no schema drift. The final
built-stack browser run passed all eight selected tests in 28.5 seconds: event
empty state/dossier and real V2 asset ranking, CSV download, selected segment,
profile marker and NoData preservation on desktop/mobile. All fourteen existing
frontend unit checks, ESLint and the TypeScript/build step also passed.
The earlier stale V2 initializer failed when asked to recognize the V3 migration;
rebuilding it from current code resolved that mismatch without changing V2 data.

Build identities: API `fe717f95f7f53f83028b6443b42c0c139ec659014b3ea4fd034992b6f7293a4c`,
initializer `5178bda9a8c408a16705e8ff9235432a8dadc67b44849a076cae8e1f9f824723`,
web `d23aed2e805c661a7eb3388f371e1006ca9d097b07d4ecb85a9a913b6ce9a270`.


## Remaining acceptance boundary

No new operational observation has been ingested into an event. Statistical
primitives require real time-series provenance and reviewed profiles before any
candidate can be scientifically accepted. The interface does not manufacture an
example event to fill an empty map. The dossier shows the selected event geometry;
a country-wide multi-event tile service is not yet implemented.
