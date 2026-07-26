# Slice 7A — Simple Leaderboard Backend Implementation Prompt

## Reconstructed implementation instruction

Implement the human-approved 7A Backend task from
`specs/implementation/07-simple-persisted-leaderboard.md` on
`feat/slice-7-simple-leaderboard`, using `ade8f1e` (PR #16 / merged Slice 6B)
as the baseline.

Use approved D1–D8 option A:

- add only anonymous `GET /api/v1/leaderboards/people`;
- accept omitted or exact `scope=nz` and `period=allTime`;
- reject empty/unsupported scope/period and every supplied page/pageSize with
  400, while unrelated unknown query keys remain ignored;
- aggregate committed `XpTransaction` rows by user using long-valued XP sum
  and completion count, inner-joined to `UserProfile`;
- order by XP descending, completion count descending, lower display name
  ascending, then internal UserId ascending, `Take(10)`;
- assign ordinal ranks without serializing UserId;
- return exact envelope/row fields only;
- fail closed with 503 `leaderboard-not-ready` while the existing global
  reward-pending predicate is true;
- add no schema, migration, index, dependency, authentication, configuration,
  frontend, `/me`, pagination, other scope/period, or XP write-path change.

Stay within the approved 13-primary-file map. Amend API contract §2.14,
update `PROJECT_STATUS.md`, create a truthful completion report, run targeted
tests during implementation, then run the three full backend gates once.
Review the diff and stop for independent Kimi K3 implementation review. Do
not stage, commit, push, merge, create a pull request, or deploy.

## Execution record

Codex implemented the instruction on 2026-07-26 as the sole implementation
owner. The implementation remained inside the approved 13-primary-file map:
9 new files and 4 modified files. The source baseline revealed that
`ProblemDetailsHelper.cs` is physically under `Kiwimpact.Api/Helpers/`; the
plan file map was corrected to this observed path without changing scope or
file count.

Observed targeted verification:

- leaderboard service unit filter: 15/15 passed;
- leaderboard API plus OpenAPI integration filter against PostgreSQL:
  19/19 passed.

Observed full gates:

- `dotnet build Kiwimpact.slnx`: succeeded, 0 errors, with 5 pre-existing
  EF1002 warnings in unchanged test files;
- unit tests: 233/233 passed;
- PostgreSQL integration tests: 275/275 passed.

No schema, migration, index, dependency, authentication, configuration,
frontend, or excluded leaderboard capability changed. No Git write action or
deployment was performed. Independent Kimi K3 implementation review remains
pending.

## Post-implementation review update

Kimi K3 independently reviewed the implementation in Review 48 and returned
`APPROVED` with 0 Blockers, 0 Majors, and 2 non-blocking Minors. The reviewer
independently observed a successful build, 233/233 unit tests, and 275/275
PostgreSQL integration tests. Review 49 records the previously omitted
targeted design-closure evidence, closing the evidence-only Minor. The
remaining dual-namespace style observation is deliberately deferred; no
production code or test was changed after Kimi K3 approval. Git actions
remain pending explicit human approval.
