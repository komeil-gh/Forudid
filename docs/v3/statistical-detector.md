# Statistical screening baseline

`forudid_analysis.events` implements experimental numerical primitives for V3
milestone 2. It does not ingest observations, publish events or activate alerts.
Every call requires explicit versioned parameters; numerical test values are not
operational thresholds. Historical V2 mean-rate rasters cannot be passed off as
new temporal observations.

## Temporal method

`robust-harmonic-window-1` compares two adjacent trailing time windows. Each fit
contains an intercept, linear trend and sine/cosine at the declared seasonal
period. Huber iteratively reweighted least squares uses NumPy already installed.
Residual scale is median absolute deviation with normal-consistency factor
1.482602218505602 and an explicit input noise floor. The algorithm permits at most
60 iterations; unresolved or poorly conditioned fits produce no candidate.
[Statsmodels robust-model documentation](https://www.statsmodels.org/stable/rlm.html)
describes the statistical family; this implementation adds no Statsmodels dependency.

Inputs are days from one common epoch and displacement in mm, with separate
availability days and an as-of cutoff. The caller must establish one component,
spatial reference, reference epoch and sign convention from a real source adapter.
Availability cannot precede observation. Future releases are excluded, missing
values are not interpolated, and infinity, duplicate/nonmonotonic dates, stale
series and excessive gaps are rejected or marked as insufficient support.

Each window must span at least a declared seasonal cycle and meet observation
count and span requirements. The output preserves both slopes, their difference,
data support, profile/hash, method version and as-of date. Its dimensionless
screening ratio divides absolute slope difference by the sum of residual scales
converted to rates over their respective spans. This is not a p-value, standard
error, probability, evidence grade or calibrated confidence. The candidate day is
the first supported day in the recent window, not an exact inferred onset.
The method does not claim to implement STPD or locate a within-window change point.

## Geometry and association

`connected-four-1` uses Rasterio connected components on a boolean, north-up WGS84
tile of at most one million cells. Explicit minimum pixel support removes isolated
candidates; polygon areas use the WGS84 ellipsoid. Edge-touching components are
marked: tiles must be reconciled before treating these as complete event footprints.
Cross-tile merging and country-wide scanning are not implemented in this slice.

`continuity-gates-1` compares at most 1000 spatially prefiltered existing events.
Versioned gates require compatible component/reference, finite velocity, temporal
continuity, ellipsoid-area intersection-over-union, geodesic centroid distance and
velocity similarity. A unique match returns the existing identity. Multiple
matches return `ambiguous` with all candidates, preserving split/merge ambiguity;
no arbitrary winner or duplicate alert is emitted. Missing velocity provides no
match. Association itself has no persistence or publication side effects.

## Verification and acceptance limits

Two numerical checks cover seasonal trend, a sustained slope change, isolated
outlier, missing observations, unavailable future releases, invalid support,
four-connected spatial support, continuity, incompatible reference/component,
missing velocity, touching polygons and ambiguous merges. Ruff and Pyright are
required for this module. Inputs exist only in tests and are not product data.

These primitives are a tested foundation, not acceptance of an operational
detector. Real labelled time series, reviewed regional parameters, persistence,
spatial stability and an observation-to-revision worker remain necessary. No ML,
scientific validation claim or automatic escalation is introduced.
