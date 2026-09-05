# Methodology evidence and interpretation

The bilingual methodology separates the provider's processing, general measurement
physics, and Forudid's raster conversion. The historical source is version 1.0.0 of
Haghshenas Haghighi and Motagh (2024), DOI 10.5281/zenodo.10815578.

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
