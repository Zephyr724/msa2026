# 00 — Project Context, Language Policy & Quick Reference

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
- **Runtime**: Node.js 24 LTS (minimum: Node.js 22 LTS during migration)

## Language Policy
- **User-facing communication (replies, explanations, task summaries)**: Chinese
- **Source code comments, documentation files (.md), inline annotations**: English
- **Git commit messages**: English (Conventional Commits, see `06-development-workflow.md`)
- **API documentation, JSDoc, OpenAPI/Swagger specs**: English
- **Variable names, function names, type/interface names**: English (camelCase/PascalCase per `01-architecture.md`)

## Current State (2026-07-17)

### What Exists
- `init_db.sql` — baseline schema for users, projects, tasks (3 tables)
- `msa2026.db` — SQLite database with seed data (2 users, 2 projects, 3 tasks)
- `docs/` — architecture ADRs, operations runbooks, security docs
- `.clinerules/` — agent steering rules (this directory)

### What's Next (Priority Order)
1. Initialize Node.js + TypeScript project (`package.json`, `tsconfig.json`)
2. Set up directory structure per `01-architecture.md`
3. Implement database connection layer with `better-sqlite3`
4. Implement User CRUD (service + routes + tests)
5. Implement Project CRUD (service + routes + tests)
6. Implement Task CRUD (service + routes + tests)
7. Add input validation (Zod schemas)
8. Add structured logging (pino)
9. Configure Vitest and write initial test suite
10. Set up CI/CD pipeline (`.github/workflows`)

## Quick Reference: Key Principles
1. **Never** concatenate user input into SQL strings — always parameterized queries
2. **Never** use `any` type — use `unknown` + type guards
3. **Never** log credentials, tokens, or PII
4. **Never** `git push --force` to protected branches
5. **Always** validate input with Zod before it reaches service layer
6. **Always** propagate errors to centralized error middleware (don't catch locally unless recovering)
7. **Always** run `npm audit` before adding dependencies; critical/high CVEs block merge

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