# R1 Railway Deployment Adaptation — Independent Review

## Review metadata

- **Date:** 2026-08-03
- **Reviewer:** Independent fresh Codex review session, read-only
- **Implementation owner:** Primary Codex session
- **Scope:** Railway config, Docker privilege boundary, forwarded headers,
  production health behavior, Data Protection persistence, database credential
  boundary, tests, runbook, and evidence
- **Initial result:** No Blocker; 5 Major; 5 Minor/Nit observations

The reviewer did not modify files or perform implementation work.

## Original Major findings

### Major 1 — Railway command overrides could bypass the image entrypoint

`preDeployCommand` invoked `/app/migrate` directly while the design assumed it
would pass through the Docker `ENTRYPOINT`. With `RAILWAY_RUN_UID=0`, an
entrypoint override could run migrations as root; a Dashboard Custom Start
Command could similarly bypass application privilege drop.

**Correction implemented:** `railway.toml` now explicitly wraps both pre-deploy
and start commands with `/usr/local/bin/kiwimpact-entrypoint`. The runbook makes
config-as-code authoritative and requires the Dashboard Custom Start Command to
remain empty. A root-start explicit-entrypoint container check observed final
UID `1654`.

**Closure status:** **Closed** by targeted reviewer check.

### Major 2 — `AllowedHosts` omitted Railway's healthcheck host

Allowing only the public domain would reject Railway's readiness request with
`Host: healthcheck.railway.app` before `/health/ready` could return 200.

**Correction implemented:** The runbook value now includes both the Railway
public domain and `healthcheck.railway.app`. A Production integration test sends
that Host header and observes HTTP 200 from `/health/ready`.

**Closure status:** **Closed** by targeted reviewer check.

### Major 3 — Application HTTPS redirection could redirect the internal probe

The runbook enabled ASP.NET Core HTTPS redirection even though Railway probes
the container over internal HTTP and owns public HTTP-to-HTTPS redirection at
its edge.

**Correction implemented:** Railway configuration now requires
`HttpsRedirection__Enabled=false`. The Production readiness integration test
uses no forwarded-proto header and observes HTTP 200 rather than 307.

**Closure status:** **Closed** by targeted reviewer check.

### Major 4 — Data Protection persistence did not fail closed

A missing/wrong key path or missing volume could still boot with ephemeral
keys. The root helper also accepted arbitrary configured paths for `chown` and
`chmod`.

**Correction implemented:** `railway.toml` now sets `requiredMountPath` to the
approved key directory. Railway-mode application startup requires
`DataProtection:KeyPath` and `RAILWAY_VOLUME_MOUNT_PATH` to equal that path.
The entrypoint refuses empty, root, or any other path with exit 78 before
changing permissions. Focused tests cover valid/missing/wrong configuration;
container checks observe successful non-root execution for the approved path
and exit 78 for dangerous or missing paths.

**Closure status:** **Closed** by targeted reviewer check.

### Major 5 — Runtime and migration database credential isolation is absent

The runbook uses the Railway Postgres template's `PGUSER`/`PGPASSWORD` for the
application connection. That account is normally the provider administrative
user, conflicting with the accepted R1 requirement for a restricted runtime
role and separate migration credentials. Railway pre-deploy and the steady
application share one service environment, so merely adding a second variable
would expose the migration credential to the application process and would not
create a genuine isolation boundary.

**Correction implemented:** None. This requires either a separate migration
execution identity/service with independently scoped secrets and a restricted
runtime role, or explicit human approval of a time-bounded first-release
security deviation. The current instruction did not authorize silently
weakening the accepted database boundary.

**Closure status:** **Open — human decision required.**

## Minor observations

- Initial tests exercised forwarded-header middleware in isolation rather than
  all Program configuration and Production health behavior. The correction pass
  added Production readiness coverage; live Railway client-IP observation
  remains an operator smoke requirement.
- Header names, one-hop limit, middleware order, and Railway `100.0.0.0/8`
  trust configuration were otherwise accepted by the reviewer.
- The baseline mentions a generic `PublicOrigin`; current implemented product
  behavior uses `Auth:FrontendBaseUrl`. This mapping should be reconciled in a
  later specification pass or implemented if another consumer appears.
- The baseline's stale top-level provider/implementation status was corrected.
- The completion report needed reproducible correction commands and updated
  results; it was expanded during the correction pass.

## Targeted closure result

The same independent reviewer performed one targeted check limited to the
original Major findings. Major 1–4 were closed based on the config changes,
focused Production test, fail-closed unit coverage, and observed container UID
and exit behavior. Major 5 remains open. No second full review or second
reviewer was used. Major 5 cannot close without the human's deployment-security
decision and, if strict isolation is selected, the resulting implementation and
verification.
