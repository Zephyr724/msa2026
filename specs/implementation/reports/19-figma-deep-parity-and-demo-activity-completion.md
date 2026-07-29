# Slice 19 — Figma Deep Parity and Demo Activity Completion Report

## Status

Production implementation is complete. The prior independent K3 read-only
review found two Major issues; both were corrected and the targeted closure
check passed. An additive Completion History parity pass has since been
implemented. All applicable full gates have passed, and the additive
independent review's original Major/Minor findings are closed.

## Implemented scope

### Landing

- Rebuilt Community Goal around the Make hierarchy: external section label and
  title, compact challenge media, deadline, verified progress, remaining
  Quests, reward, rules, and detail action.
- Rebuilt `Build your Impact Passport` as the Make green band with four
  progress facts and five translucent feature rows.
- Kept member values sourced from progression, streak, profile, participation,
  and challenge APIs.

### My Quests

- Rebuilt Player Status with rank crest, interactive level/rank explanation,
  XP progress, real My Community/Auckland rank lookups, weekly streak
  explanation, and leaderboard navigation.
- Replaced Discover-style cards with Make horizontal mission rows containing
  image, emblem, state, schedule, precise address, XP, difficulty, next action,
  and full-card Quest navigation.
- Expanded Community Challenge with current progress, rules, reward, and the
  single Profile Settings community-change path.

### Passport

- Reworked the XP progress side of the identity header to match the Make
  label/value/bar/remaining composition.
- Added explicit category quest targets:
  Restore 3, Wildlife 1, Waste 3, Grow 3, Observe 2, and Learn 3.
- Rebuilt Community challenge participation as Make-style horizontal history
  rows with community media, current/historical state, verified Quest count,
  challenge count, verified XP, award count when present, and detail action.
- Replaced the duplicate community selector with a Profile Settings entry;
  Profile Settings is the one primary Home Community control.
- Restored Completion History to the Make composition: heading/share action,
  status pills, six circular category filters, responsive two-column cards,
  Quest cover image, verified/self-reported overlay, XP or Passport-only
  state, category and earned-achievement badges, and per-completion Share.
- Extended the authenticated read-only Passport history contract with the
  Quest cover and achievement names linked to the authoritative XP
  transaction. The Share builder loads the complete paginated history and
  opens on the selected verified completion, including targets after the first
  50 records.
- Replaced the six approximate category-progress palette classes with the
  exact Make fills used by their matching emblems: `#2F8F5B`, `#3C72C9`,
  `#C74444`, `#6C8F2F`, `#6C63D9`, and `#C963D9`.

### Leaderboard

- Restored People/Communities segmented-tab icon and text alignment.
- Replaced ordinary top-three cards with a Make-style 2–1–3 podium for both
  People and Communities.
- Added gold/silver/bronze medal artwork, identity tiles, wider colored stages,
  rank numbers, metrics, and two-line long-name wrapping.
- Preserved the existing 900 px content width.
- Rebuilt Communities as podium plus comparison table.
- Corrected aggregation semantics:
  Auckland compares Local Area communities; New Zealand compares
  Administrative Area cities.

### City, community, navigation, and settings

- Added `type=AdministrativeArea` to the existing Regions read API and reused
  the accepted Country → Administrative Area → Local Area schema.
- Added separate City and Community controls to Discover. Selecting a City
  uses the existing descendant-aware Quest location query.
- Added `/settings/profile` as the single Home Community and Passport
  visibility control.
- Made primary navigation labels non-wrapping, hides their icons at constrained
  desktop widths, and keeps the XP/level phrase indivisible.

### Development data

- Added an idempotent Development-only activity graph for the nine accepted
  demo personas.
- Derived completion activity from the current UTC/Auckland period rather than
  a fixed calendar date. Existing fixture awards are rebased by their stable
  `(UserId, QuestId)` key, so weekly/monthly views remain inspectable without
  duplicating XP or inflating profile totals on restart.
