"""Experimental temporal screening; no operational thresholds or publication side effects."""

import hashlib
import json
from dataclasses import asdict, dataclass

import numpy as np
from pyproj import Geod
from rasterio.features import shapes
from rasterio.transform import Affine
from shapely.geometry import MultiPolygon, Polygon, shape
from shapely.geometry.polygon import orient

METHOD = "robust-harmonic-window-1"
CLUSTER_METHOD = "connected-four-1"
ASSOCIATION_METHOD = "continuity-gates-1"
YEAR_DAYS = 365.25


@dataclass(frozen=True)
class TrendProfile:
    version: str
    window_days: float
    min_observations: int
    min_span_days: float
    max_gap_days: float
    seasonal_period_days: float
    noise_floor_mm: float
    slope_change_mm_year: float
    minimum_statistic: float
    huber_delta: float

    def __post_init__(self):
        if not self.version or len(self.version) > 100:
            raise ValueError("A versioned profile is required")
        for name, value in asdict(self).items():
            if name != "version" and (not np.isfinite(value) or value <= 0):
                raise ValueError(f"{name} must be finite and positive")
        if not isinstance(self.min_observations, int) or self.min_observations < 6:
            raise ValueError("At least six observations per four-parameter fit are required")
        if not self.seasonal_period_days <= self.min_span_days < self.window_days:
            raise ValueError("Each window must span at least one seasonal cycle")


def _fit(days, values, profile):
    t = days - days[0]
    phase = 2 * np.pi * t / profile.seasonal_period_days
    design = np.column_stack((np.ones(len(t)), t / YEAR_DAYS, np.sin(phase), np.cos(phase)))
    weights, previous = np.ones(len(t)), None
    for _ in range(60):
        root = np.sqrt(weights)
        coefficients, _, rank, singular = np.linalg.lstsq(
            design * root[:, None], values * root, rcond=None
        )
        if rank < 4 or singular[0] / singular[-1] > 1e8:
            return None
        residual = values - design @ coefficients
        scale = max(
            profile.noise_floor_mm,
            1.482602218505602 * float(np.median(np.abs(residual - np.median(residual)))),
        )
        if previous is not None and np.max(np.abs(coefficients - previous)) < 1e-8:
            return float(coefficients[1]), scale
        previous = coefficients
        weights = np.minimum(1, profile.huber_delta * scale / np.maximum(np.abs(residual), 1e-12))
    return None


def screen_series(
    days, displacement_mm, available_days, *, as_of_day: float, profile: TrendProfile
):
    """Two adjacent trailing windows, with no interpolation or access to future releases.

    Day values share a fixed epoch. Input must already have one declared component,
    unit, spatial reference and reference epoch; incompatible sources cannot be pooled.
    """
    times, values, available = (
        np.asarray(v, dtype=float) for v in (days, displacement_mm, available_days)
    )
    if times.ndim != 1 or values.shape != times.shape or available.shape != times.shape:
        raise ValueError("Expected equally sized one-dimensional series")
    if len(times) > 4096:
        raise ValueError("Screening is bounded to 4096 epochs per series")
    if (
        not np.isfinite(as_of_day)
        or not np.all(np.isfinite(times))
        or not np.all(np.isfinite(available))
        or np.any(np.isinf(values))
        or np.any(np.diff(times) <= 0)
        or np.any(available < times)
    ):
        raise ValueError(
            "Times must increase, availability cannot precede observation, and infinity is invalid"
        )
    profile_json = json.dumps(asdict(profile), sort_keys=True, allow_nan=False)
    result = {
        "method": METHOD,
        "profile": asdict(profile),
        "profile_sha256": hashlib.sha256(profile_json.encode()).hexdigest(),
        "scientific_status": "experimental",
        "as_of_day": as_of_day,
        "candidate": False,
        "reason": "insufficient_support",
        "candidate_day": None,
        "direction": None,
        "slope_change_mm_year": None,
        "statistic": None,
        "support": {},
    }
    usable = (available <= as_of_day) & (times <= as_of_day) & np.isfinite(values)
    times, values = times[usable], values[usable]
    if not len(times):
        return result
    end = times[-1]
    if as_of_day - end > profile.max_gap_days:
        return result | {"reason": "stale_series"}
    selected = times > end - 2 * profile.window_days
    times, values = times[selected], values[selected]
    if len(times) < 2 or np.max(np.diff(times)) > profile.max_gap_days:
        return result | {"reason": "observation_gap"}
    recent = times > end - profile.window_days
    fits, spans = [], []
    for label, mask in (("previous", ~recent), ("current", recent)):
        t, y = times[mask], values[mask]
        span = float(t[-1] - t[0]) if len(t) else 0
        result["support"][label] = {"observations": len(t), "span_days": span}
        if len(t) < profile.min_observations or span < profile.min_span_days:
            return result
        fit = _fit(t, y, profile)
        if fit is None:
            return result | {"reason": "fit_unresolved"}
        fits.append(fit)
        spans.append(span)
    previous, current = fits
    change = current[0] - previous[0]
    # A screening ratio, not a standard error, probability or calibrated confidence.
    statistic = abs(change) / (YEAR_DAYS * (previous[1] / spans[0] + current[1] / spans[1]))
    candidate = (
        abs(change) >= profile.slope_change_mm_year and statistic >= profile.minimum_statistic
    )
    return result | {
        "candidate": bool(candidate),
        "reason": "slope_change" if candidate else "below_profile_threshold",
        "candidate_day": float(times[recent][0]) if candidate else None,
        "direction": ("increasing" if change > 0 else "decreasing") if candidate else None,
        "slope_change_mm_year": change,
        "previous_velocity_mm_year": previous[0],
        "current_velocity_mm_year": current[0],
        "statistic": statistic,
        "observed_through_day": float(end),
    }


