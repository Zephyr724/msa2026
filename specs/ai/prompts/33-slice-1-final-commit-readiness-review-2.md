# Slice 1 Final Corrections — Bounded Implementation Task

Act as the sole implementation owner for the final Slice 1 corrections.

The goal is to close exactly the one Blocker and six Major findings from the
latest Slice 1 final commit-readiness review. This is not a redesign and must
not expand the Slice 1 scope.

## Source of truth

Read first:

1. the latest Slice 1 final commit-readiness review;
2. the accepted Slice 1 implementation plan;
3. the current Slice 1 completion report;
4. only the production and test files directly involved in the listed
   findings.

Use the accepted Slice 1 plan as the source of truth. Do not change the plan
or weaken an accepted requirement to make the implementation pass.

## Do not do

Do not:

- reopen accepted product, architecture, schema, database, API, or UX
  decisions;
- introduce authentication, CRUD expansion, gamification expansion, maps,
  SignalR, deployment, or later-slice functionality;
- introduce new dependencies;
- perform unrelated refactoring;
- fix optional style preferences;
- create new acceptance criteria;
- stage, commit, push, reset, or revert Git changes;
- rewrite historical AI evidence;
- repeatedly run full test suites after every small edit.

## Required corrections

### 1. Correct the frontend API URL contract

The documented frontend base is `/api`.

Region and Quest clients currently pass `/api/v1/...`, which produces
`/api/api/v1/...`.

Preserve `/api` as the configured base and make the Region and Quest request
paths consistently use `/v1/...`, unless an existing central API convention
requires an equivalent single-base correction.

Add a regression test that asserts the final constructed request URL and
would fail if `/api/api/...` is produced.

### 2. Restore the accepted public Quest DTO shapes

Follow the exact nested DTO allowlists in the accepted Slice 1 plan.

In particular:

- `locationRegion` must expose only the fields approved by the plan;
- `coverImage` must expose only the fields approved by the plan;
- Quest detail must not expose fields outside its approved allowlist.

Introduce minimal nested DTOs where necessary rather than reusing broader
internal DTOs.

Update:

- backend contracts;
- mappings;
- frontend TypeScript contracts;
- runtime validators;
- exact-shape tests.

Do not add any new public fields.

### 3. Prevent inactive Regions from appearing in public Quest responses

A published Quest must not serialize an inactive Region as public location
data.

Use the smallest behaviour consistent with the accepted plan. If the plan
does not explicitly require hiding the entire otherwise-published Quest,
suppress the inactive nested Region rather than hiding the Quest.

Add PostgreSQL integration coverage that creates or uses a published Quest
associated with an inactive Region and proves the accepted public behaviour.

### 4. Correct Quest detail error handling

The Quest detail page must:

- render the not-found state only for HTTP 404;
- render a separate recoverable error state for network, server, malformed
  response, or other failures;
- provide the accepted retry action for recoverable failures.

Use the existing `ApiError` contract.

Add focused frontend tests for:

- 404;
- non-404/recoverable error;
- retry behaviour.

### 5. Complete the accepted Quest discovery URL and card behaviour

Implement only the behaviour explicitly required by the accepted Slice 1
plan:

- parse and serialize `pageSize`;
- keep the visible search input synchronized with URL changes, including
  browser navigation;
- preserve the accepted search, filter, sort, page, and page-size ownership;
- show the required dated or undated state;
- show the required registration/source indication;
- provide a missing-image placeholder;
- recover from a broken image.

Add focused page/component tests for these behaviours.

Do not redesign the page or add new filters.

### 6. Tighten runtime DTO validation to the documented backend contract

Apply only constraints already present in the accepted backend/API contract:

- C# `int` compatible bounds where applicable;
- non-negative constraints for fields such as XP and capacity where the
  contract requires them;
- accepted page-size limits;
- strict ISO timestamp format;
- rejection of impossible calendar dates.

Do not invent additional validation rules.

Add focused boundary tests for each corrected class of invalid value.

### 7. Update required documentation only after the code gates pass

After all code corrections and final verification:

- update README to reflect that Slice 1 entities, migration, read APIs, pages,
  and tests now exist;
- update `specs/PROJECT_STATUS.md`;
- update the existing Slice 1 completion report once.

The completion report must contain the final observed commands and results,
not predicted values.

Use the final observed counts. Do not retain stale statements saying that
integration tests were not run or implementation has not started.

## Minor findings

Do not treat these as commit blockers:

- demo Quest seed semantics;
- rollback-test naming/strength;
- controller/service responsibility for search-length validation.

Leave them unchanged unless a required Major correction already touches the
same code and the improvement is trivial and risk-free.

Do not create a new cleanup task for them.

The Prompt 32 placeholder will be completed manually and is not part of the
production-code correction.

## Execution sequence

Work in these phases:

1. inspect and state the exact intended edits;
2. API URL correction and focused test;
3. backend DTO and inactive-Region corrections with focused tests;
4. frontend detail/discovery corrections with focused tests;
5. DTO validation corrections with focused tests;
6. run all final verification gates once;
7. update README, project status, and completion report;
8. run documentation/Git whitespace checks.

Do not stop after writing a plan. Continue through implementation and
verification.

## Final verification

Run the repository's documented equivalents of:

- `cd backend && dotnet build Kiwimpact.slnx --no-incremental`
- backend unit tests;
- PostgreSQL integration tests;
- `cd frontend && npm run lint`
- `cd frontend && npm run type-check`
- `cd frontend && npm run test -- --run`
- `cd frontend && npm run build`
- `git diff --check HEAD`

Do not rerun a successful full suite unless code was changed after that suite
completed.

Do not perform dependency scans unless dependency files changed.

## Completion criteria

The task is complete only when:

- the original Blocker is closed;
- all six original Major findings are closed;
- all applicable final gates pass;
- README, project status, and completion report are truthful;
- no new dependency or unrelated scope was introduced.

## Required final response

Return:

1. Files changed
2. Blocker correction
3. Major corrections, one by one
4. Tests added or changed
5. Exact verification commands and observed results
6. Deferred Minor findings
7. Remaining Blockers
8. Remaining Majors
9. Commit-readiness recommendation

Do not claim commit readiness if any original Blocker or Major remains.


## Observed outcome

- Verdict: CHANGES REQUIRED
- Blockers: 1
- Majors: 6
- Minors: 4
- Human decision:
  - Accepted the Blocker and Major findings.
  - Requested one bounded correction pass.
  - Deferred non-blocking Minor findings.
- Correction outcome:
  - Original Blocker reported closed.
  - All six original Majors reported closed.
  - Backend build: 0 warnings, 0 errors.
  - Backend unit tests: 34 passed.
  - PostgreSQL integration tests: 73 passed.
  - Frontend tests: 65 passed.
  - Lint, type-check, production build and git diff check passed.