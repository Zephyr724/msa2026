# Review 47 — Slice 7 Simple Persisted Leaderboard: Codex Independent Design Review

- **Date:** 2026-07-26
- **Reviewer:** Codex (independent design review; not the planning owner)
- **Planning owner:** Kimi K3
- **Branch:** `feat/slice-7-simple-leaderboard`
- **Baseline:** `ade8f1e3c0b474924aca44e97cb29a872f4513d1`
- **Reviewed plan:** `specs/implementation/07-simple-persisted-leaderboard.md`
- **Prompt evidence:** `specs/ai/prompts/53-slice-7-simple-persisted-leaderboard-first-plan.md`
- **Verdict:** `CHANGES REQUIRED`

## Findings summary

| Severity | Count |
| --- | ---: |
| Blocker | 0 |
| Major | 4 |
| Minor | 2 |

The overall product direction is appropriately constrained for P0:
anonymous NZ/all-time Top 10, ledger-authoritative aggregation, no schema or
dependency change, and a sequential backend/frontend delivery split. The
findings below are implementation-contract inconsistencies and regression
gaps that should be corrected in one concentrated planning pass before the
human approves D1-D8.

## Major findings

### M1 — The staged pagination rejection cannot be implemented or unit-tested through the proposed service contract

**Where:**

- D1/D5 require any `page` or `pageSize` parameter to return `400`
  (`07-simple-persisted-leaderboard.md:285-287`).
- The endpoint repeats that contract (`:438-440`).
- The proposed service accepts only `scope`, `period`, and cancellation
  (`:457-461`).
- T16 nevertheless requires the service to reject pagination before any
  repository call (`:591-595`).

**Why this matters:**

ASP.NET Core ignores undeclared query parameters by default. With the planned
action/service signature, `?page=1` and `?pageSize=10` cannot reach the
service, so the implementation either silently violates D1/D5 or moves the
check into an unplanned controller branch while T16 remains impossible.

**Required correction:**

Define one exact staged request model or exact service arguments that preserve
the presence of `scope`, `period`, `page`, and `pageSize` through the
controller/service boundary. Prefer string/nullable-string inputs for the
unsupported pagination fields so even empty or non-numeric supplied values
are deterministically rejected as the same bounded `400`. State where
validation lives, its order before readiness/repository access, and align
T14/T16 with that owner. Also state whether unrelated unknown query keys are
ignored or rejected; do not leave this to framework accident.

### M2 — The 7A exact file map cannot deliver the stated DI and Scalar/OpenAPI contract

**Where:**

- The plan says repository/service DI is registered in `Program.cs`
  (`:463-464`) and lists only `Program.cs` as the DI modification
  (`:500-517`).
- Existing repository registrations live in
  `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs:21-32`;
  `Program.cs` registers Core services.
- The file map names the nonexistent path
  `backend/src/Kiwimpact.Api/Helpers/ProblemDetailsHelper.cs`; the real file is
  `backend/src/Kiwimpact.Api/ProblemDetailsHelper.cs`.
- The baseline calls out Scalar/OpenAPI coverage, but the file map and T1-T18
  omit the existing
  `backend/tests/Kiwimpact.IntegrationTests/Api/OpenApiOperationTests.cs`,
  which is the established operation/response-code proof.

**Why this matters:**

The handoff requires the implementer to stay inside the exact file map. The
repository cannot follow the established Infrastructure registration pattern
without violating it, the problem helper target is wrong, and the P0 Scalar
documentation requirement would have no regression evidence.

**Required correction:**

Add `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs` as a
modified 7A file for `ILeaderboardRepository`; keep the Core service
registration in `Program.cs`. Correct the `ProblemDetailsHelper.cs` path. Add
`OpenApiOperationTests.cs` as a modified test file and require proof of the
leaderboard operation and its documented `200`, `400`, and `503` responses.
Recalculate 7A as approximately 13 primary files; it remains within the
10-15 guideline.

### M3 — The final `UserId` tie-break has no coherent implementation owner or observable proof

**Where:**

- D3 orders by XP, count, `lower(DisplayName)`, then internal `UserId`, while
  claiming the full chain is publicly testable (`:234-252`).
- The repository owns the ordering (`:451-456`), while T18 says the service
  unit test mirrors tie-break ordering over fabricated rows (`:591-595`).
- T6 asks for a three-way exact tie and T7 allows identical display names
  (`:566-571`), but `UserId` is deliberately absent from the response.

**Why this matters:**

If two rows have identical XP, count, and display name, swapping them produces
the same public JSON values apart from ordinal numbers attached to
indistinguishable rows. An API assertion cannot prove the internal GUID
tie-break. Conversely, a service test cannot prove SQL ordering if the
repository is the ordering owner and the service only assigns ranks.
Determinism is a central goal and R2 is correctly classified medium, so the
test contract must prove the actual owner rather than restate the desired
order.

**Required correction:**

