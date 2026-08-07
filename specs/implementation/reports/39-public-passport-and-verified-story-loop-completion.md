# Public Passport and Verified Story Loop Completion

- **Date:** 2026-08-07
- **Branch:** `codex/feat/member-loop-gamification`
- **Specification:** `specs/implementation/36-public-passport-and-verified-story-loop.md`
- **Prompt:** `specs/ai/prompts/98-public-passport-and-verified-story-loop.md`
- **Risk:** Important (anonymous privacy boundary, provenance, and additive schema change)
- **Status:** Complete; correction gates and targeted K3 closure passed

## Implemented scope

- Added a Private-by-default public Passport setting with an explicit opt-in,
  stable non-enumerable share identifier, disable/re-enable behavior, copy and
  preview actions, and ordered selection of up to five earned achievements.
- Added an anonymous purpose-built Passport endpoint and page exposing only
  display name, verified aggregates, level/rank, trophy rarity, selected earned
  achievements, and a bounded set of public provenance-backed stories. Home
  Community, user/completion IDs, evidence, self-reports, complete history, and
  private or hidden stories remain excluded.
- Added server-enforced immutable completion provenance to social posts. Create
  validates that the completion is Verified, owned by the actor, and belongs to
  the selected Quest. Updates cannot move or remove the provenance.
- Added the `Verified Quest Story` marker to feed cards, detail, and composer.
  The completion CTA opens a restrained prefilled composer whose Quest is
  locked to the server-verified completion while normal story content remains
  editable.
- Added the stable public route `/p/:shareId` using the existing Passport,
  green/warm-neutral/gold, rounded-panel, and topographic visual language.
- Fixed the global header at 320 px by hiding only the wordmark below 360 px;
  the brand mark and all account/theme actions remain available and the page no
  longer scrolls horizontally.
- Added the approved additive `FeaturedPassportAchievements`, public Passport
  fields, and social-post provenance migration without adding a dependency.

## Files changed

- `backend/src/Kiwimpact.Core/Entities/FeaturedPassportAchievement.cs`
- `backend/src/Kiwimpact.Core/Entities/SocialPost.cs`
- `backend/src/Kiwimpact.Core/Entities/UserProfile.cs`
- `backend/src/Kiwimpact.Core/Repositories/IPublicPassportRepository.cs`
- `backend/src/Kiwimpact.Core/Services/IPublicPassportService.cs`
- `backend/src/Kiwimpact.Core/Services/PublicPassportModels.cs`
- `backend/src/Kiwimpact.Core/Services/PublicPassportService.cs`
- `backend/src/Kiwimpact.Core/Services/ISocialFeedService.cs`
- `backend/src/Kiwimpact.Core/Services/SocialFeedModels.cs`
- `backend/src/Kiwimpact.Core/Services/SocialFeedService.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/FeaturedPassportAchievementConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/SocialPostConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/UserProfileConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs`
- `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/PublicPassportRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/SocialFeedRepository.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260806165503_AddPublicPassportAndVerifiedStories.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260806165503_AddPublicPassportAndVerifiedStories.Designer.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs`
- `backend/src/Kiwimpact.Api/Contracts/PublicPassportContracts.cs`
- `backend/src/Kiwimpact.Api/Contracts/SocialFeedContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/PublicPassportsController.cs`
- `backend/src/Kiwimpact.Api/Controllers/SocialPostsController.cs`
- `backend/src/Kiwimpact.Api/Program.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/PublicPassportApiTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/PublicPassportServiceTests.cs`
- `frontend/src/app/router.tsx`
- `frontend/src/components/BrandMark.tsx`
- `frontend/src/components/passport/PublicPassportSettingsCard.tsx`
- `frontend/src/components/social/SocialPostCard.tsx`
- `frontend/src/components/social/SocialPostComposer.tsx`
- `frontend/src/hooks/usePublicPassport.ts`
- `frontend/src/lib/api/publicPassport.ts`
- `frontend/src/lib/validation/publicPassportDto.ts`
- `frontend/src/lib/validation/socialDto.ts`
- `frontend/src/pages/CommunityPage.tsx`
- `frontend/src/pages/PassportPage.tsx`
- `frontend/src/pages/PublicPassportPage.tsx`
- `frontend/src/pages/SocialPostDetailPage.tsx`
- `frontend/src/types/publicPassport.ts`
- `frontend/src/types/social.ts`
- `frontend/tests/integration/CommunityPage.test.tsx`
- `frontend/tests/integration/PassportPage.test.tsx`
- `frontend/tests/integration/PublicPassport.test.tsx`
- `frontend/tests/unit/publicPassportDto.test.ts`
- `specs/implementation/36-public-passport-and-verified-story-loop.md`
- `specs/ai/prompts/98-public-passport-and-verified-story-loop.md`
- `specs/implementation/reports/39-public-passport-and-verified-story-loop-completion.md`

