# Slice 1 Phase 1E Final Commit-Readiness Re-review

**Verdict: CHANGES REQUIRED**

Slice 1 is not ready for a single commit.

## Major Findings

### 1. Major — Finding 3 remains open: the FK test does not reach the database constraint

The full PostgreSQL integration suite produced the following observed result:

```text
Failed: 3
Passed: 63
Skipped: 0
Total: 66
```

The Region FK Restrict test fails before PostgreSQL executes the `DELETE`. In the current `ExecuteSqlRawAsync` call, the `CancellationToken` is treated as an SQL parameter. EF Core consequently throws:

```text
System.InvalidOperationException:
The current provider doesn't have a store type mapping
for properties of type 'CancellationToken'.
```

Evidence:

- `backend/tests/Kiwimpact.IntegrationTests/Persistence/ConcurrencyAndPersistenceTests.cs`, lines 69–73.

The test therefore does not prove:

- that PostgreSQL rejects the Region deletion;
- that the FK uses Restrict behavior at the database level;
- that PostgreSQL returns SQLSTATE `23503`;
- that the Region and dependent Quests remain intact after a rejected deletion.

Required action:

- call the correct raw-SQL overload so the Region ID is an SQL parameter and the cancellation token is passed separately;
- observe the provider’s actual exception shape;
- assert PostgreSQL SQLSTATE `23503`;
- verify that the Region and dependent Quests still exist after the failed deletion;
- rerun the complete integration suite.

### 2. Major — Finding 3 remains open: the parent-region filter test can still pass incorrectly

The Auckland parent-filter test classifies every non-Auckland `LocationRegion` as a descendant:

```csharp
var inLocalArea = page.Items.Count(q =>
    q.LocationRegion is not null &&
    q.LocationRegion.Id != Guid.Parse(aucklandId));
```

Evidence:

- `backend/tests/Kiwimpact.IntegrationTests/Api/QuestsApiTests.cs`, lines 174–182.

This does not prove that those Regions are actual active descendants of Auckland. The test also does not assert that every returned item:

- has a non-null location;
- belongs directly to Auckland or one of its real descendants;
- excludes an unrelated Region;
- excludes a location-agnostic Quest.

An implementation that ignores the region filter could still pass because the demo seed already contains both Auckland-wide and LocalArea Quests.

Required action:

- use deterministic expected Quest or Region IDs;
- assert that at least one directly Auckland-scoped Quest is returned;
- assert that at least one known descendant-scoped Quest is returned;
- assert that every result belongs to the exact allowed Region ID set;
- assert that null-location and unrelated-region Quests are absent;
- include an unrelated Region case that would fail if filtering were ignored.

### 3. Major — Finding 3 remains open: exact backend DTO contract evidence is incomplete

The new assertions verify the top-level property sets for:

- the Quest page;
- a Quest list item;
- Quest detail.

They do not provide exact schema protection for:

- Region summary responses;
- Region detail;
- Region children;
- Region ancestors;
- Quest images;
- nested `locationRegion`;
- nested `coverImage`;
- JSON primitive types;
- enum serialization;
- required null-valued properties;
- collection element shapes.

Several existing tests deserialize into C# DTOs. `System.Text.Json` ignores additional JSON properties by default, so those tests would not detect an unintended public property.

For example:

- `RegionsApiTests` deserializes directly into `RegionSummaryDto`;
- the Quest images test deserializes directly into `List<QuestImageDto>`.

Required action:

- add exact `JsonElement` property-set assertions for Region and QuestImage payloads;
- assert exact nested DTO property sets;
- assert JSON value kinds for strings, numbers, booleans, arrays, objects, and nulls;
- verify canonical enum strings;
- verify required nullable properties are present even when their value is null;
- verify collection shapes and absence of unintended properties.

### 4. Major — Finding 4 remains open: expected seed-startup failures are not asserted

Two seed-configuration tests expect application startup to fail, but they call `CreateClient()` without asserting the exception.

Evidence:

- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`, line 80;
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`, line 220.

Both tests fail immediately with the expected `InvalidOperationException`. Their subsequent database-state assertions are never executed.

Observed failing tests:

```text
SeedConfigurationTests.DemoQuestsWithoutRegions_FailsBeforeWrites
SeedConfigurationTests.MissingPrerequisite_NoPartialRegionState
```

Required action:

- explicitly assert the expected startup exception;
- verify the exception represents the missing Region prerequisite;
- inspect the database after the failed startup through an independent service provider or `DbContext`;
- prove that no Quest, QuestImage, curator, or unexpected Region data was written;
- ensure the factory and database resources are disposed reliably.

