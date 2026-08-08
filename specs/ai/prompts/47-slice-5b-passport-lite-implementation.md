# Prompt 47 — Slice 5B Passport-lite Implementation

- **Date:** 2026-07-26
- **Target agent:** Kimi K3
- **Role:** Sole implementation owner
- **Task type:** Important cross-layer backend/frontend implementation
- **Design review:** Review 37 plus Review 38 final confirmation
- **Final design verdict:** `APPROVE`
- **Human approval:** D1–D8 granted on 2026-07-26
- **Implementation authority:** Slice 5B only, within the approved plan

## Human approval record

After the independent design review, concentrated correction pass, targeted
closure check, and the final human-authorized B1 documentary correction, the
human selected the recommended option for every D1–D8 decision and said:

> Yes, proceed with implementation according to your recommendations

The human also explicitly accepted:

- the client-side TypeScript mirror of the server level thresholds; and
- the bounded historical-integrity limitation that completion history shows
  the Quest's current title, category, and status rather than
  completion-time snapshots.

This authorizes the implementation described below, including the single new
history endpoint, the authenticated `/passport` frontend, the additive API
contract amendment, tests, and required evidence.

It does **not** authorize staging, committing, pushing, merging, pull-request
creation/update, deployment, schema changes, dependency changes,
authentication-architecture changes, destructive operations, or scope
expansion.

## Prompt to give Kimi K3

