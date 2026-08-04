# R1 — Production Deployment Baseline

## 1. Status

- **Status:** Railway selected; local provider adaptation awaiting review closure
- **Date:** 2026-07-25
- **Implementation:** Railway adapter implemented locally on 2026-08-03; not committed or deployed
- **Deployment/provider:** Railway, Southeast Asia (Singapore); public deployment not yet triggered
- **Topology decision:** ADR-0009 remains accepted; deployment still requires explicit approval
- **Branch baseline:** `feat/r1-production-deployment-baseline` at `6dcc40e`, including merged Slice 4A

## 2. Goal

Deliver the smallest safe deployment Slice that builds and runs the React frontend and ASP.NET Core API as one public HTTPS origin, backed by persistent PostgreSQL, while preserving Cookie authentication, antiforgery, authorization, validation, rate limiting, Scalar, and OpenAPI.

The result must provide a stable assessment-period link for the README and a reproducible full-application Docker/Compose path. This contract does not select a provider or authorize implementation or deployment.

## 3. Current deployment baseline

- The frontend is Vite/React; `apiFetch` defaults to relative `/api` and sends credentials.
- Vite proxies `/api`, `/health`, `/openapi`, `/scalar`, and `/hubs` to `http://localhost:5000` in development.
- The API currently maps controllers, `/health`, OpenAPI JSON, and Scalar, but serves no frontend assets and has no SPA fallback.
- Authentication and antiforgery cookies are HttpOnly, `SameSite=Lax`, and Secure outside Development.
- Unsafe `/api` requests pass through the global antiforgery filter; register/login rate limits are enabled.
- CORS currently permits configured credentialed development origins; production can use an empty origin list.
- Automatic EF migration is Development-only. Stable role seeding may run in any environment when enabled.
- The existing `/health` controller proves process liveness only. `/health/live` and `/health/ready` are net-new R1 work; the latter must include database/schema readiness.
- Three migrations exist: initial Region/Quest/Identity, auth profile, and Quest participation.
- Compose currently runs PostgreSQL and Mailpit only, contains a tracked development password, and is not full-app Dockerization.
- No Dockerfile or `.dockerignore` exists. CI runs frontend and backend gates but does not build an image.
- No forwarded-header handling, durable Data Protection store, production secret template, release migration artifact, or deployment runbook exists.
- README and PROJECT_STATUS lag the merged Slice 4A repository state and report deployment as unconfigured.

Compatibility conclusion: the preferred single-container application topology is compatible with the current relative API paths, Vite proxy, ASP.NET Core host, cookie model, and migrations. It requires bounded production hosting/routing/configuration work; no reverse proxy or new application package is currently justified.

## 4. Accepted single-origin topology

ADR-0009 accepts this browser-visible topology:

1. Build the Vite frontend in a Node build stage.
2. Publish the ASP.NET Core application in a .NET SDK build stage.
3. Copy `frontend/dist` into the published API `wwwroot`.
4. Run one ASP.NET Core runtime container that serves frontend routes, `/api/...`, `/health...`, `/scalar...`, and `/openapi...`.
5. Terminate public TLS at the selected trusted platform ingress and forward the original scheme safely.
6. Keep production browser calls relative to `/api`; do not set a secret or cross-origin URL in Vite output.
7. Keep the existing Vite proxy for local development.
8. Run PostgreSQL as a separate persistent service or managed database.

Do not add Nginx, Caddy, Traefik, or another reverse proxy unless the selected platform proves it necessary and the human approves the topology change.

## 5. Docker image design

