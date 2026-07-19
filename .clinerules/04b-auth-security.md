---
paths:
  - "src/middleware/**"
  - "src/services/**"
  - "src/routes/**"
  - "src/config/**"
  - "src/policies/**"
  - "src/repositories/**"
  - "src/schemas/**"
  - "src/types/**"
  - "src/composition/**"
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

- JWT: Do not treat the token's `alg` header as the server's algorithm
  policy. Configure the verifier with an explicit algorithm allowlist
  selected by ADR-002, and reject all algorithms outside that allowlist.
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

## Authentication Throttling

- Rate-limit login, registration, and password-reset endpoints.
- Throttling should consider both normalized account identifiers and
  trusted client IPs (see `04d-runtime-security.md` for proxy trust).

## Related Rules

- Runtime security (proxy trust, CORS, SSRF, CSRF, path traversal, body
  limits): `04d-runtime-security.md`
- Error serialization: `01-architecture.md` §1.8
