import numpy as np
import pytest
from rasterio.transform import from_origin

from forudid_analysis.gradient import native_pixel_metres, payne_candidate, plane_gradient


def test_plane_missing_data_metric_units_and_resolution():
    y, x = np.mgrid[:9, :9]
    for pixel in (50, 100):
        plane = 1000 + 0.03 * x * pixel - 0.04 * y * pixel
        assert plane_gradient(plane, pixel, pixel) == pytest.approx(np.full((7, 7), 0.05))
        assert plane_gradient(np.zeros((9, 9)), pixel, pixel) == pytest.approx(np.zeros((7, 7)))
        assert payne_candidate(
            plane, pixel_width_m=pixel, duration_years=8, enabled=True
        ) == pytest.approx(np.full((7, 7), 0.0004))
    plane[4, 4] = np.nan
    result = plane_gradient(plane, 100, 100)
    assert np.isnan(result[3, 3])
    assert result[3, 2] == pytest.approx(0.05)
    sparse = np.full((3, 3), np.nan)
    sparse[1] = [1, 2, 3]
    assert np.isnan(plane_gradient(sparse, 100, 100)[0, 0])
    sparse[0, 1] = 2
    assert plane_gradient(sparse, 100, 100)[0, 0] == pytest.approx(0.01)
    with pytest.raises(ValueError, match="flag"):
        payne_candidate(plane, pixel_width_m=100, duration_years=8)
    for size in (0, -1, float("nan")):
        with pytest.raises(ValueError, match="positive finite"):
            plane_gradient(plane, size, 100)
    with pytest.raises(ValueError, match="duration"):
        payne_candidate(plane, pixel_width_m=100, duration_years=float("nan"), enabled=True)
    dx, dy = native_pixel_metres(from_origin(50, 36, 0.001, 0.001), np.arange(7))
    assert np.all((dx > 90) & (dx < 91)) and np.all((dy > 110) & (dy < 112))
    assert plane_gradient(0.03 * x + 0.04 * y, dx, dy) == pytest.approx(
        np.broadcast_to(np.hypot(0.03 / dx, 0.04 / dy), (7, 7))
    )


def test_bowl_gradient_is_analytic_and_block_halos_agree():
    y, x = np.mgrid[-5:6, -5:6]
    bowl = (x * 100) ** 2 / 10000 + (y * 100) ** 2 / 20000
    expected = np.hypot(x[1:-1, 1:-1] / 50, y[1:-1, 1:-1] / 100)
    whole = plane_gradient(bowl, 100, 100)
    assert whole == pytest.approx(expected, abs=1e-14)
    assert plane_gradient(bowl[:7, :7], 100, 100) == pytest.approx(whole[:5, :5])
