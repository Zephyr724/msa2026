# Slice 29 — Community Posts Product Correction

- **Status:** Approved for implementation by explicit product-owner correction
- **Approval date:** 2026-08-04
- **Database migration approval:** The product owner explicitly approved the
  social-post database migration and then instructed the implementation to
  continue. This correction uses that approval for the additive post expansion.
- **Implementation owner:** Current Codex session

## Why this correction exists

Slice 25 implemented the broad social-feed nouns, but its reconstructed prompt
incorrectly narrowed the actual product request to a permanent compact composer,
one optional image, and no post deletion. The product owner rejected that result
and clarified the intended Xiaohongshu-inspired posting workflow. This document
supersedes the conflicting post-composition, post-media, visibility, deletion,
search-field, and masonry details in Slice 25. Slice 25's accepted like and
two-level-comment rules remain in force.

## Product contract

The Community experience is an image-first discovery feed inspired by
Xiaohongshu interaction patterns while retaining Kiwimpact branding and the
existing accessibility/security boundaries.

1. The Community header has one clear `New post` button. The creation form is
   not permanently embedded in the feed.
2. Activating `New post` opens a responsive creation dialog: a bottom sheet on
   small screens and a centered modal on larger screens.
3. Every newly published post requires a non-blank title, a non-blank body, and
   a related Quest. The backend accepts the Quest only when it exists and is
   currently `Published`. The relationship then remains as historical context
   if the Quest later changes lifecycle state; feed reads do not silently
   remove that context.
4. A post may contain zero to nine ordered images. This Slice accepts HTTPS
   image URLs rather than binary uploads. Every image requires alternative text.
5. A post may contain up to ten case-insensitively unique tags, each at most 30
   characters. Search includes title, body, tag, related Quest title, and author
   display name.
6. Publishing persists the complete post. The existing authentication,
   antiforgery, authorization, validation, and actor-partitioned rate-limit
   boundaries apply.
7. Only the author may permanently delete a post. Database cascades remove its
   image rows, tag rows, likes, and comments.
8. A published post may be `Public` or `Only me` (`IsHidden`). Hidden is a
   publication visibility state, not a draft state. The author can see hidden
   posts in their own feed and restore them to public. Guests and other users
   cannot discover a hidden post or access its likes or comments. Hiding does
   not erase existing likes/comments; they return when the author restores the
   post to public.
9. Multiple images render as an ordered carousel. Users can swipe or
   horizontally scroll with CSS scroll snap, click previous/next controls, or
   select a position dot. A counter reports the current image. The carousel does
   not autoplay.
10. The feed remains newest-first and uses responsive CSS-column masonry:
    one column on small screens and progressively more columns at larger
    breakpoints. Search state remains in the URL and page loading remains
    incremental.
11. Existing authenticated likes and public-read/authenticated-write two-level
    comments remain available on public posts. Hidden posts are available for
    those operations only to their author.
12. Guests can browse/search public posts and receive sign-in boundaries for
    write actions.

## Compatibility and migration contract

- The migration is additive. It adds `Title`, nullable `QuestId`, `IsHidden`,
  `SocialPostImages`, and `SocialPostTags`.
- Existing rows receive a title derived from their existing content and retain
  an existing legacy image as image position zero.
- `QuestId` stays nullable at the database level so existing posts are not
  assigned an invented Quest or deleted. All new writes require a published
  Quest in the application boundary.
- Legacy single-image columns remain during this correction for safe rollback
  and compatibility; new writes and reads use ordered image rows.
- Existing posts default to public.

## Explicitly deferred

- Saving or resuming a draft. The product owner said this is desirable but
  explicitly allowed it to be deferred behind the other requirements.
- Binary/file/camera upload, object storage, image proxying, and image
  moderation. URL-based multiple images satisfy this correction.
- Post editing, comment editing/deletion, public profiles, follows, friends,
  chat, notifications, realtime social updates, and recommendation ranking.

## Verification contract

- Core unit coverage for titles, ordered images, tags, and validation bounds.
- PostgreSQL/API coverage for the additive migration, legacy-row preservation,
  published-Quest enforcement, multi-image order, expanded search, ownership,
  visibility isolation, delete cascades, antiforgery, and write boundaries.
- Frontend integration coverage for the button/modal workflow, complete publish
  payload, image carousel controls, visibility restoration, deletion, search,
  likes, guest boundaries, and two-level comments.
- Applicable complete frontend/backend gates from `AGENTS.md`.
- Real-browser desktop and 375 px mobile checks for the publish flow, two-image
  carousel, hidden-post isolation, restore/delete, search URL, and horizontal
  overflow.
- One product-owner-requested independent Kimi K3 read-only review after the
  implementation evidence exists, followed by the bounded correction workflow
  for any original Blocker/Major findings.
