# R1 Railway Deployment Adaptation Completion Report

## Status

Production implementation and local verification are complete on
`feat/r1-railway-deployment`. The independent read-only review found no Blocker
and 5 Major findings. Four received a concentrated correction pass; one
targeted closure check closed those four. One database-credential isolation
Major remains open pending a human decision. No commit, push, merge, or
deployment has been performed.

## Implemented scope

- Added Railway config-as-code for the root Dockerfile, EF migration bundle
  pre-deploy, explicit privilege-dropping start command, required key mount,
  readiness healthcheck, timeout, and restart policy.
- Added a bounded container entrypoint for Railway's root-owned key volume. It
  prepares only the configured key directory and drops to `app:app` before the
  application or migration command executes.
- Added provider-specific forwarded-header configuration for one Railway edge
  hop. It uses `X-Real-IP` and `X-Forwarded-Proto`, trusts the documented
  `100.0.0.0/8` proxy network, and runs before HTTPS redirection and rate
  limiting.
- Added focused configuration and middleware tests for trusted and untrusted
  peers.
- Added fail-closed Railway Data Protection path/mount validation and a
  Production integration test for the internal healthcheck Host and redirect
  behavior.
- Added a Railway production runbook covering variables, GitHub auto-deploy,
  Wait for CI, private PostgreSQL connectivity, persistent keys, backups,
  release smoke checks, and rollback boundaries.

## Files changed

### Production and deployment

- `Dockerfile`
- `docker/entrypoint.sh`
- `railway.toml`
- `backend/src/Kiwimpact.Api/Program.cs`
- `backend/src/Kiwimpact.Api/Hosting/RailwayForwardedHeaders.cs`
- `backend/src/Kiwimpact.Api/appsettings.json`

### Tests

- `backend/tests/Kiwimpact.UnitTests/Api/RailwayForwardedHeadersTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/ProductionRuntimeApiTests.cs`

### Evidence

- `specs/ai/prompts/83-r1-railway-deployment-adaptation.md`
- `specs/ai/reviews/79-r1-railway-deployment-adaptation-independent-review.md`
- `specs/implementation/r1-production-deployment-baseline.md`
- `specs/implementation/r1-railway-production-runbook.md`
- `specs/implementation/reports/27-r1-railway-deployment-adaptation-completion.md`

## Verification commands and observed results

| Command | Observed result |
| --- | --- |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --filter FullyQualifiedName~RailwayForwardedHeadersTests` | Passed after correction: 8 tests |
| `sh -n docker/entrypoint.sh` | Passed with no output |
| `dotnet build Kiwimpact.slnx` | Final correction build passed: 0 warnings, 0 errors |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Final correction suite passed: 305 tests |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Final correction suite passed: 335 tests |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --filter FullyQualifiedName~ProductionRuntimeApiTests.RailwayInternalReadinessHostRemainsHttp200InProduction` | Passed: Production request with `Host: healthcheck.railway.app` and no forwarded proto returned 200 |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run` | Passed: 49 files, 389 tests |
| `npm run build` | Passed; Vite retained the existing main-chunk size advisory |
| `docker build --progress=plain --tag kiwimpact:railway-adapter-test .` | Passed after two earlier network-only failures while fetching Docker/npm dependencies |
| `docker image inspect --format {{.Config.User}} kiwimpact:railway-adapter-test` | Passed: image default user is `app` |
| `docker run --rm kiwimpact:railway-adapter-test id -u` | Passed: runtime UID is `1654` (non-root) |
| Root-start container with an anonymous key volume, followed by `stat` | Passed: key directory became `app:app` with mode `0700` |
| Root-start container with an anonymous key volume, followed by a write probe | Passed: the post-entrypoint `app` process wrote successfully; anonymous volume was automatically removed |
| `docker run --rm --user 0 --entrypoint /usr/local/bin/kiwimpact-entrypoint -e DataProtection__KeyPath=/var/lib/kiwimpact/keys -e Hosting__Railway__Enabled=true -e RAILWAY_VOLUME_MOUNT_PATH=/var/lib/kiwimpact/keys --mount type=volume,target=/var/lib/kiwimpact/keys kiwimpact:railway-adapter-test id -u` | Passed: explicit Railway-style entrypoint returned UID `1654` |
| Explicit root-start entrypoint with `DataProtection__KeyPath=/` | Failed closed as expected with exit 78 before running the command |
| Explicit Railway root-start entrypoint without `RAILWAY_VOLUME_MOUNT_PATH` | Failed closed as expected with exit 78 before running the command |
| Current Railway JSON schema inspection | Confirmed all `railway.toml` build/deploy keys and `ON_FAILURE` enum are present in the current schema |
| `npm audit --omit=dev` and `npm audit` | Reported 2 high findings for `react-router`/`react-router-dom` 7.18.1 under GHSA-qwww-vcr4-c8h2; the advisory states it applies only to unstable RSC APIs, which this Vite SPA does not use |
| `git diff --check` | Passed with no output after implementation and evidence changes |

## Known limitations and deployment-time work

- The Railway service must set `RAILWAY_RUN_UID=0`; otherwise Railway's
  root-owned volume is not writable. The entrypoint then drops privileges before
  executing the application command.
- Railway permits one volume per service and does not overlap deployments that
  mount a volume, so the application key volume implies brief redeploy downtime.
- Railway's PostgreSQL certificate is self-issued for `localhost`; the runbook
  therefore requires encrypted PostgreSQL transport over Railway's encrypted
  private network but does not claim hostname-verified database TLS.
- Production SMTP remains unconfigured. With confirmed-email registration left
  enabled, password registration is incomplete until an approved email provider
  is configured; this adapter does not weaken the authentication policy.
- Google OAuth credentials, callback registration, Maps restrictions, backup
  schedule/restore drill, production domain, secrets, initial data bootstrap,
  and live smoke checks remain deployment/operator work.
- No live Railway deployment has been triggered, so provider behavior is not yet
  observed release evidence.
- The accepted R1 database boundary requires a restricted runtime role and
  separately scoped migration credential. Railway pre-deploy shares the app
  service environment, so the current direct `Postgres.PGUSER/PGPASSWORD`
  configuration does not meet that isolation requirement. A separate migration
  identity/service or an explicit, time-bounded human-approved deviation is
  required before commit/deploy readiness.
- npm audit reports GHSA-qwww-vcr4-c8h2 through React Router 7.18.1. The app uses
  `createBrowserRouter` in a client-only Vite SPA and does not use the unstable
  RSC APIs to which the advisory is limited. Moving to the patched 8.3.0 major
  version needs separate dependency-upgrade approval and regression work.

## Review status

- Independent read-only review: **Completed**
- Targeted closure check: **Completed; original Major 1–4 closed**
- Original Blocker findings: **0**
- Original Major findings: **5**
- Major corrections implemented and closed: **4**
- Major findings still open: **1 — database runtime/migration credential isolation**
- Commit readiness: **No** until the human selects the database credential
  boundary and all original Major findings are closed
