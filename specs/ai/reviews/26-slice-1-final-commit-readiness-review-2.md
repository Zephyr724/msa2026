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

| Command | Observed result |
|---|---|
| `cd backend && dotnet build Kiwimpact.slnx --no-incremental` | Passed: 0 warnings, 0 errors |
| `cd backend && dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 34/34 cases; 0 failed, 0 skipped |
| `cd backend && dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Passed against PostgreSQL: 72/72 cases; 0 failed, 0 skipped |
| `cd frontend && npm run lint` | Passed |
| `cd frontend && npm run type-check` | Passed |
| `cd frontend && npm run test -- --run` | Passed: 4 files, 48/48 tests |
| `cd frontend && npm run build` | Passed |
| `git diff --check HEAD` | Passed with no whitespace errors |
| `cd backend && dotnet list Kiwimpact.slnx package --vulnerable --include-transitive` | Successful permitted rerun: no vulnerable packages |
| `cd frontend && npm audit --audit-level=high` | Passed: 0 vulnerabilities |

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