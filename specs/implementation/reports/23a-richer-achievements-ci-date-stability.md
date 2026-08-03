# Slice 23A — Richer Achievements CI Date Stability

- **Date:** 2026-08-03
- **Branch:** `feat/richer-achievements-trophies`
- **Prompt:** `specs/ai/prompts/81-richer-achievements-ci-date-stability.md`
- **Risk:** Low — test-only determinism correction
- **Status:** Complete and verified

## Implemented scope

- Corrected the profile-lock concurrency fixture so its three XP facts are
  strictly ordered within one Auckland calendar week. The fixture explicitly
  handles the first three seconds after the Monday week boundary instead of
  allowing the expected achievement count to depend on the execution day.
- Replaced the fixed 2026-07-20 backfill timestamp with a timestamp exactly
  seven days before the live redemption. The scenario therefore continues to
  test two consecutive Auckland weeks as real time advances.
- Replaced the fixed 2026-08-01 Mission Board start timestamp with a timestamp
  one day after the test begins, preserving the intended Active classification.
- No production source, schema, dependency, API, or product behavior changed.

## Files changed

- `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementConcurrencyTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/AchievementAwardPathTests.cs`
- `frontend/tests/integration/MyQuestsPage.test.tsx`
- `specs/ai/prompts/81-richer-achievements-ci-date-stability.md`
- `specs/implementation/reports/23a-richer-achievements-ci-date-stability.md`

## Verification observed

Focused verification:

- The two backend regressions passed together three consecutive times: 2/2
  tests on each run.
- `npm run test -- --run tests/integration/MyQuestsPage.test.tsx` passed: 1/1
  file and 6/6 tests.

Complete gates:

- `dotnet build Kiwimpact.slnx` passed with 0 warnings and 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  passed: 289/289 tests.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  passed on the final run: 326/326 tests.
- `npm run lint` passed.
- `npm run type-check` passed.
- `npm run test -- --run` passed: 48/48 files and 380/380 tests.
- `npm run build` passed; Vite emitted the existing non-blocking large-chunk
  advisory.

An intermediate full integration run exposed that equal XP timestamps made
trigger ordering depend on generated GUIDs. The fixture was refined to retain
strict timestamp ordering while staying within one Auckland week; three
focused repetitions and the final complete integration run then passed.

## Known limitations

- No manual browser or CI rerun is claimed. The same previously failing tests
  were reproduced locally before correction and passed locally afterward.
- The existing Vite large-chunk advisory remains unrelated to this change.

## Review status

- Slice 23's production implementation was independently approved in Review
  76 before this correction.
- This follow-up changes test fixtures and evidence only. No additional
  independent review was requested for this low-risk test-maintenance change.
