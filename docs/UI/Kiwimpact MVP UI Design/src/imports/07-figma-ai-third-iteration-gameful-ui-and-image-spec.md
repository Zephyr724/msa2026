# 07 — Figma AI Third-Iteration Gameful UI and Image Integration Specification

- **Project:** Kiwimpact
- **Document type:** Third-iteration Figma AI specification and prompt
- **Version:** 3.0
- **Date:** 2026-07-21
- **Status:** Ready for Figma AI generation and human review
- **Recommended repository path:** `/specs/ai/prompts/07-figma-ai-third-iteration-gameful-ui-and-image-spec.md`
- **Input:** Existing Kiwimpact second-pass Figma Make design and exported React prototype
- **Purpose:** Apply a visibly stronger, coherent gamification language while preserving the accepted MVP structure

> This document records AI-assisted design instructions. Generated Figma screens
> are design proposals only and do not prove that the features have been
> implemented, tested, or deployed.

---

## 1. Third-Iteration Objective

Revise the existing Kiwimpact MVP rather than rebuilding it.

The second iteration already added many correct features, including:

- XP and levels;
- achievements;
- weekly streak;
- Quest category progress;
- Passport;
- community selection;
- geographic leaderboards;
- community progress;
- completion rewards;
- Share Card;
- icon-supported navigation.

However, these features still feel like separate dashboard modules rather than
one continuous gameful experience.

The third iteration must create a coherent product loop:

```text
Discover a Quest
→ Join and complete it
→ Get verified
→ Earn XP
→ Advance a level or achievement
→ Help the local community goal
→ Update the Passport
→ Choose the next Quest
```

The design must feel:

- playful but not childish;
- inclusive for users from children to adults around 60;
- energetic but not visually noisy;
- flat but dimensional;
- environmentally positive without making unsupported impact claims;
- recognisably gamified without looking like a quiz app or hardcore RPG.

---

## 2. Non-Negotiable Changes

The following requirements must be implemented in the third Figma iteration.

### 2.1 Fredoka must use Medium only

Use:

```text
Fredoka Medium 500
```

for:

- Display headings;
- H1;
- H2;
- H3;
- Quest titles;
- Achievement titles;
- Level Up headings;
- reward headings;
- major empty-state titles.

Do not use Fredoka Bold, ExtraBold, 700, or 800.

Use:

```text
Manrope Regular 400
Manrope Medium 500
Manrope Semibold 600
Manrope Bold 700
```

for:

- body copy;
- buttons;
- navigation labels;
- form labels;
- dates and locations;
- status labels;
- XP and leaderboard numbers;
- dense Organizer/Admin content.

Required text styles:

```text
Display / Fredoka Medium / 48–56
Page H1 / Fredoka Medium / 36–44
Section H2 / Fredoka Medium / 28–36
Card Title / Fredoka Medium / 18–25
Achievement Title / Fredoka Medium / 18–24
Body / Manrope Regular / 16–24
Button and Tab / Manrope Semibold / 14–20
XP and Rank Number / Manrope Bold / responsive size
```

Typography alone must not be treated as the complete gamification revision.

### 2.2 Images are mandatory

Every major user-facing content card must include a meaningful image,
illustration, badge artwork, avatar, or visual media area.

**Do not generate large text-only content cards.**

This rule applies to:

- Featured Quest Cards;
- Discover Quest Cards;
- My Quests / Mission Cards;
- completed Quest history cards;
- Passport activity cards;
- Achievement feature cards;
- Next Milestone cards;
- Community Challenge cards;
- onboarding feature cards;
- landing-page feature cards;
- Share Card previews.

Quest Detail must include a large hero image.

Small utility elements such as filter chips, form fields, table rows, compact
status pills, and tiny KPI chips do not require photographs. If a larger card
contains only a metric or system state, give it a purposeful icon,
illustration, crest, or decorative visual panel so that it is not an empty
text box.

### 2.3 Local leaderboard must display the actual local area

Do not stop at Auckland.

Use explicit examples:

```text
Henderson-Massey
Auckland
New Zealand
```

and:

```text
Devonport-Takapuna
Auckland
New Zealand
```

The first selected scope must show the actual local area name. Do not replace
it with the generic label `My Community`.

