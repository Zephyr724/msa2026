# Slice 18 — Figma Content Parity and Test Personas Completion Report

## Status

Implementation and applicable full verification are complete. The initial K3
review reported three Majors and one Minor. The concentrated correction pass
and bounded targeted closure checks closed every original finding.

## Implemented scope

### Development test personas

- Added three confirmed Member accounts, three confirmed External Organizer
  accounts, and three confirmed Admin accounts.
- Interpreted the product term `External` as the accepted `Organizer` role;
  no fourth authorization role or schema change was introduced.
- Kept demo-account seeding Development-only, disabled by default, idempotent,
  and dependent on an ignored local password or environment value.
- Made each configured persona converge to its exact accepted role set and
  configured display name,
  including removal of obsolete application roles. Organizer and Admin
  personas retain the base Member role.
- Added an ignored local configuration convention, a safe example file, and
  README setup instructions.

### Landing, Quest cards, and Discover

- Rebuilt the Landing map frame and hover state, Community Goal composition,
  and green `Build your Impact Passport` section against the runnable Make
  prototype.
- Removed fabricated Passport preview numbers while retaining the reference
  composition.
- Made each Quest card a complete navigation target.
- Moved category emblems above the image/body seam and removed the permanent
  decorative sparkle from fallback artwork.
- Added category, difficulty, completion-condition, and source color systems.
- Added source-derived `Featured challenge`, Easy-derived `Good first Quest`,
  and capacity-derived `Almost full` presentation. No label is inferred from
  result-array position.
- Corrected Discover sort icon placement/alignment, green control borders,
  colored category filters, and the cards/map segmented control.

### Quest data, map, and detail

- Extended Quest read DTOs with non-sensitive administrative-area and country
  labels plus remaining capacity derived from active participation records.
- Loaded the required Region ancestors, media, and participation data through
  split read queries.
- Applied the same loaded Region/capacity contract to nested My Quests rows,
  with identity resolution for the participation graph.
- Replaced vague development locations with precise Auckland, New Zealand
  public-place addresses where a single venue exists; area-wide and backyard
  Quests remain explicitly area-wide instead of receiving invented points.
- Added precise address and Country/Region/Community context to cards, hero
  facts, map content, and the Quest Location section.
- Enlarged map InfoWindows, added media and right-side spacing, and retained
  map/list fallback behavior.
- Made the Quest gallery always present by reusing repository cover/fallback
  media when no additional gallery media exists.

### My Quests and Passport

- Re-composed My Quests around the Make flow: player status, milestone and
  community challenge, next action, underline tabs, and horizontal mission
  rows.
- Re-composed Passport around the Make identity header, XP progression,
  category progress list, achievement grid, claims, history, privacy,
  sharing, and account settings.
- Preserved the accepted real APIs and their loading, empty, error, evidence,
  self-report, reward, privacy, and account states.

## Files changed

Production and runtime:

- `.gitignore`
- `README.md`
- `backend/src/Kiwimpact.Api/Contracts/QuestDetailDto.cs`
- `backend/src/Kiwimpact.Api/Contracts/QuestListItemDto.cs`
- `backend/src/Kiwimpact.Api/Contracts/QuestLocationRegionDto.cs`
- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs`
- `backend/src/Kiwimpact.Api/Program.cs`
- `backend/src/Kiwimpact.Api/appsettings.Development.local.example.json`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoQuestSeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/IdentitySeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestReadRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/QuestParticipationRepository.cs`
- `backend/src/Kiwimpact.Core/Entities/UserProfile.cs`
- `frontend/src/components/maps/QuestMap.tsx`
- `frontend/src/app/AppShell.tsx`
- `frontend/src/components/passport/AchievementsSection.tsx`
- `frontend/src/components/passport/CategoryImpactSection.tsx`
- `frontend/src/components/passport/PassportSummaryCard.tsx`
- `frontend/src/components/quest/QuestCard.tsx`
- `frontend/src/lib/questPresentation.ts`
- `frontend/src/lib/validation/questDto.ts`
- `frontend/src/lib/validation/questManagementDto.ts`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/MyQuestsPage.tsx`
- `frontend/src/pages/PassportPage.tsx`
- `frontend/src/pages/QuestDetailPage.tsx`
- `frontend/src/pages/QuestListPage.tsx`
- `frontend/src/types/quest.ts`

Tests:

- `backend/tests/Kiwimpact.IntegrationTests/Api/AuthApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/QuestsApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/QuestParticipationApiTests.cs`
- `frontend/tests/integration/PassportPage.test.tsx`
- `frontend/tests/integration/AppShell.test.tsx`
- `frontend/tests/unit/questPresentation.test.ts`

Evidence and records:

- `specs/implementation/18-figma-content-and-test-personas.md`
- `specs/ai/prompts/69-slice-18-figma-content-and-test-personas.md`
- `specs/ai/reviews/69-slice-18-figma-content-and-test-personas-k3-review.md`
- `specs/implementation/evidence/18-figma-content-and-test-personas/`
- `specs/implementation/reports/18-figma-content-and-test-personas-completion.md`

The real local password is held only in ignored
`backend/src/Kiwimpact.Api/appsettings.Development.local.json`; it is not a
Slice file and is not intended for Git.

## Verification

Observed after the final production and test changes:

| Command or check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run` | Passed: 45 files, 338 tests |
| `npm run build` | Passed; Vite emitted the existing chunk-size advisory |
| `dotnet build Kiwimpact.slnx` | Passed: 0 warnings, 0 errors |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 250 tests |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Passed: 303 tests |
| Focused configured-persona integration test | Passed |
| `git diff --check` | Passed |
| Real Member login | `member1@kiwimpact.test` signed in with Member navigation |
| Real External login | `external1@kiwimpact.test` signed in with Organizer quest-management navigation |
| Real Admin login | `admin1@kiwimpact.test` signed in with Admin management and review navigation |
| Rebuilt Quest list API | Returned precise address, Auckland/New Zealand hierarchy, and capacity-derived remaining spots |
| Browser, Landing | Restored map frame, Community Goal, and Passport band without fabricated Passport metrics |
| Browser, Discover cards | Colored controls/chips, unclipped emblem, precise addresses, and full-card links observed |
| Browser, Discover map | Real map, result fallback list, image-bearing enlarged InfoWindow, and detail action observed |
| Browser, Quest Detail | Precise location context and always-present gallery observed |
| Browser, My Quests | Make-style status, milestone/challenge, next-action, tabs, and mission rows observed |
| Browser, Passport | Make-style identity/progression/category/achievement composition with real API data observed |
| Post-review focused frontend checks | Passed: lint, type-check, 3 files, 9 tests |
| Post-review focused account/My Quests integration checks | Passed: 2 tests |
| Responsive browser evidence | Captured five changed pages at 390 × 844 and 320 × 844 |

