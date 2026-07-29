# Slice 12 — Figma Experience Closure Completion Report

- **Date:** 2026-07-27
- **Branch:** `codex/feat/slice-11-community-discovery`
- **Baseline:** Slice 11 plus the uncommitted reviewed Slice 11A Maps runtime
  correction
- **Status:** Complete; independent review approved
- **Risk:** High

## Implemented scope

### Passport capability audit and closure

- Confirmed that the Passport difference from the Figma Make reference was
  partly functional, not merely visual: the accepted Passport summary and
  community-participation routes were still unimplemented.
- Implemented authenticated `GET /api/v1/users/me/passport` with caller-only
  identity/progression, truthful completion counts, preference-protected Home
  Community, and verified impact grouped across all Quest categories.
- Implemented authenticated
  `GET /api/v1/users/me/passport/community-participation` from immutable
  award-time XP attribution. It includes departed communities, challenges
  actually contributed to, and challenge-sourced achievements while excluding
  unattributed XP.
- Rebuilt the Passport hierarchy around identity and progress, the next
  approved milestone, category impact, the real achievement catalog,
  historical community participation, weekly streak, community/share
  settings, claims, and completion history.
- Kept the approved 1/3/5 achievement path. The implementation does not invent
  the prototype's fictional category targets or eight-badge catalog.
- Milestone progress uses rewarded Verified completion rows from the XP ledger,
  so a Verified completion whose reward is still pending cannot prematurely
  unlock or visually advance an achievement.

### Dedicated Share Card Builder

- Added authenticated `/passport/share` and linked it from Passport.
- Loads real Passport history and permits Verified-completion selection only.
- Added forest, ocean, and sunrise themes plus dark/light overlays and an
  explicit display-name opt-in.
- Added a live square Canvas preview and client-side 1080 × 1080 PNG export.
- Uses Web Share with a PNG file when the browser supports it and retains a
  direct download fallback.
- The renderer contains no Home Community, location, email, user ID, evidence,
  claim text, or review notes.
- Empty, loading, and error states do not create demo data.

### Home momentum and Mission Board

- Reworked authenticated Home into a member dashboard composed from real
  progression, weekly streak, Home Community, and Community Challenge reads.
- Home challenge cards do not expose Admin actions; full management remains on
  the community management surface.
- Reworked My Quests into Active, Ready to Complete, Under Review, Completed,
  and Cancelled states composed from authoritative participation, evidence
  claim, and Passport reads.
- Rejected evidence claims return to Ready to Complete with explicit rejected
  wording and are never presented as verified.
- The newest evidence attempt wins per Quest, so a resubmitted Pending claim
  cannot be overwritten by an older Rejected attempt.
- Mission Board loads every Passport completion page and checks the page
  envelope, total, and unique completion IDs for a coherent set before
  classifying. A concurrent or incomplete read fails closed.
- Schedule-TBD Quests remain Active with explicit wording; only a non-null
  start time that has arrived moves a Quest to Ready to Complete.
- A failed authoritative read renders its own error boundary instead of
  guessing a classification.

## Main files changed

- Backend Passport reads:
  - `backend/src/Kiwimpact.Api/Contracts/PassportContracts.cs`
  - `backend/src/Kiwimpact.Api/Controllers/PassportController.cs`
  - `backend/src/Kiwimpact.Core/Repositories/IPassportRepository.cs`
  - `backend/src/Kiwimpact.Core/Services/IPassportService.cs`
  - `backend/src/Kiwimpact.Core/Services/PassportModels.cs`
  - `backend/src/Kiwimpact.Core/Services/PassportService.cs`
  - `backend/src/Kiwimpact.Infrastructure/Repositories/PassportRepository.cs`
