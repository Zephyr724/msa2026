# Slice 3B — Organizer Quest Management Frontend

- **Status:** Proposed — pending human approval
- **Date:** 2026-07-24
- **Risk:** Important — authenticated writes, ownership-sensitive UI, concurrency
- **Implementation owner:** One implementation session; one independent read-only review

## 1. Status

Planning contract only. No production code is written under this document. Slice 3A
(`feat/slice-3a-...`, merged) already provides the eight management endpoints, exact
DTOs, and `xmin`-backed `version` concurrency this Slice consumes. This document was
derived from `OrganizerQuestsController`, `QuestManagementContracts.cs`,
`specs/implementation/03a-organizer-quest-crud-backend.md`, and the current frontend
(router, `apiFetch`, auth hooks, public Quest pages, test stack). No backend contract
change and no new dependency is required.

## 2. Goal

Deliver the smallest coherent Organizer-facing frontend over the existing Slice 3A
management API: list, create, edit, and lifecycle management of own Quests, with
backend-authoritative ownership, validation, and concurrency, within approximately
10–15 primary changed frontend files.

## 3. Scope

- Three management routes with a role guard, sharing the existing `AppShell`.
- Organizer Quest list with loading/empty/error states, status badges, and actions.
- Create page producing a `Draft` via the exact Slice 3A create contract, including
  one required nested cover-image metadata object (metadata/URL only, no upload).
- Edit page loading the management detail, full PUT with `version`, cover update or
  replacement, unsaved-change protection, and conflict handling.
- Lifecycle actions publish, cancel, archive, and delete (Draft only) with
  confirmations and TanStack Query invalidation.
- Focused Vitest/Testing Library tests using the existing stack.

## 4. Out of scope

Backend changes; new endpoints; QuestImage gallery management (Slice 3C); image-file
upload; rich-text editor; map picker; Organizer analytics; full Admin Portal;
participation/completion; XP/levels/achievements/leaderboard; Slice 2B account
lifecycle; theme switching; Docker; SignalR; Cypress; Storybook; any new UI, state,
validation, date-picker, form, or notification dependency.

## 5. Routes

Flat children of the existing `AppShell` route, matching the current router
convention in `frontend/src/app/router.tsx`:

| Route | Page |
| --- | --- |
| `/organizer/quests` | `OrganizerQuestListPage` |
| `/organizer/quests/new` | `OrganizerQuestCreatePage` |
| `/organizer/quests/:questId/edit` | `OrganizerQuestEditPage` |

All three are wrapped by one guard component `RequireManagementAccess` (new, under
`src/components/organizer/`) rendering `<Outlet/>` when access is granted. Organizer
and Admin share these pages; no separate Admin Portal is added. `AppShell` gains one
"Manage quests" nav link shown only for Organizer/Admin sessions (UX convenience
only, never security enforcement).

## 6. Access matrix

| Actor | Guard result | Direct-URL API outcome |
| --- | --- | --- |
| Anonymous | Redirect to `/login` (`<Navigate replace>`), matching existing auth behavior | `401` |
| Member (no Organizer/Admin role) | "Management unavailable" fallback page with link home | `403` |
| Organizer | Access; server already restricts list/detail to own Quests | `200`; `403` on non-owned id; `404` on missing id |
| Admin | Access; server permits any Quest | `200` |

The guard reads the existing `useAuthQuery()` session (`roles: string[]`, values
`Member`/`Organizer`/`Admin`). Route hiding is UX only: backend authorization stays
authoritative. A mid-session `401` from any management request redirects to `/login`;
a `403` renders the forbidden state. No `returnTo` parameter is added in this Slice;
after sign-in the user lands on `/` per existing `LoginPage` behavior.

## 7. API and DTO mapping