`My Community` may appear as a small supporting label:

```text
Henderson-Massey
My Community
```

Create both:

1. a local community with enough active users to show a full leaderboard;
2. a small community that shows the privacy-safe growing-community state.

### 2.4 Replace formal game-related icons

Do not reuse ordinary thin Lucide icons for all game-related content.

Create a visibly distinct gameful icon and badge system for:

- six Quest categories;
- XP;
- Level;
- Rank Title;
- Community;
- Achievement;
- Verified Completion;
- Top 1, Top 2, and Top 3;
- Reward Unlock;
- Passport identity.

Style:

```text
Rounded filled or duotone flat icons
Two or three colour layers
Soft geometric silhouettes
Minimal internal detail
Badge, patch, stamp, or sticker quality
No emoji
No thin outline-only treatment
No pixel art
No realistic 3D rendering
```

Lucide-style line icons may remain for functional controls such as Search,
Filter, Close, Calendar, Settings, Back, Edit, and Map controls.

---

## 3. Mandatory Image System

### 3.1 Source and licensing

For the Figma prototype, use suitable royalty-free or freely licensed
third-party stock photography or illustration placeholders.

Possible sources include approved free-stock libraries such as Unsplash,
Pexels, Pixabay, or equivalent sources available to Figma AI.

Create a separate Figma page named:

```text
00 — Image Sources
```

For every third-party image, record:

- screen/component where it is used;
- image title or short description;
- creator or source name where available;
- original source URL;
- stated licence or usage note;
- date accessed;
- whether it is temporary prototype content.

Do not assume that an image is unrestricted merely because it is online.

For final implementation, images should be downloaded, optimised, and served
through the project or an approved image service rather than permanently
hotlinked without review.

### 3.2 Image direction

Use authentic, optimistic environmental-action imagery related to Aotearoa New
Zealand where suitable:

- community planting;
- beach or neighbourhood clean-up;
- native plants;
- bird observation;
- composting and gardening;
- community workshops;
- environmental learning;
- groups participating outdoors.

Avoid:

- generic corporate handshake imagery;
- unrelated mountain landscapes used only as decoration;
- repeated use of the same leaf photo;
- images that imply a verified outcome not supported by the Quest;
- stereotypes or unreviewed cultural symbolism;
- identifiable children where the source and model-release conditions are
  unclear;
- images that show unsafe environmental behaviour.

Represent a range of ages and backgrounds without turning diversity into a
token visual checklist.

### 3.3 Image treatment

Maintain one coherent treatment:

- rounded top corners aligned with the card radius;
- consistent crop behaviour;
- subtle category-colour overlay or corner accent;
- readable text contrast;
- no heavy dark overlays across every image;
- no inconsistent filters;
- no excessive gradients;
- image fallback state;
- loading skeleton;
- descriptive alt-text annotation.

Recommended media ratios:

```text
Quest Card desktop: 16:9 or 4:3, 150–190 px high
Quest Card mobile: 16:9, 150–180 px high
Quest Detail desktop hero: 16:9, approximately 420–520 px high
Quest Detail mobile hero: 3:2 or 4:3
My Quests compact card: 96 × 96 thumbnail or full-width 16:9
Community Challenge: wide 3:1 or 16:6 visual
Share Card: full-bleed background or large category image with readable overlay
Passport activity: 4:3 or square thumbnail
```

### 3.4 Card-specific image behaviour

#### Quest Cards

Each Quest Card must show an image that corresponds to its category and
activity. Do not use one generic environmental image for every Quest.

Place a gameful category emblem partially over or immediately below the image.

#### Quest Detail

Add:

- large hero image;
- category emblem;
- optional image caption or source note in the Figma specification;
- image fallback state;
- mobile crop state.

The hero image should establish the activity before the title and logistics.

#### Achievement Cards

Use custom badge artwork rather than stock photos.

#### Community Challenge Cards

Use an illustrative local-environment banner or community-action image plus a
clear progress goal.

#### Passport and completion history

Use Quest thumbnails, stamps, badges, or category artwork so that the Passport
feels like a personal record rather than a statistics dashboard.

#### Leaderboard

