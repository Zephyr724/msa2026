# Kiwimpact — Figma AI MVP UI Design Brief

- **Document status:** First-pass UI generation brief (historical)
- **Version:** 1.0
- **Date:** 2026-07-19
- **Product:** Kiwimpact
- **Tagline:** Community eco quests across New Zealand
- **Recommended repository path:** `/specs/ux/02-figma-ai-mvp-ui-generation-spec.md`
- **Purpose:** Generate the first editable, high-fidelity MVP interface in Figma before implementation.
- **Status**: Accepted
- **Community extension:** `specs/ux/04-community-identity-leaderboard-and-selector.md` adds community-scoped leaderboards, a community selector, and updated Passport design. This first-pass spec is preserved as a historical prompt artifact and should not be rewritten.

> This brief is for visual exploration and product review. It must not be treated as proof that the application has already been implemented. Human-approved Figma designs and written specifications will become the source of truth for implementation.

---

## 1. Instructions for Figma AI

Create a cohesive, responsive web application UI for **Kiwimpact**, an Auckland-first gamified environmental participation platform for Aotearoa New Zealand.

Generate editable Figma frames, reusable components, variants, variables, and Auto Layout structures. Do not generate a generic corporate dashboard. The product should feel like a friendly eco-adventure: energetic, optimistic, rounded, gameful, and accessible, but not childish.

Use the page specifications and generation batches in this document. Start with **Batch 1** only. After human review, generate Batch 2 and Batch 3 using the same design system.

### Required design output

- Desktop frames: **1440 px wide**.
- Mobile frames: **390 px wide**.
- Use a **12-column desktop grid** and a **4-column mobile grid**.
- Main desktop content width: approximately **1200 px**.
- Use Figma Variables for light and dark themes.
- Use Auto Layout for all cards, navigation, forms, lists, dialogs, and page sections.
- Create reusable components and variants before duplicating page sections.
- Use realistic fictional content rather than lorem ipsum.
- Generate both normal content and important states: loading, empty, validation error, server error, forbidden, and not found.
- Keep every page feasible for a React, TypeScript, Tailwind CSS, and daisyUI implementation.

---

## 2. Product Definition

Kiwimpact helps people discover selected community eco activities, understand how to participate, complete or verify them, earn XP and progression rewards, record achievements in a **Personal Impact Passport**, and create a shareable achievement card.

### Core product loop

**Discover → Understand → Join → Complete → Verify → Earn → Record → Share → Continue**

### MVP positioning

- Auckland-first, with the visual system able to expand across New Zealand.
- A complete full-stack product, not a static event directory.
- The gamification layer must be visible and meaningful throughout the user journey.
- Do not claim measured carbon savings or environmental impact values without a validated methodology.

### Main user roles

- **Guest:** browse quests, filter, use the map, view details and leaderboard, open official external event links.
- **Member:** join or cancel quests, submit completion, earn XP, view Passport, and create a share card.
- **Organizer:** manage owned quests, participants, capacity, completion codes, and quest status.
- **Admin:** manage all quests, curated external quests, completion claims, source freshness, and roles where needed.

Do not design a public Organizer application or approval workflow in the MVP.

---

## 3. Visual Direction

### Design personality

The visual identity should communicate:

- local environmental action;
- progress and adventure;
- trust and verification;
- positive community participation;
- modern New Zealand character without using stereotypes.

Use rounded game-like Quest Cards, friendly illustrations, clear progress meters, compact achievement badges, and subtle topographic or native-leaf-inspired background shapes.

Avoid decorative use of Māori cultural symbols unless they have been specifically reviewed and approved. Do not imitate Discord, Kahoot, Duolingo, or another product directly.

### Typography

Use **Manrope** as the primary UI typeface.

- Display: 48/56, weight 800
- H1: 36/44, weight 800
- H2: 28/36, weight 750–800
- H3: 22/30, weight 700
- Body large: 18/28, weight 400–500
- Body: 16/24, weight 400–500
- Small: 14/20, weight 500
- Label: 12/16, weight 700, limited uppercase use

Typography should remain readable and professional. Do not make headings excessively cartoon-like.

### Light theme variables

- `color-primary`: `#2F8F5B`
- `color-secondary`: `#6C63D9`
- `color-accent`: `#F4B740`
- `color-background`: `#F8FBF4`
- `color-content`: `#183026`
- `color-surface`: `#FFFFFF`
- `color-surface-subtle`: `#EEF5EC`
- `color-border`: `#D5E3D7`
- `color-success`: `#2F8F5B`
- `color-warning`: `#B87512`
- `color-error`: `#C74444`
- `color-info`: `#3C72C9`

