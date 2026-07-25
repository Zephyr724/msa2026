# Prompt 44 — Slice 5A XP Ledger and Progression Core First-Version Plan

- **Date:** 2026-07-25
- **Target agent:** Kimi K3
- **Task type:** High-risk planning only
- **Expected reviewer:** Codex, independent design review
- **Implementation authority:** None
- **Human decision status:** New schema and architecture choices remain
  unapproved until the human explicitly accepts the reviewed plan

## Prompt to give Kimi K3

> # Slice 5A — XP Ledger and Progression Core First-Version Plan
>
> ## Role
>
> Produce the first implementation-plan version for Slice 5A, the
> server-authoritative XP ledger and level/rank progression core for Kiwimpact.
>
> This is a high-risk planning task involving reward idempotency, concurrency,
> an additive database schema, and reconciliation of existing Slice 4B
> completions.
>
> **Do not implement the Slice.**
>
> The plan will be independently reviewed by Codex and then presented to the
> human for explicit schema and architecture approval.
>
> ## Repository
>
> ```text
> /Users/zephyr/dev/personal/msa2026
> ```
>
> Expected starting point:
>
> - `main` includes merged Slice 4B-2;
> - merge commit `6901fff` or a descendant;
> - no unrelated working-tree changes except this supplied Prompt 44 and the
>   proposed plan file created by this task.
>
> Before editing, run:
>
> ```bash
> git branch --show-current
> git status --short
> git log -5 --oneline --decorate
> git diff --check HEAD
> ```
>
> Do not create, switch, delete, or rename a branch. Do not stage, commit, push,
> merge, reset, revert, deploy, or create a pull request.
>
> Stop and report if the repository baseline is unexpected or contains
> unrelated changes.
>
> ## Hard task boundary
>
> This task may create only:
>
> ```text
> specs/implementation/05a-xp-ledger-and-progression-core.md
> ```
>
> The new document must begin with:
>
> ```text
> Status: Proposed — pending human decisions and independent Codex design review
> ```
>
> Do not modify:
>
> - production code under `backend/` or `frontend/`;
> - migrations, model snapshots, configuration, or tests;
> - accepted ADRs, architecture, product, data, security, UX, or API
>   specifications;
> - Prompt 44;
> - historical prompts, reviews, or implementation reports;
> - dependencies or lockfiles.
>
> Do not claim that any proposed schema field, endpoint, background process, or
> transaction design is already accepted.
>
> ## Source-of-truth order
>
> Apply the repository's normal authority order:
>
> 1. Current human instruction.
> 2. Accepted ADRs.
> 3. Accepted specifications.
> 4. Current code, migrations, tests, and observed behavior.
> 5. This planning proposal.
>
> Separate intended behavior from currently implemented behavior throughout
> the plan.
>
> ## Required reading
>
> Read `AGENTS.md` completely, then read the directly relevant parts of:
>
> ```text
> specs/implementation/04b-simplified-quest-completion.md
> specs/implementation/reports/04b1-completion-code-backend-completion.md
> specs/implementation/reports/04b2-completion-code-frontend-completion.md
> specs/ai/reviews/33-slice-4b1-k3-independent-readiness-review.md
> specs/ai/reviews/34-slice-4b2-codex-independent-readiness-review.md
> specs/product/04-phase-2-delivery-scope.md
> specs/architecture/02-core-domain-data-model.md
> specs/architecture/03-api-contract.md
> specs/data/01-community-identity-data-model.md
> specs/security/01-community-privacy-rules.md
> specs/Kiwimpact_Final_Planning_Baseline_v1.0.md
> ```
>
> Inspect the actual current implementation for:
>
> ```text
> backend/src/Kiwimpact.Core/Entities/QuestCompletion.cs
> backend/src/Kiwimpact.Core/Entities/UserProfile.cs
> backend/src/Kiwimpact.Core/Entities/Quest.cs
> backend/src/Kiwimpact.Core/Enums/QuestDifficulty.cs
> backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs
> backend/src/Kiwimpact.Infrastructure/Data/Configurations/
> backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs
> backend/src/Kiwimpact.Infrastructure/Migrations/
> backend/src/Kiwimpact.Api/Program.cs
> backend/src/Kiwimpact.Api/Contracts/
> backend/src/Kiwimpact.Api/Controllers/
> backend/tests/Kiwimpact.UnitTests/
> backend/tests/Kiwimpact.IntegrationTests/
> ```
>
> Read only relevant files and sections. Do not recursively review unrelated AI
> history.
>
> ## Current verified baseline
>
> Treat these as implementation facts to confirm against source:
>
> - Slice 4B creates `Verified` CompletionCode `QuestCompletion` rows.
> - Each such completion records immutable
>   `RewardDifficultySnapshot` and
>   `CommunityRegionIdAtCompletion`.
> - `VerifiedAtUtc` is populated for the CompletionCode method.
> - The database currently has no `XpTransactions` table.
> - `UserProfile` currently has no persisted total-XP or level fields.
> - `Quest.XpAward` exists, but organizer-created Quests currently set it to
>   zero and demo values are not a stable historical reward input.
> - Slice 4B intentionally creates no XP transaction and shows no reward result.
> - The current redeem operation already uses an explicit PostgreSQL
>   transaction and materialized Quest-row `SELECT ... FOR UPDATE`.
> - `UX_QuestCompletions_UserId_QuestId_Verified` is the verified-completion
>   uniqueness boundary.
>
> Correct the plan if source inspection disproves any baseline item.
>
> ## Mandatory inherited Slice 4B obligations
>
> The first-version plan must preserve all approved Slice 4B §18 obligations:
>
> 1. Slice 5A is the next main product Slice.
> 2. Reward calculation uses only immutable completion snapshots.
> 3. Never reconstruct historical rewards from current mutable Quest
>    difficulty, current `Quest.XpAward`, current profile community, Quest
>    dates, or another live field.
> 4. Find every eligible `Verified` completion that lacks an XP transaction.
> 5. Create exactly one XP transaction per completion.
> 6. Use unique `SourceCompletionId` as the authoritative reward-idempotency
>    boundary.
> 7. Reconciliation must remain safely retryable.
> 8. Existing 4B completions must be processed before reward state is presented
>    as complete.
> 9. Profile XP and level/rank progression must stay transactionally consistent
>    with the XP ledger.
> 10. New verified completion reward creation must restore the accepted
>     completion + XP atomicity for future redemptions.
>
> ## Accepted reward rules to preserve
>
> The plan must use:
>
> - Easy → 50 XP;
> - Medium → 100 XP;
> - Hard → 150 XP;
> - only Verified, XP-producing completions receive XP;
> - SelfReported completions receive zero XP and no `XpTransaction`;
> - cumulative level threshold:
>
> ```text
> XP(Level L) = 5 × (L - 1) × (L + 7)
> ```
>
> - Level is capped at 99;
> - rank bands:
>   - 1–9 Novice
>   - 10–19 Scout
>   - 20–29 Adventurer
>   - 30–39 Ranger
>   - 40–49 Pathfinder
>   - 50–59 Guardian
>   - 60–69 Vanguard
>   - 70–79 Champion
>   - 80–89 Hero
>   - 90–98 Legend
>   - 99 Kiwimpact Legend
>
> The frontend never submits a trusted XP value.
>
> ## Decisions the plan must resolve explicitly
>
> The repository does not yet fully specify the following implementation
> choices. Do not hide them as assumptions. For each item:
>
> - describe the viable alternatives;
> - recommend one option;
> - explain correctness, concurrency, migration, operational, and P0-delivery
>   tradeoffs;
> - label whether explicit human approval is required.
>
> ### D1 — Persisted progression state
>
> Decide whether `UserProfile` gains persisted `TotalXp` and `Level`, or whether
> progression is derived from the immutable ledger on read.
>
> Address:
>
> - the 4B obligation to update profile/level/rank transactionally;
> - source-of-truth and repair behavior;
> - integer overflow boundaries;
> - Level 99 cap;
> - whether Rank Title is persisted or deterministically derived.
>
> Preferred direction to evaluate: persist `TotalXp` and `Level`, derive Rank
> Title from Level, and treat the ledger as the audit source of truth. This is
> not human-approved yet.
>
> ### D2 — Historical award timestamp
>
> Decide the `XpTransaction.CreatedAt` value for reconciled Slice 4B
> completions.
>
> Compare processing time with the completion's immutable verification time.
> Account for weekly/monthly/all-time leaderboard semantics and historical
> accuracy.
>
> Preferred direction to evaluate: use `VerifiedAtUtc` for existing and future
> verified awards, with no use of reconciliation processing time. This is not
> human-approved yet.
>
> ### D3 — Community attribution
>
> Decide and state the exact mapping for
> `XpTransaction.CommunityRegionIdAtAward`.
>
> Preferred direction required by the staged 4B design: copy
> `QuestCompletion.CommunityRegionIdAtCompletion`; never read the user's current
> Home Community during reconciliation.
>
> Identify any conflict with older wording that says “community at award time”
> and propose the minimal accepted-document amendment needed after human
> approval.
>
> ### D4 — Existing-completion reconciliation mechanism
>
> Compare at least:
>
> - data backfill inside the additive migration;
> - an application reconciliation service run at startup;
> - a repeatable background/hosted service;
> - an explicit operational/admin-triggered process.
>
> Recommend one bounded P0 design. It must:
>
> - find all eligible Verified completions without a ledger row;
> - be retryable after process or database failure;
> - be safe if two application instances overlap;
> - avoid duplicate ledger rows and double profile increments;
> - use bounded batches where appropriate;
> - avoid a public reward-mutation endpoint;
> - log counts and identifiers safely without private profile data;
> - have deterministic tests without real sleeps.
>
> ### D5 — Future redemption atomicity and lock order
>
> Extend the existing redemption transaction design so one transaction and one
> DbContext perform:
>
> - eligibility and code verification;
> - Verified completion creation;
> - XP transaction creation;
> - user progression update;
> - one `SaveChangesAsync()` boundary;
> - commit or complete rollback.
>
> Define the exact PostgreSQL lock order and prove it cannot introduce a
> cross-Quest same-user deadlock. Address interaction with:
>
> - the existing Quest-row lock;
> - any UserProfile-row lock;
> - `SourceCompletionId` uniqueness;
> - the verified-completion partial unique index;
> - reconciliation running concurrently with redemption;
> - unrelated unique violations and deterministic error translation.
>
> ### D6 — Read API boundary
>
> Decide whether 5A is backend reward-write core only or also introduces the
> smallest authenticated read surface for XP/level/rank.
>
> Compare:
>
> - no new read endpoint until Passport-lite;
> - extending the accepted but not-yet-implemented `GET /api/v1/users/me`;
> - an additive current-user progression endpoint.
>
> Preferred scope to evaluate: keep 5A backend-focused and defer Passport UI,
> but expose enough authenticated read behavior to test and demonstrate
> server-authoritative progression without leaking another user's data. Any new
> endpoint or DTO requires explicit human approval.
>
> ### D7 — Accepted document alignment
>
> Identify the smallest amendments that would be needed after human approval,
> without editing them in this planning task.
>
> In particular reconcile:
>
> - the older accepted “completion + XP in one transaction” rule;
> - the approved Slice 4B staged exception;
> - the absence of XP/level fields in the current UserProfile model;
> - current `Quest.XpAward` versus immutable difficulty snapshots;
> - “community at award” wording versus the 4B completion snapshot;
> - any API route/DTO needed for a 5A read boundary.
>
> ## Required proposed plan structure
>
> Create
> `specs/implementation/05a-xp-ledger-and-progression-core.md` with these
> sections:
>
> 1. Status, date, risk, planning owner, intended implementation owner.
> 2. Goal and smallest useful vertical Slice.
> 3. Current implementation baseline, with file-level evidence.
> 4. Accepted inherited constraints.
> 5. Decision table D1–D7: alternatives, recommendation, approval status.
> 6. Proposed in-scope and out-of-scope boundaries.
> 7. Proposed data model and one additive migration.
> 8. XP, Level, Rank Title calculation rules and overflow/cap behavior.
> 9. Future redemption transaction and exact lock order.
> 10. Historical reconciliation algorithm, batching, retry, overlap, and
>     failure recovery.
> 11. Proposed current-user read contract, or explicit justification for no
>     read endpoint.
> 12. Authorization, privacy, logging, and error behavior.
> 13. Migration upgrade/rollback and deployment sequencing.
> 14. Unit, PostgreSQL integration, concurrency, migration, and API test
>     matrix.
> 15. Implementation file map.
> 16. Verification gates.
> 17. Evidence and independent-review workflow.
> 18. Risks, known limitations, and explicit stop conditions.
> 19. Human approval checklist.
>
> Keep the plan concrete enough that a later implementation agent does not need
> to invent schema, lock ordering, reconciliation semantics, timestamps, API
> shapes, or error translations.
>
> ## Proposed data-model detail required
>
> At minimum, show the exact proposed `XpTransaction` columns and constraints
> from the accepted model:
>
> - `Id`;
> - `UserId`;
> - `QuestId`;
> - unique `SourceCompletionId`;
> - positive `XpAmount`;
> - nullable `CommunityRegionIdAtAward`;
> - `CreatedAt`;
> - FK delete behavior;
> - indexes for source completion, user/time, and community/time.
>
> If proposing UserProfile progression columns, specify exact types, defaults,
> checks, update rules, and whether they are concurrency tokens. Do not add a
> column merely for convenience.
>
> Specify whether `Quest.XpAward` remains untouched, is deprecated only in
> documentation, or requires a later cleanup. Do not remove or reinterpret it
> without explicit approval.
>
> ## Required test plan
>
> Include focused unit tests for:
>
> - Easy/Medium/Hard snapshot mapping;
> - proof that mutable Quest fields are ignored;
> - cumulative level formula boundaries;
> - exact Level 99 cap;
> - all rank-title boundaries;
> - invalid enum/impossible state handling;
> - overflow-safe total-XP behavior.
>
> Include real PostgreSQL integration tests for:
>
> - migration from the current merged 4B schema and from clean schema;
> - exact columns, checks, unique constraints, indexes, and FK delete behavior;
> - one Verified completion creates exactly one XP transaction;
> - `SourceCompletionId` prevents duplicates;
> - future redemption creates completion + XP + progression atomically;
> - injected failure rolls back all three writes;
> - existing 4B completions are reconciled;
> - repeated reconciliation is a no-op;
> - overlapping reconciliation workers cannot double-award or double-increment;
> - reconciliation concurrent with redemption remains correct;
> - multiple simultaneous rewards for one user produce the exact total and
>   level;
> - reward uses `RewardDifficultySnapshot`, not current Quest difficulty or
>   `Quest.XpAward`;
> - community attribution uses the immutable completion snapshot;
> - later Quest/profile/community mutation does not alter historical ledger
>   rows;
> - SelfReported/non-Verified rows receive no reward;
> - migration/down behavior is observed and documented.
>
> If a read API is proposed, include:
>
> - anonymous `401`;
> - explicit Member, Organizer, and Admin behavior;
> - session identity only, with no client-selected user ID;
> - exact-key DTO privacy assertions;
> - XP/level/rank values derived from authoritative server state;
> - no email, Home Community ID, other-user progression, or unrelated private
>   fields unless already accepted for that route.
>
> Concurrency tests must prove genuine overlap using deterministic locks or
> barriers. Do not rely only on `Task.WhenAll`.
>
> ## Scope exclusions
>
> Keep these out of 5A unless the human later approves expansion:
>
> - Passport UI or completion-history UI;
> - achievements;
> - streaks;
> - leaderboard implementation;
> - SignalR;
> - Share Card;
> - Evidence Claim and Admin review;
> - SelfReported implementation;
> - notification/toast reward reveals;
> - frontend reward animation;
> - theme work;
> - Docker/deployment implementation;
> - new dependencies;
> - changing authentication architecture;
> - deleting or rewriting existing 4B completion history.
>
> Do not claim that reward UX is complete in Slice 5A.
>
> ## Verification for this planning task
>
> Run:
>
> ```bash
> git diff --check HEAD
> git diff --stat HEAD
> git diff --name-status HEAD
> git status --short
> git ls-files --others --exclude-standard
> ```
>
> Confirm that this planning task changed only the proposed 5A plan file, in
> addition to the human-supplied Prompt 44 already present.
>
> Do not run implementation test suites unless needed to verify a current
> baseline claim. Do not claim runtime or test behavior that was not observed.
>
> ## Final response
>
> Return:
>
> - status;
> - created file;
> - recommended decisions D1–D7;
> - human approvals still required;
> - important conflicts or unknowns;
> - verification performed;
> - confirmation that no production code, migration, dependency, Git history,
>   or accepted specification was changed.
>
> Stop after producing the first-version proposed plan. Do not implement Slice
> 5A.
