# Community Scope Review

- Review status: Completed
- Date: 2026-07-20
- Source: ADR-0008 Community Identity, Local Leaderboards, and Virtual Economy Scope

## Review outcome

ADR-0008 and the community identity direction have been accepted by the product
owner. The following accepted specifications support the community direction:

- `specs/product/02-community-identity-and-gamification-scope-update.md`
- `specs/ux/04-community-identity-leaderboard-and-selector.md`
- `specs/architecture/01-domain-model-region.md`
- `specs/data/01-community-identity-data-model.md`
- `specs/security/01-community-privacy-rules.md`
- `specs/testing/01-community-leaderboard-and-privacy-tests.md`

## Key Decisions Confirmed

1. Hierarchical Region model with Country, AdministrativeArea, LocalArea types.
2. Leaderboard scopes: My Community, Auckland, New Zealand.
3. Time periods: Weekly, Monthly, All-time.
4. Optional Home Community, manual selection, no GPS/IP/address inference.
5. First selection without cooldown; subsequent changes subject to 30-day cooldown.
6. Small-community suppression threshold defaulting to 10.
7. Award-time XP snapshot; no retroactive attribution.
8. Unattributed XP (null snapshot when no Home Community) contributes to personal
   progression and NZ leaderboard only.
9. Virtual currency, Wallet, and Shop excluded from MVP.
10. Passport toggle default off; Home Community never on Share Cards.

## Pending

- Community Figma revision (community scoped leaderboard, community selector,
  Passport community label) not yet applied.