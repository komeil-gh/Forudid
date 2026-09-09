# 0014 — Exposure without structural-risk estimates

Status: accepted for all V2 outputs.

## Decision

Hazard describes deformation; exposure describes its spatial intersection with assets or population; vulnerability describes structural susceptibility. V2 has no vulnerability/consequence model and must not generate structural risk, failure probability or safe/unsafe classifications. Confidence concerns data fitness, not infrastructure safety.

Rank using observable metrics. Arbitrary weighting of velocity and population must not become a risk score. Store and display descriptive velocity bands separately from hazard classes produced by a validated method. Preserve unavailable and insufficient-data states instead of replacing them with zero or low.

## Acceptance

Every analysis page and report includes the exact Persian UI notice:

> FORUDID یک ابزار پایش و غربالگری مکانی است و جایگزین ارزیابی ژئوتکنیکی، سازه‌ای، نقشه‌برداری زمینی یا بازدید میدانی نیست.

No detected deformation does not establish safety. Text and contract checks prevent exposure from becoming a structural-risk claim. Tables convey the same essential information as map colors.