### Dark theme variables

- `color-primary`: `#6FD69A`
- `color-secondary`: `#AAA1F5`
- `color-accent`: `#FFD166`
- `color-background`: `#13211B`
- `color-content`: `#F2F7F3`
- `color-surface`: `#1B2C24`
- `color-surface-subtle`: `#22372D`
- `color-border`: `#365144`
- `color-success`: `#6FD69A`
- `color-warning`: `#FFD166`
- `color-error`: `#FF8B8B`
- `color-info`: `#8DB7FF`

Ensure normal text and interactive controls meet WCAG AA contrast.

### Geometry and spacing

- Button and input radius: **14 px**
- Card radius: **20 px**
- Modal and drawer radius: **24 px**
- Badges and filter chips: pill shape
- Spacing scale: **4, 8, 12, 16, 24, 32, 48 px**
- Minimum touch target: **44 × 44 px**
- Use soft shadows sparingly; rely mainly on spacing, borders, and surface contrast.

### Iconography and illustration

- Use Lucide-style line icons for functional controls.
- Use simple friendly eco-adventure illustrations for empty states and the landing page.
- Use temporary abstract illustrations rather than real third-party event photography or logos.
- Category illustrations should be visually distinct but use one consistent style.

### Motion notes for prototype states

- Fast interaction: 120 ms
- Standard transition: 220 ms
- Emphasis: 350 ms
- Reward sequence: 600–900 ms
- Reward motion must be skippable.
- Provide a reduced-motion alternative.
- Sound is optional and off by default.
- Do not include background music.

---

## 4. Information Architecture and Navigation

### Guest desktop navigation

- Kiwimpact logo
- Discover
- Leaderboard
- How it works anchor on landing page
- Theme toggle
- Sign in
- Primary button: **Join Kiwimpact**

### Member desktop navigation

- Kiwimpact logo
- Discover
- My Quests
- Passport
- Leaderboard
- Compact XP/level indicator
- Theme toggle
- Avatar menu

### Organizer/Admin navigation

Add a role-aware **Manage** destination without removing the Member navigation.

- Organizer: My Quests Management, Participants
- Admin: Overview, All Quests, Claims, External Sources, Users/Roles

### Mobile navigation

Use a bottom navigation bar for signed-in Members:

- Discover
- My Quests
- Passport
- Leaderboard

Use a compact top bar with the Kiwimpact mark, theme toggle, and avatar. Organizer/Admin management pages may use a slide-over menu or a compact secondary navigation.

---

## 5. Generation Plan

### Batch 1 — Generate first

Create desktop and mobile versions of the primary public and Member journey:

1. Landing page
2. Discover Quests
3. Quest Detail
4. Member Dashboard / My Quests
5. Completion flow states
6. Personal Impact Passport
7. Leaderboard
8. Share Card Builder

### Batch 2 — Generate after Batch 1 review

1. Sign in
2. Create account
3. Email confirmation and resend state
4. Forgot password
5. Reset password
6. Account settings and change password
7. Reward celebration overlays
8. Loading, empty, error, forbidden, and not-found templates

### Batch 3 — Generate after Member flow review

1. Organizer quest list
2. Organizer create/edit quest form
3. Organizer participants and completion-code view
4. Admin overview
5. Admin completion-claim review queue and detail
6. Admin curated external-quest form
7. Admin external-source freshness queue

---

## 6. Batch 1 Page Specifications

## 6.1 Landing Page

### Objective

Explain Kiwimpact within five seconds and encourage visitors to explore quests or create an account.

### Desktop structure

1. **Header navigation**
2. **Hero section**
   - Eyebrow: `Auckland-first eco adventures`
   - H1: `Turn local action into lasting progress.`
   - Supporting text: `Discover community eco quests, verify what you complete, earn XP, and build your Personal Impact Passport.`
   - Primary CTA: `Explore quests`
   - Secondary CTA: `Join Kiwimpact`
   - Visual: a stylised Auckland-region quest map combined with a Level/XP card and three small quest markers
3. **Featured quests**
   - Three Quest Cards from different categories
4. **How it works**
   - Discover
   - Join
   - Complete and verify
   - Earn and record