Leaderboard rows do not need stock photos. Use:

- avatar or initials;
- Rank Crest;
- local Community emblem;
- Top 3 medal artwork.

The overall community-progress or challenge card may include a local image or
illustration.

---

## 4. Core Gameful Components

Create these components before revising full pages.

### 4.1 Player Status Capsule

Create desktop, compact navbar, mobile, and Passport variants.

Required content:

```text
Avatar or Level Crest
Mia K.
Level 7 · Novice
420 / 525 XP
Progress to next level
```

The capsule must make the user's persistent game identity visible.

Click destination:

```text
Personal Impact Passport
```

### 4.2 Mission Card

Transform the existing event-style Quest Card into a recognisable mission card.

Required anatomy:

```text
Quest image
Large category emblem
Category name
Quest title
Coarse local area
Date and time
Difficulty shield with text
XP reward block
Capacity or urgency
Quest state
Current or next step
Primary action
```

Required states:

- Available;
- Joined;
- Upcoming;
- Ready to Complete;
- Awaiting Verification;
- Verified;
- Self-reported;
- Full;
- Expired.

State examples:

```text
Current step: Attend the event
Next step: Enter the completion code
Reward: 100 XP
```

For Verified:

```text
Verified stamp
+100 XP earned
Added to Passport
```

### 4.3 Next Milestone Card

Create a reusable component for one immediate personal target.

Examples:

```text
Next Achievement
Nature Restorer
Complete 1 more Restore Nature Quest
2 / 3 verified Quests
Reward: Nature Restorer badge
```

and:

```text
Next Rank
Scout
Reach Level 10
Level 7 / 10
3 levels remaining
```

Use one primary milestone at a time. Do not create a dense list of competing
goals.

### 4.4 Rank Crest

Create one coherent crest family:

```text
Level 1–9: Novice
Level 10–19: Scout
Level 20–29: Adventurer
Level 30–39: Ranger
```

Each crest needs:

- shared family silhouette;
- distinct internal symbol;
- restrained colour progression;
- locked;
- current;
- earned;
- compact leaderboard variant.

Do not use RPG armour, swords, or combat imagery.

### 4.5 Achievement Badge System

Replace emoji achievements with custom badge artwork.

Required states:

- Locked;
- In progress;
- Earned;
- Newly unlocked;
- Featured.

Badge anatomy:

```text
Outer badge shape
Category-colour ring
Central custom symbol
Achievement name
Progress or earned date
```

Do not add Bronze, Silver, and Gold tiers in this MVP.

### 4.6 Community Monthly Challenge

Create a new gameful community goal component.

Example:

```text
Henderson-Massey Community Challenge

Complete 50 verified Quests in July

42 / 50
8 Quests remaining
12 days left

Community reward:
Local Changemakers badge
```

This component must show that users contribute even when they are not in the
Top 10.

The Figma design may label this as an MVP candidate or stretch feature, but it
must be included in the third-iteration design exploration.

### 4.7 Reward Sequence

Create explicit frames or component states:

```text
Frame 1 — Quest verification succeeds
Frame 2 — XP appears and counts up
Frame 3 — Level progress moves
Frame 4 — Achievement badge reveals
Frame 5 — Community Challenge progress updates
Frame 6 — Passport update summary
Frame 7 — Next action
Frame 8 — Reduced Motion alternative
```

Example content:

```text
Quest verified!

+100 XP
Level 7 → Level 8

Achievement unlocked
Nature Restorer

Henderson-Massey progress
42 / 50 verified Quests this month

View Passport
Find another Quest
Create Share Card
```

Motion annotation:

```text
Button press: 120 ms
Card transition: 220 ms
Progress emphasis: 350 ms
Badge reveal: 600–700 ms
Total reward sequence: no more than 900 ms
Skippable
Reduced Motion supported
Sound optional and off by default
```

---

## 5. Page-Level Revision Requirements

### 5.1 Landing Page

The landing page must visually explain that Kiwimpact is gamified.

Include:

- hero composition using a real Quest image;
- visible Player Status Capsule;
- one Achievement Badge;
- one Community Challenge preview;
- one Mission Card;
- a clear game loop:

