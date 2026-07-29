# Slice 15 — Figma-Faithful UI Restoration Completion Report

## Status

Implementation, approved correction pass, representative browser evidence, and
all applicable verification gates are complete. Slice 15 is ready for the
product owner's separate commit/push approval.

## Implemented scope

- Added repository-owned category emblems, rank crests, achievement badge art,
  and leaderboard medals derived from the accepted local Make source.
- Added reusable wide-page, soft-panel, segmented-control, metadata-chip, and
  section-title styling.
- Rebuilt Landing around the Make map/adventure hero, guest/member Passport
  journey, real community goal, featured Quest rail, loop, and Passport CTA.
- Made Discover Cards the default and added a Cards/Map switch while preserving
  URL filters, search, sorting, paging, real Google Maps, and error states.
- Expanded Quest Detail with interactive gallery, real coordinate map when
  available, related same-category Quests, and a mobile sticky action.
- Expanded Mission Board with real active mission, weekly streak, and community
  challenge signals while preserving fail-closed state classification.
- Reworked Passport hierarchy and added status plus category filtering backed
  by the coherent complete-history query.
- Restored leaderboard segmentation, podium/medal art, and actual
  SignalR connection status rather than a decorative always-live label.
- Kept the existing Share Card Builder’s single canvas render model,
  verified-only selection, theme/overlay controls, PNG download/share, and
  privacy exclusions. The canvas now includes repository-owned theme scenes,
  a category emblem, and a rank crest.
- Added Create Share Card to the verified completion reward overlay.
- Added the K3 correction-pass Landing sections, Mission Board milestone/action/
  achievement/Passport composition, and unified Quest completion chooser.
- Added an identity-safe `isCurrentUser` people-leaderboard field. The backend
  compares the authenticated actor's internal ID; anonymous reads return
  `false`. The UI uses that field for the `You` badge and row/podium treatment.
- Fixed the PostgreSQL `My Claims` query that failed EF translation after
  projecting joined entities into an intermediate record. Mission Board now
  classifies representative populated state without an API 500.
- Repaired account-lifecycle confirmation for tokens containing `+` and for
  React StrictMode's development-only double effect. The same token
  normalization is used by password reset.
- Constrained Passport's segmented navigation and page overflow so the populated
  Passport remains 390 px wide in the mobile evidence capture.
- Updated integration tests for the approved visual and interaction contracts.

## Parity matrix

| Surface | Result | Notes |
| --- | --- | --- |
| Shared art/system | Matched | Custom emblems, crests, badges, medals, topography, radius and elevation language |
| App shell | Truthful adaptation | Existing role-aware Manage/Admin actions retained outside the seven-page Make focus |
| Landing | Matched | Make-style hero/map, truthful Personal Progress, community goal, Passport showcase, CTA and footer |
| Discover | Matched | Cards default, compact filters, category emblems and real Map toggle |
| Quest Detail | Matched | Hero, facts, reward, sticky actions, gallery, map slot and related rail |
| Mission Board | Truthful adaptation | Real progression/streak/challenge/profile/achievement/history data; unsupported next-threshold and rank-position values receive bounded fallbacks |
| Completion/reward | Truthful adaptation | One chooser derives choices from accepted source/registration boundaries; server enforcement remains final |
| Passport | Matched | Full existing data hierarchy retained; complete-history status/category filtering added |
| Leaderboard | Truthful adaptation | Real API/privacy states, identity-safe `You` context, and real connection status; unsupported movement data omitted |
| Share Card Builder | Matched | One canvas model draws repository-owned theme scenes, category emblem and rank crest for preview/export |
| Make demo toolbar | Explicitly excluded | Prototype-only simulation control |
| Hard-coded Mia/rank/XP/challenge values | Explicitly excluded | Production API remains authoritative |
| Remote Unsplash imagery | Explicitly excluded | Repository-owned Quest assets retained |

## Files changed

Production:

- `backend/src/Kiwimpact.Api/Contracts/LeaderboardContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/AuthController.cs`
- `backend/src/Kiwimpact.Api/Security/FrontendAccountLinkBuilder.cs`
- `backend/src/Kiwimpact.Core/Services/LeaderboardModels.cs`
- `backend/src/Kiwimpact.Core/Services/LeaderboardService.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestCompletionRepository.cs`
- `frontend/src/components/PlayerStatusCapsule.tsx`
- `frontend/src/components/PlayerStatusSummary.tsx`
- `frontend/src/components/community/LiveImpactInvalidation.tsx`
- `frontend/src/components/game/GameArtwork.tsx`
- `frontend/src/components/passport/AchievementCard.tsx`
- `frontend/src/components/passport/PassportSummaryCard.tsx`
- `frontend/src/components/quest/CategoryEmblem.tsx`
- `frontend/src/components/quest/QuestCompletionMethods.tsx`
- `frontend/src/components/quest/QuestCompletionPanel.tsx`
- `frontend/src/components/quest/TrustedCompletionPanel.tsx`
- `frontend/src/hooks/usePassportCompletions.ts`
- `frontend/src/hooks/useQuests.ts`
- `frontend/src/index.css`
- `frontend/src/lib/api/auth.ts`
- `frontend/src/lib/shareCard.ts`
- `frontend/src/lib/validation/leaderboardDto.ts`
- `frontend/src/pages/AccountLifecyclePages.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/LeaderboardPage.tsx`
- `frontend/src/pages/MyQuestsPage.tsx`
- `frontend/src/pages/PassportPage.tsx`
- `frontend/src/pages/QuestDetailPage.tsx`
- `frontend/src/pages/QuestListPage.tsx`
- `frontend/src/pages/ShareCardBuilderPage.tsx`
- `frontend/src/stores/useUiStore.ts`
- `frontend/src/types/leaderboard.ts`

