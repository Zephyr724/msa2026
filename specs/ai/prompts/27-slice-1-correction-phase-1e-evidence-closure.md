# Slice 1 Correction Phase 1E — Evidence Closure

Execute the remaining corrections from Codex final review.

Review:

@specs/ai/reviews/24-slice-1-final-commit-readiness-review.md

Implementation plan:    

@specs/implementation/01-slice-1-region-quest-read.md


Goal:

Make Slice 1 commit-ready.

This phase is only:
- test correctness
- evidence completion
- documentation accuracy

Do not:
- redesign architecture
- expand scope
- add authentication
- add new product features
- commit
- push
- merge


# 1. Completion Report

Rewrite:

specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md


Requirements:

Remove stale Phase 1C references.

Use exact Phase 1E observed evidence:

- exact integration test count
- exact unit test count
- exact frontend test count
- exact git status
- exact remaining risks

Never mark unverified tests as completed.


# 2. Frontend Contract Validation


## Exact DTO validation

Update:

frontend/src/lib/validation/questDto.ts
frontend/src/lib/validation/regionDto.ts


Required behavior:

Reject:

- unknown enum values
- removed enum values
- numeric values
- missing required properties


Strictly validate:

Region:

- id
- name
- type
- status
- children


Quest:

- required fields
- locationRegion
- coverImage
- pagination metadata


Do not silently coerce:

Number()
Boolean()


Unknown payloads must fail.


## Add Vitest contract tests


Create dedicated tests.

Cover:

1. valid Region payload passes
2. invalid Region enum fails
3. valid Quest payload passes
4. removed enum fails
5. numeric enum fails
6. missing required field fails
7. malformed pagination fails
8. malformed nested Region fails


# 3. Backend API Evidence


## DTO allowlist

Replace blacklist assertions.

Do exact schema assertions.

Example:

QuestListItemDto properties must equal expected public fields.

No hidden fields.


## Region filtering tests


Parent filter:

Must prove:

- parent-region quests returned
- descendant LocalArea quests returned


Child filter:

Must prove:

- every result belongs to selected child scope
- no unrelated region
- no null-location unless contract explicitly allows


## FK Restrict test


Current test is insufficient.

Create database-level verification.

Required:

1. Insert dependent Quest.
2. Attempt parent Region deletion.
3. SaveChanges.
4. Verify database FK restriction behavior.


Do not rely only on EF change tracker.


# 4. Seed Configuration Tests


Add integration tests.

Verify:


Case 1:

Development
SeedRegion=true
SeedDemoQuests=true

Expected:
success


Case 2:

Development
SeedRegion=false
SeedDemoQuests=true

Expected:
fail before writes


Case 3:

Missing Region prerequisite

Expected:
no partial state


Case 4:

Demo seed failure

Expected:
transaction rollback


Case 5:

Non Development environment

Expected:
seed does not execute


Verify database state after each.


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

SLICE 1 CORRECTION PHASE 1E COMPLETE — READY FOR FINAL REREVIEW