from typing import Annotated
from uuid import UUID

import rasterio
from fastapi import Depends, HTTPException, Path, Query, Request, Response
from rio_tiler.errors import TileOutsideBounds
from rio_tiler.io.rasterio import Reader
from sqlalchemy.orm import Session
from titiler.core.factory import TilerFactory

from forudid_api import catalog
from forudid_api.config import settings
from forudid_api.db import session
from forudid_api.storage import read_url
from forudid_api.styles import DEFAULT_STYLE, STYLES, colormap


class PublishedTiler(TilerFactory):
    """Only published-asset tiles; no generic dataset endpoints."""

    def register_routes(self):
        @self.router.get(
            "/{asset_id}/{z}/{x}/{y}.png", operation_id="getTile", response_class=Response
        )
        def tile(
            request: Request,
            asset_id: UUID,
            z: Annotated[int, Path(ge=0, le=18)],
            x: Annotated[int, Path(ge=0)],
            y: Annotated[int, Path(ge=0)],
            db: Annotated[Session, Depends(session)],
            style: Annotated[str | None, Query()] = None,
        ):
            if set(request.query_params) - {"style"} or x >= 2**z or y >= 2**z:
                raise HTTPException(422, "Invalid tile parameters")
            asset, item = catalog.asset(db, asset_id)
            if asset.role != "data" or item.kind not in DEFAULT_STYLE:
                raise catalog.missing("RASTER_NOT_PUBLISHED")
            selected = style or DEFAULT_STYLE[item.kind]
            if selected not in STYLES or STYLES[selected][0] != item.kind:
                raise HTTPException(422, "Style does not match this product")
            ticks = STYLES[selected][1]
            try:
                with rasterio.Env(GDAL_HTTP_TIMEOUT=10, GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR"):
                    with Reader(input=read_url(asset.object_key), options={}) as reader:
                        img = reader.tile(x, y, z, tilesize=256)
                img.rescale([(ticks[0], ticks[-1])])
                payload = img.render(img_format="PNG", colormap=colormap(selected))
            except TileOutsideBounds:
                return Response(status_code=204)
            return Response(
                payload,
                media_type="image/png",
                headers={
                    "Cache-Control": f"public, max-age={settings().tile_cache_seconds}, immutable",
                    "ETag": f'"{asset.checksum_sha256}-{selected}"',
                },
            )