5. **Progress preview**
   - Level, rank, weekly streak, achievement badges, and Passport timeline preview
6. **Trust section**
   - Explain that external event registration remains on the official provider website
   - Explain that only verified completions earn XP
7. **Final CTA**
8. **Footer**

### Mobile adaptation

- Stack hero copy above the visual.
- Use full-width CTAs.
- Display featured quests as a horizontal snap carousel.
- Keep progress preview compact and avoid dense dashboard layouts.

---

## 6.2 Discover Quests

### Objective

Help Guests and Members quickly find relevant activities without hiding the map or overwhelming them with filters.

### Desktop layout

- Page heading: `Discover eco quests`
- Supporting line: `Find practical ways to help around Auckland.`
- Search input
- Filter button with active-filter count
- Category chip row
- Sort control: Soonest, Recommended, XP, Difficulty
- View toggle: Cards / Map
- Result count

### Cards view

Use a responsive three-column grid at large desktop widths. Each Quest Card includes:

- category icon and category name;
- quest title;
- fictional organiser name;
- date and time or `Any time`;
- general location, never precise private GPS;
- difficulty: Easy, Medium, or Hard;
- XP reward: 50, 100, or 150;
- registration/source label;
- verification label;
- capacity indicator when applicable;
- primary action: `View quest`.

Quest source labels:

- `Official external event`
- `Organizer quest`
- `Kiwimpact challenge`

Verification labels:

- `Completion code`
- `Evidence reviewed`
- `Self reported · No XP`

### Map view

Use a split layout:

- Left: scrollable result list
- Right: Google-style map placeholder with markers
- Clicking a marker opens a compact Quest Summary Card with `View details`
- Include `Fit results` control
- Include a full list fallback

Do not include directions, traffic, Street View, route planning, distance matrices, or continuous user geolocation.

### Filter drawer or modal

Include:

- category;
- date range;
- difficulty;
- registration type;
- verification type;
- availability;
- `Clear all` and `Show results`.

### Mobile adaptation

- Search and filter controls remain sticky below the top bar.
- Use a segmented control for List / Map.
- Map markers open a bottom sheet.
- Filter controls use a full-height bottom sheet.

---

## 6.3 Quest Detail

### Objective

Give enough trusted information for a user to understand the activity, registration method, verification method, and reward before acting.

### Desktop structure

1. Breadcrumbs
2. Quest header
   - category
   - title
   - organiser/source
   - status label
3. Main two-column layout
   - Left: summary, what to expect, date/time, location, eligibility, duration, capacity, verification instructions
   - Right: sticky action card
4. Map section
5. Official source notice where relevant
6. Related quests

### Sticky action card

Include:

- difficulty;
- XP reward;
- verification method;
- capacity or availability;
- primary CTA based on registration mode;
- save/bookmark is not required for MVP and should not be added.

CTA variants:

- Native registration: `Join quest`
- External registration: `View official event`
- No registration required: `Start challenge`
- Guest attempting Member action: `Sign in to join`

For curated external quests, visibly show:

- `Registration is managed by the original event provider.`
- `The official source is authoritative.`
- `Last checked: [date]`

### Joined Member state

After joining, replace the action area with:

- `You joined this quest`
- Add-to-calendar secondary action
- `Cancel participation`
- Completion instructions
- Button enabled at the appropriate stage: `Complete quest`

### Mobile adaptation

- Use one-column content.
- Place a sticky bottom action bar above the browser safe area.
- Keep XP and verification visible near the title.

---

## 6.4 Member Dashboard / My Quests

### Objective

Show the Member's current progress and the next useful action without turning the page into a generic analytics dashboard.

### Desktop structure

1. **Player progress header**
   - Display name
   - Level number
   - Rank title
   - current XP and XP needed for next level
   - progress bar
   - weekly streak
2. **Next action card**
   - upcoming quest, pending completion, or claim requiring attention
3. **My quests tabs**
   - Upcoming
   - Awaiting completion
   - Under review
   - Completed
4. **Recent rewards**
   - achievements and recent XP entries
5. **Passport preview**
6. **Leaderboard position preview**

### Example player data

- Display name: `Mia K.`
- Level: `7`
- Rank: `Novice`
- XP: `420 / 525 XP`
- Weekly streak: `3 weeks`
- Leaderboard position: `#18 this week`

### Quest status cards

Use clear action labels:

