# Slice 4A — Quest Participation Core

- **Status:** Proposed — pending human approval and independent review
- **Date:** 2026-07-24
- **Risk:** Important — authenticated self-service writes, capacity under concurrency, additive schema
- **Implementation owner:** One implementation session (per AGENTS.md routing)
- **Decided (2026-07-24):** A Quest creator may never join that Quest, for
  Member, Organizer, and Admin alike. This is final and no longer open.
- **Design corrections (2026-07-24):** M1–M4 closed — creator-versus-Draft
  precedence, exact single-context transaction boundary, deterministic
  lock-contention test, and migration guarantee proofs.

## 1. Goal

Deliver the smallest full-stack Slice in which an authenticated user joins an
eligible Published Native-registration Quest, sees the joined state on the
existing public Quest detail page across reloads, and cancels that
participation. No completion, proof, attendance, or XP behavior is introduced.

## 2. Current implementation baseline

- Public Quest read exists (`QuestsController`, anonymous, Published-only,
  `404` otherwise); `QuestDetailDto` exposes `capacity`, no participant data.
  Slice 3A established role authorization, `NameIdentifier` actor resolution,
  antiforgery filter, `xmin` `Version`, and exception → `ProblemDetailsHelper`.
- `QuestParticipation` exists only in the accepted data model
  (`specs/architecture/02-core-domain-data-model.md` §3.6), not in code.
- Accepted specifications already bar a Quest creator from Verified Completion
  or XP through their own Quest (self-dealing prevention). Slice 4A enforces
  that boundary earlier, at participation creation.
- Frontend has `QuestDetailPage`, `useAuthQuery` (`['auth','me']`), `apiFetch`
  (cookie + automatic `X-CSRF-TOKEN`), TanStack Query, and hand-rolled DTO
  validators. PostgreSQL Testcontainers integration infrastructure exists
  (`CustomWebApplicationFactory`, `TestDatabaseFixture`, migration smoke tests).

## 3. Scope

- New `QuestParticipation` persistence with one additive EF Core migration
  (§8; human gate before creation).
- Authenticated current-user self-service only: join, cancel, and read own
  participation state for one Quest, with server-authoritative eligibility,
  duplicate-active prevention, and transaction-safe capacity (§7, §9).
- Creator self-join prevention (`Quest.CreatedByUserId == actorId` → `409`)
  for Member, Organizer, and Admin alike, surfaced through the
  participation-state DTO so the frontend never needs to attempt the join.
- Scalar documentation; Quest detail page join/cancel UI with anonymous CTA.
- Focused Core unit, PostgreSQL integration, and frontend tests.

## 4. Out of scope

Completion claim, proof/evidence, attendance approval, XP award, level/rank,
achievements, streak, leaderboard, Organizer participant list/management,
Admin participant management, email notification, waitlist, recurring
participation, calendar, maps, SignalR, Cypress, Storybook, Slice 2B,
`/track` (External tracking), `GET /api/v1/users/me/participations` (future
"My Quests" list), new dependencies, and any change to the frozen anonymous
`GET /api/v1/quests*` contract.

## 5. Actor and authorization matrix

| Actor | Join / cancel / read own state |
| --- | --- |
| Guest | `401` (frontend shows sign-in CTA) |
| Member | Own participation only; never a Quest they created |
| Organizer | Same rule; may join Quests created by others, never their own |
| Admin | Same rule; may join Quests created by others, never their own |

- Endpoints explicitly authorize the intended role set — Member, Organizer,
  and Admin (`[Authorize(Roles = AppRoles.Member + "," + AppRoles.Organizer +
  "," + AppRoles.Admin)]`). ASP.NET Core Identity role inheritance is never
  assumed. `403` applies to any authenticated principal outside the set.
- Role permission alone never makes the current user eligible to join a
  specific Quest: `Quest.CreatedByUserId == authenticatedUserId` forbids the
  join for every role. Quest ownership grants no participation, completion,
  evidence-claim, completion-code, attendance, approval, or reward shortcut.
- Actor identity comes only from the `ClaimTypes.NameIdentifier` claim;
  requests carry no user ID and extra JSON never influences identity.
- No user can act for another; Organizer ownership never permits acting for
  another participant. Frontend hiding is UX only; the backend is
  authoritative. Public APIs expose no participant identities.

## 6. Visibility and eligibility rules (server-authoritative)

Visibility and join eligibility are separate stages. For
`POST /api/v1/quests/{questId}/join`, in this deterministic order:

