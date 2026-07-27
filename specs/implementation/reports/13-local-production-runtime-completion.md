# Slice 13 — Local Production Runtime Completion Report

- **Date:** 2026-07-27
- **Branch:** `codex/feat/slice-13-dockerized-runtime`
- **Baseline:** `cae199d`
- **Status:** Complete; independent review approved; final image and local
  Compose runtime verified
- **Risk:** Important

## Implemented scope

### Single-origin production image

- Added a multi-stage root `Dockerfile` that builds the Vite application,
  publishes the .NET 10 API, creates the reviewed EF Core migration bundle,
  and copies the frontend into the API `wwwroot`.
- Excluded `appsettings.Development.json` from .NET publish output and the
  Docker context, and added a build-stage assertion that fails if the
  development file reaches `/out/app`. The final image therefore receives no
  tracked development connection string or demo credential.
- The final Alpine ASP.NET Core image runs as the built-in non-root `app` user
  on port 8080 with a BusyBox `wget` liveness healthcheck.
- Added a root `.dockerignore` that recursively excludes root and nested
  `.env`/`.env.*` files, source-control metadata, tests, evidence, developer
  output, and user-owned Figma/browser artifacts from the build context.
- Google Maps browser configuration remains optional build input. No actual key
  or map ID is stored in tracked source, the Compose file, or the template.
  When supplied, these browser-visible values are intentionally embedded into
  the built Vite JavaScript and therefore into the final image; security
  depends on Maps API and exact website-referrer restrictions, not secrecy.
  The build stage injects them only for the Vite build command rather than
  retaining them as stage-level environment values.

### ASP.NET Core runtime behavior

- Configured built-in Data Protection with a stable application name and an
  optional durable filesystem key path.
- Added configuration-controlled HTTPS redirection that remains enabled by
  default outside Development. The local provider-neutral Compose path
  explicitly disables only that redirect because it has no TLS terminator.
- Added static frontend serving with immutable cache headers for `/assets` and
  no-cache headers for the shell and other static files.
- Added GET/HEAD-only SPA fallback for non-file frontend routes. Missing
  `/api`, `/health`, `/openapi`, `/scalar`, `/hubs`, and extension-bearing
  paths never receive the React shell. Scalar-owned routes remain owned by
  Scalar and are explicitly tested not to return the application shell.
- Preserved `/health` and added `/health/live` as process-only liveness.
- Added `/health/ready`, which applies a three-second bound, verifies
  PostgreSQL connectivity, verifies that no EF migration is pending, returns
  503 without internal details when not ready, and propagates caller
  cancellation.

### Compose, migration and persistence

- Replaced the support-service-only Compose file with a full runtime containing
  `postgres`, one-shot `migrate`, `app`, and optional-profile `mailpit`
  services.
- The application starts only after the version-matched migration bundle exits
  successfully; Production startup still does not auto-migrate.
- The image and Compose environment point framework-dependent bundle extraction
  at the writable `/tmp` filesystem, so the non-root migration process works
  with a read-only root filesystem.
- The EF design-time factory now prefers the standard Compose connection-string
  environment key, preventing the migration bundle from falling back to its
  design-only localhost database at execution time.
- Added separate named volumes for PostgreSQL and Data Protection keys.
- The application and migration services use read-only root filesystems and a
  writable temporary filesystem; the application keeps its key volume.
- Removed the tracked Compose PostgreSQL password. Compose now requires an
  untracked PostgreSQL password and Completion Code HMAC key.
- Added `.env.example` containing placeholders and non-secret defaults only.
- Preserved the configurable host PostgreSQL port for the existing hybrid
  Vite/.NET local-development path.

### Verification and handoff

- Added 15 PostgreSQL-backed integration cases covering deep links, safe
  methods, reserved server prefixes, Scalar ownership, missing files, cache
  headers, liveness/readiness, and Data Protection key reuse across hosts.
- Added a production-image CI build job and included `codex/feat/**` in push
  branch coverage.
- Reworked the README with full-stack and hybrid workflows, secret generation,
  migration ordering, health URLs, optional Mailpit, logs, restart, shutdown,
  persistence, and the local HTTP authentication boundary.
- Updated project status and corrected the Slice 12 report to record the
  successful `cae199d` commit and push.

## Files changed

- Runtime and configuration:
  - `Dockerfile`
  - `.dockerignore`
  - `.env.example`
  - `docker-compose.yml`
  - `backend/src/Kiwimpact.Api/Program.cs`
  - `backend/src/Kiwimpact.Api/Controllers/HealthController.cs`
  - `backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj`
  - `backend/src/Kiwimpact.Api/appsettings.json`
  - `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContextFactory.cs`
- Verification:
  - `backend/tests/Kiwimpact.IntegrationTests/Api/ProductionRuntimeApiTests.cs`
  - `backend/tests/Kiwimpact.UnitTests/Infrastructure/KiwimpactDbContextFactoryTests.cs`
  - `.github/workflows/ci.yml`
