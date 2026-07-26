# Prompt 56 — Slice 8 Theme Switching First Plan

- **Date:** 2026-07-26
- **Agent:** Kimi K3 (planning owner)
- **Task type:** Planning only — no production code, tests, migrations,
  dependencies, configuration, or accepted-spec changes
- **Output:** `specs/implementation/08-theme-switching.md`

## Prompt given to Kimi K3 (verbatim)

> You are the planning owner for Kiwimpact Slice 8 Theme Switching. Work inside the current repository and obey AGENTS.md. The human explicitly authorizes sharing with Kimi K3 the private repository source and specifications relevant to Slice 8. The human has explicitly decided that Slice 7 ends after 7A backend and 7B frontend, and that the next P0 gap is Slice 8 persisted Light Dark System theme switching. Dockerization is Slice 9 and is out of scope. Current branch is feat/slice-8-theme-switching from merged PR 18 at main commit 81cfe94. Codex will review and correct your plan, then Codex alone will implement, and Kimi K3 will later perform one independent read-only implementation review.
>
> Planning task only. Inspect the verified current repository state and directly relevant accepted sources, especially PROJECT_STATUS.md, specs/product/04-phase-2-delivery-scope.md, specs/adr/ADR-0004-use-react-vite-tailwind-daisyui.md, specs/adr/ADR-0005-use-tanstack-query-and-zustand.md, frontend package and Vite Tailwind daisyUI configuration, frontend/src/index.css, frontend/src/main.tsx, frontend/src/app/AppShell.tsx, frontend/src/stores/useUiStore.ts, tests, and Slice 7 evidence conventions. Separate intended behaviour from implemented behaviour.
>
> Do not edit any files. Output exactly two complete Markdown documents inside these delimiter lines:
> BEGIN FILE specs/implementation/08-theme-switching.md
> END FILE specs/implementation/08-theme-switching.md
> BEGIN FILE specs/ai/prompts/56-slice-8-theme-switching-first-plan.md
> END FILE specs/ai/prompts/56-slice-8-theme-switching-first-plan.md
>
> The implementation plan must define the smallest complete P0 vertical slice for persistent Light Dark System selection using the existing Zustand store and existing dependencies. It must cover: explicit ThemePreference union light dark system; persistence with a stable key and safe validation or migration of stored data; system-theme-aware initial behaviour; live response to prefers-color-scheme changes only while preference is system; applying the resolved daisyUI theme at the document root without visible startup flash where practical in the Vite SPA; an accessible responsive switcher available cross-route; readable key existing screens in both themes; ownership and lifecycle boundaries; SSR not required; no server state in Zustand; no backend API database schema dependency Docker deployment authentication or unrelated visual redesign; no new dependency unless a verified blocker is found and human approval is obtained; deterministic tests including localStorage matchMedia listener cleanup and invalid persisted values; full applicable frontend gates; runtime browser verification expectations; file map and primary-file budget; evidence and independent review handoff; stop conditions; and any decisions needing human approval. Reconcile the stale or inconsistent PROJECT_STATUS.md baseline as an implementation responsibility rather than silently treating it as current truth.
>
> The prompt evidence document must truthfully record this exact planning assignment, verified actions and results available to you, intended output files, and limitations. Do not claim tests or runtime checks that you did not run.

## Execution record (observed facts only)

Planning executed 2026-07-26 by Kimi K3 in a single planning session. No
files were created or modified: the human's instruction changed the delivery
mode from writing the two documents into the repository (the Slice 7
convention) to emitting them verbatim inside delimiter lines in the session
output. Nothing was staged, committed, pushed, merged, or deployed. No branch
was created.

Observed Git state:

- The session ran on `main` at `81cfe94` ("Merge pull request #18 from
  Zephyr724/feat/slice-7b-simple-leaderboard-frontend") with a clean working
  tree (`git status` empty).
- `git branch -a` showed **no** local or remote `feat/slice-8-theme-switching`
  branch. The task's statement that this is the current branch did not match
  the observed state; the plan records this as a stated-baseline discrepancy
  and assigns branch creation to the implementation phase under the human's
  Git approval boundary.

Documents read in full:

- `AGENTS.md` (rendered project instructions);
- `PROJECT_STATUS.md`;
- `specs/product/04-phase-2-delivery-scope.md` (theme switching is a
  committed P0 advanced requirement, §2.2);
- `specs/adr/ADR-0004-use-react-vite-tailwind-daisyui.md`;
- `specs/adr/ADR-0005-use-tanstack-query-and-zustand.md`;
- `specs/implementation/07-simple-persisted-leaderboard.md` (Slice 7 plan
  conventions);
- `specs/ai/prompts/53-slice-7-simple-persisted-leaderboard-first-plan.md`
  (first-plan prompt-record conventions);
- `specs/ai/prompts/55-slice-7b-simple-leaderboard-frontend-implementation.md`
  (implementation prompt-record conventions);
- `frontend/package.json`, `frontend/vite.config.ts`, `frontend/index.html`,
  `frontend/src/index.css`, `frontend/src/main.tsx`, `frontend/src/App.tsx`,
  `frontend/src/app/providers.tsx`, `frontend/src/app/router.tsx`,
  `frontend/src/app/AppShell.tsx`, `frontend/src/stores/useUiStore.ts`,
  `frontend/src/test/setup.ts`.

Searches and listings performed:

- Case-insensitive search for `theme`/`data-theme` across `frontend/src`:
  only `useUiStore.ts` matches — the union exists but is neither persisted,
  applied, nor read by any component.
- `Glob` of `frontend/src/**/*.{ts,tsx}` and listings of `frontend/tests/unit`,
  `frontend/tests/integration`, `specs/implementation`,
  `specs/implementation/reports`, `specs/ai/prompts`, `specs/ai/reviews`
  (highest prompt number 55; highest review number 50).
- `specs/ai/03-deadline-execution-mode.md:11` confirmed the 10–15 primary-file
  task-size guideline.
- Verified in installed packages (read-only): zustand `^5.0.14` ships
  `middleware` (persist) in-package — no new dependency needed; daisyUI
  `^5.7.0` default plugin configuration enables built-in `light` as default
  and `dark` via `@media (prefers-color-scheme: dark)` on `:root`
  (`frontend/node_modules/daisyui/functions/pluginOptionsHandler.js:37-83`),
  with theme CSS targeting `[data-theme="..."]` — an explicit `data-theme`
  attribute overrides the media fallback.

Key baseline conclusions (detailed in the plan):

- `useUiStore` already holds `themePreference: 'light' | 'dark' | 'system'`
  with a setter, but nothing persists it and nothing applies a theme to the
  DOM; today dark system users get daisyUI dark only via the media-query
  fallback.
- `AppShell` is the root layout of every route including 404, so a header
  switcher is cross-route for all principals by construction.
- `index.html` has no pre-paint boot script, so persisted preferences would
  flash without one.
- jsdom lacks `window.matchMedia`; the plan assigns a controllable stub to
  `frontend/src/test/setup.ts`.
- `PROJECT_STATUS.md` is stale: it claims baseline `5fb7be0` and Slice 7B
  "pending human Git approval", while PR #18 has merged at `81cfe94`. The plan
  assigns truthful reconciliation to the implementation owner as delivery
  evidence instead of treating the stale content as current truth.

Deliverables produced (emitted in-session per instruction, not written to
disk):

1. `specs/implementation/08-theme-switching.md` — complete plan with verified
   baseline, goals/non-goals, decision table D1–D7 (each marked REQUIRES
   HUMAN APPROVAL), proposed frontend contract, PROJECT_STATUS reconciliation
   assignment, 11-primary-file map, no-dependency/no-schema conclusion, test
   matrix T1–T13, applicable frontend gates, runtime browser verification
   expectations, risks R1–R5, stop conditions, Definition of Done, evidence
   requirements, human approval checklist, and the Codex handoff contract.
2. This prompt record.

## Limitations

- **No tests, builds, lints, or runtime/browser checks were run.** Planning
  was read-only; every verification command in the plan is a contract for the
  implementation phase, and no result is claimed here.
- The two deliverables were emitted inside delimiter lines as instructed and
  are **not yet written into the repository**; persisting them is a subsequent
  human-approved step.
- daisyUI default-theme behaviour was verified from installed package source,
  not from a running browser; the plan's startup-flash and live-media
  expectations remain to be proven by the implementation-phase runtime pass.
- The stated branch `feat/slice-8-theme-switching` did not exist at planning
  time; the plan targets `main` at `81cfe94` and leaves branch creation to
  the implementation phase with human Git approval.
- No decisions were requested or made during this planning run. The session
  stops here for the independent Codex design review, after which the human
  decides D1–D7.

## Codex post-plan correction record

After exporting K3's complete response, Codex verified the controlling
repository state and preserved the planning session's contrary observation as
an execution-environment discrepancy:

- Codex had created `feat/slice-8-theme-switching` from `main` at `81cfe94`
  before invoking K3. K3's isolated CLI session nevertheless observed `main`
  and no Slice 8 branch; the branch ref was also absent when the K3 process
  returned. Codex re-created it from the same commit before persisting these
  documents. No source baseline changed.
- Codex Review 51 accepted the frontend-only slice but corrected D2 from a
  Zustand `persist` JSON envelope to one validated bare preference value at
  `kiwimpact.theme-preference`, avoiding pre-paint coupling to a library
  envelope.
- Review 51 corrected D6 from three permanent header buttons to one compact,
  accessible three-choice menu because the existing authenticated header is
  already dense at 320/375 px.
- The matchMedia test double moved from global test setup to the dedicated
  theme-sync tests. This avoids changing unrelated suites.
- The implementation review number is 52 because Review 51 records this Codex
  design review.

These corrections are reflected in `specs/implementation/08-theme-switching.md`.
They do not change the human-approved Slice 8 product scope and do not add a
dependency, backend, schema, authentication, Docker, deployment, or accepted
specification change.
