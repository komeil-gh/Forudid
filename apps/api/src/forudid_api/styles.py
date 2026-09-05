import numpy as np

from forudid_api.db import Product
from forudid_api.schemas import Legend

# Versioned presentation ranges for fixtures; these are not scientific QC thresholds.
STYLES = {
    "velocity-default": (
        "velocity_los",
        [-0.1, -0.05, 0.0, 0.02],
        ["#9d2933", "#eb997d", "#f7f8f6", "#087c83"],
    ),
    "velocity-high-contrast": (
        "velocity_los",
        [-0.1, -0.05, 0.0, 0.02],
        ["#67001f", "#b2182b", "#f7f7f7", "#053061"],
    ),
    "coherence-default": ("temporal_coherence", [0.0, 0.5, 1.0], ["#f2f5ef", "#8bbabb", "#155665"]),
    "uncertainty-default": (
        "velocity_uncertainty",
        [0.0, 0.01, 0.02],
        ["#f9f4dd", "#d6a876", "#7f423e"],
    ),
}
DEFAULT_STYLE = {value[0]: key for key, value in STYLES.items() if "contrast" not in key}
LABELS = {
    "velocity_los": "LOS Velocity",
    "temporal_coherence": "Temporal Coherence",
    "velocity_uncertainty": "Velocity Uncertainty",
}


def legend(item: Product) -> Legend:
    style = DEFAULT_STYLE[item.kind]
    _, ticks, colors = STYLES[style]
    return Legend(
        style=style,
        label=LABELS[item.kind],
        unit=item.unit,
        display_unit="mm/year" if item.unit == "m/year" else "1",
        ticks=ticks,
        colors=colors,
        sign_convention=item.stats["sign_convention"],
        nodata="بدون داده: شفاف",
        masked="پیکسل‌های ماسک‌شده: شفاف",
    )


def colormap(style: str):
    _, ticks, colors = STYLES[style]
    positions = [(v - ticks[0]) / (ticks[-1] - ticks[0]) * 255 for v in ticks]
    rgb = [[int(color[i : i + 2], 16) for i in (1, 3, 5)] for color in colors]
    result: dict[int, tuple[int, int, int, int]] = {}
    for i in range(256):
        channels = [int(np.interp(i, positions, [c[j] for c in rgb])) for j in range(3)]
        result[i] = (channels[0], channels[1], channels[2], 255)
    return result
