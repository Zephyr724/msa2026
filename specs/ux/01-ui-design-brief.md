# Kiwimpact UI Design Brief

- Status: Accepted Base UI Brief
- Date: 2026-07-19 (accepted 2026-07-20)
- Source: `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`
- Purpose: guide the first Figma information-architecture and key-screen pass
- Scope: MVP design direction only; this document does not claim implementation
- Community extension: `specs/ux/04-community-identity-leaderboard-and-selector.md`

## 1. Product experience

Kiwimpact is an Auckland-first gamified community environmental participation
platform for Aotearoa New Zealand.

Core loop:

`Discover → Understand → Join → Complete → Verify → Earn → Record → Share → Continue`

The experience should make environmental participation feel achievable,
trustworthy, and rewarding. It should feel like a friendly eco-adventure:
energetic, rounded, slightly cartoon-like, and gameful without becoming
childish.

## 2. Primary users

### Guest

- understand Kiwimpact quickly;
- browse and filter quests;
- switch between list and map discovery;
- view Quest Detail and leaderboard;
- open official external-event links;
- understand the value of an account.

### Member

- register or sign in;
- join or cancel eligible quests;
- complete verification flows;
- see XP, level, rank, achievements, and streak;
- manage My Quests;
- review the Personal Impact Passport;
- generate a Share Card.

### Organizer

Member capabilities plus:

- create, edit, publish, cancel, and archive owned quests;
- set capacity and registration mode;
- choose coordinates;
- view participants;
- issue or manage a completion code.

### Admin

- manage all quests;
- create curated external quests;
- review external completion claims;
- manage external-source freshness;
- perform role-related administration where required.

The MVP does not include a public Organizer application workflow.

## 3. Design principles

1. **Action before decoration** — the next useful action is obvious.
2. **Trust is visible** — verification, source, ownership, privacy, and status
   are understandable without reading policy text.
3. **Progress is motivating** — XP and rewards support rather than obscure the
   task.
4. **Gameful, not childish** — rounded and energetic while remaining credible.
5. **List access is complete** — maps enhance discovery but never replace it.
6. **Responsive by design** — mobile is not a compressed desktop layout.
7. **Accessible feedback** — do not rely only on color, hover, animation, or
   sound.

## 4. Initial visual system

### Kiwimpact Light

- Primary: `#2F8F5B`
- Secondary: `#6C63D9`
- Accent: `#F4B740`
- Base: `#F8FBF4`
- Content: `#183026`

### Kiwimpact Dark

- Primary: `#6FD69A`
- Secondary: `#AAA1F5`
- Accent: `#FFD166`
- Base: `#13211B`
- Content: `#F2F7F3`

These are initial tokens, not permission to use low-contrast combinations.

### Geometry and spacing

- Button/input radius: 14 px
- Card radius: 20 px
- Modal radius: 24 px
- Badges: pill shape
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 px

### Motion

- Fast: 120 ms
- Normal: 220 ms
- Emphasis: 350 ms
- Reward: 600–900 ms

Reward motion is skippable, lighter on mobile, and replaced by a simple state
change when reduced motion is enabled.

### Assets

- Lucide for functional icons
- unDraw only for temporary illustrations
- custom Kiwimpact rank/achievement assets during polish
- no copied provider photos, logos, posters, or illustrations by default

## 5. Proposed information architecture

Route names are proposed for design coordination and are not an accepted API or
implementation contract until reviewed.

### Public

- `/` — Landing
- `/quests` — Discover Quests
- `/quests/:questId` — Quest Detail
- `/leaderboard` — Leaderboard

### Authentication and recovery

- `/login`
- `/register`
- `/confirm-email`
- `/forgot-password`
- `/reset-password`

### Member

- `/dashboard` — My Quests and current progress
- `/passport` — Personal Impact Passport
- `/settings` — profile, login methods, privacy, theme, sound

Completion and claim steps may be full pages, routed drawers, or focused
dialogs. Choose the final pattern after reviewing the mobile flow.

### Organizer

- `/organizer/quests`
- `/organizer/quests/new`
- `/organizer/quests/:questId/edit`
- `/organizer/quests/:questId/participants`

### Admin