1. Missing Quest → `404 Not Found`.
2. Existing Quest created by the authenticated user (decided 2026-07-24) →
   `409` OwnQuest — evaluated before Quest status, registration mode, dates,
   duplicate participation, or capacity; creates no participation; consumes
   no capacity. Ownership is read from the persisted Quest and the
   authenticated session identity, never from frontend state.
3. Existing non-owner Draft Quest → `404`; the Draft is not disclosed through
   the participation operation.
4. Existing non-owner Quest → the accepted eligibility rules below.

Stage-4 eligibility rules, resolved from accepted specifications
(`03-api-contract.md` §2.7, `02-core-domain-data-model.md` §3.4/§3.6,
baseline §6):

1. Status must be Published; Cancelled or Archived → `409` (the contract's
   two distinct error lines).
2. `RegistrationMode` must be `Native`; otherwise `400` (mirrors the accepted
   "`/track` on a Native Quest → 400" wrong-endpoint precedent).
3. `EndAtUtc` in the past → `409`; `StartAtUtc` does not restrict joining.
   The baseline's undefined "date rules" make this a §16 confirmation gate.
4. Duplicate active participation (same user, same Quest, `CancelledAt IS
   NULL`) → `409`.
5. Capacity (Native only): `Capacity` null = unlimited; otherwise join
   requires `activeCount < Capacity`, where `activeCount` = participations
   with `CancelledAt IS NULL`. Full → `409`.
6. Cancel requires an existing active participation; otherwise `409`.
   Cancellation is allowed whenever one exists, including after Quest
   start/end (frees capacity; no XP exists to claw back). §16 gate.
7. Joining creates no XP, completion, or leaderboard effect.
8. A rejected join (any rule, including OwnQuest) creates no participation
   row, updates or reactivates no row, changes no Quest, and consumes no
   capacity.

## 7. Data model and migration proposal

Implements accepted `QuestParticipation` (`02-core-domain-data-model.md`
§3.6, §5, §8) exactly; **no completion/XP/achievement/streak/leaderboard
columns**. **Database-schema approval is a human gate before implementation.**

- Table `QuestParticipations`; Core entity `QuestParticipation` with
  encapsulated construction (`CreateActive(userId, questId, now)`),
  `Cancel(now)`, internal setters — matching `Quest` conventions.
- Columns: `Id uuid PK`; `UserId uuid not null` FK → `AspNetUsers.Id`
  Restrict; `QuestId uuid not null` FK → `Quests.Id` Restrict; `JoinedAt
  timestamptz not null`; `CancelledAt timestamptz null` (active = null,
  cancelled = set; no enum column); `Version` → `xmin` (the accepted
  concurrency-token list includes `QuestParticipation`).
- `UX_QuestParticipations_UserId_QuestId_Active`: partial unique
  `(UserId, QuestId) WHERE "CancelledAt" IS NULL` (accepted §5.1); also
  serves current-user-per-Quest lookup.
- `IX_QuestParticipations_QuestId_Active`: partial `(QuestId) WHERE
  "CancelledAt" IS NULL` for capacity counting. A general `UserId` list
  index is deferred with the out-of-scope list endpoint.
- Cancel retains the row (soft cancel), enabling the accepted
  `status=cancelled` listing. Rejoin creates a new row (append-only). §16 gate.
- Migration `AddQuestParticipation` (additive only) is created during
  implementation, not planning; must apply to empty and current schemas.
  §13 proves these constraints behaviorally — index catalogue inspection,
  Restrict-delete rejection, and `xmin` metadata — not just migration smoke.

## 8. Capacity and transaction design

- The authoritative join write is one atomic repository operation: one scoped
  `KiwimpactDbContext`, one database connection, one active EF Core
  transaction, in this exact sequence:
  1. Begin the database transaction.
  2. Execute and materialize a parameterized Quest query using PostgreSQL
     `SELECT ... FOR UPDATE` (`FromSqlInterpolated`) with an async terminal
     operation (e.g. `FirstOrDefaultAsync`). Constructing an unenumerated
     `FromSqlRaw`/`FromSqlInterpolated` query does not take the lock.
  3. Use the materialized tracked Quest for visibility, creator, status,
     registration-mode, date, and capacity-limit evaluation.
  4. Evaluate creator self-participation and all other §6 join eligibility.
  5. Count active `QuestParticipation` rows using the same DbContext and
     active transaction.
  6. Add the new participation through that same DbContext.
  7. Execute `SaveChangesAsync` while the transaction and Quest lock remain
     active.
  8. Commit only after `SaveChangesAsync` succeeds.
  9. Roll back, or allow transaction disposal to roll back, on every failed
     path.