Browser captures are recorded under
`specs/implementation/evidence/18-figma-content-and-test-personas/`.

## Address evidence

Public-place seed strings were checked against venue or authoritative listing
pages where practical, including:

- Auckland Council for Takapuna Beach Reserve;
- CLM for Mount Albert Community and Leisure Centre;
- New Zealand Education Counts for Glenfield Primary School;
- Māngere Town Centre, Manurewa Community Network, and Auckland Council
  community-venue listings;
- an Auckland Council waste-directory listing for Papakura;
- Auckland District Council of Social Services for Mount Roskill War Memorial
  Hall.

These checks support the public-place address text only. They do not claim
that the fictional development Quest is an approved or scheduled event at
that venue.

## Known limitations

- The checked-in Figma source is a Make prototype without an addressable Figma
  Design node ID. The runnable local prototype and its checked-in source remain
  the implementation reference.
- The long-running local API on port `5091` must be restarted once to load the
  final executable and expose the new hierarchy/capacity DTO fields. The
  rebuilt API response was verified on temporary port `5092`, which was then
  stopped.
- No Google Places autocomplete or bulk New Zealand postal-address import was
  added. Those are different product/data scopes and were explicitly excluded.
- Quests that are genuinely area-wide, online, or backyard-based intentionally
  do not receive a fabricated single address or coordinate.
- No personalised recommendation label is emitted because the accepted data
  model has no recommendation signal. Platform-owned challenges receive the
  truthful `Featured challenge` label instead.
- The production bundle still emits the existing advisory that its main
  JavaScript chunk exceeds 500 kB. No dependency was added in this Slice.

## Review status

The initial independent K3 review found:

- Blocker: 0;
- Major: 3 — incomplete My Quests navigation loading, fabricated
  index-derived recommendation wording, and insufficient paired/responsive
  browser evidence;
- Minor: 1 — existing test-persona display names did not converge.

The concentrated correction pass:

- loaded My Quests participation and Region ancestor data and added a
  regression test covering active versus cancelled participation and
  Auckland/New Zealand hierarchy;
- replaced index-derived wording with attribute-derived highlight rules and a
  position-independence unit test;
- captured five changed pages at desktop, 390 px, and 320 px and documented
  the exact Make/current pairs;
- made configured display names converge idempotently and extended the account
  test.

The first targeted closure check closed Major 1, Major 2, and Minor 1 but kept
Major 3 open because the authenticated Admin header pushed Sign out outside
the 320 px viewport. The same concentrated correction pass compacted Admin
Review to an icon with an accessible name below `sm`, added an AppShell
regression assertion, recaptured all five 390/320 states, and reran the full
frontend gates.

The final Major 3-only closure check confirmed the compact header code,
focused AppShell test, exact 390/320 evidence dimensions, and fully in-viewport
Theme, Manage, Review, and Sign out actions.

Final independent review status:

- original Blocker: 0;
- original Major 1: closed;
- original Major 2: closed;
- original Major 3: closed;
- original Minor 1: closed;
- unresolved original Blocker/Major: 0;
- readiness: ready to commit.
