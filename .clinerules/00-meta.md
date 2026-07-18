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
- **Project**: msa2026 — Task & Project Management API
- **Tech Stack**: Node.js + TypeScript + SQLite
- **Database Driver**: `better-sqlite3` (synchronous, parameterized queries)
- **Database File**: msa2026.db (SQLite 3)
- **API Style**: REST via Express (see ADR-001 in `docs/architecture/adr/`)
- **ORM/DAL**: Raw parameterized SQL (no ORM)
- **Package Manager**: npm
- **Testing**: Vitest + Supertest
- **Logging**: pino (structured JSON)
- **Validation**: Zod
- **Runtime**: Node.js 24 LTS (≥24.0.0, <25.0.0)

## Language Policy
- **User-facing communication (replies, explanations, task summaries)**: Chinese
- **Source code comments, documentation files (.md), inline annotations**: English
- **Git commit messages**: English (Conventional Commits, see `06-development-workflow.md`)
- **API documentation, JSDoc, OpenAPI/Swagger specs**: English
- **Variable names, function names, type/interface names**: English (camelCase/PascalCase per `01-architecture.md`)

## Quick Reference: Key Principles

### Injection Prevention
- Never interpolate untrusted input into executable or interpreted contexts.
  - SQL: parameterized queries (`?` placeholders)
  - Shell: fixed executables + argument arrays (never `exec()` with interpolated input)
  - HTML: framework escaping or a vetted sanitizer
  - Dynamic identifiers (table/column names): strict allowlists

### Type Safety
- Never use `any` type — use `unknown` + type guards (explicit, commented exceptions allowed at compatibility boundaries)

### Secrets & Logging
- Never log credentials, tokens, or unmasked PII
- Never hard-code secrets in source; load from environment variables

### Git Safety
- Never `git push --force` to protected branches

### Input Validation
- Validate input with Zod before it reaches the service layer
- Every external adapter validates its own input before invoking a service:
  - HTTP route → Zod HTTP schema
  - CLI adapter → CLI input schema
  - MCP tool → MCP input schema
  - Job/event handler → event schema

### Error Handling
- Propagate errors to centralized error middleware (don't catch locally unless recovering)

### Dependency Security
- No untriaged critical/high vulnerability may remain
- Reachable critical/high CVEs in production dependencies block merge
- Approved temporary exceptions must comply with `04c-dependency-security.md`