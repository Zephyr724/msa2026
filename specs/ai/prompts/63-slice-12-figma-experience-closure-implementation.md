# Prompt 63 — Slice 12 Figma Experience Closure Implementation

- **Date:** 2026-07-27
- **Implementation owner:** Codex
- **Review model:** Kimi K3

## Reconstructed implementation instruction

Continue on `codex/feat/slice-11-community-discovery` after the implemented
Slices 9–11 and the Slice 11A Google Maps runtime correction.

Use the local Figma Make source under
`docs/UI/Kiwimpact MVP UI Design/` as the visual hierarchy and interaction
reference. Accepted specifications, current production contracts, persistence,
privacy boundaries, and observed behaviour remain authoritative. Do not copy
hard-coded prototype data or present unapproved prototype concepts as real
features.

Implement the approved three-part Slice 12:

1. **Share Card Builder**
   - add a dedicated authenticated route from Passport;
   - select from the caller's real Verified completion history only;
   - provide a square live preview, visual theme, overlay, and display-name
     opt-in controls;
   - export a 1080 × 1080 PNG and use Web Share when supported with download
     fallback;
   - exclude Home Community, location, email, user ID, evidence, claim text,
     and review notes.

2. **Full Passport and Home momentum**
   - implement the already accepted authenticated
     `GET /api/v1/users/me/passport` and
     `GET /api/v1/users/me/passport/community-participation` reads without a
     schema change;
   - expose truthful progression and completion counts, preference-protected
     Home Community, verified impact by Quest category, and immutable
     award-time community participation;
   - align Passport with the Make hierarchy using real data, the approved
     1/3/5 completion milestones, the real achievement catalog, category
     impact, community history, settings, claims, completion history, and the
     Share Card entry;
   - recompose authenticated Home around real progression, weekly streak,
     Home Community, active challenges, and useful next actions while keeping
     challenge administration on its dedicated surface.

3. **Mission Board convergence**
   - compose authoritative participation, claim, and Passport reads into
     Active, Ready to Complete, Under Review, Completed, and Cancelled states;
   - return rejected claims to Ready to Complete with truthful wording;
   - retain honest loading, empty, and error boundaries without guessing state
     when an authoritative read fails.

Add strict frontend DTO validation and focused API, unit, and integration
tests. Run all applicable frontend and backend gates. Create truthful evidence
before one independent read-only Kimi K3 review.

Do not add a dependency, database migration, new authentication/security
model, fictional category goals, an invented eight-badge catalog, seasons,
leagues, social feed, chat, Google OAuth, account linking, virtual economy, or
environmental outcome claims. Preserve the user-owned untracked
`.playwright-mcp/`, `docs/UI/`, and `figma-make-1.jpeg` paths and exclude them
from any future Slice commit.
