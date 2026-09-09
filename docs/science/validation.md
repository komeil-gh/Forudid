# Scientific publication boundary

The historical Haghighi–Motagh product covers 2014–2020. It estimates vertical
motion assuming negligible horizontal motion; it is not ascending/descending
decomposition. The provider supplies neither pixel uncertainty nor pixel time
series. The backend reports `quality=caution`. Every normalized base pixel has
been compared with the original, but independent FORUDID scientific validation
has not been performed. Scientific thresholds are not defined in the frontend.

Public endpoints hide products with `is_fixture=true` by default. Fixtures are
software tests only. See [historical products](../v2/historical-products.md) for
source versions and interpretation limits. WorldPop 2026 is a modelled population
estimate/projection, not a new deformation observation or a 2026 census.

## Independent Sentinel-1 processing in V1

`pipeline/profiles/varamin-desc-20x4-v1.json` deliberately leaves unverified fields
null: real track, temporal/perpendicular baselines, minimum network degree,
coherence, observation count and uncertainty cutoff. Track 071 is a fixture value.

Before real processing:

1. Verify the approximately 50 × 50 km Varamin geometry and burst coverage.
2. Discover real descending acquisitions with compatible polarization and track.
3. Establish the time range and profile thresholds from scientific evidence.
4. Configure Earthdata/HyP3 access securely outside the repository.
5. Record the separate Conda/Mamba scientific environment, versions and container digest.
6. Generate machine-readable and human-readable QC; stop the run at `validation_required`.
7. Record manual scientific approval with reviewer, time and evidence before publication.

The seed command does not modify scientific runs. There is no public processing
or publication endpoint. Independent vertical processing and decomposition have
not been produced in this V1 path. V2 registers researchers' published outputs
and normalizes them without changing base pixels.

Fixture provenance explicitly records `scientifically_validated=false` and a null
container digest when unavailable. This is not sufficient for scientific-product
acceptance. The fixture generator is checksummed and archived under its immutable
run. Numerical software verification is distinct from independent scientific
validation, operational event evidence, and structural safety assessment.
