# 0015 — Precomputed analysis with reproducible runs

Status: accepted architecture; implementation stages 6–11.

## Decision

Run analysis through `packages/python/forudid_analysis` and the CLI. Request handlers must not perform national computation. Create directories only when required. FastAPI reads stored, paginated results. No additional workflow engine or queue is required at this stage.

`analysis_runs` pins method version, deformation product and exact source versions. A unique signature derives from stable serialization of these inputs and parameters. A hash does not replace storing the parameters themselves. Changing a source requires a new run.

Sample lines at grid-dependent spacing. Compute chainage in a suitable metric CRS or geodesically. Coverage is valid length, not sample count. Contiguous intervals retain geometry and chainage; interpolation must not hide missing intervals.

## Acceptance

Use an analytical 10 × 10 km fixture with known length, boundaries, NoData and resolution. Define error tolerance from sampling and grid resolution. Execution must be idempotent, failures recoverable and publication explicit. Profile, summary and segments display the same analysis identity and provenance.
