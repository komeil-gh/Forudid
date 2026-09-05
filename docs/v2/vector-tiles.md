# Real infrastructure vector tiles — V2 milestone 5

Martin 1.15.0 serves the pinned OSM snapshot through `/vector/*`. FastAPI returns
asset metadata and one selected geometry; national GeoJSON is never sent to the
browser. The raster remains independently served by TiTiler.

## Local development

After migrating and importing infrastructure, install the official Martin 1.15.0
binary for your platform from the [release](https://github.com/maplibre/martin/releases/tag/martin-v1.15.0).
Then run from the repository root:

```sh
uv run --project apps/api python -m forudid_api.configure_martin .tools/martin.json
martin --config .tools/martin.json
```

The service listens only on `127.0.0.1:58300`, with one worker, a 32 MB cache and
two database connections. Vite preserves the incoming Host and forwarded headers,
so TileJSON links use the frontend origin. Stop the foreground process with Ctrl+C.

Compose uses the official `ghcr.io/maplibre/martin:1.15.0` image. Initialization
writes a private configuration to a named volume, owned by UID 10001. The service
runs as that user with a read-only filesystem, no Linux capabilities, a 192 MB
memory cap and half a CPU. Its configuration is mounted read-only. Caddy forwards
the same `/vector/*` prefix; no independent public Martin port is exposed.

## Explicit publication and permissions

The configuration provisions only `tiles.tiles_railways` and `tiles.tiles_major_roads`,
pinned to source version `b540a66b-41c4-58a9-9a68-e63f5ffb226d`. Auto-publication is
disabled. Only asset UUID, source-version UUID, name and class enter the tile.
Original tags, storage locations and other tables remain private. New snapshots
require an explicit view/configuration update and Martin restart to clear its cache.

Native development uses `forudid_tiles`; Compose uses `forudid_tiles_compose` so
their credentials can persist separately. Both roles have SELECT only on the two
views, no elevated role attributes, a read-only transaction default and a ten-second
statement timeout. Secrets stay in private ignored files or the private volume.
Configuration reruns reuse their saved credential and reject conflicting content.
Restore the saved configuration if it is lost; do not rotate a live role silently.

## Browser contract

Road and railway visibility is stored in the URL. Vector features become visible
at zoom 6; a fixed raster insertion point keeps scientific layers below infrastructure
regardless of asynchronous load order. Clicking a visible way reads its UUID from
the MVT property, requests its real API record and highlights its full geometry.
The selected UUID and camera survive reload. Overlapping ways may select the top
rendered feature, rather than an analytically grouped route.

The details panel retains OSM attribution, snapshot date, actual source ID and
geodesic length. It explains incomplete coverage and the temporal mismatch with
2014–2020 deformation data. Attribution is also available through the map's native
attribution control. A vector-service failure leaves the scientific raster and
point measurement available.

## Local verification — 2026-09-05

- The catalog contains exactly two approved sources; private table endpoints return 404.
- Real Tehran MVT tiles return protobuf payloads smaller than 2 MB in the tested tiles.
- The tile role reads 12,722 railway ways, but attempts to read private source versions
  or update a public view fail with insufficient privileges, even after explicitly
  changing the transaction to read/write.
- Desktop and 390 px mobile Chrome verify real MVT selection, API identity, reload,
  attribution, no horizontal overflow and survival of a Martin outage.
- The native ARM64 archive was verified against the official SHA-256:
  `9891739e89bf6fe05ddb75d416f5b459611bfa397085f756e7b186cbe1d5d312`.

These checks used the native Martin binary with local PostGIS. The complete updated
Compose stack and remote CI have not yet been verified. No production deployment
or scientific exposure/risk assessment is implied by this milestone.
