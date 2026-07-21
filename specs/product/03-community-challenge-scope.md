# Community Challenge Scope

- **Status:** Accepted
- **Date:** 2026-07-21
- **Purpose:** Define the MVP scope, rules, and exclusions for the Community Challenge feature — a monthly collective goal for each LocalArea that rewards community-wide verified completion counts.

> This document records accepted product decisions. It does not claim that implementation is complete.

## 1. Purpose

Community Challenge gives each LocalArea a shared monthly target. Members contribute automatically through verified Quest completions. When the community collectively reaches the target, contributors receive a reward Achievement.

The feature supports:

- Collective motivation without requiring social coordination;
- A reason to care about what others in the same LocalArea are doing;
- Visibility of local environmental participation;
- A foundation for future inter-community friendly comparison.

## 2. User Value

For Members, Community Challenge provides:

- A collective goal that does not require manually forming a team;
- Motivation to complete quests — every verified completion helps;
- Recognition through an Achievement when the community succeeds;
- A visible measure of local participation.

For the product, it provides:

- A natural use of the community identity system;
- Content for the Communities Leaderboard;
- A SignalR real-time feature (challenge progress updates);
- A feature that demonstrates gamification at the community level.

## 3. MVP Rules

### 3.1 Challenge Lifecycle

- At most one Active challenge exists per LocalArea at any time.
- Each challenge runs for one calendar month (Pacific/Auckland).
- Admin creates challenges manually. There is no automatic monthly challenge generation in the MVP.
- A challenge may be Cancelled by Admin before completion.
- At the end of the period, the challenge is Completed (target met) or Failed (target not met).

### 3.2 Participation

- Members do not manually join a challenge.
- Contribution is automatic: when a Member earns verified XP and has a Home Community at the time of award, the completion counts toward the challenge for the `CommunityRegionIdAtAward` region.
- A Member contributes to a challenge by completing verified quests during the challenge period while having a Home Community in the challenge's LocalArea.
- There is no opt-out. Community Challenge is a collective feature, not a personal competition.
- Unattributed XP (Member without a Home Community at award time) does not contribute to any Community Challenge.

### 3.3 Contribution Rules

- Only verified QuestCompletions (Status = Verified) count.
- Self-reported completions do not count.
- The attribution uses `XpTransaction.CommunityRegionIdAtAward` (the award-time snapshot).
- Quest location does not determine challenge attribution. A Member from Henderson-Massey completing a quest in Waitākere Ranges contributes to the Henderson-Massey challenge.
- Historical contribution does not move when Home Community changes.

### 3.4 Progress Calculation

Challenge progress is derived by querying `XpTransaction`:

```
COUNT of verified QuestCompletions
WHERE XpTransaction.CommunityRegionIdAtAward = LocalAreaRegionId
  AND XpTransaction.CreatedAt BETWEEN PeriodStart AND PeriodEnd
```

Progress is calculated on read; there is no `CommunityChallengeContribution` table.

### 3.5 Target Type

The MVP supports a single target type:

- `VerifiedCompletionCount` — the number of verified Quest completions attributed to the community during the challenge period.

Future types (deferred): total XP, unique contributors, category diversity.

### 3.6 Rewards

- When a challenge is Completed (target met), all Members who contributed at least one verified completion receive the challenge's `RewardAchievementId` Achievement.
- Rewards use `RewardAchievementId` only. Do not create `RewardBadgeCode` or another badge reward system.
- `RewardAchievementId` is nullable — a challenge may exist without a reward (e.g., a pilot challenge).
- Achievement award is idempotent: a Member receives the achievement at most once per challenge.
- Rewards are awarded when the challenge status changes to Completed. The exact timing (immediate on status change vs. background job) is an implementation detail, but the Member should see the achievement reasonably soon after the challenge ends.

## 4. Passport Community Participation

The Personal Impact Passport includes a Community Participation section that shows:

- Historical contributions grouped by community (Region name);
- For each community: total verified completions contributed, challenges participated in, achievements earned;
- Communities the Member has since departed (contributions preserved via `CommunityRegionIdAtAward` snapshot);
- Current community (if any).

This section is distinct from Completion History. It queries `XpTransaction.CommunityRegionIdAtAward` with no current-HomeCommunity filtering.

### Query rules

- Group by `CommunityRegionIdAtAward`.
- Include null-attributed XP only in personal totals, not in the Community Participation section.
- A Member's historical contributions to a departed community remain visible permanently.
- This is consistent with the "no retroactive reattribution" rule (ADR-0008 §4, §5).

## 5. Leaderboard Integration

Community Challenge progress is visible on:

- The challenge detail view (public, per challenge);
- The Communities Leaderboard (`/api/v1/leaderboards/communities`).

The Communities Leaderboard ranks LocalAreas by their current challenge progress or by general community metrics (see `specs/product/02-community-identity-and-gamification-scope-update.md` §3 for MVP-lite community comparison).

## 6. Privacy

- Challenge progress shows aggregate counts only — no individual contributor names or rankings.
- Individual contribution is private by default. A Member can see their own contribution count on their Passport.
- Small-community considerations: if a community has very few active Members, the contributor count may be suppressed (same threshold and rules as the People Leaderboard small-community protection — see `specs/security/01-community-privacy-rules.md` §3).

## 7. Empty and Small-Community States

- A LocalArea with no Active challenge shows a neutral state (e.g., "No active challenge. Check back next month.").
- A challenge with zero contributions shows the target and current count (0).
- A challenge with very few contributors does not expose individual identities (see §6).

## 8. Acceptance Criteria

- [ ] Admin can create a monthly challenge for a LocalArea.
- [ ] At most one Active challenge exists per LocalArea (enforced by database constraint).
- [ ] Challenge progress is derived from XpTransaction queries (no contribution table).
- [ ] Verified completions with matching `CommunityRegionIdAtAward` count toward the challenge.
- [ ] Self-reported completions do not count.
- [ ] Unattributed XP (null CommunityRegionIdAtAward) does not count.
- [ ] When a challenge is Completed, eligible contributors receive the reward Achievement.
- [ ] Achievement award is idempotent.
- [ ] Historical contributions remain attributed to the original community after a Member changes Home Community.
- [ ] Passport Community Participation section shows historical contributions grouped by community.
- [ ] Challenge progress is exposed via the API and SignalR hub.
- [ ] Communities Leaderboard ranks LocalAreas by the accepted metric.

## 9. Explicit Exclusions

The following are explicitly excluded from the MVP:

- Seasons — a sequence of linked monthly challenges with cumulative scoring.
- Leagues — tiers of communities promoted/relegated based on performance.
- Editable scoring formulas — the metric is fixed as verified completions / active contributors for community comparison, and verified completion count for challenge targets.
- Complex trend analytics — charts, historical comparisons, projections.
- Multiple simultaneous challenges per LocalArea.
- Challenges at AdministrativeArea or Country level (LocalArea only in MVP).
- Manual opt-in or opt-out per challenge.
- Per-user challenge progress notifications.
- Multiple target types beyond `VerifiedCompletionCount`.
- `CommunityChallengeContribution` entity — progress is derived.
- `RewardBadgeCode` or any badge-based reward system.

## 10. Related Documents

- `specs/product/02-community-identity-and-gamification-scope-update.md` — Community identity and leaderboard scope
- `specs/architecture/02-core-domain-data-model.md` — Entity definitions (CommunityChallenge, XpTransaction)
- `specs/architecture/03-api-contract.md` — API endpoints (§2.13 Community Challenges, §2.15 Communities Leaderboard)
- `specs/security/01-community-privacy-rules.md` — Privacy rules
- `specs/testing/01-community-leaderboard-and-privacy-tests.md` — Test cases
- ADR-0008: Community Identity, Local Leaderboards, and Virtual Economy Scope