Only the eight existing operations are used, all through one new API module,
`frontend/src/lib/api/organizerQuests.ts`, the single request-construction
boundary: the TanStack Query hooks in §8 call its functions and never build URLs or
`RequestInit` themselves. The browser-visible backend route is
`/api/v1/organizer/quests...`; the existing `apiFetch` base already supplies
`/api`, so feature functions pass paths of the form `/v1/organizer/quests...`.
Passing `/api/v1/...` is forbidden because it could produce a doubled
`/api/api/v1/...` prefix. One focused URL-construction test asserts the final
request URL (§14). All calls go through `apiFetch` (cookie + CSRF-token path,
never raw `fetch`):

- `GET /api/v1/organizer/quests` → `QuestManagementListItemDto[]`
- `POST /api/v1/organizer/quests` → `201 QuestManagementDetailDto`
- `GET /api/v1/organizer/quests/{id}` → `QuestManagementDetailDto`
- `PUT /api/v1/organizer/quests/{id}` → `QuestManagementDetailDto`
- `DELETE /api/v1/organizer/quests/{id}` with JSON body `{ version }` → `204`
- `POST .../{id}/publish` body `{ version }` → `QuestManagementDetailDto`
- `POST .../{id}/cancel` body `{ version, confirmActiveParticipants }` → detail DTO
- `POST .../{id}/archive` body `{ version }` → `QuestManagementDetailDto`

New `src/types/questManagement.ts` mirrors the accepted records exactly (camelCase;
`version` as `number`; enums reusing `QUEST_CATEGORIES`, `QUEST_DIFFICULTIES`,
`QUEST_REGISTRATION_MODES`, `QUEST_SOURCE_TYPES` from `src/types/quest.ts`):

```text
QuestStatus = 'Draft' | 'Published' | 'Cancelled' | 'Archived'
CoverImageInput   { imageUrl, altText, creatorName?, sourceUrl?, licenceNote? }
CreateQuestInput  { title, description, category, registrationMode, difficulty,
                    capacity, startAtUtc, endAtUtc, locationRegionId,
                    locationDescription, externalSourceUrl, coverImage }
UpdateQuestInput  = CreateQuestInput + { version }   // coverImage optional on wire
QuestManagementListItemDto { id, title, status, category, difficulty, capacity,
                    startAtUtc, endAtUtc, locationRegion, updatedAtUtc, version }
QuestManagementDetailDto   { ...all writable fields, status, sourceType, xpAward,
                    externalSourceStatus, sourceCheckedAtUtc, nextCheckDueAtUtc,
                    coverImage { id, imageUrl, altText, creatorName, sourceUrl,
                    licenceNote }, createdAtUtc, updatedAtUtc, version }
```

Responses are parsed through new strict validators in
`src/lib/validation/questManagementDto.ts`, following the existing `questDto.ts`
pattern (exact-key, enum, ISO-timestamp, and nullability checks). No DTO field is
invented; read-only fields (`status`, `sourceType`, `xpAward`,
`externalSourceStatus`, freshness timestamps) are display-only, never submitted.

## 8. Query and mutation design

State ownership follows the accepted rules: TanStack Query owns all Quest server
state; form state stays local to the route; identity stays in `useAuthQuery`;
Zustand is not touched.

- Keys: `['organizer','quests']` (list) and `['organizer','quests', id]` (detail),
  in new `src/hooks/useOrganizerQuests.ts`. These are deliberately distinct from the
  public keys `['quests', ...]`, `['quest', id]`.
- Queries: `useOrganizerQuestListQuery()`, `useOrganizerQuestDetailQuery(id)`
  (`enabled: !!id`). Default client options (`staleTime` 1 min, `retry: 1`) apply.
- Mutations: `useCreateQuestMutation`, `useUpdateQuestMutation`,
  `usePublishQuestMutation`, `useCancelQuestMutation`, `useArchiveQuestMutation`,
  `useDeleteQuestMutation`. No optimistic updates and no mutation retries; the UI
  never assumes success before the authoritative response.
- On create success: invalidate the list key; navigate to
  `/organizer/quests/{id}/edit`.
- On update/publish/cancel/archive success: `setQueryData` the detail key with the
  response DTO (stores the new `version`) and invalidate the list key.
