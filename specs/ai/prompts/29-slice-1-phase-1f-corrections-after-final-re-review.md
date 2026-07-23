# Prompt 29 — Slice 1 Phase 1F Corrections After Codex Final Re-review

You are the implementation agent responsible for correcting the remaining
Slice 1 commit blockers identified by the independent Codex final
commit-readiness re-review.

Review:

@specs/ai/reviews/25-slice-1-final-commit-readiness-review-2.md

Repository:

`/Users/zephyr/dev/personal/msa2026`

Expected branch:

`feat/slice-1-region-quest-read`

## Role

You may edit repository files and run the existing verification commands.

Do not:

- commit, stage, push, merge, rebase, reset, restore, clean, or switch branches;
- remove, skip, disable, weaken, or rename failing tests merely to make the suite pass;
- reduce assertion strength;
- suppress compiler warnings without correcting their cause;
- add unrelated functionality;
- add new dependencies unless an accepted repository decision explicitly requires them;
- create a database migration unless a genuine production schema change requires one;
- claim completion before the complete PostgreSQL integration suite has passed;
- update the completion report with predicted or estimated results.

Read the root `AGENTS.md`, relevant `.clinerules`, accepted Slice 1 documents,
the current completion report, Prompt 28, and the latest Codex review before
making changes.

## Objective

Close every Critical, Major, and Moderate finding from the latest Codex
Slice 1 final commit-readiness re-review.

The latest independently observed baseline was:

- backend unit tests: 34 passed;
- PostgreSQL integration tests: 66 total, 63 passed, 3 failed;
- frontend tests: 28 passed;
- backend non-incremental build: succeeded with 2 CS0114 warnings;
- frontend lint, type-check, test, and build: passed;
- `git diff --check HEAD`: passed.

Do not treat these numbers as the final Phase 1F evidence. Re-run and record
the actual results after the corrections.

---

## Required correction 1 — Database-level FK Restrict test

Affected file:

`backend/tests/Kiwimpact.IntegrationTests/Persistence/ConcurrencyAndPersistenceTests.cs`

The current raw SQL invocation passes a `CancellationToken` as a SQL
parameter and fails before PostgreSQL executes the DELETE statement.

Correct the test so that it:

1. invokes the intended asynchronous raw SQL overload correctly;
2. executes the DELETE against the real PostgreSQL Testcontainers database;
3. attempts to delete a parent row that is referenced by a dependent row
   protected by the configured FK Restrict behaviour;
4. proves that the database rejected the DELETE;
5. asserts PostgreSQL SQLSTATE `23503` from the actual provider exception or
   its verified exception chain;
6. confirms the protected records still exist after the failed operation;
7. preserves test isolation and cleanup.

Use a named cancellation-token argument or another unambiguous supported
overload where appropriate.

Do not replace the database-level proof with an EF Core tracked-entity
exception test.

Run the corrected test independently before continuing.

---

## Required correction 2 — Deterministic parent and descendant filtering

Affected file:

`backend/tests/Kiwimpact.IntegrationTests/Api/QuestsApiTests.cs`

The current parent-region test treats every non-Auckland Region as a
descendant. It does not prove the real hierarchy and does not reject unrelated
or null regions.

Replace or strengthen the test using deterministic records created for that
test.

The evidence must include:

- one explicitly known parent Region;
- at least one explicitly known active descendant;
- a Quest assigned directly to the parent;
- a Quest assigned to the real descendant;
- a Quest assigned to an unrelated Region;
- a Quest with a null Region where the contract permits it;
- exact Quest IDs expected to be included;
- exact Quest IDs expected to be excluded.

Assert that:

- parent-only filtering returns only the direct-parent Quest when that is the
  accepted API behaviour;
- descendant-inclusive filtering returns the parent and actual descendant
  Quests;
- unrelated and null-region Quests are excluded;
- no result is accepted merely because its Region is “not Auckland”;
- ordering assumptions are not used as proof.

Use the accepted Slice 1 API semantics as the source of truth. Do not invent
new filter behaviour.

---

## Required correction 3 — Exact backend JSON contracts

Strengthen the backend API integration evidence beyond Quest top-level
property names.

Inspect the actual public DTOs and accepted API contract, then add exact JSON
assertions for the relevant Slice 1 endpoints.

Cover, where returned by the API:

- Region summary DTO;
- Region detail DTO;
- Region children response;
- Region ancestors response;
- Quest list item DTO;
- Quest detail DTO;
- nested Region objects;
- QuestImage objects;
- pagination metadata;
- exact property names;
- exact property sets where the contract requires them;
- JSON primitive types;
- required versus optional properties;
- expected null values;
- enum serialization values;
- arrays and nested object shapes;
- absence of unintended public properties.

Tests must fail when:

- a property is renamed;
- an unintended property is exposed;
- a number becomes a string;
- a nullability contract changes;
- an enum is serialized incorrectly;
- a nested DTO changes shape.

Avoid assertions that only deserialize into the same DTO type, because that
can hide accidental contract changes.

---

## Required correction 4 — Seed configuration startup-failure tests

Affected file:

`backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`

Two tests currently call `CreateClient()` without asserting the expected
startup exception. The exception ends the test before database-state
assertions execute.

Correct each test so that it:

1. explicitly asserts the expected startup failure using the appropriate
   synchronous or asynchronous assertion for the actual API;
2. verifies the relevant exception type and meaningful message or cause;
3. creates an independent DbContext after the startup failure;
4. checks the actual database state;
5. proves that no unintended seed records remain.

Do not use `Assert.ThrowsAsync` blindly if the actual call throws
synchronously. Use the assertion form that matches observed behaviour.

---

## Required correction 5 — Real DemoQuestSeed transaction rollback proof

The fifth seed test currently proves only that a required Region is missing.
It does not prove rollback after partial DemoQuestSeed writes have begun.

Create a deterministic integration test that causes a genuine failure during
the DemoQuestSeed transaction after at least some seed work has started.

The test must prove that the transaction rolls back all partial records,
including as applicable:

- demo curator or seed user;
- Quest;
- QuestImage;
- related seed records created in the same transaction.

Requirements:

- use the real PostgreSQL persistence layer;
- use the real seed transaction boundary;
- trigger failure through an existing supported configuration path or a real
  database constraint;
- do not add a production “throw for test” switch;
- do not add test-only branches to production seed code;
- do not mock away the database transaction;
- assert database state using a fresh independent DbContext after failure;
- ensure the test remains deterministic and isolated.

Inspect the current seed implementation before choosing the failure
mechanism. Prefer a real late database constraint or deterministic seed-data
conflict over implementation hooks.

---

## Required correction 6 — Frontend runtime contract validation

Affected files include:

- `frontend/src/lib/validation/regionDto.ts`
- `frontend/src/lib/validation/questDto.ts`
- `frontend/tests/unit/dtoValidation.test.ts`

Align frontend runtime validation with the real backend public contract.

### UUID validation

Fields backed by `Guid` or `Guid?`, including `parentRegionId`, must accept
only:

- a valid UUID string;
- `null`, but only where the backend DTO permits null.

Reject:

- arbitrary strings;
- empty strings;
- malformed UUIDs;
- numbers;
- missing required UUID properties.

Use one shared UUID-validation approach where practical.

### Timestamp validation

Fields representing backend timestamps must reject arbitrary strings.

Validate that timestamp strings are valid representations of the actual
backend JSON timestamp contract.

Add tests for:

- valid timestamps;
- impossible dates;
- arbitrary text;
- empty strings;
- wrong primitive types;
- missing required timestamps.

Do not silently coerce values.

### Integer and range semantics

Fields backed by C# integer types must reject:

- decimals;
- `NaN`;
- infinity;
- numeric strings;
- values outside the accepted semantic range.

Inspect backend DTOs, validation rules, EF configuration, and accepted specs
to determine the real constraints. Do not invent arbitrary limits.

Cover at minimum, where present:

- `xpAward`;
- `capacity`;
- `sortOrder`;
- page number;
- page size;
- total count;
- total pages;
- other pagination metadata.

Validate nullable values only where the backend contract permits null.

Add focused regression tests for every corrected boundary.

### Nested and collection validation

Ensure malformed nested Region and QuestImage values cannot pass simply
because the top-level Quest object is otherwise valid.

Verify:

- arrays are arrays;
- every array element is valid;
- required nested properties exist;
- invalid nested UUIDs, timestamps, integers, enums, and null values fail.

Do not introduce silent defaults or coercion.

---

## Required correction 7 — Eliminate backend compiler warnings

Affected locations include the two test factory `DisposeAsync()` declarations
in:

`backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`

The clean non-incremental build currently reports two CS0114 warnings because
the methods hide inherited members.

Correct the disposal implementation without warning suppression.

Requirements:

- preserve correct asynchronous cleanup;
- preserve Testcontainers and WebApplicationFactory cleanup;
- do not leak containers, clients, service providers, or database resources;
- use a proper override when supported;
- otherwise make intentional hiding explicit only when it is genuinely the
  correct lifecycle implementation;
- prefer a clearer helper method or disposal structure when that avoids
  ambiguous member hiding.

After correction, a non-incremental solution build must report:

- 0 errors;
- 0 warnings.

---

## Required correction 8 — Repair Prompt 28

Affected file:

`specs/ai/prompts/28-slice-1-phase-1e-final-commit-readiness-re-review.md`

The file is truncated near line 242 and contains an unclosed code block.

Repair the document so that:

- all Markdown code fences are closed;
- the repository-hygiene command section is complete;
- backend, frontend, integration, dependency, and final repository-state
  verification requirements are present;
- READY / NOT READY / BLOCKED verdict rules are complete;
- the required response structure is complete;
- the document ends cleanly;
- no review requirement is weakened;
- no invented review result is inserted into the task prompt.

Run an appropriate Markdown or structural inspection after editing.

---

## Required correction 9 — Completion report must be updated last

Affected file:

`specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md`

Do not update this report until all implementation changes are complete and
the full verification sequence has been executed.

After all required checks pass, rewrite the report using only independently
observed Phase 1F evidence.

