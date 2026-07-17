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

## Project Status
- Read `PROJECT_STATUS.md` when planning roadmap or selecting the next task.
- Do not treat status claims as authoritative without checking the repository.
- Code, migrations, tests, and GitHub Issues are the authoritative sources of project state.

## Quick Reference: Key Principles
1. **Never** concatenate user input into SQL strings — always parameterized queries
2. **Never** use `any` type — use `unknown` + type guards (explicit, commented exceptions allowed at compatibility boundaries)
3. **Never** log credentials, tokens, or unmasked PII
4. **Never** `git push --force` to protected branches
5. **Always** validate input with Zod before it reaches service layer
6. **Always** propagate errors to centralized error middleware (don't catch locally unless recovering)
7. **Always** run `npm audit` before adding dependencies; critical/high CVEs block merge per audit policy in `06-development-workflow.md`

## Quick Reference: Before Any Code Change
```
INJECTION? → EXPOSURE? → PERSISTENCE? → DESTRUCTION? → PRIVILEGE?
   ❌           ❌           ❌              ❌             ❌
   If any ❌ is actually ✅ → STOP and re-evaluate

INJECTION:   Is user input reaching SQL/shell/HTML without sanitization?
EXPOSURE:    Could this leak secrets, PII, tokens, or internal paths?
PERSISTENCE: Could this create a backdoor or alter auth flows?
DESTRUCTION: Could this irreversibly delete data?
PRIVILEGE:   Does this escalate permissions or change access controls?