```text
Discover
→ Join
→ Verify
→ Earn XP
→ Grow your Passport
→ Help your community
```

Do not rely on text-only marketing cards.

### 5.2 Discover

Required:

- image-led Mission Cards;
- `In Henderson-Massey` or the selected local area;
- `Recommended for you`;
- `Good first Quest`;
- `Almost full`;
- visible XP reward;
- category emblem;
- `My Community` filter, with the actual selected area visible;
- no precise geolocation claim.

### 5.3 Quest Detail

Treat the page as a **Quest Briefing**.

Required:

- large hero image;
- category emblem;
- Quest title;
- Organizer;
- coarse local area;
- date and logistics;
- verification method;
- mission steps:

```text
1. Join
2. Attend
3. Verify
4. Earn rewards
```

Add a Reward Panel:

```text
100 XP
Progress toward Nature Restorer
Contribution to Henderson-Massey Challenge
```

Do not claim carbon saved, environmental improvement, or ecological outcomes
unless supported by an accepted methodology.

### 5.4 My Quests

Turn this page into a Mission Board.

Tabs:

```text
Active
Ready to Complete
Awaiting Review
Completed
```

Each card needs an image and current-step information.

Page header should include:

- Player Status Capsule;
- current local rank;
- weekly streak;
- Next Milestone;
- Community Challenge progress.

Use local priority:

```text
#1 Henderson-Massey
```

rather than only Auckland rank.

### 5.5 Passport

The Passport should feel like a player profile, record, and collection.

Required:

- identity header;
- Player Status;
- Rank Crest;
- Home Community badge;
- category progress;
- Next Milestone;
- Achievement collection;
- featured badge;
- image-led or stamp-led completion history;
- long-term participation record;
- Share Card action.

Quest category progress should primarily use verified Quest counts:

```text
Restore Nature
2 / 3 verified Quests
Next: Nature Restorer badge
```

Category XP may appear as supporting data, not the only progress measure.

### 5.6 Leaderboard

Use actual local-area scopes:

```text
Henderson-Massey
Auckland
New Zealand
```

Include:

- Top 3 podium with custom medal/crest artwork;
- current-user highlight;
- Top 10;
- Personal Best;
- rank movement;
- verified XP;
- verified Quest count;
- distance to next position:

```text
You are #8
40 XP to reach #7
```

Use positive language. Do not use shame, demotion anxiety, or failure language.

Also show Community Monthly Challenge or collective community progress.

Create separate design data for:

- a populated local leaderboard;
- a privacy-safe small-community state.

### 5.7 Share Card

Use a meaningful image as a major visual element.

Include:

- Quest or category image;
- Achievement Badge;
- Display Name;
- Quest title;
- date;
- XP earned;
- Rank Title;
- Kiwimpact brand.

Default exclusions:

- no Home Community;
- no exact meeting location;
- no evidence;
- no precise personal location;
- no unsupported environmental-impact number.

### 5.8 Profile and Community Settings

Preserve the manual coarse-grained community selection.

Use:

```text
New Zealand
Auckland
Henderson-Massey
```

Do not request GPS, IP-based detection, a street address, or a residential map
pin.

---

## 6. Icon and Image Calibration Board

Before applying the system to every page, create a Figma page:

```text
01 — Gameful UI Calibration
```

It must include:

1. Fredoka Medium heading scale;
2. Manrope body scale;
3. six new Quest category emblems;
4. XP icon;
5. Level icon;
6. Community icon;
7. Verified icon;
8. Top 1, Top 2, and Top 3 medals;
9. four Achievement Badge examples;
10. four Rank Crests;
11. Player Status Capsule;
12. Available Mission Card with image;
13. Verified Mission Card with image;
14. Next Milestone Card;
15. Community Challenge Card with image;
16. Quest Detail hero image treatment;
17. Reward Sequence states;
18. Light and Dark theme examples;
19. mobile examples;
20. image loading and fallback examples.

Do not merely place the current Lucide icons inside coloured circles. The
calibration board must show a visibly new system.

---

## 7. Micro-Interactions

Annotate these interactions:

