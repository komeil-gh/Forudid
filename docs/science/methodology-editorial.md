# Methodology evidence and interpretation

The bilingual methodology separates provider processing, general measurement
physics, and Forudid normalization. It now begins with an explicit product contract
for the two published deformation families. The nationwide historical source is
version 1.0.0 of Haghshenas Haghighi and Motagh (2024), DOI
10.5281/zenodo.10815578. The Varamin pilot is the checksum-pinned COMET ascending
LiCSBAS HDF5 snapshot documented in [comet-varamin.md](../v2/comet-varamin.md).

The historical product is a positive subsidence magnitude projected from descending
line of sight to vertical. It supplies annual rate and peak-to-peak seasonal
amplitude, but no pixel time series. The COMET product is ascending line of sight,
positive toward the satellite, with 323 dated displacement epochs. It uses a source
reference pixel and is the unfiltered variant without GACOS correction. It does not
supply pixel velocity or displacement uncertainty. Mean interferometric coherence
is not relabelled as temporal coherence.

The two products must not be differenced, merged, or presented as independent
confirmation until component, sign, reference frame, observation interval, spatial
support, and corrections have been harmonized. The portal's own technical note says
its products have not been independently verified.

The temporal model is discussed using elapsed days. Its annual coefficients give
half-amplitude sqrt(beta4^2 + beta5^2); peak-to-peak amplitude is twice that value.
The supplied seasonal raster is peak-to-peak, not pixel uncertainty. No pixel time
series or confidence interval can be reconstructed from the two published layers.

The LOS projection explicitly defines the ground-to-sensor unit vector and an
upward vertical component. The source's positive subsidence magnitude is a distinct
sign convention. Horizontal displacement introduces projection bias.

Additional references cover phase-closure diagnostics (MintPy documentation),
groundwater-related compaction (USGS), and alternative subsidence mechanisms (USGS
Circular 1182). MintPy is not identified as the source dataset's processor.

Conversion fidelity is supported by raster-normalization.md. It does not establish
independent geodetic accuracy. Historical rate is not present-day rate or a measure
of structural damage or groundwater volume loss.

## Localized date presentation

The API and provenance records retain ISO Gregorian source dates. The Persian UI
renders those dates with the Persian calendar and Persian digits; the English UI
renders them with the Gregorian calendar and Latin digits. Full dates use day,
month, year order. Year-precision source intervals are converted as calendar
coverage, so Gregorian 2014 through 2020 appears as Persian 1392 through 1399 rather
than inventing a precise acquisition day. Citations and immutable dataset titles
retain their published Gregorian wording.

## Native-pixel inspection — 2026-09-11

Point inspection reads the selected raster's containing native pixel, including
coherence and velocity uncertainty. It does not substitute the LOS rate for a
quality layer. Source scale and offset remain applied once; zero is preserved,
non-finite and masked values remain missing, and unitless coherence is not labelled
as millimetres. A companion velocity uncertainty retains its own velocity unit.

The API returns the pixel centre and closed native-cell corners in WGS84. The map
outlines that footprint and can fit it without changing the measurement. A cell
inside the raster with no value retains its geometry; a point outside the raster
extent has neither cell nor centre. Population uses its existing native bounds
and distinguishes masked cells from points outside its extent. Coordinate values
are preserved through selection and URL state rather than rounded before sampling.

Both server tile generation and browser raster display explicitly use nearest
resampling. Zooming does not create finer measurements. Neither coordinate decimal
places nor a pixel outline establish geodetic accuracy. The railway map displays
the selected product's actual observation period, independently of the network
snapshot date. These corrections change inspection and presentation, not the
immutable source pixels, published analyses or their scientific maturity.
