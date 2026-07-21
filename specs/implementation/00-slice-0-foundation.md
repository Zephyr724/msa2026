# Slice 0 — Foundation

- **Status:** Approved
- **Slice:** 0
- **Purpose:** Establish the executable frontend, backend, persistence, testing, and documentation foundations for Kiwimpact.
- **Implementation scope:** Technical foundation only
- **Business feature scope:** None
- **Required review before implementation:** Claude Plan review
- **Required implementation agent:** DeepSeek in Cline Act mode
- **Expected branch:** `feat/slice-0-foundation`
- **Approved review:** `specs/ai/reviews/07-slice-0-foundation-plan-rereview-2026-07-21.md`

## 1. Goal

Create the smallest complete technical foundation on which later Kiwimpact
vertical slices can be implemented safely.

At the end of this slice:

- the React frontend builds, runs, and renders an application shell;
- the ASP.NET Core backend builds, runs, and exposes health and API
  documentation endpoints;
- the accepted three-project backend dependency direction is established;
- Entity Framework Core and PostgreSQL configuration boundaries exist;
- frontend and backend unit-test infrastructure execute successfully;
- repository setup and verified commands are documented;
- no Kiwimpact business feature is implemented.

## 2. Source of Truth

Implementation must follow this priority order:

1. Current explicit human instruction.
2. Accepted ADRs.
3. Accepted specifications under `/specs`.
4. `AGENTS.md`.
5. Applicable `.clinerules`.
6. Existing source code, configuration, migrations, tests, and runtime
   behaviour.

If this document conflicts with an accepted ADR or specification, stop and
report the conflict before editing.

## 3. Required Reading

Before planning or editing, read:

```text
AGENTS.md
specs/00-project-profile.md
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/security/
specs/testing/
specs/adr/ADR-0003-use-clean-architecture-lite.md
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
```

Use the Quality Gate Matrix in `.clinerules/07-agent-workflow.md` as the
verification source of truth. This plan may add slice-specific checks but must
not weaken or contradict that matrix.

Read directly referenced accepted ADRs when necessary.

Do not expand into unrelated specifications unless a direct dependency or
conflict requires it.

## 4. Environment Verification

Before scaffolding, inspect and report:

```bash
git branch --show-current
git status --short
node --version
npm --version
dotnet --version
dotnet --list-sdks
```

Requirements:

- Node.js 24 LTS.
- npm with `package-lock.json`.
- .NET SDK 10 or later.
- Git working tree must not contain unrelated uncommitted changes.
- Substantial implementation must not occur directly on `main`.

Stop and report when:

- the required SDK versions are unavailable;
- the current branch is `main`;
- unrelated uncommitted changes exist;
- an existing frontend or backend structure would be overwritten;
- a required command or dependency choice conflicts with accepted
  specifications.

## 5. Repository Structure

Create or complete this structure:

```text
frontend/
backend/
  src/
    Kiwimpact.Api/
    Kiwimpact.Core/
    Kiwimpact.Infrastructure/
  tests/
    Kiwimpact.UnitTests/
specs/
AGENTS.md
README.md
```

The exact .NET solution filename may follow the installed .NET SDK default,
but it must be located under `backend/` and include all backend source and test
projects.

Do not create `Kiwimpact.Domain` or `Kiwimpact.Application`. Their
responsibilities are intentionally combined in `Kiwimpact.Core` under the
accepted Clean Architecture Lite decision.

Do not create additional production projects unless explicitly approved
through an architecture decision.

## 6. Backend Foundation

### 6.1 Projects

Create:

```text
Kiwimpact.Api
Kiwimpact.Core
Kiwimpact.Infrastructure
Kiwimpact.UnitTests
```

Use:

- ASP.NET Core Web API for `Kiwimpact.Api`;
- class libraries for Core and Infrastructure;
- xUnit for backend unit tests.

Do not add MediatR, CQRS libraries, generic repositories, Unit of Work
abstractions, AutoMapper, Hangfire, GraphQL, event buses, or microservice
infrastructure.

### 6.2 Dependency Direction

Establish exactly this accepted dependency direction:

```text
Kiwimpact.Core
    ↑
Kiwimpact.Infrastructure
    ↑
Kiwimpact.Api
```

Required project references:

```text
Kiwimpact.Core
  -> no Kiwimpact project references

Kiwimpact.Infrastructure
  -> Kiwimpact.Core

Kiwimpact.Api
  -> Kiwimpact.Core
  -> Kiwimpact.Infrastructure

Kiwimpact.UnitTests
  -> Kiwimpact.Core
```

