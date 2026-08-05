# Slice 29 — Community Posts Product Correction Completion Report

## Status

Production implementation, the approved additive migration, automated
verification, real-browser verification, the product-owner-requested Kimi K3
review, one concentrated correction pass, and the same K3 session's targeted
Major closure are complete. No original Blocker or Major remains open.

After the original uncommitted worktree was removed by temporary-directory
cleanup, the final reviewed patch sequence was recovered from the Codex task
record onto the persistent `feat/community-posts-v2-rebuild` branch. The
applicable automated gates were rerun against the recovered files on
2026-08-05; the current results below supersede the earlier intermittent full-
suite observation.

The product owner then corrected Related Quest from required to optional but
strongly recommended. That delta is implemented without another migration:
`QuestId` was already nullable, unlinked writes now persist null, and a supplied
Quest must still exist and be Published.

## Implemented scope

- Replaced the permanently visible Community composer with one `New post`
  button and a controlled responsive dialog: mobile bottom sheet and desktop
  modal, including Escape/backdrop close, pending protection, focus return,
  visible validation, and retry state.
- Added required post title plus an optional but strongly recommended related
  Quest. The composer searches Published Quests without blocking unlinked
  publishing, and the backend independently rejects a supplied non-existent or
  non-Published Quest.
- Added zero to nine ordered HTTPS image URL plus alternative-text pairs with
  previews, add/remove controls, and backend-authoritative validation.
- Added up to ten bounded tags with case-insensitive per-post deduplication.
- Expanded case-insensitive search to title, body, tags, related Quest title,
  and author display name while preserving URL-owned search and newest-first
  bounded paging.
- Added public/`Only me` published visibility at creation and author-only
  visibility switching afterward. Hidden posts remain visible to their author
  but are absent for guests/other users and fail closed as not found at the
  like/comment boundaries.
- Added author-only permanent deletion with a confirmation dialog and cascade
  cleanup of images, tags, likes, and comments.
- Added an image-first card layout with prominent title, related-Quest card,
  body, tags, author management controls, existing likes, and existing
  two-level comments.
- Added a multi-image carousel with native horizontal overflow, mandatory CSS
  scroll snap, touch/swipe support, previous/next controls, position dots, and
  a current/total counter. It does not autoplay.
- Expanded the dependency-free masonry feed to responsive one/two/three/four
  column layouts and retained IntersectionObserver incremental loading with a
  manual fallback.
- Added an additive EF Core migration for `Title`, nullable legacy `QuestId`,
  `IsHidden`, `SocialPostImages`, and `SocialPostTags`. Existing content is
  preserved as a bounded title, existing image metadata is copied to image
  position zero, existing posts stay public, and no Quest is invented for
  legacy rows.
- Preserved the HttpOnly cookie, antiforgery, role authorization, private-cache
  cleanup, actor-partitioned rate limits, neutral missing-profile display name,
  bounded comments, and non-disclosure of internal user identifiers.
- Corrected per-card delete-dialog heading IDs so multiple masonry cards do not
  create duplicate ARIA identifiers.

## Files changed

### Backend production and migration

- `backend/src/Kiwimpact.Api/Contracts/SocialFeedContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/SocialPostsController.cs`
- `backend/src/Kiwimpact.Core/Entities/SocialPost.cs`
- `backend/src/Kiwimpact.Core/Entities/SocialPostImage.cs`
- `backend/src/Kiwimpact.Core/Entities/SocialPostTag.cs`
- `backend/src/Kiwimpact.Core/Repositories/ISocialFeedRepository.cs`
- `backend/src/Kiwimpact.Core/Services/ISocialFeedService.cs`
- `backend/src/Kiwimpact.Core/Services/SocialFeedModels.cs`
- `backend/src/Kiwimpact.Core/Services/SocialFeedService.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/SocialPostConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/SocialPostImageConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/SocialPostTagConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260804154624_ExpandSocialPostsForQuestStories.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260804154624_ExpandSocialPostsForQuestStories.Designer.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/SocialFeedRepository.cs`

### Backend tests