- `View details`
- `Enter completion code`
- `Submit completion claim`
- `View claim`
- `Create share card`

Use status chips, not colour alone:

- Joined
- Completion available
- Pending review
- Verified
- Rejected
- Self reported

### Mobile adaptation

- Use a compact player header.
- Show the Next Action card immediately after the header.
- Convert tabs to horizontally scrollable pills.
- Stack quest cards vertically.

---

## 6.5 Completion Flow States

Design these as reusable dialogs on desktop and bottom sheets or full-screen sheets on mobile.

### A. Choose completion method

Show the valid method for the quest rather than letting users select an invalid method.

Options that may appear:

- Enter completion code
- Submit completion claim
- Add self-reported completion

Clearly explain:

- verified methods can earn XP;
- self-reported completion appears in the Passport but earns no XP, streak, achievement, or leaderboard credit.

### B. Completion code

Fields:

- six-character or short code input;
- submit button;
- inline validation;
- loading state;
- invalid/expired code state;
- success state.

### C. Evidence-reviewed claim

Fields:

- Participation date
- Description, approximately 500 characters maximum
- Optional HTTPS evidence link
- Required declaration checkbox
- Submit claim

Privacy notice:

`Your evidence is visible only to you and authorised reviewers. It is never shown on the leaderboard or share card.`

States:

- Draft form
- Validation errors
- Submitted / pending review
- Rejected with a short reason and resubmit action where allowed
- Approved
- Withdraw claim confirmation

Do not show evidence previews fetched from external URLs.

### D. Self-reported completion

Use a calm informational style, not a punishment style. Show `Passport only · No XP` prominently.

---

## 6.6 Reward Celebration

Create a reusable full-screen overlay or modal state that can be opened after verified completion.

Sequence concept:

1. `Quest completed!`
2. Small stars or particles move toward the XP meter
3. XP increases
4. Progress bar fills
5. Optional Level Up reveal
6. Optional Rank Up reveal at a ten-level boundary
7. Optional Achievement reveal
8. Actions: `View Passport`, `Create share card`, `Continue`

Provide three variants:

- Standard verified completion
- Level Up
- Rank Up plus achievement

Include `Skip animation`. Provide a reduced-motion version with fades and immediate value changes.

---

## 6.7 Personal Impact Passport

### Objective

Create a long-term personal record of participation without making public impact claims that the system cannot validate.

### Desktop structure

1. Profile summary
   - avatar or initials
   - display name
   - Level and rank
   - verified quests count
   - weekly streak
2. XP progress
3. Achievement collection
4. Completion timeline
5. Filters
   - All
   - Verified
   - Self reported
   - category
6. Share-card entry point

### Passport timeline item

Include:

- quest title;
- category;
- completion date;
- verification label;
- XP received or `No XP`;
- optional achievement earned;
- `Create share card` for verified completions.

Do not include evidence, claim text, review notes, email, user ID, or precise GPS.

### Achievement area

Design 6–8 fixed achievement slots with locked, in-progress, and earned states. Use fictional first-pass examples:

- First Step
- Local Helper
- Nature Restorer
- Wildlife Ally
- Waste Warrior
- Citizen Observer
- Five-Quest Streak
- Auckland Pathfinder

These names are visual placeholders and require later product approval.

### Mobile adaptation

- Keep the profile summary compact.
- Use a two-column badge grid.
- Use a vertical timeline.

---

## 6.8 Leaderboard

### Objective

Show friendly competition while keeping the page readable and allowing the current user to understand their position.

### Structure

- Page heading: `Leaderboard`
- Supporting text: `Verified eco quests completed by the Kiwimpact community.`
- Time tabs:
  - Weekly
  - Monthly
  - All time
- Live status indicator: `Live updates`
- Top-three podium or cards
- Ranked table from position 4 onward
- Current user row pinned or highlighted when outside the visible range

### Row content

- rank;
- avatar or initials;
- display name;
- level and rank title;
- verified quests;
- XP for the selected period.

Use display names only. Never show email addresses or private account information.

### Empty and disconnected states

- No leaderboard activity yet
- Reconnecting to live updates
- Live updates unavailable; data remains visible with a refresh action

### Mobile adaptation

Use a compact list rather than a wide table. Keep rank, identity, level, and XP visible; move secondary metrics into the row detail.

---

## 6.9 Share Card Builder

### Objective

Allow a Member to create a safe, attractive, square achievement image without creating a public profile page.

