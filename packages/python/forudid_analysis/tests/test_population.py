import numpy as np
import pytest
from rasterio.io import MemoryFile
from rasterio.transform import from_origin

from forudid_analysis.population import population_exposure


def test_population_conservation_shifted_grids_and_missing_data():
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
