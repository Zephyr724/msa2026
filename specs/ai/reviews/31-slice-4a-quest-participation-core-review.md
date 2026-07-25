# Slice 4A — Quest Participation Core Independent Review

- **Date:** 2026-07-25
- **Slice:** 4A — Quest Participation Core
- **Reviewer:** Kimi K3 Max
- **Mode:** Read-only independent review
- **Final verdict:** APPROVE
- **Blockers:** 0
- **Majors:** 0
- **Minors:** 2
- **Human decision status:** Independent review evidence recorded by explicit
  human instruction; human staging and commit inspection remain pending.

## Actual independent review prompt

The human supplied the following independent-review result and evidence
instruction:

> # Record Slice 4A Independent Review Evidence — Documentation Only
>
> This is a documentation-only evidence update.
>
> Do not modify production code, tests, migrations, dependencies,
> configuration, or accepted specifications.
>
> ## Independent review result
>
> Reviewer: Kimi K3 Max
> Mode: Read-only independent review
>
> Final result:
>
> - Blockers: 0
> - Majors: 0
> - Minors: 2
> - Verdict: APPROVE
>
> Focused verification performed by the reviewer:
>
> - frontend participation tests: 20/20 passed;
> - backend focused participation tests: 28/28 passed;
> - git diff check: passed.
>
> The reviewer did not rerun all full gates. The implementation session's
> reported full-gate results remained credible.
>
> ## Verified high-risk areas
>
> Record that the reviewer independently verified:
>
> - explicit Member, Organizer, and Admin authorization;
> - authenticated session identity only;
> - creator self-participation blocked for every role;
> - creator self-join creates no row and consumes no capacity;
> - Draft visibility and OwnQuest precedence;
> - one DbContext, connection, and transaction for join;
> - materialized PostgreSQL SELECT FOR UPDATE;
> - same-transaction eligibility, count, insert, save, and commit;
> - deterministic final-slot contention;
> - partial active unique index;
> - active Quest-capacity index;
> - Restrict Quest and Identity foreign keys;
> - PostgreSQL xmin mapping and behavior;
> - cancellation-history retention and new-row rejoin;
> - exact current-user DTO privacy boundary;
> - Cookie/CSRF transport;
> - TanStack Query state ownership;
> - no participation state in Zustand;
> - no completion, XP, leaderboard, or other out-of-scope implementation.
>
> ## Deferred Minors
>
> ### m1 — Capacity-full user copy
>
> Current copy includes:
>
> "Quest is full. No participant count is shown."
>
> The second sentence exposes an internal privacy-design note in user-facing
> copy. Defer changing it to later UI polish.
>
> ### m2 — Latest-cancelled ordering test
>
> The repository implements:
>
> - JoinedAt descending;
> - Id descending as the stable tie-breaker.
>
> There is no dedicated test containing two cancelled rows to exercise this
> ordering. The current DTO does not expose which cancelled row was selected,
> so this is deferred test-clarity work rather than a behavioral defect.
>
> Do not modify production code or tests for either Minor in this task.
>
> ## Required evidence changes
>
> Create:
>
> `specs/ai/reviews/31-slice-4a-quest-participation-core-review.md`
>
> Include:
>
> - date;
> - Slice;
> - reviewer and mode;
> - actual independent review prompt;
> - Blockers;
> - Majors;
> - Minors;
> - verification performed;
> - high-risk areas verified;
> - final verdict;
> - human decision status.
>
> Update:
>
> `specs/ai/prompts/41-slice-4a-quest-participation-core-implementation.md`
>
> Change the review status to:
>
> APPROVED AFTER INDEPENDENT REVIEW
>
> Update:
>
> `specs/implementation/reports/04a-quest-participation-core-completion.md`
>
> Append a concise independent-review closure section stating:
>
> - final verdict: APPROVE;
> - remaining Blockers: 0;
> - remaining Majors: 0;
> - two deferred non-blocking Minors;
> - Slice 4A is ready for human staging and commit inspection.
>
> Do not rewrite historical implementation or gate evidence. Do not claim that
> Kimi reran the complete test suites.
>
> ## Verification
>
> Run:
>
> - git diff --check HEAD
> - git diff --stat HEAD
> - git diff --name-status HEAD
> - git status --short
> - git ls-files --others --exclude-standard
>
> Confirm that only the three evidence files above changed during this
> documentation task.
>
> Do not stage, commit, push, merge, reset, revert, deploy, switch branches, or
> create a PR.

## Findings

### Blockers

None.

### Majors

None.

### Minors

#### m1 — Capacity-full user copy

The current user-facing copy includes “Quest is full. No participant count is
shown.” The second sentence exposes an internal privacy-design note. This is
non-blocking and deferred to later UI polish; production code was not changed
as part of this evidence update.

#### m2 — Latest-cancelled ordering test

The repository orders cancelled rows by `JoinedAt` descending and then `Id`
descending as a stable tie-breaker. No dedicated test provides two cancelled
rows to exercise that ordering. Because the current DTO does not expose which
cancelled row was selected, this is deferred test-clarity work rather than a
behavioral defect; tests were not changed as part of this evidence update.

## Verification performed by the reviewer

- Frontend participation tests: 20/20 passed.
- Backend focused participation tests: 28/28 passed.
- Git diff check: passed.
- The reviewer did not rerun all full gates. The implementation session's
  reported full-gate results remained credible.

## High-risk areas independently verified

- Explicit Member, Organizer, and Admin authorization.
- Authenticated session identity only.
- Creator self-participation blocked for every role.
- Creator self-join creates no row and consumes no capacity.
- Draft visibility and OwnQuest precedence.
- One DbContext, connection, and transaction for join.
- Materialized PostgreSQL `SELECT FOR UPDATE`.
- Same-transaction eligibility, count, insert, save, and commit.
- Deterministic final-slot contention.
- Partial active unique index.
- Active Quest-capacity index.
- Restrict Quest and Identity foreign keys.
- PostgreSQL `xmin` mapping and behavior.
- Cancellation-history retention and new-row rejoin.
- Exact current-user DTO privacy boundary.
- Cookie/CSRF transport.
- TanStack Query state ownership.
- No participation state in Zustand.
- No completion, XP, leaderboard, or other out-of-scope implementation.

## Final verdict

APPROVE. There are no remaining Blockers or Majors. The two Minors are
non-blocking and deferred as recorded above.
