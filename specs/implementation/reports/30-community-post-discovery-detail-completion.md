# Slice 30 — Community Post Discovery and Detail Completion Report

## Status

Production implementation, focused verification, applicable complete frontend
gates, backend build/unit gates, and real-browser desktop/mobile verification
are complete. The complete backend integration gate passed 341 of 342 tests;
its one failure is an out-of-scope progression DTO exact-key expectation caused
by concurrent Quest-completion work already present in the shared working tree.
The focused Social API selection passed completely.

Independent Kimi K3 review and the concentrated Minor correction pass are
complete. No Git staging, commit, push, PR update, or merge has been performed.

## Implemented scope

- Replaced the full-content masonry card with a whole-card link containing only
  cover image, bounded title, author, like count, image count, optional hidden
  indicator, and a subordinate optional Related Quest title.
- Removed body, tags, carousel controls, Quest navigation, likes, author
  management, and comments from browsing cards.
- Added `/community/posts/{postId}` with a fail-closed single-post API read.
  Desktop renders a modal-like media/content split; mobile renders a full-screen
  author/media/content sequence with a fixed bottom engagement bar.
- Kept Quest navigation exclusively inside opened post detail.
- Moved likes, visibility, deletion, image carousel, tags, complete body, and
  two-level discussion into post detail.
- Added a URL-owned authenticated `My posts` view backed by `mine=true`; it
  contains only the caller's public and hidden posts and preserves search.
- Moved `New post` out of the header into a persistent right-side floating
  action above the mobile navigation while retaining the existing composer.
- Added author-only inline content editing for roots and replies. The backend
  enforces ownership, hidden-post access, validation, antiforgery, and the
  shared actor-partitioned comment rate limit.
- Added viewer-specific comment/reply `canEdit` projections without exposing
  internal user IDs.
- Added no dependency and no migration.

## Files changed for this Slice

### Backend production

- `backend/src/Kiwimpact.Api/Contracts/SocialFeedContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/SocialPostsController.cs`
- `backend/src/Kiwimpact.Core/Entities/SocialComment.cs`
- `backend/src/Kiwimpact.Core/Repositories/ISocialFeedRepository.cs`
- `backend/src/Kiwimpact.Core/Services/ISocialFeedService.cs`
- `backend/src/Kiwimpact.Core/Services/SocialFeedModels.cs`
- `backend/src/Kiwimpact.Core/Services/SocialFeedService.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/SocialFeedRepository.cs`

### Frontend production

- `frontend/src/app/router.tsx`
- `frontend/src/components/social/SocialComments.tsx`
- `frontend/src/components/social/SocialPostCard.tsx`
- `frontend/src/components/social/SocialPostImageCarousel.tsx`
- `frontend/src/hooks/useSocialFeed.ts`
- `frontend/src/lib/api/social.ts`
- `frontend/src/lib/validation/socialDto.ts`
- `frontend/src/pages/CommunityPage.tsx`
- `frontend/src/pages/SocialPostDetailPage.tsx`
- `frontend/src/types/social.ts`

### Tests and evidence

- `backend/tests/Kiwimpact.IntegrationTests/Api/SocialFeedApiTests.cs`
- `backend/tests/Kiwimpact.UnitTests/Core/SocialFeedDomainTests.cs`
- `frontend/tests/integration/CommunityPage.test.tsx`
- `specs/implementation/30-community-post-discovery-detail.md`
- `specs/ai/prompts/86-community-post-discovery-detail-correction.md`
- `specs/implementation/reports/30-community-post-discovery-detail-completion.md`
- related accepted architecture/product documents

## Verification commands and observed results

| Command or check | Observed result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| Focused Community integration test | Passed: 1 file, 6 tests, including visible like-error rollback/retry |
| `npm run test -- --run` | Passed: 50 files, 396 tests |
| `npm run build` | Passed; existing chunk-size advisory remains |
| `dotnet build Kiwimpact.slnx` | Passed: 0 errors, 0 warnings on final complete-gate build |
| Focused social domain unit selection | Passed: 11 tests |
| `dotnet test ...UnitTests... --no-build` | Passed: 308 tests |
| Focused `SocialFeedApiTests` selection | Passed: 8 tests, including missing-comment PATCH 404 |
| `dotnet test ...IntegrationTests... --no-build` | 341 passed, 1 failed of 342; the failure is `ProgressionApiTests.RedemptionAwardsAtomicallyAndProgressionReflectsItImmediately`, where concurrent out-of-scope completion response changes add `completion` while the exact-key expectation still expects `completedAtUtc` |
| `git diff --check` | Passed before evidence generation |

## Real-browser evidence

Verification used the current Vite app, current Development API, the existing
local PostgreSQL runtime with migrations applied, and four fixed, identifiable
temporary social posts. The posts were deleted after inspection, the API was
stopped, the temporary seed file was removed, and the PostgreSQL container was
returned to its stopped state.

| View or behavior | Observation |
| --- | --- |
| Desktop feed | Compact image-first cards exposed title, author, like count, and small Related Quest; body/comments were absent; floating New post stayed at right |
| Desktop detail | Two-column modal-like surface rendered carousel media left and author/body/Quest/comments/actions right; close control remained visible |
| Mobile feed at 390 × 844 | Two 173 px masonry columns rendered; floating New post used `position: fixed`; document client and scroll widths both equalled 390 px |
| Mobile detail | Author header preceded the carousel; document had no horizontal overflow; bottom engagement footer used `position: fixed` and ended at the viewport bottom |
| Privacy/write UI | Guest detail showed sign-in boundaries; API ownership/CSRF behavior is covered by focused integration tests |
| Browser logs | No Community/social warning or error was observed. Existing SignalR negotiation cancellation messages appeared only during page navigation/reload |

## Known limitations

- Post editing, comment deletion, edit timestamps/history, and draft persistence
  remain deferred.
- Images remain URL-based.
- Feed masonry uses dependency-free CSS columns, so source order flows down
  columns and sparse result sets may not occupy every available desktop column.
- The one complete integration-gate failure belongs to concurrent, unrelated
  Quest-completion work in the shared working tree; this Slice did not modify
  that test or response contract.

## Review status

Independent Kimi K3 Review 83 returned **APPROVED WITH MINORS** with 0 Blocker,
0 Major, and 2 Minor findings. K3 confirmed the product hierarchy, backend
privacy/ownership/CSRF/rate-limit boundaries, cache isolation, responsive
behavior, and meaningful coverage. The two Minors were corrected in one pass:
like failures now have visible feedback with a tested rollback/retry path, and
missing-comment PATCH 404 now has an explicit API assertion. Focused frontend
and Social API verification passed after correction. With no Blocker or Major,
the bounded workflow requires no targeted closure review.
