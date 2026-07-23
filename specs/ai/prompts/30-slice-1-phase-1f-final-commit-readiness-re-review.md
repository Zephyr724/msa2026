# Prompt 30 — Slice 1 Phase 1F Final Commit Readiness Re-review

You are performing the independent final commit-readiness re-review of
Kiwimpact Slice 1 after Phase 1F corrections.

Repository:

`/Users/zephyr/dev/personal/msa2026`

Expected branch:

`feat/slice-1-region-quest-read`

## Review mode

This is a strictly read-only review.

Do not:

- modify, create, delete, rename, or format repository files;
- stage, commit, push, merge, rebase, reset, restore, clean, stash, or switch branches;
- install or update dependencies;
- fix findings;
- accept the DeepSeek completion summary as evidence without independent verification.

Return the review result in your response. Do not write the review file into
the repository.

## Required source documents

Before reviewing the implementation, read:

- root `AGENTS.md`;
- relevant `.clinerules`;
- accepted Slice 1 plan and architecture documents;
- the latest Codex final commit-readiness review;
- `specs/ai/prompts/28-slice-1-phase-1e-final-commit-readiness-re-review.md`;
- `specs/ai/prompts/29-slice-1-phase-1f-corrections-after-final-re-review.md`;
- the current Slice 1 completion report;
- relevant testing and AI workflow documents.

Use accepted repository documents as the source of truth.

## Objective

Determine whether every blocker from the previous Codex review is genuinely
closed and whether the complete current uncommitted Slice 1 diff is ready for
one coherent commit.

DeepSeek currently claims:

- backend build: 0 errors and 0 warnings;
- backend unit tests: 34 passed;
- PostgreSQL integration tests: 72 passed;
- frontend tests: 48 passed;
- frontend lint, type-check, and build passed;
- all previous findings are closed.

Do not rely on these claims. Reproduce and verify them independently.

## Previous findings requiring closure

Verify each of the following:

1. PostgreSQL FK Restrict test reaches the real database and proves SQLSTATE
   `23503`.
2. Parent and descendant Region filtering uses deterministic hierarchy
   evidence and excludes unrelated and null Regions.
3. Backend exact JSON contract tests cover Region, Quest, nested Region,
   QuestImage, pagination, types, nullability, enums, arrays, and unintended
   properties.
4. Seed startup-failure tests catch the expected exception and still inspect
   database state using an independent context.
5. DemoQuestSeed transaction rollback is tested after partial seed work begins,
   not merely before any writes occur.
6. Frontend UUID, timestamp, integer, pagination, nested object, and collection
   validators match the actual backend contract.
7. The non-incremental backend build produces zero warnings.
8. Prompt 28 is complete Markdown and contains the full intended review task.
9. The completion report contains accurate final Phase 1F observed evidence.

## Specific inconsistencies to investigate

The DeepSeek completion summary did not explicitly describe a final update to
the Slice 1 completion report. Verify whether it was actually updated after
the final complete verification run.

The previous Codex review observed 97 untracked files. DeepSeek now reports
46 untracked files without a commit or staging operation. Independently explain
the current state and verify that no required Slice 1 files were deleted,
omitted, or moved unexpectedly.

Independently confirm the claimed:

- 36 PostgreSQL integration test methods;
- 72 expanded integration test cases;
- 48 frontend tests;
- tracked and untracked file counts.

Do not treat approximate counts as exact evidence.

## Repository-state review

Inspect:

```shell
git branch --show-current
git status --short
git diff --check HEAD
git diff --stat HEAD
git diff --name-status HEAD
git ls-files --others --exclude-standard

Review every tracked and untracked changed path.

Confirm:

staged count;
tracked unstaged count;
untracked count;
absence of untracked dotfiles;
absence of secrets, machine-specific files, generated artefacts, or unrelated
changes;
all intended Slice 1 implementation and evidence files are present.
Implementation review

Review the complete current diff, not only files named by DeepSeek.

Check for:

weakened or false-positive tests;
assertions dependent on seed ordering;
flexible JSON assertions that allow contract regressions;
incorrect UUID or timestamp validation;
arbitrary frontend constraints not supported by backend semantics;
production test hooks;
warning suppression;
incorrect disposal or resource cleanup;
unsafe raw SQL;
incomplete transaction rollback evidence;
architecture dependency violations;
unrelated scope expansion;
stale or misleading documentation.

For the transaction rollback test, establish whether partial writes genuinely
occur inside the transaction before failure and whether a fresh DbContext
proves rollback.

For the FK test, establish whether PostgreSQL executes the DELETE and returns
SQLSTATE 23503.

Independent verification

Run the repository’s exact existing commands.

Backend build
dotnet build Kiwimpact.slnx --no-incremental

Required for readiness:

0 errors;
0 warnings.
Backend unit tests

Run the backend unit-test project separately and report exact passed, failed,
skipped, and total counts.

PostgreSQL integration tests

Confirm Docker availability:

docker info

Run the complete integration-test project, not only filtered tests:

dotnet test backend/tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj

Report:

source test method count where independently determinable;
discovered or expanded test-case count;
passed;
failed;
skipped.

Compilation or discovery alone is not sufficient.

Formatting
dotnet format --verify-no-changes
Frontend

From frontend, run:

npm run lint
npm run type-check
npm run test
npm run build

Report exact observed results and test count.

Dependency checks

Run the accepted npm and NuGet vulnerability checks without modifying
dependencies.

If an external service prevents the NuGet check, report the exact limitation.
Do not convert a blocked scan into a passing result.

Final state

After all verification, run Git status again and confirm the review introduced
no source-controlled changes.

Verdict rules

Return exactly one verdict:

READY FOR COMMIT

Only when:

every previous blocker is substantively closed;
all complete test suites pass;
backend build has zero warnings;
completion evidence matches observed results;
no Critical or Major findings remain;
repository contents and hygiene are acceptable.
CHANGES REQUIRED

Use when:

any previous blocker remains open;
any required command fails because of implementation;
tests provide false-positive or incomplete evidence;
completion documentation is inaccurate;
required Slice 1 files are missing;
a new Critical or Major issue is found.
BLOCKED

Use only when required verification cannot be completed because of an external
environment limitation and no implementation failure has otherwise been
established.

Required response format
Slice 1 Phase 1F Final Commit Readiness Re-review
Verdict

READY FOR COMMIT, CHANGES REQUIRED, or BLOCKED

Previous Finding Closure
Finding	Status	Independent evidence
Findings

List Critical, Major, then Minor findings.

For each finding include:

severity;
file and exact line or range;
observed evidence;
why it matters;
required correction or acceptance condition.

State No findings when appropriate.

Verification Results

Include exact commands, results, and observed test counts.

Repository State

Include:

branch;
staged count;
tracked unstaged count;
untracked count;
explanation of the previous 97 versus current count;
whether review commands changed repository files.
Residual Risks

Separate accepted future work from actual Slice 1 risks.

Commit Recommendation

State whether the current complete uncommitted diff may be committed as one
coherent Slice 1 commit.

Do not commit.


