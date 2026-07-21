# Kiwimpact Completion Lifecycle Decision Resolution Task

- **Target agent:** DeepSeek V4 Pro through Cline
- **Mode:** Act
- **Task type:** Documentation-only specification update
- **Date:** 2026-07-21
- **Human decision status:** APPROVED
- **Expected final state:** Completion lifecycle decision gate resolved

## 1. Objective

Apply the four human-approved Completion lifecycle decisions to the accepted
domain model and API contract.

This task updates specifications only. It must not implement Completion
entities, endpoints, migrations, services, UI, or tests.

## 2. Approved Decisions

The human has approved the following rules:

1. A Member may have at most one Pending Evidence Claim for the same Quest.
2. A Member may have at most one SelfReported completion for the same Quest.
3. A SelfReported record is not mutated or deleted when later verification
   occurs. Verification creates or uses a separate verification record.
   Passport completion history displays one primary record per Quest using:
   `Verified > Pending EvidenceClaim > SelfReported > latest Rejected
   EvidenceClaim`.
4. An Organizer who created an Organizer-owned Quest is rejected at Evidence
   Claim submission time with `409 Conflict`.

These decisions are final for the MVP unless the human explicitly changes
them.

## 3. Hard Scope

### Required files

Modify:

```text
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/ai/reviews/03-specification-review-resolution.md
```

Also inspect and update an existing directly relevant testing or Passport
specification only if it contains conflicting behavior.

Do not create a new testing document when an equivalent existing document
already exists.

### Forbidden

Do not:

- modify `/frontend` or `/backend`;
- create entities, controllers, DTOs, services, migrations, tests, or UI;
- install dependencies;
- change unrelated product scope;
- alter the existing Claude review evidence;
- commit, push, merge, rebase, reset, clean, or switch branches without
  explicit approval;
- begin Slice 0 or the Completion slice.

## 4. Before Editing

Run and report:

```bash
git branch --show-current
git status --short
```

Stop if unrelated uncommitted changes exist.

Read:

```text
AGENTS.md
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/ai/reviews/03-specification-review-resolution.md
```

Search relevant specifications for:

```text
UNDECIDED
Pending Evidence Claim
SelfReported
Passport
Completion History
Organizer-owned Quest
```

---

# Part A — Core Domain Model

## 5. Replace the Deferred Decision Section

In:

```text
specs/architecture/02-core-domain-data-model.md
```

replace:

```text
## 11. Deferred Completion-Lifecycle Decisions
### UNDECIDED — required before Completion slice
```

with:

```md
## 11. Resolved Completion-Lifecycle Decisions

The following Completion lifecycle decisions are approved for the MVP.
DeepSeek and other implementation agents must implement these rules exactly
and must not select alternative behavior without new human approval.
```

Replace the four undecided questions with the following accepted rules.

### 11.1 One Pending Evidence Claim per Member and Quest

```md
- A Member may have at most one `Pending` Evidence Claim for the same Quest.
- Enforce this with a partial unique index on `(UserId, QuestId)` where
  `Method = 'EvidenceClaim' AND Status = 'Pending'`.
- A second claim submission while a Pending claim exists returns
  `409 Conflict`.
- The Member edits the existing Pending claim through the existing update
  endpoint.
- Withdrawing the Pending claim permanently deletes it and releases the unique
  slot.
- After a claim is Rejected, the Member may submit a new Evidence Claim.
- Multiple historical Rejected claims are permitted.
```

### 11.2 One SelfReported Completion per Member and Quest

```md
- A Member may have at most one SelfReported completion for the same Quest.
- Enforce this with a partial unique index on `(UserId, QuestId)` where
  `Method = 'SelfReported' AND Status = 'SelfReported'`.
- A second SelfReported submission for the same Quest returns `409 Conflict`.
- Repeatable Quest completion remains deferred until `QuestOccurrence` is
  introduced.
```

### 11.3 SelfReported and Later Verification

```md
- A SelfReported completion may coexist with a Pending, Rejected, or Verified
  verification record for the same Member and Quest.
- A SelfReported record is not promoted, mutated, or deleted when a Member
  later submits an Evidence Claim or redeems a Completion Code.
- A later Verified completion remains a separate `QuestCompletion` and is the
  only record that may create an `XpTransaction`.
- Passport completion history displays one primary record per Quest using this
  precedence:
  1. Verified;
  2. Pending EvidenceClaim;
  3. SelfReported;
  4. latest Rejected EvidenceClaim.
- Where more than one Rejected Evidence Claim exists, use the record with the
  latest `CreatedAt`.
- Full Evidence Claim history remains available through the claim-history
  endpoints and is not removed by Passport deduplication.
```

### 11.4 Organizer-Owned Quest Evidence Claim