- Frontend:
  - `frontend/src/pages/PassportPage.tsx`
  - `frontend/src/pages/ShareCardBuilderPage.tsx`
  - `frontend/src/pages/HomePage.tsx`
  - `frontend/src/pages/MyQuestsPage.tsx`
  - `frontend/src/components/passport/PassportSummaryCard.tsx`
  - `frontend/src/components/passport/NextMilestoneCard.tsx`
  - `frontend/src/components/passport/CategoryImpactSection.tsx`
  - `frontend/src/components/passport/CommunityParticipationSection.tsx`
  - `frontend/src/components/passport/ShareCard.tsx`
  - `frontend/src/lib/shareCard.ts`
  - `frontend/src/lib/api/passport.ts`
  - `frontend/src/lib/validation/passportDto.ts`
  - `frontend/src/hooks/usePassportCompletions.ts`
  - `frontend/src/types/passport.ts`
- Verification:
  - `backend/tests/Kiwimpact.IntegrationTests/Api/PassportApiTests.cs`
  - `frontend/tests/integration/HomeMemberMomentum.test.tsx`
  - `frontend/tests/integration/MyQuestsPage.test.tsx`
  - `frontend/tests/integration/PassportPage.test.tsx`
  - `frontend/tests/integration/ShareCardBuilderPage.test.tsx`
  - `frontend/tests/unit/passportInsightsDto.test.ts`
  - `frontend/tests/unit/shareCard.test.ts`
- Contracts and evidence:
  - `specs/architecture/03-api-contract.md`
  - `specs/implementation/12-figma-experience-closure.md`
  - Prompt 63 and this report

The worktree also contains the separately reviewed Slice 11A Google Maps
runtime correction. Its files and evidence are recorded in
`specs/implementation/reports/11a-google-maps-runtime-configuration-correction.md`.

## Verification observed

- `npm run lint` — passed.
- `npm run type-check` — passed.
- `npm run test -- --run` — 41 test files, 326 tests passed.
- `npm run build` — passed; 1,958 modules transformed. Vite emitted the
  non-blocking main-chunk advisory at 658.12 kB.
- Targeted Slice 12 frontend set — 6 files, 32 tests passed.
- `dotnet build Kiwimpact.slnx` — passed with five pre-existing EF1002
  integration-test helper warnings and no errors.
- `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — 247 tests passed.
- `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — 286 tests passed.
- Targeted PostgreSQL Passport summary/community tests — 2 tests passed.
- `git diff --check` — passed.
- Browser verification observed the authentication boundary: an anonymous
  `/passport` visit redirects to the sign-in journey. A temporary local Member
  registration reached the required email-confirmation state; the attached
  Mailpit inbox contained no delivery, so an authenticated visual smoke test
  was not claimed.

## Known limitations

- Share Card currently offers the first 50 Passport completion records,
  matching the accepted maximum page size. Members with more than 50 records
  cannot select older records for sharing yet. Mission Board does not have
  this limitation because it loads and validates all pages.
- Web Share file support varies by browser; PNG download remains available.
- The Figma Make reference uses hard-coded category goals and an eight-badge
  presentation that do not exist in accepted product rules. Those were
  deliberately not implemented.
- Category and community aggregates are read on demand. No new summary table or
  schema was introduced for this MVP Slice.
- Authenticated browser verification is still required once a confirmed local
  Member session with representative completion/community data is available.
- The Vite bundle remains above its advisory threshold. Code splitting is a
  separate performance decision.
- Dockerization, deployment, and public-production verification remain out of
  scope.

## Review status

- Independent Kimi K3 Review 59: **APPROVED**.
- Initial findings: 0 Blockers, 3 Majors, 1 Minor.
- One bounded correction pass closed all three Majors:
  newest-claim precedence, complete fail-closed Passport pagination, and
  schedule-TBD/future Active classification.
- The suggested first-page coherence validation was also adopted.
- Final remaining findings: 0 Blockers and 0 Majors.
- Slice 11A and Slice 12 were committed and pushed together as `cae199d` on
  `codex/feat/slice-11-community-discovery`. Merge and deployment have not been
  performed.

## Repository hygiene

The user-owned `.playwright-mcp/`, `docs/UI/`, and `figma-make-1.jpeg` remain
untracked and are excluded from this Slice.
