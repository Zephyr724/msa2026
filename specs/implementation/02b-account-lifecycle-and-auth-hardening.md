# Slice 2B — Account Lifecycle and Authentication Hardening

- **Status:** Proposed P1 task — pending Slice 2A and deployed P0 stability
- **Date:** 2026-07-24
- **Risk:** High — account recovery, security tokens, email, and lockout

## 1. Goal

Complete the long-term email/password account lifecycle after Slice 2A by
adding confirmation, recovery, password change, local email delivery, and
focused authentication hardening.

Slice 2B preserves the complete long-term authentication goal. It is a
separate later task so lifecycle complexity does not block the core
authentication path.

## 2. Entry conditions

- Slice 2A is accepted and its tests pass.
- Register, login, me, logout, cookies, CSRF, roles, and UserProfile are stable.
- P0 deployment is working or the human confirms sufficient deadline margin.
- Email delivery and token-lifetime decisions have explicit human approval.
- No unresolved Slice 2A Blocker or Major remains.

## 3. Scope

### Backend

- Require email confirmation for normal email/password login.
- Confirm-email endpoint.
- Resend-confirmation endpoint.
- Forgot-password endpoint.
- Reset-password endpoint.
- Authenticated change-password endpoint.
- Local Mailpit email delivery for Development.
- Explicit confirmation-token lifetime.
- Explicit reset-token lifetime.
- Non-enumerating resend and recovery responses.
- Focused rate-limit and lockout hardening.
- Safe token encoding, validation, expiry, and one-time account-state
  behaviour using ASP.NET Core Identity.
- Scalar documentation.
- Focused unit and PostgreSQL integration tests.

### Frontend

- Confirmation result page.
- Resend-confirmation flow.
- Forgot-password page.
- Reset-password page.
- Authenticated change-password page.
- Clear expired/invalid-token states.
- Non-enumerating recovery copy.
- Accessible loading, success, validation, and retry states.
- Tests for all lifecycle pages and HTTP flows.

## 4. Security requirements

- Use ASP.NET Core Identity token providers; do not implement custom recovery
  tokens or password hashing.
- Record and test the accepted confirmation-token lifetime.
- Record and test the accepted reset-token lifetime.
- Forgot-password and resend responses do not reveal account existence.
- Reset and confirmation tokens are treated as secrets and are not logged.
- Links use approved local/allowlisted return paths.
- Password change requires the authenticated user's current password.
- Rate limits cover resend, forgot, reset, and relevant confirmation paths.
- Lockout behaviour remains compatible with Slice 2A.
- Email content contains no password or authentication cookie.
- Production email-provider selection remains a separate deployment decision.

Initial planning targets remain approximately 24 hours for confirmation and
30–60 minutes for reset. Exact values require human approval before
implementation.

## 5. Mailpit boundary

- Mailpit is Development-only local delivery and inspection.
- No Mailpit dependency or endpoint is exposed as a production feature.
- Tests must not depend on a developer's persistent local mailbox.
- Production email credentials and provider configuration are not committed.

## 6. Out of scope

- Google login and account linking.
- Role-management UI.
- Profile editing beyond what a lifecycle screen strictly needs.
- Organizer Quest CRUD, participation, XP, achievements, leaderboard, or
  SignalR.
- Production email-provider selection unless separately approved.
- Any new dependency without explicit human approval.

Google login remains deferred from the current submission schedule.

## 7. Definition of Done

- A new account can confirm its email through the supported flow.
- Resend works without account enumeration.
- Forgot/reset works without account enumeration and respects token expiry.
- An authenticated local-password user can change password safely.
- Mailpit demonstrates the local confirmation and recovery flow.
- Confirmation and reset lifetimes are documented and tested.
- Rate-limit and lockout coverage protects the lifecycle endpoints.
- Relevant frontend and backend tests pass.
- Scalar and user-facing documentation match actual behaviour.
- No token, password, cookie, or provider secret is committed or logged.

## 8. Deadline rule

Slice 2B must not block Organizer Quest CRUD, initial production deployment,
README completion, or the six-minute video when the deadline is at risk.
If P0 is not safely deployed, defer Slice 2B without weakening Slice 2A's
cookie, CSRF, role, validation, rate-limit, or secret-handling controls.

## 9. Stop conditions

Stop for human direction if implementation requires a new dependency, changes
the accepted cookie/CSRF model, needs a production email provider, changes
Identity/schema decisions, or threatens P0 deployment and submission work.