### Desktop structure

- Left: controls
- Right: 1080 × 1080 square preview scaled to the available space

### Controls

- Completion selector when opened from the Passport
- Toggle: `Show my display name` — enabled by default
- Theme choice: Light / Dark
- Download PNG
- Share where supported

### Card content

- Kiwimpact branding
- Display name, unless disabled
- Quest name
- Completion date
- Verification label
- XP earned
- current Level
- current Rank title
- decorative category illustration

Never show:

- email;
- user ID;
- evidence;
- claim text;
- review note;
- precise GPS;
- a public-profile URL.

### Visual variants

Create at least three first-pass category themes while keeping the same layout:

- Restore Nature
- Protect Wildlife
- Clean & Reduce Waste

---

## 7. Batch 2 Authentication Specifications

Use one consistent authentication shell with an illustration panel on desktop and a simple branded header on mobile.

### Sign in

- Email
- Password
- Show/hide password
- Remembering the session is handled by the application; do not add a misleading `Remember me` control unless implemented
- Primary action: `Sign in`
- Divider: `or`
- Secondary OAuth action: `Continue with Google`
- Links: `Forgot password?`, `Create account`

### Create account

- Display name
- Email
- Password
- Confirm password
- Primary action: `Create account`
- Google option
- Terms/privacy acknowledgement placeholder

### Email confirmation

- Check-email success state
- Resend confirmation action
- Confirmation successful state
- Invalid or expired link state

### Forgot and reset password

The forgot-password success message must not reveal whether an account exists.

### Account settings

- Display name
- Email status
- Linked sign-in methods
- Link Google account flow
- Change password only when a local password exists
- Theme setting
- Reduced-motion setting
- Sound setting, off by default

---

## 8. Batch 3 Organizer and Admin Specifications

## 8.1 Organizer Quest List

- Summary cards: Draft, Published, Upcoming, Full
- Search, status filter, source/registration filter
- Table or card list with title, date, status, participants, capacity, and actions
- Primary action: `Create quest`
- Row actions: Edit, View participants, Publish, Cancel, Archive

## 8.2 Organizer Create/Edit Quest

Use a multi-section form rather than an overly complex wizard:

- Basic information
- Category and difficulty
- Schedule
- General location and map coordinate picker
- Registration mode: Native, External, None required
- Capacity
- Verification method
- Completion code settings
- Publish controls

The map coordinate picker supports clicking the map. Do not include Places Autocomplete.

## 8.3 Organizer Participants

- Quest summary
- participant count and capacity
- participant list
- participation status
- completion-code panel
- optional approval state where implemented

Organizers should not see external evidence by default.

## 8.4 Admin Overview

- Claims awaiting review
- External sources needing review
- Published quests
- Upcoming quests
- Recent system activity summary
- Clear links to each queue

Avoid decorative analytics that do not support an MVP task.

## 8.5 Admin Claim Review

### Queue

- filters by status, date, category, and verification type
- claimant display name
- quest
- submitted date
- status
- review action

### Detail

- participation date
- description
- evidence link shown as an untrusted external link
- declaration status
- approve action
- reject action with short reason
- privacy reminder

Do not fetch or preview the evidence URL.

## 8.6 Admin Curated External Quest

Fields include:

- title
- date/time
- general location
- organiser/provider
- category
- duration, age guidance, difficulty
- official source URL
- short Kiwimpact-written summary
- source checked date
- source status

Display the required public notice and `Last checked` date in a preview panel.

## 8.7 External Source Freshness Queue

Statuses:

- Current
- Needs review
- Changed
- Source removed

Show last checked, next check due, event start date, and actions to update the status. Do not design automated scraping controls.

---

## 9. Core Component Library

Create the following component groups and variants.

### Foundations

- Logo lockup and compact mark
- Colour variables for Light and Dark
- Text styles
- Spacing variables
- Elevation styles
- Focus-ring style

### Navigation

- Desktop header: Guest, Member, Organizer/Admin
- Mobile top bar
- Mobile bottom navigation
- Avatar menu
- Role-aware management navigation

### Actions

- Button: Primary, Secondary, Outline, Ghost, Destructive
- Sizes: Small, Medium, Large
- States: Default, Hover, Focus, Pressed, Disabled, Loading
- Icon-only button with accessible label

### Data display

