---
paths:
  - "src/middleware/**"
  - "src/services/**"
  - "src/routes/**"
---
# 04 — Security Rules

## 4.1 Input Validation
- **Zod schemas** are the single source of truth for HTTP input/output contracts
- Validate every request body, query string, and URL parameter in the routes layer before data reaches services
- Database schema is the source of truth for persistence shape; Zod and DB schemas must stay aligned

## 4.2 SQL Injection Prevention
- **Always** use parameterized queries with `?` placeholders
- **Never** concatenate user input into SQL strings
- **Never** use `db.exec()` with user-supplied strings
- All query functions in `src/db/` use `db.prepare()` exclusively

## 4.3 Authentication & Password Handling
- Password hashing: use **Argon2id** with recommended parameters (min: `memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`)
- Login failure responses must **never** distinguish between "user not found" and "wrong password" — use a single generic message
- Authentication mechanism: **Bearer Token** (JWT) or session-based (Cookie) — to be decided by ADR-002
- If using cookies: set `HttpOnly`, `Secure` (production), `SameSite=Strict`
- JWT tokens must have a reasonable expiration and use RS256 or HS256 with a strong secret

## 4.4 Authorization
- Permission checks live in route middleware, not scattered across services
- Users can only modify their own resources (Projects, Tasks)
- Resource ownership is verified on every mutating request
- Admin-only routes use a dedicated middleware guard

## 4.5 Rate Limiting & DoS Protection
- Rate-limit login, registration, and password-reset endpoints
- Apply a global request body size limit (e.g., `express.json({ limit: '100kb' })`)
- Consider per-IP rate limiting for public endpoints

## 4.6 Secrets & Environment
- All secrets loaded from environment variables; never hardcoded in source
- Environment variables validated with Zod at startup (fail-fast on missing/invalid config)
- `.env` files must never be committed; `.env.example` shows required variables without values

## 4.7 Error & Logging Safety
- Stack traces must never be exposed in API responses (`NODE_ENV=production` strips them)
- Error responses follow `{ error: { code: string, message: string } }` envelope
- Logging (pino):
  - Default: do NOT log sensitive PII
  - Email, IP, phone numbers must be masked when logging is necessary
  - Internal user ID and request ID are safe to log; define retention period and access scope
  - Never log: passwords, tokens, full credit card numbers, session secrets

## 4.8 HTTP Security Headers
- Use `helmet` middleware for security headers
- Enable CORS with explicit allowed origins (not `*`) if cross-origin requests are needed

## 4.9 Additional Protections
- SSRF protection: validate and restrict any outbound HTTP requests from the server
- Path traversal protection: resolve and validate file paths before file operations
- CSRF protection if cookie-based sessions are used