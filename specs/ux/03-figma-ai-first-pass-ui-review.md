# Kiwimpact — First-Pass UI Review Archive

- **Document type:** UI review and AI-assisted design record
- **Project:** Kiwimpact
- **Review stage:** Figma AI MVP UI — First Pass
- **Date:** 2026-07-20
- **Recommended repository path:** `/specs/ux/03-figma-ai-first-pass-ui-review.md`
- **Purpose:** Preserve the human review feedback and the AI-assisted interpretation used to guide the next Figma iteration.

---

## 1. Human Review Feedback

The first-pass UI already shows some successful gamification elements:

- It uses many icons.
- The color palette is bright, cheerful, and energetic.
- XP is visually emphasized.
- Rounded corners are used consistently.
- The Leaderboard is currently the strongest page.
- The overall visual direction is flat design.
- Soft shadows are still used on cards and buttons, which gives the interface enough depth without losing the flat style.

These successful elements should be preserved in the next iteration.

However, the overall product still does not feel gamified enough.

Animation is currently missing. This is understandable because this is the first AI-generated Figma version, but motion and reward feedback should be considered later.

The main visual issues are:

1. **Typography**
   - H1, H2, and some smaller card headings still feel too formal.
   - Bold headings should use a rounder, softer, more playful, and slightly more cartoon-like display font.
   - Body text does not need to change yet.

2. **Iconography**
   - The current icons feel too formal and product-oriented.
   - They should become rounder, friendlier, softer, and more playful.
   - The new icon style should still remain clear and readable.

3. **Navigation**
   - The desktop navigation bar currently relies too heavily on text.
   - Each navigation label should include an icon.
   - This should make the navigation feel more game-like and less like a conventional website.

The next discussion should compare the current first-pass design with selected gamification techniques used by Kahoot, while avoiding direct visual imitation.

---

## 2. Condensed AI Design Interpretation

The first-pass design has a strong foundation, but it currently feels more like a polished environmental platform than a fully gamified eco-adventure product.

The next revision should not redesign the information architecture or page layouts. It should refine the visual tone.

The recommended direction is:

- Preserve the current bright eco palette.
- Preserve rounded cards, buttons, chips, and soft shadows.
- Preserve strong XP visibility.
- Use the Leaderboard as the best internal reference.
- Change only display typography first, while keeping body text readable and professional.
- Replace thin, formal line icons with rounder and more playful icons.
- Add icons to desktop navigation labels.
- Strengthen active navigation states with pill-shaped or game-tab styling.
- Increase the sense of reward, achievement, progress, and adventure.
- Use Kahoot only as a reference for energy, friendliness, icon-led navigation, and playful tone.
- Do not copy Kahoot branding, layout, colors, or exact visual assets.
- Keep the product playful but not childish.

---

## 3. Current Review Decision

The first-pass UI is accepted as a useful design foundation.

The next iteration should focus on three priorities:

1. More playful display typography
2. More game-like iconography
3. Icon-supported navigation

Page structure, product scope, color direction, flat design, rounded geometry, and soft shadows should remain unchanged unless later review identifies a specific usability issue.

---

## 4. Next Review Topic

The next design discussion will compare the current Kiwimpact UI with relevant gamification patterns used by Kahoot and other suitable products.

The goal will be to identify which techniques can strengthen Kiwimpact without making it look like a quiz product or a direct copy of another brand.

## 5. Follow-Up: Community Identity Direction

After this review, ADR-0008 was accepted, introducing community identity,
scoped leaderboards (My Community, Auckland, New Zealand), a community
selector, and explicit virtual-currency/shop exclusions.

See:
- `specs/adr/ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md`
- `specs/ux/04-community-identity-leaderboard-and-selector.md`