> # Slice 5B — Passport-lite Implementation
>
> ## Role and boundary
>
> Implement the approved Slice 5B Passport-lite vertical slice for Kiwimpact.
>
> You are the sole implementation owner. The plan was written by Kimi K3,
> independently reviewed by Codex, corrected in one concentrated pass, checked
> in one targeted closure, narrowly corrected for the final B1 ordering issue
> with human authorization, mechanically confirmed by Codex, and explicitly
> approved by the human.
>
> Implement the reviewed plan. Do not redesign it and do not expand it.
>
> ## Repository and expected baseline
>
> Repository:
>
> ```text
> /Users/zephyr/dev/personal/msa2026
> ```
>
> Expected branch:
>
> ```text
> 05b-passport-lite
> ```
>
> Expected HEAD:
>
> ```text
> 7eea4fe30665ac58b5f012ad8be99c297c269eec
> ```
>
> or a descendant containing no unrelated implementation changes.
>
> Expected planning/review evidence supplied before implementation:
>
> ```text
> specs/implementation/05b-passport-lite.md
> specs/ai/prompts/46-slice-5b-passport-lite-first-plan.md
> specs/ai/prompts/47-slice-5b-passport-lite-implementation.md
> specs/ai/reviews/37-slice-5b-codex-independent-design-review.md
> specs/ai/reviews/38-slice-5b-codex-targeted-design-closure-review.md
> ```
>
> Before editing production files, run and inspect:
>
> ```bash
> git branch --show-current
> git status --short
> git log -5 --oneline --decorate
> git diff --check HEAD
> git ls-files --others --exclude-standard
> ```
>
> Stop and report if:
>
> - the branch is not `05b-passport-lite`;
> - HEAD is not the expected commit or a known descendant;
> - the approved plan, Prompt 47, Review 37, or Review 38 is missing;
> - Review 38 does not end with `FINAL DESIGN VERDICT: APPROVE`;
> - unrelated working-tree changes are present;
> - the merged implementation materially contradicts the plan's verified
>   baseline.
>
> Preserve all supplied evidence. Do not stage, commit, push, merge, reset,
> revert, deploy, or create/update a pull request.
>
> ## Required reading
>
> Read completely before implementation:
>
> ```text
> AGENTS.md
> specs/ai/prompts/47-slice-5b-passport-lite-implementation.md
> specs/implementation/05b-passport-lite.md
> specs/ai/reviews/37-slice-5b-codex-independent-design-review.md
> specs/ai/reviews/38-slice-5b-codex-targeted-design-closure-review.md
> ```
>
> Review 37 contains the original B1/M1–M4 and m1–m4 findings. Review 38
> contains the bounded closure result and final confirmation. Preserve every
> closed security and correctness condition during implementation.
>
> Then read the directly relevant accepted sources and implementation,
> including:
>
> ```text
> specs/architecture/03-api-contract.md
> specs/architecture/02-core-domain-data-model.md
> specs/ux/01-ui-design-brief.md
> specs/implementation/05a-xp-ledger-and-progression-core.md
> specs/implementation/reports/05a-xp-ledger-and-progression-core-completion.md
> backend/src/Kiwimpact.Api/Controllers/ProgressionController.cs
> backend/src/Kiwimpact.Api/Contracts/ProgressionContracts.cs
> backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs
> backend/src/Kiwimpact.Core/Entities/QuestCompletion.cs
> backend/src/Kiwimpact.Core/Entities/UserProfile.cs
> backend/src/Kiwimpact.Core/Enums/
> backend/src/Kiwimpact.Core/Progression/ProgressionRules.cs
> backend/src/Kiwimpact.Infrastructure/Repositories/XpLedgerRepository.cs
> backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs
> backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs
> backend/src/Kiwimpact.Api/Program.cs
> backend/tests/Kiwimpact.UnitTests/
> backend/tests/Kiwimpact.IntegrationTests/
> frontend/src/app/queryClient.ts
> frontend/src/app/router.tsx
> frontend/src/app/AppShell.tsx
> frontend/src/hooks/useAuth.ts
> frontend/src/hooks/useCompletion.ts
> frontend/src/hooks/useQuests.ts
> frontend/src/lib/api/apiFetch.ts
> frontend/src/lib/api/auth.ts
> frontend/src/lib/validation/completionDto.ts
> frontend/src/components/organizer/RequireManagementAccess.tsx
> frontend/src/pages/QuestListPage.tsx
> frontend/tests/
> ```
>
> Read relevant files fully enough to preserve their conventions. Do not
> traverse unrelated AI history.
>
> Source-of-truth order:
>
> 1. this human-approved implementation instruction;
> 2. accepted ADRs/specifications, including the approved additive D8 update;
> 3. the approved Slice 5B plan;
> 4. current code, migrations, tests, and observed behavior;
> 5. historical prompts and reports.
>
> Stop and request human direction if these sources reveal a conflict not
> resolved by the plan and reviews.
>
> ## Objective
>
> Deliver the approved medium-risk cross-layer Slice:
>
> 1. add one self-only paginated Passport completion-history endpoint;
> 2. preserve the existing three-key progression endpoint unchanged;
> 3. add a responsive authenticated `/passport` page with summary and history;
> 4. derive display-only level progress from the pinned client mirror;
> 5. enforce strict DTO validation and bounded error states;
> 6. guarantee private-query cleanup across logout, login/account replacement,
>    and private-endpoint 401;
> 7. invalidate Passport/progression after successful code redemption;
> 8. add the complete approved backend/frontend tests and observed narrow
>    viewport smoke check;
> 9. amend only the approved API contract subsection;
> 10. create truthful completion evidence and stop for independent
>     implementation review.
>
> ## Approved D1–D8 — implement exactly
>
> ### D1 — Surface boundary
>
> Build:
>
> - display name from the existing authenticated session query;
> - server-authoritative total XP, Level, and Rank Title from the existing
>   progression endpoint;
> - current-level progress;
> - paginated Verified + CompletionCode history.
>
> Do not add community aggregation, achievements, streaks, leaderboard,
> Share Card, carbon/impact metrics, reward animation, or placeholder cards
> for unavailable systems.
>
> ### D2 — Endpoint composition
>
> Reuse unchanged:
>
> ```text
> GET /api/v1/auth/me
> GET /api/v1/users/me/progression
> ```
>
> Add exactly:
>
> ```text
> GET /api/v1/users/me/passport/completions?page={page}&pageSize={pageSize}
> ```
>
> Do not add an aggregate Passport summary endpoint and do not change
> `MyProgressionDto`.
>
> ### D3 — Level progress
>
> Add one pure TypeScript mirror of `ProgressionRules`:
>
> ```text
> floor(1) = 0
> floor(L) = 5 × (L − 1) × (L + 7), for L = 2..99
> ```
>
> The backend remains authoritative for `totalXp`, `level`, and `rankTitle`.
> The mirror produces display aids only.
>
> For Level 1..98:
>
> ```text
> levelFloor = floor(level)
> nextFloor = floor(level + 1)
> currentLevelXp = totalXp - levelFloor
> levelSpanXp = nextFloor - levelFloor
> xpToNext = nextFloor - totalXp
> ```
>
> The visible fraction and ARIA values must both use
> `currentLevelXp / levelSpanXp`. Total XP is a separate statistic. At Level
> 99 show the maximum-level state and no next-level amount.
>
> Reject, rather than clamp, payloads with unsafe/fractional/negative numbers,
> level outside 1..99, or totalXp/level inconsistency. Pin thresholds and
> boundary cases in tests.
>
> ### D4 — History contract and query semantics
>
> Return only the authenticated caller's rows satisfying:
>
> ```text
> Status == Verified
> Method == CompletionCode
> ```
>
> Use the existing `PagedResponse<T>` envelope. Default `page = 1`,
> `pageSize = 12`; normalize/clamp exactly as the approved plan specifies,
> with maximum page size 50.
>
> Item JSON has exactly:
>
> ```text
> completionId
> questId
> questTitle
> questCategory
> questStatus
> status
> method
> completedAtUtc
> verifiedAtUtc
> xpAmount
> ```
>
> `questTitle`, `questCategory`, and `questStatus` come from the Quest's
> current row. Do not add snapshot fields or a migration.
>
> Join `XpTransaction` by `SourceCompletionId`. A normal non-null-timestamp
> reward-pending completion returns `xpAmount: null`; the UI displays
> `XP pending` and never estimates an award.
>
> Order by `VerifiedAtUtc DESC` with explicit nulls-last semantics, then
> `Id ASC`. Page-number offset behavior is deliberately bounded as described
> in §9; do not claim mutation-stable pagination.
>
> Before composing the page:
>
> 1. prove the caller's UserProfile exists, otherwise bounded 404;
> 2. detect any caller-owned Verified completion with null `VerifiedAtUtc`,
>    otherwise bounded `503 progression-not-ready`;
> 3. only then count/query/map the page.
>
> Never invent a timestamp or silently omit that invariant-failure row.
>
> ### D5 — Authorization, privacy, and errors
>
> Apply the same Member/Organizer/Admin authorization boundary as progression.
> Identity comes only from `ClaimTypes.NameIdentifier`. Every role sees only
> its own Passport; Admin and Organizer receive no elevated other-user access.
>
> Do not accept a user selector in route, query, or body.
>
> Responses must exclude email, user ID, Home Community, region/community
> labels, evidence, code material, claims, review notes, participation IDs,
> and precise location.
>
> Implement bounded:
>
> - 401 for anonymous/unparseable identity;
> - 404 for an authenticated principal without a profile;
> - 503 `progression-not-ready` for the caller's null verification timestamp;
> - generic unexpected failure behavior following existing conventions.
>
> Add no application logs containing Passport response content, XP values,
> display names, completion IDs, or Quest titles.
>
> ### D6 — Frontend, auth guard, and private cache
>
> Add `/passport` under `AppShell` behind a generic `RequireAuth` with exactly
> four states:
>
> - pending → skeleton;
> - confirmed anonymous → redirect to `/login`;
> - authenticated → render children;
> - session restoration network/5xx failure → bounded retry UI, never redirect.
>
> Keep session data in the existing auth query. Keep progression/history only
> in TanStack Query. Do not write them to Zustand, localStorage, or
> sessionStorage.
>
> Use the approved key families:
>
> ```text
> ['progression', 'me']
> ['passport']
> ['passport', 'completions', { page, pageSize }]
> ```
>
> Use TanStack Query v5 `placeholderData: keepPreviousData` for history page
> transitions and `retry: false` for the new private reads.
>
> Implement `clearPrivateServerState(queryClient)` with this strict order:
>
> 1. await cancellation of all `['progression']` and `['passport']` queries;
> 2. remove all matching queries;
> 3. return only after both steps are complete.
>
> Apply it in this strict principal-boundary order:
>
> - logout success: await private cleanup, then set auth to null;
> - login success/account replacement: await private cleanup, then install the
>   new session;
> - private progression/Passport 401: await private cleanup, then set auth to
>   null, then allow redirect or finish the handler.
>
> The 401 handler must not resolve/propagate or redirect before cleanup
> completes. There must be no auth-anonymous/old-private-cache intermediate
> state.
>
> Query cancellation must operate on the same active `QueryClient` used by the
> provider. Do not hard-code a separate client instance inside an API helper.
> Pass/close over the active client explicitly. Pass TanStack Query's
> `AbortSignal` through to `apiFetch` so cancellation also aborts the
> underlying fetch where supported.
>
> Keep cleanup idempotent when concurrent private requests both observe 401.
> Preserve the deferred-old-request no-repopulation guarantee.
>
> Extend successful redemption resync to invalidate progression and the
> Passport prefix. History begins/resets at page 1 and clamps to the final
> page if `totalPages` shrinks.
>
> Add the authenticated Passport nav link without wiring a new hamburger
> menu. At 320px and 375px the link must remain reachable and the navbar must
> not overflow using existing compact-label idioms. If that cannot be
> achieved within the approved boundary, stop and return with a minimal-menu
> proposal.
>
> ### D7 — Required test coverage and gates
>
> Implement the complete plan §15 matrix, including:
>
> - self-authorization and two-user negative isolation;
> - exact envelope/item keys;
> - empty/pagination/fixed-dataset ordering behavior;
> - XP linkage and ordinary `xpAmount: null`;
> - real-PostgreSQL raw-SQL null-`VerifiedAtUtc` 503;
> - method isolation;
> - mutable Quest field behavior;
> - missing-profile 404 precedence;
> - privacy exclusions and OpenAPI route;
> - strict numeric, exact-key, enum, timestamp, and envelope validators;
> - level floors, boundaries, unified progress units, invalid-state rejection,
>   and Level 99;
> - guard pending/anonymous/authenticated/transport-error states;
> - mid-page 401;
> - A → logout → B cache isolation;
> - deterministic cancel → remove → auth-change → redirect/install ordering;
> - deferred A request resolving after logout without repopulation;
> - summary/history independent 503/404/error behavior;
> - redemption invalidation, page reset, and page clamp;
> - no Zustand/Web Storage server-state persistence;
> - excluded-feature copy assertions;
> - accessibility;
> - class-level responsive assertions.
>
> Perform and truthfully record an observed browser smoke check at both 375px
> and 320px: navbar fits, Passport is reachable, and summary/history hierarchy
> remains usable. Do not claim this check unless actually observed.
>
> ### D8 — Accepted contract and evidence
>
> Amend only `specs/architecture/03-api-contract.md` §2.11, additively:
>
> - record the implemented Verified + CompletionCode subset;
> - record the exact item/envelope contract and nullable `xpAmount`;
> - record 401/404/503 behavior;
> - preserve, as unimplemented long-term direction, the accepted
>   one-record-per-Quest precedence for future completion types;
> - do not claim the other full Passport endpoints are implemented.
>
> Create:
>
> ```text
> specs/implementation/reports/05b-passport-lite-completion.md
> ```
>
> Prompt 47 already serves as the implementation prompt record. Preserve it.
>
> ## Expected file boundary
>
> Follow plan §16. The intended production changes are limited to:
>
> - new Passport contracts/controller/service/repository and registrations;
> - the new frontend types, validators, API functions, rules helper, hooks,
>   auth guard, page, and Passport components;
> - minimal router/navbar/completion-resync/auth-hook integration;
> - focused backend/frontend tests;
> - the additive API contract amendment;
> - the completion report.
>
> No migration or model snapshot may change. No package or lock file may
> change. No unrelated refactor is authorized.
>
> ## Explicit non-goals
>
> Do not implement:
>
> - schema changes or completion-time Quest snapshots;
> - an aggregate Passport summary endpoint;
> - changes to the progression DTO;
> - non-CompletionCode history;
> - EvidenceClaim, SelfReported, Pending, or Rejected flows;
> - community aggregation or another-user Passport access;
> - achievements, streaks, leaderboard, Share Card, carbon metrics, badges,
>   reward animation, or XP mutation UI;
> - a new mobile-menu architecture;
> - auth DTO hardening or authentication redesign;
> - dependencies, deployment, Docker, CI, or unrelated cleanup.
>
> ## Stop conditions
>
> Stop and ask the human before continuing if:
>
> - implementation requires any database schema or migration change;
> - level thresholds need to be supplied by the server;
> - a non-Verified/non-CompletionCode completion must be included;
> - an excluded product area becomes necessary;
> - 320px/375px navbar fit cannot be achieved within existing idioms;
> - the active QueryClient cannot support the approved cleanup order without
>   architecture expansion;
> - the current source contradicts a verified baseline assumption;
> - any dependency addition or authentication architecture change appears
>   necessary.
>
> Do not improvise around a stop condition.
>
> ## Implementation workflow
>
> 1. Verify the exact branch, HEAD, worktree, and evidence baseline.
> 2. Implement the backend contract/service/repository/controller vertical
>    path with focused PostgreSQL/API tests.
> 3. Implement frontend contracts/validators/rules/query/auth-cache boundary.
> 4. Implement the guard, Passport page/components, nav, and redemption
>    invalidation.
> 5. Run focused tests during implementation.
> 6. Amend only the approved API contract subsection.
> 7. Run the complete applicable backend and frontend gates once after the
>    implementation stabilizes.
> 8. Run and observe the required 375px/320px browser smoke checks.
> 9. Inspect every tracked and untracked file and run diff hygiene.
> 10. Create the truthful completion report.
> 11. Stop for one independent read-only implementation review.
>
> Do not request independent implementation review until Prompt 47 and the
> completion report exist.
>
> ## Required verification
>
> From `backend/`:
>
> ```bash
> dotnet build Kiwimpact.slnx
> dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
> dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
> ```
>
> From `frontend/`:
>
> ```bash
> npm run lint
> npm run type-check
> npm run test -- --run
> npm run build
> ```
>
> Also run appropriate focused tests while implementing.
>
> From repository root:
>
> ```bash
> git diff --check HEAD
> git diff --stat HEAD
> git diff --name-status HEAD
> git status --short
> git ls-files --others --exclude-standard
> ```
>
> Because evidence and implementation files may remain untracked, run
> `git diff --no-index --check /dev/null <file>` for each untracked text file.
> Exit 1 means the file differs from `/dev/null`; only reported whitespace
> findings are failures.
>
> Never claim a test, browser check, count, build, or guarantee unless you ran
> it and observed the result.
>
> ## Completion report requirements
>
> `specs/implementation/reports/05b-passport-lite-completion.md` must record
> observed facts only:
>
> - implementation status and pending independent-review status;
> - delivered D1–D8 scope;
> - exact backend/frontend/docs/evidence files changed or created;
> - endpoint and exact DTO behavior;
> - profile-404 and null-timestamp-503 behavior;
> - XP-pending and current-Quest-field semantics;
> - level mirror and validation behavior;
> - guard and B1 cache-lifecycle implementation;
> - deterministic account-switch and late-request test evidence;
> - responsive/accessibility behavior;
> - exact commands and observed test counts/results;
> - observed 375px and 320px browser smoke-check result, or truthful omission
>   and limitation if it could not be run;
> - build/lint/type-check/diff hygiene;
> - known limitations and unrun verification;
> - confirmation that no schema/dependency/auth/deployment/out-of-scope change
>   occurred;
> - confirmation that nothing was staged, committed, pushed, merged, deployed,
>   or added to a PR;
> - independent implementation review status:
>   `PENDING — implementation evidence complete`.
>
> ## Final response
>
> Report:
>
> - status;
> - implemented D1–D8 scope;
> - backend endpoint and frontend surface;
> - B1/M1–M4 preservation evidence;
> - focused and full gates with observed counts/results;
> - observed narrow-viewport check;
> - exact files changed;
> - completion-report path;
> - known limitations and remaining risks;
> - readiness for independent implementation review;
> - confirmation that nothing was staged, committed, pushed, merged, deployed,
>   or expanded beyond scope.
>
> Stop after implementation and evidence creation. Do not self-approve the
> implementation and do not begin a correction pass before the independent
> reviewer reports findings.
