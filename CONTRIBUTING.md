# Contributing

Start with the [documentation index](docs/README.md), [coverage ledger](docs/operations/specification-coverage.md)
and the relevant method documentation. Small, independently reviewable changes
are preferred. Discuss changes to scientific meaning before implementation.

1. Install the locked Node/Python dependencies and generate local settings as
   described in the [local guide](docs/operations/local-guide.md). Keep credentials,
   downloads and personal data out of Git.
2. Preserve Persian/RTL accessibility and English support. Persian UI dates use
   the Persian calendar; English dates use Gregorian. Keep provenance timestamps
   in their original machine-readable representation. Technical Markdown is English;
   the main README introduction and author's letter are Persian and English.
3. Run `make check-source`. For database or workflow changes, also run the
   corresponding integration checks against an isolated local stack. Public CI
   separates source checks from manually requested real-data integration.
4. Regenerate the OpenAPI client when contracts change. Record the change and
   actual verification in relevant documentation. Never label a schema, fixture
   or successful build as completed scientific or operational validation.
5. Submit a focused change with its reason and verification. Contributions to
   original code and documentation are accepted under Apache-2.0; submit only
   material you are entitled to license. Preserve third-party notices.

Published method implementations and numerical results are immutable. A changed
scientific calculation requires a separately identified method/version and new
results, not edits to the code behind an existing published method hash.

No contributor agreement or copyright assignment is required. The maintainer
reviews changes before merging. Source-code availability does not authorize
publishing anyone's organization records or source datasets.
