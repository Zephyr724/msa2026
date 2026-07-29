# Prompt 59 — Slice 9 MVP UI Convergence Implementation

- **Date:** 2026-07-27
- **Implementation owner:** Codex
- **Branch:** `codex/feat/slice-9-mvp-ui-convergence`
- **Baseline:** `73e79fa` (PR #20, merged Slice 8A)
- **Plan:** `specs/implementation/09-mvp-ui-convergence.md`
- **Design reference:** `docs/UI/Kiwimpact MVP UI Design/` (local Figma Make
  export supplied by the human; reference-only and not part of the production
  change set)

## Reconstructed implementation instruction

Implement the human-approved Slice 9 as the sole production implementation
owner. Use the local Figma Make export as the visual and interaction reference,
but preserve the accepted React/TypeScript/Vite/Tailwind/daisyUI frontend and
C#/.NET/PostgreSQL backend.

Deliver the Slice in three bounded parts:

1. **9A — UI foundation and public journey**
   - establish the Kiwimpact light/dark visual system and reusable brand,
     player-status, category, and Quest-card presentation;
   - redesign AppShell, Home, Discover, and Quest Detail while preserving all
     existing discovery, filtering, pagination, image fallback, registration,
     participation, and Completion Code behavior;
   - provide responsive guest/member navigation and a member mobile nav.
2. **9B — member core loop**
   - add the explicitly approved authenticated read-only
     `GET /api/v1/users/me/participations?status=all|active|cancelled` endpoint,
     using only existing persistence;
   - add protected My Quests UI using real participation and Quest data;
   - add cross-route Player Status using authoritative progression;
   - present Completion Code entry as a responsive dialog/sheet and show a
     reward overlay only after successful redemption and authoritative query
     resynchronization;
   - redesign Passport-lite and the implemented NZ/all-time People leaderboard.
3. **9C — auth, organizer, and closure**
   - redesign Login, Register, Organizer list/create/edit, lifecycle dialogs,
     management guards, and coherent loading/empty/error states;
   - keep all authentication, authorization, ownership, antiforgery, privacy,
     and backend enforcement unchanged.

Do not implement Google Maps, Evidence-reviewed Claims/Admin Review,
Self-reported Completion, Community Challenge, multi-layer community
leaderboards, People/Communities switching, Share Card, Weekly streak,
SignalR, or account-lifecycle expansion. Do not add dependencies or change the
database schema, migrations, or authentication model.

Add targeted backend/API/frontend tests, run the applicable complete frontend
and backend gates, visually inspect the implemented journeys against the local
prototype, review the full diff, and create truthful implementation evidence
before requesting one independent read-only Kimi K3 implementation review.

## Execution record

Codex implemented the approved 9A/9B/9C scope. The browser acceptance pass
found one integration defect that the mocked frontend test did not expose:
organizer-created Quests retained the deprecated persisted `Quest.XpAward = 0`
while the accepted reward engine awarded 50 XP for Easy difficulty. The API
presentation mapping was corrected to project Easy 50 / Medium 100 / Hard 150
from the same server-authoritative progression rule; the persistence column
and reward ledger rules were not changed. Targeted API tests then passed
48/48, and the browser recheck displayed 50 XP with no console errors.

Observed final gates:

- frontend lint — passed;
- frontend type-check — passed;
- frontend tests — 314/314 passed across 35 files;
- frontend production build — passed, 1,913 modules transformed;
- backend solution build — passed with 0 warnings and 0 errors;
- backend unit tests — 235/235 passed after the bounded post-review service
  guard additions (K3 independently observed the pre-correction 233/233);
- backend integration tests — 278/278 passed;
- `git diff --check` — passed.

No dependency, package-lock, schema, migration, authentication-model,
deployment, or production-data change was made.
