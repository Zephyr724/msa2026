# Slice 18 Implementation Prompt

Implement the product owner's 2026-07-28 Figma parity and local-testing
corrections on top of the committed Slice 17 branch.

Use the runnable Figma Make prototype under
`docs/UI/Kiwimpact MVP UI Design/` as the visual reference. Preserve the
accepted React/Tailwind/daisyUI and .NET/Identity/PostgreSQL architecture.

Create three confirmed Development-only accounts for each accepted persona:
Member, External Organizer, and Admin. Treat “External” as Organizer rather
than inventing a new role. Keep all passwords out of Git and accept them only
from ignored local configuration/environment. Make the seed idempotent and
production-disabled.

Restore:

- Landing map frame/hover, Make-style Community Goal, and the green
  `Build your Impact Passport` band;
- full-card Quest navigation, unclipped category emblem, no permanent sparkle,
  colored category/difficulty/registration/source chips, and truthful
  recommendation/capacity labels;
- Discover control alignment, left sort icon, green borders, category colors,
  and card/map segmented control;
- larger media-rich map InfoWindows;
- always-present Quest gallery with truthful repository placeholders;
- precise addresses plus Country/Region/Community context throughout cards,
  detail facts, and Quest Location;
- Make-aligned My Quests and Passport composition without removing accepted
  real functionality.

Use existing Quest location and Region hierarchy fields; do not add a schema
migration unless implementation evidence proves it is unavoidable. Do not
invent coordinates, availability, recommendations, or environmental outcomes.
Do not add dependencies. Add regression tests, run applicable full gates,
capture browser evidence, create the completion report, and obtain one
independent K3 read-only review before requesting commit approval.

Review correction: the requested `Recommended for you` treatment may only be
used when backed by an accepted recommendation signal. In the current data
model, use position-independent `Featured challenge`, `Good first Quest`, and
capacity-derived `Almost full` labels instead of inventing personalisation.
