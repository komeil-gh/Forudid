# Historical asset exploration and exports

The `/assets` page reads published bulk line analyses, with an allowlisted metric
sort, stable asset-ID tie breaking, 20-row pages, bounded literal name/OSM search
and a minimum valid-coverage filter. The API caps pages at 100 rows. Null values
sort last in both directions. An incomplete or deprecated analysis is not listed.
Numeric rates and coverage order the list; there is no composite risk score.

Each row opens `/assets/{id}` with product and analysis IDs in the URL. The page
shows the real OSM geometry, historical-source limitations, archived profile,
keyboard-accessible samples and a map marker. The selected geometry is fitted
to the viewport. Source registry, licenses and processing IDs remain accessible.

## Export contracts

- Current-page summary CSV contains exactly the filtered rows shown, metric units,
  product and analysis IDs, and an interpretation note. External strings have CSV
  escaping and formula-prefix protection. Null and numeric zero remain distinct.
- `GET /api/v1/analyses/{run}/assets/{asset}/download` streams the immutable complete
  JSON artifact; its ETag is the original SHA-256.
- The sibling `profile.csv` streams all archived 1,000-sample pages with source
  versions, method, chainage, coordinates, quality and original JSON checksum.
- The sibling `segments.geojson` streams actual LineString segments in ordinal
  order with inputs, source IDs, method status, units and the screening disclaimer.

`X-Analysis-JSON-SHA256` identifies the parent JSON; it is not presented as a
checksum of the derived CSV or GeoJSON byte stream. JSON download does not
recompute analysis. Browser/API requests never launch the analysis worker.

The optional API region filter selects whole ways intersecting a region and is
explicitly labelled `whole_assets_intersecting_region`; it is not a clipped
regional exposure statistic. The published clipped totals are documented in [regions](regions.md).

## Local acceptance, 2026-09-06

Real full railway run `f30d71aa-bda6-5098-b050-eed1f9657f0f` and pilot OSM
`way/963780743` verify stable nonoverlapping pages, 12,722 total ways, 56.93498%
pilot coverage, invalid-input rejection and exclusion of unrelated analyses.
Downloaded JSON matches its checksum; full CSV preserves NoData and the final
chainage. GeoJSON count and end chainage match the published summary.

Desktop and 390 px Chrome checks pass for search, pinned detail navigation,
downloads, profile/map selection, reload and document width. Shared map checks
also preserve vector selection and independent raster behavior during a vector
outage. The settled map image was visually inspected. A numeric URL query exposed
the router's automatic number decoding; the shared search validator now accepts
finite numeric queries and rejects structured/oversized input.

## Interactive segments, 0.2.0-alpha.8

Both the map panel and asset detail show 25 archived segments per page. Selecting
an ordinal fits its actual LineString and pins the segment and analysis in the
URL. Reload restores selection; choosing another asset or map mode clears it.
The whole-way control restores the original geometry. Segment rows expose chainage,
numeric velocity bands and explicit NoData, without inventing per-segment means or
hazard classes. The API contract now types each geometry and metric record.

Four real desktop/mobile asset and map-mode checks passed, including segment
selection, URL restoration, whole-way restoration and profile-marker visibility
after fitting a short segment. TypeScript, Pyright, ESLint and the real archive/
CSV/GeoJSON API check passed. These checks do not complete V2 science and reports.
