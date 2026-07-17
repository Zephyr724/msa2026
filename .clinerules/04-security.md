# 04 — Security Rules

## 4.1 Input Validation
- All external input (HTTP parameters, headers, body) must be validated with Zod schemas before reaching the service layer
- Zod schemas live in `src/schemas/` and are the single source of truth for data shape and constraints
- Validation errors return HTTP 400 with a structured error body: `{ error: { code: "VALIDATION_ERROR", message: string, details?: unknown } }`

## 4.2 SQL Injection Prevention
- **Always** use parameterized queries with `?` placeholders
- **Never** concatenate user input into SQL strings — this is a hard rule, no exceptions
- **Never** use `db.exec()` with user-supplied strings
- Dynamic table/column names must be validated against an allowlist before use

## 4.3 Secrets Management
- **Never** hardcode credentials, tokens, API keys, or secrets in source code
- All secrets loaded from environment variables (via `process.env`), never committed to version control
- `.env` file is in `.gitignore`; `.env.example` provides non-sensitive template
- Logging must never include secrets, tokens, passwords, or PII — review log statements before committing

## 4.4 Output Safety
- Stack traces must never be exposed in production error responses (`NODE_ENV=production` strips them)
- Error messages returned to clients should be generic for 5xx errors; detailed errors only for 4xx validation
- SQL error messages must never be exposed to clients

## 4.5 Dangerous Patterns — Production Code
The following patterns must not be introduced into production runtime code:

- `eval()`, `new Function()`, `vm.runInNewContext()` with untrusted input
- `dangerouslySetInnerHTML` or raw HTML insertion with untrusted content
- `child_process.exec()` with unsanitized user input
- Dynamic `require()` or `import()` with user-controlled paths

**These patterns MAY appear in tests, security rules, migration utilities, or documentation — but only when clearly marked and safely isolated.**

## 4.6 HTTP Security Headers
- Production deployments must set: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
- CORS must be explicitly configured; never use `Access-Control-Allow-Origin: *` in production

## 4.7 Dependency Security
- `npm audit` runs in CI; critical and high CVEs block merge
- Dependabot enabled for automated patch PRs
- New dependencies require justification, bundle-size review, and license check

## 4.8 Agent Safety Checklist
Before any code change, verify:
- **INJECTION**: Is user input reaching SQL/shell/HTML without sanitization?
- **EXPOSURE**: Could this leak secrets, PII, tokens, or internal paths?
- **PERSISTENCE**: Could this create a backdoor or alter auth flows?
- **DESTRUCTION**: Could this irreversibly delete data?
- **PRIVILEGE**: Does this escalate permissions or change access controls?

If any check fails, stop and re-evaluate the approach.