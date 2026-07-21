# 08 — Figma AI Third-Iteration Revision Notes

- **Project:** Kiwimpact
- **Document type:** Revision notes and direct instruction for the next Figma AI pass
- **Version:** 3.1
- **Date:** 2026-07-21
- **Status:** Ready for Figma AI use
- **Recommended repository path:** `/specs/ai/prompts/08-figma-ai-third-iteration-revision-notes.md`
- **Input:** Existing Kiwimpact latest Figma/React prototype
- **Purpose:** Refine the third iteration based on detailed human review, clarify ambiguous gamification logic, and correct specific UI, UX, and content issues

> This document is a design-revision instruction. It does not prove implementation.

---

## 1. Overall Revision Goal

Preserve the current progress. The product already contains many correct
gamification elements, including XP, Level, Achievements, Streak, Passport,
Community Selection, Leaderboards, Community Progress, and Share Card
functionality.

The next revision must **not** add many new systems. Instead, it must improve:

1. clarity of the personal progression loop;
2. clarity of the community progression loop;
3. consistency of card visuals and badge styling;
4. stronger action-oriented page flow;
5. visibility of final outputs such as Share Card preview;
6. image quality and image coverage across the product.

The design should feel more gameful, but still appropriate for an all-age
environmental action platform. Do not turn it into a video game, quiz app, or
hardcore RPG.

---

## 2. Global Visual Corrections

### 2.1 Typography

Continue using:

- **Fredoka Medium 500 only** for display headings, section headings, Quest
  titles, Achievement titles, and reward headings.
- **Do not use Fredoka Bold or ExtraBold.**
- Continue using **Manrope** for body text, labels, buttons, tabs, helper text,
  and numerical data.

### 2.2 Badge border styling

The current badge form is acceptable, but the border rendering is not.

Use this exact badge styling rule:

- **light background**
- **single 1 px solid border**
- **no transparent split effect**
- **no half-transparent / half-white border treatment**
- preserve the current badge shape and overall badge format

Apply this consistently across:

- Landing page cards
- Discover cards
- Quest cards
- Category badges
- reward-related badges
- any repeated card-top badge treatment

### 2.3 Card images must remain mandatory

Keep the image-first card direction.

Every major user-facing content card must continue to include meaningful visual
media such as:

- photography;
- illustration;
- category artwork;
- achievement badge art;
- avatar;
- crest;
- Quest thumbnail;
- hero image.

Do not revert to large text-only cards.

---

## 3. Landing Page Revisions

### 3.1 Hero layout

In the hero area under the top navigation, restore the **map** on the right
side instead of showing a Quest card.

Required behaviour:

- the map remains visible in the hero;
- clicking the map opens the **Discover page in map mode**;
- the hero should help users understand that Kiwimpact connects local action to
  real places.

This map is more appropriate than a single Quest card in the hero because it
supports local discovery and aligns with the Discover experience.

### 3.2 Hero structure when the user already joined a Quest

If the user already has joined Quests, the hero should shift from pure
introduction to action guidance.

Required change:

- do not show `Join free` if the current user has already joined a relevant
  Quest;
- replace it with a state-aware action such as:
  - `Continue Quest`
  - `View My Quests`
  - `Complete Quest`
  - `Resume Progress`

Recommended layout direction:

- top: heading and supporting text
- below: full-width map

This means the hero can become a stacked structure:

```text
Heading + action guidance
Full-width interactive map
```

If helpful, revise the heading and supporting text so the message feels less
like a general marketing statement and more like progress guidance.

### 3.3 Personal path vs community goal

The current `Community Goal` area is conceptually unclear. It feels like a
community task, but it actually behaves more like a personal guidance path.

This must be separated clearly.

#### Required split

Create two distinct concepts:

1. **Personal Progress / Your Next Steps**
2. **Community Challenge**

#### Personal Progress block

This block should show:

