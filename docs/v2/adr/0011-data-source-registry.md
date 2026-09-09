# 0011 — Data sources and immutable versions

Status: accepted architecture; implementation stage 2.

## Decision

`data_sources` stores provider identity, type, citation, license, attribution and scientific status. `source_versions` stores immutable, dated snapshots with URI, SHA-256, BIGINT size and metadata. Provider credibility, file validation and product publication are distinct states. Registering a source does not publish a product.

A multi-file dataset uses an immutable manifest. The version checksum identifies the archived manifest; that manifest records every file URI, size and checksum. Access dates do not replace observation periods. `(source_id, version)` is unique: repeating an identical checksum is idempotent; a checksum conflict fails.

## Implementation and acceptance

Registration starts through the CLI; public source APIs are paginated GETs. Private URIs and credentials stay out of public responses. OpenAPI generates the Orval client; `/sources` displays actual registry records. Existing dependencies and the standard library suffice. The migration preserves the six V1 tables. Acceptance covers registration, retrieval, conflict rejection, persistence and RTL against real PostGIS.
