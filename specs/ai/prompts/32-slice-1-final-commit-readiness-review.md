# Prompt 32 — Slice 1 Final Commit-Readiness Review

- Date: 2026-07-23
- Tool: OpenAI Codex
- Mode: Review uncommitted changes
- Effort: High
- Speed: Standard
- Purpose: Final read-only commit-readiness review before the Slice 1 checkpoint commit

## Prompt

# Slice 1 Final Commit-Readiness Review — Read Only

Act as the final independent reviewer for Slice 1: Region and Quest Read.

This is a read-only commit-readiness review.

Do not modify, create, delete, format, stage, commit, or revert any file.
Do not change Git state.
Do not implement fixes.
Do not rewrite the completion report.

## Review scope

Review the complete current working tree, including:

- tracked modifications;
- staged modifications, if any;
- all untracked files;
- production code;
- tests;
- migrations and seed logic;
- frontend runtime DTO validation;
- Slice 1 implementation and evidence documents.

First identify the accepted Slice 1 implementation plan, the latest Slice 1
completion report, and the latest correction/review result under `specs/`.

Use the following source-of-truth priority:

1. the accepted Slice 1 plan and its original acceptance criteria;
2. accepted project ADRs and specifications directly applicable to Slice 1;
3. the current implementation and observable runtime behaviour;
4. existing review findings that identify reproducible correctness, security,
   privacy, data-integrity, or acceptance-criteria failures.

Do not turn later optional review suggestions into new acceptance criteria.

## Existing accepted scope

Slice 1 covers the existing Region and Quest read implementation, including
the persistence model, migration, seed behaviour, read APIs, frontend
discovery/detail integration, DTO validation, and applicable tests.

Do not reopen or redesign accepted decisions concerning:

- the product scope;
- Region hierarchy semantics;
- Quest schema or API shape;
- PostgreSQL and EF Core;
- Identity persistence boundaries;
- Clean Architecture direction;
- frontend framework and state-management choices;
- features planned for later slices.

Do not recommend authentication, CRUD expansion, gamification expansion,
maps, SignalR, new dependencies, or unrelated refactoring as part of this
review.

## Approval threshold

A finding may block approval only when it is one of the following:

1. an original Slice 1 acceptance criterion is not implemented;
2. a required build, test, lint, type-check, or production build fails;
3. a reproducible runtime defect exists in a core Slice 1 path;
4. a security, privacy, foreign-key, transaction, concurrency, or
   data-integrity defect exists;
5. the implementation violates an accepted architecture boundary;
6. the completion report contains a materially false implementation or
   verification claim;
7. required Slice 1 files are missing or cannot be run from the repository.

The following are non-blocking unless they directly cause one of the failures
above:

- naming preferences;
- optional refactoring;
- stylistic alternatives;
- additional test ideas beyond the frozen acceptance criteria;
- documentation polish;
- future enhancements;
- theoretical edge cases without a reproducible failure;
- alternative architecture or API designs.

## Verification

Locate and use the repository's documented commands rather than inventing
new commands.

Run the applicable final verification gates once, including:

- backend build;
- backend unit tests;
- PostgreSQL integration tests;
- frontend lint;
- frontend type-check;
- frontend tests;
- frontend production build;
- `git diff --check`.

Record the exact command, exit result, and observed test count.

Do not repeatedly rerun successful full test suites. A command may be rerun
only when the first execution failed because of an infrastructure or command
invocation problem, and the reason must be reported.

Inspect tests semantically. In particular, check that important tests prove
the stated behaviour rather than passing vacuously, but do not invent a new
exhaustive test standard.

## Severity

Blocker:

- cannot build, cannot run, destructive defect, or fundamental required
  Slice 1 capability absent.

Major:

- reproducible correctness, security, data-integrity, architecture, or
  original acceptance-criteria failure that must be fixed before commit.

Minor:

- real but non-blocking maintainability, documentation, test-quality, or
  presentation issue.

Optional:

- preference, future improvement, or alternative design.

## Required output

Return exactly these sections:

1. Scope and evidence reviewed
2. Verification commands and observed results
3. Blockers
4. Majors
5. Minors
6. Optional backlog
7. Completion-report accuracy
8. Final verdict

For every Blocker or Major, provide:

- exact file and line;
- the existing requirement being violated;
- concrete technical evidence;
- why current tests do not already close it;
- the smallest required correction.

Do not report speculative findings as Blocker or Major.

Use one of only two final verdicts:

APPROVE

or

CHANGES REQUIRED

Return APPROVE when:

