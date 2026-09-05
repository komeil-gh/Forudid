# V2 source registry — implementation evidence

Date: 2026-09-05. Scope: V2 milestone 2 and acquisition for milestone 3.
V2 must finish before V3; product results must use real source data. Synthetic
inputs remain confined to software/science tests. V2 MVP is not yet complete.

## Real input

Official source: https://zenodo.org/records/10815578, version 1.0.0,
DOI 10.5281/zenodo.10815578, CC BY 4.0. All three TIFF files were downloaded,
matched against the published MD5 and archived privately with SHA-256 verification.
The immutable manifest hashes the file list, exact URLs, lengths and checksums.

| Role | Bytes | SHA-256 |
| --- | ---: | --- |
| Annual rate | 38,571,343 | `43ee966f7f2d4e047cf982c1097319f03eba93a276668cb6712e1064812589df` |
| Seasonal peak-to-peak amplitude | 34,749,648 | `ebf7341205130aea5ff6f81fdedae00af3cb675ff8112ecfa8e22eb1d55e49c1` |
| Subsidence mask | 1,559,304 | `9304808535fe694ccc76fa3dc968d8119f54d74814a8ad15f9ace5b42e88afc9` |

Manifest SHA-256: `bdcdcbdab22ba8a06ede98b180ac56b7341a5fbb5ecf50033fdb4078c917c1f3`.
Local registered version UUID: `a4f8d6d4-dbd8-5471-8c71-b7edefb72df7`.
No product publication is implied by source registration.

## Native raster inspection

All three grids are 24,060 × 17,945, EPSG:4326, with an approximately
0.00083333 degree pixel spacing; nominal 100 m is not an exact metre grid.
Rate and amplitude are Float32, scale 1, offset 0, NoData -999.
TIFF `UNITS` tags specify `cm/year` and `cm`, respectively. The mask is UInt8,
values 0–1 according to provider statistics, with no declared NoData value.
Provider statistics report only about 1.817% valid pixels in the rate raster's
rectangular extent. This is not coverage of Iran's administrative area and must
not turn missing rate pixels into stable ground or zero velocity.

The file metadata and original paper describe descending LOS projected to
vertical under negligible horizontal deformation. The amplitude is explicitly
peak-to-peak. The paper uses a spatially varying reference/correction surface;
do not invent a single reference point or an exact first/last observation date.
Paper consulted from the authors' repository:
https://www.ipi.uni-hannover.de/fileadmin/ipi/publications/2024/paper_motagh_2024.pdf

## Delivered behavior

- Forward migration `b902a76f12c1` adds two tables; V1 tables remain intact.
- Database uniqueness, SHA-256/size checks and an update/delete trigger protect
  immutable source versions. File sizes use BIGINT.
- CLI verifies every original before archiving or inserting. Conflicting
  snapshots fail closed. Downloaded files and existing objects are preserved.
- Three bounded GET endpoints provide source list/detail/version list with
  cursor pagination. Private storage URIs and arbitrary metadata are excluded.
- Generated OpenAPI/Orval contract and Persian RTL `/sources` page display
  actual registered records, license, attribution, years and file checksums.
- Byte and file uploads use one streaming integrity path with bounded buffers.

## Verification

PostGIS and MinIO were started only for this project after the user opened Docker.
Registry pagination, privacy, BIGINT and immutable update/delete checks passed
against PostgreSQL, with test rows rolled back. Acquisition corruption/conflict
checks passed. After correcting the shared streaming reader, the complete API
suite passed: 22 tests, including the 20 existing V1 checks.
Pyright and Ruff passed. Frontend typecheck and production build passed.
Desktop 1440 px and mobile 390 px registry checks passed with the real database:
three files, four checksums, no private URI, no page errors or horizontal overflow.
The native mobile navigation was then verified in a second successful run at both widths.
The registry import was repeated and returned the same version UUID. Alembic
reported no differences between the applied schema and the current models.

Real-source browser acceptance is opt-in so fixture-only CI does not pretend to
contain the official dataset:

```sh
FORUDID_REAL_SOURCE_TESTS=1 PLAYWRIGHT_CHANNEL=chrome pnpm --filter @forudid/web exec playwright test tests/sources.spec.ts
```

Remaining milestone-3 work: full raster/mask consistency checks, bounded-memory
COG normalization, source-aware product contracts, publication and map/point QA.
OSM, Martin, corridor exposure, population, reports and exports remain pending.