Tests:

- `backend/tests/Kiwimpact.IntegrationTests/Api/LeaderboardsApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/QuestCompletionApiTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Api/FrontendAccountLinkBuilderTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/LeaderboardServiceTests.cs`
- `frontend/tests/integration/AccountLifecyclePages.test.tsx`
- `frontend/tests/integration/HomeMemberMomentum.test.tsx`
- `frontend/tests/integration/LeaderboardPage.test.tsx`
- `frontend/tests/integration/MyQuestsPage.test.tsx`
- `frontend/tests/integration/PassportAchievements.test.tsx`
- `frontend/tests/integration/PassportPage.test.tsx`
- `frontend/tests/integration/QuestCompletionMethods.test.tsx`
- `frontend/tests/integration/QuestDetailPage.test.tsx`
- `frontend/tests/integration/QuestListPage.test.tsx`
- `frontend/tests/unit/auth.test.ts`
- `frontend/tests/unit/leaderboardDto.test.ts`
- `frontend/tests/unit/useLeaderboard.test.tsx`

Evidence and decisions:

- `specs/architecture/03-api-contract.md`
- `specs/ai/prompts/66-slice-15-figma-faithful-ui-implementation.md`
- `specs/implementation/15-figma-faithful-ui-restoration.md`
- `specs/implementation/evidence/15-figma-faithful-ui/`
- `specs/implementation/reports/15-figma-faithful-ui-restoration-report.md`

## Verification

Observed during implementation:

- `npm run type-check` — passed.
- `npm run lint` — passed.
- Initial `npm run test -- --run` — passed, 41 files and 327 tests.
- `npm run build` — passed. Vite emitted the existing large-chunk advisory.
- `git diff --check` — passed.
- Desktop browser checks — Landing, Discover Cards, Discover Map, and Quest
  Detail rendered.
- Mobile browser checks — Landing, Discover, and Quest Detail rendered at the
  390-class viewport; Quest Detail sticky action and bottom navigation were
  visible.
- Correction browser checks — corrected Landing and Quest Detail rendered at
  desktop; Landing and Quest Detail rendered at tablet width in dark theme;
  Discover rendered at requested 320 px in dark theme.

The initial full commands above predate the bounded K3 correction pass. Final
post-correction full-gate results are recorded after the pass below.

Final post-correction and approved closure gate:

- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run` — passed, 44 files and 334 tests.
- `npm run build` — passed. Vite emitted the existing large-chunk advisory.
- `dotnet build Kiwimpact.slnx` — passed, 0 warnings and 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — passed, 250 tests.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — passed, 302 tests.
- `git diff --check` — passed.

Representative runtime evidence:

- Started isolated PostgreSQL and Mailpit containers and a frontend proxy pinned
  to `127.0.0.1` to avoid macOS Control Center's port-5000 listener.
- Registered a Member through the UI, received the confirmation email in
  Mailpit, clicked the emitted link, and observed `Email confirmed.` without
  bypassing authentication.
- Created and published local Organizer-owned Quests through the protected API,
  generated a completion code through the Organizer UI, joined and redeemed it
  as the Member, and observed 100 XP, Level 3, First Steps, and the reward
  overlay.
- Captured populated desktop and 390 px Mission Board, completion, Passport,
  Share Card, and leaderboard states. The people leaderboard showed `You` only
  on the authenticated Member's row.
- Used one isolated fixture adjustment to represent Home Community having been
  set before the verified award. This populated the Auckland leaderboard while
  preserving the production rule that award-time community is historical.
- Stopped and automatically removed the isolated containers and all disposable
  accounts/Quests after capture.

## Known limitations

- Category filtering intentionally triggers the complete coherent Passport
  history read; unfiltered history remains paginated.
- No organizer, eligibility, personal-best, movement, or achievement reveal is
  inferred when the API does not provide it.
- The isolated 5174 evidence instance did not load the Google Maps script in the
  Organizer location picker and therefore used the approved protected API for
  fixture creation. The existing public Discover Map evidence remains the
  observed configured-map capture; no fake map marker was introduced.
- Vite continues to emit its existing advisory for a JavaScript chunk larger
  than 500 kB. No dependency or bundling architecture change was approved in
  this Slice.

## Review status

Independent read-only K3 review recorded 0 Blockers, 6 Majors, and 1 Minor.
The bounded correction pass closed Landing, Mission Board, completion chooser,
Share Card, and media-extension findings. The product owner then explicitly
approved both remaining closure items. The identity-safe public API field is
implemented and covered by unit/integration/UI tests; the representative
authenticated browser matrix and Mailpit confirmation evidence now exist.

During closure, the implementation owner also fixed two failures exposed by the
real fixture journey: the PostgreSQL My Claims translation error and duplicate
StrictMode confirmation submission. No original Blocker/Major finding remains
open. No files have been staged, committed, or pushed.
