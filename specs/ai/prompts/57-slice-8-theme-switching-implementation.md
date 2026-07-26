# Prompt 57 — Slice 8 Theme Switching Implementation

- **Date:** 2026-07-26
- **Implementation owner:** Codex
- **Branch:** `feat/slice-8-theme-switching`
- **Baseline:** `81cfe94` (PR #18, merged Slice 7B)
- **Plan:** `specs/implementation/08-theme-switching.md`
- **Design review:** `specs/ai/reviews/51-slice-8-codex-design-review.md`

## Implementation instruction

Implement the corrected Slice 8 plan as the sole production implementation
owner. Deliver the smallest frontend-only Light/Dark/System vertical slice:

- keep `themePreference` as genuine cross-component UI state in the existing
  Zustand `useUiStore`;
- persist only a validated bare `light`, `dark`, or `system` literal under
  `kiwimpact.theme-preference`, with `system` fallback when storage is missing,
  invalid, or unavailable;
- set the resolved daisyUI `data-theme` on `document.documentElement` before
  first paint and keep it synchronized from React;
- listen to `prefers-color-scheme` changes only while preference is `system`,
  and remove the listener on explicit preference or unmount;
- expose one compact, cross-route accessible disclosure with labelled Light,
  Dark, and System actions rather than three permanent header buttons;
- preserve responsive navigation at 320px and 375px, adjusting only existing
  compact header labels if the added control causes observed overflow;
- add counter-directional tests for persistence validation, storage failures,
  DOM application, matchMedia listener lifecycle, selection state, Enter/Escape
  keyboard behavior, and Shell integration;
- run targeted tests, then clean lint, type-check, the full test suite, and the
  production build; perform real-browser Light/Dark/System, reload,
  readability, and narrow-viewport checks;
- update `PROJECT_STATUS.md`, this prompt record, and the Slice 8 completion
  report with observed facts only before Kimi K3 Review 52.

Do not add or upgrade dependencies. Do not change backend, API, schema,
migrations, authentication, Docker, deployment, accepted specifications, or
server-state ownership. Stop for human direction if any such change is needed.
Do not stage, commit, push, create a PR, merge, or deploy.

## Execution record

Codex implemented the instruction in one frontend task. The browser pass found
one real responsive defect: after adding the theme trigger, the visitor header
had `scrollWidth: 358` at a 320px viewport. Codex kept the same routes and
semantics but applied the established icon-plus-hidden-label pattern to Quests
and Sign in. The recheck observed `scrollWidth: 320`; the open theme panel was
also contained inside the viewport (`left: 40`, `right: 200`).

Observed targeted verification:

- theme helpers, synchronization, switcher, and Shell tests: 25/25 across 4
  files;
- post-responsive-fix switcher/Shell subset: 7/7 across 2 files;
- lint and type-check passed during implementation.

Observed final gates from `frontend/`:

- `npm run lint` — passed with no warnings or errors;
- `npm run type-check` — passed;
- `npm run test -- --run` — 308/308 tests passed across 34 files;
- `npm run build` — succeeded; Vite transformed 1,906 modules.

Observed browser verification is recorded in
`specs/implementation/reports/08-theme-switching-completion.md`.

No backend, dependency, package-lock, schema, migration, authentication,
Docker, deployment, or accepted-spec file changed. No Git publication or
deployment action was performed.
