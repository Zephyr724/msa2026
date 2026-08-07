# Achievement concurrency CI week-boundary fix completion

- **Date:** 2026-08-07
- **Branch:** `fix/app-shell-scroll-restoration`
- **Status:** Complete
- **Review status:** Self-reviewed; independent review not required for this isolated test-only correction.

## Implemented scope

- Replaced the `UtcNow.AddDays(-5)` legacy-ledger fixture timestamp with a
  fixed mid-week instant so its five XP facts cannot cross an Auckland Monday
  boundary.
- Added an explicit assertion that the concurrency fixture does not earn the
  `weekly-streak-2` achievement.
- Left the production achievement evaluator, backfill locking, and award
  persistence unchanged.

## Files changed

- `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementConcurrencyTests.cs`
- `specs/ai/prompts/99-achievement-concurrency-ci-week-boundary-fix.md`
- `specs/implementation/reports/42-achievement-concurrency-ci-week-boundary-fix-completion.md`

## Verification

- `dotnet build Kiwimpact.slnx`
  - Passed with zero errors and five existing EF1002 warnings in unrelated
    integration-test SQL helpers.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build --filter "FullyQualifiedName=Kiwimpact.IntegrationTests.Persistence.AchievementConcurrencyTests.TwoBackfillWorkersAwardTheSameUserExactlyOnce"`
  - Passed: 1, failed: 0.
- `dotnet test Kiwimpact.slnx --no-build`
  - Unit tests passed: 309, failed: 0.
  - Integration tests passed: 342, failed: 0.
- `git diff --check`
  - Passed.

## Known limitations

- This correction removes a time-dependent false positive from the test
  fixture; it does not change or broaden production streak semantics.
