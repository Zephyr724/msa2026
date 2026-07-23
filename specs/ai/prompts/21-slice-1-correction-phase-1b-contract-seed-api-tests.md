# Slice 1 Correction Phase 1B — Contract, Seed Safety, API Validation, and Full Backend Evidence

- **Execution agent:** DeepSeek through Cline
- **Mode:** Act
- **Target branch:** `feat/slice-1-region-quest-read`
- **Approved plan:** `specs/implementation/01-slice-1-region-quest-read.md`
- **Initial review:** `specs/ai/reviews/18-slice-1-region-quest-read-implementation-review-2026-07-22.md`
- **Phase 1 rereview:** `specs/ai/reviews/20-slice-1-correction-phase-1-focused-rereview-2026-07-23.md`
- **Scope:** Resolve S1-R1-1 through S1-R1-9
- **Commit status:** Do not stage or commit

## 1. Objective

Resolve every remaining Phase 1 rereview finding:

```text
S1-R1-1  Missing mandatory backend test coverage
S1-R1-2  Frontend enum contract still inconsistent
S1-R1-3  Region/demo seed fixtures still incorrect
S1-R1-4  Unsafe seed-flag combinations and partial writes
S1-R1-5  Numeric enum query values incorrectly accepted
S1-R1-6  Build warnings and incomplete dependency governance
S1-R1-7  Completion report remains inaccurate
S1-R1-8  README PostgreSQL port documentation incomplete
S1-R1-9  Orphan SVG asset
```

This is still Correction Phase 1.

Do not begin final frontend UI-state, responsive, browser, or completion
acceptance work beyond what is strictly required to synchronize shared enum
contracts and add contract tests.

Do not claim Slice 1 complete.

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
drop an unknown developer database
hide warnings
skip required tests
weaken accepted validation
```

Do not implement:

```text
authentication flows or authentication UI
Organizer/Admin CRUD
participation or completion
XP, achievements, leaderboard, or gamification
maps
SignalR
deployment changes
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

Do not change accepted architecture or domain decisions.

If a requirement conflicts with an accepted spec, stop and report the exact
conflict instead of inventing a decision.

## 3. Required Preconditions

Before editing, run:

```bash
pwd
git branch --show-current
git status --short --untracked-files=all
git diff --check
git log --oneline --decorate -10
git log --oneline main..HEAD
git worktree list
docker version
docker compose version
docker compose ps
```

Required branch:

```text
feat/slice-1-region-quest-read
```

The working tree is expected to be dirty and uncommitted.

Read in full:

```text
AGENTS.md
PROJECT_STATUS.md
.clinerules/
specs/implementation/01-slice-1-region-quest-read.md
specs/ai/reviews/18-slice-1-region-quest-read-implementation-review-2026-07-22.md
specs/ai/prompts/19-slice-1-correction-phase-1-backend-persistence-tests.md
specs/ai/reviews/20-slice-1-correction-phase-1-focused-rereview-2026-07-23.md
specs/architecture/01-domain-model-region.md
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/testing/
specs/adr/
specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md
```

Inspect all changed and untracked files before modifying anything.

## 4. S1-R1-2 — Finish Exact Shared Enum Synchronization

The backend enum sets are already intended to be:

```text
QuestCategory:
- RestoreNature
- ProtectWildlife
- CleanReduceWaste
- GrowCompost
- ObserveMeasure
- LearnShare

QuestSourceType:
- OrganizerOwned
- AdminCuratedExternal
- PlatformEcoChallenge

RegistrationMode:
- Native
- External
- NoneRequired

QuestDifficulty:
- Easy
- Medium
- Hard

ExternalSourceStatus:
- Current
- NeedsReview
- Changed
- SourceRemoved
```

Use the exact accepted spec for `QuestStatus` and `RegionType`.

Correct the frontend so that old or unapproved values are removed everywhere,
including:

```text
TreePlanting
CuratedExternal
SelfReported
Expert
```

Update:

```text
frontend/src/types/
frontend/src/lib/validation/
frontend/src/pages/QuestListPage.tsx
frontend/src/hooks/
frontend/src/lib/api/
frontend tests
```

Requirements:

1. Use exact TypeScript string unions, not unrestricted `string`.
2. Use shared readonly arrays or equivalent canonical value sets for runtime
   validation.
3. Validators must reject:
   - removed values;
   - unknown strings;
   - numeric values;
   - missing required enum fields.
