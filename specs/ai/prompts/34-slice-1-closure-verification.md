# Prompt 33 — Slice 1 Closure Verification

- Date: 2026-07-24
- Tool: Claude Code
- Model: Claude Sonnet 5
- Mode: Read-only independent verification
- Purpose: Verify closure of the original one Blocker and six Major findings

## Prompt

# Slice 1 Closure Verification — Read Only

Act as the independent closure verifier for Slice 1: Region and Quest Read.

This is not a new full code review. The purpose is only to verify whether
the original one Blocker and six Major findings from the latest Codex
commit-readiness review were correctly closed by the subsequent bounded
correction pass.

## Permissions

This task is read-only.

Do not:

- modify, create, delete, format, stage, commit, reset, or revert files;
- implement fixes;
- update documentation;
- reopen accepted product, architecture, schema, API, UX, or testing decisions;
- introduce new acceptance criteria;
- recommend later-slice functionality;
- perform unrelated refactoring review.

## Required evidence

Read:

1. the accepted Slice 1 implementation plan;
2. the latest Codex final commit-readiness review containing one Blocker and
   six Major findings;
3. the current working-tree diff;
4. the directly affected production and test files;
5. the current Slice 1 completion report.

Verify only these original findings:

1. frontend API paths must not produce `/api/api/v1/...`;
2. public Quest DTOs must match the accepted exact allowlists;
3. inactive Regions must not appear in public Quest nested location data;
4. Quest detail must distinguish HTTP 404 from recoverable failures and
   provide retry behaviour;
5. Quest discovery must implement the accepted pageSize, URL synchronization,
   date/undated, registration/source, missing-image, and broken-image behaviour;
6. runtime Quest DTO validation must enforce the documented numeric,
   pagination, and strict timestamp constraints;
7. README, project status, and the completion report must truthfully describe
   the final implementation and observed verification results.

## Test policy

Do not rerun every full test suite merely because this is a review.

You may run:

- focused tests directly covering the seven original findings;
- `git diff --check HEAD`;
- lightweight commands needed to verify a concrete claim.

The previous correction pass already reported these full gates as passing:

- backend build: 0 warnings and 0 errors;
- backend unit tests: 34 passed;
- PostgreSQL integration tests: 73 passed;
- frontend tests: 65 passed;
- frontend lint, type-check, and production build passed.

Report any inconsistency between those claims and the repository.

## Git hygiene check

The repository currently contains many untracked files because Slice 1 has not
yet received its checkpoint commit.

Classify untracked files only as:

- expected Slice 1 source, test, migration, asset, or evidence files;
- generated/build/temp files that should not be committed;
- suspicious or unrelated files requiring human inspection.

Check specifically for:

- build output;
- dependency directories;
- coverage output;
- temporary logs;
- editor files;
- secrets or local environment files.

Do not delete anything.

## Finding policy

An original finding is CLOSED only when the implementation and focused test
evidence prove the required behaviour.

An original finding is OPEN only when there is a concrete reproducible defect
or the accepted requirement remains unmet.

Do not report naming, optional refactoring, additional test ideas,
documentation polish, or alternative designs as reasons to keep Slice 1 open.

A newly discovered issue outside the seven original findings may block closure
only when it is a reproducible Blocker involving build failure, core runtime
failure, security, privacy, data loss, or repository secrets.

## Required output

Return exactly:

1. Original finding closure table
   - Finding
   - CLOSED or OPEN
   - File/test evidence

2. Git hygiene assessment
   - Expected files
   - Generated or unwanted files
   - Suspicious files

3. Remaining Blockers

4. Remaining Majors from the original review

5. Non-blocking observations

6. Final verdict

Use one of only these verdicts:

CLOSE SLICE 1

or

TARGETED FIX REQUIRED

Return CLOSE SLICE 1 when:

- all seven original findings are CLOSED;
- no reproducible new Blocker exists;
- no generated, secret, or unrelated file would make the checkpoint commit
  unsafe.

Do not request another full review after returning CLOSE SLICE 1.

## Observed outcome

- Tool: Cline with Claude Sonnet 5
- Mode: Read-only closure verification
- Verdict: CLOSE SLICE 1
- Original findings closed: 7/7
- Remaining Blockers: 0
- Remaining Majors: 0
- Git hygiene:
  - No generated build output detected
  - No dependency directories detected
  - No secrets or environment files detected
  - No unrelated files detected
- Non-blocking observations:
  - Review 26 required a `.md` extension
  - Previously deferred Minor findings remain deferred
- Human decision:
  - Accepted the closure result
  - No further Slice 1 review will be requested
  - Proceeded to checkpoint commit