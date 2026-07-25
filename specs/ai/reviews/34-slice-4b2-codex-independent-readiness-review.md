# Slice 4B-2 Codex Independent Readiness Review

- **Date:** 2026-07-25
- **Slice:** 4B-2 — Completion Code Frontend
- **Reviewer:** Codex (independent from the Kimi K3 implementation session)
- **Mode:** Read-only implementation review; review evidence only was added
- **Branch:** `feat/slice-4b2-completion-code-frontend`
- **Initial verdict:** `TARGETED FIX REQUIRED`
- **Final verdict:** `APPROVE` after targeted closure
- **Blockers:** 0
- **Initial Majors:** 3
- **Remaining Majors:** 0
- **Minors:** 3

## Review instruction

The human requested that Codex independently review Slice 4B after Kimi K3
implemented it:

> 接下来审核4b，我让k3来写了，反过来就是codex审查了

The supplied implementation result identified the work as complete but pending
the independent read-only review required before commit.

## Review scope

- Read the approved Slice 4B contract, especially §§11–13 and the frontend test
  and Definition-of-Done requirements in §§16–17.
- Read the merged Slice 4B-1 backend DTOs, mappings, controller routes,
  ProblemDetails mapping, completion service models, and status/redemption
  repository behavior to verify the frontend against the actual server.
- Reviewed all 17 pre-review working-tree paths: 6 modified frontend files, 10
  new frontend implementation/test files, and the 4B-2 completion report.
- Compared the implementation with the existing auth, participation,
  organizer-query, dialog, router, and `apiFetch` conventions.
- Inspected QueryCache/MutationCache behavior, plaintext lifetime, error
  mapping, route integration, DTO validation, CSRF transport, query
  invalidation, and the new tests.
- No production code, tests, dependency files, configuration, accepted
  specifications, Git history, staging area, or remote state were changed by
  the reviewer.

## Findings

### Blockers

None.

### Majors

#### M1 — The one-time plaintext is withheld behind a nonessential status refetch

- **Location:** `frontend/src/hooks/useCompletion.ts:51-58`;
  `frontend/src/components/organizer/CompletionCodeSection.tsx:57-60`
- **Requirement:** contract §12 requires the generated plaintext to be
  extracted directly into short-lived component memory for immediate
  display/copy.
- **Issue:** after the generation/rotation POST succeeds, the hook awaits
  `invalidateQueries`. Because the status query is active, this waits for the
  follow-up status GET before returning the generated DTO to the component.
- **Failure scenario:** the POST commits and returns the only usable plaintext,
  but the subsequent metadata GET stalls. The UI remains in `Generating…` or
  `Rotating…` and never displays the code. Reloading or leaving loses the only
  recoverable copy even though the new code is active on the server.
- **Why tests miss it:** every generation/rotation test supplies an immediately
  resolving status response. No test defers or hangs the post-success status
  refetch while asserting that the plaintext is already visible.
- **Required correction:** transfer the validated POST response into local
  reveal state immediately, independently of metadata resynchronization. Add a
  deterministic test where POST resolves but status GET remains deferred and
  assert that the new code is still displayed and remains absent from both
  TanStack caches.

#### M2 — A failed rotation destroys the only visible copy of the still-active code

- **Location:** `frontend/src/components/organizer/CompletionCodeSection.tsx:51-68`;
  test gap at
  `frontend/tests/integration/CompletionCodeSection.test.tsx:374-395`
- **Requirement:** contract §12 says plaintext disappears on **successful**
  rotation replacement; the accepted backend behavior preserves the prior
  active code when rotation fails.
- **Issue:** `setRevealedCode(null)` runs before the rotation request. If an
  organizer generates a code, leaves it visible, then attempts a rotation that
  returns 409/500 or suffers a network failure, the server keeps the old code
  active but the frontend irreversibly removes its only visible copy.
- **Why tests miss it:** the rejected-rotation test begins from metadata-only
  configured status, not from a just-generated visible code, so it cannot
  detect loss of an existing reveal.
- **Required correction:** retain the current reveal while rotation is
  pending, replace it atomically only after a successful POST response, and
  preserve it on every failed rotation path. Add a generate → rejected rotate
  test that asserts the original code remains visible, valid in local state,
  and absent from caches/storage/URL.

#### M3 — The required Slice 4B-2 implementation prompt record is missing

- **Location:** `specs/ai/prompts/` (latest Slice record is Prompt 42 for 4B-1)
- **Requirement:** `AGENTS.md:86-97,112-116` and contract §17 require the actual
  or truthfully reconstructed implementation prompt record before independent
  review and before commit.
