# Community free-stock image replacement — completion report

- **Status:** Implementation and focused verification complete
- **Date:** 2026-08-08
- **Branch:** `fix/community-free-stock-images`
- **Database migration:** Not required

## Implemented scope

- Replaced all 24 visually repetitive generated Community JPEG fixtures with
  24 distinct Pexels stock photographs; no image-generation tool was used.
- Selected varied environmental-action subjects including planting, clean-up,
  wetland habitat, water fieldwork, recycling, composting, nature observation,
  and conservation volunteering.
- Kept the existing deterministic local filenames and shared production/
  Development seed catalogue, so existing seed reconciliation continues to
  update deterministic posts without a schema change.
- Remapped the production stories so each stock photo is used once and is
  paired as closely as possible with its story subject; four suitable stories
  retain two-photo carousels and the other sixteen use one photo.
- Corrected the Development feed after visual feedback exposed that its 44
  seeded posts still reused the shared catalogue. Added 23 more Pexels photos,
  bringing the bundled Community directory to 47 distinct JPEG files.
- Removed the failed Quest SVG substitution completely. Development seed cards
  now use 43 unique photo URLs plus one intentional text cover; no image URL is
  repeated across the 44 deterministic Development posts.
- Assigned photographs by subject across the shape fixtures, 20 short showcase
  stories, and 20 long Community stories. Existing deterministic rows are
  reconciled on startup, so stale database mappings are replaced without
  deletion.
- Updated every catalogue alt description to describe the replacement photo.
- Added a per-file photographer and Pexels source register plus the Pexels
  licence link. The register explicitly labels the photos as illustrative
  rather than documentation of the fictional stories or Quests.

## Files changed

- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/CommunityStoryImageCatalog.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoSocialSeed.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`
- `frontend/public/images/community/README.md`
- `frontend/public/images/community/*.jpg` (24 replaced assets)
- `specs/ai/prompts/115-community-free-stock-image-replacement.md`
- `specs/implementation/reports/56-community-free-stock-image-replacement-completion.md`

## Verification commands and observed results

- SHA-256 duplicate scan over `frontend/public/images/community/*.jpg` — no
  duplicate hashes found across the 24 replacement assets.
- Visual spot-check of planting, recycling, wildlife observation, and litter
  clean-up replacements — all four files opened successfully and matched their
  recorded descriptions.
- `npm run test -- --run tests/integration/CommunityPage.test.tsx
  tests/unit/socialCoverRatio.test.ts tests/unit/socialTextCoverFit.test.ts` —
  passed 18/18 across three files. jsdom printed its existing
  `HTMLMediaElement.play()` not-implemented notice.
- `npm run type-check` — passed.
- `dotnet build tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj
  --no-restore -m:1 -v:minimal` — passed with 0 errors and five pre-existing
  EF1002 warnings.
- Focused production insert/idempotency and Development activity seed tests —
  passed 3/3 after the final story-to-image remapping.
- Follow-up Development seed test after enforcing URL uniqueness — passed 1/1;
  the test now requires 43 image occurrences, 43 distinct URLs, and one
  intentional text-cover post.
- Restarted the actual local backend on port 5091 and observed successful
  Development seed reconciliation against the existing local database.
- Browser verification at `http://localhost:5173/community` after loading the
  full feed observed 44 rendered images, 44 distinct image URLs, zero duplicate
  URLs, and zero SVG image sources. The additional rendered image belongs to
  non-seed local feed content; it was also unique. Visual inspection confirmed
  real photographs rather than the failed green SVG covers.
- `git diff --check` — passed.

## Known limitations

- Pexels photography is illustrative stock imagery and may not depict New
  Zealand, the fictional author, or the named Quest. The UI alt text and source
  register do not claim otherwise.
- Unrelated pre-existing and concurrent working-tree changes were preserved and
  are outside this task's scope.

## Review status

Implementation-owner diff inspection completed. This bounded media replacement
does not have an independent review record.
