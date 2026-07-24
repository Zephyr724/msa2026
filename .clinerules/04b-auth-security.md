---
paths:
  - "backend/src/**"
  - "backend/tests/**"
  - "frontend/src/**"
  - "frontend/tests/**"
  - "frontend/.env.example"
  - "frontend/vite.config.*"
  - "docker-compose*.yml"
  - "docker-compose*.yaml"
  - "compose*.yml"
  - "compose*.yaml"
  - "infra/**"
  - "deploy/**"
  - ".github/**"
  - "frontend/cypress/**"
  - "frontend/cypress.config.*"
  - "specs/security/**"
  - "specs/architecture/**"
  - "specs/adr/**"
---
# 04b — Authentication & Authorization

## Current delivery sequencing

The complete long-term authentication and security goals below remain valid.
For the current assessment, the latest approved delivery-scope document
controls scheduling:

1. Slice 2A implements email/password authentication core, Identity cookies,
   CSRF, roles, UserProfile, session restoration, and baseline
   lockout/rate-limiting.
2. Slice 2B is optional/P1 and adds email confirmation, account recovery,
   password change, Mailpit delivery, and focused hardening.
3. Google login and account linking are deferred from the current submission
   schedule.

This sequencing does not weaken password hashing, Cookie, CSRF, authorization,
validation, rate-limit, lockout, or secret-handling requirements. See
`specs/product/04-phase-2-delivery-scope.md`,
`specs/implementation/02a-email-password-auth-core.md`, and
`specs/implementation/02b-account-lifecycle-and-auth-hardening.md`.

## Authentication

Kiwimpact uses ASP.NET Core Identity with HttpOnly cookie authentication
(accepted by planning baseline; see `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md` §16).

Supported methods:
1. email/password;
2. Google external login.

### Required MVP Authentication Flows

Email/password:

- registration
- email confirmation
- resend confirmation
- login
- logout
- forgot password
- reset password
- change password

Google:

- Google external login
- authenticated account linking
- pure-Google-user password behaviour (no Change Password unless a local password exists)

### Identity Configuration

- ASP.NET Core Identity manages user accounts, password hashing, and
  external login providers.
- Use ASP.NET Core Identity's supported password hasher and secure
  framework defaults. Do not replace it with custom hashing. Any explicit
  compatibility or iteration configuration must be documented and tested.
- Identity's built-in account lockout is enabled.
- Email confirmation is required before normal login.
- Confirmation and reset token lifetimes must be recorded in the accepted
  authentication specification before implementation. Current planning
  targets:
  - email confirmation: ~24 hours;
  - password reset: ~60 minutes.

### Cookie Configuration

- HttpOnly only
- SameSite=Lax
- Secure=false for local development (HTTP), Secure=true for production
- Every POST/PUT/PATCH/DELETE request uses ASP.NET Core antiforgery
  protection. The client sends `X-CSRF-TOKEN`.
- The antiforgery token issuance and refresh flow must be defined in the
  accepted authentication/API specification before implementation.

### Google External Login

- Google authenticates; Kiwimpact creates/locates a local Identity user.
- Kiwimpact issues its own HttpOnly cookie.
- Same-email accounts are not automatically linked.
- Linking requires an authenticated settings flow.
- Pure Google users do not see Change Password unless a local password exists.

### Auth Endpoint Implementation

- Implement thin custom auth endpoints around `UserManager` and
  `SignInManager`; do not expose Identity persistence entities as API
  contracts.
- External-login and post-login return URLs must be local or explicitly
  allowlisted to prevent open redirects.

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
