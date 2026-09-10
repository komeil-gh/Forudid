# Public source preparation

The public core uses [Apache-2.0](../../LICENSE). This permits adoption and
commercial services without imposing a proprietary license on the analysis
methods. Organization records and customer datasets remain private. This is a
source release, not a claim of scientific validation or completion of V3.

## Distribution boundary

The existing repository remains private. Distribute the reviewed source archive
from a fresh repository, without copying the private repository's `.git` history.
No remote, domain or deployment target is configured by this preparation.
The archive contains committed source, locked dependencies, English documentation,
tests, original branding, licensed fonts and attributed cartographic context.
It contains no installed dependencies, scientific measurements, local settings,
generated reports, private organization records or untracked design studies.

External logos without established redistribution permission are excluded by
`.gitattributes`. Source names and links work without these files. Third-party
terms are recorded in [the notices](../../THIRD_PARTY_NOTICES.md). In particular,
do not redistribute COMET measurements or tiles until permission is established.

## Build a source release

From a committed checkout with Git and Python available:

```sh
python3 scripts/release_source.py
```

The command writes a source archive, SHA-256 checksum and manifest under ignored
`data/releases/`. It reads `HEAD`, honors committed export exclusions, rejects
unsafe file types and private paths, and does not copy untracked files. It never
publishes, changes visibility or modifies Git history. Run Gitleaks separately
on both the repository history and extracted archive; automated scans are not
proof that no secret exists.

```sh
gitleaks git --redact --log-opts=--all .
gitleaks dir --redact /path/to/extracted-source
```

Extract into an empty directory, verify the checksum, install locked dependencies,
generate fresh settings and run `make check-source`. An empty installation has
no scientific products. Acquire source versions explicitly using the [local guide](local-guide.md) and
source-specific instructions. Fixtures are synthetic and remain hidden in normal use.

## Later publication

Publication remains a separate owner action. Create a fresh public repository
from the reviewed extracted tree, enable private vulnerability reporting, and
set the actual reporting URL in `SECURITY.md`. Require the source-check workflow
on pull requests. Upload the source archive and checksum with an alpha release
description that links to the coverage ledger. Do not upload local data folders,
container images or compiled dependency bundles as part of this source release.

## Local acceptance — 2026-09-10

Alpha.9 source preparation was checked on macOS with Python 3.13, pnpm 11.24.0
and the locked dependencies. The source archive was extracted into a new empty
directory. All 248 packaged file hashes matched its manifest. The independent
web install reused 514 cached packages; the API install used 96 packages and
built both first-party Python packages from the extracted source.

`make check-source` passed in that extracted checkout: archive-boundary regression,
Ruff, Pyright, 24 numerical/API/recovery tests, ESLint, TypeScript, 18 frontend
tests and production web build. One explicitly gated real-data CLI test was
skipped. The target now prevents pnpm from reinstalling dependencies during
checks and freezes the Python lockfile. Install the dependencies first.
Existing upstream deprecation and large-map-chunk warnings remain non-failing;
this work does not change immutable numerical implementations.

The extracted API produced the committed OpenAPI contract. Two existing browser
cases passed against its production build at 1440 px and 390 px. The public footer
was also rendered and inspected at both widths: eight linked source names,
no external-logo requests, no logo images and no page-level horizontal overflow.
Private logo mode and public text mode both have frontend regression coverage.
The temporary preview server and isolated browsers were stopped afterward.

Gitleaks 8.30.1 reported no findings across the 45 pre-preparation commits and
the clean extracted source. The scanner executable was verified against the
publisher's downloaded release checksum file. This is bounded scan evidence,
not a guarantee of absence. Final archives retain their exact commit identity,
per-file manifest and archive checksum in `data/releases/`; local verification
logs are retained under `data/releases/audit/` and are excluded from publication.

No Docker services or data volumes were changed for this preparation. No public
repository, upload, hosted application or remote CI execution is claimed. The
existing scientific and operational gates remain in the coverage ledger.