- Blocker = 0;
- Major = 0;
- all applicable verification gates pass;
- any remaining Minor or Optional items can safely be deferred.

This is the final full review for Slice 1. Do not require another full review
for Minor or Optional findings.

## Observed outcome

## 1. Scope and evidence reviewed

Reviewed the complete working tree on `feat/slice-1-region-quest-read`:

- 12 tracked unstaged files, no staged files.
- 49 untracked status entries containing 102 files.
- 114 changed or untracked files in total.
- Production backend/frontend code, migrations, seed configuration, unit and integration tests, DTO validation, and evidence/status documentation.
- Accepted Slice 1 plan: [01-slice-1-region-quest-read.md](/Users/zephyr/dev/personal/msa2026/specs/implementation/01-slice-1-region-quest-read.md).
- Plan acceptance: [16-slice-1-plan-rereview.md](/Users/zephyr/dev/personal/msa2026/specs/ai/reviews/16-slice-1-plan-rereview.md).
- Completion report: [01-slice-1-region-quest-read-completion-report-2026-07-22.md](/Users/zephyr/dev/personal/msa2026/specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md).
- Latest completed independent result: [25-slice-1-final-commit-readiness-review-2.md](/Users/zephyr/dev/personal/msa2026/specs/ai/reviews/25-slice-1-final-commit-readiness-review-2.md).
- Relevant accepted ADRs and API/domain specifications.

No files were intentionally modified, staged, deleted, formatted, or committed by this review. An untracked Prompt 32 placeholder appeared concurrently while the review was running.

## 2. Verification commands and observed results