Choose and document a single ordering owner. The recommended shape remains
repository-owned ordering plus service-owned ordinal rank assignment. Prove
the lower-name collision and final GUID tie-break with one of:

- a focused PostgreSQL repository integration test that observes internal
  row `UserId` before DTO mapping; or
- an API test using case-distinct visible names whose lowercase values collide
  and controlled GUIDs, so the GUID-decided order is externally observable
  while no ID is serialized.

Then narrow T18 to validation/readiness/rank assignment unless the service is
explicitly changed to own ordering. Keep a separate duplicate-identical-name
test for multiplicity/privacy, but do not claim it proves identity order.
Specify `SUM` as a `long` aggregate so the repository result matches the DTO.

### M4 — D7 adds a public navigation item without preserving the existing 320 px compact-navigation invariant

**Where:**

- D7 and the frontend contract specify only a visible "Leaderboard" link
  (`:320-338`, `:493-496`).
- The current authenticated navigation deliberately hides Manage quests,
  Passport, and Sign out labels below `sm`
  (`frontend/src/app/AppShell.tsx:41-79`).
- `AppShell.test.tsx:43-60` records that this compact-label pattern exists
  specifically to keep the complete Organizer/Admin cluster usable at
  320/375 px.
- T27 checks presence/routing only (`:626-627`).

**Why this matters:**

A full-width "Leaderboard" label is added to the already constrained guest,
member, organizer, and admin header. The plan could regress the responsive P0
shell while claiming a responsive leaderboard page.

**Required correction:**

Define the compact navigation presentation explicitly: an existing Lucide
icon, stable accessible name, and a label hidden below the approved breakpoint
is the established pattern. Extend `AppShell.test.tsx` to cover the new link
inside the complete guest, member, organizer, and admin clusters, including
the compact-label class contract and public visibility. No new dependency or
file is needed.

## Minor findings

### m1 — T24 overclaims a runtime no-overflow result from structural jsdom assertions

**Where:** `07-simple-persisted-leaderboard.md:335-338,615-619`.

jsdom does not perform layout and cannot prove that a four-column table has no
horizontal overflow at 320 px. The planned assertion can prove only the
structural contract.

**Required correction:**

Specify concrete narrow-table classes/column constraints (for example,
fixed-width rank/numeric columns, a flexible truncated name column, compact
padding, and a fixed table layout). Reword T24 to claim those structural
invariants only. If no real browser/manual viewport check will be executed,
do not claim observed 320 px overflow behaviour in completion evidence.

### m2 — The 7A-to-7B checkpoint and project-status responsibility are ambiguous

**Where:** `07-simple-persisted-leaderboard.md:349-367,646-652,732-750`.

D8 requires separate evidence/review boundaries but does not state whether 7A
must receive human approval and merge before 7B branches, or whether both
tasks remain on one branch with an explicit reviewed checkpoint. It also says
`PROJECT_STATUS.md` is updated by the human and prohibits the implementation
owner from updating it, while the merged file is already stale and prior
Slice completion workflows update it as implementation evidence.

**Required correction:**

Choose one exact Git-neutral handoff contract. Recommended: finish 7A
implementation/evidence/review, obtain human Git approval, merge 7A, then
start 7B from the merged `main`; name the intended implementation branches.
Alternatively, explicitly approve a single branch with a human checkpoint
before 7B. In either case, identify when the implementation owner updates
`PROJECT_STATUS.md`; Git actions still remain separately human-approved.

## Confirmed design strengths

- The plan correctly treats the Phase 2 scope as scheduling authority and
  does not expand into the accepted long-term multi-scope leaderboard.
- NZ/all-time includes unattributed XP without requiring Home Community.
- Direct committed-ledger aggregation is the appropriate authoritative P0
  source.
- Global reward-pending readiness is implementable through the existing
  parameterless `HasRewardPendingCompletionsAsync`.
- The response excludes IDs, email, community, timestamps, and ledger
  internals.
- Fixed Top 10 and no `/me` are coherent P0 exclusions.
- No migration, index, dependency, authentication, rate-limit, or write-path
  change is needed.
- The strict frontend validation, TanStack Query ownership, redemption
  invalidation, and bounded error states follow established patterns.

## Required next step

Kimi K3 should make one concentrated correction pass limited to M1-M4 and
m1-m2, updating the plan in place and appending a truthful correction record
to Prompt 53 without changing the original prompt text. Do not implement or
request human decisions yet.

After that correction, Codex performs one targeted design closure check
limited to these six findings. If all are closed, the human may approve
D1-D8 and the corrected implementation boundaries.

## Scope confirmation

This review created only
`specs/ai/reviews/47-slice-7-codex-independent-design-review.md`. It did not
modify the plan, prompt, production code, tests, accepted specifications,
dependencies, configuration, migrations, or `PROJECT_STATUS.md`. It did not
stage, commit, push, merge, create a pull request, or deploy.