- Quest Card: external, organizer, challenge
- Quest Summary Card for map marker
- Player Progress Card
- Achievement Badge: locked, progress, earned
- Passport Timeline Item
- Leaderboard Row
- Status Badge
- Category Badge
- Difficulty Badge
- Verification Badge
- XP pill
- Capacity meter

### Inputs

- Text input
- Password input
- Textarea with character count
- Select
- Checkbox
- Radio group
- Toggle
- Search field
- Date input
- Filter chip
- Segmented control
- Form field with hint, warning, and error states

### Feedback

- Toast: success, information, warning, error
- Inline alert
- Skeleton card and page skeleton
- Empty-state panel
- Error-state panel
- Confirmation dialog
- Desktop modal
- Mobile bottom sheet
- Full-screen reward overlay
- Progress bar
- Step or status indicator

### Map

- Default marker
- Selected marker
- Cluster marker if needed for visual exploration
- Marker summary card
- Map fallback panel
- Coordinate-selection marker for Organizer/Admin

---

## 10. Responsive Behaviour

### Desktop, 1200 px and above

- Use multi-column layouts.
- Discover can show three Quest Cards per row.
- Map view uses list/map split.
- Quest Detail uses content plus sticky action card.
- Admin and Organizer pages may use tables where appropriate.

### Tablet, approximately 768–1199 px

- Reduce cards to two columns.
- Avoid fixed sidebars that leave narrow content.
- Move complex filters into a drawer.
- Quest Detail action card may move below the main summary.

### Mobile, approximately 390 px

- One content column.
- Bottom navigation for Member destinations.
- Sticky bottom actions for Quest Detail.
- Full-height sheets for filters and forms.
- Replace wide tables with cards or compact lists.
- Reduce reward particles and animation density.
- Respect safe-area insets.

---

## 11. Accessibility Requirements

- WCAG AA contrast for text and controls.
- Visible keyboard focus states.
- Do not communicate status only through colour.
- Minimum 44 × 44 px touch targets.
- Logical heading hierarchy.
- Form fields need visible labels, hints, and errors.
- Icon-only buttons need accessible names.
- Dialogs and sheets need clear close actions.
- Provide reduced-motion alternatives.
- Maps require a usable list fallback.
- Illustrations are decorative unless they convey essential information.
- Avoid long all-uppercase labels.

---

## 12. Fictional Sample Content

Use fictional MVP data. Do not imply real partnerships with councils, DOC, NGOs, or event providers.

### Example quests

1. **Restore the Harbour Edge**
   - Category: Restore Nature
   - Difficulty: Medium
   - Reward: 100 XP
   - Location: West Auckland
   - Source: Organizer quest
   - Verification: Completion code

2. **Backyard Bird Count**
   - Category: Observe & Measure
   - Difficulty: Easy
   - Reward: 50 XP
   - Location: Anywhere in Auckland
   - Source: Kiwimpact challenge
   - Verification: Evidence reviewed

3. **Neighbourhood Litter Sweep**
   - Category: Clean & Reduce Waste
   - Difficulty: Easy
   - Reward: 50 XP
   - Location: Mount Eden
   - Source: Organizer quest
   - Verification: Completion code

4. **Pollinator Garden Workshop**
   - Category: Grow & Compost
   - Difficulty: Medium
   - Reward: 100 XP
   - Location: Central Auckland
   - Source: Official external event
   - Verification: Evidence reviewed

5. **Wildlife-Friendly Beach Walk**
   - Category: Protect Wildlife
   - Difficulty: Easy
   - Reward: 50 XP
   - Location: North Shore
   - Source: Kiwimpact challenge
   - Verification: Self reported · No XP

6. **Share a Waste-Free Habit**
   - Category: Learn & Share
   - Difficulty: Easy
   - Reward: 50 XP
   - Location: Online / Auckland
   - Source: Kiwimpact challenge
   - Verification: Evidence reviewed

### Example users

- Mia K. — Level 7, Novice
- Theo R. — Level 12, Scout
- Anika P. — Level 24, Adventurer
- Jordan W. — Level 41, Pathfinder

---

## 13. Important Product Rules to Show in the UI

- Easy quests award 50 XP, Medium 100 XP, and Hard 150 XP.
- Only verified completion earns XP.
- Self-reported completion appears in the Passport but gives no XP, streak, achievement, or leaderboard credit.
- Weekly streak means at least one verified quest in a New Zealand calendar week.
- Levels range from 1 to 99.
- Rank ranges:
  - 1–9: Novice
  - 10–19: Scout
  - 20–29: Adventurer
  - 30–39: Ranger
  - 40–49: Pathfinder
  - 50–59: Guardian
  - 60–69: Vanguard
  - 70–79: Champion
  - 80–89: Hero
  - 90–98: Legend
  - 99: Kiwimpact Legend
