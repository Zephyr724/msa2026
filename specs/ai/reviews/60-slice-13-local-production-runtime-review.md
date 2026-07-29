# Review 60 — Slice 13 Local Production Runtime

- **Date:** 2026-07-27
- **Reviewer:** Independent Kimi K3 session
- **Mode:** Read-only implementation review with targeted closure checks
- **Baseline:** `cae199d`
- **Verdict:** APPROVED
- **Remaining Blockers:** 0
- **Remaining Majors:** 0

## Scope reviewed

The reviewer read the accepted Slice 13 contract, R1 deployment baseline,
ADR-0009, implementation prompt, completion report, and current source diff.
The review covered:

- Docker build and final-image boundaries;
- Compose migration/start ordering and persistent volumes;
- EF migration-bundle connection resolution;
- Data Protection, non-root and read-only runtime behavior;
- static-file, SPA, API, Scalar, SignalR and health-route boundaries;
- CORS, HTTPS, secure-cookie and browser-visible Maps configuration;
- CI, tests, README and evidence accuracy.

## Initial findings and closure

### Major — nested environment files entered the Docker context

The first review found that root-only `.env` patterns did not explicitly
exclude the documented `frontend/.env.local`, while `COPY frontend/ ./` copied
the whole frontend tree into the build stage.

Closed by:

- recursive `**/.env` and `**/.env.*` Docker ignore rules;
- removal of the unnecessary env-example exception from the build context;
- accurate evidence that supplied Maps browser values are intentionally
  embedded into public Vite output and must be protected by API and exact
  referrer restrictions rather than secrecy.

### Blocker — development database credential could enter the final image

The closure review found that the Web SDK publish path could propagate
`appsettings.Development.json`, which contains the tracked development-only
database credential, into `/out/app` and therefore the final image.

Closed by:

- setting `CopyToPublishDirectory="Never"` for
  `appsettings.Development.json`;
- excluding that file from the Docker context;
- adding a Docker build-stage assertion that fails if it reaches `/out/app`.

### Implementation-owner self-review — migration bundle connection

Before the independent findings were closed, Codex found that the existing EF
design-time factory used a design-only localhost connection string. The
migration bundle could therefore target the wrong database.

Closed by:

- preferring `ConnectionStrings__DefaultConnection` and its colon-form
  equivalent before the design-only fallback;
- adding a unit regression test;
- rerunning the unit suite at 248/248 and the PostgreSQL integration suite at
  301/301.

The reviewer confirmed this bundle connection path is sound.

## Remaining minor and observations

- **Minor:** root `appsettings.json` retains the historical
  `AllowedHosts: "*"`. Compose overrides it for this local Slice. A provider
  deployment must require exact public hostnames before exposure.
- **Observation:** the final corrected image, migration job, non-root key-volume
  write, liveness healthcheck, and Compose startup were not yet observed during
  review because registry downloads/build completion remained pending.
- **Observation:** successful readiness is integration-tested; unavailable
  database and pending-migration 503 paths do not yet have direct automated
  cases.

These are not Blocker or Major findings for the provider-neutral local Slice.
The completion report must continue to distinguish code review approval from
unobserved container runtime behavior until the final corrected image and
Compose path pass.

## Post-review runtime evidence

After the read-only review, the implementation owner completed the final image
build and isolated Compose verification. The first migration-container run
failed closed because the framework-dependent bundle could not extract into
the non-root home directory on a read-only filesystem. The image and Compose
environment were corrected to set
`DOTNET_BUNDLE_EXTRACT_BASE_DIR=/tmp/dotnet-bundle`.

The rebuilt image and migration job then passed: migration exited 0, app and
PostgreSQL became healthy, liveness/readiness and single-origin route smokes
passed, and database plus Data Protection state survived an app restart. These
observations supersede the earlier runtime-verification observation; they do
not change the review's remaining Blocker/Major counts.

The same reviewer performed an extremely narrow read-only post-review closure
check of this extraction-directory correction and the recorded runtime facts:
**YES**, the correction is safe and consistent; it introduced 0 new Blockers
and 0 new Majors.