| Command                                                                                                   | Observed result                                             |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `cd backend && dotnet build Kiwimpact.slnx --no-incremental`                                              | Passed: 0 warnings, 0 errors                                |
| `cd backend && dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`               | Passed: 34/34 cases; 0 failed, 0 skipped                    |
| `cd backend && dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Passed against PostgreSQL: 72/72 cases; 0 failed, 0 skipped |
| `cd frontend && npm run lint`                                                                             | Passed                                                      |
| `cd frontend && npm run type-check`                                                                       | Passed                                                      |
| `cd frontend && npm run test -- --run`                                                                    | Passed: 4 files, 48/48 tests                                |
| `cd frontend && npm run build`                                                                            | Passed                                                      |
| `git diff --check HEAD`                                                                                   | Passed with no whitespace errors                            |
| `cd backend && dotnet list Kiwimpact.slnx package --vulnerable --include-transitive`                      | Successful permitted rerun: no vulnerable packages          |
| `cd frontend && npm audit --audit-level=high`                                                             | Passed: 0 vulnerabilities                                   |

The first backend vulnerability scan stalled without producing results under restricted network access. It was cancelled and rerun once outside that restriction as an infrastructure-only retry.

## 3. Blockers

### [Blocker] Default frontend configuration constructs invalid API URLs

- Files: [apiFetch.ts:1](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/api/apiFetch.ts:1), [apiFetch.ts:31](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/api/apiFetch.ts:31), [quests.ts:30](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/api/quests.ts:30), [regions.ts:9](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/api/regions.ts:9).
- Existing requirement: the accepted Slice 1 plan requires functional Region and Quest discovery/detail pages backed by `/api/v1` endpoints.
- Evidence: `apiFetch` defaults its base to `/api` and concatenates it with caller paths. The new Region and Quest clients pass paths beginning with `/api/v1`, producing `/api/api/v1/...`. The documented example configuration also uses `VITE_API_BASE_URL=/api`. The backend exposes `/api/v1/...`, so the default browser experience receives 404 responses.
- Why tests do not close it: backend integration tests call `/api/v1` directly. The two `apiFetch` unit tests do not inspect the constructed request URL, and there are no Quest page tests.
- Smallest correction: with `/api` retained as the base, pass `/v1/...` from the Region and Quest clients, then add a request-URL regression test.

## 4. Majors

### [Major] Public Quest responses exceed the accepted DTO allowlists

- Files: [QuestListItemDto.cs:15](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Api/Contracts/QuestListItemDto.cs:15), [QuestDetailDto.cs:18](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Api/Contracts/QuestDetailDto.cs:18), [DtoMapping.cs:47](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs:47).
- Existing requirement: the accepted list DTO permits only `id`, `name`, and `type` for `locationRegion`, and only `id`, `imageUrl`, and `altText` for `coverImage`; detail adds only the approved source URL/check timestamp fields ([plan:977](/Users/zephyr/dev/personal/msa2026/specs/implementation/01-slice-1-region-quest-read.md:977)).
- Evidence: list responses reuse full `RegionSummaryDto` and `QuestImageDto`, exposing `parentRegionId`, image ordering/cover metadata, creator, source URL, and licence note. Detail additionally exposes `externalSourceStatus`, which is outside the accepted allowlist.
- Why tests do not close it: the tests explicitly expect the expanded image and detail shapes. The location assertion is conditional and can be skipped when the selected item has no location.
- Smallest correction: introduce the accepted minimal nested DTOs, remove the unapproved detail field, and update mappings, frontend contracts, validators, and exact-shape tests.

### [Major] Quest endpoints can expose inactive Regions

- Files: [QuestReadRepository.cs:19](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Infrastructure/Repositories/QuestReadRepository.cs:19), [DtoMapping.cs:47](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs:47).
- Existing requirement: inactive Regions must not appear in public Region or Quest operations ([plan:1057](/Users/zephyr/dev/personal/msa2026/specs/implementation/01-slice-1-region-quest-read.md:1057)).
- Evidence: Quest queries filter publication status but include and serialize `LocationRegion` without checking `IsActive`.
- Why tests do not close it: inactive-region coverage exercises Region endpoints only; no published Quest is assigned an inactive Region.
- Smallest correction: suppress inactive location data from public Quest list/detail results and add integration coverage for a published Quest referencing an inactive Region.

### [Major] Quest detail treats every failure as “not found”

- File: [QuestDetailPage.tsx:6](/Users/zephyr/dev/personal/msa2026/frontend/src/pages/QuestDetailPage.tsx:6), [QuestDetailPage.tsx:20](/Users/zephyr/dev/personal/msa2026/frontend/src/pages/QuestDetailPage.tsx:20).
- Existing requirement: the detail page must distinguish not-found from server/error states and provide the accepted recovery behavior ([plan:1187](/Users/zephyr/dev/personal/msa2026/specs/implementation/01-slice-1-region-quest-read.md:1187)).
- Evidence: every query error—including HTTP 500, network failure, or malformed response—is rendered as “Quest Not Found,” with no retry action.
- Why tests do not close it: there are no Quest detail page tests; the current frontend suite covers shell routing, `apiFetch`, and DTO validators.
- Smallest correction: inspect `ApiError.status`, render not-found only for 404, render a recoverable error with retry for other failures, and test both paths.

### [Major] Quest discovery omits required URL and card behavior

- File: [QuestListPage.tsx:23](/Users/zephyr/dev/personal/msa2026/frontend/src/pages/QuestListPage.tsx:23), [QuestListPage.tsx:44](/Users/zephyr/dev/personal/msa2026/frontend/src/pages/QuestListPage.tsx:44), [QuestListPage.tsx:60](/Users/zephyr/dev/personal/msa2026/frontend/src/pages/QuestListPage.tsx:60), [QuestListPage.tsx:233](/Users/zephyr/dev/personal/msa2026/frontend/src/pages/QuestListPage.tsx:233).
- Existing requirement: URL ownership includes search, filters, sorting, page, and page size; cards require date/undated, registration/source indication, and missing/broken-image fallback ([plan:1096](/Users/zephyr/dev/personal/msa2026/specs/implementation/01-slice-1-region-quest-read.md:1096), [plan:1153](/Users/zephyr/dev/personal/msa2026/specs/implementation/01-slice-1-region-quest-read.md:1153)).
- Evidence: `pageSize` is neither parsed nor serialized. The displayed search value is initialized from the URL only once, so browser navigation can desynchronize it. Cards lack registration/source indication, omit an undated label, and provide neither a visual placeholder nor a broken-image fallback.
- Why tests do not close it: none of the required discovery-page state, URL-ownership, or card-behavior tests exist.
- Smallest correction: complete URL synchronization and the missing card states, then add the discovery-page tests required by the accepted plan.

### [Major] Runtime DTO validation accepts values outside the backend contract

- File: [questDto.ts:12](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/validation/questDto.ts:12), [questDto.ts:29](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/validation/questDto.ts:29), [questDto.ts:110](/Users/zephyr/dev/personal/msa2026/frontend/src/lib/validation/questDto.ts:110).
- Existing requirement: untrusted Quest payloads, timestamps, nesting, and pagination metadata must be validated before use ([plan:1127](/Users/zephyr/dev/personal/msa2026/specs/implementation/01-slice-1-region-quest-read.md:1127)).
- Evidence: `Number.isInteger` accepts values outside C# `int` range; negative XP/capacity and page sizes above the API maximum are accepted. `Date.parse` accepts non-ISO values and normalizes impossible dates—for example, February 30 becomes a March date.
- Why tests do not close it: tests cover fractions and obviously non-date text, but not int32 overflow, negative constrained fields, page-size maximums, non-ISO parsable strings, or impossible calendar dates.
- Smallest correction: add an int32/range helper and strict semantic ISO timestamp validation, apply the documented field constraints, and add boundary tests.

### [Major] Required project and completion documentation materially misstates the repository

- Files: [completion report:7](/Users/zephyr/dev/personal/msa2026/specs/implementation/reports/01-slice-1-region-quest-read-completion-report-2026-07-22.md:7), [README.md:116](/Users/zephyr/dev/personal/msa2026/README.md:116), [PROJECT_STATUS.md:37](/Users/zephyr/dev/personal/msa2026/specs/PROJECT_STATUS.md:37).
- Existing requirement: the plan requires README/project-status updates and a materially truthful final completion report.
- Evidence: the report records 28 frontend tests rather than 48, 54 integration methods awaiting Docker rather than the now-executed 72 cases, contradictory warning information, stale working-tree counts, and says the full tests were not run. README still says there are no entities, migrations, or business features, while project status says implementation has not started.
- Why tests do not close it: successful implementation tests cannot make inaccurate evidence documents truthful.
- Smallest correction: after the code findings are fixed and gates rerun, update README, project status, and the completion report with the final implementation state, exact commands, counts, results, and working-tree inventory.

## 5. Minors

- [DemoQuestSeed.cs:191](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Infrastructure/Persistence/Seeds/DemoQuestSeed.cs:191): the Mt Roskill/Puketāpapa Quest is assigned to New Zealand rather than Puketāpapa to support an unrelated filter test. Restore semantically correct demo data and create a dedicated test fixture for the filter scenario.
- [SeedConfigurationTests.cs:242](/Users/zephyr/dev/personal/msa2026/backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs:242): `DemoQuestSeed_RollbackAfterPartialWrites` does not demonstrate a failure after a successful current-seed write; the curator uniqueness conflict can occur before dependent inserts. Rename the test to match what it proves or arrange a genuinely late failure.
- [RegionsController.cs:28](/Users/zephyr/dev/personal/msa2026/backend/src/Kiwimpact.Api/Controllers/RegionsController.cs:28): search-length validation resides in the controller even though the accepted responsibility split assigns query validation to the service. Move the rule into `RegionReadService` and retain controller-only result mapping.
- [32-slice-1-final-commit-readiness-review.md:5](/Users/zephyr/dev/personal/msa2026/specs/ai/prompts/32-slice-1-final-commit-readiness-review.md:5): this concurrently added file remains a placeholder rather than an actual prompt/outcome record. Populate it before including it in a commit.

## 6. Optional backlog

None. Later-slice authentication, CRUD, gamification, mapping, real-time features, deployment, and broader end-to-end automation were not treated as Slice 1 acceptance criteria.

## 7. Completion-report accuracy

The completion report is not currently suitable as final evidence. Its test counts, execution status, warning statement, and working-tree inventory are stale or contradictory. It also claims commit readiness despite the default frontend API URL failure and the remaining original acceptance-criterion gaps.

The latest observed gate totals are:

- Backend build: 0 warnings, 0 errors.
- Unit tests: 34 passed.
- PostgreSQL integration tests: 72 passed.
- Frontend tests: 48 passed across 4 files.
- Frontend lint, type-check, and production build: passed.
- Backend and frontend vulnerability scans: no findings.
- Final working tree: 12 tracked unstaged files, no staged files, and 102 untracked files represented by 49 status entries.

## 8. Final verdict

**CHANGES REQUIRED**

The automated gates pass, but the default frontend cannot reach the implemented APIs, and six major correctness, accepted-contract, frontend-state, validation, and documentation issues remain.

## Observed outcome

- Verdict: CHANGES REQUIRED
- Blockers: 1
- Majors: 6
- Minors: 4
- Verification:
  - Backend build: passed, 0 warnings, 0 errors
  - Backend unit tests: 34 passed
  - PostgreSQL integration tests: 72 passed
  - Frontend tests: 48 passed
  - Lint, type-check and production build: passed
  - Dependency scans: no known vulnerabilities
- Human decision:
  - Accept the verdict.
  - Perform one bounded correction pass.
  - Do not add new acceptance criteria.
  - Defer non-blocking minor findings.