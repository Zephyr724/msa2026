# Prompt 37 — Slice 2A Authentication Core Implementation

- **Date:** 2026-07-24
- **Model/tool:** Codex (GPT-5), local terminal, `apply_patch`, .NET/EF Core tooling, Vitest, Docker PostgreSQL, curl, and the in-app browser
- **Human decision:** `APPROVED AFTER INDEPENDENT REVIEW`

## Actual prompt

```text
# Implement Slice 2A — Email/Password Authentication Core

Act as the sole implementation owner.

This is a medium/high-risk authentication, Cookie, CSRF, and migration task.

## Preconditions

Run:

- git status --short
- git branch --show-current
- git log --oneline --decorate -5
- git diff --check HEAD

Expected branch:

feat/slice-2a-auth-core

The working tree must be clean before implementation.

Stop and report if:

- the branch is wrong;
- unrelated changes exist;
- an accepted authentication/schema decision is contradictory;
- a new dependency appears necessary.

## Read

- AGENTS.md
- specs/product/04-phase-2-delivery-scope.md
- specs/adr/ADR-0009-use-single-origin-deployment.md
- specs/implementation/02a-email-password-auth-core.md
- directly referenced authentication/security/API/data specifications
- directly affected Identity persistence, API, frontend, and test files

Do not read:

- historical AI prompts;
- historical AI reviews;
- Slice 1 correction reports;
- Slice 1 completion evidence;
- unrelated Product or ADR documents.

## Goal

Deliver a working frontend/API flow:

register
→ login
→ authenticated `/me` session
→ logout

using ASP.NET Core Identity, secure Cookie authentication, additive PostgreSQL
persistence, and anti-CSRF protection.

## Scope

Implement exactly the approved Slice 2A task contract.

Backend scope:

- activate ASP.NET Core Identity Cookie authentication;
- preserve the accepted Identity persistence foundation;
- add Member, Organizer, and Admin role constants and safe seed configuration;
- public registration creates Member only;
- add UserProfile using an additive EF Core migration;
- implement register;
- implement login;
- implement logout;
- implement me/current-session;
- implement anti-CSRF token endpoint;
- enforce anti-CSRF validation for relevant state-changing authentication
  requests;
- use generic authentication errors that avoid unnecessary account
  enumeration;
- implement approved basic lockout/rate limiting without adding dependencies;
- create development-only demo Organizer/Admin accounts only when explicitly
  configured;
- read demo passwords from environment/local configuration;
- never commit demo passwords or secrets;
- expose accurate Scalar documentation;
- add focused unit and PostgreSQL integration tests.

Frontend scope:

- add `/login`;
- add `/register`;
- load authenticated state from `/auth/me`;
- send Cookie credentials;
- add CSRF acquisition, cache, refresh, and one safe retry to `apiFetch`;
- show correct signed-in/signed-out navigation;
- handle loading, invalid credentials, validation, unauthenticated, CSRF, and
  rate-limit states;
- maintain responsive and keyboard-usable forms;
- use TanStack Query for auth server state;
- do not store user identity in Zustand;
- add focused frontend tests.

## Out of scope

Do not implement:

- email confirmation;
- resend confirmation;
- forgot password;
- reset password;
- change password;
- Google login;
- profile editing;
- role-management UI;
- Organizer Quest CRUD;
- participation or completion;
- XP, achievements, leaderboard;
- SignalR;
- Cypress;
- Storybook;
- theme switching unless required only to preserve existing styling;
- new UI/form libraries;
- unrelated refactoring.

## Human approval gates

Stop before:

- adding or changing any dependency;
- changing the approved Cookie model;
- changing the approved CSRF model;
- changing ADR-0009;
- changing an accepted public API contract outside Slice 2A;
- replacing the additive migration strategy;
- deleting or replacing an accepted migration;
- introducing custom password hashing;
- introducing JWT authentication;
- adding secrets to tracked configuration;
- staging, committing, pushing, resetting, reverting, or merging.

## Execution

1. Inspect the current Identity persistence and application composition.
2. Return an implementation plan of no more than 10 bullets.
3. Continue directly into implementation unless a human approval gate is hit.
4. Implement backend, migration, frontend, and focused tests together.
5. Run targeted tests during development.
6. Do not repeatedly rerun successful full suites.
7. Run all applicable final gates once after implementation is complete.
8. Perform one local runtime smoke verification of register, login, me, and
   logout when the environment permits.
9. Create the completion report only after final gates pass.
10. Do not stage or commit.

## Required backend evidence

Tests must prove at least:

- registration creates Identity user and UserProfile atomically;
- public registration cannot select Organizer or Admin;
- registered user receives Member only;
- duplicate/invalid registration fails safely;
- login succeeds with valid credentials;
- login failure response does not unnecessarily reveal account existence;
- successful login creates the expected Cookie;
- me returns 401 anonymously;
- me returns the accepted public session DTO when authenticated;
- logout clears the session;
- relevant state-changing requests without valid CSRF are rejected;
- configured role/demo seeding is idempotent;
- demo secrets are not hard-coded;
- additive migration applies to a clean PostgreSQL database.

## Required frontend evidence

Tests must prove at least:

- register form validation and submit behaviour;
- login success and failure states;
- authenticated shell loading;
- signed-in/signed-out navigation;
- `/auth/me` anonymous and authenticated behaviour;
- CSRF token acquisition;
- one safe CSRF refresh/retry;
- no retry loop;
- rate-limit/error state;
- user identity is not placed in Zustand.

## Final verification

Use the repository's verified equivalents of:

Backend:

- dotnet build Kiwimpact.slnx --no-incremental
- backend unit tests
- PostgreSQL integration tests

Frontend:

- npm run lint
- npm run type-check
- npm run test -- --run
- npm run build

Repository:

- git diff --check HEAD
- git status --short
- inspect changed and untracked files for secrets or generated output

Do not run dependency scans unless dependency files changed.

## Evidence files

Create:

1. specs/ai/prompts/37-slice-2a-auth-core-implementation.md
2. specs/implementation/reports/02a-email-password-auth-core-completion.md

Prompt 37 must contain:

- actual prompt;
- model/tool;
- files changed;
- verification results;
- unresolved limitations;
- human decision placeholder `PENDING INDEPENDENT REVIEW`.

The completion report must contain only observed results.

Do not create multiple correction or rereview prompt files.

## Completion threshold

Complete only when:

- every Slice 2A Definition of Done item passes;
- Blocker = 0;
- Major = 0;
- register/login/me/logout work through real frontend/API integration;
- Cookie and CSRF behaviour have focused integration coverage;
- no secret or demo password is committed;
- all applicable final gates pass.

## Final response

Return:

1. files changed;
2. migration summary;
3. backend behaviour;
4. frontend behaviour;
5. Cookie and CSRF controls;
6. role and secret handling;
7. tests added;
8. exact commands and observed results;
9. runtime smoke result;
10. known Minor issues;
11. remaining Blockers;
12. remaining Majors;
13. commit-readiness recommendation.
```

