"""Native-grid, length-weighted descriptive exposure calculations."""

import math
from functools import lru_cache
from typing import Any

import numpy as np
from pyproj import Geod, Transformer
from rasterio.io import DatasetReader
from shapely.geometry import LineString, mapping

GEOD = Geod(ellps="WGS84")
METHOD_VERSION = "geodesic-midpoint-1"


@lru_cache(maxsize=8)
def _transformer(source: str, target: str) -> Transformer:
    return Transformer.from_crs(source, target, always_xy=True)


@lru_cache(maxsize=8)
def pixel_width_m(raster: DatasetReader) -> float:
    """Conservative width from both pixel axes at nine locations on the native grid."""
    if raster.crs is None:
        raise ValueError("A scientific raster must declare its CRS")
    to_wgs84 = _transformer(raster.crs.to_wkt(), "EPSG:4326")
    widths = []
    for row in (0, raster.height // 2, raster.height - 1):
        for col in (0, raster.width // 2, raster.width - 1):
            x, y = raster.xy(row, col)
            lon, lat = to_wgs84.transform(x, y)
            for dx, dy in (
                (raster.transform.a, raster.transform.d),
                (raster.transform.b, raster.transform.e),
            ):
                end_lon, end_lat = to_wgs84.transform(x + dx, y + dy)
                widths.append(GEOD.inv(lon, lat, end_lon, end_lat)[2])
    if not all(math.isfinite(width) and width > 0 for width in widths):
        raise ValueError("Grid has no usable physical pixel width")
    return min(widths)


def line_exposure(
    raster: DatasetReader,
    coordinates: list[tuple[float, float]],
    *,
    unit: str,
    band_edges_mm_year: tuple[float, ...],
    spacing_fraction: float = 0.5,
) -> dict[str, Any]:
    """Sample interval midpoints without interpolating pixels or crossing NoData gaps.

    Input coordinates are WGS84 longitude/latitude. Values and descriptive bands
    are returned in mm/year. Bands are numeric bins, never structural hazard classes.
    """
    if unit not in ("cm/year", "mm/year", "m/year") or raster.count != 1:
        raise ValueError("Expected a single-band velocity raster with an explicit supported unit")
    declared_unit = raster.tags(1).get("UNITS")
    if declared_unit is not None and declared_unit != unit:
        raise ValueError("Raster metadata and requested unit disagree")
    if not math.isfinite(spacing_fraction) or not 0 < spacing_fraction <= 0.5:
        raise ValueError("Sampling fraction must be positive and no greater than half a pixel")
    edges = np.asarray(band_edges_mm_year, dtype=float)
    if edges.ndim != 1 or not np.isfinite(edges).all() or (np.diff(edges) <= 0).any():
        raise ValueError("Descriptive band edges must be finite and strictly increasing")
    coords = np.asarray(coordinates, dtype=float)
    if (
        coords.ndim != 2
        or coords.shape[1] != 2
        or len(coords) < 2
        or not np.isfinite(coords).all()
        or (np.abs(coords[:, 0]) > 180).any()
        or (np.abs(coords[:, 1]) >= 90).any()
    ):
        raise ValueError("Expected finite WGS84 line coordinates away from the poles")
    coords = coords[np.r_[True, np.any(np.diff(coords, axis=0) != 0, axis=1)]]
    if (np.abs(np.diff(coords[:, 0])) > 180).any():
        raise ValueError("Split routes explicitly at the antimeridian")
    if len(coords) < 2 or not LineString(coords).is_valid:
        raise ValueError("Asset geometry is empty, degenerate or invalid")
    azimuth, _, distances = GEOD.inv(coords[:-1, 0], coords[:-1, 1], coords[1:, 0], coords[1:, 1])
    distances = np.asarray(distances)
    if not np.isfinite(distances).all() or (distances <= 0).any():
        raise ValueError("Asset has a non-positive geodesic segment")
    cumulative = np.r_[0.0, np.cumsum(distances)]
    total = float(cumulative[-1])
    width = pixel_width_m(raster)
    spacing = width * spacing_fraction
    if total / spacing > 200_000:
        raise ValueError("Asset exceeds the per-feature sample budget; split the route explicitly")
    starts = np.arange(0.0, total, spacing)
    boundaries = np.r_[starts[starts < total], total]
    weights = np.diff(boundaries)
    midpoint = boundaries[:-1] + weights / 2

    def locate(chainages: np.ndarray) -> np.ndarray:
        indexes = np.minimum(
            np.searchsorted(cumulative, chainages, side="right") - 1, len(distances) - 1
        )
        lons, lats, _ = GEOD.fwd(
            coords[indexes, 0],
            coords[indexes, 1],
            np.asarray(azimuth)[indexes],
            chainages - cumulative[indexes],
        )
        return np.column_stack((lons, lats))

    positions = locate(midpoint)
    native = _transformer("EPSG:4326", raster.crs.to_wkt())
    xs, ys = native.transform(positions[:, 0], positions[:, 1])
    if not np.isfinite(xs).all() or not np.isfinite(ys).all():
        raise ValueError("Geometry cannot be transformed into the native raster CRS")
    to_wgs84 = _transformer(raster.crs.to_wkt(), "EPSG:4326")
    profile_widths = []
    for dx, dy in (
        (raster.transform.a, raster.transform.d),
        (raster.transform.b, raster.transform.e),
    ):
        east, north = to_wgs84.transform(np.asarray(xs) + dx, np.asarray(ys) + dy)
        profile_widths.extend(GEOD.inv(positions[:, 0], positions[:, 1], east, north)[2])
    minimum_profile_width = min(profile_widths)
    if (
        not all(math.isfinite(w) and w > 0 for w in profile_widths)
        or spacing > minimum_profile_width
    ):
        raise ValueError(
            "Grid distortion exceeds the sampling rule; use a smaller spacing fraction"
        )
    samples = raster.sample(zip(xs, ys, strict=True), indexes=1, masked=True)
    values = np.asarray([float(s[0]) if not np.ma.is_masked(s[0]) else np.nan for s in samples])
    values = (values * raster.scales[0] + raster.offsets[0]) * {
        "cm/year": 10,
        "m/year": 1000,
        "mm/year": 1,
    }[unit]
    valid = np.isfinite(values)
    valid_length = float(weights[valid].sum())
    classes = np.where(valid, np.searchsorted(edges, values, side="right"), -1)
    valid_values, valid_weights = values[valid], weights[valid]
    statistics: dict[str, Any] = {
        "mean_velocity": None,
        "median_velocity": None,
        "p05_velocity": None,
        "p95_velocity": None,
        "min_velocity": None,
        "max_velocity": None,
        "max_abs_velocity": None,
    }
    if valid_length:
        order = np.argsort(valid_values, kind="stable")
        sorted_values = valid_values[order]
        cumulative_weights = np.cumsum(valid_weights[order])
        for field, quantile in (
            ("p05_velocity", 0.05),
            ("median_velocity", 0.5),
            ("p95_velocity", 0.95),
        ):
            index = min(
                int(np.searchsorted(cumulative_weights, quantile * valid_length)),
                len(sorted_values) - 1,
            )
            statistics[field] = float(sorted_values[index])
        statistics.update(
            mean_velocity=float(np.dot(valid_values, valid_weights) / valid_length),
            min_velocity=float(valid_values.min()),
            max_velocity=float(valid_values.max()),
            max_abs_velocity=float(np.abs(valid_values).max()),
        )
    summary = {
        "total_length_m": total,
        "valid_length_m": valid_length,
        "nodata_length_m": float(weights[~valid].sum()),
        "coverage_fraction": valid_length / total,
        "coverage_status": "complete" if valid.all() else "partial" if valid.any() else "none",
        "band_lengths_m": [float(weights[classes == i].sum()) for i in range(len(edges) + 1)],
        **statistics,
    }
    profile = [
        {
            "chainage_m": float(midpoint[i]),
            "start_chainage_m": float(boundaries[i]),
            "end_chainage_m": float(boundaries[i + 1]),
            "lon": float(positions[i, 0]),
            "lat": float(positions[i, 1]),
            "velocity": float(values[i]) if valid[i] else None,
            "quality": "source_value" if valid[i] else "nodata",
            "uncertainty": None,
            "gradient_proxy": None,
            "angular_distortion": None,
            "hazard_class": None,
            "band_index": int(classes[i]) if valid[i] else None,
        }
        for i in range(len(midpoint))
    ]
    breaks = np.r_[0, np.flatnonzero(np.diff(classes) != 0) + 1, len(classes)]
    segments = []
    for start, stop in zip(breaks[:-1], breaks[1:], strict=True):
        a, b = float(boundaries[start]), float(boundaries[stop])
        internal = coords[(cumulative > a) & (cumulative < b)]
        endpoints = locate(np.array([a, b]))
        geometry = mapping(LineString(np.vstack((endpoints[0], internal, endpoints[1]))))
        segments.append(
            {
                "start_chainage_m": a,
                "end_chainage_m": b,
                "length_m": b - a,
                "band_index": int(classes[start]) if classes[start] >= 0 else None,
                "quality": "source_value" if classes[start] >= 0 else "nodata",
                "geometry": geometry,
                "hazard_class": None,
            }
        )
    return {
        "method_version": METHOD_VERSION,
        "unit": "mm/year",
        "source_unit": unit,
        "sample_spacing_m": spacing,
        "minimum_checked_pixel_width_m": width,
        "minimum_profile_pixel_width_m": float(minimum_profile_width),
        "sampling_rule": "geodesic interval midpoint; native containing pixel; no interpolation",
        "quantile_rule": "length-weighted inverse empirical CDF",
        "band_edges_mm_year": edges.tolist(),
        "band_boundary_rule": "lower inclusive, upper exclusive",
        "summary": summary,
        "profile": profile,
        "segments": segments,
    }
