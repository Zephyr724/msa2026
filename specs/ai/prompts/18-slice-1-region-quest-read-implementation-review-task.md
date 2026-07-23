# Slice 1 — Regions and Public Quest Read Implementation Review Task

- **Reviewer:** Codex
- **Mode:** Read-only local repository review
- **Target branch:** `feat/slice-1-region-quest-read`
- **Approved plan:** `specs/implementation/01-slice-1-region-quest-read.md`
- **Completion report:** `specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md`
- **Required verdict:** `APPROVE` or `CHANGES REQUIRED`
- **Reviewer file changes:** None

## 1. Objective

Independently verify the actual Slice 1 implementation against the approved
plan, accepted architecture/security/database/testing rules, actual Git history,
runtime behavior, and the completion report.

Do not trust the implementation summary without reproducing important claims.

Do not modify, fix, stage, commit, push, merge, rebase, reset, clean, or switch
branches.

## 2. Git and provenance inspection

Run:

```bash
pwd
git branch --show-current
git status --short
git log --oneline --decorate -10
git log --oneline main..HEAD
git diff --check main...HEAD
git diff --stat main...HEAD
git diff --name-status main...HEAD
git diff main...HEAD
```

Determine:

- whether the implementation agent committed despite the task prohibition;
- which commits contain Slice 1 implementation;
- whether the working tree is genuinely clean;
- whether unrelated/generated files entered the branch;
- whether updated `main` is included;
- whether the completion report accurately records commit and Git state.

If an agent commit exists, record it as a workflow/provenance finding. Do not
undo it during review.

## 3. Required reading

Read:

```text
AGENTS.md
PROJECT_STATUS.md
README.md
.github/workflows/ci.yml
.clinerules/
specs/implementation/01-slice-1-region-quest-read.md
specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md
specs/architecture/
specs/product/
specs/security/
specs/testing/
specs/data/
specs/adr/
backend/Kiwimpact.slnx
backend/src/
backend/tests/
frontend/package.json
frontend/src/
frontend/tests/
docker-compose.yml
```

Inspect all changed files, migrations, project/package manifests, lockfiles,
configuration, tests, seed code, and public assets.

## 4. Scope and architecture

Verify:

- only Region, Quest, QuestImage, anonymous public reads, discovery/detail UI,
  first migration, seed support, and accepted test infrastructure were added;
- no auth flow/UI, Organizer/Admin CRUD, participation, completion, XP,
  achievements, leaderboard, maps, SignalR, deployment, or unrelated scope;
- production projects remain Api, Core, and Infrastructure;
- `Kiwimpact.IntegrationTests` is the only new accepted test project;
- Core has no EF Core, ASP.NET Core, Infrastructure, Api, or DI dependency;
- controllers are thin and never access `KiwimpactDbContext`;
- services own validation/orchestration;
- repository interfaces are in Core and EF implementations in Infrastructure;
- no MediatR, AutoMapper, Axios, Zod, MSW, SQLite, EF InMemory,
  `EnsureCreated`, or generic repository framework was introduced.

## 5. Domain and persistence

### Region

Verify accepted fields, enum values, hierarchy rules, string lengths,
timestamps, indexes, null-parent uniqueness, active filtering, and Restrict
delete behavior.

### Quest

Verify accepted fields and enums, including:

```text
CreatedByUserId: required Guid FK to AspNetUsers.Id
Version: uint mapped as PostgreSQL xmin concurrency token
```

Confirm:

- `Version` uses the supported Npgsql row-version/xmin mapping;
- migration does not create a normal application `Version` column;
- stale updates are tested with two DbContext instances and produce
  `DbUpdateConcurrencyException`;
- Region and creator FKs use Restrict;
- constraints and public-read indexes match the plan.

### QuestImage

Verify accepted fields, lengths, Quest Cascade delete, deterministic ordering,
indexes, cover-image seed rule, attribution fields, and separation from
completion evidence.

## 6. Identity persistence-only boundary

Verify:

```csharp
public sealed class ApplicationUser : IdentityUser<Guid>
{
}

public sealed class ApplicationRole : IdentityRole<Guid>
{
}

public sealed class KiwimpactDbContext
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
}
```

Confirm:

- types remain in Infrastructure;
- `base.OnModelCreating` is called correctly;
- Quest creator FK is required and Restrict;
- no Identity/authentication runtime registration or middleware exists;
- no auth endpoints, cookie handlers, passwords/tokens, OAuth, role behavior,
  or auth UI exists;
- development curator is deterministic, Development-only, reserved/safe,
  has `PasswordHash = null`, and no roles/claims/logins/tokens;
- tests prove this boundary.

## 7. Migration and seed governance

Verify:

- first migration applies to an empty PostgreSQL database;
- migration/model snapshot match accepted schema;
- no app/demo seed rows are inside migrations;
- Region seed is outside migrations, deterministic, idempotent, and
  non-destructive;
- it creates NZ, Auckland, and all 21 official Auckland local boards;
- official source metadata is recorded;
- demo seed is Development-only and idempotent;
- exactly 18 fictional Quests are created as claimed;
- at least 14 are Published;
- Draft, Cancelled, and Archived cases exist;
- all required categories/source types/difficulties/date/region cases exist;
- every Published Quest has a cover image;
- no copied provider content, password, token, secret, or production credential
  is seeded.

## 8. Public API contract

Verify all seven anonymous endpoints:

```text
GET /api/v1/regions
GET /api/v1/regions/{id}
GET /api/v1/regions/{id}/children
GET /api/v1/regions/{id}/ancestors
GET /api/v1/quests
GET /api/v1/quests/{id}
GET /api/v1/quests/{id}/images
```

