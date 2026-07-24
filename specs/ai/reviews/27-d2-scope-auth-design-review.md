# D2 Scope and Authentication Design Review

- Date: 2026-07-24
- Reviewer: Kimi K3 / Fresh Codex Session
- Mode: Read-only
- Verdict: APPROVE / TARGETED FIX REQUIRED

## Review prompt

# D2 Scope and Authentication Design Review — Read Only

This is one bounded independent review.

Do not modify, create, delete, format, stage, commit, push, reset, revert, or
merge files.

Do not read historical AI prompts, reviews, Slice 1 evidence, or completion
reports.
Do not follow references recursively.
Do not inspect more than 15 files.
Do not repeatedly reopen unchanged files.
Do not run code builds or test suites.
Stop tool use and return a verdict once sufficient evidence exists.

## Review only

- AGENTS.md
- specs/00-project-profile.md
- specs/product/04-phase-2-delivery-scope.md
- specs/adr/ADR-0009-use-single-origin-deployment.md
- specs/implementation/02a-email-password-auth-core.md
- specs/implementation/02b-account-lifecycle-and-auth-hardening.md
- .clinerules/04b-auth-security.md
- .clinerules/09-msa-assessment.md
- specs/README.md
- specs/ai/prompts/36-d2-phase-2-scope-and-auth-planning.md

## Verify only

1. P0 still covers the mandatory full-stack, CRUD, testing, responsive,
   deployment, Scalar, and gamification expectations recorded by the project.
2. The delivery plan commits to four valid advanced requirements:
   Security, Zustand, Theme Switching, and Docker.
3. Cypress and SignalR are clearly non-blocking P1 stretch work.
4. Storybook is not claimed unless all implemented reusable components are
   comprehensively integrated.
5. P1 and Deferred work cannot block P0 delivery.
6. ADR-0009 is internally consistent with HttpOnly Cookie authentication and
   anti-CSRF protection.
7. ADR-0009 does not accidentally require cross-origin credentialed CORS.
8. Slice 2A forms one coherent register → login → me → logout implementation
   Slice.
9. Slice 2A does not contain account-lifecycle, CRUD, gamification, WebSocket,
   Cypress, Storybook, or Google-login scope.
10. Slice 2B contains the deferred account-lifecycle work.
11. No accepted underlying security requirement is silently weakened.
12. The project profile and specs index are consistent with the new delivery
    scope.

## Blocking policy

Block only for:

- contradictory delivery scope;
- missing mandatory assessment capability;
- invalid advanced-requirement classification;
- unsafe Cookie/CSRF/deployment topology;
- unresolved schema or security contradiction;
- Slice 2A scope that is too incomplete to deliver a real auth core;
- Slice 2A scope expansion that makes it unsuitable for one implementation
  Slice;
- broken required document links.

Do not block for:

- wording preferences;
- optional product features;
- future provider choice;
- additional testing ideas;
- style or formatting preferences;
- theoretical concerns without a concrete contradiction.

## Required output

Return exactly:

1. Blockers
2. Majors
3. Minors
4. Verdict

Verdict must be:

APPROVE

or

TARGETED FIX REQUIRED

APPROVE when Blocker = 0 and Major = 0.

Do not request another full review.

## Findings

Blockers
None.
Majors
- `.clinerules/09-msa-assessment.md` still mandates Security, SignalR, and
  Cypress as the fixed Top 3 (lines 68–93 and 190–214). This contradicts the new
  scope, which commits Security, Zustand, Theme Switching, and Docker while
  making SignalR and Cypress non-blocking P1 work. Because this rule is always
  active and dictates README content, it could make P1 work block P0 delivery.
  Update those sections to match the new delivery scope.
  - **Status:** ADDRESSED 2026-07-24
  - **Resolution:** The affected advanced-requirement and README sections now
    commit the four P0 candidates, defer final strongest-three selection until
    verification, and keep SignalR and Cypress as non-blocking P1 stretch work.

Minors
None.
Verdict
TARGETED FIX REQUIRED

## Human decision

- Requested targeted correction
