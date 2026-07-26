# Slice 6B Passport Achievements UI — Codex Targeted Design Closure Review

Date: 2026-07-26

Reviewer: Codex

Reviewed artifact:

- `specs/implementation/06b-passport-achievements-ui.md`

Original review:

- `specs/ai/reviews/44-slice-6b-codex-independent-design-review.md`

## Review scope

This is the single targeted closure check permitted by the bounded review
workflow. It is limited to the original Review 44 findings M1, m1, and m2. It
is not a second full design review and does not reopen accepted or previously
uncontested parts of the plan.

## Verdict

**APPROVE**

- Blockers: 0
- Open Majors from Review 44: 0
- Open Minors from Review 44: 0

All three original findings are closed. The plan remains proposed and still
requires explicit human approval of D1-D8 and the separately identified
implementation-boundary approvals before implementation begins.

## Closure findings

### M1 — CLOSED: unlocked display fields now come from the earned item

The corrected plan consistently separates the two endpoint responsibilities:

- the active catalog defines card slots, ordering, and locked-card display
  data;
- matching remains
  `earned.achievementId === catalogItem.id`;
- after a match, the unlocked card reads `code`, `name`, `description`,
  `iconUrl`, `category`, and `awardedAt` from the complete earned item;
- an earned row without a corresponding active catalog slot is not rendered.

The test contract now includes both required counterexamples: deliberately
different catalog and earned display values must render the earned values for
an unlocked card, and an earned row without an active catalog slot must not
create a card.

This closes the accepted-contract mismatch and the cross-request race identified
in Review 44 M1.

### m1 — CLOSED: Passport region behaviour has an explicit dependency boundary

The corrected plan no longer implies that file-local helpers from
`PassportPage.tsx` can be imported by `AchievementsSection.tsx`. It specifies
small private equivalent helpers inside `AchievementsSection.tsx`, including
the existing fixed copy, alert styling and ARIA roles, 404 warning without
retry, 503 information state with retry, and generic error state with retry.

It expressly prohibits a reverse import from `PassportPage.tsx`, does not add
a shared component file, and keeps the declared file map and count unchanged.

### m2 — CLOSED: catalog requests propagate cancellation

The corrected transport contract accepts an optional `AbortSignal`, forwards
it to `apiFetch`, and has the TanStack Query hook pass its supplied signal to
the transport. The focused test contract requires identity-level proof that
the same signal reaches `apiFetch` or the global fetch boundary.

## Scope and evidence check

- The plan status line remains unchanged.
- D1-D8 remain marked `REQUIRES HUMAN APPROVAL`.
- Prompt 51 retains the original prompt and appends a truthful correction
  record.
- The correction did not expand the planned production or test file map.
- No production code, tests, accepted specifications, dependencies,
  configuration, migration, or schema were changed as part of this planning
  correction.
- No stage, commit, push, merge, pull request, or deployment action was
  performed by this review.

## Required next step

Obtain explicit human approval for D1-D8, the documented cache-wide side
effects, and the declared 15-primary-file implementation boundary. After that,
Codex may implement Slice 6B as the sole implementation owner. Kimi K3 should
perform the one independent read-only implementation review after the required
prompt record and completion report exist.
