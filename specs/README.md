# Community Identity and Gamification Scope Update

- **Status:** Accepted Product Scope Update
- **Date:** 2026-07-20
- **Related decision:** ADR-0008 Community Identity, Local Leaderboards,
  and Virtual Economy Scope
- **Amends:** Kiwimpact Final Planning Baseline v1.0

> This document amends the accepted planning baseline only for Community
> identity, geographically scoped leaderboards, Community-related privacy,
> and virtual-economy scope.
>
> It records accepted product requirements. It does not claim that the
> database, API, UI, SignalR integration, or tests have been implemented.

## 1. Purpose

This scope update extends Kiwimpact from an individual progression experience
into a community-connected environmental participation platform.

The update aims to:

- create a stronger sense of local belonging;
- make leaderboard participation feel more achievable;
- provide community-level motivation beyond individual Top 10 rankings;
- support future regional comparison without redesigning the domain model;
- preserve user privacy through coarse, manually selected Community identity;
- keep the MSA MVP achievable by excluding a full virtual economy.

## 2. Existing Gamification Baseline

Before this update, the accepted MVP already included:

- Quests;
- verified completion;
- XP;
- Levels;
- Rank Titles;
- Achievements;
- weekly Streaks;
- Personal Impact Passport;
- leaderboards;
- client-generated Share Cards.

Community identity extends these systems. It does not replace the existing
personal progression model.

## 3. Home Community

### 3.1 Concept

A Member may optionally select one **Home Community**.

Home Community represents:

> The coarse-grained local area that the Member chooses to represent