- current Quest;
- next Quest;
- current Achievement;
- next Achievement;
- a visible arrow or directional flow from current to next.

The purpose is to guide the individual user.

Example direction:

```text
Current Achievement → Next Achievement
Current Quest → Next Quest
```

This block should link to **My Quests**.

#### Community Challenge block

This block should separately represent the local shared goal.

It should not be confused with the personal path.

This block may link to:

- Leaderboard; or
- a challenge detail state; or
- the relevant Community Challenge area in My Quests.

---

## 4. Discover Page Revisions

### 4.1 Badge border consistency

Apply the same badge rule described above:

- light background
- single 1 px solid border
- no transparent split effect

### 4.2 Map View layout

Change Map View to a vertical structure.

Required layout:

- top: map, width 100%
- bottom: Quest list

This is preferred over the current side-by-side style because it gives the map
more visual impact and creates a clearer place-to-task relationship.

Required behaviour:

- map and list remain connected;
- selecting or hovering a marker should help identify the related Quest card;
- filters remain accessible without making the layout cramped.

---

## 5. Quest Detail Page Revisions

### 5.1 Hero image

The added cover image is correct. Keep it.

### 5.2 Additional content images

The body content should also include a small image gallery or image carousel.

Required direction:

- keep the large hero image at the top;
- add additional images inside the content area;
- allow left/right navigation for the gallery;
- support mobile-friendly swiping or carousel behaviour.

The page should still remain a **Quest Briefing**, not a tourism gallery. The
images are there to improve realism, trust, and atmosphere, not to replace the
Quest information structure.

---

## 6. My Quests Revisions

### 6.1 Level interaction

When the user clicks the Level display, show a Level and Rank overview state.

This can be a modal, sheet, or dedicated detail panel.

It should include:

- current Level;
- current Rank Title;
- a list or ladder of level ranges;
- which Rank the player is currently in;
- what the next Rank is;
- how much progress remains to reach the next stage.

This change helps turn Level from a simple number into an understandable growth
system.

### 6.2 Week streak tooltip

When hovering over or focusing on the Week Streak element, show a tooltip or
explanatory helper.

Required explanation should clarify:

- how to continue the streak;
- that verified completions are required;
- that self-reported completions do not count;
- what happens when a week is missed.

Example guidance:

> Complete at least 1 verified Quest each week to keep your streak active.

### 6.3 Community Challenge clarity

The Community Challenge is still unclear in entry point, rules, and reward.

This must be improved.

Required content must explain:

- what the community challenge is;
- how to contribute;
- what counts toward it;
- where the progress comes from;
- what happens when the challenge is completed.

Example explanation:

> Any verified Quest completed in Henderson-Massey during July automatically
> counts toward the community goal.

Example reward explanation:

> When the community goal is reached, all contributing members unlock the Local
> Changemakers badge.

The Challenge needs a clearer entry point, such as:

- `View challenge details`

This should not be left as an unexplained summary card.

---

## 7. Passport Revisions

### 7.1 Community Challenge should not be mixed into Completion History

The Passport currently risks mixing community challenge records with personal
Quest completion history.

This must be separated.

#### Completion History

This section should track:

- personal Quest completions;
- date;
- verification status;
- XP earned;
- category or Quest thumbnail.

#### Community Participation / Challenge Participation

This section should separately track:

- contribution to community challenges;
- challenge completion;
- community badge unlocked;
- challenge-related recognition.

Do not treat a Community Challenge itself as if it were a normal Quest
completion record.

---

## 8. Leaderboard Revisions

### 8.1 Add community-to-community comparison

The current leaderboard covers person-to-person comparison across local area,
Auckland, and New Zealand. That is useful and should remain.

Add a separate comparison mode for **communities**.

Recommended tab structure:

- **People**
- **Communities**

#### People
Used for personal ranking:
- Henderson-Massey
- Auckland
- New Zealand

#### Communities
Used for area-to-area comparison.

Use aggregated metrics such as:

