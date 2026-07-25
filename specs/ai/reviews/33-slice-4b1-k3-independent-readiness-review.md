# Slice 4B-1 Kimi K3 Independent Readiness Review

- Date: 2026-07-25
- Reviewer: Kimi K3
- Mode: Independent read-only review
- Branch: `feat/slice-4b1-completion-code-backend`
- Verdict: `APPROVE`


# Slice 4B-1 Independent Review

## Review scope

- Branch: `feat/slice-4b1-completion-code-backend` (HEAD `55c4ee8`, one commit containing only the approved 4B spec; the implementation itself is entirely in the uncommitted working tree, preserved exactly)
- Merge base: `d97888a205f80d0328376fb7227d28fb53fc8d55` with `origin/main`
- Files reviewed: Complete diff from the merge base (35 paths: 13 modified tracked, 21 untracked working-tree paths, 1 committed spec). Read in full: the 04b contract, prompt record, completion report, all new production files (entities, enums, `CompletionCodeProtector`, service/models/interfaces, repository, configurations, migration, controllers, contracts, problem mapper, options, rate-limit policy), all new test files, `Program.cs`, `QuestManagementService`, `QuestWriteRepository`, `ProblemDetailsHelper`, `DtoMapping` (diffs), `QuestParticipationRepository` (4A convention baseline), `CustomWebApplicationFactory`, accepted data model §3.7/§3.9/§5/§8; targeted checks of `Quest`, `UserProfile`, `AppRoles`, `ApiAntiforgeryFilter`, appsettings, migration Designer/snapshot (generated; behavior proven by real-migration tests)
- Commands run: `git branch --show-current`, `git status --short` (before/after), `git log origin/main..HEAD`, `git merge-base`, `git diff --stat/--check d97888a`, per-file `git diff`, `git ls-files --others`, `git diff --no-index --check` over every untracked file, `dotnet build Kiwimpact.slnx`, `dotnet test tests/Kiwimpact.UnitTests/... --no-build`, `dotnet test tests/Kiwimpact.IntegrationTests/... --no-build`
- Working-tree impact: None. `git status --short` after all gates is byte-identical to the pre-review state (39 entries); only ignored `bin`/`obj`/Testcontainers artifacts were produced

## Findings

### Blockers

- None

### Majors

- None

### Minors

1. **Missing negative test: non-date Quest edit must preserve the active code**
   - Severity: Minor
   - Location: `backend/src/Kiwimpact.Core/Services/QuestManagementService.cs:84-85`; tests in `backend/tests/Kiwimpact.IntegrationTests/Api/QuestCompletionApiTests.cs:621-679`
   - Requirement: contract §8 (review M2) — revocation only when `StartAtUtc`/`EndAtUtc` changes; unrelated edits must not revoke
   - Failure scenario: a future regression revoking codes on every update would pass all existing tests while breaking the accepted invariant
   - Why tests don't detect it: `QuestDateUpdateRevokesActiveCodeBeforeRegeneration` proves only the positive direction; no test updates a non-date field and asserts the code survives
   - Correction direction: add one integration case that updates title/description only and asserts the active code still redeems

2. **No HTTP-level redemption test for unsupported SourceType/RegistrationMode**
   - Severity: Minor
   - Location: `backend/src/Kiwimpact.Core/Services/QuestCompletionModels.cs:103-110` (`EnsureRedemptionQuest`), mapper at `QuestCompletionProblemMapper.cs:18-19`; test gap in `QuestCompletionApiTests.cs:551-619`
   - Requirement: contract §7 rule 4 — non OrganizerOwned/Native redemption → `400`
   - Failure scenario: a mapping regression on the redeem path would turn the rejection into a wrong status code
   - Why tests don't detect it: source/mode rejection is exercised only at generation; the redeem-side branch is covered only by code inspection and a unit precedence test, not end-to-end
   - Correction direction: extend the existing unsupported-quest test with one redeem attempt against an External-mode Quest

3. **Key-rotation consequence recorded only in the completion report**
   - Severity: Minor
   - Location: `specs/implementation/reports/04b1-completion-code-backend-completion.md:160-167`; `specs/operations/` is empty
   - Requirement: contract §8 — deployment documentation must record that changing `CompletionCodes__HmacKey` invalidates every active code
   - Failure scenario: an operator rotates the key without regenerating codes; all redemptions fail generically
   - Why tests don't detect it: documentation obligation, not runtime behavior; R1 deployment docs are deferred by contract §5, so no target document exists yet
   - Correction direction: carry the report's operational note into deployment documentation when R1 lands

