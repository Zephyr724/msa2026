# Slice 15 — Figma-Faithful UI Restoration

## Status

**Accepted — explicitly approved by the product owner on 2026-07-27.**

## Goal

Faithfully restore the composition, layout, density, visual identity,
responsive behavior, and primary interaction states of the seven runnable
Figma Make MVP pages while keeping production APIs, security, privacy,
authorization, and real data authoritative.

The target is not a literal copy of demo values. It is a faithful production
implementation of the same design.

## Risk

Important: broad frontend presentation change across public and authenticated
core journeys. No schema, authentication-model, major technology, or dependency
change is approved by this proposal.

## Reference hierarchy

1. Accepted product/security/API specifications define behaviour and truth.
2. The runnable Make export defines target composition and interaction intent.
3. Slice 14 screenshots define the comparison baseline.
4. Existing production source defines behaviours that must not regress.

When a Make label or value conflicts with authoritative data, keep the
authoritative value in the Make geometry.

## Phase 15A — Visual foundation, shell, and public journey

### Shared primitives

- Expand semantic spacing, type scale, elevation, geometry, and responsive
  composition tokens.
- Implement repository-owned, accessible visual equivalents of:
  - category emblems;
  - rank crests;
  - achievement badge states;
  - leaderboard medals;
  - source, verification, difficulty, XP, availability, status, and progress
    chips;
  - topographic/native visual accents.
- Replace generic icon-in-a-box substitutions where Make uses a distinctive
  product identity.
- Preserve visible focus, reduced motion, light/dark contrast, and semantic
  markup.

### Shell

- Match guest/member desktop navigation proportions and active states.
- Match compact Member XP/rank identity treatment.
- Match the 390 px compact top bar and Member bottom navigation.
- Keep role-aware Manage/Admin destinations without forcing them into the
  seven-page Make composition.

### Landing

- Restore the guest hero, map/adventure visual, streak cue, Personal Progress,
  Community Goal, featured quests, loop, Passport showcase, closing CTA, and
  footer hierarchy.
- Restore a separate Member Home composition using real progression,
  participation, streak, community, challenge, and next-action data.
- Use truthful same-geometry empty/fallback states rather than hiding large
  sections.

### Discover

- Make Cards the default view.
- Restore Cards/Map view switching; the existing real Google map is shown only
  in Map view.
- Restore compact search/filter/sort/view controls and category emblem chips.
- Match three-card desktop density and mobile list composition.
- Preserve URL filters, paging, map configuration, and error handling.

### Quest Detail

- Restore hero proportions, category/location identity, fact/reward hierarchy,
  sticky desktop snapshot/action column, gallery interaction, location map,
  related Quest rail, and mobile sticky action.
- Retain all real participation, source, completion, claim, and self-report
  behaviour.
- Derive duration only when start/end are present.
- Do not invent organizer, eligibility, or other unavailable copy.

### 15A gate

- Side-by-side Make/production captures at 1440-class desktop and 390 × 844 for
  guest Landing, Discover Cards, Discover Map, and Quest Detail.
- Public loading, empty, error, image-fallback, and map-unavailable states.
- Applicable frontend gates pass.

## Phase 15B — Member journey, Passport, completion, and sharing

### Mission Board

- Preserve current fail-closed state classification.
- Recompose around:
  - rank/player header;
  - XP level progress;
  - weekly streak;
  - Home Community position when available;
  - next achievement/milestone;
  - active community challenge;
  - highest-priority next action;
  - state tabs and Quest actions;
  - recent achievements and Passport preview.
- Every absent datum receives a truthful bounded fallback in the same layout.

### Completion and reward

- Add the Make-style method chooser, filtered to methods actually permitted for
  the selected Quest.
- Preserve code secrecy, evidence privacy, self-report no-XP wording, CSRF,
  rate limits, and server authority.
- Restore the reward celebration composition.
- Show level/rank/achievement reveals only when explicitly returned by
  authoritative state; never infer them from arithmetic.
- Include View Passport, Create Share Card when eligible, Continue, Escape,
  backdrop, focus restoration, and reduced-motion behavior.

### Passport