- External event registration remains on the official provider website.
- Leaderboards use verified results only.
- Share cards contain only safe summary information.

---

## 14. MVP Exclusions — Do Not Add to the First UI

Do not design these features:

- Community Pulse
- Kudos
- Public Profile
- posts, comments, follows, friends, or chat
- notifications centre
- social image upload
- evidence image upload
- AI recommendations or AI verification
- payments, vouchers, prizes, or redemption
- automated website scraping or external API synchronisation
- directions, Street View, traffic, routes, distance matrices, or continuous geolocation
- native mobile application or push notifications
- complex organisation administration
- unrestricted Member quest publishing
- carbon-equivalent claims
- background music

Do not add generic dashboard charts merely to fill space.

---

## 15. Required Page States

For every important screen, create reusable patterns for:

- loading;
- empty;
- success;
- validation error;
- server error;
- forbidden;
- not found.

Specific examples:

- Discover: no quests match the filters
- My Quests: no upcoming quests
- Passport: first completion not yet recorded
- Leaderboard: no verified activity for the period
- Claim: pending, approved, rejected, withdrawn
- External quest: source needs review or source removed
- Live leaderboard: reconnecting

---

## 16. Figma File Organisation

Create these pages in the Figma file:

1. `00 Cover & Notes`
2. `01 Foundations`
3. `02 Components`
4. `03 Batch 1 Desktop`
5. `04 Batch 1 Mobile`
6. `05 Batch 2 Auth & States`
7. `06 Batch 3 Management`
8. `07 Prototype Flows`
9. `08 Archive`

Use consistent frame names such as:

- `D01 Landing / Default`
- `D02 Discover / Cards`
- `D03 Discover / Map`
- `D04 Quest Detail / Guest`
- `D05 Quest Detail / Joined`
- `M01 Landing / Default`
- `M02 Discover / List`
- `M03 Discover / Map`

Use component names such as:

- `Button/Primary/Medium/Default`
- `QuestCard/Organizer/Default`
- `Badge/Verification/Verified`
- `Navigation/Desktop/Member`

---

## 17. Prototype Flows to Connect

Create clickable first-pass prototypes for these flows.

### Guest discovery flow

Landing → Explore quests → Discover → Quest Detail → Sign in

### Member completion flow

My Quests → Quest Detail → Complete quest → Enter code or Submit claim → Reward → Passport → Share Card

### Organizer flow

Manage → Quest list → Create/Edit quest → Publish → Participants → Completion code

### Admin review flow

Admin Overview → Claims queue → Claim detail → Approve/Reject → Updated queue

---

## 18. Review Checklist

The first Figma AI output is acceptable for human review when:

- the product does not look like a generic admin template;
- the eco-adventure identity is clear but not childish;
- XP, level, rank, streak, achievements, and verification are visible and understandable;
- desktop and mobile layouts share one coherent design system;
- the landing, discovery, quest, dashboard, Passport, leaderboard, and share-card flows are represented;
- Quest Cards clearly differentiate source, difficulty, XP, registration, and verification;
- external-source notices are visible;
- self-reported completion is clearly marked as no-XP;
- the map has a list fallback;
- forms include error and loading states;
- private claim information never appears in public or shareable UI;
- no excluded social, payment, AI, scraping, or route-planning features are introduced;
- components are reusable and built with Auto Layout;
- Light and Dark variables exist;
- the mobile designs are not merely compressed desktop frames.

---

# Copy-Ready Figma AI Prompts

## Prompt A — Batch 1 Master Prompt

Design the first high-fidelity MVP UI for **Kiwimpact**, an Auckland-first gamified community environmental participation web application for Aotearoa New Zealand. The tagline is **“Community eco quests across New Zealand.”** The core loop is Discover, Understand, Join, Complete, Verify, Earn, Record, Share, Continue.

Create editable Figma frames and reusable components using Auto Layout and Variables. Generate desktop frames at 1440 px and mobile frames at 390 px. Build a friendly eco-adventure identity that is energetic, rounded, gameful, trustworthy, accessible, and modern, but not childish. Use Manrope, Lucide-style icons, simple eco-adventure illustrations, rounded Quest Cards, subtle topographic or native-leaf-inspired shapes, and strong visible progress feedback. Do not copy another product.