- verified Quests completed;
- active contributors;
- average verified Quests per active member;
- completion rate or another fair aggregate metric.

Do not rely only on raw totals if that makes larger communities dominate
without context.

This community comparison must remain clearly separate from the personal
leaderboard.

---

## 9. Share Card Builder Revisions

### 9.1 Final output visibility

The current Share Card Builder does not make the final result clear enough.

Required improvement:

- show a prominent live preview;
- make the final card output clearly visible while editing;
- allow the user to understand what the final exported card will look like;
- keep the builder privacy-safe.

A builder without a clear final preview feels incomplete, even if the controls
exist.

---

## 10. Community Selection and Community Goal Logic

### 10.1 Where to choose the community

Community selection should have one clear primary control point:

- **Profile Settings → Community**

This is where the user changes their Home Community.

### 10.2 Viewing a community is not the same as changing a community

The product must distinguish between:

- **changing the user’s Home Community**
- **viewing a leaderboard scope or community comparison**

Leaderboard scope browsing does not mean the user has changed their own
community identity.

### 10.3 Community Challenge should not own community selection

The Community Challenge area should not be responsible for letting users choose
their Home Community.

Instead:

- Profile Settings changes community identity;
- My Quests / Passport / Leaderboard shows the current community challenge;
- Leaderboard can let users compare other communities.

This separation will make the system much easier to understand.

---

## 11. Neutral Product Assessment

The current design already includes enough gamification features for the MSA
theme. The product clearly contains:

- XP;
- Level;
- Rank;
- Achievements;
- Streak;
- Leaderboards;
- Progress tracking;
- Passport;
- Share Card;
- Community challenge or community progress.

From an MSA assessment perspective, this is already strong enough.

However, the design still feels as though it is “missing something” because
there are still gaps in:

1. short-term personal guidance;
2. separation between personal and community progression;
3. state-driven action labels;
4. clarity of challenge rules and outputs.

The next revision should therefore focus on **clarity and cohesion**, not on
adding many more mechanics.

Do not add new large systems such as:

- virtual currency;
- shop;
- pets;
- equipment;
- bosses;
- combat-style systems;
- social feed.

Instead, refine the current systems so the user always understands:

- what they are doing now;
- what they should do next;
- what they will get for doing it;
- how it helps their community.

---

## 12. Priority Revision List

### P0 — Required

1. Restore the Landing page hero map and make it open Discover map mode.
2. Keep images on all major cards and Quest Detail.
3. Fix badge border styling using the approved rule:
   - light background
   - single 1 px solid border
   - no transparent split effect
4. Separate Personal Progress from Community Challenge on the Landing page.
5. Replace `Join free` with state-aware actions when the user has already
   joined a Quest.
6. Change Discover Map View to a vertical layout with map on top and list below.
7. Add a Quest Detail image carousel / gallery.
8. Add Level detail interaction in My Quests.
9. Add Week Streak tooltip guidance.
10. Clarify Community Challenge rules, entry point, contribution logic, and
    reward.
11. Separate Community Challenge records from Completion History in Passport.
12. Add a `People / Communities` split in the Leaderboard.
13. Add a visible live preview in Share Card Builder.
14. Keep community selection clearly in Profile Settings.

### P1 — Strongly Recommended

1. Use more action-oriented CTA labels based on Quest state.
2. Improve personal next-step guidance.
3. Improve community challenge detail visibility.
4. Use clearer challenge-detail links.
5. Ensure all map/list and preview interactions remain responsive on mobile.

---

## 13. Direct Figma AI Instruction

Use the following instruction for the next pass:

---

Revise the current Kiwimpact design based on the latest human review. Preserve
the existing progress, including XP, Level, Achievements, Streak, Passport,
community selection, geographic leaderboards, community progress, image-led
cards, and Share Card functionality. Do not rebuild the product from scratch.

