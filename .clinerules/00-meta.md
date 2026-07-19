# 00 — Project Context, Language Policy & Quick Reference

## Enforcement Status

These rules steer agent behavior and are not security boundaries.

- Until Cline hooks or approval policies are implemented and tested,
  destructive operations require explicit human approval.
- Until CI is active, quality gates must be run locally and reported.
- Until GitHub branch protection is active, the user must manually prevent
  direct pushes to protected branches.

When each control becomes operational, update the status table in
`PROJECT_STATUS.md`.

## Meta Information
- **Project**: msa2026 → **Kiwimpact** — Community eco quests across New Zealand
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + daisyUI
- **Backend**: C# .NET 10+ + ASP.NET Core Web API
- **Database**: PostgreSQL (via Entity Framework Core + Npgsql)
- **API Style**: REST/JSON via ASP.NET Core
- **ORM**: Entity Framework Core
- **Package Managers**: npm (frontend), NuGet (backend)
- **Testing**: Vitest + React Testing Library (frontend), xUnit v3 + Testcontainers (backend), Cypress (E2E)
- **Logging**: ASP.NET Core logging (structured)
- **Validation**: Zod for frontend UX validation; DataAnnotations for request
  shape; application/domain validation remains authoritative.
- **Runtimes**: Node.js 24 LTS (frontend), .NET 10+ (backend)

## Language Policy
- **User-facing communication (replies, explanations, task summaries)**: Chinese
- **Source code comments, documentation files (.md), inline annotations**: English
- **Git commit messages**: English (Conventional Commits, see `06-development-workflow.md`)
- **API documentation, Scalar specs**: English
- **Variable names, function names, type/interface names**: English (camelCase/PascalCase per `01-architecture.md`)

## Quick Reference: Key Principles

### Injection Prevention
- Never interpolate untrusted input into executable or interpreted contexts.
  - SQL: EF Core parameterized queries / LINQ
  - Shell: fixed executables + argument arrays (never `Process.Start` with interpolated input)
  - HTML: React's JSX auto-escaping
  - Dynamic identifiers (table/column names): strict allowlists only

### Type Safety
- Frontend: never use `any` — use `unknown` + type guards
- Backend: never suppress nullable reference type warnings without justification

### Secrets & Logging
- Never log credentials, tokens, or unmasked PII
- Never hard-code secrets in source; load from environment variables / .NET User Secrets

### Git Safety
- Never `git push --force` to protected branches

### Input Validation
- Frontend: validate with Zod (React Hook Form) before API calls
- Backend: validate with DataAnnotations (request DTOs) + domain validation in Core layer
- Every external adapter validates its own input before invoking a service:
  - HTTP request DTO → ASP.NET Core model binding + DataAnnotations
  - OAuth callback/input → validated payload
  - Seed/import data → validated input schema
  - Background job data from database and configuration → validated on read
  - External service responses → validated at the adapter boundary

### Error Handling
- Frontend: explicit query mutation/error states, route or component error
  boundaries where appropriate, and controlled user-facing fallback states.
- Backend: propagate to ASP.NET Core exception middleware (Problem Details)

### Dependency Security
- No untriaged critical/high vulnerability may remain
- Reachable critical/high CVEs in production dependencies block merge
- Approved temporary exceptions must comply with `04c-dependency-security.md`