The report must accurately distinguish:

- test methods from expanded test cases;
- unit tests from integration tests;
- compilation from actual test execution;
- passed checks from blocked checks;
- tracked files from untracked files;
- current findings from accepted future-phase work.

It must contain the exact observed:

- backend unit-test count;
- PostgreSQL integration-test method count where determinable;
- PostgreSQL expanded test-case count;
- frontend test count;
- build warning and error count;
- staged file count;
- tracked unstaged file count;
- untracked file count;
- complete verification command results.

Do not retain claims that all findings are closed unless the verification
evidence proves that they are closed.

Do not hard-code the previous counts of 54, 55, 58, 66, 97, or 109 without
recomputing the current state.

If any required test still fails, do not rewrite the report as complete.
Instead, leave an accurate pending or failed status and report the blocker in
your final response.

---

## Implementation sequence

Use this sequence:

1. inspect repository instructions and current diff;
2. reproduce the three failing integration tests;
3. fix the FK Restrict test;
4. fix deterministic hierarchy-filter tests;
5. strengthen exact backend JSON contract tests;
6. correct seed startup-failure tests;
7. add the real transaction rollback test;
8. correct frontend validators and regression tests;
9. remove the two compiler warnings;
10. repair Prompt 28;
11. run targeted tests for each changed area;
12. run the complete verification suite;
13. update the completion report using final observed evidence;
14. run the complete verification suite again if the report or code changed;
15. inspect final Git status and diff.

Do not update the completion report between steps 1 and 12.

---

## Required verification

Discover and confirm the exact project paths before running commands.

### Repository hygiene

Run:

```shell
git status --short
git diff --check HEAD
git diff --stat HEAD

Enumerate all untracked files, including dotfiles.

Backend build

Run a clean non-incremental build:

dotnet build Kiwimpact.slnx --no-incremental

Required result:

build succeeds;
0 errors;
0 warnings.
Backend unit tests

Run the backend unit-test project separately.

Record the exact observed passed, failed, skipped, and total counts.

PostgreSQL integration tests

Confirm Docker availability:

docker info

Run the complete integration-test project, not only filtered tests.

Expected project path should be confirmed from the repository before use.

A likely command is:

dotnet test backend/tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj

Required result:

all discovered and expanded integration test cases pass;
no failed or skipped test hides a required contract;
Testcontainers are cleaned up.

Also run focused filters during development for:

FK Restrict;
hierarchy filtering;
exact DTO contracts;
seed configuration;
transaction rollback.

Focused passes do not replace the final complete suite.

Formatting

Run the accepted repository formatting verification, including:

dotnet format --verify-no-changes
Frontend

From frontend, run:

npm run lint
npm run type-check
npm run test
npm run build

All must pass.

Dependency checks

Run the accepted checks that do not modify lockfiles or dependencies,
including where available:

npm audit --audit-level=high

Run the repository’s accepted NuGet vulnerability query.

If NuGet metadata access is externally blocked, report the exact blocker.
Do not claim a successful vulnerability scan.

Final state

After all commands, run Git status again.

Confirm that:

no files were staged;
no commit was created;
no unrelated files changed;
review and test commands did not create source-controlled artefacts;
all remaining changes belong to Slice 1 or its documented correction
evidence.
Acceptance conditions

Do not declare Phase 1F complete unless all of the following are true:

FK Restrict reaches PostgreSQL and proves SQLSTATE 23503;
deterministic hierarchy-filter evidence passes;
exact backend JSON contracts are meaningfully covered;
startup-failure seed tests pass and reach their database assertions;
transaction rollback after partial seed work is proven;
frontend UUID, timestamp, integer, range, nested, and pagination validation
regressions are covered;
backend non-incremental build has zero warnings;
Prompt 28 is complete and valid Markdown;
backend unit tests all pass;
the full PostgreSQL integration suite all passes;
frontend lint, type-check, tests, and build all pass;
the completion report matches the final observed state;
git diff --check HEAD passes.
Required final response

Use this structure:

Slice 1 Phase 1F Correction Result
Status

IMPLEMENTATION COMPLETE, CHANGES STILL REQUIRED, or BLOCKED

Corrections Made

For each Codex finding, list:

files changed;
exact correction;
tests added or strengthened;
why the original false positive or failure is no longer possible.
Verification Results

Provide the exact command and observed result for:

non-incremental backend build;
backend unit tests;
complete PostgreSQL integration suite;
frontend lint;
frontend type-check;
frontend tests;
frontend build;
formatting;
dependency checks;
git diff --check HEAD.
Test Counts

Clearly distinguish:

source test methods;
expanded/discovered test cases;
passed;
failed;
skipped.
Remaining Risks

List only genuine unresolved risks.

Do not list accepted future work such as Cypress or deployment as a current
Slice 1 implementation defect unless the accepted Slice 1 scope requires it.

Git State

Report:

branch;
staged count;
tracked unstaged count;
untracked count;
whether any unrelated files changed.
Commit Recommendation

State whether the repository is ready for an independent Codex re-review.

Do not commit.
```