- `/admin/quests`
- `/admin/external-quests`
- `/admin/claims`
- `/admin/sources`
- `/admin/users` only where role management is required

## 6. Navigation

### Desktop

Recommended shell:

- left: Kiwimpact brand;
- primary: Discover and Leaderboard;
- authenticated: My Quests and Passport;
- role entry: Organizer or Admin workspace;
- right: XP/level summary, theme, account menu.

Do not expose every management destination in the public navigation.

### Mobile

Recommended Member-facing bottom navigation:

1. Discover
2. My Quests
3. Passport
4. Leaderboard
5. Account

Organizer/Admin workspaces use a separate compact header, tabs, or menu rather
than overloading Member navigation.

## 7. First Figma frame set

Create at least:

- Desktop: 1440 px wide
- Mobile: 390 px wide
- Optional tablet check: 768 px wide

These are design frames, not final implementation breakpoints.

### P0 frames for first review

1. Landing — desktop and mobile
2. Discover — desktop list/map and mobile list
3. Discover mobile map state
4. Quest Detail — desktop and mobile
5. Dashboard / My Quests — desktop and mobile
6. Personal Impact Passport — desktop and mobile
7. Leaderboard — desktop and mobile
8. Organizer Quest List
9. Organizer Create/Edit Quest
10. Admin Claim Review

### P1 frames after layout review

- Login and Register
- Email confirmation and recovery
- Completion code entry
- External evidence claim
- Completion/reward overlay
- Share Card preview
- Empty/error variants
- Admin source-review queue
- Organizer participants and completion-code view

## 8. Screen briefs

### 8.1 Landing

Purpose: explain the product and theme, move users to Discover, and establish
trust/local relevance.

Recommended regions:

- compact navigation;
- hero with `Explore quests` CTA;
- visual showing actual Quest Card/progress rather than a generic landscape;
- three-step core loop;
- category preview;
- Passport/progression preview;
- trust/source explanation;
- final CTA.

Avoid an oversized hero that hides product behavior.

### 8.2 Discover Quests

Purpose: help users find a relevant quest quickly.

Desktop:

- search/filter row;
- result count and sort;
- list/map control;
- coordinated list and map;
- selected marker/result state.

Mobile:

- list first;
- compact search/filter controls;
- full-screen or near-full-screen map state;
- filter drawer;
- persistent return to results.

Design filter concepts for category, date/time, registration/source type,
difficulty, and location/region where available. View, sort, filter, and
pagination are URL-owned state.

### 8.3 Quest Card

Show where relevant:

- category;
- title;
- date/time;
- location;
- difficulty;
- XP for verified completion;
- registration/source type;
- capacity/availability;
- organiser/provider;
- status or source freshness;
- clear primary action.

Keep cards scannable; do not give every metadata field equal weight.

### 8.4 Quest Detail

Recommended hierarchy:

1. title, category, state, verification/registration labels;
2. primary action;
3. date, location, difficulty, capacity, XP;
4. concise Kiwimpact summary;
5. participation/verification explanation;
6. map and text location;
7. organiser/provider and source trust information.

Curated external quests visibly show:

- `View official event`
- `Registration is managed by the original event provider`
- `Official source is authoritative`
- `Last checked: ...`

Do not show copied provider imagery or long copied text by default.

### 8.5 Dashboard / My Quests

Purpose: answer “What should I do next?”

Recommended regions:

- level/rank/XP progress;
- next or active quest;
- joined/upcoming quests;
- pending verification/claims;
- completed/recent progress;
- streak and achievement preview.

Avoid turning the dashboard into dense analytics.

### 8.6 Personal Impact Passport

Recommended regions:

- display name and current rank;
- verified vs self-reported distinction;
- level, XP, streak, achievement summary;
- timeline or grouped completion record;
- verification labels;
- Share Card entry.

Do not show invented carbon-equivalent totals.

### 8.7 Leaderboard

Time scopes:

- weekly;
- monthly;
- all-time.

Show current-user row, rank, display name, level/rank title, and verified XP.
Provide loading, empty, reconnecting, and privacy-aware states. Real-time
updates should not make rows jump continuously; use a controlled update cue.

### 8.8 Organizer workspace