Use these Light theme colours: primary #2F8F5B, secondary #6C63D9, accent #F4B740, background #F8FBF4, content #183026. Use these Dark theme colours: primary #6FD69A, secondary #AAA1F5, accent #FFD166, background #13211B, content #F2F7F3. Use 14 px button/input radius, 20 px card radius, 24 px modal radius, pill badges, 44 px minimum touch targets, and WCAG AA contrast.

Generate the following connected desktop and mobile pages:

1. Landing page with hero, featured quests, how-it-works steps, progress preview, external-source trust note, and CTA.
2. Discover Quests with search, category chips, filters, sorting, Cards/Map toggle, quest grid, split map view on desktop, and list/map views on mobile.
3. Quest Detail with trusted information, reward and verification panel, map, official-source notice, guest/joined variants, and sticky mobile CTA.
4. Member Dashboard / My Quests with Level, Rank, XP progress, weekly streak, next action, quest status tabs, recent achievements, Passport preview, and leaderboard position.
5. Completion dialogs/sheets for completion code, evidence-reviewed claim, and self-reported completion. Make clear that self-reported completion is Passport only and earns no XP.
6. Reward overlay with standard completion, Level Up, and Rank Up variants, plus Skip animation and reduced-motion alternatives.
7. Personal Impact Passport with player summary, achievements, verified/self-reported filters, completion timeline, and share-card actions.
8. Leaderboard with Weekly, Monthly, and All time tabs, top three, ranked rows, current-user highlight, and live-update/reconnecting states.
9. Share Card Builder with controls and a square 1080×1080 preview containing safe information only: optional display name, quest, date, verification label, XP, Level, Rank, and Kiwimpact branding.

Quest categories are Restore Nature, Protect Wildlife, Clean & Reduce Waste, Grow & Compost, Observe & Measure, and Learn & Share. Quest difficulties award Easy 50 XP, Medium 100 XP, and Hard 150 XP. Only verified completions earn XP. Levels range from 1 to 99. Rank titles are Novice, Scout, Adventurer, Ranger, Pathfinder, Guardian, Vanguard, Champion, Hero, Legend, and Kiwimpact Legend.

Quest Cards must clearly display source type, category, difficulty, XP, general location, date/time, registration type, verification type, capacity where relevant, and View quest. Source types are Official external event, Organizer quest, and Kiwimpact challenge. Verification types are Completion code, Evidence reviewed, and Self reported · No XP.

Use realistic fictional Auckland sample data and do not imply real partnerships. Do not include public profiles, Community Pulse, Kudos, posts, comments, friends, chat, notifications, payments, vouchers, AI features, image evidence upload, web scraping, directions, Street View, traffic, route planning, or continuous geolocation.

Create reusable loading, empty, success, validation error, server error, forbidden, and not-found patterns. Organise the Figma file into Foundations, Components, Batch 1 Desktop, Batch 1 Mobile, and Prototype Flows.

## Prompt B — Batch 2 Authentication and States

Using the existing Kiwimpact design system, create responsive desktop and mobile authentication and account-management screens: Sign in, Create account, Continue with Google, Check email, Resend confirmation, Confirmation successful, Invalid or expired confirmation, Forgot password, Reset password, and Account settings. Use one consistent authentication shell. The forgot-password success state must not reveal whether an account exists. Account settings must show display name, email status, linked sign-in methods, Link Google account, theme, reduced motion, and sound off by default. Only show Change password when the account has a local password. Add reusable loading, validation, lockout/rate-limit, server-error, forbidden, and not-found states.

## Prompt C — Batch 3 Organizer and Admin

Using the approved Kiwimpact design system, create responsive Organizer and Admin management screens. Organizer screens: quest list, create/edit quest, participants, capacity, completion-code panel, publish/cancel/archive controls, and map coordinate selection by clicking the map. Registration modes are Native, External, and None required. Do not add Places Autocomplete. Admin screens: overview, all quests, completion-claim queue and detail, curated external-quest form, source-freshness queue, and basic users/roles view. Claim review must show participation date, description, declaration, and an untrusted external evidence link without previewing or fetching it. External-source statuses are Current, Needs review, Changed, and Source removed. Show last checked and next check due. Do not design scraping or automated sync controls.
