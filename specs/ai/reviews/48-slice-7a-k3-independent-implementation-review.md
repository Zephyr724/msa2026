# Review 48 — Slice 7A Simple Leaderboard Backend: Kimi K3 Independent Implementation Review

- **Date:** 2026-07-26
- **Reviewer:** Kimi K3 (independent implementation review; not the
  implementation session)
- **Implementation owner:** Codex
- **Branch:** `feat/slice-7-simple-leaderboard`
- **Baseline:** `ade8f1e3c0b474924aca44e97cb29a872f4513d1` (verified as HEAD;
  the entire 7A change set is uncommitted in the working tree)
- **Reviewed evidence:**
  `specs/implementation/07-simple-persisted-leaderboard.md`,
  `specs/implementation/reports/07a-simple-leaderboard-backend-completion.md`,
  `specs/ai/prompts/54-slice-7a-simple-leaderboard-backend-implementation.md`,
  `specs/ai/reviews/47-slice-7-codex-independent-design-review.md`
- **Verdict:** `APPROVED`

## Findings summary

| Severity | Count |
| --- | ---: |
| Blocker | 0 |
| Major | 0 |
| Minor | 2 |

Both Minors are non-blocking and may be deferred or corrected in a single
concentrated pass at the human's discretion.

## Gates independently executed and observed (2026-07-26, from `backend/`)

- `dotnet build Kiwimpact.slnx` — succeeded, 0 errors. A forced
  `--no-incremental` rebuild shows exactly **5 EF1002 warnings**, all in
  pre-existing, unchanged test files (`XpReconciliationTests.cs` ×2,
  `AchievementAwardPathTests.cs`, `ProgressionApiTests.cs`,
  `XpLedgerPersistenceTests.cs`). The new leaderboard test file uses
  `ExecuteSqlRawAsync` only with a non-interpolated literal and
  `ExecuteSqlInterpolatedAsync` elsewhere, so it adds no warning. The
  completion report's claim matches.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — **233/233 passed** (observed).
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — **275/275 passed** against Testcontainers PostgreSQL (observed on a clean
  run, exit code 0).

Transparency note: this reviewer's first integration run reported 38
failures concentrated in client-creation paths. The cause was environmental
and self-inflicted: a concurrent forced rebuild was overwriting test DLLs
mid-run. A clean rerun with no concurrent build passed 275/275. This is not
a defect in the implementation.

## Point-by-point verification

### 1. Staged parameter contract — VERIFIED

`LeaderboardsController.cs:42-53` preserves parameter presence through
`Request.Query.ContainsKey`, mapping an explicitly empty value to
`string.Empty` while omitted keys remain `null`; this genuinely
distinguishes `?scope=` from an omitted `scope`. `LeaderboardService.cs:29-41`
resolves defaults, then rejects any non-exact scope/period (ordinal,
case-sensitive) and any non-null `page`/`pageSize` **before** the readiness
check and any repository call. Bounded 400 Problem Details
(`ProblemDetailsHelper.Validation`). Counter-directional evidence: 12 unit
parameter combinations (`LeaderboardServiceTests.cs:55-89`, including
`"NZ"`, empty strings, non-numeric pagination, with readiness/repository
call counts asserted zero) and 10 API combinations
(`LeaderboardsApiTests.cs:182-206`). Unrelated unknown query keys are
ignored and tested (`UnknownQueryKeysAreIgnored`), matching the approved
D1 contract.

### 2. Ledger-only aggregation — VERIFIED

`LeaderboardRepository.cs:25-46` aggregates `_db.XpTransactions` (AsNoTracking)
with `GroupBy(UserId)`, `Sum((long)XpAmount)`, and `LongCount()`, then uses
EF `Join` (inner) to `UserProfiles` for `DisplayName`. No write path, no
projection table, no `TotalXp` shortcut. The inner-join exclusion of a
ledger user lacking a profile is proven by
`LedgerRowWithoutAResolvableProfileIsExcluded`.

### 3. SQL ordering and Top 10 — VERIFIED

`LeaderboardRepository.cs:47-51`: `OrderByDescending(TotalXp)` →
`ThenByDescending(VerifiedCompletionCount)` → `ThenBy(DisplayName.ToLower())`
→ `ThenBy(UserId)` → `Take(limit)`. The `Take` follows the full ordering
chain. `TopTenUsesTheFullDeterministicOrder` seeds 11 equal-score users and
proves exactly 10 rows with the deterministic cut.

### 4. Service rank assignment — VERIFIED

`LeaderboardService.cs:50-58` preserves the repository sequence and assigns
ordinal ranks `index + 1` with no reordering and no UserId propagation into
`RankedLeaderboardRow`. Unit test
`OmittedParametersDefaultAndRepositoryOrderGetsOrdinalRanks` proves order
preservation, ordinal ranks, and the compiled limit constant 10.

### 5. Reward-pending 503 — VERIFIED

The service evaluates the existing parameterless
`IXpLedgerRepository.HasRewardPendingCompletionsAsync` live per request and
fails closed with `LeaderboardError.NotReady` before the ranking query.
`ProblemDetailsHelper.LeaderboardNotReady()` returns bounded 503
`leaderboard-not-ready` Problem Details. The integration test
`RewardPendingFailsClosedThenReconciliationMakesTheBoardReady` proves the
503 shape (exact keys, type, title, status, detail, no internal counts) and
that a real reconciliation pass opens the gate with the awarded row visible.

### 6. Anonymous access, exact keys, privacy — VERIFIED

