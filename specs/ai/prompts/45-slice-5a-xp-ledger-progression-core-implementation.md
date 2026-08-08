# Prompt 45 — Slice 5A XP Ledger and Progression Core Implementation

- **Date:** 2026-07-25
- **Target agent:** Kimi K3
- **Role:** Sole implementation owner
- **Task type:** High-risk backend implementation
- **Design review:** Review 35, final verdict `APPROVE` after targeted closure
- **Human approval:** Granted after closure on 2026-07-25
- **Implementation authority:** Slice 5A only, within the approved boundaries

## Human approval record

After Codex closed the four original Major findings and updated Review 35 to
`APPROVE`, the human replied:

> Approved

This approves the corrected plan's recommended D1–D7 decisions and its §6
scope, §7 schema, §14 test matrix, and §17 workflow. It authorizes the
implementation work described below, including the approved additive schema,
API, and accepted-document changes.

It does **not** authorize staging, commit, push, merge, pull-request creation,
deployment, destructive data repair, dependency changes, authentication
architecture changes, or scope expansion.

The plan file retains its pre-approval `Proposed` heading as the reviewed
planning artifact. This Prompt records the later human approval. Do not
reinterpret or expand the approved decisions.

## Prompt to give Kimi K3

> # Slice 5A — XP Ledger and Progression Core Implementation
>
> ## Role
>
> Implement the approved Slice 5A server-authoritative XP ledger and
> level/rank progression core for Kiwimpact.
>
> You are the sole implementation owner for this Slice. The first-version plan
> was produced by Kimi K3, independently reviewed by Codex, corrected in one
> concentrated pass, and approved by Codex after targeted closure. The human
> then explicitly approved the corrected D1–D7 decision set and the plan's
> scope, schema, tests, and workflow.
>
> Implement the reviewed plan; do not redesign it.
>
> ## Repository and expected baseline
>
> ```text
> /Users/zephyr/dev/personal/msa2026
> ```
>
> Expected branch:
>
> ```text
> 05a-xp-ledger-and-progression-core
> ```
>
> Expected HEAD:
>
> ```text
> 4c73968
> ```
>
> or a descendant containing no unrelated implementation changes.
>
> Expected pre-existing working-tree files supplied by the human/Codex:
>
> ```text
> specs/implementation/05a-xp-ledger-and-progression-core.md
> specs/ai/reviews/35-slice-5a-codex-independent-design-review.md
> specs/ai/prompts/45-slice-5a-xp-ledger-progression-core-implementation.md
> ```
>
> Prompt 44 is already tracked at HEAD.
>
> Before changing implementation files, run:
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
> - the branch is not the expected branch;
> - HEAD is not the expected commit or a known descendant;
> - the reviewed plan or Review 35 is missing;
> - Review 35's targeted-closure section does not record final verdict
>   `APPROVE`;
> - unrelated working-tree changes are present.
>
> Preserve the supplied plan, review, and Prompt 45. Do not stage, commit, push,
> merge, reset, revert, deploy, or create/update a pull request.
>
> ## Required reading
>
> Read completely before implementation:
>
> ```text
> AGENTS.md
> specs/ai/prompts/45-slice-5a-xp-ledger-progression-core-implementation.md
> specs/implementation/05a-xp-ledger-and-progression-core.md
> specs/ai/reviews/35-slice-5a-codex-independent-design-review.md
> ```
>
> In Review 35, read both the original findings and the targeted closure.
>
> Then read the directly relevant accepted sources and current implementation
> identified by the plan, including:
>
> ```text
> specs/implementation/04b-simplified-quest-completion.md
> specs/architecture/02-core-domain-data-model.md
> specs/architecture/03-api-contract.md
> specs/data/01-community-identity-data-model.md
> specs/Kiwimpact_Final_Planning_Baseline_v1.0.md
> backend/src/Kiwimpact.Core/Entities/QuestCompletion.cs
> backend/src/Kiwimpact.Core/Entities/UserProfile.cs
> backend/src/Kiwimpact.Core/Entities/Quest.cs
> backend/src/Kiwimpact.Core/Enums/
> backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs
> backend/src/Kiwimpact.Infrastructure/Data/Configurations/
> backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs
> backend/src/Kiwimpact.Infrastructure/Migrations/
> backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs
> backend/src/Kiwimpact.Api/Program.cs
> backend/src/Kiwimpact.Api/Controllers/
> backend/src/Kiwimpact.Api/Contracts/
> backend/tests/Kiwimpact.UnitTests/
> backend/tests/Kiwimpact.IntegrationTests/
> ```
>
> Read relevant files and sections, not unrelated AI history.
>
> Source-of-truth order remains:
>
> 1. this current human-approved implementation instruction;
> 2. accepted ADRs/specifications as amended by the approved D7 work;
> 3. the corrected and reviewed Slice 5A plan;
> 4. current code, migrations, tests, and observed behavior;
> 5. historical prompts/reports.
>
> Stop and request human direction if implementation reveals a conflict that
> the approved plan and Review 35 do not resolve.
>
> ## Objective
>
> Deliver the complete backend Slice defined by the corrected plan:
>
> 1. add the immutable `XpTransactions` ledger and approved indexes,
>    constraints, and foreign keys;
> 2. add persisted `UserProfiles.TotalXp` and `Level`, with Rank Title derived;
> 3. implement exact server-owned XP/level/rank rules;
> 4. make every future Completion Code redemption create its Verified
>    completion, XP transaction, and progression update atomically;
> 5. reconcile every existing eligible Slice 4B completion exactly once;
> 6. keep impossible Verified rows inside the reward-pending/readiness boundary
>    without inventing timestamps;
> 7. add the approved self-only progression read endpoint with its live
>    readiness gate;
> 8. amend only the accepted documents approved by D7;
> 9. add the complete focused unit, PostgreSQL integration, migration,
>    concurrency, hosted-service, and API test coverage;
> 10. create truthful implementation evidence before requesting independent
>     implementation review.
>
> ## Approved decisions — implement exactly
>
> ### D1 — Persisted progression
>
> Add:
>
> - `UserProfiles.TotalXp`: PostgreSQL `bigint`, .NET `long`, not null,
>   default `0`, check `>= 0`;
> - `UserProfiles.Level`: PostgreSQL `integer`, .NET `int`, not null,
>   default `1`, check `BETWEEN 1 AND 99`.
>
> Keep the immutable ledger as the audit source of truth. Treat the two profile
> fields as a transactional projection. Derive Rank Title from Level; do not
> persist Rank Title. Add no new concurrency token.
>
> All XP addition must be checked:
>
> ```text
> checked(currentTotalXp + xpAmount)
> ```
>
> or an exactly equivalent explicit upper-bound guard. Never wrap or clamp
> `TotalXp`. Overflow is an invariant failure that rolls back the award.
>
> ### D2 — Award-effective timestamp
>
> For historical and future awards:
>
> ```text
> XpTransaction.CreatedAt = SourceCompletion.VerifiedAtUtc
> ```
>
> Never use reconciliation processing time. Never invent a timestamp for a
> Verified completion whose `VerifiedAtUtc` is null.
>
> ### D3 — Community attribution
>
> Always set:
>
> ```text
> XpTransaction.CommunityRegionIdAtAward =
>     SourceCompletion.CommunityRegionIdAtCompletion
> ```
>
> Reconciliation must never read current Home Community.
>
> For future redemption, remove the current unlocked Home Community projection:
> after locking the Quest row, lock/materialize the caller's `UserProfiles` row
> `FOR UPDATE`, and use `profile.HomeCommunityRegionId` from that locked row as
> the only completion snapshot source.
>
> ### D4 — Repeatable hosted reconciliation
>
> Implement the approved `BackgroundService`, options, fixed advisory-lock
> key, per-row transactions, batching, logging, and failure behavior exactly as
> §5 D4 and §10 specify.
>
> Keep these two query boundaries distinct:
>
> - reward-pending accounting: every `Status = Verified` completion without an
>   XP row, with **no** `VerifiedAtUtc` filter;
> - award-eligible processing: reward-pending plus
>   `VerifiedAtUtc IS NOT NULL`.
>
> Counters and `attemptedIds` are pass-scoped. Exclude attempted IDs from later
> batches so each row is attempted at most once per pass. Never reset
> `consecutiveFailures` at a batch boundary. Failed rows retry only on a later
> scheduled or explicitly invoked pass.
>
> Null-timestamp rows are unprocessable: never attempt or award them, count
> them, mark the pass incomplete, keep readiness closed, and retain the stop
> condition for any real observed row.
>
> Correctness must depend on unique `SourceCompletionId` and the transaction,
> never on the courtesy advisory lock. Use the fixed compiled `bigint` key and
> explicit `pg_advisory_unlock` in `finally` before disposing the dedicated
> connection.
>
> Do not add a public/admin reward-mutation endpoint. Do not backfill data
> inside the migration.
>
> ### D5 — Future redemption transaction and locks
>
> Extend the existing repository flow with:
>
> ```text
> Quest FOR UPDATE
> → all existing eligibility/code checks
> → UserProfile FOR UPDATE
> → completion + XP construction + checked progression update
> → one SaveChangesAsync()
> → one commit
> ```
>
> Use one DbContext, one connection, and one explicit transaction. Preserve the
> existing redeem request/response DTO and existing client-visible error
> classes.
>
> Translate `23505` only by the exact approved constraint names and contexts:
>
> - verified-completion uniqueness in redemption → existing AlreadyCompleted;
> - source-completion uniqueness in reconciliation → benign already-awarded;
> - source-completion uniqueness in redemption → invariant failure, not a
>   client-visible duplicate class;
> - unrelated constraints → never translate as those cases.
>
> ### D6 — Current-user progression endpoint
>
> Add:
>
> ```text
> GET /api/v1/users/me/progression
> ```
>
> Authenticated roles: Member, Organizer, Admin. Identity comes only from the
> authenticated session; there is no route/query/body user selector.
>
> Successful DTO has exactly:
>
> ```json
> {
>   "totalXp": 0,
>   "level": 1,
>   "rankTitle": "Novice"
> }
> ```
>
> Before reading the profile, evaluate the live reward-pending anti-join with no
> timestamp filter:
>
> - pending count non-zero → bounded `503 progression-not-ready`
>   ProblemDetails with no counts/internal details;
> - zero → read and return authoritative profile progression;
> - authenticated user without a profile → approved `404`;
> - anonymous → `401`.
>
> Do not cache readiness. It must reopen and re-close from current database
> state. Do not change the redemption response or add reward-reveal UI.
>
> ### D7 — Accepted-document alignment
>
> Make only the minimal amendments approved in plan §5 D7:
>
> ```text
> specs/architecture/02-core-domain-data-model.md
> specs/data/01-community-identity-data-model.md
> specs/architecture/03-api-contract.md
> ```
>
> Record:
>
> - `UserProfile.TotalXp` and `Level`;
> - completion-snapshot community attribution;
> - `CreatedAt = VerifiedAtUtc` award-effective semantics;
> - restored future redemption atomicity and the bounded historical
>   reconciliation exception;
> - row-lock serialized progression with no new concurrency token;
> - the approved progression endpoint and readiness error;
> - `Quest.XpAward` as retained but not a reward input.
>
> Do not rewrite the historical approved Slice 4B plan. Do not modify unrelated
> accepted decisions.
>
> ## Exact reward and progression rules
>
> Implement pure Core rules:
>
> - Easy → 50 XP;
> - Medium → 100 XP;
> - Hard → 150 XP;
> - any undefined difficulty → invariant/argument failure;
> - only Verified XP-producing completions receive an XP transaction;
> - SelfReported completions receive none;
> - cumulative threshold:
>
> ```text
> XP(Level L) = 5 × (L - 1) × (L + 7)
> ```
>
> - Level 1 begins at 0 XP;
> - Level is capped at 99;
> - `XP(99) = 51,940`;
> - XP continues accumulating after Level 99;
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
> `RewardDifficultySnapshot` currently has no database enum-value `CHECK`.
> Keep the approved domain guard and bounded reconciliation failure behavior.
> Do not add an unapproved enum constraint.
>
> ## Exact ledger schema
>
> Implement plan §7.1 exactly:
>
> - `Id uuid` primary key;
> - `UserId uuid` not null, FK `AspNetUsers.Id`, Restrict;
> - `QuestId uuid` not null, FK `Quests.Id`, Restrict;
> - `SourceCompletionId uuid` not null, FK `QuestCompletions.Id`, Restrict;
> - `XpAmount integer` not null, check `> 0`;
> - `CommunityRegionIdAtAward uuid` nullable, FK `Regions.Id`, Restrict;
> - `CreatedAt timestamptz` not null;
> - unique `SourceCompletionId`;
> - index `(UserId, CreatedAt)`;
> - index `(CommunityRegionIdAtAward, CreatedAt)`.
>
> Use the exact approved constraint/index names from the plan. Do not add
> `UpdatedAt`, `xmin`, an extra Quest index, or convenience columns.
>
> Generate one additive, schema-only EF migration. Use existing project tooling
> and migration conventions. Do not hand-edit old/shared migrations. Do not put
> reward data backfill in `Up()` or destructive history rewriting anywhere.
>
> ## Implementation structure
>
> Follow plan §15's file map and existing repository layering. Small naming
> adjustments are allowed only when required by current conventions; explain
> them in the completion report.
>
> Keep:
>
> - domain entities/rules in Core;
> - EF mappings, locking SQL, ledger persistence, and reconciliation in
>   Infrastructure;
> - HTTP contracts/controllers/mapping in API;
> - no frontend changes;
> - no new dependencies.
>
> Do not introduce a general-purpose abstraction or refactor unrelated code.
>
> ## Mandatory tests
>
> Implement the complete test matrix in plan §14, not merely representative
> happy paths.
>
> At minimum, include:
>
> ### Unit
>
> - exact difficulty-to-XP mapping and mutable-Quest-field independence;
> - formula thresholds, Level 99 cap, all rank boundaries;
> - undefined values and impossible states;
> - checked `long` overflow;
> - XP factory mapping, timestamp, community snapshot, and guards;
> - profile accumulation and recomputed Level.
>
> ### PostgreSQL schema and migration
>
> - clean-schema migration;
> - upgrade from merged 4B migration;
> - exact columns/nullability/checks/indexes/FKs/delete behavior;
> - existing profile defaults;
> - observed destructive `Down()` behavior on an isolated copied database;
> - no unexpected concurrency token.
>
> ### Persistence and atomicity
>
> - one redemption creates completion + XP + profile update;
> - failure rolls all three back;
> - unique `SourceCompletionId`;
> - snapshot inputs ignore mutable Quest/profile state after creation;
> - reconciliation of existing 4B rows;
> - repeat reconciliation is a strict no-op;
> - invalid/unprocessable rows never receive invented awards.
>
> ### Deterministic concurrency
>
> Use real PostgreSQL locks/barriers and `pg_stat_activity` observation where
> specified. `Task.WhenAll` alone is insufficient.
>
> Cover:
>
> - redemption versus Home Community update, proving the locked value is used;
> - same-user redemption across different Quests;
> - two reconcilers for the same completion;
> - two reconcilers for different completions of one user;
> - reconciliation versus redemption;
> - bounded no-deadlock execution.
>
> ### Reconciliation control and failure
>
> - hosted execution disabled in unrelated API fixtures;
> - directly invokable pass with no real sleeps;
> - multiple batches;
> - one permanent failure attempted once per pass;
> - explicit next pass retries once;
> - circuit-breaker/pass-completion accounting;
> - advisory lock unavailable while correctness still holds;
> - null `VerifiedAtUtc` counted unprocessable and readiness-blocking.
>
> ### Progression API
>
> - anonymous `401`;
> - exact Member/Organizer/Admin self behavior;
> - no client-selected identity;
> - reward pending → bounded exact `503 progression-not-ready` before profile
>   read;
> - unprocessable row also holds `503`;
> - fully reconciled → exact three-key `200`;
> - missing profile → `404`;
> - no email, user ID, Home Community, other-user progression, or unrelated
>   private fields.
>
> Preserve and rerun the existing 4B redemption/status, CSRF, authorization,
> rate-limit, and error-mapping regressions.
>
> ## Security, privacy, and observability
>
> - Server calculates all XP; clients never submit trusted reward values.
> - The progression route exposes only the caller's own three approved values.
> - No public ledger list or reward mutation exists.
> - Ledger rows are system-owned and immutable.
> - Reconciliation logs counts and completion IDs only at the approved levels;
>   never log email, display name, Home Community, private profile data, or raw
>   request content.
> - The readiness response exposes no pending counts or internal identifiers.
> - Preserve existing cookie auth, antiforgery, CORS, rate limiting, and error
>   handling architecture.
>
> ## Hard scope exclusions
>
> Do not add or implement:
>
> - any frontend change;
> - Passport UI or completion-history UI;
> - reward animation, toast, notification, or redemption reward reveal;
> - achievements;
> - streaks;
> - leaderboard queries or UI;
> - Community Challenge implementation;
> - Evidence Claim/Admin review;
> - SelfReported implementation;
> - SignalR;
> - Share Card;
> - Admin ledger/reconciliation endpoint;
> - public reward mutation;
> - automatic/destructive repair of impossible historical rows;
> - authentication architecture changes;
> - dependencies;
> - Docker/deployment changes;
> - changes to `Quest.XpAward` values or schema;
> - unrelated refactors.
>
> A real Verified completion with null `VerifiedAtUtc` is a stop condition:
> leave it unrewarded and gate-blocking, report it without private data, and
> request human direction. Do not invent or rewrite history.
>
> ## Implementation workflow
>
> 1. Inspect the exact baseline and current conventions.
> 2. Implement the smallest coherent vertical path in the plan.
> 3. Run focused tests while implementing.
> 4. Generate the migration with existing EF tooling.
> 5. Inspect the generated migration and model snapshot.
> 6. Run the complete plan §14 test matrix.
> 7. Run applicable full backend gates once after implementation is complete.
> 8. Review every changed/untracked file and run diff hygiene.
> 9. Create the completion report.
> 10. Stop and return results for independent read-only implementation review.
>
> Do not request review before Prompt 45 and the completion report exist.
>
> ## Required verification
>
> Run from `backend/`:
>
> ```bash
> dotnet build Kiwimpact.slnx
> dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
> dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
> ```
>
> Run from repository root:
>
> ```bash
> git diff --check HEAD
> git diff --stat HEAD
> git diff --name-status HEAD
> git status --short
> git ls-files --others --exclude-standard
> ```
>
> Because the plan, review, Prompt 45, and newly created implementation files
> can be untracked, also run `git diff --no-index --check /dev/null <file>` for
> each untracked text file, treating exit code `1` as “different but
> whitespace-clean.”
>
> Do not run frontend gates when there is no frontend change. If implementation
> unexpectedly requires a frontend change, stop instead of expanding scope.
>
> Never claim a gate passed unless you executed it and observed the result.
>
> ## Required completion evidence
>
> Create:
>
> ```text
> specs/implementation/reports/05a-xp-ledger-and-progression-core-completion.md
> ```
>
> It must record observed facts only:
>
> - implementation status and remaining review status;
> - approved scope delivered;
> - exact files changed/created;
> - migration name and observed clean/upgrade/down evidence;
> - XP/progression and transaction behavior implemented;
> - reconciliation/readiness behavior implemented;
> - exact test commands and observed counts/results;
> - build result;
> - diff hygiene;
> - known limitations and any unrun verification;
> - confirmation of no frontend/dependency/auth/deployment/out-of-scope change;
> - confirmation that no stage, commit, push, merge, PR, or deploy occurred;
> - independent implementation review status:
>   `PENDING — implementation evidence complete`.
>
> Do not fabricate test counts, timing, browser behavior, migration results, or
> guarantees that were not observed.
>
> ## Final response
>
> Report:
>
> - status;
> - implemented D1–D7 scope;
> - migration/schema summary;
> - reconciliation and lock-order summary;
> - M1–M4 closure preservation evidence;
> - tests and gates with observed results/counts;
> - files changed;
> - completion-report path;
> - limitations/remaining risks;
> - independent implementation review readiness;
> - confirmation that nothing was staged, committed, pushed, merged, deployed,
>   or expanded beyond scope.
>
> Stop after implementation and evidence creation. Do not self-approve the
> implementation and do not begin a correction pass before the independent
> reviewer reports findings.