- Add a root `Dockerfile` using pinned major/minor official Node 24 and .NET 10 image families; record resolved digests in implementation evidence if practical.
- `frontend-build`: copy lock/package metadata, run `npm ci`, copy frontend source, and run `npm run build` with `/api` as the effective API base.
- `backend-build`: restore from solution/project metadata, copy backend source, and run deterministic Release publish without an app-host dependency where appropriate.
- Assemble `wwwroot` from the Vite output before the final publish/runtime copy; fail the build if expected assets are absent.
- `runtime`: use the official .NET 10 Alpine ASP.NET Core runtime image as the default candidate, expose the configured unprivileged HTTP port (normally 8080), and include only published output.
- Run as the image's non-root application UID. Pre-create writable key-storage paths with that ownership.
- Do not copy `.git`, local environment files, User Secrets, certificates, tests, `node_modules`, build output, prompts, or development settings.
- Add root `.dockerignore` for secrets and unnecessary build context without excluding required solution/source/lock files.
- Add an image health check against `/health/live`; BusyBox in the Alpine candidate provides a possible lightweight probe, but implementation must verify the exact command exists and works.
- Prove the application and required globalization/runtime behavior on Alpine during the clean-image check. Alpine is an implementation assumption, not an irreversible architecture decision.
- If Alpine is unsuitable, an official Debian-family runtime is allowed only with a probe actually available in that image. Never assume `curl` or `wget` exists; adding an OS package requires human approval.
- Build from a clean checkout at the target commit. The image must contain no connection string, demo credential, private key, or provider token.

## 6. Local full-stack Compose design

- Extend the tracked Compose path to contain `app` and `postgres`; keep Mailpit optional/development-only if retained.
- Build `app` from the production Dockerfile and run it with `ASPNETCORE_ENVIRONMENT=Production` on one local production-style origin.
- PostgreSQL uses a pinned supported image, a named data volume, `pg_isready`, and no published port unless local administration requires it.
- Use an explicit local production-style sequence: build the exact application image; start PostgreSQL and wait for health; run the reviewed EF migration bundle once in a command/container from that same build version; start or enable the application only after migration succeeds; then verify `/health/ready`.
- The pre-migration application state may intentionally fail readiness. The normal application container never calls `Database.Migrate()` automatically.
- Mount a separate named volume at the configured Data Protection key path and preserve non-root write access.
- Compose health checks call `/health/live`; readiness checks call `/health/ready` after migrations.
- Use `${VARIABLE:?required}` substitutions and an untracked `.env`; track only `.env.example` names/placeholders.
- Never place a password in tracked Compose. Remove the current tracked development password during implementation and document generation/rotation.
- Validate data and Data Protection key survival across application and database-container restarts.

## 7. ASP.NET Core production routing

- Serve default/static files from `wwwroot` with immutable caching for hashed Vite assets and conservative caching for `index.html`.
- Map API controllers, liveness/readiness, OpenAPI, and Scalar as real endpoints before the frontend fallback.
- Implement an explicit frontend fallback only for non-file `GET`/`HEAD` routes that are not reserved server paths.
- Match reserved paths on segment boundaries: `/api` and `/api/...`; `/health` and `/health/...`; Scalar's accepted route and descendants; and the OpenAPI JSON route and descendants. Reserve `/hubs` and `/hubs/...` only if that endpoint exists later.
- A shared character prefix is not enough: `/api/quests` is reserved, while `/api-docs` may remain a frontend route unless explicitly reserved.
- Missing reserved server paths return their normal non-SPA response, normally 404, and never `index.html`.
- Non-safe methods never receive SPA fallback. Unknown static files return 404.
- Add routing tests for valid frontend refresh, unknown frontend route, unknown API route, health, Scalar, OpenAPI, and representative static assets.
- Keep Scalar and OpenAPI enabled in Production for the accepted assessment requirement; reassess exposure after the assessment.
- Use the exception handler in Production and never expose developer exception pages or database exception detail.

## 8. Cookie, CSRF, proxy, and HTTPS behavior

- Retain auth Cookie name, HttpOnly, `Secure=Always`, `SameSite=Lax`, eight-hour expiry, sliding expiration, and API-safe 401/403 responses.
- Retain antiforgery header `X-CSRF-TOKEN`, HttpOnly/Secure/Lax antiforgery cookie, and validation on every unsafe `/api` request.
- Production normal browser traffic is same-origin and must not rely on credentialed CORS. Configure no production CORS origin unless a separately accepted client requires one.
- The current backend enables `UseHttpsRedirection()` outside Development. R1 must reconcile that middleware explicitly with the selected platform ingress.
- Process forwarded headers before HTTPS redirection, authentication, rate limiting, and endpoint handling.
- Trust only the selected platform proxy/network or a provider guarantee that sanitizes and overwrites forwarded headers. Do not globally trust arbitrary `X-Forwarded-*` input.
- Require the edge to provide or enforce public HTTPS and preserve the trustworthy original scheme. Based on provider behavior, implementation must decide whether `UseHttpsRedirection()` is retained, conditionally scoped, or removed.
- Verify there is no redirect loop, incorrect-port redirect, or downgrade. Production smoke must observe both forwarded scheme and final redirect behavior.
- Confirm the provider supplies a trustworthy client IP header before treating remote IP rate-limit partitions as client-specific.
- Keep authorization, ownership, validation, and rate-limit policies unchanged unless independently justified and approved.