### 5. Major — Finding 4 remains open: no test proves rollback after a failure inside the demo seed transaction

Phase 1E explicitly required a scenario in which the demo seed begins writing and then fails, followed by verification that the transaction rolls back.

The five current tests cover:

- non-Development behavior;
- both flags enabled;
- Region-only configuration;
- demo Quests without Regions;
- a partially populated Region hierarchy.

None of them causes `DemoQuestSeed.SeedAsync` to fail after one or more writes have occurred. The missing-prerequisite cases fail before the transaction begins.

The current tests therefore do not prove that the transaction around `DemoQuestSeed.SeedAsync` prevents partial state.

Required action:

- create a deterministic failure after the demo seed transaction has begun;
- ensure the failure occurs after at least one potential write;
- verify that the transaction rolls back all demo-seed changes;
- verify the absence of partial curator, Quest, and QuestImage rows;
- keep the test against real PostgreSQL;
- avoid adding a production test hook solely for this test.

### 6. Major — Finding 2 remains open: frontend DTO validation still accepts malformed contract values

The validators now reject missing fields, unknown enums, numeric enum representations, and silent pagination coercion. However, they still accept several values that do not match the backend DTO contracts.

#### Invalid nullable Region UUIDs are accepted

`parentRegionId` is validated as a nullable string rather than a nullable UUID.

Evidence:

- `frontend/src/lib/validation/regionDto.ts`, line 34.

A payload such as the following passes validation:

```json
{
  "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "name": "Auckland",
  "type": "AdministrativeArea",
  "parentRegionId": "not-a-uuid"
}
```

This is inconsistent with the backend `Guid?` contract.

#### Malformed timestamps are accepted

Fields including:

- `startAtUtc`;
- `endAtUtc`;
- `sourceCheckedAt`;

are checked only as nullable strings.

Evidence:

- `frontend/src/lib/validation/questDto.ts`, lines 99–100 and 118–120.

Values such as `"not-a-date"` pass validation and may later produce an invalid JavaScript `Date`.

#### Integer fields accept fractional values

The shared number validator checks only:

```ts
typeof value === 'number' && Number.isFinite(value)
```

It therefore accepts fractional values for backend integer fields, including:

- `xpAward`;
- `capacity`;
- `sortOrder`;
- `page`;
- `pageSize`;
- `totalCount`;
- `totalPages`.

It also does not enforce meaningful non-negative pagination metadata.

Required action:

- validate `parentRegionId` as null or a valid UUID;
- validate nullable timestamps as valid ISO 8601 timestamps;
- use integer validation for backend `int` fields;
- apply non-negative or positive bounds where defined by the contract;
- add contract tests for malformed UUIDs, malformed timestamps, fractional integers, negative metadata, null, and undefined values.

### 7. Major — Finding 1 remains open: the completion report does not match independently observed evidence

The completion report claims:

```text
Total integration test methods: 54 tests
```

Independent inspection found:

```text
58 integration test methods
66 discovered integration test cases
```

The difference arises partly from `[Theory]` expansion, but even the method count in the report is incorrect.

The report also states that there are 55 untracked files. The independently observed state contains:

```text
12 tracked modified files
97 untracked files
109 changed paths in total
```

The report states that all four previous Major findings have been addressed. That statement is unsupported because:

- the integration suite has three failures;
- the database-level FK test does not reach PostgreSQL;
- two seed-configuration tests fail;
- transactional rollback is not tested;
- parent filtering remains susceptible to false positives;
- frontend contract validation remains incomplete.

Evidence:

- `specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md`, lines 45–50;
- the same report, lines 80–101;
- the same report, lines 108–117.

Required action:

- fix the implementation and tests;
- rerun every applicable verification command;
- replace the test-method and test-case counts with exact observed values;
- record the exact Git state;
- record the actual build warning count;
- describe any failed, pending, or unexecuted checks honestly;
- remove the ready-for-rereview conclusion until the required evidence passes.

### 8. Major — the Phase 1E zero-warning requirement is not satisfied

A clean non-incremental backend build succeeded but emitted two CS0114 warnings:

```text
NonDevelopmentWebApplicationFactory.DisposeAsync()
hides inherited member WebApplicationFactory<Program>.DisposeAsync()

SeedConfigWebApplicationFactory.DisposeAsync()
hides inherited member WebApplicationFactory<Program>.DisposeAsync()
```

Evidence:

- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`, line 260;
- the same file, line 302.

Observed clean-build result:

```text
Build succeeded.
2 Warning(s)
0 Error(s)
```

This contradicts the Phase 1E requirement of zero errors and zero warnings. It also weakens confidence in test-factory cleanup semantics.

Required action:

- implement the intended disposal override correctly;
- remove unnecessary empty `IAsyncLifetime` implementations if appropriate;
- dispose every factory reliably in the tests;
- rerun a non-incremental build and verify zero warnings.

## Moderate Finding

### 9. Moderate — the Prompt 28 archive file is truncated

The re-review prompt ends at:

```markdown
#### Repository hygiene

```shell
git diff --check
```

The Markdown code fence is not closed, and the remaining verification and final-output instructions are absent.

Evidence:

- `specs/ai/prompts/28-slice-1-phase-1e-final-commit-readiness-re-review.md`, line 242.

Because this prompt is an untracked file intended for the AI evidence archive, committing it in this state would preserve an incomplete review record.

Required action:

- restore the complete prompt text;
- close the Markdown code fence;
- ensure the archived prompt accurately records all required verification commands and verdict requirements;
- run `git diff --check` again after correction.

## Independently Observed Verification Results

### Repository hygiene

```text
git diff --check HEAD
Result: passed
```

No whitespace errors were reported.

### Backend restore

```text
dotnet restore Kiwimpact.slnx
Result: passed
All projects are up to date for restore.
```

### Backend build

Incremental build:

```text
Result: passed
0 warnings
0 errors
```

A clean non-incremental build was then run to avoid relying on incremental compiler output:

```text
dotnet build Kiwimpact.slnx --no-restore --no-incremental
Result: passed
2 warnings
0 errors
```

The clean-build result is authoritative for the warning count.

### Backend unit tests

```text
Failed: 0
Passed: 34
Skipped: 0
Total: 34
```

### PostgreSQL integration tests

Docker version:

```text
29.6.2
```

Test result:

```text
Failed: 3
Passed: 63
Skipped: 0
Total: 66
```

Failed tests:

```text
ConcurrencyAndPersistenceTests
  .Quest_RegionFK_RestrictDelete_IsEnforcedAtDatabaseLevel

SeedConfigurationTests
  .DemoQuestsWithoutRegions_FailsBeforeWrites

SeedConfigurationTests
  .MissingPrerequisite_NoPartialRegionState
```

The failures are implementation/test-correctness failures, not Docker or Testcontainers infrastructure failures.

Testcontainers cleanup completed successfully. No temporary test container remained after the run.

### Frontend lint

```text
npm run lint
Result: passed
0 errors
0 warnings
```

### Frontend type-check

```text
npm run type-check
Result: passed
0 errors
```

### Frontend tests

```text
Test Files: 4 passed
Tests: 28 passed
Failed: 0
```

Breakdown:

- 24 DTO validation tests;
- 2 API fetch tests;
- 1 AppShell integration test;
- 1 not-found route integration test.

### Frontend production build

```text
npm run build
Result: passed
```

### Formatting

```text
dotnet format Kiwimpact.slnx --verify-no-changes --no-restore
Result: passed
```

The first sandboxed invocation failed because the Roslyn build host could not create its named pipe. The command passed when rerun outside that sandbox restriction.

### Dependency vulnerability checks

Frontend:

```text
npm audit --audit-level=high
Result: passed
Found 0 vulnerabilities
```

Backend:

```text
dotnet list Kiwimpact.slnx package --vulnerable --include-transitive
Result: not completed
```

The elevated request was rejected because the scan would disclose dependency metadata to external advisory services. No new NuGet vulnerability result is claimed by this review.

## Repository State

Current branch:

```text
feat/slice-1-region-quest-read
```

Upstream state:

```text
origin/feat/slice-1-region-quest-read
ahead: 0
behind: 0
```

Staged changes:

```text
None
```

Tracked unstaged files:

```text
12
```

Untracked files:

```text
97
```

Untracked dotfiles:

```text
None
```

Total changed paths:

```text
109
```

Tracked diff statistics:

```text
12 files changed
174 insertions
26 deletions
```

Untracked content statistics:

```text
10,768 lines
383,320 bytes
```

The tracked diff statistics do not include untracked files.

### Tracked modified files

```text
README.md
backend/Kiwimpact.slnx
backend/src/Kiwimpact.Api/Kiwimpact.Api.csproj
backend/src/Kiwimpact.Api/Program.cs
backend/src/Kiwimpact.Api/appsettings.Development.json
backend/src/Kiwimpact.Core/Kiwimpact.Core.csproj
backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs
backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs
backend/src/Kiwimpact.Infrastructure/Kiwimpact.Infrastructure.csproj
backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj
docker-compose.yml
frontend/src/app/router.tsx
```

