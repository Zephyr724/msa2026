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
- Target policy: Dependabot is enabled for npm and GitHub Actions after the
  configuration is committed and verified. See `PROJECT_STATUS.md` for current
  status.

## Supply-Chain Hygiene

- `package-lock.json` is required for reproducible installations.
- SemVer ranges in `package.json` must follow the project's dependency update
  policy; they do not replace lockfile review.
- CI uses `npm ci`, not `npm install`.
- Lockfile changes must be reviewed alongside the manifest change that caused
  them.
- Prefer dependencies with a history of security responsiveness.
- Periodically review transitive dependencies for abandoned or compromised
  packages.