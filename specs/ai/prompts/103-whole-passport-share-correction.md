# Whole Passport Share correction — implementation prompt

## Source

Actual product-owner clarification and implementation instruction, 2026-08-07:

> There was previously a page for sharing the whole Passport, and the page to be optimized is also that one... those two are for a specific Quest.

> Yes, exactly — redo it.

> Just go ahead and do it yourself; don't use K3 for it.

## Implemented interpretation

Codex became the sole implementation owner. `/passport/share` must share the
whole Passport with the member's trophy and every earned achievement logo.
The existing single-Quest card remains a separate feature and route. Preserve
privacy exclusions, use repository-owned artwork, keep preview and export on
one 1080×1080 canvas model, block export until artwork is current, add targeted
tests, and do not change backend, schema, dependencies, branch, or Git state.
