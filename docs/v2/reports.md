# Persian infrastructure screening reports

Version `0.2.0-alpha.10` adds independent report jobs for published real line
analyses. `POST /api/v1/reports` accepts `analysis_run_id`, `asset_id` and initial
language `fa`. Unknown fields and unsupported languages are rejected. The API
validates the exact asset/run/product and queues a deterministic report identity;
it does not launch a browser or recompute exposure.

Repeated requests return the same job for identical inputs, application version,
template, renderer script and font hashes. A repeated request for a failed job
requeues it; completed artifacts remain unchanged. `GET /api/v1/reports/{id}`
returns status. Its `/download` returns 409 until completion, then streams PDF
with ETag equal to its SHA-256 and the analysis ID in a response header. Reads
recheck the underlying published product and nondeprecated analysis method.

Additive migration `f741b309dc82` stores report state separately from analysis
state. A worker uses the shared advisory lock and processes one job at a time.
Failures are retained as a report error and do not change the analysis. A stopped
processing job requires an explicit retry; it is not silently reclaimed while a
worker might still be active. Failed attempts retain any archived objects under
separate attempt IDs. Downgrade refuses to remove existing report records.

## Local operation

```sh
uv run --project apps/api python -m forudid_api.report_worker --watch
```

For one job, replace `--watch` with `--report REPORT_UUID`; add `--retry` only to
retry that named failed/interrupted job. Omitting both selects one queued job.
Stop the foreground worker when finished. It does not restart Docker or launch
other analysis workers. Browser processes use an isolated temporary profile and
are closed after rendering, including failure/timeout cleanup.

The local worker uses Node and the project's installed Playwright package with
Chrome/Chromium. `REPORT_CHROME_BINARY` may select a local executable. The API
image includes the small template/font resources for queue identity, but does not
bundle a rendering browser or Node; a containerized rendering worker has not yet
been accepted. No additional library was introduced for PDF generation.

## Content and reproducibility

The backend generates self-contained HTML with embedded OFL XB Zar and numerical
SVG figures. No interactive React screenshot, remote resource or report-supplied
URL is fetched. The rendering browser is offline, JavaScript is disabled, and
external strings are HTML-escaped. Persian text is RTL; Latin identifiers,
coordinates, source attribution and checksums have explicit directional handling.

The infrastructure report includes the real geometry, valid/missing lengths,
coverage, weighted rates, all archived exposure segments, source dates, licenses,
quality reasons, method/status, analysis/source IDs and the exact screening
disclaimer. It does not certify structural condition. Numerical velocity bands
are not hazard classes; missing data does not establish stable ground.

The longitudinal figure uses 600 display bins preserving min/max and marking any
NoData overlap. It does not interpolate gaps. Full samples remain available in the
analysis CSV. The report input is capped at 100 MiB; oversized input fails
explicitly. Maps preserve real segment geometry and are labelled as location
figures without a basemap or engineering scale.

PDF, original HTML and manifest are archived privately and immutably. The manifest
records their separate checksums, actual browser/Node/Playwright runtime and
generation time. Repeated downloads are byte-identical; a fresh rendering is not
claimed byte-identical across browser versions or PDF creation timestamps.

## Local acceptance, 2026-09-06

The real Tehran–Mashhad OSM pilot was rendered from full railway analysis
`f30d71aa-bda6-5098-b050-eed1f9657f0f`. The final browser-tested report is
`48753901-e7d9-57d8-a746-6aefddc9d24f`, PDF SHA-256
`fe64da38bed74c0486a45ea3c1f96279138eba43819a9792f0f7b7a2902a8ab5`.

- Real API/worker checks passed for input validation, idempotent queueing,
  controlled renderer failure, explicit retry, analysis availability, PDF
  integrity, immutable repeated download, source identity and HTML escaping.
- Both desktop and 390 px Chrome checks passed for request failure, retry,
  completed download and exact downloaded checksum, without document overflow.
- Four A4 pages were rendered and visually checked. Axis-label clipping and
  orphan attribution/disclaimer pages were corrected. The PDF is tagged, includes
  extractable Persian text and contains no JavaScript.
- TypeScript, ESLint, Ruff, Pyright and frontend build passed. Alembic check found
  no drift. This is local acceptance; a full container stack is still unverified.

Regional reports and remaining V2 acceptance are separate work. Scientific
angular-distortion validation remains open; these PDFs do not enable it.
