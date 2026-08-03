# Slice 25 — Social Posts Feed Completion Report

## Status

Production implementation, local verification, Review 77 and its bounded
closure, and the product-owner-requested independent K3 Review 78 are complete.
K3's two non-blocking Minors were corrected in one focused pass and the same K3
session confirmed both are closed. Both reviews now report zero remaining
Blockers, Majors, or Minors.

## Implemented scope

- Added persistent `SocialPosts`, `SocialPostLikes`, and `SocialComments`
  entities, EF configurations, repository/service boundaries, DbSets, and the
  explicitly approved `AddSocialPostsFeed` migration.
- Added a public, newest-first, paginated post API with case-insensitive search
  over post content and author display name.
- Added authenticated post publishing for Member, Organizer, and Admin roles.
  Text is required and bounded; image metadata is optional, HTTPS-only, and
  requires bounded alternative text.
- Added authenticated set-like and remove-like endpoints. The composite
  `(PostId, UserId)` database key prevents duplicate likes.
- Added public threaded-comment reads and authenticated comment/reply writes.
  Application-service validation rejects reply-to-reply attempts.
- Bounded every returned root thread to the first 20 direct replies while
  returning authoritative `replyCount` and `hasMoreReplies` metadata.
- Preserved the existing HttpOnly cookie and global antiforgery model. All
  social writes use actor-partitioned publish, comment, or reaction rate limits.
- Kept private account identifiers and profile fields out of public social DTOs;
  social responses expose only author display names.
- Added `/community` with URL-owned search, TanStack infinite queries,
  dependency-free CSS-column masonry, responsive one/two/three-column layouts,
  a bounded publisher, optimistic likes with rollback/reconciliation, and
  inline root/reply comments.
- Added public navigation to Community and guest sign-in boundaries for every
  write action, plus loading, empty, validation, authorization, and error states.
- Added private-query cleanup for social data so viewer-specific like state is
  not retained when the signed-in principal changes.
- Social write 401 responses now run that ordered private-cache cleanup before
  clearing the auth session; optimistic-like rollback cannot restore expired
  principal data.
- Bounded public page numbers to 1–10,000 and reread both like count and caller
  state after each idempotent reaction mutation.
- Loads every root page's bounded reply previews with one parameterized window
  query instead of one query per root.
- Uses a neutral public display label if exceptional internal data damage
  leaves a social author without a profile, rather than failing the whole page.
- Updated the accepted architecture/API/product-scope documentation and added
  the Slice contract, implementation prompt record, and this completion report.

## Files changed

### Backend production and migration

- `backend/src/Kiwimpact.Api/Program.cs`
- `backend/src/Kiwimpact.Api/appsettings.json`
- `backend/src/Kiwimpact.Api/Contracts/SocialFeedContracts.cs`
- `backend/src/Kiwimpact.Api/Controllers/SocialPostsController.cs`
- `backend/src/Kiwimpact.Api/Security/SocialRateLimitPolicies.cs`
- `backend/src/Kiwimpact.Core/Entities/SocialComment.cs`
- `backend/src/Kiwimpact.Core/Entities/SocialPost.cs`
- `backend/src/Kiwimpact.Core/Entities/SocialPostLike.cs`
- `backend/src/Kiwimpact.Core/Repositories/ISocialFeedRepository.cs`
- `backend/src/Kiwimpact.Core/Services/ISocialFeedService.cs`
- `backend/src/Kiwimpact.Core/Services/SocialFeedModels.cs`
- `backend/src/Kiwimpact.Core/Services/SocialFeedService.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/KiwimpactDbContext.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/SocialCommentConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/SocialPostConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Configurations/SocialPostLikeConfiguration.cs`
- `backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260731143404_AddSocialPostsFeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/20260731143404_AddSocialPostsFeed.Designer.cs`
- `backend/src/Kiwimpact.Infrastructure/Migrations/KiwimpactDbContextModelSnapshot.cs`
- `backend/src/Kiwimpact.Infrastructure/Repositories/SocialFeedRepository.cs`

### Backend tests

- `backend/tests/Kiwimpact.UnitTests/Core/SocialFeedDomainTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/SocialFeedApiTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Api/OpenApiOperationTests.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/MigrationSmokeTests.cs`

### Frontend production and tests

- `frontend/src/app/AppShell.tsx`
- `frontend/src/app/router.tsx`
- `frontend/src/components/social/SocialComments.tsx`
- `frontend/src/components/social/SocialPostCard.tsx`
- `frontend/src/components/social/SocialPostComposer.tsx`
- `frontend/src/hooks/useSocialFeed.ts`
- `frontend/src/lib/api/privateCache.ts`
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
- `specs/ai/prompts/78-slice-25-social-posts-feed-implementation.md`
- `specs/ai/reviews/77-slice-25-social-posts-feed-independent-review.md`
- `specs/ai/reviews/78-slice-25-social-posts-feed-k3-review.md`
- `specs/implementation/reports/25-social-posts-feed-completion.md`

## Verification commands and observed results

### Focused checks during implementation

| Command or check | Observed result |
| --- | --- |
| Backend build plus focused social unit tests | Passed; 8 of 8 social unit tests |
| Focused social API integration tests | Passed; 4 of 4 tests |
| Focused migration, OpenAPI, and social API integration selection | Passed; 10 of 10 tests |
| Frontend lint/type-check plus Community integration tests | Passed; 6 of 6 Community tests |

