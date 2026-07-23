# Slice 1 Correction Phase 1C — Evidence Completion

Execute the remaining corrections identified by Codex rereview.

Review source:

@specs/ai/reviews/21-slice-1-correction-phase-1b-focused-rereview-2026-07-23.md

Implementation plan:

@specs/implementation/01-slice-1-region-quest-read.md

Current completion report:

@specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md


## Goal

Do not redesign the Slice 1 architecture.

This phase only completes missing verification evidence,
tests, and factual documentation.

Do not modify:
- accepted architecture
- API contracts
- product scope
- database design unless required by tests


## Resolve S1-R1-1 Backend Test Evidence

Add meaningful tests for:

### PostgreSQL integration tests

Using real PostgreSQL/Testcontainers:

1. Migration verification
2. Region seed:
   - exactly 23 regions
   - exactly 21 LocalAreas
   - hierarchy valid
   - idempotent second execution
   - Region.Validate() invoked

3. Quest seed:
   - exactly 18 quests
   - 15 Published
   - 3 non-Published
   - Auckland-wide quest exists
   - null-location quest exists
   - images match references

4. Persistence:
   - FK relationships
   - Restrict delete behavior
   - Quest xmin concurrency

Concurrency test must use two DbContexts:

Context A updates Quest.
Context B updates stale Quest.
Second SaveChanges must throw DbUpdateConcurrencyException.


## WebApplicationFactory API Tests

Add HTTP integration tests for:

- GET /api/v1/regions
- GET /api/v1/regions/{id}
- GET /api/v1/quests
- GET /api/v1/quests/{id}
- pagination
- filtering
- sorting
- invalid query values

Verify:

- anonymous access works
- Published Quest visible
- Draft Quest returns 404
- DTO does not expose internal fields
- Problem Details content type is application/problem+json


## Resolve S1-R1-2 Frontend Contract

Create exact enum contracts.

Do not use unrestricted:

string

Use:

type QuestCategory =
 | "RestoreNature"
 | "ProtectWildlife"
 ...

Create shared constants.

Validators must reject:

- missing required fields
- unknown values
- numeric values
- removed old enum values


Add frontend tests for:

- accepted enum
- removed enum
- unknown enum
- missing property


## Resolve S1-R1-3 / S1-R1-4 Seed Governance

Seed must:

- call Region.Validate()
- validate every required Region before DemoQuestSeed execution
- fail before writes when prerequisites missing

Add tests:

Seed:Region=true
Seed:DemoQuests=true

Seed:Region=false
Seed:DemoQuests=true

Development environment

Non-development environment

Verify:

- no partial database state after failure


## Resolve S1-R1-5 API Validation

Add WebApplicationFactory tests proving:

These return HTTP 400:

category=999
sourceType=999
difficulty=999
sortBy=999
sortDirection=999

Verify:

- status code
- content type
- safe Problem Details response


## Resolve S1-R1-6 Dependency Governance

Update completion report.

Do not invent approval.

Record:

- requested version
- resolved version
- source
- license
- maintenance status
- vulnerability status
- human approval status


Match actual csproj files.


## Resolve S1-R1-7 Completion Report

Rewrite report so that:

- only verified facts are marked complete
- no "resolved" claims without evidence
- git status is current
- package versions are accurate
- remaining risks are explicit


## Verification required

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


Do not:

- commit
- push
- merge
- reset
- switch branches


Finish with:

SLICE 1 CORRECTION PHASE 1C COMPLETE — READY FOR FINAL REREVIEW