# ADR-0002: Use ASP.NET Core Identity with Cookie Authentication

- Status: Accepted
- Date: 2026-07-19
- Decider: Product owner
- Decision source: `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`
- Supersedes: None

> The authentication direction is already accepted in the planning baseline.

## Context

Kiwimpact supports Guest, Member, Organizer, and Admin roles. Authenticated
users need email/password registration, Google sign-in, account recovery,
email confirmation, protected role capabilities, and resource-level ownership
checks.

The MVP is a first-party browser application. It does not require a public
third-party API, native mobile authentication, or independent bearer-token
clients.

## Decision

Kiwimpact will use ASP.NET Core Identity for account storage, password hashing,
tokens, lockout, and external-login integration.

The application will issue its own HttpOnly authentication cookie. It will not
implement a custom JWT authentication system for the MVP.

The API will expose thin custom authentication endpoints built around
`UserManager` and `SignInManager`; Identity persistence entities will not be
used as public API contracts.

Supported sign-in methods are:

1. email/password;
2. Google external login.

## Required account flows

- registration;
- email confirmation and resend;
- login and logout;
- forgot/reset password;
- change password;
- Google external login;
- authenticated account linking;
- account lockout and endpoint rate control.

Local development email uses Mailpit. The production email provider is deferred
to deployment planning.

## Cookie and request security

- Cookies are HttpOnly.
- `SameSite=Lax` is the initial policy.
- `Secure=true` is required in production.
- `Secure=false` is permitted only for explicitly configured local HTTP
  development.
- State-changing HTTP requests use ASP.NET Core antiforgery protection.
- The shared frontend client sends `X-CSRF-TOKEN`.
- CORS uses explicit origins and never combines wildcard origins with
  credentials.
- External-login and post-login return URLs must be local or allowlisted.

The exact antiforgery token-issuance flow and final token lifetimes belong in
the accepted authentication/API specification.

## Account behavior

- Email confirmation is required before normal email/password login.
- Forgot-password responses do not reveal whether an account exists.
- Login failure uses a generic response.
- Google authenticates the user; Kiwimpact creates or locates the local
  Identity account and issues the Kiwimpact cookie.
- Same-email accounts are not linked automatically.
- Linking requires an authenticated account-settings flow.
- A Google-only user does not see Change Password until a local password
  exists.

Planning targets are approximately 24 hours for confirmation tokens and
30–60 minutes for password-reset tokens. Exact values require specification
and verification before implementation.

## Authorization boundary

- ASP.NET Core authentication and role checks provide coarse access control.
- Application services enforce resource ownership, action-level authorization,
  and domain invariants.
- Services do not assume every caller passed through HTTP middleware.
- Protected operations evaluate `actor + action + resource`.
- Public operations may support anonymous access only when the accepted
  contract explicitly allows it.

## Consequences

### Benefits

- Uses the supported .NET identity stack instead of custom credential code.
- Provides established hashing, token, lockout, and external-login behavior.
- HttpOnly cookies reduce direct JavaScript access to authentication material.
- The model fits a first-party browser application.

### Costs and trade-offs

- Cookie authentication requires correct CSRF, CORS, proxy, and deployment
  configuration.
- Google login and account linking require careful callback and redirect
  handling.
- Identity behavior must be wrapped so persistence details do not leak into
  application contracts.
- Deployment must provide secret management and a production email service.

## Alternatives considered

### Custom JWT access and refresh tokens

Rejected because there is no demonstrated independent-client need and a custom
token lifecycle would add avoidable security and revocation complexity.

### Custom password/account implementation

Rejected because credential storage, hashing, recovery, lockout, and token
handling should use the framework-supported identity system.

### Google-only authentication

Rejected because the accepted product requires email/password accounts as well
as Google login.

## Verification

This decision is implemented only when Identity and cookie configuration exist,
all accepted account flows work, CSRF and authorization tests pass, rate limits
protect authentication endpoints, production cookie/redirect behavior is
verified, and `PROJECT_STATUS.md` records the observed results.

## Review triggers

Review this ADR if a native mobile or third-party API client becomes an accepted
requirement, deployment topology prevents the cookie model from working
securely, authentication moves to a managed provider, or account-linking
requirements change.
