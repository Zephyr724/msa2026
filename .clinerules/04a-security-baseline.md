# 04a — Security Baseline

This rule is always active and applies to all files. It extends the security
baseline in `00-harness-core.md` §6 with project-specific operational rules.

## High-Risk Operations

For any of the following, STOP and request explicit human approval:
- Installing or removing dependencies
- Changing authentication or authorization logic
- Creating or modifying schema migrations
  - An explicit user task that clearly requests a non-destructive schema
    change and its migration counts as approval for creating that migration.
  - Additional confirmation is still required for destructive, ambiguous,
    or history-rewriting operations.
- If a task requests a schema change outside the migration system, STOP and
  report the governance conflict. Human approval alone does not bypass the
  migration requirement; the applicable project rule or ADR must first be
  explicitly changed.
- Deleting or destructively modifying data
- Changing environment variable handling or secret loading
- Modifying rate-limiting, CORS, CSRF, security headers, or proxy trust

## Project-Specific Security References

- Authentication & authorization: `04b-auth-security.md`
- Dependency & supply-chain: `04c-dependency-security.md`
- Database rules: `03-database.md`
- Runtime security (SSRF, path traversal, CORS, body limits): `04d-runtime-security.md`

## Secrets & Configuration

- Secrets come from environment variables or a secrets manager, never from
  source files, comments, or committed configuration.
- `.env` files must be in `.gitignore`. Only `.env.example` (with placeholder
  values only) may be committed.
- Configuration defaults must be safe for production (secure by default).