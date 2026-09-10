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
no scientific products. Acquire source versions explicitly using the README and
source-specific instructions. Fixtures are synthetic and remain hidden in normal use.

## Later publication

Publication remains a separate owner action. Create a fresh public repository
from the reviewed extracted tree, enable private vulnerability reporting, and
set the actual reporting URL in `SECURITY.md`. Require the source-check workflow
on pull requests. Upload the source archive and checksum with an alpha release
description that links to the coverage ledger. Do not upload local data folders,
container images or compiled dependency bundles as part of this source release.
