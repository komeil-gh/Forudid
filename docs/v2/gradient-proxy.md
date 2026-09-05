# Experimental Deformation Gradient Proxy

`native-plane-gradient-1` fits an ordinary least-squares plane in each native
3 by 3 window of a published real vertical-velocity raster. The centre and at
least three neighbours must be finite and the design must have rank three.
Missing values are excluded, never changed to zero. The magnitude of the two
plane slopes is expressed in **mm/year/m**, not angular distortion or hazard.

The worker accepts a checksummed, single-band, unrotated EPSG:4326 raster.
WGS84 ellipsoidal axis distances are computed at each row centre; this is a local
tangent approximation over one small native window. There is no reprojection,
interpolation, inferred acquisition duration or structural classification.
The output retains the source grid and a separate NoData mask. Raster values
are float32; the summary is accumulated in float64 before storage.

One low-priority worker holds the existing analysis lock, uses 256-pixel blocks
with a one-pixel halo, one GDAL thread and a 32 MiB cache. A new output directory
is required. Interrupted files are retained without a completed manifest;
existing artifacts are never overwritten. A checksummed manifest records source,
product, method and worker hashes, numerical runtime and measurement limitations.
These are local research artifacts; they are not public products or hazard inputs.

```sh
uv run --project apps/api python -m forudid_api.research_differential gradient \
  --product 744b6536-b9a7-56c5-85b1-66a629a78b91 \
  --raster data/normalized/haghighi-motagh-cog-1/rate.tif \
  --output data/research/haghighi-gradient-1
```

## Real result, 2026-09-06

Analysis `edcd405c-e093-55f4-a635-6d19ad9d96c2` processed the complete
Haghighi–Motagh grid. There are 7,840,696 valid gradient pixels; the maximum is
0.4053728966 mm/year/m and the unweighted valid-pixel mean is 0.0221413102.
These are numerical descriptors, not safety thresholds. The estimated vertical
field inherits the original descending-LOS projection and negligible-horizontal-
motion assumption. Year-precision 2014–2020 metadata is not an exact duration.

Analytic checks cover zero planes, tilted planes, quadratic bowls, missing centres,
insufficient windows, 50/100 m grid scaling, geographical row distances and block
halos. The real-artifact check independently fits twelve windows in metric
coordinates and verifies input/output checksums. Scientific review remains pending.
