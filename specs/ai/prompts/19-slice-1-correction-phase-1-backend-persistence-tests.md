# Slice 1 Correction Phase 1 — Backend, Persistence, Seed, API, and Test Foundation

- **Execution agent:** DeepSeek through Cline
- **Mode:** Act
- **Target branch:** `feat/slice-1-region-quest-read`
- **Approved plan:** `specs/implementation/01-slice-1-region-quest-read.md`
- **Review findings:** `specs/ai/reviews/18-slice-1-region-quest-read-implementation-review-2026-07-22.md`
- **Scope:** Focused correction phase 1
- **Commit status:** Do not stage or commit

## 1. Objective

Resolve the backend, persistence, seed, API, dependency, and backend-test
findings from the independent Codex implementation review.

This phase addresses:

```text
S1-I1  backend portion only
S1-I2
S1-I3
S1-I4
S1-I5
S1-I7
S1-I10
```

This phase does not claim Slice 1 completion.

Frontend UI-state, strict frontend validator, browser, responsive, and final
completion-report work remain for correction phase 2, except where frontend
enum/type synchronization is required to keep the build correct.

## 2. Hard Restrictions

Do not:

```text
stage
commit
push
merge
rebase
reset
clean
switch branches
delete Docker volumes
drop a developer database containing unknown data
weaken the approved schema
activate authentication runtime behavior
add unapproved product features
```

Do not implement:

```text
authentication flows or auth UI
Organizer/Admin CRUD
participation
completion
XP/gamification
maps
SignalR
deployment
```

Do not add:

```text
MediatR
AutoMapper
Axios
Zod
MSW
SQLite
EF InMemory
EnsureCreated
generic repository frameworks
```

## 3. Required Preconditions

Before editing, run and report:

```bash
pwd
git branch --show-current
git status --short --untracked-files=all
git diff --check
git worktree list
docker version
docker compose version
docker compose ps
```

Required branch:

```text
feat/slice-1-region-quest-read
```

Read in full:

```text
AGENTS.md
PROJECT_STATUS.md
.clinerules/
specs/implementation/01-slice-1-region-quest-read.md
specs/ai/reviews/18-slice-1-region-quest-read-implementation-review-2026-07-22.md
specs/architecture/01-domain-model-region.md
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/data/01-community-identity-data-model.md
specs/security/01-community-privacy-rules.md
specs/testing/
specs/adr/
```

Inspect all current Slice 1 source, migration, seed, project, and test files.

## 4. S1-I2 — Restore Exact Accepted Enum Contracts

The implementation must use the exact enum names and members from:

```text
specs/architecture/02-core-domain-data-model.md
```

Correct every mismatched enum, including all affected:

```text
QuestCategory
QuestSourceType
RegistrationMode
QuestDifficulty
ExternalSourceStatus
QuestStatus
RegionType
```

Requirements:

1. Do not invent aliases or compatibility members.
2. Remove unapproved values such as the reviewed examples:
   `TreePlanting`, `CuratedExternal`, and `Expert`, unless an accepted spec
   explicitly contains them.
3. Synchronize the exact accepted values across:
   - Core enums;
   - EF string conversions and migration snapshot;
   - seed data;
   - API validation;
   - DTO mapping;
   - frontend TypeScript types;
   - frontend filter options;
   - frontend validators;
   - tests.
4. Public JSON values must match the accepted enum names exactly.
5. Add tests that fail for an unapproved enum value.

Do not preserve the current migration when its enum/schema representation no
longer matches the corrected model. Because the initial migration is
uncommitted, replace it using EF tooling rather than manually hiding model
drift.

## 5. S1-I3 — Correct and Activate Seed Data

### 5.1 Region seed

Verify and correct the Region seed so that it:

- creates exactly 23 deterministic records:
  - New Zealand;
  - Auckland;
  - the 21 accepted Auckland local boards;