- **Issue:** the completion report exists, but no 4B-2 implementation prompt
  record exists. The review request therefore arrived with incomplete
  implementation evidence, and the Slice is not commit-ready.
- **Required correction:** add the actual Kimi K3 implementation prompt, or a
  truthful reconstructed instruction if the original is unavailable, under
  `specs/ai/prompts/`. Do not reconstruct unobserved test results or browser
  evidence.

### Minors

#### m1 — Exact-key validators accept semantically inconsistent DTO states

- **Location:** `frontend/src/lib/validation/completionDto.ts:50-87`
- **Issue:** exact keys and individual field types are checked, but cross-field
  invariants are not. For example, `isConfigured: false` with non-null
  timestamps passes even though the contract says unconfigured timestamps are
  null. Likewise, `status: "Verified"` with null method/timestamps, or
  `status: "None"` with CompletionCode metadata, passes.
- **Impact:** a malformed or regressed server response can render an
  authoritative-looking but internally inconsistent state instead of failing
  the transport boundary.
- **Correction direction:** enforce the two status variants and the two
  completion-state variants as discriminated runtime shapes, with negative
  tests for mixed states.

#### m2 — The required frontend error-state and accessibility matrix is incomplete

- **Location:** contract §16;
  `frontend/tests/integration/CompletionCodeSection.test.tsx`;
  `frontend/tests/integration/QuestCompletionPanel.test.tsx`
- **Issue:** organizer tests cover 403 and 409 but not the required 404/429
  cases; participant redemption tests do not cover 403/404; reveal focus is
  implemented but not asserted. Organizer status 404/429 currently collapses
  to the generic status-load error, and management-action 429 does not present
  bounded rate-limit feedback.
- **Correction direction:** add focused 404/429 organizer tests, 403/404
  participant tests, and a reveal-focus assertion; align any failing copy with
  the bounded conventions rather than exposing arbitrary details.

#### m3 — Quest-context changes do not explicitly clear local secret state

- **Location:** `frontend/src/pages/OrganizerQuestEditPage.tsx:190`;
  `frontend/src/pages/QuestDetailPage.tsx:122-125`;
  `frontend/src/components/organizer/CompletionCodeSection.tsx:23-30`;
  `frontend/src/components/quest/QuestCompletionPanel.tsx:32-35`
- **Issue:** both new panels are unkeyed and retain local state when their
  `questId`/`quest` prop changes without an unmount. With a cached same-route
  parameter transition, an organizer reveal from Quest A can remain visible
  under Quest B, and participant input for A can be submitted to B. The
  completion report's claim that React state lifetime inherently clears on
  route change is therefore too broad.
- **Correction direction:** key the panels by Quest ID or explicitly clear all
  secret/error/dialog state on Quest-ID change, and add a rerender/navigation
  test.

## Independently verified behavior

- The four endpoint paths and request bodies match the merged backend.
- Runtime validators reject extra keys, secret-bearing fields, unknown enum
  strings, malformed display codes, and malformed timestamp strings.
- Option A is genuinely used: completion-code POST flows do not call
  `useMutation`, and no completion MutationCache entry is created.
- Query keys are distinct and the required success/409 invalidation sets are
  present.
- Generated plaintext and submitted code are not written by the implementation
  to QueryCache data, MutationCache, Zustand, Web Storage, URLs, logs, or
  toasts.
- Copy is explicit, clipboard denial is bounded, and copy feedback omits the
  raw code.
- Redeem uses cookie/CSRF transport, normalizes to the canonical ten-character
  form, disables duplicate submission, and does not automatically retry 429.
- Verified presentation is derived from the authoritative completion query and
  contains no new XP/reward/achievement/leaderboard claim.
- No backend, dependency, schema, auth architecture, deployment, or
  out-of-scope product changes are present.

## Verification results

Run from `frontend/` unless stated otherwise:

| Gate | Result | Observed evidence |
| --- | --- | --- |
| `npm run lint` | PASS | Exit 0; no diagnostics |
| `npm run type-check` | PASS | `tsc -b`, exit 0; no diagnostics |
| `npm run test -- --run` | PASS | 19 files, 168 passed, 0 failed |
| `npm run build` | PASS | 1874 modules transformed; production build completed |
| Tracked diff hygiene | PASS | `git diff --check HEAD` produced no output |
| Untracked diff hygiene | PASS | `git diff --no-index --check` produced no whitespace findings for every untracked file |
| Scope inventory | PASS | Before this review record: 6 modified frontend files, 10 new frontend files, and 1 new completion report |
| Browser smoke | NOT RUN | No running full-stack environment was provided; the implementation report already records this limitation |

