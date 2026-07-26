# Slice 5B Codex Independent Design Review

- **Date:** 2026-07-26
- **Slice:** 5B — Passport-lite and Progression Frontend
- **Reviewer:** Codex (independent from the Kimi K3 planning session)
- **Mode:** Read-only design review; review evidence only was added
- **Branch:** `05b-passport-lite`
- **Reviewed HEAD:** `7eea4fe30665ac58b5f012ad8be99c297c269eec`
- **Verdict:** `CHANGES REQUIRED`
- **Blockers:** 1
- **Majors:** 4
- **Minors:** 4

## Review instruction and scope

The human asked Kimi K3 to produce the first-version Slice 5B plan from
Prompt 46 and returned the result to Codex for independent design review.

This review:

- read Prompt 46 and the complete proposed plan;
- checked the merged Slice 5A progression, redemption, reconciliation, and
  readiness implementation;
- inspected the current frontend authentication lifecycle, QueryClient,
  route guards, router, navigation, completion invalidation, validation, and
  pagination conventions;
- checked the accepted Passport, privacy, API, domain, and UX direction;
- reviewed D1–D8, exact DTOs, history query semantics, cache ownership,
  authentication transitions, error states, responsive behavior, test matrix,
  file map, and documentation plan;
- did not modify the Kimi plan, prompt record, production code, tests,
  dependencies, accepted specifications, configuration, or Git history.

## Findings

### Blockers

#### B1 — Static self-query keys can disclose the previous user's Passport after an account switch

- **Location:** proposed plan
  `specs/implementation/05b-passport-lite.md:360-370,568-603,694-695`;
  current implementation
  `frontend/src/hooks/useAuth.ts:4-32`;
  `frontend/src/app/queryClient.ts:3-9`
- **Requirement:** D5/D6 require self-only Passport data and strict
  current-user isolation. Server data may live in TanStack Query, but it must
  not survive a principal boundary where another authenticated user can read
  it.
- **Issue:** the proposed progression and history keys are static
  `['progression','me']` and `['passport',...]`. The current logout mutation
  changes only `['auth','me']` to `null`; login changes only that auth entry
  to the new session. Nothing cancels or removes the previous principal's
  progression/history queries. Inactive TanStack Query data remains cached,
  and cached data can be returned when the same key mounts again. A user who
  signs out after visiting Passport and another user who signs in in the same
  browser can therefore receive the first user's XP and completion history
  from the client cache.
- **Impact:** cross-account disclosure of private completion records, Quest
  history, XP, Level, and Rank Title. Backend self-authorization does not
  protect data already cached in the browser.
- **Required correction:** define one explicit authenticated-cache lifecycle.
  At minimum:
  - cancel in-flight progression/Passport queries before a principal is
    cleared or replaced;
  - remove all progression/Passport queries on successful logout and before
    installing a successful login session;
  - prevent a late response belonging to the old principal from repopulating
    the cache;
  - define the same cleanup when a private endpoint returns 401/session expiry;
  - add deterministic A → logout → B tests that inspect QueryCache and prove B
    never renders A's data, including a deferred A request resolving after
    logout.

  User-scoping the keys by the authenticated user ID can be considered, but it
  does not replace cleanup of sensitive inactive queries.
