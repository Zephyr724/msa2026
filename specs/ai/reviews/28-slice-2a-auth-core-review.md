# Slice 2A Authentication Core Independent Review

- **Date:** 2026-07-24
- **Slice:** Slice 2A — Email/Password Authentication Core
- **Primary reviewer:** Kimi K3 Max
- **Secondary confirmation reviewer:** OpenAI Codex 5.6 Sol, High effort,
  fresh session
- **Mode:** Read-only
- **Final accepted verdict:** APPROVE

Two read-only reviewers were used as a one-time model-comparison experiment.
The primary cross-model review is the independent review used for acceptance.
The secondary review is recorded only as confirmation and is not an additional
acceptance gate.

## Actual review prompt

```text
# Slice 2A Authentication Commit Review — Read Only

Act as the independent security and commit-readiness reviewer for
Slice 2A: Email/Password Authentication Core.

This is a bounded read-only review.

## Permissions

Do not:

- modify, create, delete, format, stage, commit, push, reset, revert, or merge
  files;
- implement fixes;
- rewrite documentation;
- add tests;
- expand into Slice 2B or later product work.

## Evidence limits

Read only:

1. AGENTS.md
2. specs/product/04-phase-2-delivery-scope.md
3. specs/adr/ADR-0009-use-single-origin-deployment.md
4. specs/implementation/02a-email-password-auth-core.md
5. the current branch diff
6. directly changed production and test files
7. specs/implementation/reports/02a-email-password-auth-core-completion.md

Do not read:

- historical prompts or reviews;
- Slice 1 evidence;
- unrelated ADRs;
- Slice 2B implementation details except when needed to confirm that a feature
  is out of scope.

Do not inspect more than 30 files without stopping for human approval.
Do not repeatedly reopen unchanged files.
Do not repeatedly run git status or full test suites.
Stop tool use and return a verdict once sufficient evidence exists.

## Claimed final results

The implementation session reported:

- backend build: passed, 0 warnings and 0 errors;
- backend unit tests: 37/37 passed;
- PostgreSQL integration tests: 82/82 passed;
- frontend tests: 73/73 passed;
- frontend lint: passed;
- frontend type-check: passed;
- frontend production build: passed;
- git diff check: passed;
- real HTTP register → login → me → logout flow passed;
- real browser registration, login, authenticated navigation, and logout
  passed with no console errors.

Do not rerun all full suites merely to repeat these results.
You may run focused tests or lightweight commands when needed to verify a
specific concern.

## Review requirements

Verify only the following:

### Authentication and authorization

1. Public registration always creates Member only.
2. A public caller cannot select or obtain Organizer or Admin.
3. Registration creates the Identity user and UserProfile atomically.
4. Login uses ASP.NET Core Identity Cookie authentication.
5. No JWT or custom password hashing was introduced.
6. `/me` returns 401 anonymously and the accepted session DTO when
   authenticated.
7. Logout invalidates the authenticated session.

### Cookie and CSRF

8. The authentication Cookie is HttpOnly and SameSite=Lax.
9. Secure Cookie behaviour is correct for Development and production intent.
10. Unsafe authentication requests enforce the accepted CSRF model.
11. Missing or invalid CSRF tokens fail safely.
12. CSRF refresh and retry occur at most once and cannot loop.
13. CSRF handling does not retry unrelated authorization or server failures.

### Security and abuse protection

14. Authentication errors do not unnecessarily reveal account existence.
15. Lockout and rate limiting match the approved Slice 2A scope.
16. Role seeding is idempotent.
17. Development demo accounts are opt-in.
18. No password, secret, or sensitive local configuration is committed.
19. Demo credentials cannot be accidentally enabled in production.

### Persistence and migration

20. UserProfile is introduced through an additive migration.
21. The migration works for a clean database and a valid Slice 1 upgrade.
22. Identity and UserProfile relationships preserve data integrity.
23. The migration does not modify or replace accepted historical migrations.

A stale pre-existing local Docker volume is not itself a product defect unless
the same failure is reproducible from a clean repository and clean volume.

### Frontend state and UX

24. TanStack Query owns authenticated server state.
25. User identity is not duplicated in Zustand.
26. Login and registration pages handle loading, validation, invalid
    credentials, CSRF failure, and rate limiting.
27. Signed-in and signed-out navigation reflect the real `/auth/me` state.
28. Authentication forms remain keyboard-usable and responsive.

### Scope and evidence

29. No Slice 2B functionality was introduced.
30. No Organizer CRUD, participation, XP, leaderboard, SignalR, Cypress,
    Storybook, or unrelated refactoring was introduced.
31. No unapproved dependency was added.
32. The completion report accurately reflects the current implementation and
    observed verification results.

## Blocking policy

Blocker:

- authentication bypass;
- privilege escalation;
- committed secret;
- destructive or unusable migration;
- core register/login/me/logout flow does not work.

Major:

- accepted Slice 2A Definition of Done is unmet;
- CSRF protection is ineffective or bypassable;
- unsafe Cookie configuration;
- account-enumeration defect;
- non-atomic registration causes inconsistent user/profile state;
- role or demo-account seeding is unsafe;
- completion evidence is materially false;
- accepted architecture or scope is violated.

Minor:

- real but non-blocking maintainability, documentation, test clarity, or local
  operational issue.

Do not block for:

- naming preferences;
- optional refactoring;
- more-test suggestions beyond the accepted Definition of Done;
- documentation polish;
- Slice 2B features;
- future deployment-provider work;
- theoretical concerns without concrete evidence.

## Required output

Return exactly:

1. Blockers
2. Majors
3. Minors
4. Verification performed
5. Final verdict

For every Blocker or Major provide:

- exact file and line;
- violated Slice 2A requirement;
- concrete evidence;
- why current tests do not close it;
- smallest required correction.

Use one verdict only:

APPROVE

or

TARGETED FIX REQUIRED

Return APPROVE when:

- Blocker = 0;
- Major = 0;
- the reported final gates remain credible.

Do not request another full review.
```

