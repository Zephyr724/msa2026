# Independent Specification Review

- **Reviewer:** Claude Sonnet (independent review)
- **Date:** 2026-07-21
- **Mode:** Plan
- **Task:** Independent review of accepted Kiwimpact specifications before Slice 0 implementation
- **Reviewed scope:** Core domain data model, API contract, community identity data model, Community Challenge scope, community privacy rules, and related product specifications

## Findings

### Finding 1: UserAchievement — Missing SourceCommunityChallengeId (Major)

The `UserAchievement` entity lacks a link to the originating `CommunityChallenge`. Without this, recurring monthly challenge rewards (same Achievement awarded in consecutive months) violate the current `(UserId, AchievementId)` unique constraint.

**Recommendation:** Add nullable `SourceCommunityChallengeId` (FK → `CommunityChallenge.Id`) to `UserAchievement`. Replace the current unique constraint with partial unique indexes that distinguish challenge-awarded achievements from non-challenge achievements.

### Finding 2: Missing Organizer Participant Endpoint (Major)

There is no Organizer-facing endpoint to view who has joined or completed a quest. Organizers need a participant summary for operational purposes.

**Recommendation:** Add `GET /api/v1/organizer/quests/{questId}/participants` returning participation and completion summary only. Must never expose `EvidenceUrl`, claim description, or review evidence to Organizers. Authorization: Organizer (own quests) or Admin.

### Finding 3: Capacity Enforcement Scope (Major)

The current specification implies Capacity applies uniformly to all RegistrationModes, but External and NoneRequired quests should not consume platform Capacity.

**Recommendation:** Limit Capacity to Native registration only. For Native Quests, enforce Capacity on join, completion code redemption, and evidence claim submission. External and NoneRequired completion paths may exist without Participation.

### Finding 4: Self-Dealing Prevention (Blocker)

The specification permits an Organizer to earn Verified XP from their own quests and an Admin to approve their own Evidence Claims, creating a self-dealing risk.

**Recommendation:** An Organizer cannot receive a Verified Completion or XP for an Organizer-owned Quest they created. An Admin cannot approve or reject their own Evidence Claim. An Admin's claim requires review by a different Admin.

### Finding 5: Pending Evidence Claim Withdrawal Behavior (Minor)

The specification describes claim withdrawal but does not define the exact persistence behavior — specifically whether to use a "Withdrawn" status or actual deletion.

**Recommendation:** `DELETE /api/v1/users/me/claims/{claimId}` permanently removes the pending `QuestCompletion` and its `EvidenceClaimDetail` (cascade). Do not add a `Withdrawn` status. Only pending claims may be withdrawn; reviewed claims return 409.

### Finding 6: Community Challenge Finalization Mechanism (Major)

The specification states that challenges move to Completed/Failed at period end but does not define the mechanism.

**Recommendation:** Use a lightweight .NET hosted background service (`BackgroundService` implementation) that periodically evaluates Active challenges whose `PeriodEnd` has passed. Reward awards are performed idempotently. Do not introduce Hangfire or another job framework.

### Finding 7: Small-Community Contributor-Count Suppression (Major)

Small-community privacy protection is defined for the People Leaderboard but not consistently applied to Community Challenge progress and the Communities Leaderboard.

**Recommendation:** Apply the same small-community threshold (default 10 active ranked Members) to Community Challenge progress API and Communities Leaderboard API. Suppress exact contributor counts below threshold.

### Finding 8: LastCommunityChangeAt Missing from Community Identity Data Spec (Minor)

`UserProfile.LastCommunityChangeAt` is defined in the core domain data model but is missing from the community identity data model specification, creating a cross-document inconsistency.

**Recommendation:** Add `LastCommunityChangeAt` column to the `UserProfile` table definition in the community identity data model specification.

### Finding 9: CommunityChallenge Ownership Ambiguity (Major)

The specification does not clearly state which roles can create and manage Community Challenges.

**Recommendation:** Guest and Member may read public aggregate data. Admin creates and manages challenges. Organizer has no special challenge management privileges beyond Member read access.

### Finding 10: Quest Archive Preconditions (Minor)

The specification does not define when a Quest can be archived, leaving the state transition ambiguous.

**Recommendation:** A Quest may be archived only when `Status = Cancelled` or `Status = Published` with `EndAtUtc` in the past. Draft quests cannot be archived.

### Finding 11: Unnecessary Admin UserProfile-Read Endpoint (Minor)

The ownership boundaries table implies Admin may read UserProfile for operational purposes, which could be interpreted as requiring a general Admin user-profile-read endpoint.

**Recommendation:** Do not add a general `GET /api/v1/admin/users/{id}` endpoint. Narrow the ownership boundary table entry to avoid implying an unqualified read endpoint. Admin operational access is scoped to specific use cases.

## Summary

| # | Finding | Severity |
|---|---------|----------|
| 1 | Add SourceCommunityChallengeId to UserAchievement | Major |
| 2 | Add Organizer participant endpoint | Major |
| 3 | Capacity applies only to Native registration | Major |
| 4 | Prevent self-dealing | Blocker |
| 5 | Pending claim withdrawal = permanent DELETE | Minor |
| 6 | Community Challenge finalization via BackgroundService | Major |
| 7 | Small-community contributor-count suppression | Major |
| 8 | Add LastCommunityChangeAt to community identity data spec | Minor |
| 9 | Clarify CommunityChallenge ownership | Major |
| 10 | Quest archive preconditions | Minor |
| 11 | Remove/narrow Admin UserProfile-read endpoint claim | Minor |

## Optional Suggestions

- Add `Achievement.Category` enum — not required for MVP; for consideration only.

## Verdict

**CHANGES REQUIRED**

All 11 findings must be resolved before implementation begins. Finding 4 (self-dealing prevention) is a blocker and must be addressed first. The remaining findings are Major/Minor classification and should be resolved through the specification resolution process.