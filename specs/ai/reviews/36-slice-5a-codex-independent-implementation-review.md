# Slice 5A Codex Independent Implementation Review

- **Date:** 2026-07-25
- **Slice:** 5A — XP Ledger and Progression Core
- **Reviewer:** Codex (independent from the Kimi K3 implementation session)
- **Mode:** Read-only implementation review; review evidence only was added
- **Branch:** `05a-xp-ledger-and-progression-core`
- **Reviewed HEAD:** `0f53817`
- **Initial verdict:** `TARGETED FIX REQUIRED`
- **Final verdict:** `APPROVE` after targeted closure
- **Blockers:** 0
- **Initial Majors:** 3
- **Remaining Majors:** 0
- **Minors:** 3

## Review instruction and scope

The human approved the corrected Slice 5A plan and asked Kimi K3 to implement
it, then returned the completed working tree to Codex for the required
independent implementation review.

This review:

- read `AGENTS.md`, Prompt 45, the approved/corrected plan, Review 35, and the
  completion report;
- reviewed every modified and untracked implementation path in the supplied
  working tree;
- traced future redemption, historical reconciliation, progression reads,
  readiness gating, lock order, PostgreSQL error translation, and rollback
  behavior;
- inspected the migration, migration designer, current EF model snapshot,
  configuration, domain invariants, dependency changes, accepted-document
  amendments, and the complete new test inventory;
- independently ran the required backend build, unit-test, integration-test,
  and diff-hygiene gates;
- did not modify production code, tests, migrations, dependencies,
  configuration, accepted specifications, implementation evidence, Git
  history, staging, or remotes.

## Findings

### Blockers

None.

### Majors

#### M1 — A new dependency was added without the required human approval

- **Location:**
  `backend/src/Kiwimpact.Infrastructure/Kiwimpact.Infrastructure.csproj:10`;
  Prompt 45 at
  `specs/ai/prompts/45-slice-5a-xp-ledger-progression-core-implementation.md:407`
- **Requirement:** Prompt 45 explicitly says `no new dependencies`.
  `AGENTS.md` separately requires explicit human approval before adding a
  dependency and instructs the implementation owner to stop when the approved
  plan does not resolve a conflict.
- **Issue:** the implementation directly adds
  `Microsoft.Extensions.Hosting.Abstractions` 10.0.10. The completion report
  discloses this but retrospectively classifies it as a platform abstraction;
  disclosure after implementation is not the approval required by the prompt
  and repository rules.
- **Impact:** this violates the approved scope and dependency-control boundary,
  even though the package is Microsoft-authored and version-aligned with the
  project.
- **Required correction:** either remove the new package by placing the thin
  hosting wrapper in a project that already has the hosting framework while
  keeping the reconciliation runner appropriately layered, or stop and obtain
  explicit human approval for this exact package/version. Update the completion
  report to record the actual decision and result.

#### M2 — The Quest foreign key exists only in hand-written migration SQL, not in the canonical EF model

- **Location:**
  `backend/src/Kiwimpact.Infrastructure/Data/Configurations/XpTransactionConfiguration.cs:40-47`;
  `backend/src/Kiwimpact.Infrastructure/Migrations/20260725133129_AddXpLedgerAndProgression.cs:56-64`;
  `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs:446-486,801-819`
- **Requirement:** the approved schema requires
  `XpTransactions.QuestId` to be a restrictive foreign key to `Quests.Id`, and
  the additive EF migration and model snapshot must truthfully represent that
  schema.
- **Issue:** `QuestId` is deliberately configured as a scalar. The migration
  was then hand-edited to create `FK_XpTransactions_Quests_QuestId`, while the
  migration designer and current snapshot contain no corresponding EF
  relationship. The deployed database and EF's model-derived schema are
  therefore different.
