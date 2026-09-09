# 0018 — Buildings after the infrastructure pilot

Status: accepted; outside the MVP, scheduled for V2.1.

## Decision

Do not derive a national building inventory, vulnerability model or risk score from footprints. After corridor acceptance, a bounded import may be added with explicit source, date, license and a coverage audit. Microsoft footprints are a source candidate, not verified national coverage. No national hydrogeology source is assumed.

## Future acceptance

Show `coverage_status`, `known_gaps` and `source_date` beside counts and areas. Missing footprints do not establish absence of buildings. Large maps use MVT and a minimum zoom. Stage zero creates no building schema, dependency or download.
