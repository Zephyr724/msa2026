# Implementation Readiness Audit

- Date: 2026-07-21
- Model: Claude Sonnet
- Mode: Plan
- Status: Completed
- Final verdict: READY FOR DOCUMENTATION AND SLICE 0

> This is an AI review record and is not a normative source of product or
> architecture requirements. Accepted decisions are recorded in the canonical
> product, architecture, security, and ADR documents.

Plan Created

Revised Readiness Audit (Post-Decision)

1. Corrected Canonical Entity List
   Entity MVP Notes
   ApplicationUser Yes Identity-owned
   UserProfile Yes HomeCommunityRegionId, ShowCommunityOnPassport
   Region Yes Unchanged
   Quest Yes Unchanged
   QuestImage Yes Now required. QuestId, URL/asset ref, AltText, SortOrder, IsCover, CreatorName, SourceUrl, LicenceNote. Owner: Organizer (own quests) / Admin (all). Not evidence.
   QuestParticipation Yes Required for Native; optional for External (Track in My Quests); not used for NoneRequired
   QuestCompletion (canonical) Yes Replaces separate CompletionClaim/SelfReportedCompletion. Method {CompletionCode, EvidenceClaim, SelfReported}; Status {Pending, Verified, Rejected, SelfReported}. FK: UserId, QuestId (direct, not participation-dependent); ParticipationId nullable.
   EvidenceClaimDetail (new, 1:1) Yes Only exists when Method=EvidenceClaim. Description, EvidenceUrl, UserDeclaration, ReviewNote, ReviewedBy, ReviewedAt, EvidencePurgeDueAt, EvidencePurgedAt. Keeps purge job scoped to one table.
   CompletionCode Yes QuestId, hashed code, ValidFrom/ValidTo, IsActive/Revoked. Reusable — no per-code single-redemption state.
   XpTransaction Yes SourceCompletionId unique FK → QuestCompletion (idempotency key, not UserId+QuestId). CommunityRegionIdAtAward nullable (snapshot).
   Achievement / UserAchievement Yes Catalog content deferred; schema unaffected
   CommunityChallenge Yes LocalAreaRegionId (Region, Type=LocalArea), PeriodStart/PeriodEnd (monthly), TargetType (VerifiedCompletionCount only for MVP), TargetValue, RewardAchievementId (nullable) or RewardBadgeCode (string), Status.
   CommunityChallengeContribution Not created Progress derived by querying XpTransaction (region + period), per decision
