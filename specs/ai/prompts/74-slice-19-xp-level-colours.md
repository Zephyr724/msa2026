# Slice 19 Additive Prompt — XP and Level Colours

Implement the product owner's 2026-07-29 request to restore XP and Level
colours to the checked-in Figma Make design.

Use the Make source as the exact colour reference:

- compact player status uses an amber surface, border, icon, and label;
- XP pills use amber 50/200/700 in light mode and amber 900/700/300 in dark
  mode;
- ordinary Level and rank labels remain primary/foreground text rather than
  becoming yellow;
- Passport XP progress uses the Make neutral track and primary-to-emerald
  gradient;
- content on the Passport and completion-reward primary surfaces inherits
  `primary-content` so dark mode does not retain hard-coded white text.

Apply the rule to navigation, Player Status, Discover and My Quests cards,
Quest Detail rewards, Passport summary/history, and the completion reward
overlay. Preserve XP calculations, levels, rank rules, API contracts, and
layout. Add focused regression assertions, verify light and dark modes in the
running product, and run the complete frontend gates.