- `backend/tests/Kiwimpact.UnitTests/Core/SocialFeedDomainTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/OpenApiOperationTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/SocialFeedApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs`

### Frontend production and tests

- `frontend/src/components/social/SocialPostCard.tsx`
- `frontend/src/components/social/SocialPostComposer.tsx`
- `frontend/src/components/social/SocialPostDeleteDialog.tsx`
- `frontend/src/components/social/SocialPostImageCarousel.tsx`
- `frontend/src/hooks/useSocialFeed.ts`
- `frontend/src/lib/api/social.ts`
- `frontend/src/lib/validation/socialDto.ts`
- `frontend/src/pages/CommunityPage.tsx`
- `frontend/src/types/social.ts`
- `frontend/tests/integration/CommunityPage.test.tsx`

### Specifications and evidence

- `specs/architecture/02-core-domain-data-model.md`
- `specs/architecture/03-api-contract.md`
- `specs/product/04-phase-2-delivery-scope.md`
- `specs/implementation/25-social-posts-feed.md`
- `specs/implementation/29-community-posts-product-correction.md`
- `specs/ai/prompts/85-community-posts-product-correction.md`
- `specs/implementation/reports/29-community-posts-product-correction-completion.md`
- `specs/ai/reviews/81-community-posts-product-correction-k3-review.md`

## Verification commands and observed results

### Focused implementation checks

| Command or check | Observed result |
| --- | --- |
| Focused social domain unit selection | Passed: 10 of 10 tests |
| Focused `SocialFeedApiTests` selection | Passed: 8 of 8 tests |
| Focused migration/OpenAPI selection | Passed: 3 of 3 tests |
| `npm run test -- --run tests/integration/CommunityPage.test.tsx` | Passed: 1 file, 9 tests |
| `npm run lint` after the final ARIA-ID correction | Passed |
| `npm run type-check` after the final ARIA-ID correction | Passed |
| Focused Community test after the final ARIA-ID correction | Passed: 9 of 9 tests |
| Migration application to isolated temporary PostgreSQL | Passed; all migrations, including `ExpandSocialPostsForQuestStories`, applied successfully |

### Focused checks after K3 correction

| Command or check | Observed result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run tests/integration/CommunityPage.test.tsx` | Passed: 1 file, 10 tests |
| `dotnet build Kiwimpact.slnx` | Passed: 0 errors; 5 existing EF1002 warnings in unrelated integration-test source |
| Focused `SocialFeedApiTests` selection | Passed: 8 of 8 tests |
| Focused `MigrationSmokeTests` selection | Passed: 4 of 4 tests, including first-image preservation on downgrade |
| `git diff --check` | Passed |

### Optional Related Quest correction

| Command or check | Observed result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run tests/integration/CommunityPage.test.tsx` | Passed: 1 file, 11 tests |
| Focused social domain unit selection | Passed: 10 of 10 tests |
| Focused `SocialFeedApiTests` selection | Passed: 8 of 8 tests; null Quest accepted and supplied Draft/nonexistent Quests rejected |
| `dotnet build Kiwimpact.slnx` | Passed: 0 errors; 5 existing EF1002 warnings in unrelated integration-test source |
| `git diff --check` | Passed |

### Applicable complete gates

