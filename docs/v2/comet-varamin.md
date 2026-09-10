# COMET Varamin native-source preparation

## Repeatable acquisition and recovery

The foreground workflow is now available through the project CLI:

```sh
uv sync --project apps/api --frozen --group ingest
uv run --project apps/api forudid data check-comet data/discovery/comet/2026-09-09
uv run --project apps/api forudid data ingest-comet data/discovery/comet/2026-09-09 \
  --normalized data/normalized/comet-varamin-native-1
```

Each command archives provider headers under the source directory's `checks/`.
The check distinguishes local full-byte verification from remote header matching.
Provider changes or missing validators stop the integrated ingestion for review.
The reviewed importer, source checksum, published run and normalization manifest
remain unchanged. A new provider version requires its own reviewed adapter and
source identity; this command does not silently broaden the old import contract.

Download interruption is recoverable by rerunning the same command: the shared
downloader requests the remaining byte range, validates the exact range/size and
checks the complete pinned checksum before exposing the final file. It holds an
exclusive local lock and never overwrites a conflicting source. A server ignoring
Range starts a new full attempt; rejected and superseded partials stay inspectable.
Interrupted normalization runs retain separate hidden attempt directories. Only a
successful conversion becomes the named normalized directory; publication can
then resume through the existing immutable publisher.

Local acceptance on 2026-09-10 verified recovery against the actual provider:
the first 512,767,526 bytes came from the checksummed retained original and the
remaining 1,048,576 bytes came from an HTTP 206 response. The assembled
513,816,102-byte file matched the full SHA-256 below. This verifies real range
recovery, not a new full remote snapshot. The two integrated ingestion executions
both returned `62161d71-f329-5c89-b275-71a9854eb6e5`; no new publication identity
was created. Targeted software checks also passed, covering interrupted
transfer, ignored/malformed ranges, wrong bytes, locks, metadata gates, failed
conversion recovery and existing CLI/integrity behavior.