- Contracts and handoff:
  - `README.md`
  - `PROJECT_STATUS.md`
  - `specs/implementation/13-local-production-runtime.md`
  - `specs/ai/prompts/64-slice-13-local-production-runtime-implementation.md`
  - this report
  - truth correction in
    `specs/implementation/reports/12-figma-experience-closure-completion.md`

## Verification observed

- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run` — 41 files, 326 tests passed.
- `npm run build` — passed; 1,958 modules transformed. Vite emitted the
  existing non-blocking 658.12 kB main-chunk advisory.
- `dotnet build Kiwimpact.slnx` — passed with five pre-existing EF1002
  integration-test helper warnings and no errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — 248 tests passed.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — 301 tests passed.
- Targeted `ProductionRuntimeApiTests` — 15 tests passed.
- The new design-time factory connection-string regression test passed as part
  of the 248-test unit suite.
- Release API build with `--no-restore --disable-build-servers` — passed with
  zero warnings and zero errors.
- `docker compose --env-file .env.example config --quiet` — passed.
- `git diff --check` — passed.
- Final `docker build --file Dockerfile --tag kiwimpact:slice13 .` — passed.
  The build context was 25.77 kB after the final ignore rules. Containerized
  Vite build transformed 1,958 modules, the .NET publish assertion proved
  `appsettings.Development.json` absent, and the EF migration bundle completed
  at `/out/migrate`.
- Image inspection observed `User=app`, the `dotnet Kiwimpact.Api.dll`
  entrypoint, and the `wget` liveness healthcheck. A one-shot container
  observed UID/GID 1654, the built `wwwroot/index.html`, executable migration
  bundle, absent development appsettings, and `/usr/bin/wget`.
- Isolated Compose verification on app port 18080 and PostgreSQL port 15433
  observed PostgreSQL healthy, `migrate` exit 0, and `app` healthy.
- Runtime smoke verification observed:
  - `/health/live` — 200 `Healthy`;
  - `/health/ready` — 200 `Ready`;
  - `/passport` — 200 production React shell with `no-cache`;
  - missing `/api` route — 404 with no SPA body;
  - `/scalar/v1` — 200 HTML;
  - `/openapi/v1.json` — 200 JSON;
  - hashed JavaScript asset — immutable one-year cache header.
- The migrated database contained eight EF migration-history rows. After an
  application-container restart, readiness returned 200, the database still
  contained eight migrations, and the Data Protection key file retained the
  same SHA-256 hash. The key volume was writable by UID 1654.
- The isolated containers and network were removed after verification. The two
  project-scoped named volumes were deliberately retained; no volume data was
  deleted.

## Runtime corrections observed

- Initial registry attempts returned EOF before project build steps. A later
  attempt recovered and populated the image cache.
- The first complete project build rejected the invalid
  `--self-contained false` EF CLI syntax. Removing the argument correctly
  produced the default framework-dependent bundle.
- The first Compose migration run failed closed because the non-root bundle
  could not extract under `/home/app` on a read-only filesystem. Pointing
  `DOTNET_BUNDLE_EXTRACT_BASE_DIR` at the writable `/tmp` tmpfs closed the
  issue; the rebuilt migration job then exited 0 and allowed the app to start.

## Known limitations and boundaries

- Provider selection, registry publication, public HTTPS, DNS, public
  deployment, production database operations, backups, restores, and
  provider-specific forwarded-header/client-IP behavior remain out of scope.
- Local Compose deliberately uses HTTP and disables redirect middleware.
  Production cookies remain `Secure=Always`, so authenticated production
  behavior cannot be verified on this local HTTP origin. A direct local HTTP
  CSRF-token request returned 500 because ASP.NET Core correctly rejects
  `AntiforgeryOptions.Cookie.SecurePolicy=Always` on a non-SSL request; this is
  the documented boundary, not an authentication success claim.
- Maps values are Vite build-time inputs. A production build requires a
  production-restricted browser key, map ID, and exact deployed HTTPS referrer.
- The provider-specific owner, permissions, backup, and recovery policy for
  Data Protection key storage remains a deployment decision.
- The existing frontend main bundle remains above Vite's advisory threshold.
- A final `npm audit --omit=dev` reported two high entries for the same
  React Router advisory through `react-router` and `react-router-dom`. The
  advisory applies only to unstable RSC APIs; this Vite SPA uses
  `createBrowserRouter` and no RSC API or route action. The published patched
  version is React Router 8.3.0, so remediation requires a separately approved
  major-version compatibility task rather than an automatic forced change.

## Review status

- Independent Kimi K3 Review 60: **APPROVED**.
- Initial and closure findings: 1 Blocker and 1 Major, both closed.
- Remaining findings: 0 Blockers and 0 Majors.
- The same reviewer approved the narrow post-review bundle-extraction
  correction with 0 new Blockers and 0 new Majors.
- Recorded non-blocking items: provider deployment must replace the historical
  wildcard `AllowedHosts`, and readiness does not yet have direct unavailable
  database/pending-migration 503 tests.
- No Slice 13 staging, commit, push, merge, or deployment has been performed.

## Repository hygiene

The user-owned `.playwright-mcp/`, `docs/UI/`, and `figma-make-1.jpeg` remain
untracked and excluded from this Slice.