- Concurrent joins for the same Quest serialize on that row lock; the second
  transaction then observes the updated active count.
- Explicitly prohibited: a second DbContext; a second connection; loading the
  Quest before the transaction; counting outside the transaction; saving
  after the transaction has ended; disposing the transaction before
  `SaveChangesAsync`; any separate join path that bypasses this repository
  operation. The Core/application service may invoke the operation but must
  not split locking, eligibility, count, insert, and commit across separate
  repositories or contexts.
- Backstop: the partial unique index turns a same-user concurrent duplicate
  into a unique violation (23505) → `409`; `DbUpdateConcurrencyException`
  (xmin) → generic `409`. No server retry.
- No new package, Redis, queue, distributed lock, in-memory count,
  client-supplied capacity, or frontend-only enforcement.

## 9. API endpoints and DTOs

The anonymous `GET /api/v1/quests*` surface is unchanged; a new
`QuestParticipationController` (`[Route("api/v1/quests")]`) owns the routes.

| Method | Route | Auth | Success |
| --- | --- | --- | --- |
| `POST` | `/api/v1/quests/{questId}/join` | Member+ | `201 QuestParticipationDto` + `Location` |
| `POST` | `/api/v1/quests/{questId}/cancel` | Member+ | `200 QuestParticipationDto` |
| `GET` | `/api/v1/quests/{questId}/participation` | Member+ | `200 MyQuestParticipationDto` |

Join/cancel accept **no request body** (any body is ignored); user identity
comes only from the authenticated session. The join route is unchanged and no
creator-specific endpoint exists. A successful join returns `201 Created`
with `Location: /api/v1/quests/{questId}/participation` — the current-user
participation-state resource; no participant-identity resource is created.
Exact records (camel-case JSON, canonical enum names, ISO 8601 UTC):

```text
QuestParticipationDto(participationId, questId, status, joinedAtUtc, cancelledAtUtc)
MyQuestParticipationDto(status, canJoin, ineligibilityReason, capacityFull)
```

- `MyQuestParticipationDto` defines exactly: `status`:
  `"None" | "Active" | "Cancelled"`; `canJoin`: boolean;
  `ineligibilityReason`: `ParticipationIneligibilityReason | null`;
  `capacityFull`: boolean. `None` means no participation row. When only
  cancelled rows exist (`status = "Cancelled"`), GET uses the latest
  cancelled row: `JoinedAt DESC`, then `Id DESC` as the stable tie-breaker.
- `ParticipationIneligibilityReason`: `OwnQuest`, `AlreadyParticipating`,
  `QuestNotPublished`, `RegistrationModeNotSupported`, `QuestEnded`,
  `CapacityFull`. Authentication failure is not a value — anonymous callers
  receive `401`, never this DTO.
- Deterministic precedence when several conditions hold: `OwnQuest` →
  `AlreadyParticipating` → `QuestNotPublished` →
  `RegistrationModeNotSupported` → `QuestEnded` → `CapacityFull` → otherwise
  `null` (then `canJoin = true`). The creator sees `canJoin = false`,
  `ineligibilityReason = "OwnQuest"` even when capacity is available; an
  active participant sees `status = "Active"`, `AlreadyParticipating`; a
  cancelled participant may rejoin only when every rule passes (new row);
  a full Quest shows `capacityFull = true`, `CapacityFull`.
- `capacityFull` is an authenticated, time-sensitive server result for
  display only; it never replaces the authoritative capacity check inside
  the join transaction. No participant identities, emails, numeric
  participant counts, or other users' participation states are exposed.
