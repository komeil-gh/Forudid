import numpy as np
import pytest
from rasterio.io import MemoryFile
from rasterio.transform import from_origin

from forudid_analysis import population, population_v2


@pytest.mark.parametrize(
    "population_exposure", [population.population_exposure, population_v2.population_exposure]
)
def test_population_conservation_shifted_grids_and_missing_data(population_exposure):
    with MemoryFile() as pop_file, MemoryFile() as rate_file:
        with pop_file.open(
            driver="GTiff",
            width=2,
            height=2,
            count=1,
            dtype="float32",
            crs="EPSG:4326",
            transform=from_origin(50, 32, 1, 1),
            nodata=-999,
        ) as writer:
            writer.write(np.array([[100, 200], [300, 400]], dtype="float32"), 1)
        with rate_file.open(
            driver="GTiff",
            width=5,
            height=5,
            count=1,
            dtype="float32",
            crs="EPSG:4326",
            transform=from_origin(49.75, 32.25, 0.5, 0.5),
            nodata=-999,
        ) as writer:
            writer.write(np.full((5, 5), 10, dtype="float32"), 1)
        with pop_file.open() as pop, rate_file.open() as rate:
            result = population_exposure(
                pop,
                rate,
                population_unit="people/pixel",
                velocity_unit="cm/year",
                band_edges_mm_year=(50, 100),
            )
            assert result["estimated_total"] == 1000
            assert result["estimated_valid_coverage"] == pytest.approx(1000, abs=1e-8)
            assert result["estimated_by_numeric_band"] == pytest.approx([0, 0, 1000], abs=1e-8)
            assert result["hazard_population"] is None
            from shapely.geometry import Polygon, box

            clipped = population_exposure(
                pop,
                rate,
                population_unit="people/pixel",
                velocity_unit="cm/year",
                band_edges_mm_year=(50, 100),
                region=box(50.25, 30, 51.25, 32),
            )
            assert clipped["estimated_total"] == pytest.approx(450, abs=1e-7)
            assert clipped["estimated_valid_coverage"] == pytest.approx(450, abs=1e-7)
            assert clipped["region"]["coverage_fraction"] == pytest.approx(1, abs=1e-9)
            assert clipped["region"]["mean_mm_year"] == pytest.approx(100)
            # A diagonal cut and a narrow hole must conserve counts across complementary regions.
            triangle = Polygon([(50, 30), (52, 30), (50, 32), (50, 30)])
            hole = box(50.49, 30.7, 50.51, 30.9)
            region_a = triangle.difference(hole)
            region_b = box(50, 30, 52, 32).difference(region_a)
            results = [
                population_exposure(
                    pop,
                    rate,
                    population_unit="people/pixel",
                    velocity_unit="cm/year",
                    band_edges_mm_year=(50, 100),
                    region=region,
                )
                for region in (region_a, region_b)
            ]
            assert sum(r["estimated_total"] for r in results) == pytest.approx(1000, abs=1e-6)
            for r in results:
                assert r["estimated_valid_coverage"] == pytest.approx(
                    r["estimated_total"], abs=1e-6
                )
            outside_population = population_exposure(
                pop,
                rate,
                population_unit="people/pixel",
                velocity_unit="cm/year",
                band_edges_mm_year=(50, 100),
                region=box(49.8, 30, 49.9, 32),
            )
            assert outside_population["estimated_total"] == 0
            assert outside_population["region"]["coverage_fraction"] == pytest.approx(1, abs=1e-9)
            with pytest.raises(ValueError, match="population counts"):
                population_exposure(
                    pop,
                    rate,
                    population_unit="people/km2",
                    velocity_unit="cm/year",
                    band_edges_mm_year=(50,),
                )
    with MemoryFile() as pop_file, MemoryFile() as rate_file:
        for file, data in ((pop_file, [[0, 200], [300, 400]]), (rate_file, [[0, -999], [10, 20]])):
            with file.open(
                driver="GTiff",
                width=2,
                height=2,
                count=1,
                dtype="float32",
                crs="EPSG:4326",
                transform=from_origin(50, 32, 1, 1),
                nodata=-999,
            ) as writer:
                writer.write(np.array(data, dtype="float32"), 1)
        with pop_file.open() as pop, rate_file.open() as rate:
            result = population_exposure(
                pop,
                rate,
                population_unit="people/pixel",
                velocity_unit="cm/year",
                band_edges_mm_year=(50, 150),
            )
            assert result["estimated_total"] == 900
            assert result["estimated_valid_coverage"] == pytest.approx(700)
            assert result["estimated_without_deformation_data"] == pytest.approx(200)
            assert result["estimated_by_numeric_band"] == pytest.approx([0, 300, 400])


def test_version_two_keeps_exact_signed_rates_above_legacy_quantile_limit():
    from shapely.geometry import box

    with MemoryFile() as pop_file, MemoryFile() as rate_file:
        for file, values, step in (
            (pop_file, np.array([[1000.0]]), 0.32),
            (rate_file, np.linspace(-0.1, 0.02, 320 * 320).reshape(320, 320), 0.001),
        ):
            with file.open(
                driver="GTiff",
                width=values.shape[1],
                height=values.shape[0],
                count=1,
                dtype="float64",
                crs="EPSG:4326",
                transform=from_origin(51, 36, step, step),
            ) as writer:
                writer.write(values, 1)
        with pop_file.open() as pop, rate_file.open() as rate:
            args = dict(
                population_unit="people/pixel",
                velocity_unit="m/year",
                band_edges_mm_year=(-100, -50, 0, 25),
                region=box(51, 35.68, 51.32, 36),
            )
            with pytest.raises(ValueError, match="100000 distinct-value"):
                population.population_exposure(pop, rate, **args)
            result = population_v2.population_exposure(pop, rate, **args)
            assert result["method_version"] == "ellipsoid-cell-overlap-2"
            assert result["estimated_valid_coverage"] == pytest.approx(1000, abs=1e-6)
            assert result["estimated_by_numeric_band"][1] > 0
            assert result["estimated_by_numeric_band"][3] > 0
            assert result["region"]["maximum_mm_year"] == 20
            values = rate.read(1) * 1000
            _, north = population_v2.EQUAL_AREA.transform(
                np.full(320, 51), 36 - np.arange(320) * 0.001
            )
            _, south = population_v2.EQUAL_AREA.transform(
                np.full(320, 51), 36 - (np.arange(320) + 1) * 0.001
            )
            weights = np.repeat(north - south, 320)
            cumulative = np.cumsum(weights)
            assert (
                result["region"]["median_mm_year"]
                == values.flat[np.searchsorted(cumulative, cumulative[-1] * 0.5)]
            )
            assert (
                result["region"]["p95_mm_year"]
                == values.flat[np.searchsorted(cumulative, cumulative[-1] * 0.95)]
            )
