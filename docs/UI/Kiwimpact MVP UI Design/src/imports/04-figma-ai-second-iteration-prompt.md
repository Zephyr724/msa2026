# 06 — Figma AI Second-Iteration Prompt

- **Status:** Accepted prompt
- **Date:** 2026-07-20
- **Product:** Kiwimpact
- **Recommended path:** `specs/ai/prompts/06-figma-ai-second-iteration-prompt.md`
- **Prompt type:** Actual prepared prompt for the second Figma AI iteration
- **Input design:** Existing Kiwimpact first-pass MVP Figma design

> Preserve this file as AI-assisted design evidence. After using a prompt, record the use date, resulting Figma version, and human review outcome below. Do not claim that generated UI has been implemented.

## Usage record

- **Prompt used on:** `NOT_YET_USED`
- **Figma file/version:** `NOT_YET_RECORDED`
- **Human reviewer:** `NOT_YET_RECORDED`
- **Outcome:** `NOT_YET_REVIEWED`

---

## Prompt 1 — Round 2A: Visual System, Navigation, and Community Leaderboard

Revise the existing first-pass Kiwimpact MVP UI. Do not redesign the product from scratch and do not replace the current information architecture.

Kiwimpact is an Auckland-first gamified environmental participation platform for a broad all-age audience. The interface should feel like a friendly, trustworthy eco-adventure: playful but not childish, energetic but not noisy, and gameful without becoming a hardcore game.

Preserve what already works:

- bright and optimistic eco colours;
- Light and Dark themes;
- flat design;
- rounded cards and buttons;
- soft shadows;
- strong XP visibility;
- clear Quest Card structure;
- responsive desktop and mobile layouts;
- the existing Leaderboard as the strongest first-pass page.

Use external products only as pattern references:

- Khan Academy for progress clarity and all-age hierarchy;
- Nike Run Club for mature achievement and sharing;
- Stack Overflow for verified contribution and identity semantics;
- Reddit for community belonging;
- GitHub and Codecademy for long-term progress and next-step guidance;
- Forest for gentle collection;
- Kahoot for short celebration and immediate feedback;
- Duolingo for XP and level feedback.

Do not copy any product's branding, colours, layout, mascot, or exact assets.

### 1. Typography

Use two type families:

- Fredoka for Display, H1, H2, major section headings, Quest Card titles, Achievement names, and reward headings;
- Manrope for body text, labels, forms, dates, tables, helper text, and dense Organizer/Admin UI.

Fredoka must feel friendly and rounded, but not juvenile. Keep body text professional and highly readable. Also show one small comparison sample using Nunito ExtraBold only if Fredoka appears too childish; do not redesign pages around both options.

### 2. Iconography

Keep clear Lucide-style icons for functional controls, but use heavier rounded strokes, approximately 2.25–2.5 px, and more comfortable icon containers.

Create a more expressive, cohesive filled or duotone icon treatment for:

- Quest categories;
- XP and Level;
- Achievements;
- Rank Titles;
- community identity;
- Top 3 leaderboard states;
- reward reveals.

The gameful icons may feel like badges, stamps, or stickers. Do not make utility icons decorative or unclear.

### 3. Navigation

Revise desktop Member navigation to use icon + label for:

- Discover;
- My Quests;
- Passport;
- Leaderboard;
- Manage, when role-appropriate.

Use a strong rounded pill or game-tab active state. Keep the XP/level indicator separate.

Keep mobile bottom navigation with icon + label and clear active state.

Do not add Shop, Wallet, Diamonds, Coins, or Currency Balance anywhere.

### 4. Community Selector

Create a reusable Community Selector for onboarding and Profile Settings.

Use this example:

Choose your community

Country: New Zealand
City / region: Auckland
Community: Henderson-Massey

Include this helper message:

“Your community is used for local leaderboards and community progress. We do not collect or display your precise home address.”

Create desktop and mobile states for:

- default;
- loading;
- validation error;
- server error;
- saved;
- change cooldown active.

Do not request GPS, device location, IP-based location, a street address, or a home map pin.

### 5. Leaderboard

Preserve the strongest qualities of the existing Leaderboard and revise it rather than replacing it.

Add two separate control groups:

Geographic scope:
My Community | Auckland | New Zealand

Time period:
Weekly | Monthly | All-time

Default signed-in state:
My Community + Weekly

Include:

