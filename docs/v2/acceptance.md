# V2 MVP local acceptance — 2026-09-06

This is the dated V2 MVP acceptance record, not completion of every master requirement. See [population updates](population-exposure.md) for the subsequent 2026 source and map verification.

The V2 MVP in master-specification section 160 is locally accepted. This is a
software and descriptive-exposure release, not independent scientific approval
of a structural hazard model. The real-data path was tested on the built Compose
web/API/Martin stack through Caddy at localhost. The PDF renderer ran separately
on the host, with one foreground worker. No public deployment was performed.

## Requirement evidence

| Section 160 criteria | Implemented evidence |
| --- | --- |
| 1–2: nationwide historical source and provenance | Three original Haghighi–Motagh rasters, immutable source version, unchanged COG pixels, STAC, sources/quality UI |
| 3–4: infrastructure and MVT | 12,722 railway and 120,393 major-road OSM ways; restricted Martin views and real vector-tile selection |
| 5–9: selection, profile, coverage, intervals and clicks | Published full-network runs; geodesic profile; explicit NoData; archived real segment geometry; URL-restored segment and profile selection |
| 10–12: period, quality and descriptive exposure | 2014–2020 period, vertical-projection assumption, source quality reasons, unavailable uncertainty, numerical velocity bands without hazard labels |
| 13: regional population | WorldPop 2020 counts, conservative allocation, country plus all 31 historical regions, explicit footprint and boundary limitations |
| 14: reports | Independent asset/region jobs, actual Persian PDFs, pinned inputs, failure isolation, immutable PDF/HTML/manifest and checksum-verified downloads |
| 15–16: no structural-risk mislabeling and auditable method | Method/source/runtime hashes, experimental scientific status, unavailable hazard output, documented research discrepancies |
| 17–18: shareable views and Persian RTL | Product/run/asset/interval/mode/region URL state; desktop and 390 px browser checks; Persian PDF rendering review |
| 19: geospatial tests | Zero/NoData, line chainage, weighted quantiles, Gaussian bowl, shifted-grid population conservation, real PostGIS clipping and research-file comparison |
| 20: useful pilot | Tehran–Mashhad way 963780743 shows valid/missing lengths, five actual intervals, profile values and period/quality/source identities beyond a raster-only view |

The local command line covers source acquisition/registration, asset/network/
population/region analyses and asset/region reports; see [CLI](cli.md).
The preserved research artifacts and unresolved assumptions are documented in
[gradient proxy](gradient-proxy.md) and [Payne comparison](payne-2025-research.md).
Independent validation is not a section-160 MVP prerequisite. These methods stay
experimental; no threshold-based structural hazard publication was enabled.

## Verification record

- 46 Python API/integration/numerical tests passed in 66.83 seconds against local
  PostGIS and object storage. This includes real source, OSM, Martin, exposure,
  ranking, regional clipping, population, research, CLI and PDF tests. The
  unchanged full-COG pixel comparison was excluded from this final run because
  it had already passed; see [normalization](raster-normalization.md).
- 14 frontend unit tests passed. Ruff, Pyright, ESLint, TypeScript, OpenAPI/Orval
  generation and frontend production build passed.
- API, initializer and frontend images built. The first full-stack attempt
  exposed missing `libexpat.so.1` from PyOsmium. The image now installs the small
  `libexpat1` runtime; [PyOsmium dependencies](https://docs.osmcode.org/pyosmium/latest/)
  also identify Expat. Rebuilt images initialized successfully and all six
  persistent Compose services became healthy; readiness through Caddy returned OK.
- Alembic check inside the running API container found no schema drift.
- The complete browser run had 28 passing cases and four stale-selector failures:
  the removed legacy copy button and a single-source assumption. After updating
  those selectors, all four targeted cases passed in 15.5 seconds. All 32 cases
  are therefore covered on the same built product; no application behavior was
  changed by the selector fix.
- Report paths, real vector tiles, raster sampling, asset/segment deep links,
  population and source provenance were exercised in desktop and mobile Chrome.
  Original PDF and browser evidence are local artifacts, not committed datasets.

## Deliberate limits

The current source is historical and has no pixel time series or uncertainty.
No current deformation alerts can be inferred from its static rate. OSM is a
dated, incomplete raw-way snapshot; boundaries represent 2017; population is a
2020 model. Estimates do not measure present-day population or structural safety.
Full-network totals are not deduplicated routes. Scientific review, containerized
PDF rendering, remote CI execution and optional V2.1 buildings are not claimed.
Large frontend chunks remain a measured build warning. This acceptance retains
these limits as prerequisites for appropriate V3 use, rather than inventing data.
