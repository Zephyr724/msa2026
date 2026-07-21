# Specification Review Resolution

- **Status:** APPROVED FOR SLICE 0
- **Date:** 2026-07-21
- **Review:** 02-specification-review-2026-07-21.md
- **Purpose:** Record each Claude specification review finding, the accepted resolution, documents changed, and any deliberately rejected Optional suggestion.

## Finding 1: UserAchievement — Missing SourceCommunityChallengeId

**Claude finding:** The `UserAchievement` entity lacks a link to the originating `CommunityChallenge`. Without this, recurring monthly challenge rewards (same Achievement awarded in consecutive months) violate the current `(UserId, AchievementId)` unique constraint.

**Accepted resolution:**

- Add nullable `SourceCommunityChallengeId` (FK → `CommunityChallenge.Id`) to `UserAchievement`.
- Replace the current `(UserId, AchievementId)` unique constraint with:
  - Partial unique index on `(UserId, AchievementId)` WHERE `SourceCommunityChallengeId IS NULL` — a Member earns each non-challenge achievement at most once.
  - Partial unique index on `(UserId, AchievementId, SourceCommunityChallengeId)` WHERE `SourceCommunityChallengeId IS NOT NULL` — a Member earns each challenge-reward achievement at most once per challenge.
- Correct the Mermaid ER diagram relationship: `Achievement ||--o{ CommunityChallenge` (was inverse direction).

**Documents changed:**

- `specs/architecture/02-core-domain-data-model.md` — §3.12 UserAchievement table, §5.1 constraints, §2 Mermaid diagram

**Rejected Optional suggestions:** None.

---

## Finding 2: Missing Organizer Participant Endpoint

**Claude finding:** There is no Organizer-facing endpoint to view who has joined or completed a quest. Organizers need a participant summary for operational purposes.

**Accepted resolution:**

- Add `GET /api/v1/organizer/quests/{questId}/participants`
- Returns participation and completion summary only (participant count, completion count, completion status breakdown).
- Must never expose `EvidenceUrl`, claim description, or review evidence to Organizers.
- Authorization: Organizer (own quests) or Admin.

**Documents changed:**

- `specs/architecture/03-api-contract.md` — Add endpoint to §2.5 (Organizer/Admin Quest CRUD)

**Rejected Optional suggestions:** None.

---

## Finding 3: Capacity Enforcement Scope

**Claude finding:** The current specification implies Capacity applies uniformly to all RegistrationModes, but External and NoneRequired quests should not consume platform Capacity.

**Accepted resolution:**

- Capacity applies only to Native registration.
- For Native Quests:
  - `POST /api/v1/quests/{questId}/join` enforces Capacity.
  - Completion Code redemption and Evidence Claim submission require an existing Participation.
- For External and NoneRequired Quests:
  - Completion may exist without Participation.
  - External tracking does not consume platform Capacity.

**Documents changed:**

- `specs/architecture/02-core-domain-data-model.md` — §3.6 QuestParticipation business rules, §3.7 QuestCompletion business rules
- `specs/architecture/03-api-contract.md` — §2.7 Participation join endpoint error conditions

**Rejected Optional suggestions:** None.

---

## Finding 4: Self-Dealing Prevention

**Claude finding:** The specification permits an Organizer to earn Verified XP from their own quests and an Admin to approve their own Evidence Claims, creating a self-dealing risk.

**Accepted resolution:**

- An Organizer cannot receive a Verified Completion or XP for an Organizer-owned Quest they created.
- An Admin cannot approve or reject their own Evidence Claim.
- An Admin's claim requires review by a different Admin.

**Documents changed:**

- `specs/architecture/02-core-domain-data-model.md` — Add self-dealing business rules to §7 Transaction Boundaries and §6 Ownership Boundaries
- `specs/architecture/03-api-contract.md` — Add error conditions to §2.8 Redeem, §2.9 Claims, §2.16 Admin Review

**Rejected Optional suggestions:** None.

---

## Finding 5: Pending Evidence Claim Withdrawal Behavior

**Claude finding:** The specification describes claim withdrawal but does not define the exact persistence behavior — specifically whether to use a "Withdrawn" status or actual deletion.

**Accepted resolution:**

- `DELETE /api/v1/users/me/claims/{claimId}` permanently removes the pending `QuestCompletion` and its `EvidenceClaimDetail` (cascade).
- Evidence is removed immediately.
- Do not add a `Withdrawn` status to `CompletionStatus`.
- Only pending claims may be withdrawn; reviewed claims return 409.

**Documents changed:**

- `specs/architecture/02-core-domain-data-model.md` — §3.8 EvidenceClaimDetail business rules (clarify withdrawal = permanent delete)
- `specs/architecture/03-api-contract.md` — §2.9 Evidence Claims DELETE endpoint description (already matches; clarify permanence)

**Rejected Optional suggestions:** Rejected adding a `Withdrawn` CompletionStatus — a withdrawn claim has no retention value and the additional status complicates the state machine without product benefit.

---

## Finding 6: Community Challenge Finalization Mechanism

**Claude finding:** The specification states that challenges move to Completed/Failed at period end but does not define the mechanism.