- region heading;
- Top 3;
- Top 10;
- current-user highlight;
- Your Position;
- Personal Best;
- rank movement where available;
- verified XP;
- verified Quest count;
- live, reconnecting, and unavailable states.

Add cooperative community progress near the ranking:

Henderson-Massey this month
42 verified quests
18 active contributors
6 quest categories represented

Create a small-community state:

“Your community is still growing.”

Show collective progress and a button to view Auckland. Do not show a full leaderboard for a community with too few active users.

### 6. Accessibility and implementation constraints

- Desktop frame: 1440 px.
- Mobile frame: 390 px.
- Use Auto Layout, reusable components, variants, and Light/Dark variables.
- Minimum touch target: 44 × 44 px.
- Icons support labels; they do not replace them.
- Rank and status do not depend on colour alone.
- Keep the result feasible for React, TypeScript, Tailwind CSS, daisyUI, and Lucide React with custom category/reward assets.

Generate Round 2A only. Stop after producing:

1. typography and icon style board;
2. revised desktop and mobile navigation;
3. Community Selector;
4. revised Leaderboard;
5. small-community state;
6. community-progress component.

Do not revise all remaining pages until human review.

---

## Prompt 2 — Round 2B: Discover, Passport, Rewards, and Share Card

Apply the approved Round 2A visual system to the existing Kiwimpact first-pass pages. Preserve the existing page structures unless a change below requires a small layout adjustment.

### 1. Discover

Add a `My Community` filter.

Do not use the label `Near Me`, because the product does not use precise geolocation.

When no Home Community is selected, show a setup prompt without blocking wider Auckland discovery.

Quest Cards may show a coarse Quest location such as `Henderson-Massey`.

### 2. Quest Detail

Preserve the existing content hierarchy.

Refine:

- coarse Quest location;
- gameful category icon;
- verification method;
- XP eligibility;
- clear next action.

Do not claim that a completed Quest equals a measured environmental outcome.

### 3. Personal Impact Passport

Make the Passport the main long-term identity and progress page.

Include:

- Display Name;
- Level and Rank Title;
- XP progress;
- optional `Henderson-Massey Contributor` identity;
- link to My Community leaderboard;
- progress across all six Quest categories;
- earned and locked Achievements;
- long-term participation timeline or activity view;
- completion history with clear Verified and Self-reported distinction.

Do not copy GitHub's contribution graph exactly. Pair colour with labels and counts.

You may show one clearly labelled stretch example of an Achievement-unlocked Passport border. It must not include a price, Shop, currency, or purchase action.

### 4. Completion and reward feedback

Create annotated states:

1. Quest verified;
2. +100 XP count-up;
3. level progress movement;
4. Achievement Unlocked;
5. optional Achievement-unlocked decoration, marked Stretch;
6. final summary and next action;
7. Reduced Motion version.

Motion notes:

- 120 ms fast;
- 220 ms standard;
- 350 ms emphasis;
- 600–900 ms reward;
- skippable;
- no background music;
- optional sound off by default.

Self-reported completion must not show XP, leaderboard, streak, or Achievement credit when the accepted rules exclude those rewards.

### 5. Share Card

Make the Share Card feel like a mature personal achievement card.

Default content:

- Kiwimpact;
- Display Name;
- Quest;
- completion date;
- XP earned;
- Rank Title or Achievement;
- tasteful category art.

Default privacy:

- do not show Home Community;
- do not show exact activity meeting location;
- do not show evidence;
- do not show a precise personal location;
- do not show carbon saved or another unvalidated impact number.

### 6. Profile Settings

Add a Community section:

- current selection;
- change action;
- privacy explanation;
- next allowed change date when cooldown applies;
- clear saved/error states.

Keep account and security settings separate.

### 7. Required states

Include:

- loading;
- empty;
- first-use;
- validation error;
- server error;
- no Home Community;
- unsupported Region;
- cooldown;
- reward Reduced Motion.

### 8. Hard exclusions

Do not add:

- virtual diamonds;
- coins;
- Wallet;
- Shop;
- prices;
- purchases;
- purchasable cosmetics;
- loot boxes;
- equipment;
- pets;
- bosses;
- public social feed;
- public voting or Karma;
- GPS-based community detection;
- precise home location;
- daily-streak punishment;
- public evidence;
- unvalidated environmental impact claims.

Generate desktop 1440 px and mobile 390 px frames using the approved Round 2A components and styles.