| Interaction | Feedback |
|---|---|
| Hover Mission Card | Slight lift; category emblem subtly enlarges |
| Join Quest | Button changes to Joined; confirmation appears |
| XP earned | Number counts up |
| Level progress | Bar moves from old to new value |
| Achievement unlocked | Locked badge becomes full colour |
| Rank changes | Row moves lightly and arrow appears |
| Community Challenge | Count and progress update together |
| Passport completion | Stamp or badge applies |
| Image loading | Skeleton becomes image without layout shift |
| Image error | Category-specific fallback illustration appears |

All interactions must remain understandable without animation.

---

## 8. MSA Gamification Traceability

Make the following elements easy to identify during assessment and video
demonstration:

| Gamification concept | Kiwimpact implementation |
|---|---|
| Points | Verified Completion awards XP |
| Levels | Level progression and Player Status |
| Rank titles | Novice, Scout, Adventurer, Ranger |
| Badges | Custom Achievement Badges |
| Achievements | Goal-based unlocks and collection |
| Streak | Weekly verified Quest streak |
| Leaderboards | Local area, Auckland, New Zealand |
| Progress tracking | Level, category, achievement, community challenge |
| Challenges | Eco Quests and Community Monthly Challenge |
| Reward feedback | XP, Level Up, badge reveal, community update |
| Player identity | Passport, Rank Crest, badges, community identity |
| Sharing | Image-led achievement Share Card |

Do not add decorative game elements that have no relationship to a product
rule, user action, or visible progress state.

---

## 9. Explicit Exclusions

Do not add:

- virtual currency;
- diamonds;
- coins;
- Wallet;
- Shop;
- purchase prices;
- loot boxes;
- equipment;
- pets;
- boss battles;
- combat language;
- public social feed;
- public Karma or voting;
- GPS-based Home Community detection;
- precise residential location;
- daily-streak punishment;
- public evidence;
- unsupported carbon-saved or environmental-progress claims;
- Fredoka Bold or ExtraBold;
- emoji as final Achievement or Quest Category artwork;
- large text-only Quest or feature cards;
- generic repeated placeholder images.

---

## 10. Required Figma Output

Create:

- desktop frames at 1440 px;
- mobile frames at 390 px;
- Light and Dark variables;
- Auto Layout;
- reusable components and variants;
- Fredoka Medium and Manrope text styles;
- gameful icon components;
- image components with ratios, loading, and fallback variants;
- Mission Card variants;
- Player Status variants;
- Achievement Badge variants;
- Rank Crest variants;
- Community Challenge variants;
- leaderboard geographic and time variants;
- populated and small-community leaderboard states;
- reward-sequence frames;
- reduced-motion state;
- image-source page.

Keep the output feasible for React, TypeScript, Tailwind CSS, component-based
implementation, responsive layouts, and accessible interaction.

---

## 11. Direct Figma AI Instruction

Use the following instruction as the generation request:

---

Revise the existing Kiwimpact second-pass MVP into a clearly more gameful third
iteration. Preserve the accepted page structure, bright eco palette, flat
design, rounded geometry, soft shadows, responsive layouts, XP system,
Passport, community selection, and leaderboard features. Do not rebuild the
product from scratch.

The current design contains many gamification features, but they still feel
like separate dashboard modules. Create one coherent loop: discover a Quest,
join it, get verified, earn XP, advance personal progress, contribute to a
local community goal, update the Passport, and choose the next Quest.

Non-negotiable requirements:

1. Use Fredoka Medium 500 only for display headings, Quest titles,
   Achievement titles, and reward headings. Remove Fredoka Bold and ExtraBold.
   Keep Manrope for body text, controls, labels, and numerical data.

2. Every major user-facing content card must include meaningful visual media.
   Use a photo, illustration, badge artwork, avatar, crest, or category visual.
   Do not create large text-only content cards. All Quest Cards must include
   activity-specific images. Quest Detail must have a large responsive hero
   image. Use suitable royalty-free temporary stock imagery and create a
   separate Image Sources page recording the source, creator, URL, access date,
   licence note, and usage location.

3. Use the actual local-area leaderboard name:
   Henderson-Massey | Auckland | New Zealand.
   The local area must be the default selected scope. Do not replace it with
   only “My Community”. Also create a Devonport-Takapuna example and a separate
   small-community privacy-safe state.