- uses valid deterministic GUIDs;
- records the approved official Auckland Council source;
- is idempotent;
- is non-destructive;
- preserves unknown/historical Regions;
- validates hierarchy rules before saving;
- remains outside migrations.

### 5.2 Development curator

The development curator must:

- use a valid deterministic GUID;
- use the reserved `.invalid` identity described in the approved plan;
- have `PasswordHash = null`;
- have no role, claim, login, or token rows;
- be created only by explicitly enabled Development seed orchestration;
- never be created in non-Development environments.

### 5.3 Demo Quest seed

Correct the seed to create exactly:

```text
18 total fictional Quests
15 Published Quests
3 non-Published visibility cases
```

The non-Published records must cover the accepted statuses required by the
plan and review.

Requirements:

- every GUID literal is valid hexadecimal UUID syntax;
- all accepted enum values are used;
- all required filter/sort/date/Region/source/difficulty cases are covered;
- every Published Quest has a cover image;
- every cover image path resolves to a committed project-owned asset;
- no real provider descriptions, logos, posters, or photographs are copied;
- no password, token, secret, or production credential is seeded;
- seed is idempotent.

### 5.4 Explicit Development-only orchestration

Add explicit Development configuration flags rather than invoking seeds
unconditionally.

The configuration must make it possible to independently enable:

```text
Region seed
Demo Quest seed
```

Requirements:

- orchestration runs only when `IHostEnvironment.IsDevelopment()` is true;
- demo seed runs only when its explicit Development flag is enabled;
- Region seed activation is explicit and documented;
- the application creates an async scope and resolves the DbContext safely;
- migration and seed failures are not swallowed;
- no auth runtime service registration is introduced.

Record the exact configuration keys in README and the completion report.

### 5.5 Assets

Add the required project-owned demo image assets under:

```text
frontend/public/images/quests/
```

Use lightweight repository-safe SVG or similarly appropriate project-owned
assets with meaningful alt text. Do not add downloaded third-party images.

## 6. S1-I4 — Fix Quest Filtering and Query Validation

### 6.1 Region filtering

Correct the flow so that:

1. `IRegionReadRepository` returns the selected active Region and its active
   descendant IDs;
2. `QuestDiscoveryService` passes the resulting ID set into the approved query
   boundary;
3. `QuestReadRepository` applies:

   ```text
   LocationRegionId IN selected Region plus active descendants
   ```

4. null `LocationRegionId` does not match an active Region filter;
5. inactive or missing selected Region returns `400` validation Problem
   Details;
6. LocalArea selection matches that LocalArea only;
7. Auckland selection matches Auckland-wide Quests plus active local-board
   descendants.

Do not retrieve descendant IDs and then discard them.

### 6.2 Pagination and filter validation

Do not normalize invalid values into valid values.

Return `400` validation Problem Details for:

```text
page < 1
pageSize < 1
pageSize > 50
malformed regionId
missing/inactive region filter
invalid category
invalid sourceType
invalid difficulty
invalid sortBy
invalid sortDirection
search length > 100
```

Maintain:

```text
page default = 1
pageSize default = 12
```

Defaults apply only when values are omitted, not when invalid values are
provided.

Problem Details must not expose stack traces, SQL, or internal exception
details.

## 7. S1-I5 — Region Invariants and Root Uniqueness

### 7.1 Core validation

Implement testable Core rules for:

- non-empty trimmed Region name;
- maximum accepted name length;
- Country has no parent;
- AdministrativeArea parent must be Country;
- LocalArea parent must be AdministrativeArea;
- parent type must be broader than child type;
- invalid hierarchy transitions are rejected before persistence.

Keep EF and Infrastructure dependencies out of Core.

### 7.2 PostgreSQL root uniqueness

Implement one approved null-parent uniqueness strategy:

Preferred when supported by the pinned Npgsql/EF version:

```text
unique (Name, Type, ParentRegionId) NULLS NOT DISTINCT
```

Otherwise implement the accepted partial-index alternative.

Requirements:

