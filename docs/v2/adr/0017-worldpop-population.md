# 0017 — Population exposure from a versioned source

Status: source products and method selected. Publication requires verified files and actual computation.

## Decision

Prefer WorldPop; substitute GHSL only with a documented reason and product-specific metadata. The [official WorldPop API](https://www.worldpop.org/sdi/introapi/) supports metadata discovery. Record the exact dataset, year, resolution, method, license and citation before ingestion. Describe outputs as population estimates, never official census counts.

## Selected products

As of 2026-09-09, the default is [WorldPop record 77712](https://hub.worldpop.org/geodata/summary?id=77712): Iran 2026, constrained 30 arc-second counts, R2025A v1, adjusted to UN WPP 2024 totals. DOI `10.5258/SOTON/WP00840`, CC BY 4.0. It is an alpha modelled estimate/projection, not a 2026 census. Preserve release status, model year and publication date separately. See [population exposure](../population-exposure.md) for acquisition and publication evidence.

The original selection remains independently addressable: [record 31792](https://hub.worldpop.org/geodata/summary?id=31792), Iran 2020, unconstrained individual countries 2000–2020, 1 km, not UN-adjusted. DOI `10.5258/SOTON/WP00670`, CC BY 4.0, produced 2020-06-22. Its WGS84 grid uses 30 arc-second people-per-cell counts from Random Forest dasymetric redistribution. The approximately 1 GB 100 m acquisition was interrupted and remains incomplete; the verified 10,536,072-byte official 1 km product was used instead. This does not create 100 m population precision.

`ellipsoid-cell-overlap-1` conserves counts through ellipsoidal cell-overlap areas. Polygon analysis uses equal-area EPSG:6933 with WGS84 edges densified to at most 0.002 degrees. Record that geometric approximation in provenance. Clip boundary cells by actual intersections; calculate regional rate statistics using valid-pixel area weights. The method remains experimental. Numerical checks are not independent scientific validation.

Counts, density and rates have different semantics. Never multiply unaligned grids directly. Alignment includes CRS, overlap, NoData and count conservation. Assume uniform population within each native source cell. A new year produces a new run. Show both population year and historical deformation period in UI and reports; the 2020 and 2026 grids and modelling assumptions differ.

## Acceptance and dependencies

Use the existing NumPy, Rasterio and PyProj stack; declare directly consumed dependencies in the analysis package. Do not add a parallel population library in advance. Check conservation before/after alignment, partial clipping, NoData and count/density rejection. Until hazard methods are validated, report population in descriptive numeric bands. Missing hazard values remain null and receive no scientific low/high labels.