4. **No service-path test that an unrelated 23505 is not translated to AlreadyCompleted**
   - Severity: Minor
   - Location: `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs:210-215`
   - Requirement: contract §10 — 23505 translated only when it names `UX_QuestCompletions_UserId_QuestId_Verified`
   - Failure scenario: removing the `ConstraintName` filter would convert unrelated unique violations into a misleading `409`
   - Why tests don't detect it: the positive translation is proven (raw-SQL duplicate insert names the constraint; concurrent duplicate gets `409`); the negative branch needs fault injection and has no test
   - Correction direction: optional — a persistence-level test forcing a different unique violation through the service path

## Verification results

| Gate | Result | Evidence |
|---|---|---|
| Complete diff inspection | PASS | Merge base `d97888a`; 35-path diff reviewed in full; inventory matches the report's 39-file list exactly (34 working-tree + spec + evidence); nothing outside Slice 4B-1 scope; no missing files |
| Diff hygiene | PASS | `git diff --check d97888a` clean; `git diff --no-index --check /dev/null` clean for every untracked file |
| Build | PASS | `dotnet build Kiwimpact.slnx` — 0 warnings, 0 errors, matching the report |
| Unit tests | PASS | 102 passed, 0 failed, 0 skipped — exactly as reported |
| PostgreSQL integration tests | PASS | 148 passed, 0 failed, 0 skipped on Testcontainers `postgres:17-alpine` — exactly as reported |
| Migration review | PASS | Additive-only (`CREATE TABLE` ×2 + indexes); upgrade test applies it over the real `20260724174740` schema via `IMigrator`; catalog + raw-SQL tests prove both partial unique indexes, the validity-window check, Restrict/SetNull, `xmin` on `QuestCompletion` only, and absence of plaintext/salt columns and `XpTransactions`; `Down()` drops both tables |
| Security review | PASS | HMAC-SHA256 over exact UTF-8 `QuestId:D + ":" + code`, Base64 storage, `FixedTimeEquals`, dummy-HMAC path for malformed/unconfigured (no obvious oracle); startup key validation fails safely in Development and Production test hosts; no committed/default key in appsettings; no plaintext in logs, exceptions, DTOs, or DB (information_schema-verified); reveal-once with `Location` on the status resource; status DTO metadata-only |
| Concurrency review | PASS | Real `SELECT ... FOR UPDATE` inside explicit transactions for redeem, rotate, and quest date edit; deterministic externally-held-lock tests observe blocked sessions in `pg_stat_activity` before release (genuine overlap — they would time out without `FOR UPDATE`, and rotation would yield 2 actives or a 409 without the lock/index); one 201 + one 409 + one Verified row; failed rotation preserves the old code end-to-end |
| Scope review | PASS | Backend-only; no frontend/XP/achievement/leaderboard/deployment changes; no `.csproj`/lockfile changes; no new endpoints beyond the amended §11 surface (OpenAPI count 8→10 matches); unrelated-file changes: none — every modified existing file is required by the contract (incl. M3 middleware reorder and M2 date-revocation) |

## Completion-report accuracy

Accurate. Every quantitative claim reproduced exactly under re-execution (build 0/0; unit 102/0/0; integration 148/0/0; `git diff --check` clean). The file inventory matches Git status one-for-one. Test-behavior descriptions (lock-contention mechanics, rotation outcomes, rate-limit sequence with alternating-case paths, invalid-key startup rejection in both environments, CSRF 400s, schema assertions) match what the tests actually do. Trivial imprecision: the report says alternating-case Quest GUIDs were used for "requests 1–10"; the test alternates case for duplicate requests 2–10 (request 1 is the successful redemption) — substantively accurate. No invented evidence found.

## Residual risks

- Participation cancellation is not serialized on the Quest-row lock: a completion can be created against a participation cancelled in the same instant. The outcome is equivalent to the accepted "complete then cancel" ordering (completions outlive participation; `ParticipationId` SetNull applies only to row deletion), consistent with Slice 4A semantics — no contract violation, noted for Slice 5A awareness.
- `Verify` equalizes HMAC work across malformed/wrong/unconfigured submissions, but a configured quest performs one extra in-memory Base64 decode of the stored hash — a theoretical micro-timing signal, within the contract's "where practical" bar (§14).
- `QuestManagementService.UpdateAsync` acquires the Quest row lock before ownership evaluation, so a non-owner can briefly hold the lock (rolled back immediately); bounded and self-limiting.
- Changing `CompletionCodes__HmacKey` invalidates all active codes — accepted operational consequence; the regeneration runbook is currently recorded only in the completion report (Minor 3).

## Final verdict

APPROVE