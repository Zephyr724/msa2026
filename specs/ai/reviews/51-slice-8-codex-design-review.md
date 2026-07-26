# Review 51 — Slice 8 Theme Switching Codex Design Review

- **Date:** 2026-07-26
- **Reviewer:** Codex
- **Planning owner:** Kimi K3
- **Implementation owner:** Codex
- **Branch:** `feat/slice-8-theme-switching`
- **Baseline:** `81cfe94` (PR #18, merged Slice 7B)
- **Reviewed plan:** `specs/implementation/08-theme-switching.md`
- **Prompt evidence:**
  `specs/ai/prompts/56-slice-8-theme-switching-first-plan.md`
- **Method:** read-only comparison of the K3 plan with accepted scope/ADRs,
  the current frontend, installed daisyUI/Zustand packages, existing tests,
  Git state, and Slice 7 evidence conventions; no production implementation
  existed during the review.

## Verdict

**APPROVED WITH CORRECTIONS — 0 open Blockers, 0 open Majors.**

K3 correctly identified the P0 boundary, Zustand ownership, explicit
Light/Dark/System preference, pre-paint theme application, system-media
listener lifecycle, frontend gates, runtime readability requirement, and
evidence workflow. Codex applied the corrections below directly to the plan
before implementation.

## Corrections applied

### C1 — Git baseline observation (evidence correction)

The controlling Codex session created `feat/slice-8-theme-switching` from
`81cfe94` before K3 planning. The Kimi CLI session observed `main` and no Slice
8 branch, and the branch ref was absent after that process returned. Codex
re-created the branch from the same commit. The plan now records the
controlling branch and retains K3's contrary observation only as execution
evidence. No source or baseline commit changed.

### C2 — Remove library-envelope coupling (Major, closed)

K3 proposed Zustand `persist` with a JSON envelope that the inline pre-paint
script would parse. That couples code running before application modules to a
library storage representation and duplicates envelope validation/migration
logic. Review selected a smaller contract: Zustand remains the cross-component
owner, while guarded helpers persist exactly one literal under
`kiwimpact.theme-preference`. Missing, invalid, or inaccessible storage falls
back to `system`. This meets persistence and validation requirements without a
new dependency or internal-format coupling.

### C3 — Correct responsive switcher shape (Major, closed)

K3 proposed three permanent header buttons and claimed suitability from 320
px. The current Organizer/Admin header already contains up to seven visible
control clusters, so that claim was not supported. Review selected one compact
trigger opening three labelled, keyboard-reachable actions with selected and
expanded state. Runtime verification remains required at 320 px, 375 px, and
desktop widths; the plan makes no pre-implementation no-overflow claim.

### C4 — Keep matchMedia mocking local (Minor, closed)

K3 proposed modifying the global Vitest setup. Production code can safely
fall back when `matchMedia` is unavailable, while the dedicated hook test can
install a controllable local stub and assert add/remove lifecycle. The plan now
avoids global test-environment behaviour that unrelated suites do not need.

### C5 — Evidence numbering and authorization (Minor, closed)

This design review occupies Review 51, so the independent Kimi K3
implementation review will be Review 52. The user's instruction to begin Slice
8 and have Codex review/correct and implement is treated as authorization for
the selected in-scope implementation details. Product scope, architecture,
dependencies, security, schema, deployment, and Git publication remain under
the repository's explicit approval boundaries.

## Boundary verification

- No backend, API, schema, migration, authentication, Docker, deployment, or
  accepted-spec change is planned.
- No package or lockfile change is planned.
- Theme remains genuine cross-component UI state in Zustand; no server state
  enters Zustand or Web Storage.
- Existing source contains no hard-coded Tailwind colour families or hex/RGB
  colours under `frontend/src`; key-screen readability is plausible but must
  still be observed in a real browser in both themes.
- The corrected file map is 10 primary frontend files plus evidence/status,
  within the project guideline.

## Review status

All design-review corrections are closed in the plan. Slice 8 is ready for
Codex implementation, targeted tests, the four frontend gates, runtime browser
verification, implementation evidence, and one independent read-only Kimi K3
Review 52.