def _area(geometry):
    geod = Geod(ellps="WGS84")
    if geometry.is_empty:
        return 0.0
    if geometry.geom_type == "Polygon":
        return abs(geod.geometry_area_perimeter(orient(geometry))[0])
    if geometry.geom_type in ("MultiPolygon", "GeometryCollection"):
        return sum(_area(part) for part in geometry.geoms)
    return 0.0


def cluster_candidates(mask, transform: Affine, *, minimum_pixels: int):
    """Four-connected polygons on one bounded, axis-aligned WGS84 tile."""
    mask = np.asarray(mask)
    if mask.ndim != 2 or mask.dtype != np.bool_ or mask.size > 1_000_000:
        raise ValueError("Expected a boolean tile of at most one million pixels")
    if not isinstance(minimum_pixels, int) or minimum_pixels < 1:
        raise ValueError("minimum_pixels must be a positive integer")
    if (
        not np.all(np.isfinite(tuple(transform)))
        or transform.b != 0
        or transform.d != 0
        or transform.a <= 0
        or transform.e >= 0
    ):
        raise ValueError("Expected a north-up WGS84 grid")
    west, north = transform * (0, 0)
    east, south = transform * (mask.shape[1], mask.shape[0])
    if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
        raise ValueError("Tile must be within WGS84 bounds without crossing the antimeridian")
    result = []
    for geometry, _ in shapes(mask.astype("uint8"), mask=mask, transform=transform, connectivity=4):
        polygon = shape(geometry)
        if not isinstance(polygon, Polygon):
            raise ValueError("Connected component did not produce a polygon")
        pixels = round(polygon.area / abs(transform.a * transform.e))
        if pixels >= minimum_pixels:
            result.append(
                {
                    "geometry": MultiPolygon([polygon]),
                    "pixel_count": pixels,
                    "area_m2": _area(polygon),
                    "method": CLUSTER_METHOD,
                    "touches_tile_edge": any(
                        abs(a - b) < 1e-10
                        for a, b in zip(polygon.bounds, (west, south, east, north), strict=True)
                    ),
                }
            )
    return result


@dataclass(frozen=True)
class AssociationProfile:
    version: str
    minimum_iou: float
    maximum_centroid_distance_m: float
    maximum_gap_days: float
    maximum_velocity_difference_mm_year: float

    def __post_init__(self):
        if not self.version or not 0 < self.minimum_iou <= 1:
            raise ValueError("Version and positive IoU in (0, 1] are required")
        for name, value in asdict(self).items():
            if name != "version" and (not np.isfinite(value) or value <= 0):
                raise ValueError(f"{name} must be finite and positive")


def associate(candidate, existing, *, profile: AssociationProfile):
    """Return one identity only for an unambiguous continuity match; splits/merges need review."""
    if len(existing) > 1000:
        raise ValueError("Prefilter existing events spatially before association")
    identities = [event["id"] for event in existing]
    if len(set(identities)) != len(identities):
        raise ValueError("Existing event identities must be unique")
    for record in [candidate, *existing]:
        geometry = record["geometry"]
        if geometry.geom_type != "MultiPolygon" or geometry.is_empty or not geometry.is_valid:
            raise ValueError("Expected valid nonempty MultiPolygon geometry")
        w, s, e, n = geometry.bounds
        if not (-180 <= w <= e <= 180 and -90 <= s <= n <= 90) or e - w > 180:
            raise ValueError("Unsupported WGS84 extent")
        if not np.isfinite(record["observed_day"]):
            raise ValueError("Observation day must be finite")
        if record["velocity_mm_year"] is not None and not np.isfinite(record["velocity_mm_year"]):
            raise ValueError("Velocity must be finite or unavailable")
    matches = []
    geod = Geod(ellps="WGS84")
    for event in existing:
        if (
            candidate["component"] != event["component"]
            or candidate["reference_id"] != event["reference_id"]
            or candidate["velocity_mm_year"] is None
            or event["velocity_mm_year"] is None
            or not 0
            <= candidate["observed_day"] - event["observed_day"]
            <= profile.maximum_gap_days
            or abs(candidate["velocity_mm_year"] - event["velocity_mm_year"])
            > profile.maximum_velocity_difference_mm_year
        ):
            continue
        a, b = candidate["geometry"], event["geometry"]
        overlap = a.intersection(b)
        intersection = (
            _area(overlap)
            if overlap.geom_type in ("Polygon", "MultiPolygon", "GeometryCollection")
            else 0
        )
        union = _area(a) + _area(b) - intersection
        iou = intersection / union if union else 0
        distance = geod.inv(a.centroid.x, a.centroid.y, b.centroid.x, b.centroid.y)[2]
        if iou >= profile.minimum_iou and distance <= profile.maximum_centroid_distance_m:
            matches.append({"event_id": event["id"], "iou": iou, "centroid_distance_m": distance})
    return {
        "method": ASSOCIATION_METHOD,
        "profile": asdict(profile),
        "status": "matched" if len(matches) == 1 else "ambiguous" if matches else "new_candidate",
        "event_id": matches[0]["event_id"] if len(matches) == 1 else None,
        "matches": matches,
    }