- On publish/cancel/archive/delete success: additionally invalidate the public
  `['quests']` prefix and `['quest', id]`, since lifecycle changes alter public
  visibility.
- On delete success: invalidate list + public keys; navigate to the list.
- Simple list filters, if any are added, live in URL search parameters per the
  existing `QuestListPage` convention.

## 9. Form behavior

One shared `QuestForm` component (`src/components/organizer/QuestForm.tsx`) serves
create and edit; pages own submission and mutations. No form library; local
`useState` per field.

- Fields with client-side limits mirroring Slice 3A §7: `title` (required, ≤200),
  `description` (required, ≤2000), `category`/`registrationMode`/`difficulty`
  (required selects of canonical enum names), `capacity` (number ≥0, or null via an
  "Unlimited" checkbox), `startAtUtc`/`endAtUtc` (native `datetime-local`,
  nullable, `endAtUtc > startAtUtc` when both set), `locationRegionId` (select;
  create offers `useRegions()` active local areas plus "No region" → null),
  `locationDescription` (≤500), `externalSourceUrl` (optional, absolute HTTPS,
  ≤2000).
- Region preservation on edit: when the loaded management DTO's `locationRegion`
  is not among the active local-area options, the select gains the current Region
  as an additional preserved option (id and name taken from the DTO). Populating
  the form keeps the current `locationRegionId`; submitting without changing
  Region sends the original id; the form never silently converts an unavailable
  existing Region to null.
- Cover section (required on create): `imageUrl` (required, ≤2000, absolute HTTPS
  or root-relative `/...`), `altText` (required, ≤300), `creatorName` (≤200),
  `sourceUrl` (optional HTTPS, ≤2000), `licenceNote` (≤500). Metadata only; no file
  upload. On edit the section is prefilled from `coverImage` and a PUT sends the
  current values (update-or-replace semantics; the Slice 3A cover-preservation path
  is not needed because the form always holds the loaded cover).
- Client validation runs on submit (and clears per field on change) with inline
  messages plus a `role="alert"` summary; it never replaces server validation —
  backend `400` displays `problem.detail` in the same summary.
- ISO-UTC ↔ `datetime-local` conversion happens at the form boundary
  (`new Date(...).toISOString()` on submit; local formatting on populate).
- Edit page: loads the management detail, shows skeleton while pending, a 404
  not-found state, and a 403 forbidden state; populates the form from the server
  DTO; submits the full PUT including the current `version`.
- Unsaved-change protection: dirty tracking plus React Router `useBlocker` for
  in-app navigation and a `beforeunload` listener for tab close — existing
  browser/router capabilities only.
- Submit and lifecycle buttons are disabled while their mutation is pending,
  preventing duplicate submissions.
- After create success the user is navigated to the edit page (decision recorded;
  the management list is the accepted alternative).

## 10. Lifecycle actions

Actions per status, rendered on the list rows and the edit page; the backend
response remains authoritative for ownership and allowed transitions:

| Status | Actions offered |
| --- | --- |
| `Draft` | Edit, Publish, Delete |
| `Published` | Edit, Cancel, Archive |
| `Cancelled` | Edit, Archive |
| `Archived` | View (read-only); no mutations |

- Archived Quests open the same edit route in read-only view mode: every form
  field is disabled/read-only, no Save button or mutation is offered, and no
  lifecycle or delete action is rendered. A clear Archived status badge and a
  short explanation state that the record is retained for management history.
- Every significant/destructive action opens a shared `ConfirmActionDialog`
  (native `<dialog>` via `showModal()`): Publish, Cancel, Archive, Delete.
- Requests send the current `version` from the loaded DTO. The Cancel dialog adds
  an acknowledgement checkbox mapped to `confirmActiveParticipants`
  (default `false`); a backend rejection keeps the dialog open and shows
  `problem.detail`, letting the user check the box and retry manually.
- Delete is offered only for `Draft`; any other status would return `409`, whose
  `detail` is displayed if reached by stale UI.
