Status: Implemented, verified, and independently approved — ready for human Git approval

# Slice 8 — Theme Switching (Light / Dark / System)

- **Date:** 2026-07-26
- **Planning owner:** Kimi K3 (planning only; no production code, tests,
  dependencies, configuration, or accepted-spec changes)
- **Implementation owner:** Codex
- **Design review:** Codex (Review 51; corrections applied to this plan)
- **Independent implementation review:** Kimi K3 (one read-only review, after
  implementation evidence exists)

## 1. Status and planning boundary

This document is a plan. It implements nothing. It records a verified
baseline, a minimal P0 scope, selected implementation decisions, proposed
contracts, a file map, a test matrix, risks, stop conditions, and a handoff
contract for the implementation owner. The user's instruction to begin Slice 8,
have K3 plan, and have Codex review/correct and implement authorizes the
selected in-scope implementation details below. No unresolved product,
architecture, dependency, security, schema, or deployment decision remains.

Scheduling authority is `specs/product/04-phase-2-delivery-scope.md` §2.2:
theme switching is one of the four committed advanced requirements — light and
dark themes, persisted preference, system-theme-aware initial behaviour, and
key screens readable in both themes. The human has explicitly decided that
Slice 7 ends after 7A/7B and that Slice 8 is the next P0 gap. Dockerization is
Slice 9 and is out of scope.

The human has explicitly authorized sharing the private repository source and
Slice 8–relevant specifications with Kimi K3 for this planning task.

## 2. Verified baseline with file-level evidence

All facts below were verified against source on 2026-07-26. K3's isolated CLI
session observed a different local-branch state from the controlling Codex
session; the corrected Git baseline is recorded in §2.1. The stale project
status discrepancy is recorded in §2.6.

### 2.1 Git baseline

- Current controlling checkout: branch `feat/slice-8-theme-switching`, HEAD
  `81cfe94` — "Merge pull request #18 from
  Zephyr724/feat/slice-7b-simple-leaderboard-frontend". Slice 7B is merged.
- Codex created the branch from the verified latest `main` before invoking K3.
  K3's isolated CLI session reported `main` and no Slice 8 branch, and the
  branch ref was absent when that session returned. Codex re-created the branch
  from the same `81cfe94` baseline before persisting and reviewing this plan.
  This execution-environment discrepancy changed no source file or baseline
  commit and is preserved in Prompt 56 rather than treated as product state.

### 2.2 Existing theme surface (frontend)

- `frontend/src/stores/useUiStore.ts` already declares
  `themePreference: 'light' | 'dark' | 'system'` (initial `'system'`) and
  `setThemePreference`, alongside `mobileNavOpen`/`toggleMobileNav`. The union
  exists; **nothing persists it, nothing applies it to the DOM, and no
  component reads it** (a case-insensitive search for `theme`/`data-theme`
  across `frontend/src` matches only this store file).
- `frontend/src/app/AppShell.tsx` is the root layout for **every** route,
  including 404 (`frontend/src/app/router.tsx:17-42`). Its header nav already
  uses the compact idiom: Lucide icon + `aria-label` +
  `<span className="hidden sm:inline">` label (`AppShell.tsx:41-48`). A
  switcher placed in this header is cross-route for all principals by
  construction.
- `frontend/src/index.css` is exactly two lines: `@import "tailwindcss";` and
  `@plugin "daisyui";`. No custom themes are defined.
- daisyUI `^5.7.0` (`frontend/package.json:16`). Verified in
  `frontend/node_modules/daisyui/functions/pluginOptionsHandler.js:37-83`: the
  default plugin configuration enables the built-in `light` theme as default
  and `dark` with a `@media (prefers-color-scheme: dark)` fallback on `:root`.
  Theme CSS targets `:root` and `[data-theme="..."]`
  (`frontend/node_modules/daisyui/theme/light.css`). Consequences:
  - **Implemented behaviour today:** with no `data-theme` attribute, dark
    system users already get daisyUI `dark` via the media query; explicit
    light/dark/system *preference* is neither stored nor honoured.
  - Setting `document.documentElement.dataset.theme` to `light` or `dark`
    overrides the media fallback (attribute selector outranks `:root`), which
    is the documented daisyUI 5 mechanism. No `index.css` change is required
    for the two built-in themes.
