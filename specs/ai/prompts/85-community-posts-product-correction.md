# Slice 29 Implementation Prompt — Community Posts Product Correction

## Source

The product owner rejected the narrowed Slice 25 Community implementation and
supplied these correction instructions on 2026-08-04:

> The community feature is far from what you and I agreed on. Go back and check my requirements — you did not deliver them. List my requirements and finish the remaining work.

> That is not all. I said to design it with reference to the Xiaohongshu product: 1. Creating a new post should be a button — what is this thing you made now? 2. Only after clicking the button should a pop-up page appear to create the post. 3. Even the basic features are missing — it should be possible to attach multiple images, even just via URLs, and that is still not implemented now. 4. There is a title 5. There is a body 6. Related activity (this is the actual purpose) 7. Tags can be added 8. Can publish 9. Can delete 10. Saving a draft would be best; if that is not feasible, skip it for now and prioritise the other features.

The product owner first added and then corrected requirement 11:

> 11. Activities can be public and hidden.

> 11. Corrected to: published posts can be public and hidden.

The product owner then added the multi-image browsing requirement:

> 12. When browsing a post, the multiple added images should work as a scrollable carousel, and also support the user clicking to page left and right.

The original social-feed instruction and migration approval remain relevant:

> Create a new branch and build: social posts, search, waterfall feed, publishing, likes, and two-level comments. This requirement is clear now, right? If it is clear, you can start.

> Database migration approved.

The product owner also required Kimi K3 review and correction of findings:

> When you finish writing, have K3 review it once, and remember to fix any problems.

After recovery and review, the product owner corrected the Quest rule on
2026-08-05:

> Related Quest is optional, not mandatory — just strongly recommended.

## Reconstructed implementation instruction

Work as the sole implementation owner in an isolated short-lived feature
worktree/branch without changing the user's dirty main worktree. Correct the
Community product to match `specs/implementation/29-community-posts-product-correction.md`.

- Replace the permanent composer with one clear `New post` button and a
  responsive modal/bottom-sheet composer.
- Require a title and body. Make Related Quest optional but visibly and
  strongly recommended. Reuse the existing Quest list/search boundary; when a
  Quest is supplied, independently require it to exist and be Published.
- Accept zero to nine ordered HTTPS image URL plus alternative-text pairs.
- Accept up to ten bounded tags and expand search to title, body, tags, Quest
  title, and author display name.
- Publish posts as either public or hidden. Treat hidden as a persisted
  visibility state, not a draft: only the author can see, interact with, and
  restore the hidden post.
- Permit only the author to permanently delete a post and rely on database
  cascades for owned reactions, discussion, images, and tags.
- Render multiple images as a touch/horizontal-scroll carousel with mandatory
  CSS scroll snap, previous/next controls, position dots, and a counter. Do not
  autoplay.
- Preserve the existing newest-first URL-search masonry feed, likes, and
  exactly two comment levels.
- Add the already-approved additive EF Core migration with safe legacy title
  and image backfill; do not invent Quest relationships for existing rows.
- Preserve backend authentication, authorization, ownership, privacy,
  antiforgery, validation, and rate-limit enforcement. Do not expose internal
  account identifiers.
- Add unit, PostgreSQL/API, migration/OpenAPI, and frontend integration coverage.
- Run applicable complete gates and real-browser desktop/mobile verification.
- Create truthful evidence before invoking the configured Kimi K3 CLI for one
  independent read-only review. Apply one concentrated correction pass for
  original Blocker/Major findings and use the same review session for targeted
  closure.
- Draft persistence is explicitly deferred. Binary upload/object storage and
  unrelated social-network expansion remain outside scope.
- Do not stage, commit, push, merge, deploy, or create/update a pull request
  without separate explicit product-owner authorization.