## 9. PostgreSQL and migration strategy

- Supply `ConnectionStrings__DefaultConnection` through provider secret management.
- Require PostgreSQL TLS in production (`SSL Mode=Require` minimum; prefer certificate verification when the provider exposes a usable CA chain).
- Create a dedicated application database/role with only required schema/data privileges; do not use the provider superuser for normal runtime.
- Use durable managed storage or a named production volume with backups; never use container ephemeral storage for database data.
- `/health/live` reports process state without touching PostgreSQL. `/health/ready` performs a bounded database/schema check and returns non-success without internal detail when unavailable.
- Neither health endpoint exposes secrets, connection details, schema names, or sensitive diagnostics.
- Build an EF migration bundle from the repository's pinned `dotnet-ef` 10.0.10 tool and the exact reviewed target commit, or approve an equivalent exact-build command.
- Run migrations once as an explicit human-approved release step using separate migration credentials if elevated DDL rights are required.
- Normal application startup must not call `Database.Migrate()` in Production. It must fail readiness safely when the expected schema is absent.
- Perform a bounded, non-mutating schema compatibility check during startup; if the reviewed schema is unavailable, exit non-zero or remain unable to receive traffic according to the approved platform rollout, never serve normal product requests.
- Clean deployment: create the empty database/roles, back up if applicable, run the exact bundle through all three accepted migrations, verify schema, then start/enable traffic.
- Upgrade deployment: export/verify a restorable backup, confirm current migration history, run the same target bundle, inspect result, then deploy the matching image.
- Corrective path: stop traffic if needed, preserve evidence and backup, prefer a forward-fix migration, and restore only under the approved provider procedure.
- Never reset, drop, recreate, or automatically downgrade production. Treat migration `Down` methods as development aids, not the default rollback plan.

## 10. Configuration and secret inventory

| Setting | Required production treatment |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | Literal `Production` |
| `ASPNETCORE_HTTP_PORTS`/platform port | Non-secret runtime binding, normally 8080 |
| `ConnectionStrings__DefaultConnection` | Secret; TLS-enabled PostgreSQL string |
| `AllowedHosts` | Exact platform/public hostnames; do not retain `*` without justification |
| `PublicOrigin` | One exact `https://...` origin for documentation/validation |
| `Cors__Origins` | Empty for normal production browser flow |
| trusted proxy/network settings | Provider-specific non-secret allowlist/trust mode |
| Data Protection key path/application name | Non-secret stable values; path on durable storage |
| `Seed__Roles` | Explicit policy; normally true only for approved first/release initialization |
| `Seed__Region`, `Seed__DemoQuests` | False in Production; these remain Development-only implementation paths |
| `Seed__DemoAccounts` | False unless the human approves demo accounts |
| `Seed__AssessmentData` | Default false; an explicitly approved, bounded, one-shot production assessment bootstrap may temporarily set true, then must return to false after verification |
| demo emails/passwords | Omit when disabled; otherwise secret storage only |
| auth rate-limit settings | Non-secret accepted defaults unless measured change is approved |
| logging levels | Information/Warning baseline; no sensitive payloads or secret values |

Track names and safe placeholders only. No production secret may enter source, Compose, Docker layers/history, frontend environment, browser output, logs, screenshots, or evidence.

## 11. Data Protection key persistence

