"""Experimental local plane gradients; no structural classification or validation."""

from functools import lru_cache

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view
from pyproj import Geod

METHOD_VERSION = "native-plane-gradient-1"
PAYNE_VERSION = "payne-2025-research-1"
GEOD = Geod(ellps="WGS84")


@lru_cache(maxsize=1)
def _plane_weights():
    y, x = np.mgrid[-1:2, -1:2]
    design = np.column_stack((np.ones(9), x.ravel(), y.ravel()))
    weights = np.full((512, 2, 9), np.nan)
    for code in range(512):
        valid = (code & (1 << np.arange(9))) != 0
        # The centre and at least three surrounding pixels must be observed.
        if not valid[4] or valid.sum() < 4 or np.linalg.matrix_rank(design[valid]) < 3:
            continue
        weights[code] = 0
        weights[code][:, valid] = np.linalg.pinv(design[valid])[1:]
    weights.setflags(write=False)
    return weights


def plane_gradient(values, pixel_width_m, pixel_height_m):
    """OLS plane-slope magnitude on inner pixels; units are input units per metre.

    Width/height may be scalars or arrays broadcastable to the inner grid.
    North-up orthogonal axes are required. Missing centres remain missing.
    """
    values = np.asarray(values, dtype="float64")
    if values.ndim != 2 or min(values.shape) < 3:
        raise ValueError("A two-dimensional grid of at least 3 by 3 is required")
    shape = (values.shape[0] - 2, values.shape[1] - 2)
    dx = np.broadcast_to(np.asarray(pixel_width_m, dtype="float64"), shape)
    dy = np.broadcast_to(np.asarray(pixel_height_m, dtype="float64"), shape)
    if not np.all(np.isfinite(dx) & np.isfinite(dy) & (dx > 0) & (dy > 0)):
        raise ValueError("Pixel dimensions must be positive finite metres")
    windows = sliding_window_view(values, (3, 3)).reshape(*shape, 9)
    valid = np.isfinite(windows)
    codes = np.sum(valid * (1 << np.arange(9)), axis=-1)
    # Subtract the centre to avoid cancellation for a constant offset.
    centred = np.where(valid, windows - windows[..., 4, None], 0)
    slopes = np.einsum("...ij,...j->...i", _plane_weights()[codes], centred)
    return np.hypot(slopes[..., 0] / dx, slopes[..., 1] / dy)


def native_pixel_metres(transform, rows):
    """WGS84 centre-to-centre axis distances; local tangent approximation per row."""
    if transform.b != 0 or transform.d != 0 or transform.a <= 0 or transform.e >= 0:
        raise ValueError("Only an unrotated north-up geographic grid is supported")
    lat = transform.f + (np.asarray(rows) + 0.5) * transform.e
    lon = np.full_like(lat, transform.c + transform.a / 2, dtype="float64")
    dx = GEOD.inv(lon - transform.a / 2, lat, lon + transform.a / 2, lat)[2]
    dy = GEOD.inv(lon, lat + transform.e / 2, lon, lat - transform.e / 2)[2]
    return np.asarray(dx)[:, None], np.asarray(dy)[:, None]


def payne_candidate(values_mm_year, *, pixel_width_m, duration_years, enabled=False):
    """Research-only beta candidate on a metric square grid, never a hazard class."""
    if not enabled:
        raise ValueError("Experimental angular-distortion flag is disabled")
    if not np.isfinite(duration_years) or duration_years <= 0:
        raise ValueError("An explicit positive duration in years is required")
    displacement_m = np.asarray(values_mm_year, dtype="float64") * duration_years / 1000
    return plane_gradient(displacement_m, pixel_width_m, pixel_width_m)
