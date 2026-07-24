# Slice 2A — Email/Password Authentication Core

- **Status:** Proposed — pending design review and implementation approval
- **Date:** 2026-07-24
- **Risk:** High — authentication, authorization, secrets, and additive schema
  change
- **Implementation owner:** One Codex implementation session
- **Review:** One independent read-only review in a separate session

## 1. Goal

Deliver the smallest secure email/password authentication vertical slice:
register, login, restore the current session, and logout through the React
frontend and ASP.NET Core API using Identity cookies and antiforgery
protection.

Public registration creates a Member only. Organizer and Admin access exists
only through controlled Development demo-account configuration.

## 2. Scope

### 2.1 Backend

- Activate ASP.NET Core Identity cookie authentication.
- Configure authentication and authorization middleware in the API
  composition root.
- Define stable `Member`, `Organizer`, and `Admin` role constants.
- Seed roles idempotently.
- Add `UserProfile` through one additive EF Core migration.
- Create a `UserProfile` atomically with a registered Identity user.
- Add register, login, logout, current-session, and antiforgery-token
  endpoints.
- Apply antiforgery validation to state-changing authentication requests.
- Use generic authentication failures where detail would unnecessarily reveal
  account existence.
- Configure basic approved Identity lockout and ASP.NET Core rate limiting
  without new dependencies.
- Support Development-only demo Organizer and Admin accounts.
- Document endpoints and response contracts in Scalar.
- Add focused unit and PostgreSQL integration tests.

### 2.2 Frontend

- Add `/login`.
- Add `/register`.
- Restore authenticated shell state from `/api/v1/auth/me`.
- Send `credentials: "include"` through the shared HTTP client.
- Acquire, cache, and refresh the antiforgery request token in `apiFetch`.
- Retry one failed state-changing request once after a safe antiforgery-token
  refresh.
- Show signed-in and signed-out navigation.
- Provide responsive and keyboard-usable loading, validation, and error
  states.
- Keep authoritative authentication state in TanStack Query.
- Do not store user identity, roles, or authentication state in Zustand.
- Do not persist the auth cookie or user DTO in browser storage.
- Preserve only safe local navigation intent; do not accept open redirects.

## 3. Accepted backend contract

