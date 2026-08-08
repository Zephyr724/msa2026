# Prompt 51 — Slice 6B Passport Achievements UI First Plan

- **Date:** 2026-07-26
- **Target agent:** Kimi K3
- **Task type:** Planning only (frontend-only Slice plan)
- **Expected reviewer:** Codex, independent design review
- **Implementation authority:** None
- **Human decision status:** All D1–D8 decisions in the produced plan remain
  unapproved until the human explicitly accepts the reviewed plan

## Prompt given to Kimi K3 (verbatim)

> You are responsible for creating the first implementation plan for Slice 6B — Passport Achievements UI. Do not implement any code.
>
> Baseline:
>
> - Remote `main`: `a974725`; PR #15 has merged Slice 6A-2 and the CI precision correction
> - Before starting, confirm the branch, HEAD, and a clean working tree
> - Read and follow `AGENTS.md`
>
> Required reading:
>
> - `PROJECT_STATUS.md`
> - `specs/implementation/06a-simple-achievements-backend.md` §13–§17, with focus on the §17 handoff contract
> - `specs/architecture/03-api-contract.md` §2.12
> - The current Passport frontend:
>   - `frontend/src/pages/PassportPage.tsx`
>   - `frontend/src/components/passport/`
>   - `frontend/src/hooks/useProgression.ts`
>   - `frontend/src/hooks/usePassportCompletions.ts`
>   - `frontend/src/hooks/useCompletion.ts`
>   - `frontend/src/lib/api/privateCache.ts`
>   - `frontend/src/lib/api/progression.ts`
>   - `frontend/src/lib/api/passport.ts`
>   - `frontend/src/lib/validation/`
>   - `frontend/src/types/`
>   - Directly related frontend tests
> - The 6A-2 prompt, completion report, and Review 43, used only to cross-check implemented API facts
>
> Create:
>
> 1. `specs/implementation/06b-passport-achievements-ui.md`
> 2. `specs/ai/prompts/51-slice-6b-passport-achievements-ui-first-plan.md`
>
> The plan's first line must be:
>
> `Status: Proposed — pending human decisions and independent Codex design review`
>
> The plan must cover:
>
> 1. Baseline and implemented API facts.
> 2. P0 product goals and explicit out-of-scope.
> 3. Passport page information architecture and responsive layout.
> 4. Client-side types for catalog and earned data, strict exact-key validators, transport, and TanStack Query hooks.
> 5. Recommended UI:
>    - Place the Achievements section between Level Summary and Completion History;
>    - Display all active catalog items;
>    - Earned items show unlocked state and `awardedAt`;
>    - Unearned items show locked state, but do not show progress the backend does not provide;
>    - Single column on mobile, up to three columns on wider screens.
> 6. Error and loading states:
>    - 401 uses the existing private-session lifecycle;
>    - 404 is consistent with the existing Passport profile-missing behavior;
>    - 503 `progression-not-ready` only forms a bounded Achievements-section state;
>    - `retry: false`;
>    - Failure boundaries for catalog and earned must not leak internal information.
> 7. Cache contract:
>    - Catalog key `['achievements','catalog']` with a long stale time;
>    - Earned key under the `['achievements']` prefix;
>    - Extend the redemption `syncAuthoritativeCompletion` invalidation;
>    - Extend `expirePrivateSession` to the achievements private cache;
>    - Do not use Zustand to store server Achievement data.
> 8. Icon strategy:
>    - Recommend concrete Lucide icons for the three existing codes;
>    - Safe rendering strategy when `iconUrl` is non-empty;
>    - Stable fallback for unknown codes;
>    - Do not add dependencies.
> 9. Accessibility: semantic heading/list, locked/unlocked must not rely on color alone, icon decoration rules, date text, keyboard and screen reader behavior.
> 10. Test matrix:
>     - validators/types;
>     - API transport and 401 cleanup;
>     - hooks/query keys/retry;
>     - earned/locked rendering;
>     - ordering;
>     - loading/empty/404/503/error;
>     - responsive structural assertions;
>     - redemption invalidation;
>     - private-cache cleanup;
>     - existing Passport regression.
> 11. Applicable frontend gates:
>     - `npm run lint`
>     - `npm run type-check`
>     - `npm run test -- --run`
>     - `npm run build`
> 12. Exact file mapping, file counts, risks, DoD, evidence, and the independent review process.
> 13. Explicitly list the D1–D8 human decisions, each with a recommended option, alternatives, and impact. Include at least:
>     - Show the full catalog or earned-only;
>     - Section placement;
>     - Locked-card content;
>     - Whether 503 is section-level or page-level;
>     - Icon mapping/fallback;
>     - Whether to show the unlock date;
>     - Catalog/earned empty states;
>     - Whether to explicitly exclude progress, toasts, and animations.
> 14. Explicitly state that progress data, thresholds, streaks, toasts, unlock animations, other users' achievements, write endpoints, and backend changes are all out of this Slice.
>
> Do not modify production code, tests, accepted documents, dependencies, or configuration. Do not stage, commit, push, merge, create a PR, or deploy. Do not approve decisions on the human's behalf.
>
> Report after completion:
>
> - Files created;
> - Baseline verification;
> - Recommended D1–D8;
> - What requires a human choice;
> - File counts and risks;
> - Next step: Codex independent design review.

