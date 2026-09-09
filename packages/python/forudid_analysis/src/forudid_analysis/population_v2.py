"""Conservative count allocation between north-up WGS84 grids."""

import numpy as np
import shapely
from pyproj import Transformer
from rasterio.features import rasterize
from rasterio.io import DatasetReader
from shapely.geometry import mapping
from shapely.ops import transform as project_geometry

from forudid_analysis import GEOD

METHOD_VERSION = "ellipsoid-cell-overlap-2"
REGION_MAX_SEGMENT_DEGREES = 0.002
EQUAL_AREA = Transformer.from_crs("EPSG:4326", "EPSG:6933", always_xy=True)


def _latitude_area(latitude):
    """Ellipsoidal surface-area primitive for a strip bounded by parallels."""
    e = np.sqrt(GEOD.es)
    sine = np.sin(np.deg2rad(latitude))
    return sine / (2 * (1 - GEOD.es * sine**2)) + np.arctanh(e * sine) / (2 * e)


def _projected_boxes(west, south, east, north):
    x0, y0 = EQUAL_AREA.transform(west, south)
    x1, y1 = EQUAL_AREA.transform(east, north)
    return shapely.box(x0, y0, x1, y1)


def _region_grid(region, projected, transform, height, width):
    """Full cells use a mask; only intersected boundary cells need polygon clipping."""
    shape = (height, width)
    fractions = rasterize([(mapping(region), 1)], out_shape=shape, transform=transform).astype(
        float
    )
    boundary = rasterize(
        [(mapping(region.boundary), 1)], out_shape=shape, transform=transform, all_touched=True
    ).astype(bool)
    ys, xs = np.nonzero(boundary)
    if len(ys):
        west, north = transform.c + xs * transform.a, transform.f + ys * transform.e
        boxes = _projected_boxes(west, north + transform.e, west + transform.a, north)
        fractions[ys, xs] = np.clip(
            shapely.area(shapely.intersection(boxes, projected)) / shapely.area(boxes), 0, 1
        )
    return fractions, (ys, xs)


def _windows(raster, region):
    r0, r1, c0, c1 = 0, raster.height, 0, raster.width
    if region is not None:
        west, south, east, north = region.bounds
        t = raster.transform
        r0, r1 = (
            max(0, int(np.floor((north - t.f) / t.e))),
            min(r1, int(np.ceil((south - t.f) / t.e))),
        )
        c0, c1 = (
            max(0, int(np.floor((west - t.c) / t.a))),
            min(c1, int(np.ceil((east - t.c) / t.a))),
        )
    for row in range(r0, r1, 512):
        for col in range(c0, c1, 512):
            yield row, col, min(512, r1 - row), min(512, c1 - col)


