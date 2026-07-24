# Slice 2A — Email/Password Authentication Core Completion Report

- **Date:** 2026-07-24
- **Branch:** `feat/slice-2a-auth-core`
- **Implementation status:** Implemented and verified locally; independent
  read-only review remains pending.
- **Commit status:** Not staged and not committed.

## Observed implementation

### Migration and persistence

- Added migration `20260724083505_AddUserProfileForAuthCore`.
- The migration creates `UserProfiles` only; it does not delete or replace an
  accepted migration.
- `UserProfiles.Id` is the primary key and cascading FK to `AspNetUsers.Id`.
- `HomeCommunityRegionId` is nullable and uses a restricting FK to `Regions`.
- `DisplayName` is required with maximum length 100.
- `ShowCommunityOnPassport` defaults to false; community/change fields start
  null; created/updated timestamps are required.
- PostgreSQL tests applied all migrations to an empty database and applied the
  new migration over the Slice 1 migration target.

### Backend behaviour

- ASP.NET Core Identity application-cookie authentication and authorization
  middleware are active.
- Register accepts email, password, password confirmation, and display name;
  it never accepts a role contract and always assigns Member server-side.
- Identity user creation, Member assignment, and UserProfile creation execute
  in one PostgreSQL transaction.
- Login uses `SignInManager.PasswordSignInAsync` with lockout enabled.
- Unknown email, wrong password, and locked account returned the same generic
  invalid-credentials Problem Details response in integration tests.
- `/api/v1/auth/me` returns only user ID, display name, email, and roles; it
  returned 401 without authentication.
- Logout clears the Identity application cookie and invalidates the observed
  session.
- Scalar/OpenAPI receives controller summaries, response declarations, DTOs,
  and required `X-CSRF-TOKEN` header parameters for auth POST endpoints.

### Cookie, CSRF, lockout, and rate control

- Auth cookie name is `Kiwimpact.Auth`; it is HttpOnly, SameSite=Lax, an
  eight-hour sliding session, Secure in non-Development, and local-request
  secure policy in Development.
- Antiforgery cookie name is `Kiwimpact.Csrf`; the request header is
  `X-CSRF-TOKEN`.
- A global API authorization filter validates antiforgery on every unsafe
  `/api` request and emits a specific sanitized Problem Details type on failure.
- Missing/invalid CSRF was rejected for register, login, and logout in
  PostgreSQL integration tests.
- Identity lockout is 5 failed attempts for 15 minutes.
- Fixed-window IP policies enforce 5 register requests and 10 login requests
  per 15 minutes; the login test observed 429 on the eleventh request.
- Cookie challenges returned 401/403 without browser redirects.

### Roles and secrets

- `Member`, `Organizer`, and `Admin` have one constant source in Core.
- Role seeding is idempotent and enabled by safe base configuration.
- Automatic database migration, Region/Quest demo data, and demo accounts are
  restricted to Development.
- Demo accounts require `Seed:DemoAccounts=true` plus configured email/password
  values. Missing values skip account creation; no default password exists.
- Demo accounts receive Member plus their elevated role and a UserProfile.
- No demo password or secret value was added to tracked settings, fixtures, or
  evidence.

### Frontend behaviour

- Added responsive `/login` and `/register` screens with labelled controls,
  keyboard submission, loading states, validation alerts, generic auth errors,
  and 429 guidance.
- The shell restores `/api/v1/auth/me` through TanStack Query and renders
  loading, recoverable failure, signed-out, and signed-in navigation.
- Login populates the TanStack Query auth key; logout sets that key to null.
- Auth identity/roles are not stored in Zustand, localStorage, or sessionStorage.
- `apiFetch` always requests Cookie credentials, lazily acquires/caches CSRF,
  refreshes only for the exact CSRF Problem Details type, and retries a replayable
  unsafe request once only.
- After login/logout, the cached CSRF request token is cleared.

## Tests added or expanded

- 3 auth-focused unit tests cover stable roles, UserProfile defaults/
  normalization, registration validation, and absence of a public role field.
- 9 focused PostgreSQL auth/migration tests cover atomic Member/Profile
  registration, role-input rejection, duplicate/invalid registration, Cookie
  login/me/logout, generic failure/lockout, CSRF, rate limiting, role/demo
  idempotency, and Slice 1 migration upgrade.
- Frontend tests cover CSRF acquisition/cache/refresh/single retry/retry stop,
  Cookie credentials, login/register validation and submission, generic and
  rate-limit errors, session shell states/navigation, logout, and the Zustand/
  browser-storage boundary.

## Exact final verification results

From `backend/`:

```text
dotnet build Kiwimpact.slnx --no-incremental
Build succeeded. 0 Warning(s), 0 Error(s).

dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
Passed: 37, Failed: 0, Skipped: 0.

dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
Passed: 82, Failed: 0, Skipped: 0.
```

From `frontend/`:

```text
npm run lint
Passed with no findings.

npm run type-check
Passed.

npm run test -- --run
Test files: 7 passed. Tests: 73 passed.

npm run build
Passed. 1,851 modules transformed; production assets generated.
```

## Runtime smoke results

- A dedicated local PostgreSQL database,
  `kiwimpact_auth_smoke_20260724`, received both accepted migrations.
- Real HTTP sequence: register 201 → login 200 → me 200 (`Runtime Smoke`,
  `Member`) → logout 204 → me 401.
- Login response cookie inspection observed HttpOnly and SameSite=Lax.
- Real Vite/browser sequence: Create account success → login → shell displayed
  `UI Runtime Smoke` with Sign out → logout → signed-out links restored.
- Browser console errors observed: 0.
- The frontend/API/PostgreSQL processes used for smoke were stopped afterward.
- The repository PostgreSQL container was returned to its prior stopped state.
- The dedicated smoke database remains in the stopped local Docker volume; it
  was not deleted because destructive operations require explicit approval.
- The pre-existing default local database contained application tables without
  matching migration history. The initial startup created/verified the EF
  history table and then stopped on the existing-table collision; no existing
  table was deleted or replaced.

## Observed limitations and acceptance state

- Production deployment, HTTPS ingress, and production key management were not
  exercised in this local task.
- The default local development database requires a separate human-approved
  reconciliation or reset before normal local startup can migrate it cleanly.
- No implementation Blocker or Major failure was observed by the implementing
  session.
- Independent read-only review by a different session is still required before
  the Slice 2A acceptance threshold can be declared complete.

## Independent-review closure

- Primary review verdict: APPROVE.
- Secondary confirmation: APPROVE.
- Remaining Blockers: 0.
- Remaining Majors: 0.
- One non-blocking Login error-classification Minor remains deferred: after the
  single CSRF retry, a persistent CSRF failure or server error may be presented
  as an invalid-credentials message.
- Slice 2A is ready for human staging and commit inspection.