Quest list needs status, search/filter, create, edit, participant/capacity,
completion-code, publish/cancel/archive, and clear ownership.

Create/Edit should use a full responsive page. Suggested groups:

1. basics;
2. category/difficulty;
3. date/location;
4. registration mode;
5. capacity;
6. completion settings;
7. review/publish.

High-impact actions require clear confirmation.

### 8.9 Admin claim review

Recommended layout:

- claim queue and filters;
- claimant/quest summary;
- participation date;
- description;
- untrusted external evidence link;
- declaration;
- approve/reject;
- short rejection reason;
- retention/purge information where useful.

Do not embed or preview evidence links.

### 8.10 Authentication

Include email/password, Google login, generic failure, confirmation guidance,
recovery, and loading/disabled submit states. Forgot-password must not reveal
account existence.

### 8.11 Completion and reward

Organizer-verified flow may include completion-code entry, verification result,
and reward sequence.

External flow may include participation date, description up to about 500
characters, optional HTTPS evidence URL, declaration, and pending-review state.

Reward sequence annotation:

1. Quest Completed
2. particles/stars move toward XP
3. XP count increases
4. progress fills
5. Level Up
6. Rank Up when applicable
7. Achievement Reveal
8. Passport/leaderboard refresh

Provide Skip and reduced-motion variants.

### 8.12 Share Card

Design a 1080 × 1080 square showing optional Display Name, Quest name,
completion date, verification label, XP, current level, rank title, and
Kiwimpact branding.

Provide `Show my display name` on by default, Web Share action where supported,
and download fallback. Never include email, user ID, evidence, claim text,
review notes, or precise GPS.

## 9. Core component inventory

- app header and mobile bottom navigation;
- Quest Card;
- category, difficulty/XP, registration/source, verification, freshness badges;
- filter chips and drawer;
- map marker and marker summary;
- level/rank progress;
- achievement tile and streak indicator;
- Passport record;
- leaderboard row;
- status tabs;
- loading skeleton;
- empty/error/retry panel;
- form field and validation state;
- confirmation dialog;
- toast/inline feedback;
- reward overlay;
- Share Card preview.

Show focus, disabled, loading, selected, error, and reduced-motion-relevant
variants where applicable.

## 10. Required states

Every important screen accounts for:

- loading;
- empty;
- success;
- validation error;
- server error;
- forbidden;
- not found.

Feature-specific states include unauthenticated action, quest full,
registration closed, duplicate participation, cancelled/archived quest,
source needs review/removed, claim statuses, SignalR reconnecting, map
unavailable with list fallback, and share unavailable with download fallback.

The first pass may use component variants and annotations rather than a separate
high-fidelity frame for every state.

## 11. Responsive and accessibility guidance

### Mobile

- one primary action;
- drawers/focused screens for filters;
- touch targets approximately 44 × 44 px minimum;
- avoid dense management tables;
- reduce animation intensity;
- keep source/verification details accessible.

### Desktop

- coordinated list/map and management workspaces;
- readable text width;
- visible important actions;
- tables only where comparison density adds value.

### Accessibility

- semantic heading order;
- visible keyboard focus;
- keyboard-accessible controls and alternatives;
- color is never the only signal;
- checked text/control contrast;
- associated form errors;
- reduced motion;
- interface sounds with a persistent user-controlled mute;
- complete list alternative to maps;
- accessible names for icon-only controls;
- no hover-only information.

## 12. Content and tone

Use concise New Zealand English. Tone is optimistic, practical, trustworthy,
and motivating without exaggerated environmental claims.

Prefer:

- `Join quest`
- `Enter completion code`
- `Submit for review`
- `View official event`
- `Continue exploring`

Avoid guilt-based language, invented partnerships, invented carbon impact,
vague reward promises, and copied provider descriptions.

## 13. Figma handoff expectations

Before Claude interprets the design, provide:

- Figma link or exported frames;
- named desktop/mobile frames;
- component variants;
- token page;
- route/page labels;
- interaction annotations;
- unresolved questions;
- examples of loading, empty, error, and reduced-motion behavior.

Claude's first task must be read-only analysis. It reports product
understanding, route/component map, state ownership, conflicts, missing
decisions, dependencies, risks, and proposed scaffold order before writing
code.