Additional test references may be added only when a real foundation test
requires them and the completion report explains why.

Required interpretation:

- Core contains domain and application abstractions appropriate to the accepted
  Clean Architecture Lite structure.
- Core depends on no other Kiwimpact production project.
- Infrastructure implements persistence and external-system concerns defined by
  Core.
- Api is the composition root and may reference Core and Infrastructure.
- Core must not depend on Infrastructure or Api.
- Infrastructure must not depend on Api.
- Api must not contain persistence implementation details.

### 6.3 API Startup

Configure the API with:

- controller or endpoint routing appropriate to the accepted architecture;
- Problem Details support;
- HTTPS redirection where appropriate;
- environment-based configuration;
- health checks;
- OpenAPI generation;
- Scalar API documentation;
- explicit CORS configuration from configuration values;
- dependency-injection extension methods located in
  `Kiwimpact.Infrastructure` and invoked by `Kiwimpact.Api`;
- registration of Infrastructure implementations for abstractions defined in
  `Kiwimpact.Core`.

`Kiwimpact.Core` must not reference `IServiceCollection`,
`ServiceProvider`, `Microsoft.Extensions.DependencyInjection`, or any other
dependency-injection abstraction.

Do not add business endpoints.

### 6.4 Foundation Endpoints

Create only these non-business endpoints:

```text
GET /health
GET /openapi/v1.json
GET /scalar
```

The exact Scalar route may follow the installed package's supported convention,
but the README must record the verified route.

`GET /health` must:

- return a successful response when the API process is healthy;
- contain no secrets, connection strings, environment variables, or internal
  exception details;
- be suitable for later deployment health checks.

Do not create placeholder Quest, User, Region, Completion, XP, Achievement,
Leaderboard, Passport, or Community Challenge endpoints.

### 6.5 Entity Framework Core and PostgreSQL Boundary

Add only the foundation required for later persistence work:

- Entity Framework Core packages;
- PostgreSQL provider;
- `KiwimpactDbContext` or the accepted equivalent in Infrastructure;
- DbContext registration through an Infrastructure dependency-injection
  extension;
- connection-string binding through standard ASP.NET Core configuration.

The DbContext may be empty in Slice 0.

Do not create:

- domain entities;
- Identity entities;
- database migrations;
- seed data;
- completion constraints;
- Region tables;
- Quest tables;
- authentication tables.

The first schema migration belongs to the relevant data-backed feature slice
after its entity model is approved.

### 6.6 Configuration and Secrets

Required:

- no real secrets committed;
- no production connection strings committed;
- configuration keys documented in `README.md`;
- a safe example configuration or environment-variable example;
- local secrets stored through environment variables or .NET user secrets;
- production cookie, CORS, database, and external-provider values left for
  environment-specific configuration.

Do not log:

- connection strings;
- passwords;
- API keys;
- tokens;
- cookies;
- antiforgery tokens.

### 6.7 Authentication Boundary

Do not implement authentication in Slice 0.

The following belong to the later Authentication and Profile slice:

- `ApplicationUser`;
- ASP.NET Core Identity persistence;
- cookie login/logout;
- registration;
- email confirmation;
- password reset;
- Google external login;
- antiforgery token endpoint;
- authorization policies and role seeding.

Slice 0 may establish configuration and dependency-injection locations that
these features will later use, but it must not create placeholder auth
behaviour.

### 6.8 Integration Test Project Deferral

Do not create an empty `Kiwimpact.IntegrationTests` project in Slice 0.

The target architecture still includes:

```text
backend/tests/Kiwimpact.IntegrationTests/
```

It is deliberately deferred to the first data-backed slice because Slice 0 has:

- no entities;
- no migrations;
- no seed data;
- no persistence behaviour worth testing;
- no approved need for Testcontainers yet.

The first data-backed slice must create the integration-test project and define
its PostgreSQL test strategy before persistence behaviour is considered
complete.

## 7. Frontend Foundation

### 7.1 Application

Create a Vite application using:

- React;
- TypeScript;
- npm;
- `package-lock.json`.

Do not use Create React App or another frontend framework.

### 7.2 Required Dependencies

Configure only the accepted foundation dependencies:

- React Router;
- TanStack Query;
- Zustand;
- Tailwind CSS;
- daisyUI;
- Lucide React;
- Vitest;
- React Testing Library;
- jsdom or the supported Vitest browser-like test environment.

Do not add Axios, Redux, MobX, another component library, another router, or
another state-management library without approval.

