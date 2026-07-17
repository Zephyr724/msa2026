---
paths:
  - "package.json"
  - "package-lock.json"
  - ".github/**"
---
# 04c — Dependency & Supply-Chain Security

## Dependency Addition Rules

- New dependencies require explicit approval; do not install or add them
  without authorization.
- Before adding a new dependency:
  1. Verify the package is actively maintained.
  2. Review its license for compatibility.
  3. Check for known vulnerabilities (`npm audit`).
  4. Assess bundle-size impact for the runtime.
- Run `npm audit` before any dependency merge.

## npm audit Triage

- Critical / high vulnerabilities in **reachable production dependencies**
  block merge.
- All other critical / high findings require documented triage.
- Temporary exceptions require a record containing:
  - Advisory ID;
  - Affected scope (production / dev / unreachable);
  - Reachability analysis;
  - Mitigation applied;
  - Owner (who approved the exception);
  - Expiration date (when the exception must be re-evaluated).
- Exceptions must not be silently ignored; the record must live in
  `docs/security/` or an issue tracker.

## CI / Secrets

- CI workflows in `.github/workflows/` must not echo or log secrets.
- Secrets are injected via environment variables or GitHub Secrets; never
  committed to workflow files.
- Dependabot is enabled for automated patch PRs.

## Supply-Chain Hygiene

- Commit `package-lock.json`; do not use `^` / `~` to paper over unpinned
  dependencies — the lockfile is authoritative.
- Prefer dependencies with a history of security responsiveness.
- Periodically review transitive dependencies for abandoned or compromised
  packages.