`[AllowAnonymous]` on the controller; the API test asserts a cookieless 200,
exact envelope keys (`scope`, `period`, `rows`), exact row keys (`rank`,
`displayName`, `totalXp`, `verifiedCompletionCount`), and negative content:
seeded user IDs, `community`, `email`, `quest`, and `transaction` substrings
absent from the payload. Zero-XP users are excluded (profile-only seed never
appears). `LeaderboardContracts.cs` DTOs carry no UserId.

### 7. OpenAPI documentation — VERIFIED

The controller declares `[ProducesResponseType]` for 200/400/503 and binds
four documented query parameters. The new
`OpenApiOperationTests.PeopleLeaderboardOperationAndResponsesAreDocumented`
asserts the route, exactly `["scope", "period", "page", "pageSize"]`, and
the 200/400/503 responses against `/openapi/v1.json`; it passed within the
observed 275/275 run.

### 8. Review 47 backend findings — CLOSED IN SUBSTANCE

- **M1 (staged rejection reachability):** closed — nullable string binding
  forwards all four parameters through the controller/service boundary;
  validation order and unknown-key behaviour are specified and tested.
- **M2 (file map/DI/OpenAPI):** closed — repository registration in
  `Infrastructure/DependencyInjection.cs:30`, Core service registration in
  `Program.cs:223`, `OpenApiOperationTests.cs` extended; observed change set
  is exactly the corrected 13 primary files (9 new, 4 modified).
- **M3 (tie-break ownership and proof):** closed — ordering is solely
  repository-owned; the case-fold collision test (`Aroha` GUID …002 vs
  `AROHA` GUID …001) makes the internal GUID tie-break externally observable
  without serializing IDs; the duplicate-name `Zebra` pair asserts
  multiplicity only, as required; `SUM` is a `long` aggregate matching the
  DTO; the service unit proof is narrowed to rank assignment/order
  preservation.
- **M4 and m1:** frontend (7B) scope — not applicable to 7A.
- **m2 (handoff/PROJECT_STATUS):** closed — the sequential branch/merge
  handoff is frozen in the plan; the observed `PROJECT_STATUS.md` update is
  consistent with the merged Slice 6B baseline and the locally implemented,
  unmerged 7A state, and its 6B evidence link
  (`reports/06b-passport-achievements-ui-completion.md`) exists.

### 9. Boundary compliance — VERIFIED

The full working-tree diff against `ade8f1e` contains only: the 13 primary
files above, `specs/architecture/03-api-contract.md` (the approved §2.14
staged-limitation note), `PROJECT_STATUS.md`, the corrected plan, and
prompt/review/report evidence. No migration, schema, index, `.csproj`,
dependency, authentication, antiforgery, rate-limit, configuration, or
frontend change; no XP write-path, reconciliation, progression, or
achievement modification.

### 10. Evidence consistency — VERIFIED

- Prompt 54's reconstructed instruction matches the approved D1–D8 option A
  scope; its execution record matches observed file counts and gate claims.
- Completion report claims confirmed: 13 primary files (observed); unit
  leaderboard filter 15 = 3 Facts + 12 theory cases (counted);
  leaderboard-API + OpenAPI filter 19 = 17 (7 Facts + 10 theory cases) + 2
  OpenAPI tests (counted); full gates 233/233 and 275/275 (independently
  re-observed); build warning claim (independently re-observed).
- `PROJECT_STATUS.md` claims match the observed unmerged, review-pending
  state and do not overclaim merge or deployment.

## Minor findings (non-blocking)

### m1 — The targeted design-closure review record for Review 47 is absent

Review 47's required next step included one targeted Codex closure check
limited to M1–M4/m1–m2, matching the workflow used for earlier slices
(e.g. reviews 38, 45). No such closure record exists under
`specs/ai/reviews/`. The substance is closed — this review independently
verified every backend-relevant correction in the plan and implementation —
but the evidence chain has a documentation gap. Recommend recording the
closure (or an explicit human waiver) in the completion/report trail before
merge; no code change required.

### m2 — `LeaderboardContracts.cs` deviates from file-scoped namespace convention

The file declares two block-scoped namespaces (`Kiwimpact.Api.Contracts` and
`Kiwimpact.Api.Mapping`) in one file, while the codebase consistently uses
one file-scoped namespace per file. Behaviour is unaffected; the dual
placement was a deliberate plan choice to avoid touching `DtoMapping.cs`.
Cosmetic consistency only.

## Confirmed strengths

- The staged contract is honest: unsupported parameters fail loudly with
  bounded 400 instead of being silently ignored, and presence-vs-omission is
  genuinely distinguished despite ASP.NET's null normalization.
- Ordering ownership is unambiguous (repository), and the final internal
  tie-break is proven by externally observable evidence without leaking IDs.
- The readiness gate reuses the existing global accounting boundary; the
  reconciliation round-trip test proves the board never presents partial
  state as authoritative.
- Tests are consistently counter-directional: exact-key and negative-content
  assertions, call-count assertions proving validation short-circuits, and a
  deterministic Top-10 cut at the 11-user boundary.

## Scope confirmation

This review created only
`specs/ai/reviews/48-slice-7a-k3-independent-implementation-review.md`. It
did not modify implementation code, tests, plans, prompts, reports, accepted
specifications, `PROJECT_STATUS.md`, dependencies, configuration, or
migrations. It did not stage, commit, push, merge, create a pull request, or
deploy. The only side effects were read-only build/test executions and a
temporary log file under `/tmp`.