- Configure a stable application name and `PersistKeysToFileSystem` on a dedicated durable mounted directory using the built-in ASP.NET Core Data Protection APIs.
- The store must survive restart and redeployment, be writable only by the non-root app identity, and use provider encryption at rest and restricted operator access.
- Verify an authentication cookie remains decryptable across an application restart/redeployment using the same key store.
- Back up/retain keys consistently with the assessment availability window; deleting them logs out users and may invalidate protected tokens.
- Do not store keys in the image, Git, ephemeral filesystem, environment variables, or PostgreSQL application tables by default.
- If the provider cannot meet durable, restricted, non-root file persistence without an external service/package, stop for explicit approval; do not add a key-store package silently.

## 12. Provider requirements and decision matrix

Selection requires: public HTTPS and stable provider hostname; Docker or supported .NET 10; one-origin routing; persistent PostgreSQL; secrets; durable restricted key storage; logs; health probes; controlled restarts/rollback; backups; affordable operation; and availability through Phase 2 results.

Official capabilities and constraints were checked on 2026-07-25. Provider selection remains deferred; revalidate prices, quotas, regions, volume semantics, platform capabilities, and terms from current official documentation when selection begins.

| Topology | App + PostgreSQL | Docker / same origin / keys | Complexity and cost constraint | Human decision |
| --- | --- | --- | --- | --- |
| Railway Hobby | One Docker service serving SPA+API; Railway PostgreSQL service | Dockerfile detection, service variables, logs, health/restart controls, and automatic HTTPS provider domain; app volume for keys | Low operations. Current Hobby base is US$5/month including US$5 usage, then usage rates; PostgreSQL template is documented as unmanaged. Volumes are root-mounted, so retaining non-root may require a root exception or another approved key design. | Approve Railway, unmanaged DB/backup duties, volume encryption, root exception/key solution, region/latency, current estimate, retention period. |
| Azure Container Apps Consumption | One Container App serving SPA+API; Azure Database for PostgreSQL Flexible Server | External HTTPS ingress with forwarded headers; managed secrets/logs/health/revisions; Azure Files mount for keys; registry required | Medium/high operations. Container Apps has monthly free grants then usage billing; managed PostgreSQL, Azure Files, registry, and logs are separately billable. Exact NZ/Australia regional quote is required. | Approve Azure subscription, region, registry, PostgreSQL tier/backup, Azure Files/key permissions, minimum replicas, current estimate, retention period. |

