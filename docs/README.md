# Documentation

[Project introduction and letter](../README.md) · [Local setup](operations/local-guide.md) · [Current coverage](operations/specification-coverage.md)

Start with the local guide to run the application. Use the coverage ledger for
what is implemented, accepted or still open. Specifications describe requirements;
dated acceptance records describe the evidence available at their checkpoint.
Technical documentation is maintained in English. The main README presents the
introduction and the author's letter in Persian and English.

<a id="getting-started"></a>

## 1. Getting started

| Document | Contents |
| --- | --- |
| [Local setup and implementation guide](operations/local-guide.md) | Docker and host setup, source acquisition, checks, data contracts and implementation context formerly in the main README. |
| [Command-line guide](v2/cli.md) | Data ingestion, analysis and report commands. |
| [Asset exploration](v2/asset-exploration.md) | Map selection, asset profiles and downloads. |
| [Reports](v2/reports.md) | Reproducible infrastructure and regional PDF reports. |
| [Event interface](v3/event-ui.md) | Event browsing and evidence boundaries. |
| [Railway inspection-planning pilot](v3/railway-pilot.md) | Real candidate segment, user task, baseline comparison and unmeasured decision outcomes. |

<a id="data-and-methods"></a>

## 2. Data and methods

| Document | Contents |
| --- | --- |
| [Methodology and interpretation](science/methodology-editorial.md) | Scientific claims, references and interpretation. |
| [Scientific publication boundary](science/validation.md) | Required validation and publication evidence. |
| [Source registry](v2/source-registry.md) | Provenance, source identity and immutable versions. |
| [Historical deformation products](v2/historical-products.md) | Nationwide historical source and product capabilities. |
| [Raster normalization](v2/raster-normalization.md) | Native pixels, grids, masks and COG verification. |
| [COMET Varamin](v2/comet-varamin.md) | Native LOS source, epochs, reference and limitations. |
| [Infrastructure snapshot](v2/osm-infrastructure.md) | Dated OSM railway and road inputs. |
| [Vector tiles](v2/vector-tiles.md) | Restricted Martin infrastructure tiles. |
| [Line exposure](v2/line-exposure.md) | Sampling, valid lengths, profiles and numerical bands. |
| [Population exposure](v2/population-exposure.md) | Versioned WorldPop models and population calculations. |
| [Administrative regions](v2/regions.md) | Historical boundaries and scoped analyses. |
| [Experimental gradient](v2/gradient-proxy.md) | Deformation-gradient proxy and limits. |
| [Payne research comparison](v2/payne-2025-research.md) | Published research reproduction and unresolved differences. |
| [Operational source discovery](v3/operational-source-discovery.md) | NISAR metadata discovery and measurement-ingestion gates. |
| [Statistical screening](v3/statistical-detector.md) | Experimental detector and validation limits. |

<a id="architecture-and-specifications"></a>

## 3. Architecture and specifications

| Document | Contents |
| --- | --- |
| [Platform architecture](architecture/overview.md) | Local services and system boundaries. |
| [Original specification](MASTER_SPEC.md) | V1 engineering requirements. |
| [V2 specification](v2/MASTER_SPEC.md) | Exposure analysis and decision-support requirements. |
| [V3 specification](v3/MASTER_SPEC.md) | Operations, evidence and action requirements. |
| [Event foundation](v3/event-foundation.md) | Append-only events, observations and evidence. |
| [OpenAPI contract](openapi.json) | Generated API schema. |

Architecture decisions are indexed individually so their rationale remains easy
to locate. Numbers retain the original V1/V2 sequences.

| Decision | Subject |
| --- | --- |
| [V1 · 0001](adr/0001-react-vite-over-next-svelte.md) | React and Vite |
| [V1 · 0002](adr/0002-fastapi-separate-backend.md) | Separate FastAPI backend |
| [V1 · 0003](adr/0003-maplibre-react-map-gl.md) | MapLibre and React |
| [V1 · 0004](adr/0004-titiler-mounted-in-api.md) | TiTiler in the API |
| [V1 · 0005](adr/0005-s3-compatible-storage.md) | S3-compatible storage |
| [V1 · 0006](adr/0006-stac-product-catalog.md) | STAC catalog |
| [V1 · 0007](adr/0007-hdf5-archive-zarr-publish.md) | Scientific archive and publication |
| [V1 · 0008](adr/0008-los-not-vertical.md) | LOS components and references |
| [V1 · 0009](adr/0009-no-workflow-engine-in-mvp.md) | CLI scope for the MVP |
| [V1 · 0010](adr/0010-localhost-first-development.md) | Localhost-first execution |
| [V2 · 0010](v2/adr/0010-v2-decision-support-pivot.md) | Exposure analysis as the V2 focus |
| [V2 · 0011](v2/adr/0011-data-source-registry.md) | Immutable source registry |
| [V2 · 0012](v2/adr/0012-osm-geofabrik-infrastructure.md) | Dated Geofabrik infrastructure |
| [V2 · 0013](v2/adr/0013-martin-vector-tiles.md) | Martin vector tiles |
| [V2 · 0014](v2/adr/0014-exposure-not-risk.md) | Exposure and structural-risk boundary |
| [V2 · 0015](v2/adr/0015-precompute-exposure.md) | Precomputed analyses |
| [V2 · 0016](v2/adr/0016-differential-hazard-feature-gate.md) | Differential-method acceptance gate |
| [V2 · 0017](v2/adr/0017-worldpop-population.md) | Versioned population source |
| [V2 · 0018](v2/adr/0018-building-footprints-optional.md) | Optional building footprints |
| [V3 · 0020](v3/adr-0020-event-history.md) | Event history and publication |

<a id="delivery-and-operations"></a>

## 4. Delivery and operations

| Document | Contents |
| --- | --- |
| [Specification coverage](operations/specification-coverage.md) | Requirement-by-requirement status and open evidence gates. |
| [Delivery status](operations/milestones.md) | Dated implementation and acceptance records. |
| [Public source release](operations/open-source-release.md) | Packaging, verification and publication boundary. |
| [Changelog](../CHANGELOG.md) | Release changes. |
| [V1 audit for V2](v2/audit.md) | Baseline audit before the V2 work. |
| [V2 stage-zero verification](v2/verification.md) | Historical checkpoint and outstanding gates at that time. |
| [V2 MVP acceptance](v2/acceptance.md) | Local acceptance evidence for the MVP. |
| [V3 entry audit](v3/audit.md) | Prerequisites and scope for V3. |

<a id="contribution-and-licensing"></a>

## 5. Contribution and licensing

| Document | Contents |
| --- | --- |
| [Contributing](../CONTRIBUTING.md) | Development, review and documentation conventions. |
| [Security](../SECURITY.md) | Supported review scope and private reporting. |
| [Apache 2.0](../LICENSE) | License for original code and documentation. |
| [Project notice](../NOTICE) | Copyright, attribution and trademark boundaries. |
| [Third-party notices](../THIRD_PARTY_NOTICES.md) | Included material and separately acquired dependencies. |
| [ODbL 1.0](../LICENSES/ODbL-1.0.txt) | Bundled OpenStreetMap-derived database terms. |
| [XB Zar font license](../apps/web/public/fonts/xb-zar/OFL.txt) | Retained SIL Open Font License and copyright. |

Local-only identity records are categorized separately from distributable
documentation: `docs/brand/FORUDID_SELECTED_LOGO.md` records the selected project
mark, and `apps/web/public/source-marks/README.md` records external artwork
provenance. Both paths are relative to the repository root and excluded from
the public source archive. Untracked brand studies remain local working material.
