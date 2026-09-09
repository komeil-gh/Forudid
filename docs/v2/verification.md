# V2 stage-zero verification

Date: 2026-09-05. This historical checkpoint changed documentation only, with no new runtime or migration. Independent frontend edits were present during the audit. Results describe each command's execution time and do not accept the final commit of those concurrent changes.

| Check | Result at this checkpoint |
| --- | --- |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed |
| `pnpm test` | 8 tests in 4 files passed |
| Ruff | Passed |
| Pyright | No errors or warnings |
| Selected pytest | 10 passed, 1 failed, 9 deselected |
| Build | Failed: TS2307 for the concurrently edited methodology module |
| Compose smoke | Blocked: Docker Desktop daemon unavailable |
| Full API/E2E suite | Not run without PostGIS/S3 |

## Pytest interpretation

Selection used `golden_cog or openapi or coordinate_validation or rejects_untrusted_options`. Unlike forbidden URL/path queries, `test_tile_rejects_untrusted_options[style=coherence-default]` needs a real product in PostGIS. The unavailable connection returned 503 instead of 422. This was a failure and was not replaced with a mock. OpenAPI synchronization, the synthetic COG and independent input checks passed within the same selection.

## Environment and scope

The read-only `docker --context desktop-linux compose ps` check could not connect to the daemon. A shared restart had not been authorized in the preceding turn and was not repeated during this audit. The user's active context remained unchanged. No development server or container was started for this stage.

During the build, concurrent dependency edits caused pnpm to install packages and encounter sandbox DNS restrictions. The retry process was stopped and lockfile dependencies restored with `pnpm install --frozen-lockfile`; no new V2 package was selected.

After recovery, the build failed with TS2307 in `src/app/router.tsx` and `src/routes/content.test.tsx`: `routes/methodology` was unavailable at that instant. The earlier successful typecheck did not establish correctness of the changed state. Concurrently owned content files were not replaced with older versions to force a passing check.

## Acceptance and continuation

The audit, nine ADRs, V2 master specification and README link were the documentation deliverables. At this checkpoint, all V2 migrations and runtime features remained unimplemented. Stage zero's complete execution gate remained open. Once PostGIS/S3 became available, the required next steps were baseline V1 and Compose/E2E verification, then stage 1 and the registry slice of stage 2. This record does not establish V2 MVP acceptance or scientific validation of a dataset or differential method. Later delivery evidence is recorded separately.