4. Filter options must expose only accepted values.
5. API response validators must return validation failure before malformed
   data reaches components.
6. Add focused frontend tests proving accepted and rejected enum behavior.
7. Search the repository and remove all stale enum values from implementation,
   tests, seed, migration, and UI.

Run targeted searches such as:

```bash
rg -n "TreePlanting|CuratedExternal|SelfReported|Expert" .
```

Any remaining occurrence must be justified as historical documentation only.

## 5. S1-R1-3 — Correct Region and Demo Quest Fixtures

### 5.1 Region seed exactness

The final Region seed must produce exactly:

```text
23 Regions total
21 LocalArea Regions
```

The hierarchy must contain only:

```text
1 New Zealand Country
1 Auckland AdministrativeArea
21 accepted Auckland local boards
```

Remove the unaccepted `North Shore` record.

Requirements:

- use the exact accepted 21 local-board names from the approved spec;
- all IDs deterministic and valid;
- hierarchy valid;
- `Region.Validate()` is invoked before persistence for every seeded Region;
- source metadata preserved;
- seed idempotent;
- unknown existing Regions remain untouched;
- tests assert exact count, names, types, and hierarchy.

### 5.2 Demo Quest fixture coverage

Keep exactly:

```text
18 total Quests
15 Published
3 non-Published
```

Add or adjust fixtures so the seed includes:

- at least one Auckland-wide Published Quest whose
  `LocationRegionId` is Auckland;
- at least one location-agnostic Published Quest whose
  `LocationRegionId` is null;
- at least one Published LocalArea Quest;
- required accepted categories;
- all three accepted source types;
- all three accepted difficulties;
- dated and undated cases;
- all required non-Published visibility cases;
- a cover image for every Published Quest.

Do not increase the total beyond 18.

Tests must prove exact fixture coverage, not only counts.

### 5.3 Asset hygiene

Exactly one project-owned image asset should exist for each intended seeded
image reference.

Resolve:

```text
frontend/public/images/quests/ranges-cleanathon.svg
```

Either:

- reference it from an approved seeded Quest while preserving the required
  18-Quest total and coverage; or
- remove it if it is not needed.

No orphan asset may remain.

## 6. S1-R1-4 — Make Seed Flag Combinations Safe and Atomic

The current failing case is:

```text
Seed:Region=false
Seed:DemoQuests=true
```

It must not:

- crash after partially writing the curator;
- leave partial data;
- silently violate FK dependencies.

Implement one explicit accepted behavior:

### Required behavior

When demo seeding is enabled, the application must validate its Region
prerequisites before writing anything.

If prerequisites are missing:

1. fail before any curator, Quest, or image row is committed;
2. emit a clear configuration/startup error;
3. leave the database unchanged.

Do not silently enable Region seeding when `Seed:Region=false`.

Use a transaction covering curator + demo Quest + image writes.

The following combinations must be tested:

```text
Development + Region=false + Demo=false
Development + Region=true  + Demo=false
Development + Region=true  + Demo=true
Development + Region=false + Demo=true with missing prerequisites
Development + Region=false + Demo=true with prerequisites already present
Non-Development + any flags
```

Expected rules:

- non-Development never seeds;
- disabled flags do not seed;
- Region-only works;
- Region + Demo works;
- Demo-only works only when required Regions already exist;
- missing prerequisites fail before all demo-related writes;
- repeated successful runs are idempotent;
- failed runs leave no partial curator or Quest rows.

Do not swallow failures.

## 7. S1-R1-5 — Reject Numeric and Undefined Enum Query Values

The API must accept canonical enum names only.

Do not rely on `Enum.TryParse` alone.

Reject all numeric representations, including:

```text
0
1
999
-1
```

Reject undefined names and whitespace variants unless the approved API contract
explicitly allows case-insensitive canonical names.

For each enum filter:

```text
category
sourceType
difficulty
sortBy
sortDirection
```

Requirements:

1. input must be a canonical accepted name;
2. parsed value must be defined;
3. numeric input must return `400`;
4. invalid input must return safe validation Problem Details;
5. response must contain no stack trace, SQL, or internal exception details.

Add both unit and HTTP integration tests for:

- accepted canonical values;
- invalid names;
- numeric values;
- undefined values.

## 8. S1-R1-1 — Implement Complete Mandatory Backend Evidence

Three integration tests are insufficient.