2. Corrected Relationship Rules
   QuestCompletion.UserId/QuestId are the authoritative keys; ParticipationId is an optional link, not a dependency — Evidence Claims and Self Reports may exist with no Participation row.
   CompletionCode redemption: each successful redemption inserts a new Verified QuestCompletion (Method=CompletionCode); the code itself carries no per-user redemption flag (application layer still enforces one verified completion per user/quest via the XpTransaction/QuestCompletion uniqueness described below).
   Only one XpTransaction may exist per QuestCompletion (SourceCompletionId unique) — this is the reward-idempotency boundary, not (UserId, QuestId), since repeatable Quest instances are not excluded.
   Recommend a complementary unique partial index on QuestCompletion(UserId, QuestId) WHERE Status = 'Verified' only if the product spec confirms a Quest cannot be completed twice by the same user; otherwise omit and rely solely on SourceCompletionId. This is a small remaining product clarification, not a structural blocker (see §4).
   CommunityChallenge: at most one Active row per LocalAreaRegionId — enforced via a partial unique index on (LocalAreaRegionId) WHERE Status = 'Active'.
   Challenge progress = COUNT of Verified QuestCompletion joined to XpTransaction where CommunityRegionIdAtAward = LocalAreaRegionId and XpTransaction.CreatedAt within [PeriodStart, PeriodEnd]. Fully derived — no contribution table needed.
   Passport now has two sections: Completion History (all QuestCompletion rows) and Community Participation (active/past CommunityChallenge progress for the user's community-attributed XP only) — these must use distinct queries/DTOs.
   Communities leaderboard mode: ranks Regions (LocalArea, and optionally AdministrativeArea rollups) by verified completions / active contributors, plus raw totals — a read-only aggregate query, no new entity.
3. Proposed Document Outlines
   specs/architecture/02-core-domain-data-model.md — ERD (Quest, QuestImage, QuestParticipation, QuestCompletion, EvidenceClaimDetail, CompletionCode, XpTransaction, Achievement, UserAchievement, CommunityChallenge); field tables per entity; FK/constraint list (unique indexes, Restrict delete behavior for Region FKs); ownership boundary matrix; layering notes (Core/Infrastructure split) mirroring 01-domain-model-region.md's format.

specs/architecture/03-api-contract.md — full /api/v1 surface grouped as in this audit's §4 (original), including new GET /leaderboards/communities; request/response purpose only (no DTO code); antiforgery token-issuance flow (endpoint, header, refresh trigger); pagination/error conventions; explicit error-condition table per endpoint.

specs/product/03-community-challenge-scope.md — CommunityChallenge product rules exactly as approved (one active monthly challenge/LocalArea, automatic attribution via XP snapshot, no manual join, single reward Achievement/Badge, no currency/trading), Passport Community Participation section definition, and explicit exclusions (seasons, leagues, editable scoring).

Existing document requiring update for Community comparison: specs/product/02-community-identity-and-gamification-scope-update.md §3 ("Community Progress Metrics") — currently frames regional comparison as a future capability; this section must be revised to state that a read-only Communities leaderboard mode (ranked by completions/active contributor) is now an accepted MVP-lite requirement, referencing the ranking metric and exclusions above.

4. Genuinely Remaining Items (non-blocking for Slice 0–3)
   Whether a single Quest instance can be verified-completed more than once by the same user (affects whether an additional unique index beyond SourceCompletionId is needed) — resolve while drafting doc 02, not a human-approval blocker.
   Achievement catalog content — explicitly deferred by the human decision; must land before the Passport/Achievement slice only.
   Exact antiforgery token-issuance endpoint/header refresh behavior — resolve while drafting doc 03; needed before Slice 3 (Auth) completes, not before it starts.
   RewardBadgeCode representation (free-text vs. small enum) — minor, resolve in doc 03/02 drafting.
   None of these require further human product decisions; they are drafting-level details for the approved documents.

5. Earliest Vertical Slices After Document Approval
   Slice 1 (Foundation/health check) and Slice 2 (Regions + public Quest read) — can start immediately; unaffected by the new documents (Region model already fully specified; Quest read-only fields are largely stable).
   Slice 3 (Authentication + Profile) — can start immediately in parallel with document drafting; only needs the antiforgery flow detail before completion, not before starting.
   Slice 4 (Organizer/Admin Quest CRUD) onward — must wait for 02-core-domain-data-model.md and 03-api-contract.md to be drafted and accepted, since Quest now includes QuestImage and the completion/XP model materially changed.
   Verdict
   READY FOR DOCUMENTATION AND SLICE 0

6. A Member may receive only one Verified Completion per Quest in the MVP.

7. XpTransaction.SourceCompletionId is unique.

8. Community Challenge rewards use RewardAchievementId only.
   Do not create RewardBadgeCode.

9. Passport Community Participation includes historical contributions
   according to CommunityRegionIdAtAward, even after the Member changes
   Home Community.

Conditional rules applied:
workspace:.clinerules/04b-auth-security.md, workspace:.clinerules/04c-dependency-security.md, workspace:.clinerules/04d-runtime-security.md

Final Consolidated Readiness State
All four clarifications resolve the remaining open items from the previous revision.

Updated Constraints
QuestCompletion: add partial unique index (UserId, QuestId) WHERE Status = 'Verified' — enforces "one Verified Completion per Quest per Member." This sits alongside (not instead of) the XpTransaction.SourceCompletionId unique constraint; together they form the full reward-idempotency boundary (one completion → one XP transaction, and only one verified completion per user/quest).
XpTransaction.SourceCompletionId: confirmed unique FK → QuestCompletion.Id.
CommunityChallenge: drop RewardBadgeCode entirely. Field is RewardAchievementId (nullable FK → Achievement.Id) only. Simplifies both entity 02 doc and API contract — no free-text badge representation to design.
Passport Community Participation: query must use XpTransaction.CommunityRegionIdAtAward (the award-time snapshot) with no current-HomeCommunityRegionId filtering or re-attribution — a Member's historical contributions to a since-departed community remain visible in that section permanently. This is consistent with the "no retroactive reattribution" rule already accepted in ADR-0008 and simply confirms Passport read-side behavior matches ledger truth.
Remaining Items List — Now Resolved
Of the four "genuinely remaining" items from the prior revision:

✅ Resolved — single-verified-completion rule confirmed; unique partial index added to doc 02 outline.
✅ Resolved — confirmed as originally proposed.
➖ Achievement catalog content — still explicitly deferred by design (non-blocking, needed only before the Passport/Achievement slice).
➖ Antiforgery token-issuance flow detail — still a drafting-level item for 03-api-contract.md, non-blocking for Slice 0–2.
✅ Resolved — RewardBadgeCode removed from scope.
✅ Resolved — Passport historical attribution behavior confirmed.
No further human product decisions are outstanding. The two remaining non-blocking items (Achievement catalog, antiforgery flow detail) are drafting tasks to complete while writing 02-core-domain-data-model.md and 03-api-contract.md, not approval gates.

Document Outlines — No Changes Needed
The three approved document outlines from the previous revision stand as written, with these two constraint refinements folded into 02-core-domain-data-model.md's constraint table and 03-community-challenge-scope.md's reward-field definition.

Verdict
READY FOR DOCUMENTATION AND SLICE 0

Conditional rules applied:
workspace:.clinerules/04b-auth-security.md, workspace:.clinerules/04c-dependency-security.md, workspace:.clinerules/04d-runtime-security.md

Plan Created

Final Consolidated Readiness State
All four clarifications resolve the remaining open items from the previous revision.

Updated Constraints
QuestCompletion: add partial unique index (UserId, QuestId) WHERE Status = 'Verified' — enforces "one Verified Completion per Quest per Member." This sits alongside (not instead of) the XpTransaction.SourceCompletionId unique constraint; together they form the full reward-idempotency boundary (one completion → one XP transaction, and only one verified completion per user/quest).
XpTransaction.SourceCompletionId: confirmed unique FK → QuestCompletion.Id.
CommunityChallenge: drop RewardBadgeCode entirely. Field is RewardAchievementId (nullable FK → Achievement.Id) only. Simplifies both the doc 02 entity table and doc 03 API contract — no free-text badge representation to design.
Passport Community Participation: query must use XpTransaction.CommunityRegionIdAtAward (the award-time snapshot) with no current-HomeCommunityRegionId filtering or re-attribution — a Member's historical contributions to a since-departed community remain visible in that section permanently. This is consistent with the "no retroactive reattribution" rule already accepted in ADR-0008 and simply confirms Passport read-side behavior matches ledger truth.
Remaining Items — Now Resolved
Of the four "genuinely remaining" items from the prior revision:

✅ Resolved — single-verified-completion rule confirmed; unique partial index added to doc 02 outline.
✅ Resolved — confirmed as originally proposed.
➖ Achievement catalog content — still explicitly deferred by design (non-blocking; needed only before the Passport/Achievement slice).
➖ Antiforgery token-issuance flow detail — still a drafting-level item for 03-api-contract.md, non-blocking for Slice 0–2.
✅ Resolved — RewardBadgeCode removed from scope.
✅ Resolved — Passport historical attribution behavior confirmed.
No further human product decisions are outstanding. The two remaining non-blocking items (Achievement catalog, antiforgery flow detail) are drafting tasks to complete while writing 02-core-domain-data-model.md and 03-api-contract.md, not approval gates.

Document Outlines
The three approved document outlines from the previous revision stand as written, with these two constraint refinements folded into 02-core-domain-data-model.md's constraint table and 03-community-challenge-scope.md's reward-field definition (single RewardAchievementId, no badge field).

Verdict
READY FOR DOCUMENTATION AND SLICE 0

This concludes the readiness audit. Next step for a human/DeepSeek task would be drafting the three approved documents (specs/architecture/02-core-domain-data-model.md, specs/architecture/03-api-contract.md, specs/product/03-community-challenge-scope.md) plus updating specs/product/02-community-identity-and-gamification-scope-update.md §3, followed by an independent Claude review before Slice 4+ implementation begins.
