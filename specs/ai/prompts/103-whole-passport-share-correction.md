# Whole Passport Share correction — implementation prompt

## Source

Actual product-owner clarification and implementation instruction, 2026-08-07:

> 之前有一个是分享整个passport的页面，优化的也是这个页面……这两个是针对某个任务的

> 对啊，重做啊

> 你直接做吧，别用k3做了

## Implemented interpretation

Codex became the sole implementation owner. `/passport/share` must share the
whole Passport with the member's trophy and every earned achievement logo.
The existing single-Quest card remains a separate feature and route. Preserve
privacy exclusions, use repository-owned artwork, keep preview and export on
one 1080×1080 canvas model, block export until artwork is current, add targeted
tests, and do not change backend, schema, dependencies, branch, or Git state.
