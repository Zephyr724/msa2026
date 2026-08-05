# Slice 25 — Social Posts Feed

- **Status:** Approved for implementation by explicit product-owner instruction
- **Approval date:** 2026-07-31
- **Database migration approval:** Explicitly granted on 2026-07-31
- **Implementation owner:** Current Codex session

> **Product correction (2026-08-04):**
> `specs/implementation/29-community-posts-product-correction.md` supersedes
> the narrower post-composition, media, search-field, visibility, deletion, and
> feed-presentation details below. The like and two-level-comment contract in
> this document remains accepted. Where the two documents conflict, Slice 29
> controls.

## Objective

Add a small, persistent social surface where visitors can browse and search a
responsive masonry-style feed, while authenticated users can publish posts,
like posts, and create comments with at most one reply level.

This instruction supersedes the earlier MVP scheduling exclusion for this
slice only. It does not add public profiles, follows, friends, chat,
notifications, moderation tooling, or file upload.

## Product contract

- `GET /api/v1/social/posts` is public and returns newest-first paginated posts.
  Page numbers are bounded to 1–10,000.
- Search is case-insensitive across post title, content, tags, related Quest
  title, and author display name.
- Authenticated Members, Organizers, and Admins may publish a post.
- Every new post contains a required title and body. A currently Published
  Quest relationship is optional but strongly recommended; when supplied it is
  validated by the backend. Tags and zero to nine ordered HTTPS image URLs are
  optional, with alternative text required for every supplied image.
- A published post may be public or hidden. Hidden posts remain visible to the
  author in their own feed but are undiscoverable and inaccessible to guests
  and other users.
- Only the author may change visibility or permanently delete a post.
- Authenticated users set or remove their own like; duplicate likes are
  prevented by a database key.
- Comments are public to read and authenticated to create.
- Comments support roots and direct replies only. Replying to a reply is
  rejected by the backend.
- Root comments are paged, and each returned root includes at most the first
  20 direct replies plus authoritative `replyCount` and `hasMoreReplies`
  metadata. This keeps the public response bounded even for high-fan-out
  threads.
- API responses expose display names but never user IDs, email addresses, Home
  Community, or other private profile fields.
- All writes retain the existing cookie-authentication and antiforgery model
  and receive actor-partitioned rate limiting.

## Persistent model

The approved migration adds:

1. `SocialPosts` — author, optional legacy Quest relationship, title, content,
   visibility, legacy image metadata, timestamps.
2. `SocialPostLikes` — composite `(PostId, UserId)` key and timestamp.
3. `SocialComments` — author, post, optional parent comment, content, timestamp.
4. `SocialPostImages` — ordered, owned HTTPS image metadata.
5. `SocialPostTags` — case-insensitively unique, owned post tags.

Foreign keys protect post/comment relationships and account lifecycle cleanup.
The application service enforces the two-level comment invariant.

## Frontend contract

- `/community` owns search state in the URL.
- TanStack Query owns server state and incremental page loading.
- CSS columns provide a dependency-free masonry presentation with responsive
  one-, two-, three-, and four-column layouts.
- Signed-in users open a bounded responsive composer from one `New post`
  button. Feed cards provide ordered scroll-snap image carousels, linked Quest
  context, author visibility/delete controls, authoritative like mutations, and
  inline two-level comments.
- A thread with more than 20 replies states that only the bounded preview is
  shown; independent reply pagination is outside this Slice.
- Guests can browse/search and are directed to sign in for write actions.
- Loading, empty, validation, authorization, and server-error states are
  visibly represented.

## Explicit non-goals

- File or camera upload, object storage, image moderation, and image proxying.
- Draft persistence, post editing, or comment editing/deletion.
- Public profile pages, follows, friends, chat, notifications, or realtime
  updates.
- Ranking or algorithmic recommendation; order remains newest first.

## Verification

- Core unit tests for entity validation and two-level comment rules.
- PostgreSQL integration/API tests for migration, public search/pagination,
  authenticated writes, like idempotency, antiforgery, and reply-depth
  rejection.
- Frontend integration tests for loading/empty/search, publishing, liking,
  comment/reply behavior, and guest write boundaries.
- Applicable frontend and backend full gates from `AGENTS.md` run once after
  implementation.
