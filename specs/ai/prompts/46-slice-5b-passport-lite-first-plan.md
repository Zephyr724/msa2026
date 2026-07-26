# Prompt 46 — Slice 5B Passport-lite and Progression Frontend First Plan

- **Date:** 2026-07-25
- **Target agent:** Kimi K3
- **Task type:** Planning only (cross-layer Slice plan)
- **Expected reviewer:** Codex, independent design review
- **Implementation authority:** None
- **Human decision status:** All D1–D8 decisions in the produced plan remain
  unapproved until the human explicitly accepts the reviewed plan

## Prompt given to Kimi K3 (verbatim)

> # Prompt 46 — Slice 5B Passport-lite and Progression Frontend First Plan
>
> You are the planning owner for Kiwimpact Slice 5B.
>
> This is a planning-only task. Do not implement production code, migrations,
> tests, dependencies, configuration, or accepted-document amendments.
>
> ## Required baseline
>
> Before planning:
>
> 1. Read the repository-root `AGENTS.md`.
> 2. Confirm the current branch is `05b-passport-lite`.
> 3. Confirm the working tree is clean before creating planning evidence.
> 4. Confirm Slice 5A has been merged into the current branch.
> 5. Record the exact reviewed HEAD and the merged Slice 5A commit.
> 6. If Slice 5A is not merged, the branch is wrong, or the tree already contains
>    unrelated changes, stop and report the mismatch.
>
> Read these sources completely where directly relevant:
>
> - `specs/product/04-phase-2-delivery-scope.md`
> - `specs/product/01-product-requirements.md`
> - `specs/architecture/02-core-domain-data-model.md`
> - `specs/architecture/03-api-contract.md`
> - `specs/security/01-community-privacy-rules.md`
> - `specs/ux/01-ui-design-brief.md`
> - relevant Passport sections of
>   `specs/ux/02-figma-ai-mvp-ui-generation-spec.md`
> - `specs/implementation/05a-xp-ledger-and-progression-core.md`
> - `specs/implementation/reports/05a-xp-ledger-and-progression-core-completion.md`
> - `specs/ai/reviews/36-slice-5a-codex-independent-implementation-review.md`
> - the merged backend progression contracts/controller/service/repository
> - the current frontend router, authentication/session query, layout/navigation,
>   API transport, TanStack Query conventions, Zustand stores, responsive
>   components, and integration-test conventions
>
> Treat `specs/product/04-phase-2-delivery-scope.md` as scheduling context with
> its actual recorded status; do not silently promote it into an accepted
> architecture decision.
>
> ## Objective
>
> Produce the first implementation plan for:
>
> **Slice 5B — Passport-lite and Progression Frontend**
>
> The Slice should provide the smallest useful P0 personal-progression surface
> that consumes Slice 5A’s server-authoritative state and gives an authenticated
> user a responsive Personal Impact Passport.
>
> The intended direction is:
>
> - an authenticated `/passport` frontend route;
> - display name plus server-authoritative total XP, Level, and Rank Title;
> - meaningful current-level progress and next-level context, without trusting
>   client-submitted XP;
> - a bounded personal completion history based only on data the backend
>   currently supports;
> - clear Verified/XP semantics;
> - loading, empty, unauthorized, not-ready, and unexpected-error states;
> - responsive desktop/mobile presentation;
> - no fabricated impact metrics or unsupported reward claims.
>
> Do not assume this exact boundary is already approved. Surface all decisions
> for human approval.
>
> ## Current baseline to verify, not merely repeat
>
> Verify each statement against merged source and correct any mismatch:
>
> - Slice 5A persists `UserProfiles.TotalXp` and `Level`.
> - Rank Title is derived, not persisted.
> - `GET /api/v1/users/me/progression` returns exactly
>   `{ totalXp, level, rankTitle }`.
> - The progression endpoint returns bounded
>   `503 progression-not-ready` while any Verified completion lacks XP.
> - Completion-code redemption creates the Verified completion, XP transaction,
>   and progression update atomically.
> - The redemption response deliberately contains no XP/reward reveal.
> - `XpTransaction.CreatedAt` equals the source completion’s
>   `VerifiedAtUtc`.
> - Current implemented completion support is Completion Code Verified
>   completion; EvidenceClaim, Admin review, and SelfReported are not currently
>   implemented.
> - The accepted long-term API document lists Passport summary, completion
>   history, and community-participation endpoints, but those contracts are not
>   implemented and may exceed Passport-lite.
> - No Passport page, progression API client/hook, achievement system, streak,
>   leaderboard, share card, or reward animation currently exists in the
>   frontend.
> - The current auth/session response already provides the caller’s display name;
>   verify its exact DTO rather than duplicating identity state.
> - TanStack Query owns server state; Zustand must not store user identity,
>   progression, Passport history, or other server-authoritative data.
>
> For every baseline statement, cite concrete source files and relevant symbols
> or line locations in the plan.
>
> ## Mandatory decisions
>
> The plan must present a recommendation, alternatives considered, tradeoffs,
> and an explicit `REQUIRES HUMAN APPROVAL` marker for each decision.
>
> ### D1 — Exact Passport-lite boundary
>
> Decide whether 5B contains:
>
> - progression-only Passport summary;
> - summary plus paginated Verified completion history; or
> - another strictly bounded P0 composition.
>
> Recommend the smallest surface that is visibly useful and demonstrable.
>
> Do not include achievements, streaks, leaderboard, Share Card, community
> participation aggregation, evidence claims, or self-report implementation.
>
> ### D2 — Backend endpoint strategy
>
> Compare:
>
> - composing the existing auth/session and progression endpoints plus one new
>   completion-history endpoint;
> - implementing the accepted
>   `GET /api/v1/users/me/passport` summary endpoint;
> - implementing both summary and bounded completion history;
> - changing the existing exact three-key progression DTO.
>
> Preserve the existing progression DTO unless there is a compelling,
> human-approved reason to change it.
>
> Specify exact routes, query parameters, response DTOs, exact keys, pagination
> shape, ordering, and bounded error responses.
>
> ### D3 — Level-progress semantics
>
> Define how the UI obtains and displays:
>
> - total XP;
> - current Level and Rank Title;
> - XP floor for the current level;
> - XP threshold for the next level;
> - progress within the current level;
> - Level 99 behavior.
>
> Decide whether thresholds are returned by a Passport endpoint or calculated by
> a shared/duplicated deterministic client rule. Address drift risk and preserve
> server authority.
>
> Do not present “XP remaining” or a progress percentage unless its semantics are
> fully specified and tested.
>
> ### D4 — Completion-history semantics
>
> Define the exact included record set using currently implemented data.
>
> At minimum decide:
>
> - Verified-only behavior for the current Slice;
> - ordering and stable pagination;
> - one-record-per-Quest behavior;
> - quest title/category snapshot versus current Quest display fields;
> - completion date and verification label;
> - XP amount and its source;
> - behavior if a Verified completion is temporarily reward-pending;
> - behavior for deleted, cancelled, Draft, or later-edited Quests;
> - whether unsupported future statuses are excluded or represented.
>
> Do not invent SelfReported, EvidenceClaim, achievement, streak, carbon,
> community-impact, or leaderboard data.
>
> Identify any historical-integrity problem caused by reading mutable Quest
> fields and stop for human direction if resolving it requires a new snapshot or
> schema change.
>
> ### D5 — Privacy, authorization, and readiness
>
> Specify:
>
> - session-only current-user identity;
> - Member/Organizer/Admin self-access behavior;
> - anonymous behavior;
> - no route/query selector for another user;
> - excluded fields such as email, user ID, Home Community, evidence, code
>   material, claim text, review notes, and precise location;
> - how `progression-not-ready` affects the whole Passport or only progression
>   sections;
> - bounded 401/404/503/unexpected responses;
> - logging rules with no sensitive Passport content.
>
> ### D6 — Frontend architecture and state ownership
>
> Specify:
>
> - route and navigation integration;
> - API functions, exact runtime DTO validation, query keys, and hooks;
> - TanStack Query caching/invalidation;
> - interaction with the existing completion redemption query invalidations;
> - why progression/Passport data must not enter Zustand;
> - authenticated route handling;
> - component boundaries;
> - responsive desktop/mobile structure;
> - empty and retry states;
> - accessible headings, labels, progress semantics, focus, and reduced motion.
>
> No automatic reward animation, toast containing reward history, speculative
> optimistic XP, or client-side mutation of authoritative totals.
>
> ### D7 — Testing strategy
>
> Provide a concrete matrix covering:
>
> Backend, if backend work is recommended:
>
> - authorization and current-user isolation;
> - exact DTO keys;
> - pagination, stable ordering, and page boundaries;
> - Verified/XP linkage;
> - mutable Quest-field behavior;
> - readiness behavior;
> - missing profile and unexpected invariant behavior;
> - privacy exclusions;
> - PostgreSQL integration coverage.
>
> Frontend:
>
> - strict runtime contract validation;
> - loading, empty, populated, 401, 404, 503, and unexpected failures;
> - Level 1, ordinary level, threshold boundary, and Level 99;
> - responsive content hierarchy;
> - Verified/XP labels;
> - no unsupported achievement/streak/leaderboard/share-card claims;
> - query invalidation after successful redemption;
> - no progression or Passport server data in Zustand or Web Storage;
> - accessibility and reduced-motion behavior.
>
> Specify targeted commands and the applicable full gates from `AGENTS.md`.
> Do not claim browser or runtime results that have not been observed.
>
> ### D8 — Documentation and evidence
>
> List the minimal documents that implementation would need to amend after
> approval.
>
> The planning task must not edit accepted specifications.
>
> Implementation must later produce:
>
> - an implementation prompt record under `specs/ai/prompts/`;
> - a completion report under `specs/implementation/reports/`;
> - an independent read-only implementation review because this is an important
>   cross-layer Slice.
>
> ## Explicit exclusions
>
> Keep all of the following out of Slice 5B:
>
> - achievements and achievement unlocks;
> - streak calculation;
> - leaderboard;
> - community participation aggregation;
> - Community Challenge;
> - share card;
> - reward overlay/count-up/level-up animation;
> - SelfReported completion;
> - EvidenceClaim and Admin review;
> - SignalR;
> - theme-switching implementation;
> - Docker/deployment;
> - authentication architecture changes;
> - dependency additions;
> - unrelated refactors;
> - public or Admin access to another user’s Passport;
> - schema changes unless the plan identifies an unavoidable integrity problem
>   and stops for explicit human approval.
>
> Do not display placeholder cards implying these excluded systems exist.
> Sections for unavailable features should be omitted, not filled with fictional
> data.
>
> ## Required plan structure
>
> Create:
>
> `specs/implementation/05b-passport-lite.md`
>
> Its first line must be exactly:
>
> `Status: Proposed — pending human decisions and independent Codex design review`
>
> Include these sections:
>
> 1. Status and planning boundary
> 2. Executive summary
> 3. Verified merged baseline with file-level evidence
> 4. Goals
> 5. Non-goals
> 6. D1–D8 decision table
> 7. Proposed user journeys
> 8. Proposed API contracts and exact DTOs
> 9. Completion-history and historical-integrity semantics
> 10. Level-progress calculation and Level 99 behavior
> 11. Backend architecture and query design
> 12. Frontend architecture, state ownership, and query keys
> 13. Authorization, privacy, logging, and error behavior
> 14. Responsive UX and accessibility states
> 15. Detailed backend/frontend test matrix
> 16. Proposed file map
> 17. Documentation/evidence changes after approval
> 18. Risks, unknowns, alternatives, and explicit stop conditions
> 19. Human approval checklist
>
> Also create the exact planning-prompt record:
>
> `specs/ai/prompts/46-slice-5b-passport-lite-first-plan.md`
>
> Record this actual prompt verbatim. Do not add invented execution results.
>
> ## Validation and stopping rule
>
> This is planning only.
>
> Allowed validation:
>
> - branch/HEAD/status inspection;
> - read-only source and specification inspection;
> - `git diff --check`;
> - inventory of created planning files.
>
> Do not run implementation test suites unless needed to verify a disputed
> baseline fact. Do not claim any unobserved result.
>
> Create no branch, commit, push, PR, migration, production code, test code,
> dependency, or accepted-specification change.
>
> When the plan and prompt record are complete, stop and report:
>
> - files created;
> - verified baseline and any corrections;
> - recommended D1–D8 decisions;
> - every item requiring human approval;
> - conflicts or unknowns;
> - validation actually performed;
> - confirmation that no implementation or Git mutation was performed.
>
> Wait for independent Codex design review and human approval before any
> implementation begins.

## Execution record (observed facts only)

- Branch `05b-passport-lite`, clean working tree, reviewed HEAD
  `7eea4fe30665ac58b5f012ad8be99c297c269eec` (merge of PR #12,
  Slice 5A). Confirmed before planning evidence was created.
- All required sources were read; backend and frontend baseline facts were
  verified against merged source (see plan §3).
- Files created by this task: `specs/implementation/05b-passport-lite.md`
  and this prompt record. Nothing else.
- No production code, test, migration, dependency, configuration, or
  accepted-specification change; no Git mutation of any kind.
