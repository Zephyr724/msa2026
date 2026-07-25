# Slice 4B-2 — Completion Code Frontend Completion Report

- **Date:** 2026-07-25
- **Status:** Frontend implementation complete; independent review findings corrected
- **Review status:** INDEPENDENT REVIEW COMPLETE (Codex, TARGETED FIX REQUIRED) — all findings corrected in one bounded pass; APPROVED AFTER TARGETED CLOSUR
- **Branch:** `feat/slice-4b2-completion-code-frontend`
- **Contract:** `specs/implementation/04b-simplified-quest-completion.md` (§11–§13, §16 frontend)
- **Prompt record:** `specs/ai/prompts/43-slice-4b2-completion-code-frontend-implementation.md`
- **Review record:** `specs/ai/reviews/34-slice-4b2-codex-independent-readiness-review.md`

## Implemented scope

- Exact TypeScript DTOs and strict runtime validators for the four merged
  Slice 4B-1 endpoints, following the existing hand-rolled exact-key
  validation convention (`src/lib/validation/participationDto.ts` style).
- Organizer Completion Code section on the existing
  `OrganizerQuestEditPage`: metadata-only status, empty state with Generate,
  configured state with Rotate behind the existing `ConfirmActionDialog`,
  reveal-once plaintext panel with explicit Copy and dismissal.
- Participant completion panel on the existing `QuestDetailPage` below the
  participation panel: anonymous sign-in CTA, OwnQuest explanation,
  not-participating state, redemption form with client-side normalization,
  and authoritative Verified state.
- Full ProblemDetails mapping for every accepted redemption and management
  failure class, including 429 with `Retry-After` support (additive
  `ApiError.retryAfterSeconds`).
- Tests: contract, hook-level cache/invalidation, organizer flows with
  direct plaintext-retention inspection, and participant redemption flows.

## Exact endpoint and DTO integration

| Endpoint | Client function | DTO |
| --- | --- | --- |
| `GET /api/v1/organizer/quests/{questId}/completion-codes` | `fetchCompletionCodeStatus` | `CompletionCodeStatusDto(isConfigured, validFromUtc, validToUtc, createdAtUtc)` |
| `POST /api/v1/organizer/quests/{questId}/completion-codes` (no body) | `generateOrRotateCompletionCode` | `GeneratedCompletionCodeDto(code, validFromUtc, validToUtc)` |
| `GET /api/v1/quests/{questId}/completion` | `fetchMyQuestCompletion` | `MyQuestCompletionDto(status, method, completedAtUtc, verifiedAtUtc)` |
| `POST /api/v1/quests/{questId}/redeem` (`{ code }`) | `redeemCompletionCode` | `MyQuestCompletionDto` (same four-field shape) |

Validators enforce exact keys, the canonical `XXXXX-XXXXX` alphabet for the
revealed code, `"None" | "Verified"` / `"CompletionCode" | null` enum names,
and the backend's round-trip UTC timestamp format. Cross-field variants are
enforced as discriminated runtime shapes (review m1): unconfigured status
requires all-null metadata and configured status requires its timestamps;
`"None"` completion requires all-null fields and `"Verified"` requires the
method and both timestamps. Malformed, partial, over-seeded, secret-bearing
(`code`, `codeHash`, `completionId`, `questId`, `userId`, XP), or internally
inconsistent payloads are rejected. Status and completion-state DTOs
structurally cannot contain plaintext.

Error mapping observed from the merged backend (ProblemDetailsHelper +
QuestCompletionProblemMapper): generic `400 invalid-completion-code` for all
code failures; `400` validation for unsupported source/mode; `401`; `403`;
`404`; `409` detail text for OwnQuest, no-active-participation,
AlreadyCompleted, cancelled/archived, empty validity window, and
concurrency; `429` with optional `Retry-After` seconds.

## Plaintext-lifecycle design

Approved contract §12 **Option A** was implemented: the generate/rotate
response never enters persistent TanStack MutationCache storage.

- `useGenerateOrRotateCompletionCode` and `useRedeemCompletionCode`
  deliberately do **not** use `useMutation`. The plaintext response travels
  only through the returned promise into component-local `useState`; the
  submitted redemption code never persists as MutationCache variables either
  (contract §13: component state owns the entered code).
- The revealed code exists only in `CompletionCodeSection`'s local
  `revealedCode` state. It is rendered through a read-only input required
  for display/copy, with no navigation, toast, log, analytics, or storage
  path.
- The POST response is transferred into reveal state **immediately** when it
  resolves; the status-metadata invalidation is fired without being awaited
  (review M1), so a stalled metadata GET can never withhold the only usable
  copy of the code.
- Rotation replacement is atomic on success only (review M2): the previous
  reveal is retained while a rotation is pending and on every failed
  rotation path (the server keeps the old code active), and is replaced only
  when the new plaintext arrives.