4. Replace formal game-related Lucide icons and emoji with a custom rounded
   filled or duotone flat system for Quest categories, XP, Level, Rank,
   Community, Achievements, Verified Completion, medals, and rewards. Use two
   or three colour layers, soft silhouettes, minimal detail, and badge,
   sticker, stamp, or patch character. Keep Lucide only for functional
   controls.

5. Create a persistent Player Status Capsule showing Avatar or Level Crest,
   Display Name, Level, Rank Title, current XP, next-level XP, and progress.

6. Transform Quest Cards into image-led Mission Cards with category emblem,
   title, coarse area, schedule, difficulty shield with text, XP reward,
   capacity, state, current step, next step, and primary action. Create
   Available, Joined, Ready to Complete, Awaiting Verification, Verified,
   Self-reported, Full, and Expired variants.

7. Add a reusable Next Milestone Card for the next Achievement or Rank.

8. Replace emoji achievements with custom Badge components in Locked,
   In-progress, Earned, Newly Unlocked, and Featured states.

9. Create Rank Crests for Novice, Scout, Adventurer, and Ranger.

10. Add a Henderson-Massey Community Monthly Challenge:
    Complete 50 verified Quests in July; 42/50 complete; 8 remaining; 12 days
    left; community badge reward.

11. Extend the reward sequence:
    Quest verified → +100 XP → level progress → Achievement unlocked →
    Henderson-Massey community progress → Passport updated → next action.
    Provide skippable motion and a Reduced Motion state.

12. Make My Quests a Mission Board, Passport a player profile and collection,
    Quest Detail a Quest Briefing, Leaderboard a local-to-national competitive
    and cooperative page, and Share Card an image-led achievement output.

13. Use verified Quest counts as the primary Quest Category progress measure.
    Category XP may remain secondary.

14. Add image loading skeletons, responsive crops, descriptive alt-text notes,
    and category-specific fallback illustrations.

First create the “01 — Gameful UI Calibration” page containing typography,
gameful icons, category emblems, badges, Rank Crests, Player Status, Mission
Cards with images, Next Milestone, Community Challenge, Quest Detail hero,
Reward Sequence, Light/Dark, mobile, loading, and fallback examples. The new
system must be visibly different from the current design and must not merely
place the existing Lucide icons inside coloured circles.

After the calibration system is complete, apply it consistently to Landing,
Discover, Quest Detail, My Quests, Passport, Leaderboard, Share Card, and
Profile Settings on desktop 1440 px and mobile 390 px.

Do not add virtual currency, Shop, Wallet, prices, loot boxes, pets, equipment,
bosses, social feed, precise home location, GPS-based community detection,
daily-streak punishment, unsupported environmental-impact claims, Fredoka
Bold/ExtraBold, emoji as final game artwork, or large text-only content cards.

---

## 12. Human Review Checklist

The third iteration is not accepted until all answers are yes.

- [ ] All Fredoka display styles use Medium 500.
- [ ] No Fredoka Bold or ExtraBold remains.
- [ ] Every major content card includes image, illustration, badge, avatar,
      crest, or other meaningful visual media.
- [ ] Every Quest Card includes a relevant activity image.
- [ ] Quest Detail includes a responsive hero image.
- [ ] An Image Sources page records third-party image information.
- [ ] Game-related icons are visibly different from ordinary Lucide icons.
- [ ] No emoji remains as final Achievement or Category artwork.
- [ ] Player Status is visible across the core Member journey.
- [ ] Mission Card states are fully designed.
- [ ] Next Milestone is visible.
- [ ] Achievement Badges look collectible.
- [ ] Rank Titles have recognisable Crests.
- [ ] Henderson-Massey is visible as the first leaderboard scope.
- [ ] A populated local leaderboard is shown.
- [ ] A separate small-community state is shown.
- [ ] Community Monthly Challenge is visible.
- [ ] Reward feedback includes community contribution.
- [ ] Passport feels like identity and collection, not only statistics.
- [ ] My Quests feels like a Mission Board.
- [ ] Share Card is image-led and privacy-safe.
- [ ] Reduced Motion and image fallback states exist.
- [ ] No excluded virtual-economy or social feature was added.
