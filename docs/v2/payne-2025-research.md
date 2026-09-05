# Payne 2025 angular-distortion research comparison

Reference: Payne et al., [JGR: Solid Earth, 2025, section 2.5, pages 7–8](https://doi.org/10.1029/2024JB030367).
Data: [Zenodo 13754200, version 1](https://zenodo.org/records/13754200), CC-BY-4.0.
The paper derives displacement from vertical velocity over approximately eight
years, fits local 3 by 3 planes with more than two surrounding observations and
normalizes the maximum plane gradient by the 100 m pixel width.

`payne-2025-research-1` implements this numerical interpretation on one real
Saveh–Qom–Kahak example. The CLI requires an explicit experimental flag. It writes
local artifacts only. There is no API publication, hazard classification or
validated method/product combination. The paper's composite risk equation is not
implemented. A published source does not validate this derivative implementation.

## Source verification

Both complete archives were acquired sequentially and matched provider MD5:

| Archive | Bytes | MD5 | Local SHA-256 |
| --- | ---: | --- | --- |
| vU.zip | 305726951 | 63fafbd6c4c671c629b46f9c34956415 | 1b6bd6408fb52721886b3432abb8a9c019f3c076b1ebf1360d9d2dc755449163 |
| angular_distortion.zip | 139791312 | f7ad706d09b303d0c973e2eab2058f92 | d21a147c8d67b60818d6dae5d33b2b6f23997f51da638cc33708d060c152cc00 |

The named Qom TIFF members also match their earlier range-acquired CRC/SHA-256.
The earlier range-only manifest remains historical; the new research manifest
records complete archive verification. Sparse ZIP index files are not archives.

## Explicit choices and unresolved assumptions

- Velocity unit is inferred as mm/year from the source paper; the TIFF has no unit tag.
- Duration is fixed to the paper's rounded 8.0 years; October 2014–December 2022
  does not specify exact first/last acquisition dates.
- Bilinear reprojection uses GDAL's default EPSG:32639 100 m grid. The original
  author UTM grid origin and exact resampling sequence are unavailable.
- The centre must be finite, with at least three finite neighbours. The paper's
  handling of missing centres is not explicit.
- Displacement in metres is fit against pixel-index coordinates and the Euclidean
  slope magnitude is divided by 100 m, producing dimensionless beta.
- The candidate is bilinearly mapped onto the author's distinct WGS84 output grid
  before comparison; raw array indices are not treated as corresponding locations.

Both input, analysis and comparison transforms, resolution, window, valid rule,
source/method hashes and runtime are recorded. Resampling follows the
[Rasterio reprojection contract](https://rasterio.readthedocs.io/en/stable/topics/reproject.html).

```sh
uv run --project apps/api python -m forudid_api.research_differential payne-qom \
  --archives data/sources/payne-2025/13754200 \
  --output data/research/payne-qom-1 --enable-experimental-angular-distortion
```

## Comparison, 2026-09-06

Analysis `1758991b-417a-5a68-8ade-16170af2791f`:

| Measure | Value |
| --- | ---: |
| Author valid pixels | 701604 |
| Candidate valid pixels on author grid | 699973 |
| Common valid pixels | 690897 |
| Bias | -0.000001702912078 |
| Mean absolute error | 0.000002462433297 |
| RMSE | 0.000007553378988 |
| 95th percentile absolute error | 0.00001166679145 |
| Maximum absolute error | 0.0008851397339 |
| Author maximum beta | 0.001997120678 |
| Candidate maximum beta | 0.001803600090 |

This comparison is **not accepted scientific reproduction**. There is no
independently accepted tolerance or reviewer. The large maximum discrepancy and
different valid footprints need investigation before any validation transition.
Tests pin these measured discrepancies as regression evidence, not acceptance
thresholds. The same continuous-plane numerical tests cover units and resolution;
they cannot establish geotechnical applicability.

The paper's boundaries are beta <= 1/3000, then <= 1/1500, then <= 1/500,
then greater than 1/500. They remain literature notes, unused in product outputs.
Scientific review must resolve the assumptions and accept an appropriate test
corpus and tolerance before classification can be enabled. Method and product
review are both required; changing a browser flag cannot publish these local files.