### Applicable complete gates after implementation

| Command or check | Observed result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run type-check` | Passed |
| `npm run test -- --run` | Passed: 47 files, 353 tests |
| `npm run build` | Passed; Vite retained the existing main-chunk size advisory |
| `dotnet build Kiwimpact.slnx` | Passed: 0 warnings, 0 errors |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 258 tests |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Completed with 311 of 312 passing; the unrelated `XpLedgerPersistenceTests.NonVerifiedCompletionIsOutsideEveryRewardBoundary` failed once with expected false/actual true |
| Targeted rerun of the single failed XP-ledger test | Passed: 1 of 1 without a source change |

### Focused correction checks after independent review

| Command or check | Observed result |
| --- | --- |
| Local `oxlint` over the affected social frontend files/test | Passed |
| `npm run type-check` after correction | Passed |
| `npm run test -- --run tests/integration/CommunityPage.test.tsx` | Passed: 1 file, 7 tests |
| `dotnet build Kiwimpact.slnx` after production correction | Passed: 0 errors; 5 existing EF1002 warnings in unrelated integration-test source |
| Integration-test project build after test correction | Passed: 0 errors; the same 5 existing warnings |
| Focused social API, social OpenAPI, and migration integration selection | Passed: 11 tests |

### Focused correction checks after the K3 review

| Command or check | Observed result |
| --- | --- |
| `dotnet build Kiwimpact.slnx` | Passed: 0 errors; 5 existing EF1002 warnings in unrelated integration-test source |
| Focused social API, social OpenAPI, and migration integration selection | Passed: 11 tests |

The focused API selection exercised the single bounded window query with 21
replies and verified the 20-item preview metadata. It also deliberately removed
one author's profile and verified that the public feed returned the neutral
`Community member` display label instead of failing.

An attempted `npx eslint` check failed on unavailable registry DNS because
ESLint is not this repository's linter; it was replaced by the local `oxlint`
binary. The first correction test attempts exposed a missing frontend runtime
import and test-account rate-limit interference. Those test defects were fixed
before the final passing focused runs above.

The complete integration-suite result is retained as 311/312 rather than
misreported as passing. The immediate isolated pass indicates a parallel or
shared-fixture isolation fluctuation in pre-existing XP-ledger coverage; no
unrelated test or production code was changed to hide it.

## Real-browser evidence

Browser verification used an isolated temporary PostgreSQL container, the
current migration, current backend, current Vite application, and temporary
social data. The container was removed and both development processes were
stopped afterward; no user database was modified.

| View or behavior | Observation |
| --- | --- |
| Desktop Community | 1,265 px viewport and scroll width matched; three masonry columns rendered at distinct vertical card heights with no horizontal overflow |
| Mobile Community | 375 px client width and scroll width matched; one 343 px card column and three-item public bottom navigation rendered with no horizontal overflow |
| Public search | Searching for `compost` updated the URL to `/community?q=compost` and reduced the visible feed to the matching post |
| Guest comments | Comment threads expanded publicly; the empty state and sign-in boundary were visible |
| Social API runtime | Feed and comment requests used the real backend and returned successful responses during the checks |

Reloading the temporary browser runtime produced existing SignalR
origin/negotiation console messages. Social requests still returned
successfully, and the Community page behavior and layout checks above were not
affected.

## Known limitations

- Images are URL-based only. Uploads, object storage, proxying, and image
  moderation remain outside the approved Slice.
- Editing/deletion, public profiles, follows, friends, chat, notifications,
  moderation tooling, realtime social updates, and recommendation ranking are
  not implemented.
- Feed order is newest first; there is no personalization or ranking.
- The complete integration gate recorded one unrelated intermittent XP-ledger
  failure, followed by a passing isolated rerun, as described above.
- Each root-comment response shows at most its first 20 replies. The API/UI
  report the authoritative total and truncation state, but independent reply
  pagination is outside this Slice.
- Vite continues to report the existing main-chunk size advisory.
- Temporary local-browser reloads produced the existing SignalR
  origin/negotiation console messages; no social endpoint failed.

## Review status

Independent Review 77 initially returned **CHANGES REQUESTED**:

- Blocker: 0
- Major: 1 — public direct-reply reads were unbounded
- Minor: 4 — non-authoritative like caller state, missing write-401 session
  expiry, extreme-page overflow, and incomplete write-boundary coverage

One concentrated correction pass addressed all five original findings and has
passing focused verification. The same reviewer's targeted closure check
confirmed every finding is closed:

- Blocker: 0
- Major: 0
- Minor: 0
- Verdict: **APPROVED**

Slice 25 is independently ready to commit subject to the recorded complete
integration-suite fluctuation and explicit human authorization for Git writes.

The product-owner-requested second review used Kimi K3 via Kimi Code CLI.
Review 78 independently returned **APPROVED WITH TWO NON-BLOCKING MINORS**:

- Blocker: 0
- Major: 0
- Minor: 2 — bounded per-root reply query fan-out and exceptional missing-
  profile robustness

Both Minors were corrected in one focused pass and have passing targeted
verification. The same K3 session's targeted closure confirmed:

- Blocker: 0
- Major: 0
- Minor: 0
- Verdict: **APPROVED**

Slice 25 is ready to commit from both independent review perspectives, subject
to the recorded complete integration-suite fluctuation and explicit human
authorization for Git writes.
