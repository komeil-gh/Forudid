# Third-party material and data

The root Apache-2.0 license applies to original FORUDID code and documentation.
It does not relicense third-party data, fonts, artwork, quoted passages or
dependencies. Scientific source versions and numerical methods retain their
recorded identity. This source release includes no measurement rasters, database
dumps, observation records, customer data or generated reports.

## Material included in the source archive

| Material | Terms and provenance |
| --- | --- |
| `apps/web/public/map/countries.geojson` | Natural Earth, public domain. Generalized and clipped for display. [Provider terms](https://www.naturalearthdata.com/about/terms-of-use/). |
| `apps/web/public/map/places.json` | © OpenStreetMap contributors, [ODbL 1.0](LICENSES/ODbL-1.0.txt). An editable city/town extract, with original identifiers, from Geofabrik's Iran snapshot dated 2026-09-04. Attribution: [OpenStreetMap copyright](https://www.openstreetmap.org/copyright). |
| `apps/web/public/fonts/xb-zar/` | XB Zar, SIL Open Font License 1.1; copyright and full terms are retained in [OFL.txt](apps/web/public/fonts/xb-zar/OFL.txt). |
| FORUDID artwork | Original project artwork. The Apache license does not grant trademark rights or endorsement. |

The map [manifest](apps/web/public/map/manifest.json) identifies source URLs,
checksums and transformations. [The reconstruction script](scripts/build_map_context.py)
and the complete editable JSON database are supplied. The OSM-derived database
remains under ODbL; its terms are separate from the application code.

## Separately acquired software

The lockfiles identify exact dependency versions. Dependencies are obtained from
their distributors, not bundled in the source archive. Retain their license and
copyright files when redistributing installed environments, compiled web assets
or container images. The source-archive review does not license such artifacts.
React, MapLibre, FastAPI, ECharts, fonts and other dependencies retain their
respective licenses. Fontsource packages include font licenses; preserve those
when distributing the built application. Container images, including MinIO,
PostGIS, Martin and browser runtimes, have separate license obligations.

## Material excluded from the public source archive

External provider and publisher logos in `apps/web/public/source-marks/` are
excluded because collection provenance alone does not establish redistribution
permission. The public build uses linked source names. A private installation
may enable `VITE_SOURCE_MARKS=true` only after obtaining the necessary artwork
and permission. Source acknowledgements remain visible in both modes.

Scientific downloads remain outside Git. Download availability does not grant
redistribution rights. Consult each exact source/version's license before
redistributing originals, derived tiles, exports or reports. In particular,
COMET Varamin redistribution remains unresolved; this release includes its
connector and provenance logic, not the provider's measurements. See the
[source-specific limitations](docs/v2/comet-varamin.md).