Check:

- active-only Regions;
- Published-only Quests;
- identical `404` for missing/non-Published Quests;
- bounded search/page/pageSize;
- invalid enum/UUID/Region/sort/pagination behavior;
- safe Problem Details;
- correct pagination metadata;
- deterministic sorting;
- selected Region plus active descendants;
- public DTO allowlists;
- no creator/Identity/private/internal fields;
- Scalar/OpenAPI coverage;
- backend never fetches external URLs.

## 9. Frontend implementation

Verify:

- `/quests` and `/quests/:questId`;
- TanStack Query owns server state;
- URL parameters own filters/sort/page;
- Zustand does not duplicate server/query state;
- API calls begin as `apiFetch<unknown>`;
- validators narrow Region, Quest page, detail, and image payloads;
- no unchecked casts bypass validation;
- malformed-response tests exist;
- loading, success, empty, error, retry, and not-found states exist;
- responsive/accessibility requirements are implemented;
- images have useful alt text/fallback;
- external links use `target="_blank"` and
  `rel="noopener noreferrer"`;
- external-source disclaimer appears;
- no future-slice action is visible.

## 10. Test adequacy

The summary reports only:

```text
UnitTests: 2
IntegrationTests: 1
Frontend: 4 tests
```

Compare actual tests against the approved plan. Do not accept smoke/scaffold
tests as proof of the required data-backed slice.

Assess actual coverage for:

- Region hierarchy and query validation;
- migration on empty PostgreSQL;
- Region/demo seed and idempotency;
- schema/index/FK/delete behavior;
- xmin stale-update concurrency;
- Identity persistence-only boundary;
- Published visibility;
- Region descendants;
- search, filters, sorting, pagination;
- invalid query Problem Details;
- `404`;
- DTO allowlists;
- image ordering;
- all seven endpoints;
- frontend loading/data/empty/error/retry/not-found;
- URL state;
- malformed payloads;
- safe external links.

Missing mandatory tests should normally be Major.

## 11. Dependency governance

Inspect exact versions and configuration for:

```text
Microsoft.AspNetCore.Identity.EntityFrameworkCore
Microsoft.EntityFrameworkCore.Design
dotnet-ef
xunit.v3
xunit.runner.visualstudio
Microsoft.NET.Test.Sdk
Microsoft.AspNetCore.Mvc.Testing
Testcontainers.PostgreSql
Npgsql.EntityFrameworkCore.PostgreSQL
```

Verify compatibility, private asset metadata, test discovery, maintenance,
licenses, vulnerabilities, and absence of unapproved dependencies.

Run:

```bash
cd backend
dotnet list package --vulnerable --include-transitive
```

Then:

```bash
cd frontend
npm audit --audit-level=high
```

## 12. Independent build and test gates

Run:

```bash
cd backend
dotnet tool restore
dotnet restore Kiwimpact.slnx
dotnet build Kiwimpact.slnx --no-restore
dotnet test Kiwimpact.slnx --no-build
```

Then:

```bash
cd frontend
npm ci
npm run lint
npm run type-check
npm run test -- --run
npm run build
```

Report exact test counts, warnings, skipped tests, failures, and exit results.

## 13. Runtime verification

Inspect Compose/configuration first.

The summary claims migration on host port `5433`, while the previously verified
Compose workflow used `5432`. Determine the authoritative configuration and
whether the report explains the difference accurately.

With PostgreSQL running, independently verify as practical:

- migration;
- seed counts;
- all seven endpoints;
- default/filtered Quest list;
- invalid-query `400`;
- missing/non-Published `404`;
- Scalar/OpenAPI;
- frontend `/quests` and `/quests/:questId`;
- URL persistence;
- responsive behavior;
- loading/error/empty/not-found states;
- safe external-link attributes.

Use browser/Playwright for visual and responsive claims. Do not infer browser
behavior from build output.

## 14. Completion report fidelity

Check every completion-report statement against evidence:

- changed files;
- exact commands/working directories;
- test totals;
- migration/seed evidence;
- port/configuration;
- dependencies;
- runtime/browser evidence;
- acceptance criteria;
- deferred work/risks;
- final Git state;
- any implementation-agent commit.

Flag inferred, stale, contradictory, or unsupported PASS claims.

## 15. Findings format

For every issue include:

```text
ID
Severity: Blocker / Major / Minor / Optional
Affected files
Evidence
Why it matters
Required resolution
```

## 16. Required summary

| Area | PASS/FAIL | Notes |
|---|---|---|
| Git/provenance | | |
| Scope | | |
| Architecture/layering | | |
| Domain model | | |
| Identity persistence boundary | | |
| Migration/schema | | |
| Seed governance | | |
| API contract | | |
| Security/privacy | | |
| Frontend/state ownership | | |
| Test adequacy | | |
| Dependencies/vulnerabilities | | |
| Build/test gates | | |
| Runtime/browser evidence | | |
| Completion report fidelity | | |
| Repository hygiene | | |

Then report:

```text
Blocker:
Major:
Minor:
Optional:
```

## 17. Verdict

Return `APPROVE` only when:

- zero Blockers;
- zero Majors;
- mandatory Slice 1 acceptance criteria are implemented and evidenced;
- test coverage materially matches the approved plan;
- migration, seed, visibility, concurrency, Identity boundary, and DTO behavior
  are independently verified;
- completion report is factual;
- branch is safe for human commit/PR handling.

Otherwise return `CHANGES REQUIRED`.

End exactly with:

```text
APPROVE
```

or:

```text
CHANGES REQUIRED
```