### Complete untracked-file inventory

#### Backend tool manifest

```text
backend/dotnet-tools.json
```

#### Backend API

```text
backend/src/Kiwimpact.Api/Contracts/PagedResponse.cs
backend/src/Kiwimpact.Api/Contracts/QuestDetailDto.cs
backend/src/Kiwimpact.Api/Contracts/QuestImageDto.cs
backend/src/Kiwimpact.Api/Contracts/QuestListItemDto.cs
backend/src/Kiwimpact.Api/Contracts/RegionSummaryDto.cs
backend/src/Kiwimpact.Api/Controllers/QuestsController.cs
backend/src/Kiwimpact.Api/Controllers/RegionsController.cs
backend/src/Kiwimpact.Api/Helpers/ProblemDetailsHelper.cs
backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs
```

#### Backend Core

```text
backend/src/Kiwimpact.Core/Entities/Quest.cs
backend/src/Kiwimpact.Core/Entities/QuestImage.cs
backend/src/Kiwimpact.Core/Entities/Region.cs
backend/src/Kiwimpact.Core/Enums/ExternalSourceStatus.cs
backend/src/Kiwimpact.Core/Enums/QuestCategory.cs
backend/src/Kiwimpact.Core/Enums/QuestDifficulty.cs
backend/src/Kiwimpact.Core/Enums/QuestSourceType.cs
backend/src/Kiwimpact.Core/Enums/QuestStatus.cs
backend/src/Kiwimpact.Core/Enums/RegionType.cs
backend/src/Kiwimpact.Core/Enums/RegistrationMode.cs
backend/src/Kiwimpact.Core/Queries/PagedResult.cs
backend/src/Kiwimpact.Core/Queries/QuestDiscoveryQuery.cs
backend/src/Kiwimpact.Core/Repositories/IQuestReadRepository.cs
backend/src/Kiwimpact.Core/Repositories/IRegionReadRepository.cs
backend/src/Kiwimpact.Core/Services/IQuestDiscoveryService.cs
backend/src/Kiwimpact.Core/Services/IRegionReadService.cs
backend/src/Kiwimpact.Core/Services/QuestDiscoveryService.cs
backend/src/Kiwimpact.Core/Services/RegionReadService.cs
```

#### Backend Infrastructure

```text
backend/src/Kiwimpact.Infrastructure/Data/Configurations/QuestConfiguration.cs
backend/src/Kiwimpact.Infrastructure/Data/Configurations/QuestImageConfiguration.cs
backend/src/Kiwimpact.Infrastructure/Data/Configurations/RegionConfiguration.cs
backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoQuestSeed.cs
backend/src/Kiwimpact.Infrastructure/Data/Seeds/RegionSeed.cs
backend/src/Kiwimpact.Infrastructure/Identity/ApplicationRole.cs
backend/src/Kiwimpact.Infrastructure/Identity/ApplicationUser.cs
backend/src/Kiwimpact.Infrastructure/Migrations/20260722155951_InitialRegionQuestRead.Designer.cs
backend/src/Kiwimpact.Infrastructure/Migrations/20260722155951_InitialRegionQuestRead.cs
backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs
backend/src/Kiwimpact.Infrastructure/Repositories/QuestReadRepository.cs
backend/src/Kiwimpact.Infrastructure/Repositories/RegionReadRepository.cs
```

#### Backend tests

```text
backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs
backend/tests/Kiwimpact.IntegrationTests/Api/QuestsApiTests.cs
backend/tests/Kiwimpact.IntegrationTests/Api/RegionsApiTests.cs
backend/tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj
backend/tests/Kiwimpact.IntegrationTests/Persistence/ConcurrencyAndPersistenceTests.cs
backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs
backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs
backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedIntegrationTests.cs
backend/tests/Kiwimpact.IntegrationTests/Persistence/TestDatabaseFixture.cs
backend/tests/Kiwimpact.UnitTests/Core/QuestDiscoveryValidationTests.cs
backend/tests/Kiwimpact.UnitTests/Core/RegionValidationTests.cs
```

#### Frontend Quest images