- duplicate root Regions with the same accepted key are prevented;
- child uniqueness remains correct;
- model configuration, migration, and snapshot agree;
- integration tests prove duplicate-root rejection.

Because the initial migration is uncommitted, regenerate it from the corrected
model with EF tooling. Do not manually edit generated files to conceal drift.

Do not drop or reset unknown local data. Use Testcontainers or a newly created
development database to verify an empty-database migration.

## 8. S1-I7 — Dependency Governance and Warning-Free Restore

### 8.1 Testcontainers

The current requested version produces NU1603 and resolves to another version.

Requirements:

1. Determine the actually available compatible version from the current NuGet
   sources.
2. Pin that exact version so restore performs no substitution.
3. Record requested and resolved versions as identical.
4. Record package source, publisher, maintenance, licence, vulnerability
   result, and human approval status in the completion report.
5. Do not claim approval for a version that has not been explicitly accepted.

The review observed `4.6.0` as the substituted available version. It may be
used only after confirming it is compatible and recording the decision.

### 8.2 Remove unapproved dependency

Remove:

```text
coverlet.collector
```

unless the approved plan or a separate human approval explicitly requires it.

Do not replace it with another coverage dependency in this phase.

### 8.3 Required package metadata

Verify:

- `Microsoft.EntityFrameworkCore.Design` uses `PrivateAssets=all` and the
  accepted IncludeAssets set;
- `xunit.runner.visualstudio` uses `PrivateAssets=all` and the accepted
  IncludeAssets set;
- IntegrationTests use xUnit v3;
- `dotnet test` discovers the real IntegrationTests;
- project and tool package versions are compatible with .NET 10 and the pinned
  EF/Npgsql major.

Restore/build must complete with zero warnings.

## 9. S1-I1 — Implement the Required Backend Test Foundation

Delete the empty placeholder:

```text
backend/tests/Kiwimpact.IntegrationTests/UnitTest1.cs
```

Replace it with meaningful tests.

### 9.1 Unit tests

Add Core unit tests for:

- Region non-empty-name validation;
- Country parent rule;
- AdministrativeArea parent rule;
- LocalArea parent rule;
- invalid hierarchy type transitions;
- page/pageSize validation;
- accepted and rejected enum/filter values.

Do not mock EF behavior in unit tests.

### 9.2 PostgreSQL/Testcontainers fixture

Implement reusable test infrastructure using:

```text
Testcontainers.PostgreSql
real Npgsql provider
real EF Core migrations
WebApplicationFactory
xUnit v3
```

Do not use:

```text
SQLite
EF InMemory
EnsureCreated
```

### 9.3 Migration/schema integration tests

Test:

- migration applies to an empty PostgreSQL database;
- expected Identity, Region, Quest, and QuestImage tables exist;
- migration contains no application seed rows;
- required FKs and delete behaviors exist;
- root uniqueness prevents duplicate root Regions;
- Quest `Version` maps to PostgreSQL `xmin`, not a normal Version column;
- two DbContext instances produce `DbUpdateConcurrencyException` on the second
  stale Quest update.

### 9.4 Identity persistence-only tests

Prove:

- required Quest creator FK targets `AspNetUsers.Id`;
- referenced curator deletion is restricted;
- curator `PasswordHash` is null;
- no role, claim, login, or token rows are seeded;
- no Identity/authentication runtime endpoint or handler is activated;
- public APIs remain anonymous.

### 9.5 Seed integration tests

Test:

- Region seed produces exactly 23 rows;
- Region seed is idempotent;
- demo seed produces exactly 18 Quests;
- exactly 15 are Published;
- demo seed is idempotent;
- every Published Quest has a cover image;
- all cover-image assets exist;
- invalid GUID construction is impossible;
- Development-disabled configuration does not create demo data.

### 9.6 Repository/API integration tests

Add tests for:

