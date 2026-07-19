---
paths:
  - "backend/src/**"
  - "backend/tests/**"
  - "frontend/src/**"
  - "frontend/tests/**"
---
# 04b — Authentication & Authorization

## Authentication

Kiwimpact uses ASP.NET Core Identity with HttpOnly cookie authentication
(see ADR-0002 in `specs/adr/`).

Supported methods:
1. email/password;
2. Google external login.

### Identity Configuration

- ASP.NET Core Identity manages user accounts, password hashing, and
  external login providers.
- Password hashing uses Identity's default implementation (PBKDF2 with
  HMAC-SHA256, 100,000 iterations for .NET 10+).
- Identity's built-in account lockout is enabled.
- Email confirmation is required before normal login.
- Confirmation token lifetime: ~24 hours.
- Reset token lifetime: ~30–60 minutes.

### Cookie Configuration

- HttpOnly only
- SameSite=Lax
- Secure=false for local development (HTTP), Secure=true for production
- Every POST/PUT/PATCH/DELETE request uses ASP.NET Core antiforgery
  protection. The client sends `X-CSRF-TOKEN`.

### Google External Login

- Google authenticates; Kiwimpact creates/locates a local Identity user.
- Kiwimpact issues its own HttpOnly cookie.
- Same-email accounts are not automatically linked.
- Linking requires an authenticated settings flow.
- Pure Google users do not see Change Password unless a local password exists.

### Login Failure Responses

- Forgot-password response does not reveal account existence.
- Login failure returns a single generic message.

## Authorization Architecture

```
ASP.NET Core Middleware:
- Authentication (cookie, Identity)
- Coarse role checks ([Authorize(Roles = "...")])
- HTTP-specific checks (CSRF, CORS, rate limiting)

Application Service layer:
- Resource ownership verification
- Action-level authorization
- Domain invariants
```

- Authentication and coarse role checks may use ASP.NET Core attributes.
- Resource-level authorization **MUST** be enforced in application services,
  not assumed from HTTP middleware.
- Services **MUST NOT** assume that callers have passed through HTTP
  middleware. Background services and other non-HTTP callers may invoke
  services directly.
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
- Escalation: a Member user cannot access Organizer or Admin endpoints.
- Missing authentication returns 401.
- Invalid/expired authentication returns 401.
- Authenticated but unauthorized returns 403.

## Authentication Throttling

- Rate-limit login, registration, and password-reset endpoints.
- Throttling should consider both normalized account identifiers and
  trusted client IPs (see `04d-runtime-security.md` for proxy trust).

## Related Rules

- Runtime security (proxy trust, CORS, SSRF, CSRF, path traversal, body
  limits): `04d-runtime-security.md`
- Error serialization: `01-architecture.md` §1.8
