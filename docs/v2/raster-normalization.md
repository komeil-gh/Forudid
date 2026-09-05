# Historical raster normalization — local evidence

2026-09-05, pipeline `haghighi-motagh-cog-1`. This is acquisition/normalization
evidence for V2 milestone 3, not completed map publication or scientific
validation of infrastructure exposure.

The three original Zenodo rasters were read in 64-row windows. The entire base
grid was checked: binary mask values, finite/nonnegative rate and amplitude,
matching grid geometry and exact equality of valid-pixel coverage across all
three rasters. Source checksums match the [registry manifest](source-registry.md).

- Valid rate pixels: 7,842,872, including 37,954 valid zeros.
- Grid coverage: 0.018165026738438568 of the rectangular raster extent.
- Rate minimum/mean/maximum: 0 / 3.114843937838562 / 37 cm/year.
- Maximum-pixel centre: longitude 55.65368745, latitude 30.869620060000003.
- CRS, affine transform, source values and NoData preserved. No reprojection,
  interpolation of the base grid, smoothing, unit conversion or sign change.
- Mean overviews for continuous rasters; nearest overviews for the binary mask.
  Analyses must use base-resolution pixels, not display overviews.

| COG | Bytes | SHA-256 |
| --- | ---: | --- |
| rate.tif | 18,634,333 | `8c7e705a52cf4552e7ce8c6143f603bc6c2abf88ad6e3e43adca45ea01524331` |
| seasonal_amplitude.tif | 14,968,101 | `b8497a06c3c036907ef6941492b9f7d6675c9e11928d60a3efc800b4f233b7d5` |
| mask.tif | 616,738 | `8b88203802acb1e37b8b71b55733d7bf0c1016390ad522683bee5f5925d774de` |

All three outputs passed strict COG validation and an independent comparison of
every base-resolution pixel against the original. The check took 39.73 seconds.
Normalization used one GDAL thread and a 32 MiB GDAL cache. A sampled process
measurement was 119,104 KiB RSS; this is an observation, not a peak-memory bound.

```sh
uv run --project apps/api python -m forudid_api.normalize data/sources/haghighi-motagh-2024/1.0.0 data/normalized/haghighi-motagh-cog-1
uv run --project apps/api pytest apps/api/tests/test_real_rasters.py -q
```

Outputs live in ignored `data/`; the command refuses changed originals, conflicting
manifests or corrupted existing COGs. Interrupted COG creation can reuse a complete
file only after comparing it to the original. The real-raster acceptance test is
skipped when the official snapshot and normalized artifacts are not present.

The positive rate is a subsidence magnitude projected to vertical under the
provider's negligible-horizontal-motion assumption. Missing pixels do not imply
stability. The seasonal amplitude is peak-to-peak; no uncertainty raster or
per-pixel time series was supplied in this three-file snapshot.