The [provider's technical information](https://comet-subsidencedb.org/technical-information)
describes continuing LiCSBAS updates and explicitly states that its portal data
lack independent verification. On this check, headers still identified the
August 13 file and the local series still ended July 31. Scheduled acquisition,
automatic acceptance of changed snapshots and reviewed event updates remain open.

## Railway exposure — 2026-09-10

The complete imported railway snapshot was evaluated against this source's own
LOS COG. Run `e8e610a9-7950-5871-a087-ed70b2cbc82b` contains all 12,722 OSM ways;
244 have valid samples. Summed valid length is 360,375.00715000805 m and missing
length is 15,683,657.44291099 m. These are summed OSM-way lengths, not a deduplicated
network inventory. The pilot does not provide present-day nationwide deformation.

The native geodesic method is unchanged. LOS defaults use signed descriptive
edges `[-150, -100, -50, 0, 25]` mm/year, matching the existing population exposure
profile. Positive values indicate motion towards the satellite and negative
values away; neither is relabelled as vertical subsidence. The provider reference
is retained in the analysis inputs. Historical default bands and existing run
identities are preserved. Repeating the full railway command returns the same run.

Country aggregate `6eeba935-f905-5568-813b-df02478f1277` and Tehran aggregate
`b8a0b77d-0a62-5468-af22-b9e8d00c45d4` use the existing administrative segment
clipping method. The selected ranked railway's API profile was checked against
every corresponding native COG sample, including signed values and absent
uncertainty/hazard classifications. The separate major-road pair remains open;
the complete regional-report prerequisite remains enforced.

## Verified snapshot — 2026-09-09

The [official region page](https://comet-subsidencedb.org/region/000001)
provides a downloadable HDF5 file for ascending frame `028A_05385_191813`.
The importer uses this official download, not the portal's undocumented web JSON.
The native file is preserved locally and in this project's object store.
The verified source is connected to the local catalog, map and point-series API.
These checks do not establish independent scientific validation.

| Property | Verified value |
| --- | --- |
| Source | `https://comet-subsidencedb.org/static/data/licsbas_data/000001/000001_028A_05385_191813.hdf5` |
| SHA-256 | `2b1ffa94efafad54882f7a27e567c9fe75f8ccaaad6a6bd7f664c9ded39d5eb5` |
| Bytes | 513,816,102 |
| HTTP last modified | 2026-08-13 17:06:10 UTC |
| Acquisition dates | 323 distinct epochs, 2014-10-19 through 2026-07-31 |
| Native grid | 581 rows by 765 columns, EPSG:4326, 0.001-degree spacing |
| First pixel center | 51.4133333 E, 35.608 N |
| Pixel-edge bounds | 51.4128333, 35.0275, 52.1778333, 35.6085 |
| Variant | Unfiltered; no GACOS correction |
| Component | Ascending line of sight, track 028 |
| Valid velocity pixels | 444,457 |
| Native velocity range | -137.5355224609375 to 15.967065811157227 mm/year |
| Reference area | Zero-based column 427:428, row 183:184 |

## Measurement contract

The reviewed [LiCSBAS source commit](https://github.com/comet-licsar/LiCSBAS/commit/a145e6c4217b29eb7348ea95630454a099809098)
is archived with the discovery evidence. `LiCSBAS13_sb_inv.py` uses millimetres
for cumulative displacement, millimetres/year for velocity, and positive motion
toward the satellite. Its reference selection subtracts the chosen reference
pixel from each epoch and velocity. The actual HDF5 reference pixel is zero for
all 323 epochs, and all finite first-epoch values are zero.

`LiCSBAS_flt2geotiff.py` explicitly shifts the grid registration by half a pixel
to obtain pixel edges. This is applied once. The HDF5 grid is retained; the
rounded, coarser web visualization coordinates are not used for georeferencing.
The upstream commit documents the reviewed format contract, not proof of the
exact software revision used by the provider to produce this file.

## Normalization and verification

```sh
uv sync --project apps/api --frozen --group ingest
uv run --project apps/api --group ingest python -m forudid_api.prepare_comet \
  data/discovery/comet/2026-09-09/000001_028A_05385_191813.hdf5 \
  data/normalized/comet-varamin-native-1
```

The command accepts only this checksum-pinned snapshot. It runs one worker,
reads 32-row strips, and writes a Zarr v2 cube with `(323, 32, 32)` chunks.
All displacement values and NaNs are compared with the original immediately
after writing. Velocity is converted explicitly from float32 millimetres/year
to float64 metres/year; every COG base pixel and the affine grid are verified.
Original millimetre displacement values remain unchanged in Zarr. The output
manifest records every artifact's size and checksum. Repeated execution verifies
existing artifacts; it refuses to overwrite an incomplete directory.

The real preparation completed successfully. The resulting COG and all 323
time slices passed these preservation checks. This is an input-conversion
check, not independent verification of ground motion.

Publish the verified artifacts into the local catalog and private object store:

```sh
uv run --project apps/api python -m forudid_api.publish_comet \
  data/discovery/comet/2026-09-09/000001_028A_05385_191813.hdf5 \
  data/normalized/comet-varamin-native-1
```

## Quality and publication limits

The provider's [technical information](https://comet-subsidencedb.org/technical-information)
states that portal data have not been independently verified. Preserve that
status and the requested Payne et al. (2022), LiCSAR, LiCSBAS, COMET, JASMIN and
modified Copernicus Sentinel acknowledgements when the source is integrated.
A specific redistribution license for this HDF5 snapshot has not been confirmed;
do not infer a Creative Commons license from another COMET service.

- `coh_avg` is mean interferometric coherence, not temporal coherence.
- `n_unw` counts contributing unwrapped interferograms, not acquisition epochs.
- `resid_rms` is interferogram residual RMS, not velocity uncertainty.
- The new `observations` field counts finite displacement epochs explicitly.
- Pixel velocity/displacement uncertainty remains unavailable.
- Ascending LOS is not vertical displacement and is not directly interchangeable
  with the historical nationwide vertical-projection product.

## Local application verification

- Run: `62161d71-f329-5c89-b275-71a9854eb6e5`.
- LOS product: `5323cc4f-57ec-5347-a85d-14f4887e5d27`.
- Area: `varamin-comet`; selectable from the registered-area control on the map.
- The API returns the native COG sample in metres/year and all 323 original
  displacement epochs in metres. Each uncertainty remains null.
- A point-series read fetches only `.zarray` and one spatial chunk, verifies
  their checksums, and lets Zarr decode them. Out-of-footprint requests return
  missing values without reading chunks. Database connections are released
  before remote raster/chunk reads.
- The real integration check compared every epoch for a selected native pixel,
  the velocity, pixel center, finite observation count, reference pixel and
  outside-footprint behavior. It passed alongside the retained historical-source
  checks; all 20 existing WebGIS regressions also passed.
- Desktop and 390 px mobile Chrome checks passed source selection, real tile
  delivery, displayed rate, 323 table rows, chart rendering and URL restoration.
- Four COMET browser cases cover both device sizes and the independent
  population-to-region path. They also verify the explicit prerequisite message
  for a combined report when this source lacks infrastructure analyses.
- The final combined population, region, map-mode and COMET run passed all
  14 cases in 1.2 minutes. Metadata requests take priority over two concurrent
  raster requests; a previous reproducible desktop ranking delay was resolved
  without extending its assertion timeout.

## Independent population overlap

WorldPop 2026 is intersected with this product using its exact registered COG,
LOS units and reference. Numerical bands are `[-150, -100, -50, 0, 25]` mm/year;
negative values remain motion away from the satellite, not vertical subsidence.

```sh
uv run --project apps/api python -m forudid_api.analyze_population \
  --product 5323cc4f-57ec-5347-a85d-14f4887e5d27 \
  --population-version b626dc10-f9f7-5b67-9f49-889e391c8b15 \
  --population-raster data/sources/worldpop-iran/2026-r2025a-77712/population-count.cog.tif \
  --velocity-raster data/normalized/comet-varamin-native-1/velocity.tif
```

Add `--region 637d5b9a-e103-54e0-8379-60beb1b21b40` for the separately
versioned historical Tehran calculation. Run one analysis worker at a time.

| Scope | Analysis ID | Estimated people within valid deformation coverage |
| --- | --- | --- |
| Iran population footprint | `5cdf2452-a635-5e3c-ac73-6bf0875e04a7` | 1,657,239.3294914013 |
| Historical Tehran boundary | `d53d1829-07f5-5097-986f-1999cff9680e` | 1,636,661.7765239528 |

The country calculation uses unchanged `ellipsoid-cell-overlap-1`. The first
regional attempt reached that method's 100,000-distinct-value limit and remains
a failed run. The separately archived `ellipsoid-cell-overlap-2` keeps identical
allocation and exact weighted-quantile calculations, with a bounded maximum of
500,000 distinct rates. The original method file and published results remain
unchanged. The two versions share conservation, shifted-grid, boundary and NoData
regressions. A 102,400-distinct-rate check verifies exact signed median/95th
percentile behavior beyond the old limit. This resource limit is still not
suitable for unrestricted national floating-point regional grids.

The source has no precomputed infrastructure analysis. Complete combined regional
PDFs therefore remain unavailable for this source. Missing infrastructure is not
substituted from a different product. It is a Varamin footprint, not current
nationwide deformation coverage. No public-server deployment or current-event
validation is claimed.
