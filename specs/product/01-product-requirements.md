# Kiwimpact Product Requirements

## Status

Status: Accepted Product Overview

> This document supplements the detailed planning baseline
> (`specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`) and later accepted scope
> updates. It does not replace them.

## Overview

Kiwimpact is a gamified environmental action platform that helps people
discover, complete, and record meaningful eco-friendly activities in their
local communities.

The product combines:

- local environmental action;
- community participation;
- gamification;
- personal progress tracking;
- verified impact records.

The goal is not to create a traditional game, but to use game design
principles to encourage repeated positive real-world behavior.

---

# Product Vision

## Vision Statement

Make environmental contribution visible, rewarding, and socially meaningful.

Kiwimpact helps individuals turn small local actions into measurable personal
and community impact.

---

# Core User Value

Users should be able to:

1. Discover meaningful environmental activities.
2. Join quests that match their interests and location.
3. Complete activities in the real world.
4. Verify completion where required.
5. Earn progress and recognition.
6. See their personal and community impact.

---

# Target Users

## Guest Users

Guests can:

- explore public quests;
- view platform information;
- understand the gamification system;
- browse limited public content.

Guests cannot:

- claim completion;
- earn XP;
- access private progress.

---

## Members

Members can:

- create an account;
- select a community identity;
- discover quests;
- join quests;
- complete quests;
- earn XP;
- level up;
- collect achievements;
- view their Personal Impact Passport;
- participate in leaderboards.

---

## Organizers

Organizers can:

- create, edit, publish, cancel, and archive owned quests;
- manage capacity and registration mode;
- view participants;
- issue or manage completion codes.

---

## Administrators

Administrators can:

- manage all quests;
- create curated external quests;
- review external completion claims;
- manage source freshness and roles where required.

---

# Core Product Features

## 1. Quest Discovery

Users can discover environmental activities through:

- category filtering;
- location-based browsing;
- map exploration;
- region filtering where available.

Quest examples:

- community cleanup;
- recycling activities;
- biodiversity observation;
- conservation events.

---

## 2. Quest Completion

Users can:

- join quests;
- complete required actions;
- submit completion evidence when required;
- receive verified rewards.

Only verified XP-producing completions contribute to progression.

---

## 3. Gamification System

Kiwimpact uses gamification mechanics including:

## XP

Experience points represent verified environmental contribution.

XP is earned only through verified XP-producing completions.
Community participation alone does not award XP.
Self-reported completions do not award XP.

---

## Levels

Levels represent long-term engagement.

Users progress through:

- XP accumulation;
- consistent participation;
- completed activities.

---

## Rank Titles

Rank titles provide identity and recognition.

They represent progression milestones rather than competitive power.

---

## Achievements

Achievements recognize meaningful milestones.

Examples:

- first completed quest;
- community contributor;
- environmental streak;
- category milestones.

---

## Personal Impact Passport

The passport summarizes:

- completed quests;
- earned XP;
- level;
- achievements;
- environmental contribution history.

---

# Community System

Kiwimpact supports community identity through coarse-grained regions.

Users may select a Home Community representing where they participate.

Community identity supports:

- local belonging;
- community leaderboard;
- regional comparison;
- collective progress.

Community identity does not represent:

- exact address;
- GPS location;
- automatic tracking.

---

# Leaderboards

Leaderboards encourage motivation through positive recognition.

Supported scopes:

- personal progress;
- community leaderboard;
- broader regional comparison.

Leaderboard design must consider:

- fairness;
- privacy;
- community size;
- avoiding excessive competition pressure.

---

# Privacy Principles

Kiwimpact must minimize unnecessary personal data.

The platform should avoid storing:

- exact home address;
- continuous location tracking;
- inferred private location.

Location-related features should use:

- selected community regions;
- quest regions;
- user-approved information.

---

# External Activities

Kiwimpact supports two types of external activities:

- **Organizer-owned quests:** Organizers create and manage quests with native
  registration, external registration, or no registration required. Participants
  join through Kiwimpact.
- **Admin-curated external quests:** Admin records selected activities from
  councils, DOC, EcoFest, NGOs, or similar providers. Registration stays on the
  official provider website. Participants submit completion claims that Admin
  reviews.

The MVP approach:

- Organizers create and manage owned quests with full CRUD;
- Admin creates curated external quests and reviews completion claims;
- users complete activities;
- users provide required evidence for external claims;
- completion is reviewed when necessary.

---

# MVP Scope

## Included

- authentication;
- quest discovery;
- quest participation;
- completion tracking;
- XP progression;
- levels;
- achievements;
- Personal Impact Passport;
- community identity;
- local leaderboards.

---

## Not Included in MVP

The following are future possibilities:

- virtual currency;
- cosmetic shop;
- avatar marketplace;
- trading systems;
- advanced social networking;
- mobile native applications.

These require separate design decisions before implementation.

---

# Product Success Criteria

The MVP should demonstrate:

- meaningful gamification;
- clear user progression;
- understandable user journeys;
- community engagement;
- maintainable technical architecture;
- responsible AI-assisted development.