Railway sources: [Dockerfiles](https://docs.railway.com/builds/dockerfiles), [public HTTPS](https://docs.railway.com/networking/public-networking), [volumes](https://docs.railway.com/volumes), [PostgreSQL](https://docs.railway.com/databases/postgresql), and [pricing/limits](https://docs.railway.com/pricing/plans).

Azure sources: [Container Apps ingress](https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview), [storage mounts](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts), [billing](https://learn.microsoft.com/en-us/azure/container-apps/billing), [quotas](https://learn.microsoft.com/en-us/azure/container-apps/quotas), [managed PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/overview), and [PostgreSQL pricing](https://azure.microsoft.com/en-us/pricing/details/postgresql/flexible-server/).

Selection update (2026-08-03): the human selected Railway with the application
and PostgreSQL services in Southeast Asia (Singapore), approved the root-owned
volume adapter that immediately drops application privileges, and attached the
application key volume. Exact service variables, remaining operator actions,
verification, and rollback boundaries are maintained in
[`r1-railway-production-runbook.md`](./r1-railway-production-runbook.md).

## 13. CI/release boundary

- Preserve existing frontend lint/type-check/test/build and backend build/unit/integration gates.
- Add one clean production image build gate, without pushing from ordinary branches.
- Produce/check the reviewed migration bundle or exact migration command for the target commit.
- On an approved release, run backup check, explicit migration, deploy exact image, then bounded `/health/ready` and smoke verification.
- Require human approval before registry push, migration, resource mutation, or deployment.
- Do not add Kubernetes, Terraform, multiple environments, branch auto-deploy, or a complex promotion system.

## 14. Deployment verification plan

**Container/local production mode**

- Clean-checkout image build; non-root runtime; no secret/image leakage; app and PostgreSQL health.
- Clean database and prior accepted schema migration paths; failed-schema readiness; explicit migration history.
- Database and Data Protection persistence across container restart/recreation.
- Frontend deep-link refresh; reserved-prefix 404 behavior; `/health/live`, `/health/ready`, Scalar, and OpenAPI.

**Authentication and security through the production-style origin**

- Register, login, `/me`, logout; auth Cookie is HttpOnly, Secure, Lax.
- Valid antiforgery succeeds; missing/invalid token fails with the accepted problem response.
- Organizer and Member authorization/ownership boundaries; register/login rate limiting remains active.
- Forwarded HTTPS/client IP behavior is observed at the selected platform, not inferred.

**Product, browser, and operations smoke**

- Public Region/Quest discovery and detail.
- Organizer creates/edits Draft and publishes; Member joins/cancels; creator sees OwnQuest state.
- Reload preserves authenticated and participation state.
- Desktop and mobile layouts; no mixed content, CORS, `/api/api`, console, or SPA/API routing errors.
- Restart preserves database data and cookie decryptability; logs contain no secret values.

## 15. README/status/evidence updates

Future implementation updates README with the observed public link, local/production Docker instructions, configuration names, migration/deployment limitations, Scalar URL, and actually verified commands.

Update PROJECT_STATUS only with observed deployment state. Before commit, create the actual implementation prompt under `specs/ai/prompts/` and completion report under `specs/implementation/reports/`. For this important/high-risk Slice, obtain one independent read-only review under `specs/ai/reviews/` after those evidence files exist; close original Blocker/Major findings before commit.

## 16. Definition of Done

- All provider/migration/key/demo/cost gates are approved.
- Production image and full-stack Compose meet Sections 4–11 from a clean checkout.
- Exact reviewed migrations succeed for clean and upgrade paths without startup auto-migration.
- All applicable repository gates and Section 14 checks are observed and recorded.
- A stable HTTPS provider link remains accessible for the required assessment period.
- README, PROJECT_STATUS, prompt record, completion report, and independent review are truthful and complete.
- Diff contains only approved R1 files; no secret, production data, or unrelated change is present.

Estimated implementation scope: approximately 12–16 tracked files, including Docker/Compose/configuration, bounded API routing/health/key changes and tests, CI/docs, and required evidence. The independent reviewer owns the review record.

## 17. Risks

- Untrusted forwarded headers can spoof scheme/client IP and weaken redirects or rate limiting.
- An over-broad SPA fallback can turn missing API/docs/health routes into HTTP 200 HTML.
- Ephemeral or inaccessible Data Protection keys can invalidate cookies on restart.
- Provider volume permissions can conflict with a non-root runtime, especially on Railway.
- Startup migration can race replicas or apply unreviewed schema changes; manual migration can still fail without backup/restore rehearsal.
- Free/low-cost tiers may sleep, delete data, lack retention, or become unavailable before results release.
- Stale README/PROJECT_STATUS can overstate deployment or omit later Slices.

## 18. Human approval gates

Stop before implementation/deployment until the human approves: hosting provider/topology realization; PostgreSQL provider/tier; account/subscription and any billable resource; registry; provider hostname/custom domain; secret mechanism; Data Protection persistence and permissions; migration artifact/command and credentials; demo-account/data policy; environment and target commit/image; monthly estimate/cap; backup retention; rollback/corrective expectations; and required availability end date.

Any dependency, reverse proxy, external key service, schema change beyond accepted migrations, authentication/security change, DNS change, production secret creation, or architecture change needs separate explicit approval.

## 19. Stop condition

R1 is approved and frozen for later implementation, not approved for immediate deployment. Do not implement, create accounts/resources/secrets/databases, migrate production, change DNS, stage, commit, push, open a PR, or deploy. The next action is a separate human-approved provider selection using freshly revalidated official pricing/capabilities.

## 20. Verification commands

Planning verification:

```bash
git status --short
git branch --show-current
git diff --check HEAD
git diff --stat HEAD
git diff --name-status HEAD
git ls-files --others --exclude-standard
```

Future implementation gates, run only when applicable and observe results:

```bash
# frontend/
npm run lint
npm run type-check
npm run test -- --run
npm run build

# backend/
dotnet build Kiwimpact.slnx
dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build

# repository root; exact tags/options finalized after provider approval
docker build --file Dockerfile .
docker compose config
docker compose up --build
```
