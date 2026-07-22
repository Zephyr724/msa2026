# Independent Review Task — Slice 0 Foundation Implementation

- **Reviewer:** Claude Sonnet
- **Mode:** Plan
- **Review type:** Independent read-only implementation review
- **Date:** 2026-07-22
- **Implementation branch:** `feat/slice-0-foundation`
- **Expected implementation status:** Complete but not committed
- **Files modified by reviewer:** None
- **Required verdict:** `APPROVE` or `CHANGES REQUIRED`

## 1. Reviewer Role

Review the actual Slice 0 implementation against the approved plan, accepted
architecture, repository rules, and MSA requirements.

This is an implementation review, not another planning exercise.

Do not modify files. Do not fix issues. Do not generate replacement source
files. Report findings only.

## 2. Preconditions

Before reviewing, confirm:

```text
Current branch: feat/slice-0-foundation
Implementation changes: present and uncommitted
Approved Slice 0 plan: available
DeepSeek completion report: available in the current task or working tree
```

Stop and report a Blocker when:

- the current branch is `main`;
- the implementation has already been committed and the requested diff cannot
  be inspected;
- the approved Slice 0 plan is missing;
- the working tree contains unrelated changes that make the implementation
  boundary unclear;
- required source files cannot be read.

## 3. Review Safety Rules

Allowed:

- read files;
- inspect project files and package manifests;
- inspect `git status`, `git diff`, and project-reference information;
- inspect existing build and test output supplied by the implementation agent;
- run non-destructive, read-only inspection commands when available.

Do not:

- edit, create, rename, delete, format, or move files;
- install or upgrade packages;
- run database migrations;
- change configuration;
- commit, push, merge, rebase, reset, clean, or switch branches;
- begin another implementation slice;
- accept a deviation merely because the code builds.

If a verification command would modify tracked files or the environment, do
not run it. Review the implementation agent's recorded command output instead.

## 4. Required Reading

Read:

```text
AGENTS.md
specs/implementation/00-slice-0-foundation.md
specs/ai/reviews/06-slice-0-foundation-plan-review-2026-07-21.md
specs/ai/reviews/07-slice-0-foundation-plan-rereview-2026-07-21.md
specs/00-project-profile.md
specs/adr/ADR-0003-use-clean-architecture-lite.md
.clinerules/00-harness-core.md
.clinerules/01-architecture.md
.clinerules/02-technology-stack.md
.clinerules/03-database.md
.clinerules/04b-auth-security.md
.clinerules/04c-dependency-security.md
.clinerules/04d-runtime-security.md
.clinerules/07-agent-workflow.md
.clinerules/09-msa-assessment.md
.clinerules/10-ai-model-routing-and-cost-control.md
.clinerules/11-git-branch-and-merge-safety.md
README.md
```

Then inspect all created or modified files in:

```text
backend/
frontend/
README.md
specs/00-project-profile.md
```

Inspect other changed files shown by Git status or diff.

## 5. Required Git Inspection

Inspect:

```bash
git branch --show-current
git status --short
git diff --check
git diff --stat
git diff
```

Also inspect staged changes separately if any exist:

```bash
git diff --cached --check
git diff --cached --stat
git diff --cached
```

Report whether changes are unstaged, staged, or mixed.

Do not assume an untracked file is harmless. Review all untracked source,
configuration, lockfile, and documentation files that belong to Slice 0.

## 6. Review Scope

Review the following dimensions.

### 6.1 Scope Compliance

Verify that Slice 0 contains only technical foundation work.

Confirm that it does not implement or scaffold feature-specific behaviour for:

- Identity or authentication;
- UserProfile;
- Regions;
- Quest discovery or CRUD;
- Quest participation;
- Completion Codes;
- Evidence Claims;
- SelfReported completions;
- XP, levels, streaks, or achievements;
- Passport;
- leaderboards;
- Community Challenges;
- SignalR events;
- Admin workflows;
- Google Maps;
- share cards;
- deployment infrastructure.

A feature-specific entity, endpoint, migration, service, store, route, or fake
business abstraction is a scope violation.

