# Prompt 58 — Slice 8 Storage Access Correction

- **Date:** 2026-07-26
- **Implementation owner:** Codex
- **Branch:** `fix/slice-8-storage-access`
- **Baseline:** `a3e7309` (PR #19 merge of Slice 8)

## Actual implementation instruction

The human instructed Codex to complete the previously identified Slice 8
storage correction and to pause Dockerization.

Implement only the targeted post-merge correction:

1. Ensure that obtaining `window.localStorage` is itself inside the guarded
   theme-storage exception boundary, so a property getter that throws
   `SecurityError` cannot fail Zustand store initialization or theme selection.
2. Preserve the existing bare-literal storage key and values, in-memory
   preference behavior, SSR-safe fallback, and every other Slice 8 contract.
3. Add a deterministic regression test that makes the browser storage property
   getter throw, rather than testing only `getItem` or `setItem` failures.
4. Reconcile `PROJECT_STATUS.md` with PR #19 already merged and record this
   correction as current work.
5. Add truthful correction evidence, run the targeted test and all applicable
   frontend gates, review the complete diff, and leave Git publication actions
   for explicit human approval.
6. Do not implement Dockerization, deployment, product-experience expansion,
   backend, API, schema, authentication, dependency, or accepted-spec changes.

Because this session implements the correction, a different session must
perform the independent targeted closure check for the original Major finding.
