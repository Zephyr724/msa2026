# Community Identity and Gamification Scope Update

## Status

Accepted Product Scope Update

## Related Decisions

- ADR-0008 Community Identity, Local Leaderboards, and Virtual Economy Scope

---

# Purpose

This document records the product scope update introduced by the Community
Identity feature.

The update extends Kiwimpact from an individual progression experience into a
community-connected environmental action platform.

The goal is to increase belonging and retention while maintaining privacy and
keeping MVP complexity controlled.

---

# Background

The original MVP already included:

- quests;
- XP;
- levels;
- achievements;
- Personal Impact Passport;
- leaderboards.

However, individual progression alone may not create enough social identity
and long-term motivation.

Community identity introduces a local belonging layer.

---

# Community Identity

## Concept

Each member may optionally select a Home Community.

A Home Community is a coarse-grained geographic identity representing the area
with which the user chooses to associate.

Examples:


New Zealand
└ Auckland
└ Henderson-Massey


---

# Purpose

Community identity supports:

- local belonging;
- regional recognition;
- community leaderboard;
- future community impact comparison.

---

# Privacy Boundary

Community identity is not a location tracking system.

The system must not:

- store exact home addresses;
- infer user location automatically;
- expose precise user locations;
- track continuous movement.

The user chooses their displayed community identity.

---

# Region Model

The system introduces hierarchical regions.

Example:


Country
|
Region
|
City
|
Local Community


A region contains:

- name;
- type;
- optional parent region.

---

# Separation of Concepts

User community identity and quest location are separate concepts.

## User Community

Represents:

"Where does this user want to belong?"

Example:


UserProfile.HomeCommunityRegionId


---

## Quest Location

Represents:

"Where does this activity happen?"

Example:


Quest.LocationRegionId


These values must not be automatically linked.

---

# Community Leaderboards

Leaderboards should support:

- user personal ranking;
- community ranking;
- broader regional comparison.

Possible scopes:


My Community
City
Country


---

# Leaderboard Principles

The leaderboard should:

- encourage positive participation;
- show progress clearly;
- avoid excessive competition;
- protect privacy.

For small communities:

- avoid exposing sensitive individual comparisons;
- consider minimum participant thresholds.

---

# Gamification Relationship

Community identity strengthens existing gamification loops:

Existing loop:


Quest
↓
Completion
↓
XP
↓
Level
↓
Achievement


Updated loop:


Quest
↓
Completion
↓
XP
↓
Level
↓
Achievement
↓
Community Recognition


---

# Virtual Economy Scope

## Decision

Virtual currency and shop features are not part of the MVP.

Future possibilities include:

- cosmetic customization;
- avatar items;
- passport decorations;
- achievement displays.

---

# Reason

A virtual economy introduces additional complexity:

- currency balance management;
- transaction history;
- inventory;
- purchasing rules;
- abuse prevention;
- moderation requirements.

The MVP prioritizes:

- meaningful environmental action;
- community identity;
- verified progression.

---

# Future Expansion

Future community features may include:

- community challenges;
- regional environmental goals;
- community events;
- cooperative achievements;
- richer social interaction.

These require additional product decisions before implementation.