# Community card like action — implementation prompt

## Source

Reconstructed from the product owner's explicit correction on 2026-08-05.

## Instruction

Update the Community discovery card so an authenticated user can toggle the
post like directly from the heart control without opening the post. The heart
is the only exception to whole-card navigation: clicking the image, title,
Related Quest label, author, or remaining card surface must still open the post
detail. Preserve the sign-in boundary for guests and cover both the isolated
heart action and normal card navigation with frontend integration tests.

Do not change the API, database schema, dependencies, post-detail behavior, or
the compact visual hierarchy of the feed card.
