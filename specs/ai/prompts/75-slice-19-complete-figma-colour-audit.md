# Slice 19 Additive Prompt — Complete Figma Colour Audit

Implement the product owner's 2026-07-29 request to audit every visible
product colour and restore the checked-in Figma Make palette.

Use `docs/UI/Kiwimpact MVP UI Design/src/styles/theme.css` and the runnable
Make source as the exact visual reference. Apply the following rules without
changing product behaviour, API contracts, layout, or dependencies:

- use the exact light theme background, foreground, card, muted, primary,
  accent, destructive, and border values;
- use the exact dark theme equivalents;
- make manual Light/Dark selection authoritative for Tailwind `dark:` utility
  variants instead of allowing the operating-system theme to produce mixed
  surfaces;
- replace approximate opacity-based secondary copy with the exact Make muted
  foreground token;
- restore the six category, three difficulty, source, registration,
  discovery-highlight, completion-state, XP, and leaderboard podium palettes;
- restore the Make placeholder-map road, water, surface, and marker colours;
- ensure primary-colour surfaces use `primary-content` in both themes;
- retain intentionally photographic, illustration, Google Maps InfoWindow,
  modal-overlay, and Share Card artwork colours where those are not theme
  tokens.

Verify Landing, Discover, My Quests, Passport, Leaderboard, Quest Detail, and
Share Card in the running application in both light and dark themes. Add
focused regression assertions for the theme-class synchronization and semantic
Quest palettes, then run the complete frontend gates.