Use real PostgreSQL Testcontainers, real EF migrations, and
`WebApplicationFactory`.

Do not use SQLite, EF InMemory, or `EnsureCreated`.

### 8.1 Unit tests

Add or complete unit tests for:

- `page < 1`;
- `pageSize < 1`;
- `pageSize > 50`;
- overlong search;
- accepted enum names;
- invalid enum names;
- numeric enum values;
- invalid sort field;
- invalid sort direction;
- Region hierarchy rules already implemented.

### 8.2 Migration and schema tests

Test:

- migration applies to an empty PostgreSQL database;
- expected Identity, Region, Quest, and QuestImage tables exist;
- no application seed rows exist immediately after migration;
- required indexes exist;
- required foreign keys exist;
- Region delete behavior is Restrict where accepted;
- Quest creator delete behavior is Restrict;
- QuestImage delete behavior is Cascade;
- duplicate root Region is rejected;
- child uniqueness works;
- Quest `Version` is PostgreSQL `xmin`;
- no normal `Version` column exists;
- two DbContext instances produce
  `DbUpdateConcurrencyException` on the second stale update.

### 8.3 Identity persistence-only tests

Test:

- Quest creator FK targets `AspNetUsers.Id`;
- referenced curator deletion is restricted;
- curator `PasswordHash` is null;
- no role rows;
- no claim rows;
- no login rows;
- no token rows;
- no authentication runtime endpoint exists;
- all seven public endpoints remain anonymous.

### 8.4 Region seed tests

Test:

- exactly 23 Regions;
- exactly 21 LocalAreas;
- exact accepted names;
- no `North Shore`;
- valid hierarchy;
- idempotency;
- non-destructive behavior;
- `Region.Validate()` behavior is enforced by the seed path.

### 8.5 Demo Quest seed tests

Test:

- exactly 18 total;
- exactly 15 Published;
- exactly 3 non-Published;
- Auckland-wide fixture exists;
- location-agnostic fixture exists;
- LocalArea fixture exists;
- accepted category/source/difficulty coverage;
- Published cover-image rule;
- every referenced asset exists;
- idempotency;
- no partial writes on failure;
- flag combinations from section 6;
- non-Development never seeds.

### 8.6 Repository and HTTP API tests

Test all seven endpoints:

```text
GET /api/v1/regions
GET /api/v1/regions/{id}
GET /api/v1/regions/{id}/children
GET /api/v1/regions/{id}/ancestors
GET /api/v1/quests
GET /api/v1/quests/{id}
GET /api/v1/quests/{id}/images
```

Test:

- active-only Region listing;
- Region search;
- inactive Region exclusion;
- ordered children/ancestors;
- Published-only Quest list;
- Published-only detail/images;
- missing Quest `404`;
- non-Published Quest `404`;
- Auckland filter includes Auckland-wide and active LocalArea descendants;
- LocalArea filter matches itself only;
- null-location Quest excluded when a Region filter is active;
- null-location Quest included when no Region filter is active;
- search;
- category/source/difficulty filters;
- default sorting;
- explicit sorting;
- default pagination;
- explicit pagination;
- exact pagination metadata;
- invalid page/pageSize;
- malformed UUID;
- missing/inactive Region;
- invalid enum names;
- numeric enum values;
- invalid sort field/direction;
- overlong search;
- safe Problem Details;
- image ordering;
- DTO allowlists omit creator, Identity, and private/internal fields.

Name tests by behavior. Do not combine unrelated requirements into one opaque
smoke test.

## 9. S1-R1-6 — Eliminate Warnings and Complete Dependency Governance

### 9.1 xUnit warnings

A forced build reproduced seven `xUnit1051` warnings.

Fix the test code properly.

Do not:

- suppress the analyzer globally;
- disable warnings;
- use `NoWarn`;
- lower warning levels;
- remove analyzers;
- hide the warning in CI.

Use correct cancellation-token propagation and xUnit v3 patterns.

Required result:

```text
dotnet build Kiwimpact.slnx --no-restore
0 errors
0 warnings
```

### 9.2 Dependency evidence

Update the completion report with a factual dependency table covering every
new Slice 1 dependency/tool:

```text
Package/tool
Purpose
Publisher/owner
Requested version
Resolved version
Package source
Maintenance status
Licence
Vulnerability scan result
Approval status
Evidence/command
```

At minimum include:

```text
Microsoft.AspNetCore.Identity.EntityFrameworkCore
Microsoft.EntityFrameworkCore.Design
Npgsql.EntityFrameworkCore.PostgreSQL
dotnet-ef
xunit.v3
xunit.runner.visualstudio
Microsoft.NET.Test.Sdk
Microsoft.AspNetCore.Mvc.Testing
Testcontainers.PostgreSql
```

Do not infer human approval.

Use factual wording such as:

```text
Approval status: pending human confirmation
```

unless explicit approval exists in the accepted plan or review evidence.

Confirm:

- requested and resolved Testcontainers versions are both `4.6.0`;
- no NU1603;
- `coverlet.collector` absent;
- private asset metadata correct;
- vulnerability scans report actual results.

## 10. S1-R1-8 — Correct README PostgreSQL Instructions

Update README consistently with:

```text
host port 5433 -> container port 5432
```

Include:

- reason: another local PostgreSQL service may use host port 5432;
- exact connection string including `Port=5433`;
- `docker compose up -d`;
- `docker compose ps`;
- optional readiness verification using container environment variables.

Do not leave any contradictory local port instructions.

## 11. S1-R1-7 — Make the Completion Report Factual

Update:

```text
specs/implementation/reports/
01-slice-1-region-quest-read-completion-report-2026-07-22.md
```

The final status must remain:

```text
SLICE 1 INCOMPLETE — HUMAN ACTION REQUIRED
```

until Correction Phase 2 and final review are complete.

The report must accurately record:

- dirty and uncommitted working tree;
- actual resolved and unresolved findings;
- exact Region counts;
- exact Quest counts;
- exact test counts;
- exact warning count;
- exact dependency evidence;
- actual changed-file inventory;
- seed flag behavior;
- PostgreSQL host port;
- runtime commands and results;
- frontend/browser Phase 2 still pending;
- no unsupported PASS or COMPLETE claims.

Do not mark a finding resolved unless the corresponding test and reproduced
evidence exist.

## 12. Verification Commands

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
tests: all discovered tests pass, zero skipped unless explicitly justified
```

Also perform a forced clean rebuild without changing tracked source:

```bash
dotnet clean Kiwimpact.slnx
dotnet build Kiwimpact.slnx
dotnet test Kiwimpact.slnx --no-build
```

Build artifacts may be created only where ignored by Git.

### Frontend shared-contract verification

```bash
cd frontend

npm ci
npm run lint
npm run type-check
npm run test -- --run
npm run build
npm audit --audit-level=high
```

Add focused tests for strict enum validation.

This does not complete final frontend/browser acceptance.

### Runtime/API

Use an empty disposable PostgreSQL database or Testcontainer.

Verify exact observed results for:

```text
23 Regions
21 LocalAreas
18 Quests
15 Published
3 non-Published
Auckland-wide fixture
location-agnostic fixture
all Published Quests have covers
safe seed flag combinations
no partial writes after failure
numeric enum query -> 400
all seven endpoints
Published/non-Published visibility
Auckland descendant filtering
```

### Repository

```bash
git branch --show-current
git status --short --untracked-files=all
git diff --check
git diff --stat
git diff
git ls-files --others --exclude-standard
```

Verify no orphan asset remains.

## 13. Stop Conditions

Stop and report instead of inventing a solution when:

- accepted enum values conflict across governing specs;
- the accepted 21 local-board list cannot be resolved;
- an explicit dependency approval is required but absent;
- migration regeneration requires destructive action against unknown data;
- Testcontainers cannot access Docker;
- a required test cannot be made deterministic without changing accepted scope;
- the working branch is wrong;
- unrelated pre-existing changes prevent safe correction.

## 14. Required Final Response

Report:

1. exact frontend enum corrections;
2. repository search results for removed enum values;
3. exact Region names/counts;
4. exact Quest fixture coverage;
5. seed flag behavior and transaction result;
6. numeric enum API behavior;
7. unit/integration test files and exact counts;
8. migration/concurrency/Identity/API coverage;
9. xUnit warning corrections;
10. dependency governance evidence;
11. README corrections;
12. orphan-asset resolution;
13. completion-report corrections;
14. remaining Phase 2 work;
15. final Git state.

End with exactly one:

```text
SLICE 1 CORRECTION PHASE 1B COMPLETE — READY FOR FOCUSED REREVIEW
```

or:

```text
SLICE 1 CORRECTION PHASE 1B INCOMPLETE — HUMAN ACTION REQUIRED
```
