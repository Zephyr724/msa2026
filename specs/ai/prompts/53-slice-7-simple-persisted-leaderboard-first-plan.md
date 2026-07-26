# Prompt 53 — Slice 7 Simple Persisted Leaderboard First Plan

- **Date:** 2026-07-26
- **Agent:** Kimi K3 (planning owner)
- **Task type:** Planning only — no production code, tests, migrations,
  dependencies, configuration, or accepted-spec changes
- **Output:** `specs/implementation/07-simple-persisted-leaderboard.md`

## Prompt given to Kimi K3 (verbatim)

> You are Kimi K3 acting as the planning owner for Slice 7 — Simple Persisted Leaderboard.
>
> This is a planning-only task. Do not implement production code, tests, migrations, dependencies, configuration, or accepted-spec changes.
>
> ## Repository and baseline
>
> - Repository: `/Users/zephyr/dev/personal/msa2026`
> - Required branch: `feat/slice-7-simple-leaderboard`
> - Expected baseline: `ade8f1e` — PR #16 merge of Slice 6B
> - Slice 6B is merged and `main` is clean.
> - Codex will be the sole implementation owner after human approval.
> - Codex will perform the independent design review.
> - Kimi K3 will later perform the independent implementation review.
>
> Before planning, verify the branch, HEAD, merge ancestry, and working tree. Preserve every pre-existing change.
>
> ## Scheduling authority
>
> Read and distinguish scheduling scope from long-term accepted direction:
>
> - `AGENTS.md`
> - `PROJECT_STATUS.md`
> - `specs/product/04-phase-2-delivery-scope.md`
> - `specs/adr/ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md`
> - `specs/architecture/03-api-contract.md` §2.14
> - `specs/architecture/02-core-domain-data-model.md`
> - `specs/architecture/01-domain-model-region.md`
> - `specs/security/01-community-privacy-rules.md`
> - `specs/testing/01-community-leaderboard-and-privacy-tests.md`
> - `specs/ai/03-deadline-execution-mode.md`
>
> The Phase 2 scheduling scope requires only **one simple persisted leaderboard** for P0. It explicitly places leaderboard refinements and SignalR in P1, and multi-layer community leaderboards in Deferred. Do not silently implement the long-term leaderboard design as P0.
>
> ## Baseline facts to verify
>
> Verify from source, migrations, tests, and accepted documents:
>
> - `XpTransaction` is an immutable persisted XP ledger row containing `UserId`, `SourceCompletionId`, `XpAmount`, `CommunityRegionIdAtAward`, and `CreatedAt`.
> - Verified completion XP already reconciles idempotently into that ledger.
> - `UserProfile` contains `DisplayName`, `TotalXp`, `Level`, and optional Home Community fields.
> - The existing `(UserId, CreatedAt)` XP index and current schema may be sufficient for a simple leaderboard.
> - No leaderboard repository, service, API controller, DTO, frontend type, validator, transport, hook, route, page, or navigation entry currently exists.
> - The current frontend is React/TanStack Query/Tailwind/daisyUI and must not store leaderboard server data in Zustand.
> - The long-term API contract documents People Leaderboards, but its full scopes, periods, `/me` context, privacy states, and refinements exceed the current P0 scheduling requirement.
> - Guests may access an appropriate public leaderboard.
> - No current UI supplies Home Community selection, so the plan must not make My Community a prerequisite for P0.
>
> Do not assume these facts if source evidence disagrees. Record corrections explicitly.
>
> ## Planning objective
>
> Produce the smallest useful, honest, persisted full-stack leaderboard that satisfies P0 without consuming P1 or Deferred scope.
>
> Use this as the recommended starting hypothesis, but evaluate it against the baseline:
>
> - one anonymous **New Zealand / All-time People Leaderboard**;
> - ranked from committed `XpTransaction` rows only;
> - Top 10 only;
> - rows contain the minimum public fields needed for a useful UI, likely rank, display name, total verified XP, and verified completion count;
> - deterministic tie handling must be explicitly designed and tested;
> - no My Community/Auckland switching, weekly/monthly switching, current-member context, movement, personal best, collective small-community mode, seasons, leagues, SignalR, or Communities Leaderboard;
> - no schema or dependency change unless the existing baseline proves insufficient;
> - a responsive public `/leaderboard` frontend route with TanStack Query ownership and strict response validation;
> - fixed-copy bounded loading, empty, error, and manual Retry states;
> - no per-row community, email, user ID, XP transaction ID, completion ID, or other private/internal data exposure.
>
> If a different minimal contract is safer, explain why and make it a human decision rather than silently expanding scope.
>
> ## Decisions to design
>
> Create a clear D1–D8 decision table. Every decision must include:
>
> - recommended option;
> - alternatives;
> - product/architecture impact;
> - `REQUIRES HUMAN APPROVAL`.
>
> At minimum cover:
>
> - D1: exact staged P0 scope and relationship to the long-term §2.14 contract;
> - D2: ranking source and eligibility;
> - D3: deterministic ordering and tie/rank semantics;
> - D4: exact public response shape and privacy exclusions;
> - D5: Top 10 versus pagination and whether `/me` is excluded;
> - D6: API readiness/error behavior and reconciliation implications;
> - D7: frontend route, navigation, responsive layout, cache, and state handling;
> - D8: delivery split, tests, evidence, accepted-document amendments, and review workflow.
>
> Do not request decisions during this planning run. Recommend the options and finish the plan; the human will decide after Codex review.
>
> ## Required analysis
>
> The plan must explicitly resolve:
>
> 1. Whether the existing `/api/v1/leaderboards/people` route should be used with a documented staged limitation or whether another contract shape is necessary.
> 2. Whether rankings aggregate `XpTransaction` directly or use `UserProfile.TotalXp`, including drift/readiness consequences.
> 3. Whether verified completion count is `COUNT(XpTransaction)` and how duplicate prevention makes that safe.
> 4. Stable deterministic ordering when XP and completion counts tie.
> 5. Competition ranking versus dense ranking versus ordinal row numbering.
> 6. Public display-name exposure and exact privacy exclusions.
> 7. Handling profiles with zero XP, missing profiles, deleted accounts, and duplicate display names.
> 8. Whether all-time NZ naturally includes unattributed XP without requiring Home Community.
> 9. Query performance and whether existing indexes suffice without schema change.
> 10. Cache keys, stale time, Retry behavior, and redemption invalidation.
> 11. Responsive and accessible table/list behavior on narrow screens.
> 12. Whether one implementation task remains within the 10–15 primary-file guideline. If not, define sequential 7A Backend and 7B Frontend contracts with separate evidence/review boundaries.
> 13. Exact accepted-spec amendments required only after human approval.
> 14. Stop conditions for any schema, dependency, authentication, privacy, or scope expansion.
>
> ## Test contract
>
> Specify a counter-directional test matrix covering at least:
>
> - only committed XP ledger rows count;
> - users with no XP are excluded;
> - XP descending primary order;
> - completion-count tie-break;
> - final deterministic tie-break without leaking user IDs;
> - chosen rank semantics under ties;
> - duplicate display names;
> - exact response keys and privacy exclusions;
> - anonymous access;
> - empty leaderboard;
> - Top 10 boundary with more than ten ranked users;
> - reconciliation/backfilled XP appears correctly;
> - strict frontend validator failures;
> - loading, empty, error, Retry, responsive structure, and accessibility;
> - TanStack Query cache behavior and no Zustand/Web Storage persistence;
> - redemption invalidation if approved;
> - full backend and frontend gates applicable to the final file map.
>
> Do not claim test results during planning.
>
> ## Deliverables
>
> Create exactly:
>
> 1. `specs/implementation/07-simple-persisted-leaderboard.md`
> 2. `specs/ai/prompts/53-slice-7-simple-persisted-leaderboard-first-plan.md`
>
> The plan’s first line must be exactly:
>
> `Status: Proposed — pending human decisions and independent Codex design review`
>
> Prompt 53 must contain this complete prompt verbatim plus truthful execution facts.
>
> The plan must include:
>
> - verified baseline with file-level evidence;
> - goals and explicit non-goals;
> - D1–D8;
> - proposed backend and frontend contracts;
> - architecture and dependency boundaries;
> - exact file map and primary-file count;
> - migration/schema conclusion;
> - detailed test matrix;
> - applicable verification gates;
> - risks and stop conditions;
> - Definition of Done;
> - required prompt/completion/review evidence;
> - human approval checklist;
> - explicit handoff contract for the implementation owner.
>
> Do not modify `PROJECT_STATUS.md` during planning. Do not modify production code, tests, accepted specifications, dependencies, configuration, or migrations.
>
> Do not stage, commit, push, merge, create a PR, or deploy.
>
> After creating the two planning documents, run whitespace checks, report the observed branch/HEAD/worktree state, summarize recommended D1–D8 and risks, and stop for one independent Codex design review.

