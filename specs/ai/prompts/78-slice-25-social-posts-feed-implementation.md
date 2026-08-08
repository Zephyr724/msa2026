# Slice 25 Implementation Prompt — Social Posts Feed

## Source

The product owner supplied the following implementation instruction on
2026-07-31:

> Create a new branch and build: social posts, search, masonry feed, publishing, likes, and two-level comments. This requirement is clear now, right? If it's clear, you can get started.

The product owner then explicitly approved the required database migration:

> Database migration approved.

The implementation owner reconstructed the detailed execution contract below
from those instructions, the accepted repository decisions, and the inspected
implementation boundaries. No broader product or security approval was
inferred.

## Instruction

Create a short-lived feature branch from `main` without disturbing the user's
existing dirty worktree, then implement the smallest persistent end-to-end
social-feed slice described by `specs/implementation/25-social-posts-feed.md`.

- Add public newest-first post browsing with bounded pagination and
  case-insensitive search across post content and author display name.
- Add authenticated post publishing with required text and an optional HTTPS
  image URL. Require useful alternative text whenever an image URL is present.
- Add authenticated, idempotent per-user like and unlike operations enforced
  by a database composite key.
- Add public comment reading and authenticated comment creation with exactly
  two visible levels: root comments and direct replies. Reject attempts to
  reply to a reply in the backend.
- Add the explicitly approved EF Core migration for posts, likes, and comments
  without changing the existing authentication model or adding a dependency.
- Preserve backend ownership of authentication, authorization, validation,
  antiforgery, privacy, rate limiting, and comment-depth enforcement. Public
  contracts may expose author display names but not user IDs, email addresses,
  Home Community, or other private profile fields.
- Add a responsive `/community` page using TanStack Query for server state,
  URL-owned search state, and dependency-free CSS columns for one-, two-, and
  three-column masonry layouts.
- Give authenticated users publish, like, root-comment, and direct-reply
  controls; keep browsing/search public and show sign-in boundaries to guests.
- Represent loading, empty, validation, authorization, and server-error states.
- Add focused unit, PostgreSQL/API integration, migration/OpenAPI, and frontend
  integration coverage.
- Run each applicable complete frontend/backend gate once after implementation,
  then perform desktop/mobile real-browser checks for layout, search, guest
  behavior, and horizontal overflow.
- Create truthful implementation evidence before requesting one independent
  read-only review. Use the bounded correction workflow only for original
  Blocker/Major findings.
- Keep uploads, editing/deletion, profiles, follows, friends, chat,
  notifications, moderation tooling, realtime updates, and recommendation
  ranking outside this Slice.
- Do not stage, commit, push, merge, deploy, or create a pull request without
  separate explicit authorization.
