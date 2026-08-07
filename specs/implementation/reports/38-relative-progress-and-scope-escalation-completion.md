# Relative Progress and Scope Escalation Completion

- **Date:** 2026-08-07
- **Branch:** `codex/feat/member-loop-gamification`
- **Specification:** `specs/implementation/35-relative-progress-and-scope-escalation.md`
- **Prompt:** `specs/ai/prompts/97-relative-progress-and-scope-escalation.md`
- **Risk:** Important (authoritative competitive ranking and privacy behavior)
- **Status:** Complete; automated/browser verification and targeted K3 closure passed

## Implemented scope

- Added an authenticated current-member position to the people leaderboard
  response: rank, active-member count, XP, verified Quest count, members
  surpassed, and percentile.
- Computes the current-member rank from the same complete, deterministic
  database ordering used by the visible leaderboard instead of searching the
  truncated Top 10 response.
- Defines percentile as the percentage of other active members surpassed and
  returns 100 for a sole participant.
- Preserves small-community privacy by suppressing both the rows and the
  current-member competitive summary below the existing threshold.
- Added a concise current-position surface that leads with members surpassed,
  keeps XP and Quest count secondary, shows non-shaming progress below the
  threshold, and offers the next wider scope at percentile 80 or above.
- Scope changes remain user-controlled. The CTA does not switch the selected
  scope until clicked; New Zealand has no wider CTA.
- Updated Player Status to use the authoritative current-member summary even
  when the member is outside the visible page.
- Distinguished authenticated landing-page hierarchy with `MY PROGRESS` and
  `OUR PROGRESS` labels while preserving the existing composition.
- Restored the accepted Leaderboard selector colour hierarchy without changing
  behaviour or global theme tokens: view and geographic Scope selections stay
  dark neutral, while Period selection uses brand primary green.
- No database migration, dependency, currency, season, league, or icon-system
  change was introduced.

## Files changed

- `backend/src/Kiwimpact.Core/Repositories/ILeaderboardRepository.cs`
- `backend/src/Kiwimpact.Core/Services/LeaderboardModels.cs`
- `backend/src/Kiwimpact.Core/Services/LeaderboardService.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/LeaderboardRepository.cs`
- `backend/src/Kiwimpact.Api/Contracts/LeaderboardContracts.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/LeaderboardServiceTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/LeaderboardsApiTests.cs`
- `frontend/src/types/leaderboard.ts`
- `frontend/src/lib/validation/leaderboardDto.ts`
- `frontend/src/pages/LeaderboardPage.tsx`
- `frontend/src/components/PlayerStatusSummary.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/tests/unit/leaderboardDto.test.ts`
- `frontend/tests/unit/useLeaderboard.test.tsx`
- `frontend/tests/integration/LeaderboardPage.test.tsx`
- `frontend/tests/integration/HomeMemberMomentum.test.tsx`
- `specs/implementation/35-relative-progress-and-scope-escalation.md`
- `specs/ai/prompts/97-relative-progress-and-scope-escalation.md`
- `specs/implementation/reports/38-relative-progress-and-scope-escalation-completion.md`

## Verification observed

- `dotnet build Kiwimpact.slnx --no-restore` passed.
- Focused `LeaderboardServiceTests` passed: 16 tests.
- Focused `LeaderboardsApiTests` passed: 19 tests, including authenticated
  current-member position outside the Top 10 and deterministic tie ordering.
- `npm run test -- --run tests/integration/LeaderboardPage.test.tsx tests/integration/HomeMemberMomentum.test.tsx tests/unit/leaderboardDto.test.ts tests/unit/useLeaderboard.test.tsx`
  passed: 4 files, 25 tests.
- `npm run type-check` passed.
- `npm run lint` passed.
- `npm run test -- --run` passed after the final correction pass: 53 files,
  416 tests.
- `npm run build` passed with only the existing JavaScript chunk-size advisory.
- Final `dotnet build Kiwimpact.slnx` passed with 5 pre-existing EF1002
  warnings in integration-test SQL helpers and 0 errors.
- Final Unit Tests passed: 316 tests. Full Integration Tests passed: 350 tests.
- Browser inspection confirmed the default Community/Weekly selection, the
  authoritative `Your weekly position` surface, members-surpassed lead,
  secondary rank/XP/Quest details, and no automatic scope switch.
- Follow-up colour inspection compared the production page with the accepted
  Figma Leaderboard source and reference capture. In light theme, selected
  view/Scope controls rendered dark neutral (`rgb(24, 48, 38)`) while selected
  Period rendered primary green (`rgb(47, 143, 91)`). In dark theme, selected
  view/Scope controls rendered the accepted light neutral while Period rendered
  dark-theme primary green (`rgb(111, 214, 154)`).
- At 320 px the leaderboard had no horizontal overflow
  (`scrollWidth = clientWidth = 320`) and kept all three geographic choices
  readable. The restored primary-green Period selection remained visible at
  320 × 800. The Home page separately rendered `MY PROGRESS` and `OUR PROGRESS`.
- `git diff --check` passed.
- After the colour restoration, the focused Leaderboard suite passed 10/10;
  lint and type-check passed; the complete frontend suite passed 53 files and
  419 tests; the production build passed with only the existing chunk-size
  advisory.

## Known limitations

- For authenticated requests, the repository reads the full ordered member-ID
  projection for the selected scope to derive an exact rank. This keeps the
  ranking contract simple and exact for current MSA scale; a PostgreSQL window
  projection is a future performance optimization if participation grows
  materially.
- Exact wider-scope eligibility is backend-authoritative. The displayed
  percentile remains rounded for readability and is not used as authorization.

## Review status

- The initial Kimi K3 review is recorded in
  `specs/ai/reviews/89-relative-progress-and-scope-escalation-k3-review.md`.
- Its rounded-threshold finding was corrected with an integer-ratio backend
  boolean and a rounded-to-80-but-ineligible boundary test.
- Targeted K3 closure passed: M1-M2 are closed; no original Blocker/Major
  remains.
