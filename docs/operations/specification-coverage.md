# Specification coverage

This ledger maps the master specifications to implemented behavior, dated
acceptance evidence and explicit evidence gates. It does not turn a future
requirement into completed work and does not treat a software test as scientific
validation.

## Delivery decision — 2026-09-10

The current unveiling target is local. The alpha.6 implementation and acceptance
record is in [delivery status](milestones.md#local-unveiling-preparation--2026-09-10).
It closes concrete navigation, date, responsive-layout, publication-visibility
and report-queue defects. It does not complete the open V3 milestones below.

- The V2 MVP definition in [V2 section 160](../v2/MASTER_SPEC.md#160-v2-mvp-definition)
  is complete. It was accepted locally and released as `v0.2.0`.
- WorldPop 2026 and the COMET Varamin pilot were delivered after V2 acceptance.
  They improve population freshness and temporal inspection without changing the
  historical nationwide deformation period.
- Private asset uploads, multi-source comparison, buildings, hydrogeology and
  automatic source updates are V2.1/V3 candidates in
  [V2 section 163](../v2/MASTER_SPEC.md#163-v21--v3-candidates). They are not
  missing V2 MVP acceptance criteria.
- V3 milestones 0, 1 and the read-only part of 3 are accepted. The statistical
  detector is an experimental primitive, and milestones that require operational
  observations, reviewed policies, organization data or field outcomes remain
  open.

## V2 MVP acceptance matrix

The detailed dated record is [V2 MVP local acceptance](../v2/acceptance.md). The
table below covers every criterion in master-specification section 160.

| Criteria | Status | Evidence and boundary |
| --- | --- | --- |
| 1–2. Historical nationwide source and visible provenance | Complete | The versioned 2014–2020 Haghighi–Motagh source preserves original files, checksums, COG pixels, STAC metadata, citation, method, component and limitations. |
| 3–4. Railway, major roads and MVT | Complete | The 2026-09-04 Geofabrik snapshot contains 12,722 railway and 120,393 major-road ways. Restricted Martin views serve the network; the browser does not load a national GeoJSON. |
| 5–9. Selection, profile, coverage and clickable intervals | Complete | Real full-network analyses preserve geodesic chainage, valid and NoData lengths, immutable profiles and segment geometry. Asset and interval state survives a shared URL and reload. |
| 10–12. Period, quality and descriptive exposure | Complete | The UI and exports show the 2014–2020 period, projected-vertical method, missing uncertainty and numerical velocity bands. They do not call the result structural risk. |
| 13. Population exposure | Complete | WorldPop 2020 remains reproducible; WorldPop 2026 R2025A v1 adds country and all 31 historical-region results plus separately identified COMET overlap runs. Conservation and native-cell checks passed. |
| 14. Reports | Complete | Asset and region jobs pin source, product, analysis and population versions; real Persian PDFs and immutable manifests passed generation, failure and recovery checks. |
| 15–16. Terminology and method auditability | Complete | Source, method, runtime and output hashes are retained. Differential methods remain experimental and hazard output remains unavailable. |
| 17–18. Shareable views and Persian RTL | Complete | Product, run, asset, interval, mode and region state is addressable. Desktop and 390 px Persian/English browser checks passed. Persian UI dates are Jalali with Persian digits; English UI dates are Gregorian. |
| 19. Geospatial calculations | Complete | Tests cover zero versus NoData, chainage, weighted statistics, raster preservation, population conservation, PostGIS clipping and research-file comparison. |
| 20. Information beyond a colored raster | Complete | A real railway can be inspected as exact valid/missing lengths, sampled profile, exposed intervals, source period, source identity and quality limits. |

The release remains a descriptive exposure and decision-support product. It does
not establish infrastructure condition, failure probability or structural safety.

## Delivered data extensions after V2 acceptance

| Area | Current evidence | Limit retained |
| --- | --- | --- |
| Population | WorldPop 2026 R2025A v1, exact source identity, unchanged native values, lossless COG conversion, Iran and 31 historical regions; 2020 remains independently selectable | Modelled population rather than a census; 2017 boundaries; the population year does not update the deformation period |
| COMET Varamin | Official ascending-frame HDF5 snapshot, native LOS rate, 323 actual epochs through 2026-07-31, immutable HDF5/COG/Zarr and selected-epoch equality checks; provider headers rechecked on 2026-09-10 still match the archived 513,816,102-byte version last modified on 2026-08-13 | One manually acquired, unfiltered pilot; no supplied pixel uncertainty or temporal coherence; no documented operational update schedule |
| Cross-product exposure | Separate COMET/WorldPop 2026 country and Tehran analyses with LOS sign and component retained | Population exposure is descriptive; no COMET infrastructure analysis has been published |
| Map | True raster layers, source footprints, local Persian/English place search, coordinate parsing, native point inspection, failure recovery and URL restoration | A missing product/analysis combination remains unavailable rather than borrowing another product's result |

Detailed evidence is in [population exposure](../v2/population-exposure.md),
[COMET Varamin](../v2/comet-varamin.md),
[native-grid line exposure](../v2/line-exposure.md),
[regions](../v2/regions.md), [vector tiles](../v2/vector-tiles.md) and
[reports](../v2/reports.md).

## V2.1 and scientific gates

These items are deliberately outside the accepted V2 MVP. They may be scheduled
only when their input and decision value exist.

| Candidate | State | Gate before implementation or publication |
| --- | --- | --- |
| Additional COMET/source versions | One pinned snapshot is implemented | Use a documented acquisition mechanism; retain frame, acquisition list, variant, provider version and immutable original; confirm redistribution terms before public distribution |
| Additional source/product exposure pairs | Historical road/rail and WorldPop pairs plus COMET/WorldPop 2026 exist | Compute each pair from its own product and preserve component, sign, period and reference; never reuse a historical run under a newer identifier |
| Private corridor import | Admin/CLI-only import is allowed by V2 section 24 but is not implemented | A real owner and corridor, authentication, organization scope, ownership checks, audit history and bounded geometry processing |
| Multi-source comparison | Source switching exists; harmonized comparison does not | Explicit temporal, component, viewing-geometry and reference compatibility; incompatible values remain separate |
| Differential hazard | Gradient and Payne-style artifacts are experimental | Resolve the measured reproduction discrepancy and obtain independent review of the method, corpus, products and tolerances before any validated class |
| Buildings, hydrogeology and GNSS | Not implemented as present-day coverage | Verified source coverage, exact license/version, a bounded pilot and a documented scientific method |

## V3 milestone coverage

The sequence follows [V3 sections 160–183](../v3/MASTER_SPEC.md#160-v3-milestone-0--audit).
“Partial” means code exists but the milestone acceptance boundary has not been met.

| Milestone | Status | Evidence or remaining gate |
| --- | --- | --- |
| 0. Audit | Complete | [V3 entry audit](../v3/audit.md) records the inherited architecture, real schema, pipelines, debt and preservation rules. |
| 1. Event data model | Complete | Append-only event revisions, observations and evidence persist real foreign keys; published read APIs preserve lineage, contradiction and withdrawal. See [event foundation](../v3/event-foundation.md). |
| 2. Statistical event detector | Partial | Deterministic temporal screening, seasonal handling, geometry and association primitives have numerical tests. No operational thresholds, calibrated probabilities or real event publication are accepted. See [statistical detector](../v3/statistical-detector.md). |
| 3. Event UI | Partial | Empty-state and contract-backed event list/dossier, evolution, observation and evidence panels work bilingually and survive partial request failure. A real published event is unavailable until a reviewed observation pipeline exists. See [event UI](../v3/event-ui.md). |
| 4. Sentinel operational update | Open | The COMET snapshot proves one real recent time series, not scheduled Sentinel acquisition, retry, lineage and repeat-cycle processing. |
| 5. NISAR adapter | Discovery only | Official catalog metadata and provisional coverage discovery are documented; no measurement product is ingested. See [operational source discovery](../v3/operational-source-discovery.md). |
| 6. Evidence engine | Partial | Evidence records preserve sources, independence groups and contradictions. Reviewed grade profiles, reconciliation rules and maturity propagation are absent. |
| 7. V2 exposure integration | Open | V2 exposure remains queryable, but no real event-to-exposure record or accepted impact workflow exists. |
| 8. Case management | Open | Requires organization identity, roles, audit records and ownership enforcement before private mutation APIs. |
| 9. Field PWA | Open | Requires a real field workflow, authenticated case scope, offline conflict rules and private photo storage. |
| 10. Outcome feedback | Open | Requires real inspections and reviewed outcome taxonomy; outcomes are never synthesized. |
| 11. Hybrid CPD research | Research only | Baseline detector primitives exist; no labelled temporal corpus or leakage-safe benchmark exists. |
| 12. Driver data | Open | Requires versioned real groundwater, rainfall, ERA5-Land and geology adapters for the selected pilot. |
| 13. Driver attribution | Open | Requires reviewed lag windows, counter-evidence and an explainable baseline over real driver data. |
| 14. Short forecast baselines | Open | Requires repeated observations, temporal holdouts, calibrated uncertainty and a decision-linked baseline. |
| 15. ML forecast challenger | Open | Requires milestone 14 and measurable improvement; no model or performance claim exists. |
| 16. Priority engine | Open | Requires reviewed policy, evidence profile, asset criticality and explicit human action; no hidden score is allowed. |
| 17. Learning priority | Open | Requires field outcomes and an evaluated baseline. |
| 18. Measurement priority | Open | Requires explicit measurement costs, feasible actions and evidence-gap policy for a real organization. |
| 19. Bayesian VoI research | Open | Requires calibrated priors and likelihoods from real evidence and outcomes. |
| 20. AI copilot | Open | Requires a permission model and evidence-bound query/output contract; no unsupported claim or action may be generated. |
| 21. Critical asset twin pilot | Open | Requires a nominated asset owner, reviewed geometry and sensor/inspection history. |
| 22. SensorThings integration | Open | Requires a real endpoint, sensor identity, units, QC and private/public access decisions. |
| 23. Aquifer intelligence pilot | Open | Requires verified hydrogeologic sources, domain review and a bounded pilot; elastic/inelastic labels cannot be inferred from InSAR alone. |

## V3.0 closure order

The next accepted vertical slice is milestone 4: one repeatable operational
Sentinel update with immutable acquisitions, explicit failure recovery and no
fabricated event. Milestones 5–7 then add independent NISAR evidence, reviewed
evidence rules and event-linked V2 exposure. Organization identity and audit
controls precede private cases and field workflows. Forecasting, priority, VoI,
sensor, twin and assistant milestones remain downstream of real observations and
field outcomes.

The V3.0 MVP is not complete. Empty event, case, inspection, sensor, model and
outcome datasets are truthful system states. They must not be filled with fixtures
outside transaction-isolated software tests.