- `frontend/index.html` has no inline boot script; the SPA paints before any
  theme attribute can be set from React, so a persisted dark preference would
  flash light on reload unless an inline pre-paint script is added.
- `frontend/src/main.tsx` renders `<App/>` → `Providers` → `RouterProvider`;
  `frontend/src/App.tsx` is a 5-line wrapper. No theming hooks anywhere.

### 2.3 State ownership and dependencies

- ADR-0005 assigns small cross-component UI state — explicitly naming theme —
  to Zustand, with `useUiStore` as an approved initial store. Theme preference
  is not server state, must not enter TanStack Query, and must not store user
  identity.
- zustand `^5.0.14` ships the `persist` middleware in-package
  (`frontend/node_modules/zustand/middleware.js` verified present). **No new
  dependency is needed.** No validation library (e.g. zod) exists in the
  project; the codebase convention is hand-rolled validators
  (`frontend/src/lib/validation/*.ts`).

### 2.4 Test environment

- Vitest + jsdom (`frontend/vite.config.ts:31-35`), globals on, setup file
  `frontend/src/test/setup.ts` (currently only imports jest-dom).
- **jsdom does not implement `window.matchMedia`.** Any test touching system
  theme resolution requires a controllable matchMedia stub. This is a verified
  environment fact, not an assumption.
- Test layout: `frontend/tests/unit` (validators, hooks, rules),
  `frontend/tests/integration` (pages, shell). Slice 7B evidence records
  288/288 tests across 31 files and the four gates passing; the implementation
  owner must re-observe current gate results rather than trust that record.

### 2.5 Existing screens and theming readiness

Key screens (`HomePage`, `QuestListPage`, `QuestDetailPage`, `LoginPage`,
`RegisterPage`, `PassportPage`, `LeaderboardPage`, organizer pages,
`NotFoundPage`, `AppShell`) are built from daisyUI semantic tokens
(`bg-base-200`, `text-base-content`, `btn-*`, `text-error`, etc. —
`AppShell.tsx:23-24` is representative). Because colours come from theme
variables rather than hard-coded values, both built-in themes should render
readably without per-screen redesign. This is a structural expectation, **not**
a verified claim: readability in both themes requires the observed runtime
browser pass in §11.

### 2.6 PROJECT_STATUS.md is stale — reconciliation required