- Cleared on: explicit dismissal ("Done — I have saved the code"),
  component unmount/route change (React state lifetime; both panels are
  keyed by Quest ID so a same-route quest switch remounts and resets all
  local secret state — review m3), page reload (nothing persisted), and
  successful rotation replacement.
- No automatic generation/rotation on mount, refresh, or remount: the POST
  fires only from the Generate button or the Rotate confirmation.
- Copy is explicit-only (`navigator.clipboard.writeText` on click), handles
  denial gracefully, never logs, and the "Code copied to clipboard."
  feedback contains no raw value.

## QueryCache and MutationCache handling

- Query keys: organizer status `['organizer', 'quests', questId,
  'completion-code']`; participant state `['quest', questId,
  'my-completion']` (contract §13). They extend the accepted conventions and
  cannot collide with `['quest', questId, 'my-participation']` or
  `organizerQuestKeys.detail`.
- Successful generate/rotate invalidates **only** the status key; the
  invalidation is deliberately not awaited so the reveal-once plaintext is
  never gated on the metadata refetch (review M1). 409 generate/rotate
  resyncs that key before rethrowing (concurrency convention).
- Successful redemption invalidates `['quest', questId, 'my-completion']`,
  `['quest', questId, 'my-participation']`, and `['quest', questId]`
  (contract §13); a redemption 409 resyncs the same keys; the Verified UI is
  rendered only from the refetched authoritative GET.
- MutationCache is never written by any completion-code flow (no
  `useMutation` usage); tests assert `getMutationCache().getAll()` is empty
  after generate, rotate, and redeem.
- Both new queries use `retry: false`; no mutation retries exist; 429 is
  never automatically retried (single-POST test asserts one request).
- No new application-wide store: TanStack Query owns server state, the
  existing Zustand UI store is untouched, component state owns only the
  revealed/entered code and dialog flags.

## Browser-storage handling

No completion-code value (revealed plaintext or entered code) is written to
`localStorage`, `sessionStorage`, IndexedDB, cookies, service-worker caches,
URL path/query/fragment/history state, or Zustand. Integration tests
directly inspect QueryCache entries, MutationCache entries, Zustand state,
both Web Storage objects, and `window.location.href` after generation,
rotation, dismissal, remount, and failed redemption.

## UX placement

- `CompletionCodeSection` renders at the bottom of
  `OrganizerQuestEditPage` for non-archived quests, reusing `rounded-box`,
  `btn`, `alert`, skeleton, and `ConfirmActionDialog` conventions. Actions
  are shown only when the quest is Published + OrganizerOwned + Native;
  other states get an explanatory note while the server stays authoritative
  (403/404/409/429 handled inline).
- `QuestCompletionPanel` renders directly below `QuestParticipationPanel`
  on `QuestDetailPage` for Native-registration quests only, reusing the
  participation panel's shell, button, and alert patterns. The reveal panel
  and redemption form are keyboard-reachable with accessible names; the
  reveal region receives focus when it appears.
- No XP, reward, level, achievement, or leaderboard UI is rendered; a test
  asserts the completion region contains no such wording.

## Files changed

New:

- `frontend/src/types/completion.ts`
- `frontend/src/lib/validation/completionDto.ts`
- `frontend/src/lib/api/completion.ts`
- `frontend/src/hooks/useCompletion.ts`
- `frontend/src/components/organizer/CompletionCodeSection.tsx`
- `frontend/src/components/quest/QuestCompletionPanel.tsx`
- `frontend/tests/unit/completionDto.test.ts`
- `frontend/tests/unit/useCompletion.test.tsx`
- `frontend/tests/integration/CompletionCodeSection.test.tsx`
- `frontend/tests/integration/QuestCompletionPanel.test.tsx`

Modified:

- `frontend/src/lib/api/apiFetch.ts` — additive optional
  `ApiError.retryAfterSeconds` parsed from delta-seconds `Retry-After`.
- `frontend/src/components/organizer/ConfirmActionDialog.tsx` — optional
  `cancelLabel` prop (default preserves the existing "Keep quest" label).
- `frontend/src/pages/OrganizerQuestEditPage.tsx` — render the section for
  non-archived quests, keyed by Quest ID (review m3).
- `frontend/src/pages/QuestDetailPage.tsx` — render the panel below the
  participation panel, keyed by Quest ID (review m3).
- `frontend/tests/integration/QuestDetailPage.test.tsx` — mock the new panel
  alongside the existing participation-panel mock.
- `frontend/tests/integration/OrganizerQuestEditPage.test.tsx` — seed the
  completion-code status query in `renderEdit` so existing fetch sequences
  are unchanged.

Evidence:

- `specs/ai/prompts/43-slice-4b2-completion-code-frontend-implementation.md`
  (added after review finding M3)
- `specs/implementation/reports/04b2-completion-code-frontend-completion.md`
  (this report)

## Tests added

60 new tests (179 total frontend tests pass):

- `completionDto.test.ts` (10): exact generation/rotation, status,
  redemption, and completion-state contracts; malformed/partial rejection;
  status and completion-state payloads cannot carry plaintext, hashes,
  identity, or XP; semantically inconsistent status and completion-state
  variants are rejected (review m1).