## Execution record (observed facts only)

- Baseline verified before any planning file was created:
  - Branch `feat/slice-6a2-achievement-read-api`, HEAD
    `5be2a32a4564f40f74bba3e2445090ea7b732b0c`, working tree clean
    (`git status --porcelain` empty).
  - `git fetch origin main` → `origin/main` =
    `a9747259dee07b0db1698dd38c81f36e0e76bbea` (PR #15 merge containing
    `d350ae3` 6A-2 read API and `5be2a32` CI precision correction);
    `git merge-base --is-ancestor HEAD origin/main` confirmed the checkout
    content is contained in remote `main`.
  - The only Git operation performed was the read-only `fetch`; no branch,
    stage, commit, push, merge, reset, or worktree mutation of any kind.
- All mandated sources were read: `AGENTS.md` (supplied in-session),
  `PROJECT_STATUS.md`, `specs/implementation/06a-simple-achievements-backend.md`
  §7–§8 and §13–§18 (§17 handoff contract in full),
  `specs/architecture/03-api-contract.md` §2.11–§2.12, every listed Passport
  frontend source file plus `frontend/src/lib/api/apiFetch.ts`,
  `frontend/src/hooks/useAuth.ts`, `frontend/package.json`,
  `frontend/tests/integration/PassportPage.test.tsx`,
  `frontend/tests/integration/AuthSessionBoundary.test.tsx` (prefix
  assertions), `frontend/tests/unit/useCompletion.test.tsx` (test list),
  prompt 46 (planning-prompt format precedent), prompt 50, the 6A-2
  completion report, and Review 43 (the last three used only to cross-check
  implemented API facts).
- Verified frontend facts recorded in the plan: `lucide-react ^1.25.0`
  already present; `PRIVATE_SERVER_QUERY_KEYS` currently has exactly two
  prefixes; `syncAuthoritativeCompletion` currently has five invalidations;
  no achievement-related frontend module exists.
- Files created by this task: `specs/implementation/06b-passport-achievements-ui.md`
  and this prompt record. Nothing else.
- No production code, test code, accepted specification, dependency, or
  configuration change. No Git mutation beyond the read-only fetch. No
  implementation was performed; no test suite was run (planning-only task;
  no disputed baseline fact required execution).

## Concentrated correction record — Review 44 (2026-07-26, appended)

After the plan was created, Codex delivered the independent design review
`specs/ai/reviews/44-slice-6b-codex-independent-design-review.md` with
verdict `CHANGES REQUIRED` (0 Blocker, 1 Major, 2 Minor). The human then
instructed one concentrated planning correction limited to the original M1,
m1, and m2 findings. The original prompt above is unchanged; this section
records the correction facts.

Correction instruction (summary of the human's message): read Review 44,
the plan, this prompt record, and the accepted 6A D5/§17 handoff contract;
correct only M1, m1, and m2; keep the plan's first-line status exactly
unchanged; keep every D1–D8 item marked `REQUIRES HUMAN APPROVAL`; do not
expand scope; do not touch production code, tests, accepted documents,
dependencies, or configuration; no second full review; no Git mutation;
append this record to Prompt 51; the next step is a Codex targeted design
closure check limited to these three findings.

Corrections applied to `specs/implementation/06b-passport-achievements-ui.md`:

- **M1 — unlocked display fields:** §3.2 and §9 now state that the catalog
  defines only the card slots and their order plus locked-card display
  data; matching remains `earned.achievementId === catalog.id`; a matched
  unlocked card renders the complete earned item (`code`, `name`,
  `description`, `iconUrl`, `category`, `awardedAt`) — never just
  `awardedAt`; an earned row without an active catalog slot is not
  rendered. §14.4 gained the counterexample test (catalog and earned
  display fields deliberately differ → the unlocked card shows the earned
  fields) and the no-slot non-rendering test.
- **m1 — Passport region helpers:** §6 D4 impact, §10 (new
  implementation-boundary paragraph plus table wording), §13 loading
  bullet, and the §16 file map now specify equivalent **private**
  loading/error helpers inside `AchievementsSection.tsx` with the same
  fixed copy and 404/503/generic semantics; no reverse import from
  `PassportPage.tsx` (dependency cycle), no new shared component file, file
  map and 15-file count unchanged.
- **m2 — catalog cancellation signal:** §8.3 defines
  `fetchAchievementCatalog(options?: { signal?: AbortSignal })` forwarding
  the signal to `apiFetch`; §8.4 specifies
  `queryFn: ({ signal }) => fetchAchievementCatalog({ signal })`; §14.2
  gained the focused assertion that the exact signal instance reaches
  `apiFetch`/the global `fetch` call.

Preserved as instructed: the plan's first line remains exactly
`Status: Proposed — pending human decisions and independent Codex design
review`; all D1–D8 rows remain marked `REQUIRES HUMAN APPROVAL`; no scope
expansion; no production code, test, accepted-document, dependency, or
configuration change; no staging, commit, push, merge, pull request, or
deployment action; no second full review was requested or performed.