Use the browser `fetch` API for the foundation API client.

### 7.3 Frontend Structure

Create a small, explicit structure such as:

```text
frontend/src/
  app/
    App.tsx
    providers.tsx
    router.tsx
  components/
    layout/
  features/
  lib/
    api/
  pages/
  stores/
  test/
  main.tsx
```

Exact names may vary when a simpler structure better fits the Vite scaffold,
but responsibilities must remain clear.

Do not create empty abstraction layers merely to match a diagram.

### 7.4 Application Providers

Configure:

- React Router;
- TanStack Query `QueryClientProvider`;
- a minimal error boundary;
- global Tailwind/daisyUI styles.

The application must render even when the backend is unavailable.

### 7.5 Foundation Routes

Create only foundation routes:

```text
/
*
```

The `/` route displays a minimal Kiwimpact foundation screen that confirms the
application shell is running.

The `*` route displays a simple not-found state.

Do not create placeholder routes for future business pages unless an accepted
UX specification explicitly requires them in this slice.

### 7.6 API Client Boundary

Create a minimal typed fetch wrapper that:

- uses a configurable API base URL;
- defaults to the local proxy path when appropriate;
- sends `credentials: "include"` for future cookie authentication;
- parses successful JSON responses;
- handles Problem Details without exposing raw sensitive values;
- does not contain feature-specific API methods.

Do not implement the antiforgery flow in Slice 0.

### 7.7 Vite Development Proxy

Configure the development server to proxy:

```text
/api
/hubs
/health
/openapi
/scalar
```

to the local ASP.NET Core backend where appropriate.

The proxy target must be configurable and must not contain production
credentials.

### 7.8 Zustand Boundary

Create no persistent business store.

A minimal UI-only store may be created only when it demonstrates the accepted
Zustand boundary, for example:

- mobile navigation open/closed;
- theme preference placeholder.

Do not store server data, authentication state, quests, profiles, or
leaderboards in Zustand.

## 8. Styling Foundation

Configure Tailwind CSS and daisyUI according to their supported setup for the
installed versions.

Requirements:

- one minimal responsive application shell;
- no final product visual design;
- no copied Figma screens;
- no large design-token implementation;
- no theme work beyond what is required to prove the styling pipeline works;
- no custom font files committed during this slice.

A simple text, button, card, and responsive container are sufficient to prove
that Tailwind and daisyUI are operational.

## 9. Testing Foundation

### 9.1 Backend Unit Tests

Create at least one meaningful foundation unit test.

The test must verify real project behaviour or architecture-boundary behaviour,
not only assert `true`.

Acceptable examples:

- an architecture test verifies that Core has no project reference to
  Infrastructure or Api;
- a configuration-independent Core helper is tested.

Do not create fake business entities solely to satisfy a test count.

### 9.2 Frontend Unit Tests

Create at least:

- one test confirming the application shell renders;
- one test confirming the not-found route renders;
- one focused test for the API client or provider setup when practical.

Tests must not require a running backend.

### 9.3 Test Scripts

Provide verified npm scripts for:

```text
lint
type-check
test
build
```

The frontend test command used in CI or assessment must exit after running
rather than remain in watch mode.

## 10. Documentation

Update `README.md` with:

- project purpose;
- frontend and backend technology stack;
- repository structure;
- prerequisites;
- local frontend commands;
- local backend commands;
- required configuration keys;
- safe local connection-string setup;
- verified health endpoint;
- verified Scalar documentation route;
- build and test commands;
- statement that business features are not yet implemented;
- statement that integration tests are deferred to the first data-backed
  slice.

Update `specs/00-project-profile.md` only with commands that were actually
created and successfully verified.

Do not claim deployment, authentication, persistence, CRUD, integration tests,
or business features are complete.

## 11. Explicit Non-Goals

Do not implement or scaffold feature-specific behaviour for:

- Regions;
- UserProfile;
- Identity or authentication;
- Quest discovery;
- Quest CRUD;
- Quest images;
- participation;
- completion codes;
- Evidence Claims;
- SelfReported completions;
- XP;
- levels;
- streaks;
- achievements;
- Passport;
- leaderboards;
- Community Challenges;
- SignalR events;
- Admin workflows;
- Google Maps;
- share cards;
- email delivery;
- deployment infrastructure.

Do not create database migrations in this slice.

## 12. Dependency Governance

Before adding each dependency:

1. confirm it is required by this slice;
2. confirm it is consistent with accepted specifications;
3. prefer official framework packages;
4. avoid packages that duplicate built-in framework capabilities;
5. record the dependency and its purpose in the completion report;
6. retain generated lockfiles.