```text
frontend/public/images/quests/archived-quest.svg
frontend/public/images/quests/beach-survey.svg
frontend/public/images/quests/bike-path-planting.svg
frontend/public/images/quests/cancelled-quest.svg
frontend/public/images/quests/coastal-cleanup.svg
frontend/public/images/quests/community-garden.svg
frontend/public/images/quests/draft-quest.svg
frontend/public/images/quests/heritage-trees.svg
frontend/public/images/quests/kiwi-habitat.svg
frontend/public/images/quests/recycling-workshop.svg
frontend/public/images/quests/school-education.svg
frontend/public/images/quests/stream-cleanup.svg
frontend/public/images/quests/stream-planting.svg
frontend/public/images/quests/tree-planting.svg
frontend/public/images/quests/waste-audit.svg
frontend/public/images/quests/water-quality.svg
frontend/public/images/quests/wetland-restoration.svg
frontend/public/images/quests/youth-eco-club.svg
```

#### Frontend source and tests

```text
frontend/src/hooks/useQuests.ts
frontend/src/hooks/useRegions.ts
frontend/src/lib/api/quests.ts
frontend/src/lib/api/regions.ts
frontend/src/lib/validation/questDto.ts
frontend/src/lib/validation/regionDto.ts
frontend/src/pages/QuestDetailPage.tsx
frontend/src/pages/QuestListPage.tsx
frontend/src/types/quest.ts
frontend/src/types/region.ts
frontend/tests/unit/dtoValidation.test.ts
```

#### AI prompt records

```text
specs/ai/prompts/18-slice-1-region-quest-read-implementation-review-task.md
specs/ai/prompts/19-slice-1-correction-phase-1-backend-persistence-tests.md
specs/ai/prompts/20-slice-1-correction-phase-1-focused-codex-rereview.md
specs/ai/prompts/21-slice-1-correction-phase-1b-contract-seed-api-tests.md
specs/ai/prompts/22-slice-1-correction-phase-1b-focused-rereview-task.md
specs/ai/prompts/23-slice-1-correction-phase-1c-evidence-completion.md
specs/ai/prompts/24-slice-1-final-implementation-rereview-task.md
specs/ai/prompts/25-slice-1-correction-phase-1d-final-evidence-repair.md
specs/ai/prompts/26-slice-1-final-commit-readiness-review.md
specs/ai/prompts/27-slice-1-correction-phase-1e-evidence-closure.md
specs/ai/prompts/28-slice-1-phase-1e-final-commit-readiness-re-review.md
```

#### AI review records

```text
specs/ai/reviews/18-slice-1-region-quest-read-implementation-review-2026-07-22.md
specs/ai/reviews/20-slice-1-correction-phase-1-focused-rereview-2026-07-23.md
specs/ai/reviews/21-slice-1-correction-phase-1b-focused-rereview-2026-07-23.md
specs/ai/reviews/22-slice-1-final-implementation-rereview-2026-07-23.md
specs/ai/reviews/24-slice-1-final-commit-readiness-review.md
```

#### Completion report

```text
specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md
```

## Scope and Regression Review

No evidence was found that Phase 1E introduced:

- authentication or authorization runtime;
- Organizer or Admin CRUD;
- participation or completion behavior;
- XP or gamification runtime;
- maps;
- SignalR;
- Cypress;
- deployment configuration;
- a new validation dependency;
- a second database;
- SQLite or EF InMemory persistence claims;
- controller-to-`DbContext` access;
- a Core dependency on Infrastructure or API;
- secrets or private keys;
- a production test hook.

PostgreSQL-specific behavior remains in Infrastructure and integration tests, which is appropriate.

Cypress and deployment remain later project requirements and are not blockers for this Slice 1 commit by themselves.

## Final Assessment

The four original Major findings are not substantively closed:

| Original finding | Status |
|---|---|
| Completion report accuracy | Open |
| Frontend DTO validation and contract tests | Open |
| Backend API and persistence evidence | Open |
| Seed configuration evidence | Open |

The most important blocker is the independently observed integration-test result:

```text
63 passed
3 failed
66 total
```

The implementation must not be committed as the final Slice 1 change set until:

1. all three integration-test failures are corrected;
2. the FK test reaches PostgreSQL and proves SQLSTATE `23503`;
3. deterministic Region filter evidence cannot pass through seed coincidence;
4. exact Region, nested Quest, and QuestImage schemas are tested;
5. demo-seed transactional rollback is exercised after a write has begun;
6. frontend UUID, timestamp, and integer validation is completed;
7. the two build warnings are removed;
8. Prompt 28 is restored as a complete archive record;
9. the completion report is rewritten with exact observed evidence;
10. all applicable checks pass in a fresh final verification run.

**CHANGES REQUIRED**