- Persisted verified completions, XP transactions, progression, a five-week
  streak for the primary persona, active Mission Board state, community
  attribution, and active challenges.
- Derived challenges from the current Auckland month and assigned stable
  community/month identifiers. Re-running in the same month is record-count
  idempotent; advancing the clock closes the prior demo challenge and creates
  one current challenge without displacing administrator-created challenges.
- Added passwordless, roleless supporting neighbours so demo community boards
  pass the accepted ten-contributor privacy threshold without creating extra
  login accounts.
- Added Development-only Wellington and Christchurch Administrative Areas and
  local communities so the New Zealand city leaderboard can visibly render
  multiple cities after the API restarts.
- Kept demo account seeding independent. Demo activity runs only when both demo
  accounts and demo Quests are enabled.
- Prevented untracked developer-local demo flags from leaking into isolated
  seed/API test factories.

### Environmental image placeholders

- Added one shared Quest-image resolver for real uploaded images and all
  placeholder states.
- Preserved real non-placeholder Quest images as the first choice.
- Replaced repository demo SVG covers with the environmental photographs
  selected by the Figma Make prototype, mapped by Quest category.
- Added stable title-derived `picsum.photos` URLs as the network fallback and
  retained the repository fallback SVG as the final offline/error state.
- Applied the resolver to Landing Community Challenge media, Discover cards,
  Quest Detail hero/gallery/thumbnails, My Quests rows, Google Maps Quest
  popovers, Passport Completion History, and Community participation.
- Requested surface-appropriate image sizes: small square community media,
  compact map/history images, 800 × 440 cards, and larger detail/gallery
  crops.

### XP and Level colour parity

- Restored the Make amber palette for the compact navigation status capsule
  and all visible XP reward pills: amber 50/200/700 in light mode and amber
  900/700/300 in dark mode.
- Kept ordinary Level/rank labels in primary or foreground colours, including
  the clickable My Quests Player Status level.
- Replaced the Passport yellow progress element with the Make neutral track
  and primary-to-emerald gradient while retaining the authoritative
  within-level values and progressbar semantics.
- Removed hard-coded white XP/Level copy from primary-colour Passport and
  completion-reward surfaces so both themes use `primary-content`.
- Restored the amber reward-panel treatment on Quest Detail.

### Complete Figma colour parity

- Replaced the approximate theme values with the exact Make light palette:
  `#F8FBF4`, `#183026`, `#FFFFFF`, `#EEF5EC`, `#5A7A65`, `#2F8F5B`,
  `#F4B740`, `#C74444`, and `#D5E3D7`.
- Replaced the approximate dark values with the exact Make palette:
  `#13211B`, `#F2F7F3`, `#1B2C24`, `#22372D`, `#9DB5A4`, `#6FD69A`,
  `#FFD166`, `#FF8B8B`, and `#365144`.
- Added first-class muted and muted-content utilities and replaced
  opacity-derived secondary copy with the exact theme-specific muted
  foreground.
- Synchronized the root `.dark` class with the selected theme. This corrected
  the observed mixed-theme defect where selecting Light still left Tailwind
  `dark:` colours active on systems using dark appearance.
- Restored the exact Make category, difficulty, Quest source, registration,
  discovery-highlight, claim, completion-state, XP, and leaderboard podium
  palettes.
- Restored the Make landing-map surface, road, water, and marker colours.
- Corrected remaining primary-colour content and the Player Status streak
  hover state for both themes.
- Retained intentional artwork/canvas colours, photographic overlays, the
  Google Maps white InfoWindow palette, and the modal scrim because these are
  content surfaces rather than application theme tokens.

## Files changed

Backend production:

- `backend/src/Kiwimpact.Api/Contracts/PassportContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/RegionsController.cs`
- `backend/src/Kiwimpact.Api/Mapping/DtoMapping.cs`
- `backend/src/Kiwimpact.Api/Program.cs`
- `backend/src/Kiwimpact.Core/Repositories/IRegionReadRepository.cs`
- `backend/src/Kiwimpact.Core/Services/IRegionReadService.cs`
- `backend/src/Kiwimpact.Core/Services/PassportModels.cs`
- `backend/src/Kiwimpact.Core/Services/RegionReadService.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoActivitySeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/LeaderboardRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/PassportRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/RegionReadRepository.cs`

Backend tests:

- `backend/tests/Kiwimpact.IntegrationTests/Api/CustomWebApplicationFactory.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/LeaderboardsApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/PassportApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/RegionsApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Api/PassportMappingTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/QuestDiscoveryValidationTests.cs`

Frontend production:

- `frontend/src/app/AppShell.tsx`
- `frontend/src/app/ErrorBoundary.tsx`
- `frontend/src/app/router.tsx`
- `frontend/src/components/BrandMark.tsx`
- `frontend/src/components/PlayerStatusCapsule.tsx`
- `frontend/src/components/PlayerStatusSummary.tsx`
- `frontend/src/components/RequireAuth.tsx`
- `frontend/src/components/community/CommunityChallengesSection.tsx`
- `frontend/src/components/community/CommunityProfileCard.tsx`
- `frontend/src/components/community/WeeklyStreakCard.tsx`
- `frontend/src/components/game/GameArtwork.tsx`
- `frontend/src/components/maps/CoordinatePicker.tsx`
- `frontend/src/components/maps/QuestMap.tsx`
- `frontend/src/components/organizer/CompletionCodeSection.tsx`
- `frontend/src/components/organizer/ConfirmActionDialog.tsx`
- `frontend/src/components/organizer/QuestForm.tsx`
- `frontend/src/components/organizer/RequireManagementAccess.tsx`
- `frontend/src/components/passport/AchievementCard.tsx`
- `frontend/src/components/passport/AchievementsSection.tsx`
- `frontend/src/components/passport/CategoryImpactSection.tsx`
- `frontend/src/components/passport/CommunityParticipationSection.tsx`
- `frontend/src/components/passport/CompletionHistoryItem.tsx`
- `frontend/src/components/passport/CompletionHistoryList.tsx`
- `frontend/src/components/passport/LevelProgress.tsx`
- `frontend/src/components/passport/NextMilestoneCard.tsx`
- `frontend/src/components/passport/PassportSummaryCard.tsx`
- `frontend/src/components/passport/ShareCard.tsx`
- `frontend/src/components/quest/QuestCompletionMethods.tsx`
- `frontend/src/components/quest/QuestCompletionPanel.tsx`
- `frontend/src/components/quest/QuestImage.tsx`
- `frontend/src/components/quest/QuestCard.tsx`
- `frontend/src/components/quest/TrustedCompletionPanel.tsx`
- `frontend/src/hooks/useCommunity.ts`
- `frontend/src/hooks/useRegions.ts`
- `frontend/src/index.css`
- `frontend/src/lib/questPresentation.ts`
- `frontend/src/lib/questImages.ts`
- `frontend/src/lib/theme.ts`
- `frontend/src/lib/api/regions.ts`
- `frontend/src/lib/validation/passportDto.ts`
- `frontend/src/pages/AdminReviewPage.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/LeaderboardPage.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/MyQuestsPage.tsx`
- `frontend/src/pages/NotFoundPage.tsx`
- `frontend/src/pages/OrganizerQuestCreatePage.tsx`
- `frontend/src/pages/OrganizerQuestEditPage.tsx`
- `frontend/src/pages/OrganizerQuestListPage.tsx`
- `frontend/src/pages/PassportPage.tsx`
- `frontend/src/pages/ProfileSettingsPage.tsx`
- `frontend/src/pages/QuestListPage.tsx`
- `frontend/src/pages/QuestDetailPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/ShareCardBuilderPage.tsx`
- `frontend/src/types/passport.ts`

