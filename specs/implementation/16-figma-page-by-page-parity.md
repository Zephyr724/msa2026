# Slice 16 — Figma Page-by-Page Parity

## Status

**Accepted — explicitly approved by the product owner on 2026-07-27.**

## Goal

Close the remaining visual gap with the accepted Kiwimpact Figma Make MVP one
page at a time. Preserve the Slice 15 production behaviour, real APIs,
authorization, privacy, and truthful data while matching the Make page
composition, scale, density, visual hierarchy, responsive ordering, and
interaction layers.

This Slice supersedes the overly broad `Matched` labels in the Slice 15 report.
A page is complete only after a same-viewport reference/current comparison
shows the same first-fold composition and recognizable full-page hierarchy.

## Design source

- Figma Make file:
  `https://www.figma.com/make/2pACGo2MnSp1BOFglrkFJ0/Kiwimpact-MVP-UI-Design`
- Connected Make source returned by Figma `get_design_context` for node `0:1`.
- Runnable local copy under `docs/UI/Kiwimpact MVP UI Design/`.
- Stored Make screenshots under
  `specs/implementation/evidence/14-figma-parity/prototype/`.

Accepted specifications and server truth override prototype demo values.

## Phase 16A — Scale, shell, and public journey

### Shared scale and shell

- Keep the 1200 px Make content width.
- Align Make typography: page titles generally `text-3xl`, detail titles
  `text-3xl md:text-4xl`, and Landing hero `text-4xl md:text-5xl`.
- Reduce generic page padding, section gaps, card padding, radius, and shadow
  where the current UI is materially larger than Make.
- Match guest/member navigation proportions, active states, XP capsule, and
  narrow-screen ordering without removing production-only role destinations.
- Prevent horizontal overflow at 1280, 390, and 320 CSS pixels.

### Landing

- Reproduce the two-column hero with the map/adventure visual present in the
  first desktop viewport.
- Keep Personal Progress and Community Goal visible immediately after the hero.
- Match the Make section order and density for Featured Quests, connected loop,
  Passport showcase, closing CTA, and footer.
- Keep real Member/guest content in the same geometry.

### Discover

- Put search, Filters, sort, Cards/Map, and category chips into the Make compact
  control stack.
- Show the beginning of three Quest cards in the 1280 × 720 reference viewport.
- Match card image ratio, overlay chips, metadata density, and footer action.
- Retain URL filters, paging, real Google Maps, error states, and Cards default.

### Quest Detail

- Add a reliable image-error fallback for Hero and gallery assets.
- Match the Make 420 px desktop Hero, category/location overlay, `1fr / 340px`
  main layout, compact facts/reward hierarchy, and sticky action summary.
- Keep gallery, location map, related Quests, and mobile sticky action, but
  reduce their spacing to the Make rhythm.

## Phase 16B — Member journey

### Mission Board

- Put player identity, XP progress, weekly streak, available community context,
  milestone/challenge, and highest-priority completion action into the first
  desktop viewport.
- Replace verbose technical fallback copy with concise truthful product copy.
- Keep fail-closed Quest classification and all real actions unchanged.

### Passport

- Begin with the Make green identity banner instead of a large duplicate title
  region.
- Match next milestone, single-column category rows, badge collection, and
  history filter density.
- Move community settings, sharing, claims, and secondary history into a lower
  secondary hierarchy without removing functionality.

### Leaderboard

- Use the Make 900 px centered content region.
- Restore segmented geography and period controls, populated podium emphasis,
  rows, current-user context, privacy states, and real SignalR status.
- Do not invent personal best or rank movement.

### Share Card and completion

- Match the Make 340 px control column and 560 px preview at desktop without
  horizontal clipping.
- Preserve the single preview/export canvas and all privacy exclusions.
- Store separate reference/current evidence for the completion method chooser
  and the verified reward layer.

## Phase 16C — Visual acceptance and closure

- Capture Make and current pages at the same CSS viewports:
  - desktop: 1280 × 720;
  - mobile: 390 × 844;
  - narrow overflow check: 320 px.
- Store viewport and full-page images separately; never compare a Make viewport
  image with a current full-page image.
- Cover Landing, Discover Cards/Map, Quest Detail, Mission Board, Passport,
  Leaderboard, Share Card, completion chooser, and reward.
- Reject evidence containing repeated page captures, unexplained blank bands,
  clipped content, or a different CSS viewport/device scale.
- Run applicable frontend and backend gates and record observed results.
- Create the prompt, completion report, evidence manifest, and one independent
  K3 read-only review before requesting commit approval.

## Explicit exclusions

- Make Demo toolbar and simulated Guest/Member switches.
- Hard-coded Mia K., XP, ranking, challenge, achievement, or completion values.
- New dependencies, schema changes, authentication changes, or new product
  domains.
- Remote or unlicensed prototype imagery. Production Quest images remain
  authoritative; repository-owned fallbacks must preserve the Make geometry.

## Stop conditions

Obtain separate approval if parity requires:

- a new dependency;
- a schema or public API/privacy change;
- new persisted organizer, eligibility, personal-best, or movement data;
- copying an asset without verified repository ownership or permitted use.
