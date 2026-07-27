# Slice 13 — Local Production Runtime and Dockerization

## Status

Implemented, locally runtime-verified, and independently approved on
2026-07-27. Public deployment remains a separate provider-gated Slice.

## Goal

Deliver the provider-neutral portion of the accepted R1 deployment baseline:
one reproducible Docker image and local full-stack Compose path that serve the
React frontend, ASP.NET Core API, Scalar, OpenAPI, health endpoints, and
SignalR from one browser-visible origin backed by PostgreSQL.

This Slice resumes the accepted Dockerization requirement after product
experience convergence. It does not resume public deployment or select a
provider.

## 13A — Single-origin application runtime

- Build the Vite frontend and .NET API in separate Docker build stages.
- Copy the built frontend into the published API `wwwroot`.
- Run the final ASP.NET Core image as the image's non-root `app` user on port
  8080.
- Serve hashed frontend assets with immutable caching and `index.html` with
  conservative no-cache headers.
- Serve SPA fallback only for safe, non-file frontend paths.
- Never return SPA HTML for missing `/api`, `/health`, `/openapi`, `/scalar`,
  or `/hubs` paths.
- Preserve relative `/api` and `/hubs` browser calls.
- Add `/health/live` for process liveness and `/health/ready` for bounded
  PostgreSQL connection plus pending-migration checks.

## 13B — Durable local runtime state and explicit migration

- Configure built-in ASP.NET Core Data Protection with a stable application
  name and optional configured filesystem key path.
- Mount a dedicated Compose volume for Data Protection keys.
- Build an EF Core migration bundle from the same source/image version.
- Run that bundle as an explicit one-shot Compose service before starting the
  normal application container.
- Keep Production startup free of automatic EF migration.
- Extend Compose to run `app`, `migrate`, `postgres`, and optional Mailpit.
- Remove the tracked PostgreSQL password and require untracked environment
  values.
- Preserve the existing published PostgreSQL port for the documented hybrid
  local-development workflow.

## 13C — Verification and developer handoff

- Add integration tests for liveness/readiness, frontend deep links, reserved
  server prefixes, static assets, safe-method boundaries, and cache headers.
- Add a clean Docker image build gate to CI without pushing an image.
- Add root `.dockerignore` and `.env.example`.
- Document secret generation, explicit migration, full-stack start, health,
  logs, stop, and persistence boundaries.
- Build and run the image/Compose path locally when Docker is available.

## Security and implementation boundaries

- No hosting-provider selection, account, billable resource, registry, DNS,
  public hostname, public deployment, or production database operation.
- No production secret is created, committed, printed, or placed in an image
  layer.
- No authentication, authorization, antiforgery, cookie, rate-limit,
  ownership, privacy, or database-schema change.
- Production cookie security remains `Secure=Always`; the local HTTP Compose
  origin is for runtime and public-path verification, not a claim of
  production authentication verification.
- HTTPS redirection remains enabled by default outside Development. Local
  Compose may explicitly disable only the redirect middleware because TLS
  termination does not exist in this provider-neutral local Slice.
- Trusted forwarded headers, public HTTPS behavior, provider client-IP
  semantics, backup/restore, and production key-volume permissions remain
  gated by provider selection.
- No reverse proxy or new application dependency.
- User-owned `.playwright-mcp/`, `docs/UI/`, and `figma-make-1.jpeg` remain
  excluded.

## Verification

- Run all backend gates because runtime production code changes.
- Run frontend gates because the production frontend is built into the image.
- Run focused routing/health/Data Protection tests.
- Run `docker compose config` without printing real secret values.
- Build the production image and observe its configured non-root user,
  healthcheck tooling, expected static files, and migration bundle.
- Run the local Compose migration/start/health path if Docker is available.
- Create an implementation prompt and completion report before one independent
  Kimi K3 read-only review.