Frontend tests:

- `frontend/tests/integration/AuthSessionBoundary.test.tsx`
- `frontend/tests/integration/HomeMemberMomentum.test.tsx`
- `frontend/tests/integration/LeaderboardPage.test.tsx`
- `frontend/tests/integration/MyQuestsPage.test.tsx`
- `frontend/tests/integration/PassportPage.test.tsx`
- `frontend/tests/integration/QuestListPage.test.tsx`
- `frontend/tests/integration/ShareCardBuilderPage.test.tsx`
- `frontend/tests/unit/passportDto.test.ts`
- `frontend/tests/unit/questPresentation.test.ts`
- `frontend/tests/unit/shareCard.test.ts`
- `frontend/tests/unit/theme.test.ts`
- `frontend/tests/unit/questImages.test.ts`

Evidence and records:

- `specs/implementation/19-figma-deep-parity-and-demo-activity.md`
- `specs/ai/prompts/70-slice-19-figma-deep-parity-and-demo-activity.md`
- `specs/ai/prompts/71-slice-19-completion-history-figma-parity.md`
- `specs/ai/prompts/72-slice-19-category-progress-figma-colours.md`
- `specs/ai/prompts/73-slice-19-environmental-image-placeholders.md`
- `specs/ai/prompts/74-slice-19-xp-level-colours.md`
- `specs/ai/prompts/75-slice-19-complete-figma-colour-audit.md`
- `specs/ai/reviews/70-slice-19-figma-deep-parity-and-demo-activity-k3-review.md`
- `specs/ai/reviews/71-slice-19-completion-history-k3-review.md`
- `specs/ai/reviews/72-slice-19-category-progress-colours-k3-review.md`
- `specs/ai/reviews/73-slice-19-complete-colour-audit-k3-review.md`
- `specs/implementation/reports/19-figma-deep-parity-and-demo-activity-completion.md`

## Verification

Observed after the final code and test changes:

| Command or check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run` | Passed on final clean sequential rerun: 46 files, 347 tests |
| `npm run build` | Passed; existing main-chunk size advisory remains |
| `dotnet build Kiwimpact.slnx` | Passed; 0 warnings, 0 errors |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 250 tests |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Passed: 307 tests |
| Focused Completion History frontend tests | Passed: 4 files, 35 tests |
| Focused Passport category-colour test | Passed: 1 file, 20 tests |
| Focused XP/Level colour regressions | Passed: 3 files, 32 tests |
| Focused theme and semantic-colour regressions | Passed: 8 files, 61 tests |
| Focused Passport mapping tests | Passed: 2 tests |
| Focused Passport API tests | Passed: 20 tests |
| Isolated Organizer create test after the first concurrent full-run timeout | Passed: 1 file, 4 tests |
| Focused Region and Leaderboard API tests | Passed: 32 tests |
| Focused dynamic demo-activity seed test | Passed: 1 test against PostgreSQL |
| `git diff --check` | Passed |
| Existing API People leaderboard | 30 persisted participants observed |
| Existing API Auckland Communities board | Albert-Eden 23, Henderson-Massey 23, Waitematā 21 observed |
| Existing API Community Challenges | Three visible active 50-action challenges observed |
| Browser — People leaderboard | 2–1–3 medals, identity, XP, colored stages, and table observed |
| Browser — Communities leaderboard | 2–1–3 community medals/stages plus comparison table observed |
| Browser — Passport community participation | Henderson-Massey row showed 5 verified Quests, 1 challenge, and 500 XP |
| Browser — navigation | `My Quests` and `500 XP · Lv 7` rendered as indivisible phrases |
| Browser — Landing desktop | Hero map, member momentum, Community Goal, and green Impact Passport band observed at 1280 px |
| Browser — My Quests desktop | Player Status, challenge panel, ready-to-complete mission row, and Passport preview observed at 1280 px |
| Browser — Passport desktop | Identity/XP, category goals, participation history, settings, and completion history observed at 1280 px |
| Browser — 390 px responsive | Landing, My Quests, Passport, and stacked Community participation observed with `scrollWidth == innerWidth == 390` |
| Browser — Completion History desktop | Two-column image cards, status/XP/category/achievement badges, and Share actions observed |
| Browser — Completion History mobile | One-column cards observed at 390 × 844 without horizontal overflow |
| Browser — Completion History filter | Observe & Measure filter retained only its two matching completions |
| Browser — Quest category progress | All six exact Figma HEX classes observed; desktop and 390 px mobile rendering remained intact |
| Browser — Discover images | Six category-mapped Figma environmental photographs loaded at 800 × 440; no repeated repository default artwork was shown |
| Browser — Quest Detail images | Hero loaded at 1600 × 840 and gallery at 1440 × 864 with the shared environmental fallback |
| Browser — Passport images | Community participation and completion-history image sources used the shared resolver; below-fold history remained lazy-loaded |
| Browser — XP/Level light theme | Navigation `500 XP · Lv 7`, Passport identity copy, XP summary, and green progress gradient observed |
| Browser — XP/Level dark theme | Amber navigation capsule, inherited dark primary-content, and green progress gradient observed |
| Browser — Discover XP pills | Amber reward pills observed on environmental Quest images in dark mode |
| Browser — complete colour audit, light | Landing and Discover exact theme surfaces, muted copy, category chips, highlights, difficulty/source tags, XP pills, and placeholder map observed |
| Browser — complete colour audit, dark | Landing, Discover, My Quests, Passport, Leaderboard, Quest Detail, and Share Card observed with exact dark surfaces and semantic palettes |
| Browser — manual theme authority | Selecting Light on a system-dark environment removed every Tailwind dark variant; selecting Dark restored them consistently |

## Known limitations

- The source design is a Figma Make file, which does not expose a Design-mode
  node to the Figma design-context API. The checked-in runnable source remains
  the exact reference.
- The local backend on port `5091` was restarted with the final additive
  executable before Completion History browser verification.
- Wellington/Christchurch rows are Development-only visual-test fixtures, not
  a claim that the MVP contains a complete authoritative New Zealand locality
  directory.
- No Google Places autocomplete, bulk postal-address import, role, dependency,
  or schema migration was added.
- Environmental photographs and Picsum placeholders require network access;
  the repository SVG remains the final fallback when both services fail.
- The production frontend bundle still emits the existing over-500-kB advisory.
- Exact Figma parity preserves `#5A7A65` small muted text on the `#EEF5EC`
  secondary surface. K3 measured this combination at approximately 4.29:1,
  slightly below the 4.5:1 WCAG AA target for ordinary small text. Correcting
  it requires an explicit future decision to depart from the Make colour.

## Review status

K3's first read-only review reported:

1. Discover lost the selected City when Community returned to
   `All communities in city`.
2. Fixed seed dates would eventually make weekly/monthly data and challenges
   unobservable.

Both prior Major findings are corrected and covered by targeted regressions.
The prior K3 targeted closure result was **Blocker 0 / Major 0 / Minor 0**.
The additive Completion History review found one Major Share deep-link
pagination boundary and one strict-validator Minor. The Builder now loads all
Passport pages, a page-two target regression passes, and achievement names
fail closed unless the record has Verified status and authoritative XP. K3's
targeted closure result is **Blocker 0 / Major 0 / Minor 0** and the complete
Completion History increment is **Ready to commit**. The later category-colour
increment received **Blocker 0 / Major 0 / Minor 0** in focused K3 review, so
the complete Slice was Ready to commit. The final complete-colour audit
received **Blocker 0 / Major 0 / Minor 1**. The non-blocking Minor is the
inherited 4.29:1 small muted-text contrast described under Known limitations;
no broad colour replacement error was found. The complete Slice remains
**Ready to commit**.