- Invalid or repeated transitions surface the backend ProblemDetails `detail`
  verbatim near the action.

## 11. Concurrency behavior

- The edit page holds the server `version` from the detail query; every PUT,
  DELETE, and lifecycle request includes it. Successful responses carry the new
  version, stored via `setQueryData`.
- On HTTP `409`: never silently overwrite, never auto-retry, never merge client-
  side. The form shows a conflict panel with the server `detail` (or a clear
  generic conflict message), an explicit "Reload latest version" button that
  invalidates the detail query and resets the form to the reloaded DTO, and a
  "Keep editing" option that preserves unsaved input on screen so the user can
  copy values before reloading. A save attempted with a stale version simply
  returns to this conflict state.
- List-page lifecycle actions use the row's `version`; a `409` there shows the
  same message and invalidates the list so the next attempt uses fresh data.

## 12. Error and ProblemDetails handling

Backend ProblemDetails carries only `type`/`title`/`status`/`detail` (no field-level
`errors` bag), so server messages are displayed as one actionable `detail` string:

- `400` → form error summary / action area shows `problem.detail`.
- `401` → redirect to `/login` (session expired).
- `403` → forbidden state ("You don't have access to manage this quest").
- `404` (edit/detail) → not-found state with link back to the management list.
- `409` → conflict behavior in §11; lifecycle `409` shows `detail` near the action.
- Other/network → existing generic error pattern (`alert alert-error` + Retry).

`ApiError` from `apiFetch` is the single typed boundary; pages and mutations switch
on `error.status` exactly as `QuestDetailPage` already does.

## 13. Responsive and accessibility requirements

- Every input has a visible `<label>` (existing `LoginPage` pattern); hints via
  `aria-describedby`; errors in a `role="alert"` summary and inline per field.
- Forms, dialogs, and action buttons are keyboard-operable; the native `<dialog>`
  provides focus trapping, `Esc` close, and initial focus on the primary safe
  action, with focus returned to the invoking button on close.
- Loading uses existing `skeleton` patterns with an `aria-live="polite"` status;
  success and action results are announced via `role="status"`.
- Status badges combine daisyUI color variants with always-visible text
  (`Draft`/`Published`/`Cancelled`/`Archived`) — never color-only.
- List layout follows `QuestListPage` conventions: stacked cards on mobile,
  `md:`/`lg:` grid on desktop; forms are single-column `max-w-*` with full-width
  inputs; daisyUI `btn`/`input` default sizing keeps touch targets adequate.
- Mutation buttons disable while pending (duplicate-submission prevention) and show
  pending labels ("Publishing…").

## 14. Test requirements

Existing stack only (Vitest, Testing Library, `userEvent`, `vi.stubGlobal('fetch')`,
`createMemoryRouter`, real `QueryClient` in tests). Planned files:

- `tests/unit/questManagementDto.test.ts` — strict validators accept the exact
  Slice 3A DTOs and reject missing/extra keys, bad enums, and malformed timestamps.
- `tests/integration/OrganizerAccess.test.tsx` — (1) anonymous → redirect to
  `/login`; Member → unavailable fallback; Organizer and Admin → content renders;
  direct-URL `401`/`403` API responses produce the redirect/forbidden states.
- `tests/integration/OrganizerQuestListPage.test.tsx` — (2) loading, success,
  empty, and error states; status badges as text; per-status actions; (8) publish
  confirmation then successful list invalidation; (9) cancel and archive `409`/`400`
  details displayed; (10) Draft delete confirmation flow; (11) delete not presented
  for non-Draft rows.
- `tests/integration/OrganizerQuestCreatePage.test.tsx` — (3) client validation
  messages and exact create-request mapping (asserted on stubbed `fetch` body,
  including nested `coverImage`); (4) success navigates to the edit page; server
  `400` shows `detail`.