Backend gates were not rerun because the Slice 4B-2 working tree contains no
backend change and the merged 4B-1 backend was independently approved.

## Completion-report accuracy

The file inventory, 49-new/168-total test count, test-file split, build module
count, endpoint inventory, cache design, and scope exclusions are accurate.
The independently rerun gates all pass.

Corrections are required before the report can be used as commit-readiness
evidence:

- “the plaintext response travels only through the returned promise into
  component-local state” omits that the response is first held behind an
  awaited status refetch (M1);
- “rotation replacement” and “rejected rotation stays accurate” do not cover
  loss of an already visible prior code on a failed rotation (M2);
- “component unmount/route change (React state lifetime)” is not guaranteed for
  same-route Quest-ID changes (m3);
- the report claims all 403/404/409/429 management handling while the required
  404/429 coverage is absent (m2);
- page reload is reasoned from non-persistence but was not directly browser
  tested; the automated test performs unmount/remount.

The lint rerun passed with no diagnostics, but the current command output did
not independently print the report's “103 rules, 72 files” metadata.

## Final verdict

`TARGETED FIX REQUIRED`.

There are no Blockers. M1 and M2 must be corrected because a reveal-once secret
can otherwise become unavailable after a successful POST or be unnecessarily
lost after a failed rotation. M3 must be closed to satisfy repository evidence
requirements. Per the bounded review workflow, the implementation owner should
perform one concentrated correction pass, after which Codex should perform one
targeted closure check limited to these original Major findings.

## Targeted closure check — 2026-07-25

- **Reviewer:** Codex, same independent review session
- **Mode:** Targeted read-only closure check
- **Scope:** Original M1–M3 only; this is not a second full review
- **Result:** All three original Majors CLOSED
- **Final verdict:** `APPROVE`

### M1 — CLOSED

`useGenerateOrRotateCompletionCode` now starts the status invalidation without
awaiting it and returns the validated generation response immediately. The
component therefore receives and displays the reveal-once plaintext as soon as
the POST resolves.

The new deterministic test
`reveals the plaintext immediately even when the status refetch stalls` leaves
the follow-up status GET permanently unresolved and observes:

- the reveal appears with the generated code;
- Copy remains available;
- QueryCache contains no plaintext;
- MutationCache remains empty.

This directly closes the original failure scenario rather than relying on a
fast mocked status response.

### M2 — CLOSED

`CompletionCodeSection` no longer clears `revealedCode` before attempting a
rotation. It replaces the value only after a successful response. All failure
paths leave the current reveal unchanged.

The new deterministic test
`preserves the visible still-active code when a rotation is rejected` performs
generate → visible code → rejected 409 rotation and observes:

- the accepted error remains in the confirmation dialog;
- the original code remains visible;
- QueryCache and MutationCache contain no plaintext;
- localStorage, sessionStorage, and the URL contain no plaintext.

This matches the backend's failed-rotation guarantee and closes the original
loss-of-the-only-copy scenario.

### M3 — CLOSED

`specs/ai/prompts/43-slice-4b2-completion-code-frontend-implementation.md`
now exists and contains the implementation instruction, scope boundaries,
security rules, test/gate requirements, the source-file-number correction, and
the post-review correction record. Its note transparently identifies that the
final-response formatting was summarized; therefore the record satisfies at
least the permitted truthful-reconstruction form even if that formatting note
is not treated as verbatim source text.

### Closure verification

Run from `frontend/`:

| Gate | Result | Observed evidence |
| --- | --- | --- |
| Targeted M1/M2 tests | PASS | 2 files, 30 passed, 0 failed |
| `npm run lint` | PASS | Exit 0; no diagnostics |
| `npm run type-check` | PASS | `tsc -b`, exit 0; no diagnostics |
| `npm run test -- --run` | PASS | 19 files, 179 passed, 0 failed |
| `npm run build` | PASS | 1874 modules transformed; production build completed |
| `git diff --check HEAD` | PASS | No whitespace findings |

No backend gate was rerun because no backend file changed. No browser smoke was
run. The original Minor findings were outside this targeted closure scope; the
implementation owner reports correcting them, and they do not block the final
verdict.

### Final readiness

There are 0 remaining Blockers and 0 remaining Majors. Slice 4B-2 is
`APPROVE` after targeted closure and is ready for human staging and commit
inspection. The reviewer did not stage, commit, push, merge, deploy, or modify
production code.
