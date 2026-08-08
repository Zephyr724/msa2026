# Community masonry image parity — completion report

- **Status:** Implementation and focused verification complete
- **Date:** 2026-08-08
- **Branch:** `fix/community-masonry-images`
- **Database migration:** Not required

## Implemented scope

- Retained the accepted intrinsic-ratio rule: sources from `0.76` through
  `4:3` render completely, while only narrower portraits and extra-wide
  landscapes are bounded with `object-cover`.
- Removed the image-level hover scale so images do not lose their edges during
  hover.
- Changed the Detail image carousel to `object-contain`, so the opened image
  shows the complete source frame instead of cropping it to the fixed media
  pane. The feed's accepted `0.76`/`4:3` bounding rule remains separate and
  unchanged.
- Replaced the remote Community showcase set with 24 deployment-bundled JPEGs:
  six square, six near-square, six landscape, and six portrait images.
- Added one shared catalogue and production-post assignment. All 24 images
  occur exactly once across the 20 production assessment posts.
- Made Development use the same 24-URL catalogue. The 44 Development posts now
  contain 47 image occurrences rather than 90, reducing repeated media while
  retaining the text-only, multi-image, ratio-boundary, and long-story cases.
- Made production assessment seed reconcile media on existing deterministic
  posts while preserving reviewer-edited copy, tags, Quest relation,
  visibility, timestamps, likes, and comments. Development already reconciled
  deterministic rows.

## Files changed

- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/CommunityStoryImageCatalog.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/AssessmentDataSeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/AssessmentSocialSeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoSocialSeed.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`
- `frontend/src/components/social/SocialPostCard.tsx`
- `frontend/tests/integration/CommunityPage.test.tsx`
- `frontend/public/images/community/` — 24 generated JPEG assets
- `specs/ai/prompts/101-community-masonry-image-parity.md`
- `specs/implementation/reports/53-community-masonry-image-parity-completion.md`

## Verification commands and observed results

- `dotnet build tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-restore -m:1 -v:minimal` — passed with 0 errors and five pre-existing EF1002 warnings.
- Focused PostgreSQL seed tests for production assessment accounts, production
  idempotency, and Development activity — passed 3/3.
- `npm run test -- --run tests/unit/socialCoverRatio.test.ts tests/integration/CommunityPage.test.tsx` — passed 16/16 across 2 files. jsdom printed its existing `HTMLMediaElement.play()` not-implemented notice.
- `npm run type-check` — passed.
- After the product-owner clarification, `npm run test -- --run
  tests/integration/CommunityPage.test.tsx` — passed 10/10.
- `git diff --check` — passed.
- Pre-change browser inspection measured the existing square fixture at
  `1254×1254` rendered as `237×237`, and exposed the image-level hover-scale
  class plus the production catalogue's lack of square/near-square sources.
- The reported wetland image was measured directly at `1120×1400` (4:5). Its
  Detail view now preserves that complete portrait frame.

## Known limitations

- At the product owner's request, full frontend/backend gates and post-change
  browser verification were not run; the product owner will perform final
  environment verification.
- The shared fixed HTTPS fixture host is resolved by the existing narrow
  frontend resolver to same-origin bundled assets. User-supplied HTTPS URLs are
  unchanged.
- Unrelated UI-sound work was present concurrently in the working tree and was
  preserved outside this task's scope.

## Review status

Implementation-owner diff inspection completed. No independent review was
requested for this bounded media/presentation correction. The task is not
staged or committed.