- `tests/integration/OrganizerQuestEditPage.test.tsx` — (5) detail DTO populates
  the form correctly (including cover and date conversion); (6) PUT body includes
  the current `version`; (7) `409` renders the conflict panel with reload offered,
  performs no automatic retry, and keeps unsaved input until the user reloads;
  an existing non-local Region is preserved through DTO → form → PUT mapping
  (offered as a preserved option, resubmitted as the original `locationRegionId`,
  never coerced to null).
- Cross-cutting assertions placed in the above: (12) every mutation goes through
  `apiFetch` (CSRF-token request precedes state-changing calls, as in
  `AuthFlow.test.tsx`); (13) list/detail data comes only from TanStack Query;
  (14) `useUiStore` gains no Quest or identity state (mirroring the existing
  auth-flow assertion); (15) dialogs trap/return focus and critical controls are
  reachable by keyboard, to the extent jsdom can verify; (16) one focused
  request-URL regression assertion proves a management call targets
  `/api/v1/organizer/quests...` exactly once — no doubled `/api/api/` prefix.
  Layout-level responsiveness is not verifiable in jsdom and is covered by
  convention review, not tests.

## 15. Definition of Done

- The three routes work end-to-end against the unmodified Slice 3A API through the
  guard, with the access matrix in §6 observed.
- List, create, edit, and the four lifecycle actions behave per §8–§12, including
  confirmations, invalidation, and conflict handling.
- No new dependency, no backend change, no Zustand duplication, no invented DTO
  fields; public Quest pages and their tests are untouched and still pass.
- The §14 tests plus `npm run lint`, `npm run type-check`, and `npm run build`
  pass; the final diff stays within ~10–15 primary frontend files plus tests.
- Observed browser smoke verification against the running Slice 3A backend —
  real Cookie and CSRF flow included. Each item is claimed only after it has
  actually been performed and observed, never from code reading alone: Organizer
  sign-in; management list loads; a Draft is created through the form; an edit
  saves while preserving the Region and cover metadata; one lifecycle action
  succeeds end-to-end; anonymous and Member direct-URL handling matches §6;
  desktop and mobile layouts remain usable; the confirmation dialog operates by
  keyboard; the browser console shows no unexpected errors.
- One independent read-only review, then at most one correction pass and one
  targeted closure check, per the agent routing rules.

## 16. Risks

- ProblemDetails has no per-field errors; server validation appears as a single
  `detail` string. Accepted: client-side validation covers field-level guidance.
- `useRegions()` exposes active local areas only, while the backend accepts any
  hierarchy level or null. Accepted UI constraint: create offers local areas plus
  "No region"; edit preserves a non-local current Region per §9. No contract
  change.
- `confirmActiveParticipants` has no live participation feature yet; the checkbox
  is forward-compatible and currently inert server-side.
- `datetime-local` conversion bugs (timezone, seconds) are mitigated by the §14
  mapping tests.
- Guard bypass remains possible (route hiding is UX only); mitigated by backend
  authorization and the `401`/`403` handling tests.

## 17. Human approval gates

Human approval is required before implementation; before any backend contract, ADR,
schema, dependency, or product-scope change; before staging, commit, push, PR,
merge, reset, revert, or deployment; and for reviewer selection. Stop before
implementation if the Slice 3A API proves insufficient, a dependency appears
necessary, an accepted route/UX decision conflicts with current specifications, the
form would require a rich editor, upload provider, or map integration, or the work
cannot stay within ~10–15 primary changed frontend files.

## 18. Stop condition

Stop and request human direction if evidence contradicts the DTO, enum, lifecycle,
or concurrency facts recorded here; if ownership or access cannot be presented
without frontend-side enforcement claims; if exact request mapping cannot be
achieved without a backend change; or if completion requires any out-of-scope
feature.

## 19. Verification commands

Run from `frontend/` after implementation:

```bash
npm run lint
npm run type-check
npm run test -- --run
npm run build
```

Then inspect `git diff --check HEAD`, `git diff --stat HEAD`, and
`git diff --name-status HEAD`. Do not claim a gate not actually observed.