- active LocalArea listing;
- Region search;
- inactive Region exclusion;
- direct children;
- ordered ancestors;
- active descendants;
- Published-only Quest list/detail/images;
- missing and non-Published Quest `404`;
- selected Region plus active descendants;
- null Region behavior;
- accepted filters;
- search;
- default and explicit sorting;
- pagination metadata;
- image ordering;
- `page=0` and `pageSize=0` return `400`;
- all invalid query cases return safe Problem Details;
- public DTOs omit creator, Identity, and private fields;
- all seven anonymous endpoints.

A single smoke test is not sufficient.

## 10. S1-I10 — Authoritative Local PostgreSQL Port

The current local Compose/application configuration uses:

```text
host port 5433 -> container port 5432
```

because another local PostgreSQL instance occupies host port 5432.

Keep `docker-compose.yml`, `appsettings.Development.json`, README, and
completion-report commands consistent.

Update README to state:

- Kiwimpact Docker PostgreSQL listens on host port `5433`;
- container PostgreSQL listens internally on `5432`;
- why host `5433` is used;
- the exact local connection string;
- how to verify with `docker compose ps`.

Do not silently switch back to host `5432` during this correction.

## 11. Migration and Database Verification

After model corrections:

1. replace the current uncommitted initial migration using EF tooling;
2. verify migration on an empty PostgreSQL Testcontainer;
3. verify local Development migration/seed against the authoritative host port
   when safe;
4. do not use `EnsureCreated`;
5. do not delete Docker volumes or unknown databases.

If replacing the migration requires a destructive action against unknown local
data, stop and report instead.

## 12. Completion Report During Phase 1

Update:

```text
specs/implementation/reports/
01-slice-1-region-quest-read-completion-report-2026-07-22.md
```

Correct false or stale claims immediately.

Until all Slice 1 findings, including frontend/runtime/browser work, are
resolved, the final result must be:

```text
SLICE 1 INCOMPLETE — HUMAN ACTION REQUIRED
```

The report must truthfully state:

- the working tree is dirty and uncommitted;
- phase 1 findings addressed;
- frontend/browser/final verification still pending;
- actual test counts;
- actual migration/seed counts;
- actual warnings;
- actual PostgreSQL host port;
- actual unresolved findings.

Do not claim Slice 1 complete in this phase.

## 13. Verification Commands

Run and record exact results.

### Backend

```bash
cd backend

dotnet tool restore
dotnet restore Kiwimpact.slnx
dotnet build Kiwimpact.slnx --no-restore
dotnet test Kiwimpact.slnx --no-build
dotnet list package --vulnerable --include-transitive
```

Required:

```text
restore: no NU1603
build: 0 errors, 0 warnings
tests: all real unit and integration tests discovered and passed
```

### Database/runtime API

Use the approved Development configuration and authoritative host port.

Verify:

```text
23 Regions
18 total Quests
15 Published Quests
Published Quests have cover images
all seven endpoints
Auckland descendant filtering
invalid pagination returns 400
missing/non-Published Quest returns 404
```

### Frontend build compatibility

Because shared enum/type contracts may change, run:

```bash
cd frontend

npm ci
npm run lint
npm run type-check
npm run test -- --run
npm run build
```

Do not claim frontend acceptance from these commands; phase 2 still owns
frontend behavior and browser verification.

### Repository

```bash
git branch --show-current
git status --short --untracked-files=all
git diff --check
git diff --stat
git diff
```

## 14. Required Final Response

Report:

1. exact accepted enum corrections;
2. migration replacement result;
3. Region uniqueness and validation result;
4. seed activation and exact counts;
5. asset files added;
6. Region filter and invalid-query behavior;
7. dependency version and governance corrections;
8. unit/integration test files and exact counts;
9. build warnings/errors;
10. runtime API results;
11. remaining phase 2 work;
12. final Git state.

End with exactly one:

```text
SLICE 1 CORRECTION PHASE 1 COMPLETE — READY FOR FOCUSED REREVIEW
```

or:

```text
SLICE 1 CORRECTION PHASE 1 INCOMPLETE — HUMAN ACTION REQUIRED
```