When package syntax or configuration has changed, use official documentation
or Context7 rather than guessing.

Do not upgrade unrelated dependencies.

## 13. Implementation Sequence

Implement in this order:

1. Verify environment, branch, and working tree.
2. Inspect existing repository files and avoid overwriting user work.
3. Create the backend solution and three-project production structure.
4. Configure backend project references exactly as accepted.
5. Add API startup, Problem Details, health, OpenAPI, and Scalar.
6. Add EF Core/PostgreSQL foundation without entities or migrations.
7. Add backend unit-test infrastructure.
8. Create the Vite React TypeScript frontend.
9. Configure Router, Query, Zustand boundary, Tailwind, and daisyUI.
10. Add the application shell, not-found route, and minimal API client.
11. Add frontend tests and verified npm scripts.
12. Update README and verified repository commands.
13. Run the Quality Gate Matrix checks applicable to Slice 0.
14. Run the slice-specific verification below.
15. Review the complete Git diff.
16. Report results without committing.

Do not combine later business slices into this task.

## 14. Required Verification

Follow the Quality Gate Matrix in `.clinerules/07-agent-workflow.md`.

Also run the following slice-specific checks.

### Backend

```bash
dotnet restore
dotnet build
dotnet test
```

Also start the API and verify:

```text
GET /health
Scalar documentation route
OpenAPI JSON route
```

Do not claim these endpoints work unless the actual responses were observed.

### Frontend

After the initial lockfile is created:

```bash
npm run lint
npm run type-check
npm run test -- --run
npm run build
```

Use the exact supported test invocation for the installed Vitest version. The
final verified command must exit successfully.

Start the frontend and confirm:

- the application shell renders;
- the root route works;
- the not-found route works;
- Tailwind/daisyUI styling is visible;
- the application still renders when the backend is unavailable.

### Repository

Run:

```bash
git status --short
git diff --check
git diff --stat
```

## 15. Acceptance Criteria

Slice 0 is complete only when all of the following are true.

### Backend

- [ ] Backend solution and all required projects exist.
- [ ] Production projects are exactly Api, Core, and Infrastructure.
- [ ] Project references follow the accepted dependency direction.
- [ ] Core has no Kiwimpact production-project dependencies.
- [ ] Infrastructure references Core and not Api.
- [ ] Api references Core and Infrastructure.
- [ ] `dotnet restore` succeeds.
- [ ] `dotnet build` succeeds with no unresolved errors.
- [ ] `dotnet test` succeeds.
- [ ] API starts successfully.
- [ ] `GET /health` returns a successful response.
- [ ] OpenAPI JSON is reachable.
- [ ] Scalar documentation is reachable.
- [ ] EF Core and PostgreSQL are registered without committed secrets.
- [ ] No entities or migrations were created.
- [ ] IntegrationTests is explicitly deferred to the first data-backed slice.

### Frontend

- [ ] React TypeScript application exists under `frontend/`.
- [ ] React Router is configured.
- [ ] TanStack Query is configured.
- [ ] Zustand is limited to client UI state.
- [ ] Tailwind CSS and daisyUI are operational.
- [ ] A typed foundation fetch client exists.
- [ ] Root and not-found routes render.
- [ ] Frontend unit tests pass.
- [ ] Lint, type-check, test, and build commands pass.
- [ ] `package-lock.json` is committed with the later approved commit.

### Repository and Documentation

- [ ] README contains verified setup and command instructions.
- [ ] `specs/00-project-profile.md` lists only verified commands.
- [ ] No secrets were added.
- [ ] No business feature was implemented.
- [ ] No unrelated files were modified.
- [ ] Quality Gate Matrix checks applicable to Slice 0 were completed.
- [ ] Git diff was reviewed.
- [ ] No commit, push, or merge occurred without explicit human approval.

## 16. Required Completion Report

The implementation agent must report:

1. current branch;
2. created and modified files;
3. final backend project-reference graph;
4. dependencies added and why;
5. commands executed;
6. command results;
7. verified local URLs;
8. tests added;
9. deferred IntegrationTests rationale;
10. acceptance criteria status;
11. remaining risks or deferred work;
12. `git status --short`;
13. `git diff --stat`.

End with exactly one of:

```text
SLICE 0 FOUNDATION COMPLETE — READY FOR REVIEW
```

or:

```text
SLICE 0 FOUNDATION INCOMPLETE — HUMAN ACTION REQUIRED
```

Do not commit, push, merge, or begin another slice.