### 6.2 Backend Project Structure

Verify that the production projects are exactly:

```text
Kiwimpact.Api
Kiwimpact.Core
Kiwimpact.Infrastructure
```

Verify that the test project is:

```text
Kiwimpact.UnitTests
```

Confirm that the implementation did not create:

```text
Kiwimpact.Domain
Kiwimpact.Application
Kiwimpact.IntegrationTests
```

`Kiwimpact.IntegrationTests` is intentionally deferred to the first
data-backed slice.

### 6.3 Backend Dependency Direction

Verify the actual project-reference graph:

```text
Kiwimpact.Core
  -> no Kiwimpact production-project references

Kiwimpact.Infrastructure
  -> Kiwimpact.Core

Kiwimpact.Api
  -> Kiwimpact.Core
  -> Kiwimpact.Infrastructure

Kiwimpact.UnitTests
  -> Kiwimpact.Core
```

Additional test references require a documented and reasonable justification.

Confirm:

- Core does not reference Infrastructure or Api;
- Infrastructure does not reference Api;
- Api is the composition root;
- persistence implementation remains in Infrastructure;
- Core does not reference `IServiceCollection`, `ServiceProvider`,
  `Microsoft.Extensions.DependencyInjection`, or another DI abstraction;
- DI extension methods are located in Infrastructure or Api.

### 6.4 Backend Foundation

Verify:

- .NET 10 target framework;
- solution and project files are valid;
- Problem Details support is configured;
- health checks are configured;
- OpenAPI generation is configured;
- Scalar is configured;
- CORS uses explicit configurable origins;
- EF Core and the PostgreSQL provider are registered;
- the DbContext is in Infrastructure;
- no entities, migrations, or seed data were created;
- no secrets or real production connection strings were committed;
- health output exposes no sensitive internal details.

Verify only these non-business routes were added:

```text
GET /health
OpenAPI JSON route
Scalar documentation route
```

Flag any placeholder business endpoint.

### 6.5 Authentication Boundary

Confirm Slice 0 does not implement:

- `ApplicationUser`;
- Identity database registration;
- login, logout, or registration;
- cookie authentication;
- antiforgery token endpoints;
- Google login;
- role or policy seeding.

Configuration locations for future authentication are acceptable only when
they contain no fake or partial auth behaviour.

### 6.6 Frontend Foundation

Verify:

- Vite;
- React;
- TypeScript;
- npm and `package-lock.json`;
- React Router;
- TanStack Query;
- Zustand;
- Tailwind CSS;
- daisyUI;
- Lucide React;
- Vitest;
- React Testing Library;
- a supported browser-like test environment.

Confirm:

- no Axios, Redux, MobX, second router, or second component library;
- the typed API client uses `fetch`;
- `credentials: "include"` is configured for future cookie authentication;
- no feature-specific API methods exist;
- Zustand contains UI-only state, or no store was created;
- the root route renders;
- the not-found route renders;
- the application can render without the backend;
- no premature business routes or fake feature pages were created.

### 6.7 Security and Configuration

Verify:

- no secrets, API keys, passwords, tokens, or production credentials;
- no wildcard CORS with credentials;
- no sensitive values logged;
- API base URL and proxy targets are configurable;
- Problem Details handling does not expose raw sensitive response content;
- environment example values are safe;
- `.gitignore` covers generated and secret-bearing local files;
- lockfiles are present and reviewable.

### 6.8 Dependencies

Inspect:

```text
backend project package references
frontend/package.json
frontend/package-lock.json
```

For each added dependency, verify:

- it is required by the approved Slice 0 plan;
- it matches the accepted technology stack;
- it does not duplicate built-in framework capability without justification;
- no unapproved architecture framework was added.

Specifically confirm the absence of:

- MediatR;
- AutoMapper;
- generic repository packages;
- CQRS libraries;
- Hangfire;
- GraphQL;
- event-bus infrastructure;
- Axios;
- Redux;
- another state manager;
- another UI framework.