**Accepted resolution:**

- A lightweight .NET hosted background service (`BackgroundService` implementation) periodically evaluates Active challenges whose `PeriodEnd` has passed.
- Target met → `Completed`.
- Target not met → `Failed`.
- Reward awards are performed idempotently (using the `UserAchievement` unique constraints as the guard).
- Do not introduce Hangfire or another job framework.

**Documents changed:**

- `specs/product/03-community-challenge-scope.md` — §3.1 Challenge Lifecycle (add finalization mechanism)
- `specs/architecture/02-core-domain-data-model.md` — §3.13 CommunityChallenge (add finalization note)

**Rejected Optional suggestions:** Rejected Hangfire — a simple `BackgroundService` is sufficient for periodic challenge evaluation and avoids an additional infrastructure dependency.

---

## Finding 7: Small-Community Contributor-Count Suppression

**Claude finding:** Small-community privacy protection is defined for the People Leaderboard but not consistently applied to Community Challenge progress and the Communities Leaderboard.

**Accepted resolution:**

- Apply the same small-community threshold (default 10 active ranked Members) to:
  - Community Challenge progress API (`GET /api/v1/community-challenges/{id}/progress`) — suppress exact contributor counts below threshold.
  - Communities Leaderboard API (`GET /api/v1/leaderboards/communities`) — suppress exact contributor counts for communities below threshold.
- The collective-progress response shape replaces exact counts with a privacy-safe indication.

**Documents changed:**

- `specs/product/03-community-challenge-scope.md` — §6 Privacy (add contributor-count suppression rule)
- `specs/architecture/03-api-contract.md` — §2.13 Challenge progress endpoint, §2.15 Communities Leaderboard

**Rejected Optional suggestions:** None.

---

## Finding 8: LastCommunityChangeAt Missing from Community Identity Data Spec

**Claude finding:** `UserProfile.LastCommunityChangeAt` is defined in the core domain data model but is missing from the community identity data model specification, creating a cross-document inconsistency.

**Accepted resolution:**

- Add `LastCommunityChangeAt` column to the `UserProfile` table definition in the community identity data model specification.

**Documents changed:**

- `specs/data/01-community-identity-data-model.md` — §2 UserProfile new columns

**Rejected Optional suggestions:** None.

---

## Finding 9: CommunityChallenge Ownership Ambiguity

**Claude finding:** The specification does not clearly state which roles can create and manage Community Challenges.

**Accepted resolution:**

- Guest and Member may read public aggregate data (challenge detail, progress).
- Admin creates and manages challenges (create, update, cancel).
- Organizer has no special challenge management privileges beyond Member read access.

**Documents changed:**

- `specs/product/03-community-challenge-scope.md` — §3.1 Challenge Lifecycle (clarify Admin-only create)
- `specs/architecture/03-api-contract.md` — §2.13 Community Challenges (roles already correct; add clarity note)

**Rejected Optional suggestions:** None.

---

## Finding 10: Quest Archive Preconditions

**Claude finding:** The specification does not define when a Quest can be archived, leaving the state transition ambiguous.

**Accepted resolution:**

- A Quest may be archived only when:
  - `Status = Cancelled`; or
  - `Status = Published` with `EndAtUtc` in the past.
- `Draft` quests cannot be archived (they should be published first or simply deleted).

**Documents changed:**

- `specs/architecture/02-core-domain-data-model.md` — §3.4 Quest (add archive precondition to QuestStatus business rules)
- `specs/architecture/03-api-contract.md` — §2.5 Archive endpoint (add precondition error conditions)

**Rejected Optional suggestions:** None.

---

## Finding 11: Unnecessary Admin UserProfile-Read Endpoint

**Claude finding:** The ownership boundaries table implies Admin may read UserProfile for operational purposes, which could be interpreted as requiring a general Admin user-profile-read endpoint.

**Accepted resolution:**

