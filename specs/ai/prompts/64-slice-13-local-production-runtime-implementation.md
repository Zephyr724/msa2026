# Prompt 64 — Slice 13 Local Production Runtime Implementation

## Record type

Truthful reconstruction of the implementation instruction used on 2026-07-27.

## Human instruction

After approving the completed Slice 11A/12 commit and push, proceed with the
next Slice. Continue the established workflow: Codex owns planning and
implementation, creates evidence, and Kimi K3 performs the independent
read-only review.

## Implementation instruction

Implement the provider-neutral Dockerization portion of the accepted R1
production deployment baseline as Slice 13. Do not select a provider, create
billable resources, deploy publicly, or change authentication, authorization,
privacy, database schema, or product scope.

Deliver:

1. A multi-stage Docker build that compiles the Vite frontend and .NET API,
   creates a version-matched EF migration bundle, and produces one non-root
   ASP.NET Core runtime image serving the React application and all server
   routes from one browser-visible origin.
2. Safe static-file behavior: immutable caching for hashed assets, no-cache for
   the application shell, deep-link fallback only for safe GET/HEAD frontend
   routes, and no SPA shell for missing API, health, OpenAPI, Scalar, SignalR,
   or file paths.
3. Separate process liveness and bounded PostgreSQL/schema readiness endpoints.
4. Durable filesystem-backed ASP.NET Core Data Protection keys with a stable
   application discriminator.
5. A full local Compose path with PostgreSQL, an explicit one-shot migration
   job, the application, durable named volumes, and optional Mailpit. Remove
   tracked Compose secrets and provide only a safe template.
6. CI image-build coverage, runtime integration tests, and developer
   documentation for secret preparation, full-stack startup, logs, health,
   shutdown, and persistence boundaries.

Run all applicable frontend and backend gates. Build and run the real image and
Compose path if registry/network access permits. Record any external
verification blocker truthfully rather than claiming success. Preserve the
user-owned `.playwright-mcp/`, `docs/UI/`, and `figma-make-1.jpeg`.

Before independent review, create the Slice contract and completion report.
The reviewer must be independent and read-only. Do not stage, commit, push,
merge, or deploy Slice 13 without explicit human approval.