### 6.9 Tests and Quality Gates

Review the implementation agent's recorded results for:

```text
dotnet restore
dotnet build
dotnet test
npm run lint
npm run type-check
npm run test -- --run
npm run build
```

Verify that:

- commands used are valid for the created projects;
- test commands terminate rather than remain in watch mode;
- backend tests are meaningful and do not only assert `true`;
- frontend tests cover the application shell and not-found route;
- tests do not require a live backend;
- no failing check was hidden, skipped, or described as successful;
- applicable Quality Gate Matrix checks were completed.

A missing required command result must be reported even when the source looks
correct.

### 6.10 Runtime Verification

Review evidence that the implementation agent actually observed:

- successful API startup;
- successful `GET /health`;
- reachable OpenAPI JSON;
- reachable Scalar UI;
- successful frontend startup;
- rendered root route;
- rendered not-found route;
- visible Tailwind/daisyUI styling;
- frontend rendering while the backend is unavailable.

Distinguish between:

- verified by an observed response;
- inferred from source code;
- not verified.

Do not treat inferred runtime behaviour as verified.

### 6.11 Documentation Accuracy

Verify `README.md` and `specs/00-project-profile.md`.

Confirm:

- commands listed were actually run successfully;
- local URLs match observed routes;
- configuration keys are accurate;
- setup instructions do not expose secrets;
- integration tests are clearly deferred;
- no claim says authentication, persistence schema, CRUD, deployment, or
  business features are complete;
- project-profile commands match the actual repository.

### 6.12 Repository Hygiene

Verify:

- no generated `bin`, `obj`, coverage, build, or local environment files are
  tracked;
- no editor-specific or machine-specific files were added unnecessarily;
- no unrelated specification or review history was modified;
- no commit, push, merge, or branch switch occurred during implementation;
- the diff is focused and reviewable.

## 7. Required Finding Format

Classify every issue as:

### Blocker

Use when implementation cannot safely be accepted, including:

- architecture violation;
- wrong project structure;
- secret exposure;
- implementation on `main`;
- unapproved business scope;
- missing core foundation that prevents running/building;
- false successful completion claim;
- destructive or unreviewable repository state.

### Major

Use for significant correctness, security, testing, dependency, or
maintainability problems that should be fixed before commit.

### Minor

Use for contained issues that do not invalidate the foundation but should be
corrected in the same branch when practical.

### Optional

Use only for non-required improvements. Do not turn personal preference into a
required change.

For each finding include:

```text
ID
Severity
Affected file(s)
Evidence
Why it matters
Required resolution
```

Do not provide replacement implementation code unless a very small example is
necessary to explain the issue.

## 8. Required Review Summary

Include a table:

| Area                   | Status    | Notes |
| ---------------------- | --------- | ----- |
| Scope compliance       | PASS/FAIL |       |
| Backend structure      | PASS/FAIL |       |
| Dependency direction   | PASS/FAIL |       |
| Backend foundation     | PASS/FAIL |       |
| Frontend foundation    | PASS/FAIL |       |
| Security/configuration | PASS/FAIL |       |
| Dependencies           | PASS/FAIL |       |
| Tests/quality gates    | PASS/FAIL |       |
| Runtime verification   | PASS/FAIL |       |
| Documentation          | PASS/FAIL |       |
| Repository hygiene     | PASS/FAIL |       |

Then include totals:

```text
Blocker:
Major:
Minor:
Optional:
```

## 9. Verdict Rules

Return:

```text
APPROVE
```

only when:

- there are zero Blockers;
- there are zero Majors;
- every required build and test result is present and successful;
- required runtime checks were actually observed;
- the implementation matches the approved Slice 0 scope and architecture.

Return:

```text
CHANGES REQUIRED
```

when any Blocker or Major exists, or when required verification evidence is
missing.

Minor and Optional findings may coexist with `APPROVE` only when they do not
affect correctness, security, architecture, assessment compliance, or the
ability to verify the implementation.

End with exactly one of:

```text
APPROVE
```

or:

```text
CHANGES REQUIRED