- Join failures, in the §6 stage order: missing Quest `404`; creator
  self-join (any status, including the creator's Draft) `409`; non-owner
  Draft `404`; Cancelled/Archived `409`; non-Native `400`; ended `409`;
  duplicate active `409`; capacity full `409`. No failed join creates or
  modifies participation data.
- GET participation-state applies its visibility gate before constructing
  the DTO: missing → `404`; Draft → `404`, including when the current user
  is its creator; a visible non-Draft Quest (Published, Cancelled, Archived)
  → `200` with the DTO. DTO precedence applies only after the resource is
  visible to this endpoint. Cancel: `404` missing/Draft, else allowed while
  active.
- Scalar: exact response/ProblemDetails annotations on all three endpoints.

## 10. Backend service/repository boundaries

- Core: `QuestParticipation` entity; `IQuestParticipationRepository`;
  `IQuestParticipationService` + `QuestParticipationService` (orchestration,
  eligibility); `QuestParticipationException` + `QuestParticipationError`
  enum mirroring the `QuestManagementService` pattern. Eligibility evaluation
  is a pure, unit-testable function of (Quest, actorId, activeCount, own
  active participation, now) returning the §9 precedence-ordered result; the
  service invokes the single §8 repository join operation and never
  orchestrates lock, count, insert, and commit across separate calls.
- Infrastructure: `QuestParticipationConfiguration`, `DbSet` on
  `KiwimpactDbContext`, `QuestParticipationRepository` (the §8 atomic join
  operation, cancel, current-user state read, unique-violation translation).
- API: controller (§9) with the explicit three-role `[Authorize(Roles=...)]`
  set, DTO records + mapping, DI registrations. Controllers never touch
  `KiwimpactDbContext`; no generic repository, CQRS, or MediatR.

## 11. Frontend behavior and state ownership

- New `lib/api/participation.ts` (`fetchMyQuestParticipation`, `joinQuest`,
  `cancelQuestParticipation`) over `apiFetch` (cookies/CSRF automatic); new
  `types/participation.ts` and a matching hand-rolled DTO validator.
- New `hooks/useParticipation.ts`, query key `['quest', questId,
  'my-participation']`, enabled only when `useAuthQuery` returns a session.
  TanStack Query owns participation state; auth Query owns identity;
  component state owns only cancel-confirmation UI; Zustand gets none —
  creator eligibility and participation state are never stored in Zustand.
- Mutations: `retry: false`; no optimistic success. On success: update the
  participation Query data and invalidate `['quest', questId]`.
- `QuestDetailPage` gains a participation section driven by the
  participation-state DTO (`canJoin` / `ineligibilityReason` / `status` /
  `capacityFull`); the backend remains authoritative:
  - Anonymous: "Sign in to join this quest" CTA linking to `/login`.
  - Member, Organizer, or Admin, not joined, eligible: Join button.
  - Joined (`status = "Active"`): joined indicator + Cancel action behind a
    component-local inline confirmation.
  - Creator (`ineligibilityReason = "OwnQuest"`): no Join button is rendered
    or enabled; a clear, non-actionable explanation states that creators
    cannot join their own Quest; no join request is sent; the UI never
    implies the restriction is enforced only by the UI.
  - `capacityFull`: disabled "Quest is full" state (no count shown).
  - Non-Native modes: no join controls (External keeps the existing provider
    panel; `NoneRequired` needs none); the backend still enforces.
  - Organizer/Admin see the same Member controls and can join another
    creator's eligible Quest; management stays on the Organizer console.
  - Pending disables both buttons. `409` surfaces the server `detail`
    (already joined / full / no longer eligible / own Quest) and invalidates
    the Quest + participation Queries — a stale display that still offered
    Join handles the `409` OwnQuest response safely; a now non-Published
    Quest lands on the 404 state.
  - Controls are keyboard-reachable with accessible names and
    `aria-disabled`/busy semantics, usable at mobile widths (daisyUI).

## 12. Error and ProblemDetails behavior

- Via `ProblemDetailsHelper`: `400` validation/CSRF, `401` unauthenticated,
  `403` authenticated but outside the Member/Organizer/Admin set, `404`
  missing Quest or (for a non-owner) Draft Quest, `409` OwnQuest (including
  the creator's own Draft) / duplicate / capacity / Cancelled-Archived /
  ended / nothing-to-cancel / concurrency; no other-user leakage.
- Antiforgery: state-changing endpoints pass through the existing filter;
  failures stay `400` `invalid-csrf-token`. Integration tests assert it.
- Unique-violation and `DbUpdateConcurrencyException` map to generic `409`
  without internals. No failed join creates or modifies participation data.

## 13. Test requirements

Backend unit (Core): eligibility matrix (status, mode, end time, capacity
reached/unlimited/null); duplicate-active → conflict; cancel with no active
row → conflict; entity create/cancel invariants and UTC timestamps;
exception→error-enum mapping; §6 stage order (creator check precedes the
Draft-visibility check on join); plus the creator-rule set:

1. Creator self-participation is ineligible (`OwnQuest`).
2. `OwnQuest` has higher precedence than `CapacityFull`.
3. Organizer and Admin are eligible for Quests created by another user.
4. Role permission never bypasses the creator ownership restriction.
5. A rejected creator self-join does not affect capacity calculations.

PostgreSQL integration (Testcontainers, existing factory/fixture). All tests
use the authenticated session user and the persisted `CreatedByUserId`;
enforcement is never simulated through frontend state:

1. Anonymous join → `401`.
2. Eligible Member joins → `201`; row persisted; `Location` targets
   `/api/v1/quests/{questId}/participation`.
3. Session user ID is used; no client-supplied user ID exists or is honored.
4. Duplicate join → `409`; still exactly one active row.
5. Non-owner: Draft → `404`; Cancelled/Archived → `409`.
6. Capacity 1 with one active participant → second user's join `409`.
7. Concurrent final-slot, deterministic (M3): seed one Published Native Quest
   with exactly one available slot; use two different authenticated users,
   two independent HTTP request scopes/clients, and independent database
   sessions. An independent PostgreSQL transaction holds `SELECT ... FOR
   UPDATE` on that Quest row; both join requests start while the external
   lock is held; bounded coordination (or an equivalent deterministic
   mechanism) establishes that both requests have begun and cannot complete
   while the row remains locked; the external lock is released; both requests
   are awaited. Assert exactly one `201`, exactly one capacity `409`, exactly
   one active participation, and active count ≤ capacity. A timing-only
   `Task.WhenAll` without proven overlap is insufficient; the observed
   blocking demonstrates that every authoritative join request attempts the
   same Quest-row lock discipline.
8. GET participation returns `None`/`Active`/`Cancelled` correctly; latest
   cancelled row follows `JoinedAt DESC`, then `Id DESC`.
9. Cancel → `200`, `CancelledAt` set, capacity freed (another user can join).
10. User B cancel when only A joined → `409`; A's row untouched.
11. Rejoin after cancel → new active row; old row remains cancelled.
12. POST without CSRF token → `400` `invalid-csrf-token`.
13. Migration smoke: `AddQuestParticipation` applies to a clean database and
    to the prior schema; extend the existing migration tests.
14. Organizer creator self-join → `409`; no participation row persisted.
15. Organizer creator self-join consumes no capacity (another user can still
    take the final slot).
16. Organizer may join an eligible Quest created by another user → `201`.
17. Admin creator self-join → `409`; no participation row persisted.
18. Admin may join an eligible Quest created by another user → `201`.
19. A Member who created a Quest through an accepted seeded/administrative
    path is blocked by the same ownership rule → `409`.
20. Participation-state endpoint returns `canJoin = false`,
    `ineligibilityReason = "OwnQuest"` for the creator.
21. A stale or manipulated client POSTing a creator self-join directly is
    still rejected `409`.
22. Creator-owned Draft join → `409` OwnQuest; creates no participation and
    consumes no capacity.
23. Non-owner Draft join → `404`; the response discloses neither Draft
    details nor participation data.
24. Creator-owned Draft GET participation-state → `404`.
25. Authenticated principal without Member, Organizer, or Admin → `403`.
26. `MyQuestParticipationDto` exact-key assertion: the response contains only
    `status`, `canJoin`, `ineligibilityReason`, `capacityFull` — no user ID,
    participant/participation ID, email, display name, participant count, or
    another user's state.

Migration and model guarantees (real PostgreSQL; catalogue, EF-metadata, and
behavioral proof, e.g. via `pg_indexes`/`pg_constraint` or equivalent):

- Active-participation partial unique index: it exists; its indexed columns
  are `UserId` and `QuestId`; its predicate represents active rows only
  (`CancelledAt IS NULL`); two active rows for the same user and Quest cause
  unique violation `23505` independently of service-level duplicate checks;
  a cancelled historical row plus one new active row is permitted.
- Capacity-query index: it exists; it indexes `QuestId`; it carries the
  accepted active-row predicate; its definition matches the migration/model
  contract.
- Restrict foreign keys, proven behaviorally: deleting a Quest with retained
  participation history is rejected; deleting an Identity user with retained
  participation history is rejected; the participation rows remain intact
  after each rejected delete.
- `xmin` concurrency mapping: `QuestParticipation.Version` maps to
  PostgreSQL `xmin`; the EF model marks it as a concurrency token and
  store-generated value; it is not a normal application-managed column (EF
  model metadata plus real PostgreSQL behavior).

Frontend (Vitest + Testing Library): anonymous CTA; Member join state; joined
state + cancel confirmation; pending disables duplicate actions; capacity-full
state; server `409` resync; join/cancel use `apiFetch` (CSRF automatic);
mutation retry disabled; Query invalidation/update on success; no participation
state in Zustand (store assertion); accessible/responsive controls in jsdom;
plus the creator-rule set: the creator receives the `OwnQuest` ineligible
state; Join is not rendered or enabled for the creator; a clear
creator-specific explanation is shown; no join mutation is sent from that
state; Organizer/Admin still see Join for another creator's eligible Quest;
a direct server `409` OwnQuest response is presented safely; participation
state remains in TanStack Query and is not added to Zustand.

## 14. Definition of Done

- One authenticated user joins an eligible Quest; joined state survives
  reload (server-persisted, refetched).
- Duplicate join cannot create a second active row (service + unique index);
  the deterministic final-slot test proves exactly one winner under a real
  externally-held Quest-row lock, and active count never exceeds capacity.
- A user cancels only their own participation; another user cannot. Quest
  detail reflects authoritative state after join/cancel; Cookie + CSRF
  throughout. No completion, proof, attendance, or XP behavior.
- A Quest creator cannot join their own Quest; the rule applies equally to
  Member, Organizer, and Admin.
- Rejected creator self-join creates no participation and consumes no
  capacity; Organizer/Admin can still join another creator's eligible Quest.
- Creator-owned Draft join returns `409` OwnQuest (no row, no capacity);
  non-owner Draft join returns `404`; GET participation-state returns `404`
  for any Draft, including the creator's.
- The participation-state endpoint exposes `OwnQuest`; the frontend shows a
  non-actionable creator explanation; backend and frontend tests prove the
  rule; no completion or reward behavior is introduced.
- Migration/model tests prove the partial unique index (`23505`), the
  capacity-query index, Restrict delete behavior, and the `xmin` concurrency
  mapping on real PostgreSQL.
- Applicable gates pass (§18), migration applies cleanly, Scalar documents
  the endpoints, real-browser smoke of join → reload → cancel when the
  environment permits.
- Implementation prompt record and completion report exist before review;
  one independent read-only review completes before commit, then at most one
  correction pass and one targeted closure check.

## 15. Risks

- `FOR UPDATE` uses one raw-SQL fragment (`FromSqlInterpolated`,
  parameterized); it is the smallest Npgsql-supported pessimistic lock and is
  covered by the deterministic external-lock concurrency test.
- Cancelled/Archived Quests remain visible to the state/cancel endpoints
  while hidden publicly; tests pin this asymmetry. The join endpoint answers
  `409` OwnQuest for the creator's Draft while GET answers `404`; both are
  pinned by tests.
- The baseline "date rules" phrase is undefined; the minimal rule may need
  product refinement (§16). Cancelled rows accumulate per rejoin; acceptable
  MVP history growth; no list endpoint yet.
- Displayed `canJoin`/`ineligibilityReason` can go stale between render and
  click; the join-time `409` remains authoritative and the UI resyncs on it.

## 16. Human approval gates

Approval is required before implementation for: (a) the additive
`QuestParticipations` schema, its uniqueness, indexes, and Restrict delete
behaviors; (b) the exact `SELECT ... FOR UPDATE` transaction/locking sequence
of §8; (c) soft-cancel retention and new-row rejoin; (d) the remaining §6
product-rule interpretations — `EndAtUtc` blocks join while `StartAtUtc` does
not, cancel allowed after start/end, `capacityFull` boolean exposed to
authenticated users with no public count; (e) any dependency (none planned);
(f) any change to the anonymous public Quest contract (none planned).

Decided and no longer open: a Quest creator may never join that Quest, for
Member, Organizer, and Admin alike (human decision, 2026-07-24).

## 17. Stop condition

Stop and request human direction if accepted documents conflict on
participation rules; if the remaining §16(d) interpretations are rejected; if
capacity cannot be made concurrency-safe without a new dependency; if the
public Quest read contract cannot stay byte-compatible; or if completion, XP,
or Organizer participant-management scope is required to finish this Slice.

## 18. Verification commands

```bash
# frontend/
npm run lint
npm run type-check
npm run test -- --run
npm run build

# backend/
dotnet build Kiwimpact.slnx
dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
```

Then inspect `git diff --check HEAD`, `git diff --stat HEAD`,
`git diff --name-status HEAD`, and `git ls-files --others --exclude-standard`;
never claim a gate not actually executed and observed.