| Command or check | Observed result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run` | Passed: 49 files, 393 tests |
| `npm run build` | Passed; Vite retained the existing main-chunk size advisory |
| `dotnet build Kiwimpact.slnx` | Passed: 0 errors; 5 existing EF1002 warnings in unrelated integration-test source |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 307 tests |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Passed: 342 tests |
| `git diff --check` | Passed before evidence generation and again after review/corrections |

The initial recovery run repeated the focused Community test (10/10), social
API selection (8/8), migration smoke selection (4/4), social domain selection
(10/10), lint, type-check, and diff whitespace check successfully. The later
optional-Quest correction increased the focused Community coverage to 11/11
and the complete frontend count to 393/393; the full backend counts remained
307/307 unit and 342/342 integration tests.

## Real-browser evidence

Browser verification used an isolated temporary PostgreSQL container, the
current migration, current backend, current Vite application, and a seeded test
account. The one test post was deleted through the UI; the database container
and both development processes were stopped afterward. No user database was
modified.

| View or behavior | Observation |
| --- | --- |
| Guest Community | Rendered public search and a sign-in-to-create link; no permanent composer was visible |
| Signed-in entry | Rendered one `New post` button; activating it opened the responsive creation dialog |
| Complete publish | Selected `Backyard Biodiversity Challenge`, entered title/body, added two HTTPS image/alt pairs and `#biodiversity`, and published successfully |
| Feed card | Rendered the title, linked Quest summary, body, tag, two-image counter/dots, like boundary, comments, hide, and delete controls |
| Carousel controls | `Next image` changed `1 / 2` to `2 / 2` and exposed `Previous image`; returning changed it back to `1 / 2` |
| Carousel mechanics | Observed two images, `overflow-x: auto`, `scroll-snap-type: x mandatory`, client width 295 px, and scroll width 590 px |
| Hidden privacy | Hiding displayed `Only you`; after sign-out, the guest feed returned the empty state. Signing in again showed the hidden post to its author and allowed restoration to public |
| Search | Searching `biodiversity` updated the URL to `/community?q=biodiversity` and retained the matching post |
| Deletion | Opened the title-specific confirmation dialog, permanently deleted the post, and observed zero cards plus the empty state |
| Mobile Community | At 375 × 812, document client width and scroll width both equalled 375; no horizontal overflow |
| Mobile composer | Bottom-sheet width was exactly 375 px, stayed within the viewport, exposed internal scrolling and sticky publish/cancel actions |

Repeated navigation/reload cancelled some existing leaderboard SignalR
negotiations in the Vite console. Social HTTP operations all completed
successfully and the Community observations above were unaffected.

## Known limitations

- Draft save/resume is not implemented. This is the one feature the product
  owner explicitly allowed to be deferred.
- Images remain URL-based and load directly from their HTTPS origins. Binary
  upload, object storage, proxying, moderation, and URL availability guarantees
  are outside this Slice.
- Posts may have no related Quest. The composer strongly recommends the
  relationship but permits publishing without it.
- When supplied, a Quest is checked as Published when a post is created. Its
  relationship is retained as historical post context if the Quest later
  changes status.
- Hiding preserves existing likes/comments while making the post and those
  operations unavailable to non-authors; restoring makes that engagement
  visible again.
- Rolling the migration down necessarily drops title, Quest, tag, and
  visibility fields that the legacy schema cannot represent. The rollback now
  copies ordered image position zero back to the legacy image columns before
  dropping the multi-image table; additional images cannot survive a downgrade.
- Post editing, comment editing/deletion, public profiles, follows, friends,
  chat, notifications, realtime social updates, and recommendation ranking are
  not implemented.
- Vite retains its existing main-chunk size advisory.

## Review status

The product-owner-requested independent review used Kimi K3 through the
configured Kimi Code CLI. The reviewer made no file changes.

Initial K3 result:

- Blocker: 0
- Major: 1 — a legal 120-character unbroken title could overflow a masonry card
- Minor: 11
- Verdict: **CHANGES REQUESTED**

One concentrated correction pass closed the Major and addressed nine of the
eleven Minor observations in code/tests or migration behavior. Two Minors were
resolved as explicit product semantics rather than code defects: related Quest
context remains historical after later Quest lifecycle changes, and hiding a
post preserves existing engagement behind the fail-closed non-author boundary.

The same K3 session then performed the only targeted closure check, limited to
the original Major:

- Blocker: 0 open
- Major: 0 open
- M1: **CLOSED**
- Targeted closure verdict: **APPROVED**

The recovered branch received a bounded read-only K3 recovery-integrity
confirmation: parity confirmed, M1 closed, no original Blocker/Major correction
missing, and targeted recovery verdict approved.

The later optional-Quest product delta received its own bounded read-only K3
review: 0 Blocker, 0 Major, 2 Minor, **APPROVED WITH MINORS**. Both Minors were
corrected in the single concentrated pass and the affected social API selection
passed 8 of 8. No Blocker/Major closure check was required. Slice 29 is ready
for a commit decision.