## Execution record (observed facts only)

Planning executed 2026-07-26 by Kimi K3 in a single planning session. No
production code, tests, migrations, dependencies, configuration, accepted
specifications, or `PROJECT_STATUS.md` were modified. No Git write actions
beyond creating the required local planning branch were performed; nothing
was staged, committed, pushed, merged, or deployed.

Observed Git state:

- The session started on `main` at
  `ade8f1e3c0b474924aca44e97cb29a872f4513d1` ("Merge pull request #16 from
  Zephyr724/feat/slice-6b-passport-achievements-ui") with a clean working
  tree (`git status --porcelain` empty).
- `git merge-base --is-ancestor ade8f1e HEAD` confirmed the expected
  baseline ancestry.
- Branch `feat/slice-7-simple-leaderboard` was created from that HEAD with
  `git checkout -b`; planning documents were written on this branch.

Baseline verification performed (all planning-task baseline facts confirmed
against source; no corrections needed):

- Read the scheduling-authority documents: `AGENTS.md`, `PROJECT_STATUS.md`,
  `specs/product/04-phase-2-delivery-scope.md`,
  `specs/adr/ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md`,
  `specs/architecture/03-api-contract.md` (§2.14, §2.15, §3.1, §4),
  `specs/architecture/02-core-domain-data-model.md` (XP/profile sections),
  `specs/architecture/01-domain-model-region.md`,
  `specs/security/01-community-privacy-rules.md`,
  `specs/testing/01-community-leaderboard-and-privacy-tests.md`,
  `specs/ai/03-deadline-execution-mode.md`.
- Verified `XpTransaction` immutability and fields in
  `backend/src/Kiwimpact.Core/Entities/XpTransaction.cs` and its EF
  configuration (unique `SourceCompletionId`, `(UserId, CreatedAt)` and
  `(CommunityRegionIdAtAward, CreatedAt)` indexes, positive-amount check
  constraint).
- Verified idempotent reconciliation in
  `backend/src/Kiwimpact.Infrastructure/Reconciliation/XpReconciliationRunner.cs`
  and the live readiness gate in
  `backend/src/Kiwimpact.Core/Services/ProgressionService.cs` /
  `backend/src/Kiwimpact.Api/Controllers/ProgressionController.cs`
  (503 `progression-not-ready`).
- Verified `UserProfile` fields in
  `backend/src/Kiwimpact.Core/Entities/UserProfile.cs` (DisplayName not
  unique; `TotalXp` a checked transactional projection per
  `specs/architecture/02-core-domain-data-model.md`).
- Verified the partial unique index
  `UX_QuestCompletions_UserId_QuestId_Verified` in
  `QuestCompletionConfiguration.cs`.
- Case-insensitive searches for `leaderboard` across `backend/src` and
  `frontend/src` returned no matches: no leaderboard implementation exists.
- Verified frontend conventions by reading `router.tsx`, `AppShell.tsx`,
  `lib/api/achievements.ts`, `lib/validation/achievementDto.ts`,
  `hooks/useAchievements.ts`, and `hooks/useCompletion.ts` (hand-rolled
  strict validators, TanStack Query key factories, `retry: false`,
  redemption invalidation seam). No validation library (e.g. zod) is
  present.
- Verified test layout: `backend/tests/Kiwimpact.UnitTests`,
  `backend/tests/Kiwimpact.IntegrationTests` (Testcontainers),
  `frontend/tests/unit`, `frontend/tests/integration`.

Deliverables created:

1. `specs/implementation/07-simple-persisted-leaderboard.md` — first line
   exactly `Status: Proposed — pending human decisions and independent Codex
   design review`; contains the verified baseline, goals/non-goals, D1–D8
   with recommendations, the 14 required-analysis resolutions, proposed
   backend/frontend contracts, file map with primary-file counts (7A ≈ 11,
   7B ≈ 13), no-migration conclusion, test matrix T1–T27, verification
   gates, risks R1–R5, stop conditions, Definition of Done, evidence
   requirements, human approval checklist, and the implementation-owner
   handoff contract.
2. This prompt record.

No decisions were requested during the planning run. No test results are
claimed; the test matrix is a contract for the implementation phase. The
planning session stops here for one independent Codex design review, after
which the human decides D1–D8.

## Concentrated correction record after independent Codex design review

On 2026-07-26, Codex completed the independent design review recorded in
`specs/ai/reviews/47-slice-7-codex-independent-design-review.md` with verdict
`CHANGES REQUIRED` (0 Blocker, 4 Major, 2 Minor). The human then clarified
the role boundary: Codex is the implementation owner and Kimi K3 is the
independent implementation reviewer.

Codex performed one concentrated planning-only correction pass limited to
Review 47's original M1–M4 and m1–m2 findings:

- M1: made the staged query contract implementable by explicitly binding and
  forwarding nullable `scope`, `period`, `page`, and `pageSize` strings;
  specified omission/default, empty/unsupported, present pagination, and
  unrelated unknown-query behaviour.
- M2: corrected the Problem Details path, split Core service versus
  Infrastructure repository registration across the real DI files, added
  the existing OpenAPI operation test to the file map, and corrected 7A to
  13 primary files.
- M3: assigned SQL ordering solely to the repository, narrowed the service
  proof to rank assignment/order preservation, required long-valued SQL
  aggregation, and added an observable case-fold collision test for the
  internal `UserId` final tie-break.
- M4: specified the compact all-principal navigation contract using the
  existing Trophy/icon-label pattern and expanded the AppShell test contract.
- m1: replaced the unobservable jsdom 320 px no-overflow claim with exact
  fixed-table structural requirements and reserved runtime overflow claims
  for an observed browser run.
- m2: froze the sequential branch/merge handoff: 7A on the current branch,
  human-approved merge to `main`, then 7B from merged `main` on
  `feat/slice-7b-simple-leaderboard-frontend`; Codex owns truthful
  `PROJECT_STATUS.md` evidence updates during implementation.

The plan's required first-line status and all D1–D8
`REQUIRES HUMAN APPROVAL` markers remain unchanged. No production code,
tests, accepted specifications, dependencies, configuration, migrations, or
`PROJECT_STATUS.md` were modified in this correction pass. Nothing was
staged, committed, pushed, merged, deployed, or submitted as a pull request.