- **Reference:** TanStack documents that inactive queries remain cached by
  default and that `removeQueries` removes matching cache entries:
  [Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults),
  [QueryClient](https://tanstack.com/query/latest/docs/reference/QueryClient).

### Majors

#### M1 — The proposed history contract cannot represent the supported null verification-timestamp invariant failure

- **Location:**
  `specs/implementation/05b-passport-lite.md:317-326,439-467,479-483,533-545`;
  5A accounting at
  `backend/src/Kiwimpact.Infrastructure/Repositories/XpLedgerRepository.cs:34-43`
- **Requirement:** 5A deliberately treats every Verified completion with null
  `VerifiedAtUtc` as unprocessable and readiness-blocking. Slice 5B must define
  truthful behavior for that persisted state without inventing a timestamp or
  claiming an impossible DTO.
- **Issue:** the DTO requires non-null `verifiedAtUtc`, but the plan says a
  raw-SQL Verified/null row “still renders.” No mapping value is defined.
  Calling `.ToString("O")` on the nullable property cannot satisfy the
  contract. The ordering claim is also factually reversed: PostgreSQL defaults
  nulls to **first** for descending order, not last.
- **Impact:** the proposed query can place the unprocessable row at the top and
  then either throw during mapping or violate its exact DTO. The planned B9
  covers an ordinary reward-pending row but not this already-supported
  invariant-failure state.
- **Required correction:** choose an enforceable policy specifically for
  Verified/null rows. Viable bounded options are:
  - reject that caller's history with a bounded not-ready/invariant response
    while leaving ordinary non-null reward-pending history available; or
  - make the timestamp nullable and define its ordering and accessible UI
    copy without inventing history.

  Do not silently omit the row while claiming complete history. Specify
  explicit null ordering and add a real-PostgreSQL raw-SQL test for the chosen
  behavior.
- **Reference:** PostgreSQL specifies `NULLS FIRST` as the default for `DESC`:
  [Sorting Rows](https://www.postgresql.org/docs/current/queries-order.html).

#### M2 — The progress bar has two contradictory XP units

- **Location:**
  `specs/implementation/05b-passport-lite.md:286-303,503-517,637-640,683-684`
- **Requirement:** D3 promises fully specified current-level progress and
  accessible progress semantics.
- **Issue:** D3 correctly defines progress within the current level as
  `totalXp - floor(level)` over `floor(level + 1) - floor(level)`. Section 14
  then gives visible text `120 / 165 XP toward Level 4`, while requiring
  `aria-valuenow` to be progress within the level and `aria-valuemax` to be
  the level span. At Level 3 with 120 total XP, those values are 20 of 65,
  not 120 of 165. Visual text and assistive-technology values would describe
  different measurements.
- **Impact:** an authoritative-looking progress indicator is semantically
  inconsistent and accessibility tests cannot pin one correct contract.
- **Required correction:** select and use one unit everywhere. Recommended:
  display total XP separately; use `currentLevelXp = totalXp - floor(level)`
  and `levelSpanXp = nextFloor - floor(level)` for the bar and its visible
  fraction; use `nextFloor - totalXp` for “XP to Level N.” Correct all examples
  and tests. Define bounded invalid-state behavior rather than silently
  clamping a server payload whose `totalXp` and `level` are inconsistent.

#### M3 — The authentication guard conflates transport failure with anonymous state and does not handle mid-page 401

- **Location:**
  `specs/implementation/05b-passport-lite.md:574-576,605-623,641-645,688-691`;
  current pattern
  `frontend/src/components/organizer/RequireManagementAccess.tsx:26-50`;
  `frontend/src/lib/api/auth.ts:4-12`
- **Requirement:** the planning prompt requires distinct unauthorized and
  unexpected-error states. Only a confirmed 401/null session should redirect
  to login.
- **Issue:** the proposed guard specifies pending → skeleton, anonymous →
  redirect, otherwise children, but does not define `auth.isError`. Following
  the current management guard literally redirects a network/500 session
  restoration failure as though the user were anonymous. The plan also claims
  a mid-page expired session will be driven by the auth query “on next
  render,” but a 401 from progression/history does not update or invalidate
  `['auth','me']`; with a 60-second auth stale time, the guard can continue to
  consider the old session valid.
- **Required correction:** make the guard state machine explicit:
  pending, confirmed anonymous, authenticated, and session-restore failure
  with bounded retry. Define how any Passport/progression 401 invalidates or
  refetches auth, performs B1 cleanup, and redirects. Add tests for auth
  transport failure (no redirect), initial anonymous access (no private fetch),
  and mid-page session expiry.

#### M4 — The proposed service architecture cannot produce its specified missing-profile 404

- **Location:**
  `specs/implementation/05b-passport-lite.md:460-467,529-540,622-623,674`
- **Requirement:** D5, the API contract, and B12 all specify bounded 404 when
  an authenticated principal has no `UserProfile`.
- **Issue:** the proposed Core service checks only `actorId == Guid.Empty`.
  The repository design queries completions directly and specifies no profile
  existence lookup or join. A valid nonempty authenticated user with no
  profile will therefore naturally receive an empty 200 page, not the planned
  404.
- **Required correction:** either add an explicit no-profile existence check
  to the repository/service boundary and prove it precedes the history page,
  or change D5/API/tests consistently to approve 200 empty. Do not leave a
  response condition with no executable design.

### Minors

#### m1 — “Strict” frontend validation lacks numeric and cross-field bounds

- **Location:**
  `specs/implementation/05b-passport-lite.md:558-562,683-684`
- **Issue:** exact keys plus `number-or-null` do not enforce finite safe
  integers, nonnegative totals/counts, Level 1–99, positive bounded XP,
  coherent pagination fields, or progression consistency. The client mirror
  assumes these invariants.
- **Correction direction:** require `Number.isSafeInteger` where JSON numbers
  feed arithmetic, int-range/positivity constraints where appropriate, Level
  bounds, coherent page/total flags, and semantic progression checks selected
  under M2. Add negative cases for fractional, unsafe, negative, out-of-range,
  and internally inconsistent payloads.

#### m2 — The current subset is not safely isolated from future completion methods

- **Location:**
  `specs/implementation/05b-passport-lite.md:317-339,471-475,747-750`
- **Issue:** the query filters only `Status == Verified`, while the exact DTO
  and frontend validator accept only `method: CompletionCode`. A future
  Verified EvidenceClaim would enter this query automatically and break the
  5B frontend. Calling `method` “forward compatibility” is therefore
  inaccurate. The accepted §2.11 precedence must also remain future direction;
  documenting a currently implemented subset must not rewrite it away.
- **Correction direction:** explicitly isolate the 5B subset by method as
  well as status, record that a future completion-method Slice must broaden
  backend and frontend together, and amend §2.11 additively without narrowing
  its accepted long-term precedence.

#### m3 — Offset pagination is deterministic only while the dataset is unchanged

- **Location:**
  `specs/implementation/05b-passport-lite.md:319-321,479-483,668-670`
- **Issue:** the ID tie-break gives deterministic ordering for a fixed data
  snapshot, but page-number `Skip/Take` is not stable across a concurrent new
  completion; rows can shift between pages. The plan and test name overstate
  the guarantee.
- **Correction direction:** state the bounded offset-pagination behavior
  truthfully, keep the tie-break test for a fixed dataset, and define page
  reset/clamping after redemption invalidation or a changed `totalPages`.
  Cursor pagination is not required for this small P0 history.

#### m4 — Responsive navigation and implementation details are not fully testable as written

- **Location:**
  `specs/implementation/05b-passport-lite.md:570-573,584-588,698,784-787`
- **Issue:** adding another authenticated navbar action while explicitly
  leaving the existing unwired mobile navigation unchanged can make Passport
  unreachable or overflow for Organizer/Admin at narrow widths. Class
  assertions alone do not observe layout. The plan also names the removed
  TanStack v4-style `keepPreviousData` option; this repository's v5 idiom is
  `placeholderData: keepPreviousData`
  (`frontend/src/hooks/useQuests.ts:1-10`).
- **Correction direction:** specify a bounded 320/375px navigation treatment
  and require an observed responsive browser smoke check during implementation
  (or a minimal mobile menu if the current row cannot fit). Correct the v5
  hook syntax. Also repair the split D6 heading and duplicated `### Commands`
  heading as plan hygiene.

## Assessment of the proposed scope

The recommended product boundary is appropriate after the findings are
corrected:

- summary composition plus one Verified completion-history endpoint is a
  useful Passport-lite surface;
- preserving the exact Slice 5A progression DTO is preferable to expanding it;
- a client-side display-only threshold mirror is acceptable if M2/m1 make its
  units and invariant handling exact;
- nullable `xpAmount` for an ordinary non-null-timestamp pending reward is
  honest and does not derive rewards client-side;
- current mutable Quest title/category is an explicit P0 historical-fidelity
  limitation, not a hidden claim. It can be human-approved without a schema
  change;
- excluding achievements, streaks, leaderboard, Share Card, community
  aggregation, reward animation, Evidence Claims, and SelfReported completion
  keeps the Slice bounded.

No schema or dependency change is recommended by this review.

## Verification performed

This was a planning review, so implementation test suites were not run.

- `git branch --show-current` — observed `05b-passport-lite`.
- `git rev-parse HEAD` — observed
  `7eea4fe30665ac58b5f012ad8be99c297c269eec`.
- `git status --short --branch` — only the two Kimi planning files were
  untracked before this review record.
- Read-only source/spec inspections listed in the review scope were completed.
- `git diff --check HEAD` — no whitespace findings.
- Both untracked Kimi files passed `git diff --no-index --check`.
- No runtime behavior is claimed from this unimplemented plan.

## Verdict and bounded next step

`CHANGES REQUIRED`.

B1 and M1–M4 must be corrected before the human approves D1–D8 or
implementation begins. Per `AGENTS.md`, the Kimi K3 planning owner should
perform one concentrated correction pass on the existing plan. The correction
may also close m1–m4. Codex should then perform one targeted closure check
limited to B1 and M1–M4; that check is not a second full review.

Do not issue the Slice 5B implementation prompt yet. No stage, commit, push,
PR, migration, schema, dependency, accepted-specification, or production-code
change is approved by this review.