### 3.1 Endpoints

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/auth/csrf-token` | None | Issue antiforgery request token and cookie |
| `POST` | `/api/v1/auth/register` | None | Create Member account and UserProfile |
| `POST` | `/api/v1/auth/login` | None | Validate credentials and issue Identity cookie |
| `GET` | `/api/v1/auth/me` | Member+ | Return current session summary |
| `POST` | `/api/v1/auth/logout` | Member+ | Clear the Identity cookie |

Register, login, and logout require a valid antiforgery token. The token is
not an authentication credential.

### 3.2 Registration

- Accept email, password, password confirmation, and display name.
- Normalize and validate server-side.
- Never accept a public role field.
- Assign `Member` server-side even if a client sends extra role-like input.
- Create the Identity user and accepted `UserProfile` in one coherent
  transaction or compensate safely if Identity store boundaries require it.
- Use the accepted UserProfile schema: matching Identity `Id`, required
  `DisplayName` (maximum 100), null initial community/change timestamp,
  `ShowCommunityOnPassport=false`, and UTC audit timestamps.
- Return an allowlisted account/session DTO, never an Identity entity.
- Do not expose password-policy internals beyond useful validation guidance.

Email confirmation is not implemented in Slice 2A. Slice 2B introduces the
confirmation requirement and delivery flow. This sequencing does not remove
the long-term requirement.

### 3.3 Login and session

- Use `SignInManager`/Identity APIs; do not compare hashes directly.
- Return one generic invalid-credentials response for unknown email, wrong
  password, and other failures where distinction is unnecessary.
- Apply configured lockout behaviour without revealing whether the account
  exists.
- `/auth/me` returns only the current user's public shell needs: user ID,
  display name, email where required for the account surface, and role names.
- Anonymous `/auth/me` returns `401` safely.

### 3.4 Logout

- Require authentication and a valid antiforgery token.
- Clear the application authentication cookie.
- The frontend clears/invalidate its TanStack Query session cache after the
  server confirms logout.

### 3.5 Cookie and antiforgery

- Use the ASP.NET Core Identity application cookie.
- Local HTTP may explicitly use `Secure=false`.
- Production uses `Secure=true`.
- `SameSite=Lax` is the default.
- The frontend reads only the returned antiforgery request token, never the
  authentication cookie.
- `apiFetch` sends `X-CSRF-TOKEN` for state-changing requests.
- On an antiforgery validation failure, refresh once and retry once only.
- Do not retry invalid credentials, authorization failures, or arbitrary
  state-changing failures.
- Production behaviour follows ADR-0009's single-origin topology after that
  ADR is accepted.

### 3.6 Roles and authorization

- Define one source of truth for `Member`, `Organizer`, and `Admin` constants.
- Seed role records idempotently.
- Public registration always receives Member only.
- Member cannot access Organizer/Admin endpoints.
- Organizer and Admin role assignment is never accepted from public input.
- Coarse role checks use ASP.NET Core authorization.

### 3.7 Demo accounts and secrets

- Demo Organizer and Admin accounts exist only in Development when explicitly
  enabled.
- Passwords come from environment variables, .NET User Secrets, or other local
  uncommitted configuration.
- Missing passwords skip/fail safely; never substitute a committed default.
- Never log passwords, cookies, antiforgery tokens, password hashes, or secret
  configuration values.
- No demo password appears in source, tracked settings, fixtures, prompt
  evidence, README, screenshots, or video.

### 3.8 Lockout and rate limiting

- Use ASP.NET Core Identity lockout with explicit documented values.
- Use built-in ASP.NET Core rate limiting; add no dependency.
- Protect register and login at minimum.
- Consider both trusted client IP and normalized account identifier where
  safely supported.
- Return `429` without exposing account existence.

## 4. Tests

### 4.1 Unit tests

- Role constants and public Member assignment.
- Registration validation and allowlisted mapping.
- Generic login-error mapping.
- Any pure antiforgery-retry classification logic.

### 4.2 PostgreSQL integration tests

- Additive migration applies to an empty database and the Slice 1 schema.
- UserProfile has the accepted one-to-one Identity relationship.
- Registration creates Member and UserProfile.
- Public input cannot assign Organizer/Admin.
- Valid login issues the application cookie.
- `/auth/me` returns the authenticated allowlisted session.
- Logout invalidates the session.
- Missing and invalid antiforgery tokens reject register, login, and logout.
- Valid antiforgery flow succeeds.
- Wrong password and unknown account use non-enumerating failures.
- Lockout and rate-limit behaviour is focused and deterministic.
- Development demo accounts are absent when seeding is disabled.
- Demo role assignment works only with explicit Development configuration.

### 4.3 Frontend tests

- Login and register loading, validation, success, and generic failure.
- Anonymous, authenticated, loading, and recoverable shell states.
- Signed-in/signed-out navigation.
- Cookie credentials are requested.
- CSRF acquisition, caching, refresh, one retry, and retry stop.
- User identity is not written to Zustand or browser storage.
- Keyboard and accessible error behaviour for the key forms.

## 5. Out of scope

- Email confirmation or resend.
- Forgot, reset, or change password.
- Google login or account linking.
- Profile editing.
- Role-management UI.
- Organizer Quest CRUD.
- Participation.
- XP, achievements, leaderboard, or SignalR.
- Cypress.
- Storybook.
- New UI, form, validation, HTTP, auth, or test dependencies.

## 6. Human approval gates

Stop before:

- adding any dependency;
- changing the accepted cookie or CSRF model;
- changing ADR-0009;
- changing an accepted Identity, API, or schema decision;
- replacing the additive migration strategy;
- storing secrets in repository files;
- applying a migration destructively or outside the approved environment;
- staging, committing, pushing, merging, or deploying.

The human must approve the final implementation plan, schema migration,
security configuration, and independent-review resolution before acceptance.

## 7. Verification

Run targeted tests during implementation. After implementation is complete,
run the verified backend build, unit tests, PostgreSQL integration tests,
frontend lint, type-check, tests, and build once.

Inspect the final diff for dependency, secret, migration, authorization, and
scope changes. Record exact observed commands and results; do not infer them.

## 8. Definition of Done

- Register → login → me → logout works through frontend and API.
- Public registration always receives Member only.
- Authenticated and anonymous shell states work.
- Cookie and CSRF behaviour has focused integration coverage.
- Missing or invalid CSRF is rejected safely.
- Authentication errors do not unnecessarily reveal account existence.
- No secret or demo password is committed.
- Role escalation through public input is rejected.
- UserProfile is created through an approved additive migration.
- Backend and frontend gates pass.
- Scalar documents the implemented endpoints.
- Actual behaviour is documented truthfully.
- A separate-session review reports zero Blockers and zero Majors.

## 9. Stop conditions

Stop and request human direction if secure completion requires a new
dependency, cross-origin production cookies, a different CSRF model, an
unapproved schema decision, a destructive migration, committed credentials,
or expansion into Slice 2B or later product work.
