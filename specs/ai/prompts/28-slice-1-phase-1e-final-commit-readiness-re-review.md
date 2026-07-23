# Prompt 28 — Slice 1 Phase 1E Final Commit Readiness Re-review

You are performing the final independent commit-readiness re-review of Slice 1 for the Kiwimpact repository.

Repository:

`/Users/zephyr/dev/personal/msa2026`

Expected branch:

`feat/slice-1-region-quest-read`

## Review mode

This is a strictly read-only review.

Do not:

- edit, create, delete, rename, move, or format source-controlled files;
- apply fixes;
- create or update review files;
- stage, commit, push, merge, rebase, reset, restore, clean, stash, or switch branches;
- install or update dependencies;
- change database migrations, seed data, configuration, or environment files;
- accept the supplied completion summary as proof without independently verifying it.

You may run read-only inspection commands and the repository's existing build, test, lint, type-check, audit, and Docker-backed verification commands.

Ignored build and test artefacts such as `bin`, `obj`, coverage output, and existing dependency caches are permitted. Do not intentionally modify tracked files.

## Objective

Determine whether the current uncommitted Slice 1 implementation is ready for a single commit after Phase 1E.

This is a re-review of the four Major findings from the previous Codex final commit-readiness review:

1. The Slice 1 completion report did not contain exact Phase 1E observed evidence.
2. Frontend DTO validation lacked sufficient contract-test evidence and strict validation.
3. Backend API and persistence tests did not prove the exact DTO schemas, deterministic hierarchy filtering, and database-level FK Restrict behaviour.
4. Demo seed configuration lacked dedicated integration-test evidence.

Do not merely confirm that files or tests were added. Determine whether each original finding is substantively closed.

## Claimed Phase 1E changes

The implementation currently claims the following:

### Completion report

`specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md`

The report claims updated test counts, a corrected tracked/unstaged/untracked-file tally, and a verification-results table. Verify every claimed count and result.

### Frontend validators and tests

`frontend/src/lib/validation/questDto.ts`
`frontend/src/lib/validation/regionDto.ts`

The validators now reject:

- missing required fields;
- unknown and removed enum values;
- numeric enum representations;
- invalid pagination (undefined, non-boolean);
- missing nested Region and QuestImage objects;
- missing capacity and locationRegion.

`frontend/tests/unit/dtoValidation.test.ts`

The test file grew from 217 lines to approximately 256 lines. The additional tests cover:

- malformed nested Region in QuestListItem;
- missing locationRegion property (undefined);
- missing coverImage property (undefined);
- missing capacity property (undefined);
- numeric QuestCategory;
- numeric registrationMode;
- a removed QuestCategory;
- a removed externalSourceStatus;
- a numeric externalSourceStatus;

Determine whether the contract coverage is now sufficient and correct, or whether additional validation gaps remain.

### Backend API and persistence tests

`backend/tests/Kiwimpact.IntegrationTests/Api/QuestsApiTests.cs`

The file grew from 377 lines to approximately 536 lines. The new tests include:

- `GetQuest_ListItem_DtoHasExactExpectedProperties`
- `GetQuest_Detail_DtoHasExactExpectedProperties`
- `GetQuest_Page_DtoHasExactExpectedPaginationProperties`

These tests use `JsonElement` to assert exact top-level property sets for the Quest list item, Quest detail, and pagination wrapper. Verify whether they also cover nested DTOs, JSON value kinds, enum serialization, and required nullable fields, or whether those are gaps.

`backend/tests/Kiwimpact.IntegrationTests/Persistence/ConcurrencyAndPersistenceTests.cs`

The FK Restrict test `Quest_RegionFK_RestrictDelete_IsEnforcedAtDatabaseLevel` now uses raw SQL `DELETE` with `ExecuteSqlRawAsync`. Determine whether it successfully reaches the PostgreSQL database and proves SQLSTATE `23503`.

`backend/tests/Kiwimpact.IntegrationTests/Api/QuestsApiTests.cs`

The `GetQuests_FilterByRegionParent_IncludesDescendants` test now asserts at least one directly Auckland-scoped Quest and at least one descendant-scoped Quest. Determine whether the assertions are deterministic (known Quest and Region IDs) or whether they could still pass through coincidence.

### Seed configuration tests

`backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`

Five seed-configuration tests now exist:

1. `NonDevelopmentEnvironment_SeedDoesNotExecute`
2. `DemoQuestsWithoutRegions_FailsBeforeWrites`
3. `DevelopmentWithBothFlags_Succeeds`
4. `RegionsOnlyFlag_QuestsNotSeeded`
5. `MissingPrerequisite_NoPartialRegionState`

Determine whether:

- expected startup failures are correctly asserted;
- database state is verified after failed startups;
- a transaction-rollback scenario after a partial write is tested;
- any test currently fails.

## Required verification commands

First discover the exact existing commands and test project paths from the repository. Then independently run the applicable commands.

At minimum, run:

### Repository hygiene

```shell
git status --short
git diff --check HEAD
git diff --stat HEAD
```

Enumerate all untracked files, including dotfiles.

### Backend build

```shell
dotnet build Kiwimpact.slnx --no-incremental
```

Required: build succeeds; record error and warning counts.

### Backend unit tests

```shell
dotnet test backend/tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-restore
```

Record exact passed, failed, skipped, and total counts.

### PostgreSQL integration tests

```shell
docker info
dotnet test backend/tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-restore
```

Record exact passed, failed, skipped, and total counts. List every failing test by name.

### Formatting

```shell
dotnet format Kiwimpact.slnx --verify-no-changes --no-restore
```

### Frontend

From `frontend/`:

```shell
npm run lint
npm run type-check
npm run test
npm run build
```

All must pass.

### Dependency checks

```shell
npm audit --audit-level=high
dotnet list Kiwimpact.slnx package --vulnerable --include-transitive
```

If the NuGet vulnerability command is blocked at the network level, report the blocker and do not claim a successful scan without results.

## Final repository state

After all checks, run:

```shell
git status --short
```

and confirm:

- which files are staged (if any);
- which tracked files are modified;
- which files are untracked.

## Verdict rules

READY — all required verification commands pass; all four original Major findings are substantively closed; no regressions are detected; the completion report accurately reflects the independently observed state.

NOT READY — one or more required verification commands fail; one or more original Major findings are not substantively closed; a regression is detected; or the completion report materially differs from independently observed evidence.

BLOCKED — Docker, Testcontainers, or required infrastructure cannot be brought up; a build or restore failure prevents verification; or a force-majeure external dependency is unreachable.

## Required response structure

### Verdict

READY, NOT READY, or BLOCKED

### Original Finding Status

For each of the four original Major findings:

1. Completion report accuracy
2. Frontend DTO validation and contract tests
3. Backend API and persistence evidence
4. Seed configuration evidence

Status: CLOSED, PARTIALLY CLOSED, or OPEN — with evidence for each determination.

### Verification Results

Exact command and observed result for each applicable verification step.

### Test Counts

Distinguish test methods (source `[Fact]`/`[Theory]` members) from expanded test cases (discovered by the runner).

### Remaining Findings

List any new findings discovered during this review with severity (Blocker, Major, Moderate, Minor).

Every finding must cite the exact file, line range, and observed evidence.

### Repository State

- branch;
- staged file count;
- tracked unstaged file count;
- untracked file count;
- whether any unrelated files changed;
- `git diff --check HEAD` result.

Do not modify any file. Do not suggest fixes inline. Report evidence only.