`PROJECT_STATUS.md` currently claims: baseline `5fb7be0` (PR #17), and under
"Current Work" that Slice 7B is "implemented locally … ready for human Git
approval" on branch `feat/slice-7b-simple-leaderboard-frontend`. Observed
truth: PR #18 merged Slice 7B into `main` at `81cfe94`. The plan therefore
assigns reconciliation of `PROJECT_STATUS.md` to the implementation owner as a
delivery-evidence responsibility (§8, D8): record the PR #18 merge, close out
Slice 7 (7A+7B per the human's explicit scope decision), remove the stale 7B
"Current Work" entry, and record Slice 8 state. Planning does not modify it.

### 2.7 Evidence conventions (verified)

- Slice plans live in `specs/implementation/` (next: `08-theme-switching.md`).
- Prompt records live in `specs/ai/prompts/`; the highest existing number is
  55, so this planning record is **56** and the implementation prompt record
  will be **57**.
- Completion reports live in `specs/implementation/reports/` (Slice 7B:
  `07b-simple-leaderboard-frontend-completion.md`).
- Review records live in `specs/ai/reviews/`; the highest existing number is
  50, so the Slice 8 records start at **51**.
- AGENTS.md requires, before commit: complete implementation, observed gates,
  the prompt record, the completion report (scope, files changed, commands
  with observed results, limitations, review status), and for important tasks
  one independent read-only review with Blocker/Major findings closed.

## 3. Goals (P0)

1. An explicit `ThemePreference = 'light' | 'dark' | 'system'` union owned by
   `useUiStore` per ADR-0005.
2. Preference persisted in `localStorage` under one stable key with safe
   validation of stored data (invalid, corrupt, or unknown values fall back to
   `system` without throwing).
3. System-theme-aware initial behaviour: first visit (no stored value)
   resolves from `prefers-color-scheme`.
4. Live response to `prefers-color-scheme` changes **only** while the
   preference is `system`; an explicit light/dark choice ignores system
   changes and holds no media listener.
5. The resolved daisyUI theme (`light`/`dark`) applied as `data-theme` on
   `document.documentElement`, including a pre-paint inline boot script in
   `index.html` so a persisted preference does not flash on reload.
6. One accessible, responsive switcher in the `AppShell` header, present on
   every route for every principal.
7. Key existing screens verified readable in both themes via an observed
   runtime browser pass (structural test coverage only proves markup, not
   visual readability).
8. Truthful `PROJECT_STATUS.md` reconciliation (§2.6) as part of delivery
   evidence.

## 4. Non-goals (explicitly excluded)

- Backend, API, database schema, migrations, authentication, Docker,
  deployment, or any server-side change. SSR is not required (ADR-0004).
- Server state in Zustand, or theme state in TanStack Query (ADR-0005).
- Additional themes beyond the built-in daisyUI `light`/`dark`; custom theme
  token definitions; any unrelated visual redesign; per-screen restyling
  beyond what readability verification proves necessary (any such need is a
  stop condition, §13).
- New dependencies. If a verified blocker genuinely requires one, the task
  stops for human approval (§13).
- `mobileNavOpen` persistence (ephemeral UI state; out of scope).
- Dockerization (Slice 9), Cypress, SignalR, and every other P1/Deferred item.
- `PROJECT_STATUS.md` or any other file changes during planning.

## 5. Selected D1–D7 implementation decisions

Codex reviewed K3's alternatives against the verified implementation and the
user's instruction to proceed. The selected options below are in-scope
implementation details; changing product scope, architecture, dependencies,
security, schema, or deployment remains a stop condition.

### D1 — Scope shape: one frontend-only task — SELECTED

- **Selected:** Implement Slice 8 as a single frontend-only task on
  `feat/slice-8-theme-switching` from `main` at `81cfe94`. Estimated 10 primary
  files (§9), inside the 10–15 primary-file guideline
  (`specs/ai/03-deadline-execution-mode.md:11`), so no 8A/8B split.
- **Alternatives:** (B) Split store/persistence from UI — two tasks of ~6
  files each with doubled evidence and review overhead for one cohesive
  behaviour. (C) Bundle the PROJECT_STATUS reconciliation into a separate docs
  task — it is delivery evidence and belongs in this task.
- **Impact:** (A) delivers one demonstrable P0 behaviour per the Phase 2
  guardrails with one evidence chain and one independent review.

### D2 — Persistence mechanism, key, and validation — SELECTED WITH CORRECTION

- **Selected:** Keep Zustand as the cross-component owner and persist only the
  preference as the bare string value `light`, `dark`, or `system` under the
  stable key `kiwimpact.theme-preference`. `theme.ts` provides guarded
  read/write helpers; missing, inaccessible, or invalid storage falls back to
  `system` without throwing. `mobileNavOpen` remains ephemeral.
- **Correction to K3:** Do not use Zustand's JSON `persist` envelope. The
  pre-paint script must run before application modules load, so coupling it to
  a library-internal `{"state","version"}` shape adds avoidable duplication
  and migration risk. A single validated literal is the complete storage
  contract and still uses Zustand for genuine shared UI state.
- **Impact:** Store initialization and the setter own persistence through the
  shared helpers; the inline boot script mirrors only the three-literal guard.
  Renaming the key later requires an explicit migration or fallback read.

### D3 — Resolution and DOM application model — SELECTED

- **Selected:** A small pure module `frontend/src/lib/theme.ts`
  exporting `ThemePreference`, `ResolvedTheme = 'light' | 'dark'`,
  `resolveTheme(preference, systemPrefersDark)`, `applyTheme(resolved)` (sets
  `document.documentElement.dataset.theme`), and the shared storage-key
  constant. The **resolved** theme is always written as an explicit
  `data-theme` attribute (never by removing the attribute), so behaviour is
  identical in all browsers and testable in jsdom. A `useThemeSync()` hook
  called once in `AppShell` applies the resolved theme on mount and on every
  preference/system change.
- **Alternatives:** (B) In `system` mode, remove `data-theme` and let
  daisyUI's media-query fallback drive — saves a media listener but makes
  system mode untestable in jsdom (no matchMedia, no computed media
  evaluation) and diverges test behaviour from runtime. (C) CSS-only
  `light-dark()` — abandons the daisyUI theme contract.
- **Impact:** (A) is deterministic, fully unit-testable, and reuses the
  verified daisyUI override mechanism (§2.2).

### D4 — Startup-flash avoidance — SELECTED

- **Selected:** Add a minimal inline `<script>` in `frontend/index.html`
  `<head>` that runs before styles and the module script, reads
  `kiwimpact.theme-preference` inside try/catch, accepts only the three literal
  values (anything else → `system`), resolves `system`
  via `matchMedia('(prefers-color-scheme: dark)')`; and sets
  `document.documentElement.dataset.theme` to the resolved value. It mirrors
  the D3 validation rules; it deliberately duplicates ~10 lines of logic
  because inline scripts cannot import TypeScript. The React-side sync (D3)
  re-applies the same value after hydration, so the boot script never fights
  the app.
- **Alternatives:** (B) No boot script — persisted dark users get a light
  flash on every reload; fails the P0 spirit of persisted preference. (C)
  Blocking external script — pointlessly delays first paint.
- **Impact:** (A) removes the visible flash "where practical" in the Vite SPA
  (the task's own wording); residual edge cases (storage disabled, script
  blocked) degrade gracefully to system behaviour. jsdom cannot execute
  `index.html` inline scripts, so boot-script correctness is verified by the
  §11 runtime pass plus unit tests on the mirrored validation rules; the plan
  makes no automated-test claim for it.

### D5 — Live system tracking and listener lifecycle — SELECTED

- **Selected:** Inside `useThemeSync`, subscribe to
  `matchMedia('(prefers-color-scheme: dark)')` `'change'` events **only** while
  `themePreference === 'system'`; on change, re-resolve and re-apply. When the
  preference is explicit, no listener is registered (effect re-runs and cleans
  up). Unmount removes the listener. Use `addEventListener('change', …)` /
  `removeEventListener` (jsdom stubs and all supported browsers implement
  these on `MediaQueryList`).
- **Alternatives:** (B) Permanent listener with an internal guard — simpler
  effect but keeps a live subscription doing nothing and makes the cleanup
  contract weaker. (C) Poll — wasteful and non-deterministic.
- **Impact:** (A) matches the P0 requirement literally ("live response … only
  while preference is system") and gives tests an observable add/remove
  contract.

### D6 — Switcher UI and accessibility — SELECTED WITH CORRECTION

- **Selected:** A compact `ThemeSwitcher` menu in the `AppShell` header,
  rendered for all principals on all routes. One icon button exposes the
  current preference and opens three labelled Light, Dark, and System actions.
  The trigger has an accessible name, expanded state, and a Lucide icon; each
  option is keyboard reachable and exposes its selected state. The menu closes
  after selection and on normal focus/escape interaction supported by the
  chosen native disclosure structure. No new route or settings page.
- **Correction to K3:** Reject the three-button header group. The existing
  Organizer/Admin cluster already contains brand, Quests, Leaderboard,
  management, Passport, identity, and logout controls; adding three permanent
  buttons is not credible at 320/375 px. A one-trigger menu preserves all three
  explicit choices with a substantially smaller responsive footprint.
- **Impact:** The full Light/Dark/System choice remains discoverable and
  accessible without making an unverified no-overflow claim.

### D7 — Evidence, review workflow, and PROJECT_STATUS reconciliation — SELECTED

- **Selected:** Single task produces: implementation prompt record
  `specs/ai/prompts/57-…`; completion report
  `specs/implementation/reports/08-theme-switching-completion.md`; then one
  independent read-only Kimi K3 implementation review recorded under
  `specs/ai/reviews/52-…`, with one bounded correction pass and one targeted
  closure check per AGENTS.md. Codex also updates `PROJECT_STATUS.md` in the
  same delivery boundary to (i) record the PR #18 merge and close Slice 7 per
  the human's explicit 7A+7B scope decision, (ii) record Slice 8 state and
  evidence links, and (iii) remove theme switching from the remaining-P0-gaps
  list. No accepted specification (ADRs, Phase 2 scope, architecture,
  security, testing docs) requires amendment: the plan fits ADR-0004/ADR-0005
  as accepted.
- **Alternatives:** (B) Amend an ADR to "record" theming — unnecessary; the
  ADRs already sanction this design. (C) Defer the PROJECT_STATUS
  reconciliation — perpetuates the stale-baseline problem into Slice 9
  planning.
- **Impact:** This follows the Slice 7 evidence chain and leaves a
  truthful status baseline for Slice 9.

## 6. Required analysis resolutions

1. **Union ownership:** the existing `themePreference` field in `useUiStore`
   is the owner; the literal union is extracted to a named exported
   `ThemePreference` type in `frontend/src/lib/theme.ts` and imported by the
   store, so validation, boot-script parity, and components share one
   definition (D2/D3).
2. **Default/initial behaviour:** initial store state remains `'system'`;
   first visit resolves from `prefers-color-scheme` (system-aware initial
   behaviour) without writing storage until the user chooses.
3. **Validation rule (single definition):** a stored value is usable iff it is
   exactly `'light'`, `'dark'`, or `'system'`; every other value, missing key,
   or inaccessible storage resolves to `'system'` silently. The bare literal
   format has no versioned envelope; a future format change must use a new key
   or an explicit compatibility read (D2).
4. **DOM contract:** `document.documentElement.dataset.theme` always holds the
   resolved `light`/`dark` value once the app or boot script has run; the
   attribute is never removed to express system mode (D3).
5. **Listener contract:** zero or one `change` listener, present iff
   preference is `system`; added on entering system mode, removed on leaving
   it and on unmount (D5).
6. **Flash contract:** inline boot script in `index.html` sets `data-theme`
   before first paint for the stored-preference path; first-visit users follow
   the media query via the same script (D4). Verified at runtime, not in
   jsdom.
7. **Cross-route availability:** the switcher lives in `AppShell`, the verified
   root layout of every route including 404 (§2.2), for guest, Member,
   Organizer, and Admin (D6).
8. **Readability claim discipline:** unit/integration tests assert structure
   and state transitions only. "Key screens readable in both themes" is
   satisfied by the observed §11 runtime pass over Home, Quests, Quest detail,
   Leaderboard, Login/Register, Passport, and an Organizer page at 320 px,
   375 px, and desktop widths, recorded in the completion report.
   **Completion outcome:** the report records the smaller observed public-screen
   pass and explicitly lists Quest detail, Register, Quests-Dark, Passport, and
   Organizer as deferred to deployment/final-product verification. Review 52
   accepted that disclosed evidence boundary as a non-blocking Minor and its
   requested documentation correction is applied; no unobserved readability is
   claimed.
9. **Task size:** 10 primary files (§9) — inside the guideline; no split
   (D1).
10. **PROJECT_STATUS baseline:** the merged PR #18 state supersedes the stale
    status file; reconciliation is assigned to implementation evidence (§2.6,
    D7), not silently treated as current truth.
11. **Stop conditions:** see §13.

## 7. Proposed frontend contract

- `frontend/src/lib/theme.ts` (new) — `ThemePreference`, `ResolvedTheme`,
  `THEME_STORAGE_KEY = 'kiwimpact.theme-preference'`,
  `isThemePreference(value)` guard,
  `resolveTheme(preference, systemPrefersDark)`,
  `readStoredThemePreference(storage)`, `writeStoredThemePreference(storage,
  preference)`, and `applyTheme(resolved)`.
- `frontend/src/stores/useUiStore.ts` (modified) — initialize the preference
  from the guarded storage helper when `window` exists; the setter updates the
  Zustand state and writes the same validated literal. State shape otherwise
  remains unchanged.
- `frontend/src/hooks/useThemeSync.ts` (new) — per D3/D5; called once from
  `AppShell`.
- `frontend/src/components/ThemeSwitcher.tsx` (new) — per D6; reads
  `themePreference`/`setThemePreference` from `useUiStore`.
- `frontend/src/app/AppShell.tsx` (modified) — call `useThemeSync()`; render
  `<ThemeSwitcher/>` in the header control group.
- `frontend/index.html` (modified) — inline boot script per D4.
- Theme-sync tests install a local controllable `window.matchMedia` stub that
  records added/removed listeners and dispatches changes. Production code
  safely falls back to light when `matchMedia` is absent, so the global test
  setup remains unchanged and unrelated suites are not polluted.

## 8. PROJECT_STATUS.md reconciliation (implementation responsibility)

The implementation owner updates `PROJECT_STATUS.md` as delivery evidence:

- Baseline line → `81cfe94` (PR #18, Slice 7B merge).
- Slice table → add 7B row (PR #18, completion evidence
  `specs/implementation/reports/07b-simple-leaderboard-frontend-completion.md`).
- Delete the stale "Current Work — Slice 7B" section (7B is merged, not
  pending Git approval).
- Record Slice 8 implementation state with its evidence links.
- Remaining P0 gaps → remove theme switching; remaining: Dockerization
  (Slice 9), same-origin deployment, final verification/README/video.

## 9. File map and primary-file budget (10 primary files: 6 new, 4 modified)

New:

1. `frontend/src/lib/theme.ts`
2. `frontend/src/hooks/useThemeSync.ts`
3. `frontend/src/components/ThemeSwitcher.tsx`
4. `frontend/tests/unit/theme.test.ts` (resolution, validation, storage
   read/write round-trip)
5. `frontend/tests/unit/useThemeSync.test.tsx` (DOM application, listener
   lifecycle)
6. `frontend/tests/integration/ThemeSwitcher.test.tsx` (switcher behaviour and
   accessibility)

Modified:

7. `frontend/src/stores/useUiStore.ts`
8. `frontend/src/app/AppShell.tsx`
9. `frontend/index.html`
10. `frontend/tests/integration/AppShell.test.tsx` (switcher presence,
    compact-header contract preserved)

Plus evidence files (prompt record 57, completion report, design Review 51,
implementation review 52)
and the `PROJECT_STATUS.md` update, which are not counted as primary
implementation files. No changes to `frontend/src/index.css`, `main.tsx`,
`App.tsx`, `providers.tsx`, `router.tsx`, or any page component are
anticipated; any such need must be recorded in the completion report with
justification, and page-level restyling is a stop condition (§13).

## 10. Dependency and schema conclusion

**No new dependency, no backend change, no schema or migration change.** Theme
persistence uses guarded Web Storage helpers owned by the existing Zustand
store; themes use daisyUI's installed built-ins; `lucide-react` (installed)
supplies the icons. If the
implementer believes any dependency, backend, or configuration change is
required, that is a stop condition, not an implementation choice.

## 11. Verification expectations

### 11.1 Deterministic test matrix (results to be observed, not claimed)

Unit — `theme.test.ts`:

- T1 `resolveTheme`: light→light, dark→dark, system+dark→dark,
  system+light→light.
- T2 Storage validation: each valid literal round-trips; unknown, empty, and
  missing values resolve to `system` without throwing; storage read/write
  exceptions are contained.
- T3 Persistence: `setThemePreference` writes only the selected literal to
  `kiwimpact.theme-preference`; `mobileNavOpen` changes do not touch storage.
- T4 Initialization: the guarded reader returns stored `dark` and returns
  `system` for an invalid stored literal.

Unit — `useThemeSync.test.tsx`:

- T5 Mount applies `data-theme` to `document.documentElement` for each
  preference under both system-media states.
- T6 In system mode, dispatching a media `change` updates `data-theme` live
  (dark↔light).
- T7 With an explicit preference, no change listener is registered (stub
  records zero adds) and media changes do not alter `data-theme`.
- T8 Switching system→explicit removes the listener; explicit→system re-adds
  it; unmount removes it (add/remove counts asserted on the stub).
- T9 Cleanup leaves no residual listener after unmount in system mode.

Integration — `ThemeSwitcher.test.tsx`, `AppShell.test.tsx`:

- T10 Switcher trigger renders inside the header for guest, member, organizer,
  and admin shells; the trigger and all three menu actions are keyboard
  reachable and expose accessible names and selected/expanded state.
- T11 Activating each option updates the store, `data-theme`, and the
  bare `localStorage` value; a fresh document load restores the choice through
  the pre-paint script and guarded store initialization.
- T12 Compact contract: only one switcher trigger occupies the header at all
  breakpoints; existing AppShell compact assertions remain green.
- T13 Full suite regression: all pre-existing tests pass unchanged (no
  page-component edits).

Not covered by automated tests (honest boundary): inline boot-script execution,
visual readability, and real media-query behaviour — reserved for §11.3.

### 11.2 Applicable gates (from `frontend/`, run once after implementation; targeted tests during)

- `npm run lint`
- `npm run type-check`
- `npm run test -- --run`
- `npm run build`

No command may be claimed passed unless executed and observed. Backend gates
are not applicable (no backend files change); if any backend file changes,
that is a stop condition.

### 11.3 Runtime browser verification expectations (completion-report evidence)

With the dev server running, observe and record:

- Persisted `dark`: full reload shows dark before paint (no light flash).
- Persisted `light` under a dark OS: light renders, system change ignored.
- `system`: matches OS; toggling OS appearance (or devtools
  `prefers-color-scheme` emulation) flips the app live without reload.
- Switcher usable by keyboard at ~1280 px, 375 px, and 320 px on several routes
  (guest and authenticated).
- Readability pass in both themes over Home, Quests, Quest detail,
  Leaderboard, Login, Register, Passport, and one Organizer page.
- `localStorage["kiwimpact.theme-preference"]` is exactly the selected literal.

The completion report must distinguish observed screens from deferred screens.
The final observed subset and Review 52 evidence correction are recorded there;
the remaining authenticated/public visual checks stay in deployment/final-product
verification rather than being silently claimed complete.

Any readability defect found is either fixed within the token-based switcher
scope or escalated as a stop condition if it requires page redesign.

## 12. Risks

- **R1 (medium):** Boot-script drift — the inline script duplicates the
  validation rules and could diverge from `theme.ts` in a future edit.
  Mitigated by D4 documenting the mirror relationship and by T2 pinning the
  canonical rules.
- **R2 (low):** Storage may be unavailable or throw in restricted browsing
  contexts. Guarded reads/writes contain the exception; preference still works
  in-memory for the current page and falls back to system on the next load.
- **R3 (low):** Header crowding at 320 px. The corrected single-trigger menu
  adds one compact control rather than three; §11.3 still requires observed
  320/375 px checks and T12 preserves the structural boundary.
- **R4 (low):** Scope creep toward custom themes or per-screen restyling.
  Mitigated by §4 non-goals and the §13 stop condition.
- **R5 (low):** Stale-baseline confusion from `PROJECT_STATUS.md`.
  Mitigated by §8 making reconciliation an explicit deliverable.

## 13. Stop conditions

Return to the human before proceeding if any of these becomes necessary:

- any new, removed, or upgraded dependency;
- any backend, API, schema, migration, authentication, Docker, or deployment
  change;
- page-component restyling or any visual redesign beyond the switcher and the
  `data-theme` mechanism;
- any change to selected D1–D7, the storage key, or the bare-literal format;
- any inability to meet the flash or listener contracts with the existing
  stack (that would evidence a verified blocker, which requires human
  approval to resolve).

## 14. Definition of Done

1. Implementation complete per §7 and the selected decisions, inside the §9
   file map.
2. All §11.1 tests implemented and passing; §11.2 gates executed and observed
   passing; §11.3 runtime pass observed and recorded.
3. Prompt record `specs/ai/prompts/57-…` and completion report
   `specs/implementation/reports/08-theme-switching-completion.md` with
   observed facts only.
4. `PROJECT_STATUS.md` reconciled per §8.
5. Independent Kimi K3 read-only review recorded under `specs/ai/reviews/`;
   original Blocker/Major findings closed.
6. No unapproved file changes in the diff; Git actions remain with the human.

## 15. Evidence requirements

- Planning prompt record (this task): `specs/ai/prompts/56-slice-8-theme-switching-first-plan.md`.
- Implementation prompt record: `specs/ai/prompts/57-…` (actual or
  truthfully reconstructed instruction).
- Completion report with implemented scope, files changed, verification
  commands and observed results, known limitations, and review status.
- Independent review record under `specs/ai/reviews/`.
- No invented test counts, browser results, or unverified claims.

## 16. Selected implementation checklist

- [x] D1 single frontend-only task on `feat/slice-8-theme-switching` from
      `81cfe94`
- [x] D2 Zustand-owned state with guarded bare-literal persistence under
      `kiwimpact.theme-preference`
- [x] D3 pure `theme.ts` + always-explicit `data-theme` + `useThemeSync`
- [x] D4 inline pre-paint boot script in `index.html`
- [x] D5 matchMedia listener only in system mode, with cleanup
- [x] D6 compact accessible three-choice menu in `AppShell`
- [x] D7 evidence/review workflow + PROJECT_STATUS reconciliation (§8)
- [x] No dependency, backend, schema, auth, Docker, or accepted-spec change

## 17. Handoff contract for the implementation owner (Codex)

1. Treat selected D1–D7 as the implementation contract. Any need to change
   product scope, architecture, dependencies, security, schema, deployment, or
   the stop-condition items requires returning to the human.
2. Continue on the verified `feat/slice-8-theme-switching` branch at
   `81cfe94`. Inspect branch and tree before editing; preserve every
   pre-existing change.
3. Stay inside the §9 file map. Any materially different file or scope requires
   justification and re-review; stop if it crosses §13.
4. Follow verified conventions: ADR-0005 ownership, hand-rolled validation
   (no new libraries), the compact-header idiom, and the Slice 7 evidence
   chain.
5. Run targeted tests during implementation; run the §11.2 gates once at the
   end; perform the §11.3 runtime pass; record observed results only.
6. Reconcile `PROJECT_STATUS.md` per §8 as delivery evidence.
7. Do not stage, commit, push, merge, create a PR, or deploy without explicit
   human approval. Updating `PROJECT_STATUS.md` is required evidence, not a
   Git-action authorization.
8. Stop for the single independent Kimi K3 read-only review only after the
   prompt record and completion report exist.
