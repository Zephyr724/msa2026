# Slice 5B Codex Targeted Design Closure Review

Date: 2026-07-26
Reviewer: Codex (independent read-only reviewer)
Reviewed plan: `specs/implementation/05b-passport-lite.md`
Original review: `specs/ai/reviews/37-slice-5b-codex-independent-design-review.md`

## Scope

This is the single targeted closure check permitted by the repository
workflow. It is limited to Review 37's original Blocker B1 and Majors M1–M4.
It is not a second full review, does not reopen Minor findings, and does not
review production implementation because Slice 5B remains planning-only.

## Verdict

**CHANGES REQUIRED — M1–M4 CLOSED; B1 REMAINS OPEN**

The concentrated correction materially resolves all four original Major
findings. One security-sensitive ordering contradiction remains inside the B1
cache-boundary design, so the plan is not ready for D1–D8 approval or an
implementation prompt yet.

## Targeted closure results

### B1 — REMAINS OPEN

The plan now defines the required private-query prefixes, cancellation,
removal, login/logout integration points, deferred-request test, and
A → logout → B isolation test. Those parts satisfy most of the original
finding.

However, the session-expiry path still specifies the unsafe order at
`specs/implementation/05b-passport-lite.md:751-754`:

1. set `['auth','me']` to `null`;
2. then run `clearPrivateServerState`.

Review 37 required old-principal requests to be cancelled and private entries
removed **before** the principal is cleared or replaced. The plan follows that
rule for login replacement, but reverses it for a private 401. Because
`clearPrivateServerState` is asynchronous (`cancelQueries` followed by
`removeQueries`), the plan must not depend on React notification batching to
hide an intermediate state in which authentication is already anonymous while
the previous principal's sensitive queries still exist.

Required final correction, limited to B1:

- define one ordered session-expiry helper that awaits
  `clearPrivateServerState(queryClient)` first and only then sets
  `['auth','me']` to `null`;
- make logout use the same ordering before setting the auth cache to `null`;
- keep login cleanup awaited before installing the new session;
- state that the 401 path does not propagate/redirect until cleanup completes;
- update F9/F10 to assert this ordering, not only the final cache contents and
  rendered result.

No user-scoped query-key change is required.

### M1 — CLOSED

The plan selects an enforceable bounded policy for a caller with a Verified
completion whose `VerifiedAtUtc` is null: return the existing bounded
`503 progression-not-ready` before page mapping. Ordinary non-null
reward-pending rows remain available with `xpAmount: null`; the DTO timestamp
therefore truthfully remains non-null. Ordering explicitly states
`VerifiedAtUtc DESC NULLS LAST, Id ASC`, and B10 uses raw SQL with real
PostgreSQL to cover the invariant-failure path and caller isolation.

### M2 — CLOSED

Total XP is now a separate statistic. The visible fraction, progress element,
and ARIA values consistently use `currentLevelXp` over `levelSpanXp`;
XP-to-next uses `nextFloor - totalXp`. The Level 3 / 120 XP example is
corrected to 20/65 with 45 remaining. Numeric, level-range, safe-integer, and
cross-field inconsistencies are rejected into a bounded error state instead
of being silently clamped.

### M3 — CLOSED

`RequireAuth` now has four explicit states: pending, confirmed anonymous,
authenticated, and session-restore transport failure. Transport/5xx failure
renders retryable bounded UI and never redirects. Initial anonymous access
does not fire private requests. Private 401 handling clears the stale session
and redirects after the B1 lifecycle; F6–F9 cover the required states. The
remaining operation-order defect is accounted for solely under original B1.

### M4 — CLOSED

The service/repository design now includes an executable profile-existence
query before the invariant check and page query. B13 covers an authenticated
principal without a profile, including a seeded-completion case, and therefore
can prove the proposed bounded 404 is not merely documentary.

## Verification performed

- Re-read Review 37's B1 and M1–M4 acceptance conditions.
- Inspected the corrected plan's D3–D6, API contract, backend ordering,
  frontend cache/session lifecycle, UX semantics, and B/F test matrix.
- Re-anchored the proposal to the current `queryClient`, `useAuth`,
  `apiFetch`, `UserProfile`, and 5A reconciliation implementation.
- No implementation test suite was run because this remains a planning-only
  review.

## Bounded next step

The planning owner should make only the B1 ordering correction above. Because
the normal concentrated correction pass and targeted closure check have now
been consumed, the human must explicitly authorize that narrow documentary
correction. It does not justify a second full review. Once the exact ordering
is corrected and mechanically checked, the human may approve D1–D8 and the
recorded historical-title/category limitation before issuing the
implementation prompt.

## Final confirmation after the authorized B1 documentary correction

After the targeted closure result above, the human explicitly authorized the
single narrow B1 documentary correction. The planning owner changed only
`specs/implementation/05b-passport-lite.md`.

Codex then mechanically re-read the corrected B1 lifecycle and test
requirements. The plan now requires the same strict order for logout,
login/account replacement, and private-endpoint 401/session expiry:

1. await `clearPrivateServerState(queryClient)`;
2. inside it, await private-query cancellation and then remove the matching
   private queries;
3. only after cleanup, clear or replace `['auth','me']`;
4. only after the auth transition, redirect or finish the path.

F9/F10 now require deterministic call-order assertions in addition to final
cache and rendered-state assertions, and retain the deferred old-principal
request case.

This exactly closes the sole remaining part of original B1. It is a
mechanical confirmation of the human-authorized correction, not a second full
review and not a reopening of Minor findings.

**FINAL DESIGN VERDICT: APPROVE**

Original B1 and M1–M4 are closed. The human subsequently approved D1–D8,
accepted the client-mirrored level thresholds, and accepted the documented
mutable Quest-title/category/status limitation. Slice 5B is ready for its
assigned sole implementation owner within the reviewed plan.
