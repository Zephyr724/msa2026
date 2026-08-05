# Prompt 88 — Community Post Editing and Flat Reply Targets

## Source

Truthful reconstruction from the product owner's explicit corrections on
2026-08-05.

## Implementation instruction

Fix the opened Community post so its author can edit the post itself. Provide
an author-only edit entry in desktop and mobile detail and reuse the responsive
post composer as an edit dialog. Prepopulate and allow replacement of title,
body, ordered HTTPS image URL/alternative-text pairs, tags, and the optional
Related Quest. Keep visibility as its existing separate explicit control.

Add an authenticated, antiforgery-protected, actor-rate-limited backend PATCH
endpoint. Backend ownership must remain authoritative. A newly selected Quest
must exist and be Published, while an unchanged historical Quest may remain.
Do not add a dependency or database migration.

Also allow users to reply to a second-level comment. The request may target a
root or reply, but when it targets a reply the backend must resolve and persist
the root comment as the parent so the read model and UI remain exactly two
levels deep. Add a Reply action to visible second-level comments.

Cover normalization, collection replacement, ownership, authentication,
antiforgery, flattened parent resolution, frontend payloads, query-cache
refresh, and visible interaction with focused and complete applicable gates.
Preserve unrelated shared-worktree changes. Create implementation evidence and
obtain one independent read-only Kimi K3 review before commit readiness.

## Product-owner follow-up

After the independent review, move composer validation and save-failure
messages into a rounded, full-dialog-width floating `alert-error` bar immediately above
the Cancel/Save or Cancel/Publish action bar, retaining the original red error
colour. Render no placeholder when there is no error and automatically dismiss
each notice after eight seconds. Cover its placement, styling, and timer
behavior in the focused frontend integration test.