```md
- An Organizer who created an Organizer-owned Quest may not submit an Evidence
  Claim for that Quest.
- Reject the submission at
  `POST /api/v1/quests/{questId}/claims` with `409 Conflict`.
- Do not persist a Pending `QuestCompletion` or `EvidenceClaimDetail` for the
  rejected request.
- This is the earliest enforcement point for the existing rule that an
  Organizer cannot receive a Verified Completion or XP from their own Quest.
- This restriction does not prevent the Organizer from completing Quests
  created by another Organizer or Admin.
```

Remove all wording that says these four decisions remain `UNDECIDED` or block
the Completion slice.

## 6. Update QuestCompletion Business Rules

In §3.7, add concise rules confirming:

```md
- At most one Pending Evidence Claim per `(UserId, QuestId)`.
- At most one SelfReported completion per `(UserId, QuestId)`.
- SelfReported and verification records may coexist as separate rows.
- Passport deduplication is a read-model rule and does not delete or merge
  canonical completion records.
```

## 7. Update Constraint and Index Summary

In §5.1, add:

| Table | Constraint/Index | Type | Purpose |
|---|---|---|---|
| QuestCompletion | `(UserId, QuestId) WHERE Method = 'EvidenceClaim' AND Status = 'Pending'` | Partial unique index | At most one Pending Evidence Claim per Member per Quest |
| QuestCompletion | `(UserId, QuestId) WHERE Method = 'SelfReported' AND Status = 'SelfReported'` | Partial unique index | At most one SelfReported completion per Member per Quest |

Keep the existing Verified-completion partial unique index.

## 8. Update Transaction and Authorization Rules

In §7, add:

```md
- Organizer-owned Quest Evidence Claim submission is rejected before
  persistence with `409 Conflict`.
```

Do not create a transaction or database row for the rejected request.

## 9. Update Verification Checklist

Add checks for:

```md
- [ ] Partial unique index prevents duplicate Pending Evidence Claims
- [ ] Partial unique index prevents duplicate SelfReported completions
- [ ] SelfReported and Verified records may coexist without duplicate XP
- [ ] Passport displays one primary completion per Quest using the accepted
      precedence
- [ ] Organizer-owned Quest Evidence Claim submission is rejected before
      persistence
```

---

# Part B — API Contract

## 10. Update Evidence Claims

In:

```text
specs/architecture/03-api-contract.md
```

under §2.9 Evidence Claims, add these error conditions:

```md
- Submit: `409` if a Pending Evidence Claim already exists for the same Member
  and Quest. The Member must update or withdraw the existing Pending claim.
- Submit: `409` if the authenticated user is the Organizer who created the
  Organizer-owned Quest. No claim record is persisted.
- A Rejected claim does not prevent a new claim submission.
```

Keep the existing `409` for an existing Verified completion.

## 11. Update Self Reporting

Under §2.10 Self Reporting, add:

```md
- `409` if a SelfReported completion already exists for the same Member and
  Quest.
- A SelfReported record may coexist with a Pending, Rejected, or Verified
  verification record.
- A later verification does not mutate or delete the SelfReported record.
```

Keep the existing rule that SelfReported completion awards no XP.

## 12. Update Passport Completion History

Under §2.11 Passport, change the completion-history contract so that:

```md
`GET /api/v1/users/me/passport/completions` returns one primary display record
per Quest rather than every raw `QuestCompletion` row.

Precedence:

1. Verified;
2. Pending EvidenceClaim;
3. SelfReported;
4. latest Rejected EvidenceClaim.

Passport deduplication affects presentation only. Full Evidence Claim history
remains available from `GET /api/v1/users/me/claims`.
```

Remove or replace wording that says the Passport completion endpoint returns
all raw `QuestCompletion` rows.

Do not add a new Passport endpoint.

---

# Part C — Resolution Record

## 13. Update the Review Resolution

In:

```text
specs/ai/reviews/03-specification-review-resolution.md
```

append:

```md
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
```

Update any remaining sentence that says the Completion slice is gated by four
UNDECIDED decisions.

Do not change historical review verdicts.

---

# Part D — Consistency and Verification

## 14. Cross-Document Checks

Search for:

```text
UNDECIDED — required before Completion slice
multiple Pending
multiple SelfReported
all QuestCompletions
Organizer-owned Quest Evidence Claim
Method = 'EvidenceClaim'
Method = 'SelfReported'
```

Confirm:

- no current normative specification still calls the four decisions
  `UNDECIDED`;
- the two new partial unique indexes appear in both §3.7/§5.1 as appropriate;
- API `409` behavior is explicit;
- Passport returns one primary record per Quest;
- claims history still preserves all Evidence Claims;
- no source code was modified.

## 15. Completion Report

After editing:

1. report the current branch;
2. list modified files;
3. summarize the four accepted decisions;
4. run available Markdown/path/link checks;
5. show:

```bash
git status --short
git diff --stat
```

6. do not commit;
7. do not begin Slice 0 or Completion implementation;
8. end with:

```text
COMPLETION LIFECYCLE DECISIONS RESOLVED — READY FOR SPECIFICATION COMMIT
```
