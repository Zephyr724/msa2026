# Slice 30 — Community Post Discovery and Detail Correction

- **Status:** Approved by explicit product-owner correction
- **Approval date:** 2026-08-05
- **Implementation owner:** Current Codex session
- **Database migration:** Not required; this Slice changes reads, ownership
  projections, comment content updates, routing, and presentation only.

## Why this correction exists

Slice 29 delivered the publishing fields and persistence model, but placed the
full post, Quest card, author controls, likes, and comments directly inside
each masonry card. The product owner rejected that information hierarchy and
provided desktop and mobile Xiaohongshu references. This Slice supersedes the
conflicting Community feed/card and comment-edit deferral in Slice 29.

## Product contract

1. Community is an image-first, responsive masonry discovery feed. A feed card
   contains the cover image, post title, author, like count, and — when present
   — one visually subordinate Related Quest title. The first image preserves
   its intrinsic ratio when its width-to-height ratio is between `0.76` and
   `4:3`, inclusive. This preserves square, near-square, ordinary portrait, and
   ordinary landscape images. Narrower portraits are centre-cropped to
   `19:25`; wider landscape images are centre-cropped to `4:3`. A post without
   images uses the first complete sentence of its body on a pale `secondary`
   cover with a faint repeated diagonal Kiwimpact leaf watermark and a
   `19:25` feed ratio. Opened detail reuses the same default-cover treatment in
   its media region.
2. Feed cards do not show the post body, tags, author management controls,
   carousel controls, or comments. The compact heart is the sole feed-card
   action and toggles the authenticated viewer's like state.
3. Clicking anywhere on a feed card except the heart opens
   `/community/posts/{postId}`. The feed card does not navigate directly to a
   Quest. For guests, the heart is a sign-in boundary instead of opening the
   post.
4. The opened post owns the full content hierarchy: ordered image carousel,
   author and date, title, body, tags, optional Related Quest navigation,
   likes, author visibility/deletion controls, and two-level comments.
5. Desktop post detail is a modal-like two-column surface with media on the
   left and scrollable content/discussion on the right. Mobile post detail is
   a full-screen sequence of author header, media, content, Related Quest,
   discussion, and a viewport-sticky engagement bar.
6. Comments load only in post detail. The author of a root comment or direct
   reply may edit its bounded text inline. Other users never receive that edit
   capability, and backend ownership remains authoritative. A user may reply
   to either a root comment or a direct reply; replies to replies are flattened
   into the same root thread and never create a third visual or persisted level.
7. Authenticated users can select `My posts` from Community. It lists only
   their own public and hidden posts and preserves URL-owned search state.
8. `New post` is a persistent floating action on the right side of Community,
   above the mobile navigation when present. It is not part of the header or a
   normal document-flow position. Activating it retains the Slice 29 composer.
9. Related Quest remains optional but strongly recommended when publishing.
   It remains subordinate in the feed and becomes navigable only in detail.
10. Search, pagination, public/hidden privacy, multi-image publishing,
    deletion, likes, two-level comments, CSRF, role authorization, actor rate
    limits, and neutral public author projections retain their accepted rules.
11. The post author may edit the title, body, ordered image URL/alternative-text
    set, tags, and optional Related Quest from opened detail. Visibility remains
    a separate explicit control. Non-authors receive no edit entry and backend
    ownership is authoritative.

## API contract delta

- `GET /api/v1/social/posts/{postId}` reads one public post, or an owned hidden
  post. Inaccessible hidden posts fail closed as not found.
- `GET /api/v1/social/posts?mine=true` requires authentication and returns only
  the caller's own public and hidden posts.
- `PATCH /api/v1/social/posts/{postId}/comments/{commentId}` updates a root or
  reply owned by the caller, uses the existing comment rate-limit policy, and
  requires antiforgery. Missing comments return 404; non-owners return 403.
- Comment read DTOs expose `canEdit` without exposing internal user IDs.
- `PATCH /api/v1/social/posts/{postId}` replaces the owned post's editable
  content fields. A newly selected Related Quest must be published; preserving
  an unchanged historical Quest does not depend on its current lifecycle.
- `POST /api/v1/social/posts/{postId}/comments` accepts a root or reply as its
  target. When the target is already a reply, the stored parent is resolved to
  that reply's root comment.

## Verification contract

- Core unit coverage for normalized, bounded comment updates.
- PostgreSQL/API coverage for single-post privacy, My posts isolation, comment
  edit ownership, root/reply updates, authentication, antiforgery, and
  unchanged hidden-post boundaries.
- Frontend integration coverage for compact cards, whole-card navigation with
  the isolated feed-card like action, stable responsive masonry column counts,
  intrinsic image proportions, and text covers for posts without images,
  detail-only body/comments/Quest navigation, carousel, inline comment edit,
  My posts, floating composer entry, and management controls.
- Applicable complete frontend/backend gates from `AGENTS.md`.
- Real-browser desktop and 390 px mobile inspection for layout, sticky/fixed
  actions, close/back behavior, and horizontal overflow.
- One independent Kimi K3 read-only review after implementation evidence.

## Deferred

- Comment deletion and edit history/timestamps.
- Draft persistence.
- Binary image upload, public profiles, follows, chat, notifications, and
  recommendation ranking.
