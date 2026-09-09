# Specification coverage and remaining work

This is the current implementation ledger, not a replacement for the master
requirements. Historical MVP acceptance does not mean the full V1/V2/V3 product
is complete. The delivery order remains: close V2 gaps with real data before
advancing the remaining V3 operations workflows.

## Verified implementation — 2026-09-09

| Requirement area | Current evidence | Remaining limit |
| --- | --- | --- |
| V1 raster, native point, time series, reference and QC | Real COMET Varamin LOS COG and 323 epochs through 2026-07-31; every selected epoch compared with HDF5; real chart and URL checks on desktop/mobile | One ascending, unfiltered pilot; temporal coherence and pixel uncertainty were not supplied |
| V1 source storage and provenance | Immutable original HDF5, versioned COG/Zarr, chunk checksums and STAC | The importer accepts one pinned snapshot, not arbitrary HDF5 formats or an operational update schedule |
| V2 source registry and scientific semantics | Historical nationwide projected-vertical source, distinct COMET LOS source, source dates, methods and caveats | No validated harmonization or independently verified current nationwide deformation product |
| V2 population and region analysis | WorldPop 2026 R2025A, preserved 2020 results; new country and all 31 historical-region analyses; separate real COMET country/Tehran overlap; native population raster and point API | Modelled population, not a census; historical 2017 boundaries; current model year does not update the deformation observation period |
| V2 infrastructure | 2026-09-04 Geofabrik snapshot, real railways/major roads, Martin tiles, full-network historical exposure, profiles, intervals and exports | Raw OSM ways are not authoritative, complete engineering asset inventories or deduplicated routes |
| V2 map interaction | Registered source-area selection, Persian/English city search, coordinate parsing, true raster layers, source footprint navigation, point/asset selection and URL restoration | New source combinations need their own analyses; an absent analysis stays absent |
| V2 failure isolation | Population remains usable when the deformation catalog fails; tile retries preserve camera and point; connections released before raster reads | External provider outages and local storage limits still constrain availability |
| V2 descriptive reports | Preserved real Persian asset/region PDF workflow, pinned inputs and immutable download artifacts | No structural safety conclusion; host renderer rather than a verified containerized renderer |
| V2 reproducibility and documentation | Source/method/version identities preserved; maintained Markdown prose translated to English; language rule remains local and ignored by Git | Scientific approval is distinct from software tests and publication state |

Detailed evidence: [population](../v2/population-exposure.md),
[COMET](../v2/comet-varamin.md), [historical MVP acceptance](../v2/acceptance.md).

## Open V2 work and external evidence

1. Extend source acquisition beyond the one manually verified COMET snapshot,
   retaining each frame, acquisition list, variant and provider version. Confirm
   the snapshot's redistribution terms before a public deployment. Do not build
   an importer around undocumented portal visualization endpoints.
2. Prepare descriptive exposure runs for additional supported source/product
   combinations beyond the implemented COMET population pair. Preserve LOS sign and component; never reuse the nationwide
   projected-vertical analysis under a COMET identifier.
3. Implement the specified private/custom corridor import path and associated
   ownership controls. Arbitrary public file upload is not available.
4. Complete source comparison and later custom polygon workflows with explicit
   temporal/component/reference compatibility and bounded geometry processing.
5. Resolve the measured Payne reproduction discrepancy and obtain an independent
   review of methods, products, test corpus and tolerances before enabling
   validated differential-hazard classes. The existing gradient and angular
   distortion artifacts are experimental; regression agreement is not review.
6. Extend real end-to-end acceptance for new combinations and deployment targets.
   Optional buildings and hydrogeology require verified source coverage and
   their specified later-stage implementation; they are not present-day data.

## V3 remains incomplete

Existing event/revision/observation/evidence persistence, read APIs, event UI and
experimental detector primitives do not constitute the complete operations
platform. Remaining requirements include reviewed event detection and evidence
policies, source update orchestration, NISAR integration, organization identity
and access controls, private case management, offline field inspection and photo
sync, feedback datasets, driver data, evaluated forecasts, priority/measurement
policies, sensor interoperability and the evidence-bound assistant.

NISAR catalog discovery is not ingestion of a measurement product. A new COMET
source is not an independently validated event. No inspection, engineering
assessment, evidence grade, damage outcome or model evaluation is fabricated to
fill those gaps. Requirements that need real field observations, source access
or independent scientific review remain explicit evidence gates.