The next revision must improve clarity, cohesion, and page-level task flow. Do
not add many new systems. Focus on making the existing gamification structure
more understandable and better separated.

Apply these required changes:

1. Continue using Fredoka Medium 500 only for display headings. Do not use
   Fredoka Bold or ExtraBold.

2. Keep images on all major user-facing cards and Quest Detail. Do not create
   large text-only content cards.

3. Fix the badge border treatment. Preserve the current badge shape and overall
   badge form, but use:
   - a light background
   - a single 1 px solid border
   - no transparent split effect
   - no half-transparent / half-white border

4. On the Landing page, restore the map in the hero area under the top
   navigation. Replace the current Quest-card hero treatment with a map on the
   right or, if needed for the joined-user state, a stacked layout with text on
   top and a full-width map below. Clicking the map should open the Discover
   page in map mode.

5. If the user has already joined a relevant Quest, do not show `Join free`.
   Replace it with a state-aware action such as `Continue Quest`, `View My
   Quests`, `Complete Quest`, or `Resume Progress`.

6. On the Landing page, separate the current mixed `Community Goal` concept
   into:
   - a **Personal Progress / Your Next Steps** block showing current and next
     Quest or Achievement with a visible arrow from current to next, linking to
     My Quests;
   - a separate **Community Challenge** block for the local shared goal.

7. On the Discover page, change Map View to a vertical layout:
   - map on top, width 100%;
   - Quest list below.

8. On Quest Detail, keep the large hero image and add additional content images
   in a small carousel or gallery with left/right navigation.

9. In My Quests, clicking the Level display should open a Level and Rank detail
   state showing the current Level, Rank, level ladder or ranges, next Rank,
   and progress remaining.

10. In My Quests, hovering or focusing on the Week Streak should show a tooltip
    explaining how to continue the streak and that only verified completions
    count.

11. Clarify the Community Challenge. Explain:
    - what it is;
    - how a user contributes;
    - what counts;
    - where the progress comes from;
    - what happens when the challenge is completed.
    Add a clear entry point such as `View challenge details`.

12. In Passport, do not mix Community Challenge records into Completion
    History. Keep personal Quest completions in Completion History and put
    community challenge participation in a separate section.

13. In Leaderboard, add a separate comparison mode for communities. Use tabs:
    - People
    - Communities

14. In Share Card Builder, make the final output clearly visible through a
    strong live preview.

15. Keep community selection logic clear:
    - Home Community is chosen and changed in Profile Settings;
    - viewing a leaderboard scope is not the same as changing Home Community;
    - the Community Challenge does not control Home Community selection.

16. Do not add new major systems such as Shop, Wallet, currency, pets,
    equipment, bosses, or a social feed.

The design should feel more coherent and more clearly task-driven, but still
appropriate for a real-world environmental action platform and an all-age
audience.

---

## 14. Human Review Checklist

The revision is not accepted until all answers are yes.

- [Y] Fredoka uses Medium 500 only for display text.
- [Y] Badge borders use the approved treatment:
      light background, single 1 px solid border, no transparent split effect.
- [Y] Images remain on all major cards.
- [Y] Landing hero uses the map again.
- [Y] Clicking the map opens Discover map mode.
- [Y] Joined users do not see `Join free`.
- [Y] Personal Progress and Community Challenge are clearly separated.
- [Y] Discover Map View uses a top map and bottom list layout.
- [Y] Quest Detail has a gallery or carousel in addition to the hero image.
- [Y] Level interaction opens a useful level/rank explanation state.
- [Y] Week Streak shows clear tooltip guidance.
- [Y] Community Challenge rules and reward are understandable.
- [Y] Community Challenge has a clear entry point.
- [Y] Passport separates Completion History from Community Challenge history.
- [Y] Leaderboard includes both People and Communities comparison.
- [Y] Share Card Builder shows a strong live preview.
- [Y] Community selection logic is clear and not mixed into challenge flow.
- [Y] No unnecessary new systems were added.
