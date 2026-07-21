# Independent Review — Completion Lifecycle Decision Gate (2026-07-21)

## Review Metadata

- Reviewer: Claude Sonnet
- Review Type: Independent specification review
- Mode: Plan mode
- Scope: Completion lifecycle decision gate only
- Files reviewed:
  - specs/architecture/02-core-domain-data-model.md
  - specs/architecture/03-api-contract.md
  - specs/ai/reviews/03-specification-review-resolution.md

## Review Rules

- No files modified.
- No implementation performed.
- Review limited to the four newly resolved Completion lifecycle decisions.
- Existing accepted specifications remain the source of truth.

---

# Verification Scope

The following four approved decisions were reviewed:

1. Pending Evidence Claim uniqueness.
2. SelfReported completion uniqueness.
3. SelfReported and Verified coexistence behaviour.
4. Organizer-owned Quest Evidence Claim rejection boundary.

---

# 1. Partial Unique Index Correctness

## Decision Reviewed

The MVP enforces:

- Maximum one Pending Evidence Claim per Member and Quest.
- Maximum one SelfReported completion per Member and Quest.

## Verification

Confirmed:

- EvidenceClaim Pending uniqueness index:


(UserId, QuestId)
WHERE Method = EvidenceClaim
AND Status = Pending


- SelfReported uniqueness index:


(UserId, QuestId)
WHERE Method = SelfReported
AND Status = SelfReported


The constraints correctly allow:

- multiple historical rejected claims;
- one verified completion;
- SelfReported and Verified coexistence.

## Result

APPROVED

---

# 2. SelfReported and Verified Coexistence

## Decision Reviewed

A SelfReported completion remains separate from later verification.

A later Verified completion:

- does not mutate the SelfReported record;
- is the only completion that can create XP.

## Verification

Confirmed:

- SelfReported gives no XP.
- Verified completion creates the XP transaction.
- `XpTransaction.SourceCompletionId` provides one-to-one XP reward idempotency.
- Verified completion uniqueness prevents duplicate verified rewards.

The design prevents duplicate XP from:

- SelfReported records;
- duplicate approval;
- repeated reward processing.

## Result

APPROVED

---

# 3. Passport Completion Precedence

## Decision Reviewed

Passport displays one primary completion record per Quest using:


Verified

Pending EvidenceClaim

SelfReported

latest Rejected EvidenceClaim


## Verification

Confirmed:

- Verified, Pending, and SelfReported records are individually unique.
- Multiple rejected claims are allowed.
- Latest rejected claim selection is deterministic under normal database
  timestamp precision.

## Minor Observation M-1

For theoretical timestamp collision cases, implementation should add a
secondary ordering key:

Example:

```sql
ORDER BY CreatedAt DESC, Id DESC

This is an implementation detail only.

No specification change required.

Result

APPROVED

4. Organizer-Owned Quest Evidence Claim Boundary
Decision Reviewed

An Organizer cannot submit an Evidence Claim for a Quest they created.

The rejection occurs during submission.

Verification

Confirmed:

API behaviour:

POST /api/v1/quests/{questId}/claims

Returns:
409 Conflict

when:

CurrentUser == Quest.CreatedBy
AND Quest is Organizer-owned

No:

QuestCompletion row;
EvidenceClaimDetail row;
review workflow entry

is created.

The rule does not prevent:

Organizers completing other users quests;
Admin-created Quest participation.
Minor Observation M-2

SelfReported endpoint does not apply the same Organizer restriction.

This is acceptable because:

SelfReported gives no XP.
No leaderboard benefit exists.
No reward abuse risk exists.

Optional future consistency review only.

Result

APPROVED

Summary
Decision	Blocker	Major	Minor
Pending Evidence Claim uniqueness	0	0	0
SelfReported uniqueness	0	0	0
SelfReported and Verified coexistence	0	0	0
Organizer Evidence Claim boundary	0	0	1
Findings
Blockers

None.

Major Issues

None.

Minor Issues
M-1 — Rejected claim timestamp tie-break

Recommendation:

Use a deterministic secondary ordering key:

CreatedAt DESC, Id DESC

Implementation detail only.

M-2 — SelfReported Organizer self-dealing

No action required.

SelfReported produces:

no XP;
no achievements;
no leaderboard progress.
Final Verdict
APPROVE

The Completion lifecycle decisions are consistent with:

domain model;
API contract;
reward idempotency;
Passport presentation rules;
self-dealing prevention requirements.

The Completion slice may proceed after normal implementation planning.