## Verification observed

- `npm run lint` passed.
- `npm run type-check` passed.
- `npm run test -- --run` passed after the K3 correction pass: 53 files,
  416 tests.
- `npm run build` passed. Vite emitted the existing advisory that the main
  minified JavaScript chunk is larger than 500 kB (849.26 kB; 234.60 kB gzip).
- `dotnet build Kiwimpact.slnx` passed with 5 pre-existing EF1002 warnings
  in integration-test SQL helpers and 0 errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  passed: 316 tests.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  passed after the correction pass: 350 tests.
- Focused Public Passport integration verification passed: 5 tests covering
  Private default, stable link, DTO allow-list, same not-found response,
  disable/re-enable, the five-item API limit, unearned/inactive rejection,
  foreign/non-Verified/mismatched provenance rejection, immutable Quest
  binding, hidden-story exclusion, and public story inclusion.
- Focused Public Passport frontend verification passed: 2 files, 6 tests. It
  covers opt-in, five-item selection behavior, reordering and saved order,
  stable-link copy/preview, the public allow-list page, responsive class
  composition, share fallback, DTO validation, and the not-found surface.
- `dotnet ef migrations has-pending-model-changes ... --no-build` reported:
  `No changes have been made to the model since the last migration.`
- `git diff --check` passed.
- In-app browser inspection used an isolated migrated PostgreSQL database and
  seeded local accounts. The settings surface, stable preview link, anonymous
  public page, light and dark themes, desktop and 320 px layouts, selected
  achievement, and absence of Home Community were observed. At 320 px the
  corrected public page measured `scrollWidth = clientWidth = 320`.
- The browser also observed the Verified Story entry point opening the composer
  with a `Verified Quest Story` marker, locked Quest, and editable prefilled
  title/body. No post was published during the browser check.
- Browser console history contained only Vite development-client negotiation
  messages associated with reload/startup; no application runtime exception
  was observed. Both temporary browser databases and local servers were
  removed/stopped after verification.

## Known limitations

- Public Passport discovery remains link-only. Search, directory, follows,
  comments on Passport, and public Home Community are intentionally excluded.
- The public page shows at most six recent public Verified Quest Stories and
  five explicitly selected achievements; it is not a full history.
- Global icon replacement is intentionally deferred until the three Slices are
  complete, as approved. Existing repository icons are reused here.
- Deployment verification was not performed; this task did not authorize a
  deploy.

## Review status

- Independent Kimi K3 review is recorded in
  `specs/ai/reviews/90-public-passport-and-verified-story-loop-k3-review.md`.
- K3 found no Blocker or production-code authorization bypass. Its two Major
  findings identified missing spec-mandated backend abuse-path and frontend
  settings/public-route test coverage. The one concentrated correction pass
  added that coverage and all applicable gates passed.
- Targeted K3 closure passed: M1-M2 are closed; no Blocker/Major remains.