- Do not add a general `GET /api/v1/admin/users/{id}` endpoint unless another accepted requirement requires it.
- Admin operational access to UserProfile data is scoped to specific use cases (e.g., viewing a claim includes the claimant's display name; reviewing community metrics does not require individual profile access).
- Narrow the ownership boundary table entry to avoid implying an unqualified read endpoint.

**Documents changed:**

- `specs/architecture/02-core-domain-data-model.md` — §6 Ownership Boundaries (narrow UserProfile Admin entry)
- `specs/architecture/03-api-contract.md` — Explicitly note that no general Admin UserProfile-read endpoint exists

**Rejected Optional suggestions:** None.

---

## Resolution Summary

| #   | Finding                                                   | Status   |
| --- | --------------------------------------------------------- | -------- |
| 1   | Add SourceCommunityChallengeId to UserAchievement         | RESOLVED |
| 2   | Add Organizer participant endpoint                        | RESOLVED |
| 3   | Capacity applies only to Native registration              | RESOLVED |
| 4   | Prevent self-dealing                                      | RESOLVED |
| 5   | Pending claim withdrawal = permanent DELETE               | RESOLVED |
| 6   | Community Challenge finalization via BackgroundService    | RESOLVED |
| 7   | Small-community contributor-count suppression             | RESOLVED |
| 8   | Add LastCommunityChangeAt to community identity data spec | RESOLVED |
| 9   | Clarify CommunityChallenge ownership                      | RESOLVED |
| 10  | Quest archive preconditions                               | RESOLVED |
| 11  | Remove/narrow Admin UserProfile-read endpoint claim       | RESOLVED |

**Deliberately rejected Optional suggestions:**

- Add `Withdrawn` CompletionStatus (Finding 5) — withdrawn claims have no retention value.
- Introduce Hangfire (Finding 6) — `BackgroundService` is sufficient.
- Add `Achievement.Category` enum (Optional suggestion from review) — not required for MVP.

**Next step:** ✓ Independent re-review complete. Approved for Slice 0.

## Independent Re-review Outcome

- **Review:** `04-post-resolution-independent-review-2026-07-21.md`
- **Verdict:** `APPROVE`
- **Blockers remaining:** 0
- **Major findings remaining:** 0
- **Minor follow-up corrections:** M1–M4 applied by this documentation task.

The specification set is approved for:

- Slice 0 — Foundation;
- Regions and Public Quest Read;
- Authentication and Profile.

The Completion lifecycle specification gate is RESOLVED as of 2026-07-21.
See the appended Completion Lifecycle Decision Gate section below.

---

## Follow-up Human Documentation Audit

Date: 2026-07-21

The following additional corrections were identified during a human audit of all
specifications and are accepted for correction:

1. **Anonymous antiforgery-token issuance and Google callback semantics.**
   The CSRF token endpoint must be accessible to anonymous clients for
   pre-login browser POST operations. The Google external login callback is
   handled by ASP.NET Core middleware, not a custom REST endpoint.

2. **Evidence purge fields and retention alignment.**
   `EvidenceClaimDetail.Description` is nullable in persistence after purge but
   required by API validation when submitting a new claim. The purge job clears
   `Description`, `EvidenceUrl`, and `ReviewNote`. Retained fields after purge
   are explicitly defined. Remove undefined retained-field references
   (`SubmittedAt`, `VerificationLevel`, `XpTransactionId`).

3. **Suppression of exact contributor count and exact ratio below the privacy
   threshold.**
   Community Challenge progress and Communities Leaderboard responses below the
   configured privacy threshold return `isPrivacyProtected: true` with null
   `activeContributors` and `ratio` fields. Apply the same suppression to
   SignalR payloads.

4. **Nullable Mermaid ERD cardinality corrections.**
   Correct the ER diagram to use nullable relationship notation (`o|--o{`
   / `||--o|`) where foreign keys are nullable.

5. **CommunityChallenge public-read ownership wording.**
   Guest and Member may read public aggregate data for Community Challenges.
   Organizer has no special management privilege beyond public/member read.

6. **`LastCommunityChangeAt` migration checklist entry.**
   Add `LastCommunityChangeAt` (timestamp with time zone, nullable) to the
   community identity data model migration strategy.

7. **Half-open time intervals `[PeriodStart, PeriodEnd)`.**
   Replace inclusive-range challenge period wording with half-open intervals.
   Calendar boundaries are calculated in `Pacific/Auckland`, then converted to
   UTC for persistence and querying.

8. **Restrictions on changing an already-started Community Challenge.**
   Admin may edit region, period, target, and reward only before `PeriodStart`.
   Once `PeriodStart` has arrived, or once any eligible contribution exists,
   those competitive fields are immutable. An already-started challenge may
   only be cancelled.

9. **Organizer participant endpoint response and privacy boundaries.**
   The endpoint returns a paginated limited operational response with
   participation and completion summary fields. It must never expose email,
   HomeCommunityRegionId, EvidenceUrl, claim description, UserDeclaration,
   ReviewNote, or private profile fields.

10. **Deferred Completion-lifecycle decisions required before the Completion
    slice.**
    Four decisions are recorded as UNDECIDED and must be resolved before
    Completion entities/endpoints are implemented:

- 1. **Multiple Pending Evidence Claims.** ...
- 2. **Multiple SelfReported Completions.** ...
- 3. **SelfReported-to-Verified Transition.** ...
- 4. **Organizer-owned Quest Evidence Claim submission.** ...

  Completion entities/endpoints are implemented: multiple Pending claims per
  user/quest, multiple SelfReported completions per user/quest, and the
  SelfReported→Verified transition behaviour.

**Status:** APPROVED FOR SLICE 0

---

## Completion Lifecycle Decision Gate — Human Resolution

- **Date:** 2026-07-21
- **Status:** RESOLVED
- **Decision authority:** Human project author

The four Completion lifecycle decisions previously marked `UNDECIDED` are now
approved:

1. At most one Pending Evidence Claim per Member and Quest.
2. At most one SelfReported completion per Member and Quest.
3. SelfReported and later verification remain separate canonical records;
   Passport displays one primary record using
   `Verified > Pending > SelfReported > latest Rejected`.
4. Organizer-owned Quest Evidence Claims are rejected at submission time with
   `409 Conflict`.

The Completion lifecycle specification gate is resolved. Implementation must
follow the updated core domain model and API contract.
