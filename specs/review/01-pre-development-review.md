# Kiwimpact ADR and UI Brief Review Checklist

- Review status: Draft for product-owner review
- Date: 2026-07-19
- Source: `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`
- Intended repository: `msa2026`

## Review outcome

For each document, choose one:

- `Accept` — wording and scope are correct; change ADR status to `Accepted`.
- `Accept with edits` — list the exact edits.
- `Reject` — explain which decision or consequence is incorrect.
- `Defer` — the document should not be accepted yet.

## ADR checklist

| Document | Review focus | Outcome |
| --- | --- | --- |
| ADR-0001 | PostgreSQL as the only application database | |
| ADR-0002 | Identity, cookie authentication, Google login, CSRF boundary | |
| ADR-0003 | Clean Architecture Lite and project dependency direction | |
| ADR-0004 | React/Vite/Tailwind/daisyUI frontend foundation | |
| ADR-0005 | TanStack Query/Zustand state ownership | |
| ADR-0006 | Google Maps MVP scope and key restrictions | |
| ADR-0007 | Real PostgreSQL integration testing with Testcontainers | |

## UI brief decisions

Confirm or edit:

1. The seven main product areas are sufficient for the first Figma pass.
2. Desktop design frame: 1440 px; mobile design frame: 390 px.
3. Mobile primary navigation uses a bottom navigation bar for Member-facing areas.
4. Discover defaults to a list-first mobile layout and a list/map desktop layout.
5. Quest creation and editing use full pages rather than large modal dialogs.
6. Organizer and Admin screens remain responsive but prioritize task efficiency.
7. Quest Cards may use category artwork or neutral Kiwimpact illustrations, not copied provider imagery.
8. Reward animations are represented in Figma as annotated states rather than frame-by-frame animation.
9. Authentication screens remain visually connected to the eco-adventure identity.
10. The UI brief may be used by Claude as design context only after product-owner approval.

## Status rule

The underlying technology choices are already recorded in the accepted planning
baseline. These ADR drafts remain `Proposed` until the product owner approves
their wording, scope, consequences, and review triggers.

Do not mark implementation complete merely because an ADR is accepted.
