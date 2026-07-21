# Implementation Readiness Audit

- **Date:** 2026-07-21
- **Model:** Claude Sonnet
- **Mode:** Plan
- **Status:** Completed
- **Final verdict:** READY FOR DOCUMENTATION AND SLICE 0

> This is an AI review record and is not a normative source of product or architecture requirements. Accepted decisions are recorded in the canonical product, architecture, security, and ADR documents.

## 1. Audit Purpose and Process

The readiness audit evaluated the state of accepted product, architecture, security, and testing specifications after ADR-0008 and the community-identity decisions. The goal was to identify structural gaps, unresolved product decisions, and missing implementation-blocking documents before beginning application implementation.

The audit was performed in Plan mode. No files were modified.

## 2. Corrected Canonical Entity List

After review of accepted specifications and the final approved decisions:

| Entity | MVP | Notes |
|--------|-----|-------|
| ApplicationUser | Yes | Identity-owned |
| UserProfile | Yes | HomeCommunityRegionId, ShowCommunityOnPassport |
| Region | Yes | Unchanged from `specs/architecture/01-domain-model-region.md` |
| Quest | Yes | Includes LocationRegionId |
| QuestImage | Yes | Required. QuestId, URL/asset ref, AltText, SortOrder, IsCover, CreatorName, SourceUrl, LicenceNote. Owner: Organizer (own quests) / Admin (all). Not evidence. |
| QuestParticipation | Yes | Required for Native; optional for External (Track in My Quests); not used for NoneRequired |
| QuestCompletion (canonical) | Yes | Replaces separate CompletionClaim/SelfReportedCompletion. Method {CompletionCode, EvidenceClaim, SelfReported}; Status {Pending, Verified, Rejected, SelfReported}. FK: UserId, QuestId (direct); ParticipationId nullable. |
| EvidenceClaimDetail (1:1) | Yes | Only exists when Method=EvidenceClaim. Keeps purge job scoped to one table. |
| CompletionCode | Yes | QuestId, hashed code, ValidFrom/ValidTo, IsActive/Revoked. Reusable — no per-code single-redemption state. |
| XpTransaction | Yes | SourceCompletionId unique FK → QuestCompletion (idempotency key). CommunityRegionIdAtAward nullable (snapshot). |
| Achievement / UserAchievement | Yes | Catalog content deferred; schema unaffected |
| CommunityChallenge | Yes | LocalAreaRegionId, monthly period, TargetType (VerifiedCompletionCount only), RewardAchievementId (nullable). |
| CommunityChallengeContribution | Not created | Progress derived from XpTransaction query |

## 3. Resolved Constraints

These product/architecture decisions were confirmed during the audit:

1. **One Verified Completion per Quest per Member (MVP):** enforced by partial unique index on `QuestCompletion(UserId, QuestId) WHERE Status = 'Verified'`.

2. **Reward idempotency:** `XpTransaction.SourceCompletionId` is unique (one XP transaction per QuestCompletion). Together with the partial unique index above, this forms the full reward-idempotency boundary.

3. **Repeatable Quest completion deferred.** Future implementation must introduce `QuestOccurrence`.

4. **QuestCompletion is the canonical completion entity.** Directly references User and Quest. ParticipationId is nullable.

5. **Native Quests require QuestParticipation.** External Quests may optionally create participation through "Track in My Quests." External completion may exist without participation.

6. **CompletionCode is reusable** by multiple eligible Members. Store hashed code, validity period, and active/revoked state. No per-code global redemption state.

7. **QuestImage is required** for MVP and separate from completion evidence.

8. **CommunityChallenge:** at most one Active per LocalArea (partial unique index). Progress derived from XpTransaction. No contribution table.

9. **Community Challenge rewards:** `RewardAchievementId` only. No `RewardBadgeCode`.

10. **Passport Community Participation:** preserves historical contributions based on `CommunityRegionIdAtAward`, including contributions to communities the Member has since left.

11. **Communities Leaderboard (MVP-lite):** read-only, ranked by `verified completions / active contributors`, with supporting totals. No seasons, leagues, or editable formulas.

12. **Small-community threshold:** 10 active ranked Members, configurable.

13. **Self-reported completions:** appear in Passport Completion History, award no XP, and do not count toward streaks, achievements, leaderboards, or Community Challenges.

## 4. Remaining Non-Blocking Items

Two items remain as drafting-level details, not approval gates:

- **Achievement catalog content** (exact list of 6–8 achievements, criteria) — explicitly deferred; needed only before the Passport/Achievement slice.
- **Antiforgery token-issuance flow detail** — resolved in `specs/architecture/03-api-contract.md` §1.6 during drafting; refined during Slice 3 (Authentication).

## 5. Document Outlines Proposed

The audit proposed three new documents and one update:

1. `specs/architecture/02-core-domain-data-model.md` — ERD, entity/field tables, enums, relationships, ownership boundaries, constraints, indexes, delete behaviours, transaction boundaries, concurrency strategy, implementation invariants.

2. `specs/architecture/03-api-contract.md` — Full `/api/v1` surface, authentication/authorization, antiforgery token flow, CORS, pagination, filtering, Problem Details, endpoint groups for all MVP features, SignalR hubs.

3. `specs/product/03-community-challenge-scope.md` — Community Challenge product rules, automatic participation, contribution rules, award-time community snapshot, progress calculation, rewards, Passport Community Participation, exclusions.

4. Update `specs/product/02-community-identity-and-gamification-scope-update.md` §3 — change Community comparison from future scope to accepted MVP-lite scope with ranking metric, supporting values, and exclusions.

## 6. Earliest Vertical Slices After Document Approval

- **Slice 1 (Foundation/health check)** and **Slice 2 (Regions + public Quest read):** can start immediately; unaffected by new documents.
- **Slice 3 (Authentication + Profile):** can start immediately; only needs antiforgery flow detail before completion.
- **Slice 4 (Organizer/Admin Quest CRUD) onward:** must wait for accepted documents, since Quest now includes QuestImage and the completion/XP model materially changed.

## 7. Final Verdict

**READY FOR DOCUMENTATION AND SLICE 0**

All structural product decisions are resolved. The approved document outlines address all identified gaps. Remaining items (Achievement catalog, antiforgery refinement) are non-blocking drafting details. Slice 0 (foundation scaffolding) and Slices 1–3 can proceed in parallel with document drafting.

This concludes the readiness audit.

---

*Conditional rules applied during audit: `workspace:.clinerules/04b-auth-security.md`, `workspace:.clinerules/04c-dependency-security.md`, `workspace:.clinerules/04d-runtime-security.md`*