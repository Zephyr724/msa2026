# Prompt 86 — Community Post Discovery and Detail Correction

- **Date:** 2026-08-05
- **Implementation owner:** Current Codex session
- **Review model:** Kimi K3 through the configured Kimi Code CLI
- **Prompt status:** Truthful reconstruction from the product owner's messages
  and supplied desktop/mobile reference screenshots

## Reconstructed implementation instruction

Correct Community to use the Xiaohongshu product hierarchy. The masonry feed
must show compact image-first cards containing only the cover image, title,
author, like count, and a small optional Related Quest title. The entire card
opens a post; no feed element goes directly to the Quest, and browsing cards
must not contain comments or full post content.

Create a responsive post-detail route. On desktop, present media and content as
a modal-like left/right layout. On mobile, use a full-screen author/media/body/
comments sequence with a sticky engagement bar. Only the detail surface may
link to the related Quest, show the complete body/tags, provide image carousel
controls, likes, comments, visibility, and deletion.

Add inline editing for comments and replies, enforced by backend author
ownership, antiforgery, bounded validation, and the existing comment rate
limit. Do not expose user IDs. Add a My posts Community view that returns only
the authenticated author's public and hidden posts. Make New post a persistent
right-side floating action above mobile navigation, not a header or document-
flow button. Preserve the already implemented modal composer, optional but
strongly recommended Related Quest, multiple URL images, title/body, tags,
publish/delete, public/hidden state, likes, and two-level comments.

Do not add a dependency or migration. Add focused and complete verification,
real-browser desktop/mobile evidence, implementation evidence, and one
independent read-only Kimi K3 review. Fix review findings within the bounded
workflow.
