# Security

FORUDID is an alpha, localhost-first application. The latest source release is
the supported review target; there is no guaranteed response time or supported
internet-facing deployment profile. A public source release does not enable
public access to an installation.

Report suspected vulnerabilities privately to the maintainer through an existing
private contact. When a public repository is created, its owner must enable
GitHub private vulnerability reporting before inviting reports through the
Security tab. No public repository or security mailbox is configured yet.
Do not place credentials, personal records or exploit details in public issues.

Include the affected version, minimal reproduction, expected and actual behavior,
and impact. Use synthetic records. Avoid active tests against other deployments.
Keep findings private until a fix and disclosure date have been coordinated.

Keep services on their default loopback bindings. Generate fresh credentials
with `python3 scripts/init_env.py`; never reuse sample credentials. Deployment
requires its own access-control, TLS, backup/restore and data-publication review.
The [coverage ledger](docs/operations/specification-coverage.md) records outstanding
product and operational requirements without treating this source release as
their completion.
