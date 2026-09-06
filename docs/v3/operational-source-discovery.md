# Operational source discovery — 2026-09-06

## NISAR metadata verified

Live NASA CMR collection discovery returned these actual collection names:

- `NISAR_L2_GUNW_PROVISIONAL_V1`, `C2854335566-ASF`.
- `NISAR_L2_GUNW_BETA_V1`, `C2850261892-ASF`.
- `NISAR_L2_GSLC_PROVISIONAL_V1`, `C2854332392-ASF`.
- `NISAR_L2_GSLC_BETA_V1`, `C2850259510-ASF`.

The first query used the outdated name `NISAR_L2_GUNW_V1` and returned zero.
That was not evidence of absent coverage. The corrected provisional query for
longitude 50–53°, latitude 34–37°, returned 64 matching granules, fetching only the
first two sorted by descending start date. Beta discovery fetched two additional
records. A bbox match is not proof of complete coverage or valid pixels in Tehran.
See the [CMR API](https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html).

Provisional sample `G4299337429-ASF` covers 2026-08-22T15:26:20Z through
2026-09-03T15:26:55.999Z. CMR reports a granule size of 2269.488925933838 MB;
this is metadata, not a verified downloaded byte count. The provider's main HDF5
link was identified, but no HDF5 measurement or QA file was downloaded.

Raw metadata and a SHA-256 manifest are retained under
`data/discovery/nisar/2026-09-06/`. Provisional response SHA-256 starts
`a98119fd31f1`; beta starts `363c021505b9`. These checksums describe the exact
metadata responses, not the radar data. The archive is not published as a source
measurement, product, event observation or evidence assertion.

Maturity must follow the explicit collection/product metadata, not an assumption
from filename substrings: the sampled beta records also contain `PR` in their
filenames. GUNW is an interferogram product; it must not be treated as a validated
vertical-velocity measurement. Component, wavelength/sign, reference, masks,
acquisition lineage, uncertainty and processing version need adapter verification.

[ASF access guidance](https://hyp3-docs.asf.alaska.edu/nisar-docs/access-overview/)
requires Earthdata login for downloading and streaming NISAR data. A credential
entry for `urs.earthdata.nasa.gov` was not found in local `.netrc`; the user was
asked about configuring it locally, without sending credentials in conversation.
No whole-scene download or sensor fusion has been started.

## Sentinel follow-up candidate

The [COMET Subsidence Portal](https://comet-subsidencedb.org/) publishes processed
Sentinel-1 time series for Iranian subsidence regions. It is a candidate for
avoiding raw-SLC processing on the local machine. The exact region, files, latest
observation dates, reference, quality, license/attribution and update availability
still need inspection before choosing an operational adapter. The portal's broad
claims of ongoing updates do not verify any particular current local product.