def population_exposure(
    population: DatasetReader,
    velocity: DatasetReader,
    *,
    population_unit: str,
    velocity_unit: str,
    band_edges_mm_year: tuple[float, ...],
    region=None,
) -> dict:
    """Allocate counts by cell-overlap area, assuming uniform density per source cell."""
    if population_unit != "people/pixel" or velocity_unit not in ("cm/year", "mm/year", "m/year"):
        raise ValueError("Expected population counts and an explicit velocity unit")
    for raster, unit in ((population, population_unit), (velocity, velocity_unit)):
        if raster.crs is None or raster.crs.to_epsg() != 4326 or raster.count != 1:
            raise ValueError("Expected single-band WGS84 rasters")
        if (
            raster.transform.b
            or raster.transform.d
            or raster.transform.a <= 0
            or raster.transform.e >= 0
        ):
            raise ValueError("Expected north-up rasters without rotation")
        if raster.bounds.bottom <= -90 or raster.bounds.top >= 90:
            raise ValueError("Polar grids require a separately validated area method")
        if raster.tags(1).get("UNITS", unit) != unit:
            raise ValueError("Raster metadata and declared units disagree")
    if population.scales != (1.0,) or population.offsets != (0.0,):
        raise ValueError("Population counts require explicit unscaled values")
    p, v = population.transform, velocity.transform
    if v.a > p.a or abs(v.e) > abs(p.e):
        raise ValueError("Population grid must not be finer than the velocity grid")
    edges = np.asarray(band_edges_mm_year, dtype=float)
    if (
        not edges.size
        or edges.ndim != 1
        or not np.isfinite(edges).all()
        or (np.diff(edges) <= 0).any()
    ):
        raise ValueError("Band edges must be finite and strictly increasing")
    projected = None
    if region is not None:
        if (
            region.geom_type not in ("Polygon", "MultiPolygon")
            or region.is_empty
            or not region.is_valid
        ):
            raise ValueError("A valid nonempty WGS84 polygon is required")
        west, south, east, north = region.bounds
        if east - west >= 180 or south <= -86 or north >= 86:
            raise ValueError("Region exceeds the supported nonpolar non-antimeridian domain")
        projected = project_geometry(
            EQUAL_AREA.transform, shapely.segmentize(region, REGION_MAX_SEGMENT_DEGREES)
        )
        if not projected.is_valid:
            raise ValueError("Projected regional boundary is invalid")
    total = 0.0
    for row, col, height, width in _windows(population, region):
        window = ((row, row + height), (col, col + width))
        data = population.read(1, window=window, masked=True)
        values = data.compressed()
        if not np.isfinite(values).all() or (values < 0).any():
            raise ValueError("Population counts must be finite and nonnegative")
        if region is None:
            total += float(values.sum(dtype=np.float64))
        else:
            fractions, _ = _region_grid(
                region, projected, population.window_transform(window), height, width
            )
            total += float((data.filled(0).astype(np.float64) * fractions).sum())
    bins = np.zeros(len(edges) + 1, dtype=np.float64)
    inside_extent = 0.0
    factor = {"cm/year": 10, "mm/year": 1, "m/year": 1000}[velocity_unit]
    area_histogram = {}
    for row, col, height, width in _windows(velocity, region):
        north = v.f + (row + np.arange(height)) * v.e
        south = north + v.e
        first_row = np.floor((p.f - north) / abs(p.e)).astype(int)
        y_choices = []
        for shift in (0, 1):
            indexes = first_row + shift
            source_north = p.f + indexes * p.e
            source_south = source_north + p.e
            overlap_north = np.minimum(north, source_north)
            overlap_south = np.maximum(south, source_south)
            fraction = np.maximum(
                0,
                (_latitude_area(overlap_north) - _latitude_area(overlap_south))
                / (_latitude_area(source_north) - _latitude_area(source_south)),
            )
            fraction[(indexes < 0) | (indexes >= population.height)] = 0
            y_choices.append((np.clip(indexes, 0, population.height - 1), fraction))
        if region is None and not any(np.any(fraction > 0) for _, fraction in y_choices):
            continue
        west = v.c + (col + np.arange(width)) * v.a
        east = west + v.a
        first_col = np.floor((west - p.c) / p.a).astype(int)
        x_choices = []
        for shift in (0, 1):
            indexes = first_col + shift
            source_west = p.c + indexes * p.a
            fraction = (
                np.maximum(0, np.minimum(east, source_west + p.a) - np.maximum(west, source_west))
                / p.a
            )
            fraction[(indexes < 0) | (indexes >= population.width)] = 0
            x_choices.append((np.clip(indexes, 0, population.width - 1), fraction))
        if region is None and not any(np.any(fraction > 0) for _, fraction in x_choices):
            continue
        r0 = min(int(i.min()) for i, _ in y_choices)
        r1 = max(int(i.max()) for i, _ in y_choices) + 1
        c0 = min(int(i.min()) for i, _ in x_choices)
        c1 = max(int(i.max()) for i, _ in x_choices) + 1
        counts = population.read(1, window=((r0, r1), (c0, c1)), masked=True).filled(0)
        allocated = np.zeros((height, width), dtype=np.float64)
        window = ((row, row + height), (col, col + width))
        fractions, boundary = (
            (None, None)
            if region is None
            else _region_grid(region, projected, velocity.window_transform(window), height, width)
        )
        for ys, fy in y_choices:
            for xs, fx in x_choices:
                weights = fy[:, None] * fx[None, :]
                if fractions is not None:
                    weights = weights * (fractions > 0)
                    by, bx = boundary
                    if len(by):
                        source_west, source_north = p.c + xs[bx] * p.a, p.f + ys[by] * p.e
                        ow, oe = (
                            np.maximum(west[bx], source_west),
                            np.minimum(east[bx], source_west + p.a),
                        )
                        os, on = (
                            np.maximum(south[by], source_north + p.e),
                            np.minimum(north[by], source_north),
                        )
                        overlap = (oe > ow) & (on > os) & (fy[by] > 0) & (fx[bx] > 0)
                        weights[by, bx] = 0
                        if overlap.any():
                            boxes = _projected_boxes(
                                ow[overlap], os[overlap], oe[overlap], on[overlap]
                            )
                            source_boxes = _projected_boxes(
                                source_west[overlap],
                                source_north[overlap] + p.e,
                                source_west[overlap] + p.a,
                                source_north[overlap],
                            )
                            weights[by[overlap], bx[overlap]] = np.clip(
                                shapely.area(shapely.intersection(boxes, projected))
                                / shapely.area(source_boxes),
                                0,
                                1,
                            )
                allocated += counts[np.ix_(ys - r0, xs - c0)] * weights
        inside_extent += float(allocated.sum())
        data = velocity.read(1, window=((row, row + height), (col, col + width)), masked=True)
        values = (data.data.astype(np.float64) * velocity.scales[0] + velocity.offsets[0]) * factor
        valid = ~np.ma.getmaskarray(data) & np.isfinite(values)
        classes = np.searchsorted(edges, values[valid], side="right")
        bins += np.bincount(classes, weights=allocated[valid], minlength=len(bins))
        if fractions is not None:
            row_area = (
                GEOD.a**2
                * (1 - GEOD.es)
                * np.deg2rad(v.a)
                * (_latitude_area(north) - _latitude_area(south))
            )
            weights = fractions * row_area[:, None]
            selected = valid & (weights > 0)
            unique, inverse = np.unique(values[selected], return_inverse=True)
            areas = np.bincount(inverse, weights=weights[selected])
            for value, area in zip(unique, areas, strict=True):
                area_histogram[float(value)] = area_histogram.get(float(value), 0.0) + float(area)
            if len(area_histogram) > 500000:
                raise ValueError("Regional exact quantiles exceed the 500000 distinct-value limit")
    valid_population = float(bins.sum())
    tolerance = max(total * 1e-9, 1e-7)
    if valid_population > inside_extent + tolerance or inside_extent > total + tolerance:
        raise ValueError("Population mass conservation failed")
    result = {
        "method_version": METHOD_VERSION,
        "population_unit": "people/pixel",
        "velocity_unit": "mm/year",
        "estimated_total": total,
        "estimated_valid_coverage": valid_population,
        "estimated_without_deformation_data": max(0.0, total - valid_population),
        "estimated_outside_deformation_extent": max(0.0, total - inside_extent),
        "coverage_fraction": min(1.0, valid_population / total) if total else None,
        "estimated_by_numeric_band": bins.tolist(),
        "band_edges_mm_year": edges.tolist(),
        "hazard_population": None,
        "allocation_assumption": "uniform population density within each native population cell",
        "alignment_method": "ellipsoid-area cell overlap; no population interpolation",
        "mass_balance_tolerance_people": tolerance,
    }

    if projected is not None:
        values = np.array(sorted(area_histogram))
        areas = np.array([area_histogram[x] for x in values])
        valid_area = float(areas.sum())
        cumulative = np.cumsum(areas)
        result["region"] = {
            "area_m2": float(projected.area),
            "valid_deformation_area_m2": valid_area,
            "coverage_fraction": valid_area / projected.area,
            "mean_mm_year": float(np.dot(values, areas) / valid_area) if valid_area else None,
            "median_mm_year": float(values[np.searchsorted(cumulative, valid_area * 0.5)])
            if valid_area
            else None,
            "p95_mm_year": float(values[np.searchsorted(cumulative, valid_area * 0.95)])
            if valid_area
            else None,
            "maximum_mm_year": float(values[-1]) if valid_area else None,
            "boundary_projection": "EPSG:6933; WGS84 edges densified before projection",
            "boundary_max_segment_degrees": REGION_MAX_SEGMENT_DEGREES,
            "area_weighted": True,
        }
    return result