- `useCompletion.test.tsx` (8): key placement and collision-freedom;
  anonymous query gating; redeem invalidation set; 409 resync; no
  invalidation on invalid-code 400; plaintext returned only through the
  promise with empty MutationCache and clean QueryCache.
- `CompletionCodeSection.test.tsx` (22): loading, empty, configured, Draft
  note; reveal-once generation with reveal-focus assertion (review m2);
  immediate reveal despite a stalled status refetch (review M1); direct
  plaintext-absence inspection of QueryCache, MutationCache, Zustand,
  localStorage, sessionStorage, and URL; explicit copy + clipboard failure;
  dismissal, remount, rotation replacement, and quest-switch cleanup
  (review m3); rotation confirmation; failed generation (no fabricated
  plaintext); rejected rotation preserves the visible still-active code
  (review M2); 403 hides controls; status 404/429 bounded states and
  generation 429 with Retry-After (review m2); status retry.
- `QuestCompletionPanel.test.tsx` (20): anonymous CTA; non-Native renders
  nothing; loading; Verified state without XP wording; OwnQuest;
  not-participating; successful redemption with canonical identity, CSRF
  header, normalized code, and authoritative refetch; invalid-code bounded
  feedback with entered-code storage inspection; duplicate-Verified 409
  convergence; participation/OwnQuest 409 mapping; unsupported-mode 400;
  429 with Retry-After and no auto-retry; duplicate-submit protection;
  local shape validation without a request; 401; redemption 403/404 bounded
  mapping (review m2); typed-code reset on quest switch (review m3);
  recoverable load failure.

## Verification commands and observed results

Run from `frontend/` after the review-correction pass:

- `npm run lint` — passed; 0 warnings, 0 errors (103 rules, 72 files).
- `npm run type-check` — passed (`tsc -b`, no diagnostics).
- `npm run test` — passed; 19 test files, 179 passed, 0 failed
  (`vitest run`).
- `npm run build` — passed (`tsc -b && vite build`; 1874 modules, built
  successfully).

Repository hygiene:

- `git diff --check` — passed (no whitespace errors).
- `git status --short` — 6 modified frontend files, 10 new frontend files,
  the prompt record, this report, and the reviewer's review record; nothing
  outside `frontend/` and `specs/`.

## Review-correction closure

Codex independent review
(`specs/ai/reviews/34-slice-4b2-codex-independent-readiness-review.md`)
returned TARGETED FIX REQUIRED with 0 Blockers, 3 Majors, 3 Minors. All
findings were corrected in one bounded pass:

- **M1** (plaintext gated on status refetch): `useCompletion.ts` no longer
  awaits the status invalidation before returning the reveal-once response;
  a deterministic stalled-refetch test proves the code displays immediately
  and stays out of both caches.
- **M2** (failed rotation destroyed the visible code): the reveal is now
  replaced atomically on success only; a generate → rejected-rotate test
  proves the still-active code remains visible and cache/storage-clean.
- **M3** (missing prompt record):
  `specs/ai/prompts/43-slice-4b2-completion-code-frontend-implementation.md`
  added with the actual implementation instruction.
- **m1** (inconsistent DTO variants accepted): status and completion-state
  validators now enforce their two discriminated variants, with negative
  tests.
- **m2** (error-state matrix gaps): bounded status 404/429 and management
  429 (with Retry-After) handling; added organizer 404/429, participant
  403/404, and reveal-focus tests.
- **m3** (quest-context state leakage): both panels are keyed by Quest ID;
  rerender tests prove reveal and typed input reset on quest switch.

## Known limitations

- No browser smoke was run; behavior is verified through Vitest + Testing
  Library with the real `apiFetch` transport against a stubbed `fetch`.
- The 429 `Retry-After` display honors delta-seconds only (the form the
  backend limiter emits); HTTP-date values fall back to the generic wait
  message.
- The organizer section is placed below the edit form; no separate
  dashboard or code-history view exists (deferred by contract §5).

## Scope confirmation

- **No backend changes**: no controllers, DTOs, services, entities,
  migrations, configuration, or backend tests were added or modified.
- **No XP, achievement, level, leaderboard, share-card, evidence-claim,
  SelfReported, or admin-review behavior or presentation** was added; the
  completion panel asserts their absence in tests.
- **No new dependencies**: `package.json` and lockfiles are untouched.
- **No Docker, staging, production, or deployment configuration** changes.
- **No authentication-architecture changes**: existing cookie + CSRF
  conventions (`apiFetch`) are reused; the only `apiFetch` change is the
  additive optional `retryAfterSeconds` field.
- **No commits, pushes, branches, or PRs** were created.

## Review status

INDEPENDENT REVIEW COMPLETE (Codex, TARGETED FIX REQUIRED) — all 3 Major and
3 Minor findings corrected in one bounded correction pass; targeted closure
check against the original findings may follow per the AGENTS.md workflow.