- **Impact:** future migrations and other model-derived database creation or
  inspection paths do not know the Quest relationship and can silently
  preserve or recreate the wrong canonical model. The completion report's
  stated reason—avoiding EF's conventional QuestId index—does not require
  removing the relationship itself. EF documents both explicit relationship
  mapping and supported suppression of `ForeignKeyIndexConvention`.
- **Required correction:** model the Quest relationship in EF and regenerate
  the still-uncommitted migration/designer/snapshot so all three agree. Resolve
  the index tradeoff explicitly: either retain the approved three-secondary-
  index shape through supported model configuration with proof that no
  unrelated indexes changed, or obtain human approval for an additional
  QuestId index. Keep the restrictive database FK and add an assertion that the
  runtime EF model contains it.
- **Reference:** [EF Core relationship mapping](https://learn.microsoft.com/en-us/ef/core/modeling/relationships)
  and [foreign-key index convention control](https://learn.microsoft.com/en-us/ef/core/modeling/relationships/conventions#how-to-stop-ef-creating-indexes-for-foreign-keys).

#### M3 — Reconciliation warning/error logs exceed the approved privacy boundary

- **Location:**
  `backend/src/Kiwimpact.Infrastructure/Reconciliation/XpReconciliationHostedService.cs:70-74,176-184,260-265`;
  approved plan at
  `specs/implementation/05a-xp-ledger-and-progression-core.md:314-322,764-766,812-816`
- **Requirement:** the approved logging contract permits pass-level counts and
  exception types, with completion IDs only at `Debug`; it excludes XP values
  and profile/community/user data.
- **Issue:** a row failure logs the completion ID at `Warning` and attaches the
  full exception object. Pass-level and advisory-unlock failures likewise
  attach full exceptions. Provider exceptions can carry SQL, constraint,
  connection, or database-detail fields outside the bounded contract. No test
  captures log events to prove that higher-severity logs contain only the
  approved fields.
- **Impact:** an operational failure can disclose identifiers or uncontrolled
  exception detail in routinely retained warning/error logs, contrary to the
  approved observability/privacy design.
- **Required correction:** make Information/Warning/Error events bounded:
  counts and exception type only, without the exception object or completion
  ID. If row correlation is still required, emit the completion ID only in a
  separate Debug event. Add a capturing-logger test that proves failure events
  above Debug contain neither completion ID nor exception object/data, nor XP,
  user, profile, or community values.

### Minors

#### m1 — Reconciliation configuration is accepted without validation

- **Location:** `backend/src/Kiwimpact.Api/Program.cs:50-51`;
  `backend/src/Kiwimpact.Infrastructure/Reconciliation/XpReconciliationOptions.cs:3-11`
- **Issue:** options are bound without validation or `ValidateOnStart()`.
  `BatchSize <= 0` can make a pass scan nothing and report complete despite
  pending rows; a zero idle interval can hot-loop; invalid delays can fail the
  hosted service; and a nonpositive failure threshold defeats the intended
  circuit-breaker semantics.
- **Correction direction:** add bounded startup validation for batch size,
  delays/interval, and the failure threshold, with focused valid/invalid
  configuration tests.

#### m2 — An `AlreadyAwarded` outcome does not break the consecutive-failure streak

- **Location:**
  `backend/src/Kiwimpact.Infrastructure/Reconciliation/XpReconciliationHostedService.cs:166-185`
- **Issue:** only `Awarded` resets `consecutiveFailures`.
  `AlreadyAwarded` is a benign, successful idempotency outcome, but it leaves
  any preceding failure count intact. A failure, benign overlap loser, then
  another failure can therefore trip a “consecutive” failure threshold even
  though the failures were not consecutive.
- **Correction direction:** reset the streak on every non-failure outcome and
  add a deterministic failure → already-awarded → failure test.

#### m3 — The profile aggregate accepts a level inconsistent with its new XP total

- **Location:** `backend/src/Kiwimpact.Core/Entities/UserProfile.cs:52-77`
- **Issue:** `ApplyXpAward` documents that `newLevel` must be computed from the
  new total, but validates only that it is between 1 and 99. Any caller can
  persist a valid-range but incorrect level, violating D1's invariant that
  Level is always recomputed from TotalXp.
- **Correction direction:** compute the level inside the aggregate from the
  checked new total, or reject a supplied value unless it exactly equals
  `ProgressionRules.ComputeLevel(newTotal)`. Add a mismatched-but-in-range
  negative test.

## Independently verified strengths

- The ledger schema's columns, positive-XP check, unique completion boundary,
  composite query indexes, and the other three restrictive relationships match
  the approved direction.
- The level thresholds, Level 99 cap, rank-title derivation, checked XP
  arithmetic, and rollback-on-overflow behavior are implemented and tested.
- Future redemption uses immutable Quest difficulty and the locked profile's
  Home Community; completion, XP row, and profile projection share one
  transaction and one `SaveChangesAsync()`.
- Reconciliation derives reward data only from immutable completion snapshots,
  attempts each candidate at most once per pass, accounts for impossible null
  verification timestamps, and keeps the live global readiness gate closed
  while any Verified completion lacks XP.
- Unique-conflict handling is constraint-name-specific. Overlapping workers and
  redemption/reconciliation combinations have real PostgreSQL coverage.
- The current-user endpoint is self-only and returns the exact three-key DTO;
  pending global reward state returns bounded `503 progression-not-ready`.
- Accepted D7 document amendments are narrow and consistent with the approved
  corrected plan.
- No frontend, authentication-architecture, deployment, reward-response, XP
  leaderboard/achievement, or other out-of-scope product work was introduced.

## Verification results

Run from `backend/` unless stated otherwise:

| Gate | Result | Observed evidence |
| --- | --- | --- |
| `dotnet build Kiwimpact.slnx` | PASS | Exit 0; 0 warnings, 0 errors |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | PASS | 178 passed, 0 failed |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | PASS | 186 passed, 0 failed |
| Tracked diff hygiene | PASS | `git diff --check HEAD` produced no output |
| Untracked diff hygiene | PASS | every untracked path passed `git diff --no-index --check` |
| Scope inventory | PASS | 15 tracked modified paths and 23 untracked paths before this review record |
| EF pending-model check | NOT COMPLETED | `dotnet ef migrations has-pending-model-changes` did not return after more than 90 seconds and was interrupted; no result is claimed |

## Completion-report accuracy

The observed build/test counts, file inventory, main transaction behavior,
readiness gate, concurrency coverage, and broad scope exclusions are accurate.
The two deviations disclosed by the report are real, but they are not
acceptable merely because they were documented:

- the hosting package is a new dependency requiring prior explicit approval
  (M1);
- the manually added Quest FK leaves the EF model, migration designer, and
  snapshot incomplete (M2).

The report must also narrow its safe-logging claim to match observed code and
record the M3 correction. Its statement that there was no dependency change
“beyond the documented platform abstraction” must be replaced by the actual
approved resolution.

## Verdict and bounded next step

`TARGETED FIX REQUIRED`.

There are no Blockers. M1–M3 must be closed before commit. Per `AGENTS.md`, the
Kimi K3 implementation owner may perform one concentrated correction pass,
covering these three Majors and the three Minors, then update the completion
report with observed rerun results. Codex should perform one targeted closure
check limited to original M1–M3; it must not become a second full review.

No stage, commit, push, merge, PR, or deployment is approved by this review.

## Targeted closure check — 2026-07-25

- **Reviewer:** Codex, same independent implementation-review session
- **Mode:** Targeted read-only closure check
- **Scope:** Original M1–M3 only; this is not a second full review
- **Result:** All three original Majors CLOSED
- **Final verdict:** `APPROVE`

### M1 — CLOSED

- `backend/src/Kiwimpact.Infrastructure/Kiwimpact.Infrastructure.csproj` is
  byte-identical to reviewed HEAD `0f53817`; the direct
  `Microsoft.Extensions.Hosting.Abstractions` package addition is gone.
- Reconciliation execution remains in Infrastructure as
  `XpReconciliationRunner`; the API project contains only the thin
  `BackgroundService` lifecycle wrapper and registers it from `Program.cs`.
- No project or dependency file differs from HEAD. This is the
  human-selected, no-new-dependency correction route.

### M2 — CLOSED

- `XpTransactionConfiguration` now maps `QuestId` as a required
  `Quest` relationship with `DeleteBehavior.Restrict`.
- The regenerated migration
  `20260725144430_AddXpLedgerAndProgression`, its designer, and
  `KiwimpactDbContextModelSnapshot` all contain
  `FK_XpTransactions_Quests_QuestId`; the superseded hand-edited migration is
  absent.
- The supported `ForeignKeyIndexConvention` suppression is explicit. The two
  existing Quest FK indexes and four Identity FK indexes are declared with
  their existing names, while `XpTransactions` retains exactly the approved
  three secondary indexes and no `QuestId` index.
- The migration `Up()` contains only the approved two columns, two checks,
  XP table, relationships, and three indexes; it has no unrelated drop,
  rename, or alter operation.
- The runtime-model integration test asserts the named restrictive Quest
  relationship and absence of a QuestId index.
- Independent `dotnet ef migrations has-pending-model-changes` completed with
  `No changes have been made to the model since the last migration.`

### M3 — CLOSED

- `XpReconciliationRunner` logs completion IDs only at `Debug`.
  Information/Warning events contain bounded counts or exception type names
  and never attach the exception object.
- The API hosted wrapper and advisory-unlock failure path likewise log only
  the exception type, with no exception object or completion ID.
- The capturing-logger integration test forces a real database failure and
  asserts that every event above Debug has a null exception and omits
  completion/user/Quest/community identifiers and provider detail, while the
  completion ID remains available in a Debug event.

### Closure verification

Run independently from `backend/` after the correction:

| Gate | Result | Observed evidence |
| --- | --- | --- |
| `dotnet build Kiwimpact.slnx` | PASS | Exit 0; 0 warnings, 0 errors |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | PASS | 176 passed, 0 failed |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | PASS | 195 passed, 0 failed |
| `dotnet ef migrations has-pending-model-changes --project src/Kiwimpact.Infrastructure --startup-project src/Kiwimpact.Api --no-build` | PASS | No model changes since the last migration |
| Dependency baseline | PASS | Infrastructure csproj has no diff from HEAD; no dependency file changed |
| Tracked diff hygiene | PASS | `git diff --check HEAD` produced no output |
| Untracked diff hygiene | PASS | every untracked text path passed `git diff --no-index --check` |

The implementation correction did not introduce a new product surface.
Moving the hosted lifecycle wrapper, explicitly preserving six pre-existing
FK indexes, regenerating the migration, and adding closure tests are necessary
supporting changes for M1–M3, not scope expansion.

Slice 5A now satisfies the independent-review requirement for commit
readiness. This verdict does not itself authorize stage, commit, push, merge,
PR, or deployment; those actions still require explicit human approval.

## Post-approval CI portability check — 2026-07-25

The first GitHub Actions run failed two integration assertions by two and four
.NET ticks respectively. Both compared an in-memory `DateTimeOffset` retaining
100-nanosecond precision with a value round-tripped through PostgreSQL
`timestamp with time zone`, whose precision is one microsecond.

Codex changed only those two test assertions to compare at one-microsecond
precision. This preserves the timestamp-semantic checks while matching the
database contract; no production code, migration, API, or product behavior
changed.

Independent verification:

- both formerly failing tests: 2/2 passed;
- `dotnet build Kiwimpact.slnx`: 0 warnings, 0 errors;
- unit tests: 176/176 passed;
- integration tests: 195/195 passed;
- exact CI command `dotnet test Kiwimpact.slnx --no-build`: both projects
  passed, 371 tests total.

This test-only portability correction does not reopen M1–M3 or change the
final `APPROVE` verdict.