- Recompose the full existing Passport into the Make hierarchy:
  - identity/rank summary;
  - XP and streak;
  - next milestone;
  - category impact;
  - achievement collection;
  - community participation;
  - claims;
  - filtered completion history;
  - Share Card entry.
- Add All/Verified/Self-reported/category history controls using a complete,
  truthful data set. Do not filter only the visible page and imply completeness.
- Do not add fictional category targets or a fixed achievement count.

### Share Card Builder

- Match Make control density, preview proportions, theme imagery, category
  emblem, rank crest, type hierarchy, and overlays.
- Use repository-owned assets only.
- Use one render model for the visible preview and exported 1080 × 1080 PNG.
- Preserve all privacy exclusions and verified-only selection.

### 15B gate

- A confirmed local Member with representative, non-production fixture data is
  used for browser evidence.
- Captures at desktop and 390 × 844 cover Mission Board tabs, method chooser,
  code/claim/self-report forms, standard reward, Passport, and Share Builder.
- Empty/new-member and partial-data states are captured separately.
- Applicable frontend gates pass; backend gates run only if approved API code
  changes.

## Phase 15C — Leaderboard, states, responsive closure, and review

### Leaderboard

- Restore Make geography/period segmentation, People/Communities switch,
  populated podium, medal/rank art, rows, current-user context, and challenge
  placement.
- Retain privacy-protected and empty variants.
- Display real SignalR status as Live, Reconnecting, or Unavailable; never use
  a decorative always-Live label.
- Do not show personal-best or movement values unless supported by an approved
  contract.

### Cross-route closure

- Verify the seven target pages in light and dark themes.
- Verify 1440-class desktop, tablet, and 390 × 844 mobile composition.
- Verify keyboard focus, Escape/backdrop, horizontal tabs, bottom navigation,
  sticky actions, safe-area spacing, 320 px overflow, reduced motion, and
  contrast.
- Check that Login/Register, Organizer, Admin, account lifecycle, and error
  pages still use the shared system without behaviour regression. These pages
  are not required to match nonexistent runnable Make frames.

### Evidence and review

- Store paired Make/production screenshots by route, viewport, theme, and
  populated/empty state.
- The completion report includes a parity matrix with one of:
  `Matched`, `Truthful adaptation`, or `Explicitly excluded`.
- A screenshot is not accepted if it only proves that a route rendered.
- K3 performs one independent read-only review after evidence exists. The
  review must inspect the stored visual comparisons in addition to code,
  security boundaries, and gates.
- One bounded correction pass closes original Blocker/Major findings.

## Required acceptance rules

A target page is restored only when:

1. section order and top-of-fold composition match;
2. desktop column ratios and mobile stacking match;
3. primary actions occupy the same visual priority and responsive location;
4. card density, type hierarchy, emblem/crest/badge language, spacing, radius,
   border, and elevation are recognizably the same system;
5. populated and empty states retain the same page geometry;
6. real values replace demo values without changing hierarchy;
7. interactive states have observed browser evidence;
8. no accepted production behaviour or security/privacy rule regresses.

Colour-token reuse alone, generic rounded cards, source inspection alone, or a
desktop-only route smoke test do not satisfy restoration.

## Explicit exclusions

- Make Demo toolbar and simulation controls;
- hard-coded Mia K., rankings, XP, challenge progress, or achievement targets;
- remote Unsplash assets;
- new package/dependency without separate approval;
- schema or authentication-model change without separate approval;
- seasons, leagues, chat, social feed, economy, outcome claims, or other new
  product domains;
- pixel-perfect copying of browser/font rasterization. Composition and visual
  identity, not identical antialiasing, are the target.

## Stop conditions requiring human approval

- a new public API field or changed privacy exposure is needed;
- literal parity requires new persisted organizer/eligibility/movement data;
- a new dependency is necessary for gallery, export, visual regression, or
  animation;
- repository-owned visual assets cannot be produced from the accepted source;
- a Make interaction conflicts with accepted security or data authority;
- scope expands beyond the seven runnable Make pages and shared system.

## Expected file emphasis

Most work should remain in:

- shared visual primitives and CSS;
- `AppShell`;
- the seven primary page components;
- existing quest, Passport, community, completion, and Share Card components;
- tests and visual evidence.

Avoid another page-local styling pass that duplicates the same component in
multiple routes.