## Files changed

### Backend

- `backend/src/Kiwimpact.Api/Contracts/AuthContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/AuthController.cs`
- `backend/src/Kiwimpact.Api/Program.cs`
- `backend/src/Kiwimpact.Api/Security/ApiAntiforgeryFilter.cs`
- `backend/src/Kiwimpact.Api/Security/AuthRateLimitPolicies.cs`
- `backend/src/Kiwimpact.Api/appsettings.json`
- `backend/src/Kiwimpact.Api/appsettings.Development.json`
- `backend/src/Kiwimpact.Core/Authorization/AppRoles.cs`
- `backend/src/Kiwimpact.Core/Entities/UserProfile.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserProfileConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContextFactory.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/IdentitySeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260724083505_AddUserProfileForAuthCore.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260724083505_AddUserProfileForAuthCore.Designer.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/AuthApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/AuthMigrationUpgradeTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/AuthCoreContractTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj`

### Frontend

- `frontend/src/app/AppShell.tsx`
- `frontend/src/app/providers.tsx`
- `frontend/src/app/queryClient.ts`
- `frontend/src/app/router.tsx`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/lib/api/apiFetch.ts`
- `frontend/src/lib/api/auth.ts`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/types/auth.ts`
- `frontend/tests/integration/AppShell.test.tsx`
- `frontend/tests/integration/AuthFlow.test.tsx`
- `frontend/tests/unit/apiFetch.test.ts`

### Evidence

- `specs/ai/prompts/37-slice-2a-auth-core-implementation.md`
- `specs/implementation/reports/02a-email-password-auth-core-completion.md`

## Verification results

- `dotnet build Kiwimpact.slnx --no-incremental`: passed, 0 warnings, 0 errors.
- Unit test suite: passed, 37/37.
- PostgreSQL integration suite: passed, 82/82.
- `npm run lint`: passed with no findings.
- `npm run type-check`: passed.
- Frontend test suite: passed, 73/73.
- `npm run build`: passed; Vite production bundle generated successfully.
- Real HTTP smoke: register 201, login 200, me 200, logout 204, me after
  logout 401; Member session returned; auth cookie observed HttpOnly and
  SameSite=Lax.
- Real browser smoke: register, login, authenticated navigation, and logout
  passed against the running frontend/API; zero browser console errors.

## Unresolved limitations

- The required independent read-only review must be performed by a different
  session before human acceptance; this implementation session cannot review
  its own work.
- Production deployment and HTTPS cookie behaviour were not exercised in this
  local Slice 2A run.
- The pre-existing default local database volume has stale tables without
  matching EF migration history. It was not repaired or deleted. Runtime smoke
  used the separate `kiwimpact_auth_smoke_20260724` database instead.
