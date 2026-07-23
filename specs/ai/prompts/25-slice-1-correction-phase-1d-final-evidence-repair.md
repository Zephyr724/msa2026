# Slice 1 Correction Phase 1D — Final Evidence Repair

Execute corrections based on Codex final rereview.

Review:

@specs/ai/reviews/22-slice-1-final-implementation-rereview-2026-07-23.md

Implementation:

@specs/implementation/01-slice-1-region-quest-read.md

Completion report:

@specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md


## Goal

Make Slice 1 commit-ready.

This phase is NOT architecture redesign.

Only fix:
- failing tests
- incomplete verification
- inaccurate documentation


Do not:
- add new features
- change product scope
- add authentication runtime
- add gamification
- add maps
- commit/push/merge


---

# S1-R1-1 Fix Integration Evidence


## CustomWebApplicationFactory

Fix disposal recursion.

Do not call base.Dispose recursively.

Ensure:

dotnet test backend/tests/Kiwimpact.IntegrationTests

completes successfully.

Required:

all integration tests pass.

No:
- stack overflow
- exit code 134
- aborted pipeline


---

## Persistence Tests

Add real assertions.


### FK Restrict

Tests must:

1. Load dependent Quest.
2. Attempt Region deletion.
3. SaveChanges.
4. Verify expected FK restriction behavior.


Do not only inspect metadata.


### xmin concurrency

Keep existing two DbContext test.


### Region filtering

Test:

Region parent selected:

Expected:
- parent quests
- descendant quests

Region child selected:

Expected:
- only child scope


Do not only assert non-empty.


### DTO allowlist

Replace blacklist assertions.

Assert exact public DTO property sets.

Example:

Expected properties:

QuestListItemDto:
(...)
QuestDetailDto:
(...)


### Pagination

Invalid:

pageSize=100

must return:

400 Problem Details


### Ancestor ordering

Fix repository ordering:

nearest parent → root

Add test.


---

# S1-R1-2 Frontend Contract


Create exact unions:


RegionType:

Country
AdministrativeArea
LocalArea


Quest enums:

Use exact backend values.


No:

string


Required fields:

must reject:

undefined
missing property


Add tests:

1. accepted values pass
2. removed values fail
3. unknown values fail
4. numeric values fail
5. missing required fields fail


---

# S1-R1-4 Seed Safety


Add configuration tests:


Cases:


Seed Region=true
Seed Demo=true

PASS


Seed Region=false
Seed Demo=true

FAIL before writes


Missing Region prerequisite:

No partial state


Demo seed failure:

Rollback


Non Development environment:

No seed execution


Verify database state after each.


---

# S1-R1-7 Completion Report


Rewrite report.

Rules:

Only claim verified facts.

Do NOT claim:

"resolved"

unless tests prove it.


Record:

- exact test count
- exact integration count
- exact frontend tests
- exact git status
- exact package versions


Include remaining risks if any.


---

# Verification

Run:


dotnet restore

dotnet build

dotnet test


npm run lint

npm run type-check

npm run test

npm run build


Requirements:

0 errors
0 warnings


Finish:


SLICE 1 CORRECTION PHASE 1D COMPLETE — READY FOR FINAL REREVIEW