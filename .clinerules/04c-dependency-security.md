---
paths:
  - "frontend/package.json"
  - "frontend/package-lock.json"
  - "backend/**/*.csproj"
  - "Directory.Packages.props"
  - "Directory.Build.props"
  - "Directory.Build.targets"
  - "global.json"
  - "NuGet.config"
  - ".config/dotnet-tools.json"
  - "Dockerfile"
  - "backend/**/Dockerfile"
  - "frontend/**/Dockerfile"
  - "**/Dockerfile.*"
  - "docker-compose*.yml"
  - "docker-compose*.yaml"
  - "compose*.yml"
  - "compose*.yaml"
  - ".github/**"
  - "specs/security/**"
  - "specs/adr/**"
---
# 04c — Dependency & Supply-Chain Security

## Dependency Addition Rules

- New dependencies require explicit approval; do not install or add them
  without authorization.
- Before adding a new frontend dependency:
  1. Verify the package is actively maintained.
  2. Review its license for compatibility.
  3. Check for known vulnerabilities.
  4. Assess bundle-size impact for the runtime.
- Before adding a new backend NuGet package:
  1. Verify the package is actively maintained.
  2. Review its license for compatibility.
  3. Check for known vulnerabilities.
- Vulnerability scanning commands (`npm audit`,
  `dotnet list package --vulnerable`) are candidate gates. They become
  active only after they are verified to work in the repository and are
  marked active in `PROJECT_STATUS.md`. Do not treat them as currently
  mandatory.

## Vulnerability Triage

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
  `specs/security/` or an issue tracker.

## CI / Secrets

- CI workflows in `.github/workflows/` must not echo or log secrets.
- Secrets are injected via environment variables or GitHub Secrets; never
  committed to workflow files.
- Target policy: Dependabot is enabled for npm, NuGet, and GitHub Actions
  after the configuration is committed and verified. See `PROJECT_STATUS.md`
  for current status.

## Supply-Chain Hygiene

- `package-lock.json` (frontend) is required for reproducible installations.
- CI uses `npm ci` (frontend) once the CI workflow is active and verified.
- Lockfile changes must be reviewed alongside the manifest change that caused
  them.
- Prefer dependencies with a history of security responsiveness.
- Periodically review transitive dependencies for abandoned or compromised
  packages.
- The exact NuGet vulnerability-command syntax must be verified against the
  installed .NET SDK before the command is activated as a gate.
