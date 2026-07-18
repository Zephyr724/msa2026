---
paths:
  - "src/middleware/**"
  - "src/services/**"
  - "src/routes/**"
  - "src/config/**"
  - "src/policies/**"
  - "tests/**"
---
# 04b — Authentication & Authorization

## Authentication

**Gate:** Authentication implementation MUST NOT begin until ADR-002 is
accepted. ADR-002 must resolve:

- Cookie session vs JWT (Bearer token);
- Access / refresh token lifetimes;
- Logout and revocation strategy;
- CSRF strategy;
- Cross-origin requirements;
- Key rotation schedule;
- `issuer`, `audience`, and allowed signature algorithms;
- Multi-device login policy.

### Password Handling

- Hash passwords with **Argon2id**:
  - `memoryCost: 19456` (19 MiB)
  - `timeCost: 2`
  - `parallelism: 1`
- Calibrate Argon2id parameters during deployment/performance validation
  on representative target hardware. Store the approved parameters in
  validated configuration. Do not automatically lower password hashing
  parameters during startup.
- Monitor real authentication latency and resource consumption.
- Login failure responses must use a **single** generic message; never
  distinguish between "user not found" and "wrong password".

### Token & Session Rules (apply after ADR-002 is accepted)

- JWT: verify `alg` against an allowlist; do **not** accept tokens that
  self-report their signing algorithm via the `alg` header.
- Cookies: `HttpOnly`, `Secure` (production), `SameSite` set per the
  outcome of ADR-002 (`Lax` or `Strict` depending on cross-site flow
  needs).
- Tokens must have a reasonable expiration configured at the service
  level, not hard-coded.

## Authorization Architecture

```
Route middleware:
- Authentication (verify identity)
- Coarse role checks (if applicable)
- HTTP-specific checks (CSRF, CORS, rate limiting)

Service / Authorization policy layer:
- Resource ownership verification
- Action-level authorization (can this actor perform this action?)
- Tenant boundaries
- Domain invariants
```

- Authentication and coarse role checks may run in route middleware.
- Resource-level authorization **MUST** be enforced through centralized
  authorization policy functions called by the service layer.
- Services **MUST NOT** assume that callers have passed through HTTP
  middleware. Jobs, CLI adapters, and MCP tools may call services directly.
- Every read and mutation involving owned resources **MUST** evaluate:
  `actor + action + resource`.
- Reading another user's private resources (IDOR) is a violation
  equivalent to unauthorized mutation.

### Authorization Testing (mandatory)

- Authorized access: the owning user can read and mutate their own
  resources.
- Unauthorized mutation: one user cannot modify another user's resources.
- Unauthorized read (IDOR): one user cannot read another user's private
  resources.
- Escalation: a non-admin user cannot access admin-only endpoints.
- Cross-tenant isolation: when multi-tenancy is introduced, replicate all
  of the above across tenant boundaries.

## Reverse Proxy Trust

- `trust proxy` must match the actual deployment topology.
- Never enable unrestricted `trust proxy: true` without verifying that the
  last trusted proxy overwrites all forwarded headers.
- Rate limiting and audit logging may use forwarded client IPs only after
  proxy trust is configured and tested.

## Rate Limiting & DoS Protection

- Rate-limit login, registration, and password-reset endpoints.
- Apply a global request body size limit (`express.json({ limit: '100kb' })`).
- Consider per-IP rate limiting for public endpoints.

## HTTP Security Headers

- Use `helmet` middleware for security headers.
- Enable CORS with explicit allowed origins (not `*`) if cross-origin
  requests are needed.

## Additional Protections

- SSRF protection: validate and restrict outbound HTTP requests from the
  server.
- Path traversal protection: resolve and validate file paths before file
  operations.
- CSRF protection if cookie-based sessions are used.