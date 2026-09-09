# 0012 — OSM from a dated Geofabrik Iran snapshot

Status: accepted architecture; implementation stage 4.

## Decision

Use a dated national PBF from [Geofabrik Iran](https://download.geofabrik.de/asia/iran.html). Overpass is not the bulk ingestion path. Preserve originals, SHA-256, acquisition time, tool versions, command/configuration and output counts. New snapshots never overwrite old ones.

Initially extract `railway=rail` and motorway/trunk/primary/secondary roads. Preserve OSM IDs, original names, tags and data quality. Do not invent route names for unnamed ways. Route grouping is separate; the MVP can analyze raw features. The Python `InfrastructureAsset` model is distinct from a product-file Asset.

## Dependency and acceptance

PyOsmium 4.3.1 was checked upstream and pinned in the lockfile. Use the official Osmium library with one worker and a disk-backed node cache; do not write a PBF parser. Insert PostGIS rows in batches of 500 and store geodesic length in meters. Preserve ODbL 1.0 and OSM Contributors attribution in UI and reports. Acceptance covers counts, geometry samples, GIST, provenance and explicit possible coverage gaps. OSM is not a complete official inventory.
