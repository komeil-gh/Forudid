# 0010 — Exposure analysis as the focus of V2

Status: the source registry and historical product publication are implemented. See the dated acceptance records for subsequent exposure delivery.

## Problem and decision

Requiring every product to originate in an internal LOS run prevents published datasets from entering the catalog. V2 must explain observation, exposure and data confidence. Record internal or external provenance explicitly; separate analysis from InSAR production while preserving V1. Never invent a scientific run, uncertainty or time series for an external product.

Stage 3 adds source-version and component/method metadata through an additive migration. The implementation retains a real conversion and COG-validation run: `processing_profile=published-source-cog-normalization` does not mean HyP3 or InSAR processing. This preserves provenance and publication gates without making the run nullable for this path. Track numbers may be null for mosaics spanning multiple tracks. V1 APIs remain available during transition; fixtures are hidden by default.

## Consequences and acceptance

V1 ADR 0008 no longer restricts every product to LOS. Arbitrary LOS conversion remains prohibited. Distinguish vertical projection, decomposition and GNSS referencing. Acceptance requires displaying and sampling one external dataset without running HyP3, with explicit dates and method. The MVP remains local; this decision adds no cloud service, ML or structural-safety model.
