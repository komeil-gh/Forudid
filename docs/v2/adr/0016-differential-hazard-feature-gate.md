# 0016 — Scientific acceptance gate for differential methods

Status: accepted. The gradient proxy and Payne research example are implemented, but remain experimental; hazard publication is disabled.

Evidence: [gradient proxy](../gradient-proxy.md), [literature comparison](../payne-2025-research.md).

## Decision

Descriptive velocity exposure is separate from a gradient proxy and angular distortion. Offer the proxy only for a suitable vertical component under the name Experimental Deformation Gradient Proxy. Keep the Payne-style method behind a disabled flag until the paper and supplements are extracted precisely and validation passes. The equation β = Δd/l alone is not a complete algorithm specification.

`analysis_methods` stores version, parameters, reference and status. Thresholds belong in server-side profiles. Time, units, pixel size, window, valid-pixel rules, gradient and classification must be defined. An unresolved assumption remains null and blocks publication.

## Acceptance

Check flat and linear planes, NoData windows, CRS/resolution changes and a literature golden case with accepted tolerance. Record reviewer, time and evidence for experimental → review → validated transitions. The backend rejects invalid method/product combinations even if a UI flag changes. A reviewed input dataset does not validate a derived method.