## Primary cross-model review result

- **Reviewer:** Kimi K3 Max
- **Blockers:** 0
- **Majors:** 0
- **Minors:** 1
- **Verdict:** APPROVE

### Deferred Minor finding

`frontend/src/pages/LoginPage.tsx:31-35`

After the single CSRF retry, remaining non-429 login failures, including a
persistent CSRF failure or a server error, may be displayed as:

> The email or password is incorrect.

This is a non-blocking error-classification and UX issue.

## Secondary confirmation result

- **Reviewer:** OpenAI Codex 5.6 Sol, High effort, fresh read-only session
- **Blockers:** 0
- **Majors:** 0
- **Minors:** 0
- **Verdict:** APPROVE

The secondary review is a one-time model-comparison confirmation and does not
create another acceptance gate.

## Verification performed

Primary reviewer focused verification:

- Login rate-limit PostgreSQL integration test: 1/1 passed.
- Frontend `apiFetch` unit tests: 6/6 passed.
- `git diff --check`: passed.

Secondary confirmation review:

- Reviewed the permitted Slice 2A specifications, ADR, completion report,
  current branch diff, and prioritized changed production and test files in
  read-only mode.
- Verified the authentication, authorization, Cookie, CSRF, abuse-protection,
  persistence, frontend-state, UX, scope, dependency, and evidence boundaries.
- Did not repeat the reported full suites; the reported results remained
  credible and consistent with the implementation and focused coverage.

## Human decision

- Accept the primary APPROVE verdict.
- Record the secondary APPROVE result as confirmation only.
- Defer the non-blocking Login error-classification Minor to later
  UI/error-state polish.
- Do not modify production code for this evidence task.
- Do not request another review.
- Slice 2A is ready for human staging and commit inspection.
