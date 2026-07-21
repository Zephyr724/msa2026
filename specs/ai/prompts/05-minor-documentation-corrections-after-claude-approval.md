# Kiwimpact Minor Documentation Corrections After Claude Approval

- **Target agent:** DeepSeek V4 Pro through Cline
- **Mode:** Act
- **Task type:** Documentation-only correction
- **Date:** 2026-07-21
- **Review outcome:** Claude independent re-review returned `APPROVE`
- **Expected final state:** Specifications approved for Slice 0

## 1. Objective

Apply the four Minor corrections identified in the post-resolution Claude
review, preserve that review as AI evidence, and update the resolution status.

This task must not modify application source code and must not begin Slice 0.

## 2. Hard Scope

### Allowed files

Modify only:

```text
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/ai/reviews/03-specification-review-resolution.md
```

Create:

```text
specs/ai/reviews/04-post-resolution-independent-review-2026-07-21.md
```

### Forbidden

Do not:

- modify `/frontend` or `/backend`;
- create DTOs, controllers, entities, migrations, tests, or CI;
- install dependencies;
- change accepted product scope;
- resolve the deferred Completion-lifecycle decisions;
- introduce new architecture or infrastructure;
- commit, push, merge, rebase, reset, clean, or switch branches without
  explicit approval;
- begin Slice 0.

## 3. Before Editing

Run and report:

```bash
git branch --show-current
git status --short
```

Stop if unrelated uncommitted changes exist. Do not discard user changes.

Read:

```text
AGENTS.md
specs/architecture/02-core-domain-data-model.md
specs/architecture/03-api-contract.md
specs/ai/reviews/03-specification-review-resolution.md
```

Use the exact Claude review text supplied by the human in the current task for
the new review record. Do not reconstruct or paraphrase it.

---

# Part A — Preserve the Approved Claude Review

## 4. Create the review record

Create:

```text
specs/ai/reviews/04-post-resolution-independent-review-2026-07-21.md
```

At the top, add:

```md
# Independent Specification Review — Post-Resolution Verification

- **Reviewer:** Claude Sonnet
- **Date:** 2026-07-21
- **Mode:** Plan
- **Review type:** Independent read-only re-review
- **Verdict:** APPROVE
- **Normative status:** Non-normative AI review evidence. Accepted ADRs and
  specifications remain the source of truth.
```

Below that header, include the exact Claude review supplied by the human,
including:

- verification of the 11 original findings;
- verification of the 10 follow-up audit items;
- M1–M4;
- classification summary;
- focus-area assessment;
- final `APPROVE` verdict.

Do not change the finding wording or severity.

---

# Part B — Apply the Four Minor Corrections

## 5. Fix nullable Mermaid ERD notation

In:

```text
specs/architecture/02-core-domain-data-model.md
```

change:

```mermaid
Region ||--o{ Quest : "LocationRegionId (nullable)"
Region ||--o{ XpTransaction : "CommunityRegionIdAtAward (nullable)"
```

to:

```mermaid
Region o|--o{ Quest : "LocationRegionId (nullable)"
Region o|--o{ XpTransaction : "CommunityRegionIdAtAward (nullable)"
```

Do not change the field tables; they are already correct.

## 6. Add the missing Admin UserProfile API clarification

In:

```text
specs/architecture/03-api-contract.md
```

add a concise note under the Authorization Summary or Profile/Admin boundary:

```md
### Admin UserProfile Access Boundary

The MVP does not expose a general
`GET /api/v1/admin/users/{id}` UserProfile endpoint.

Admin access to profile-related fields is limited to explicitly authorised
operational workflows, such as displaying the claimant's display name during
Evidence Claim review. This does not grant unrestricted profile browsing.
```

Do not create a new endpoint.

## 7. Add Community Challenge PATCH error conditions

In `specs/architecture/03-api-contract.md`, under:

```text
§2.13 Community Challenges
```

add these `PATCH /api/v1/admin/community-challenges/{id}` error conditions:

```md
- `409` if Admin attempts to change region, period, target, or reward after
  `PeriodStart`.
- `409` if Admin attempts to change those competitive fields after any eligible
  contribution exists.
- `409` if Admin attempts to reduce `TargetValue` below current progress.
- After the challenge has started, cancellation is the only permitted
  state-changing Admin action.
```

Keep this consistent with:

```text
specs/product/03-community-challenge-scope.md
specs/architecture/02-core-domain-data-model.md
```

Do not introduce Draft/Scheduled challenge states.

## 8. Add the Evidence Claim self-dealing timing question to the Completion gate

In:

```text
specs/architecture/02-core-domain-data-model.md
```

under:

```text
§11 Deferred Completion-Lifecycle Decisions
UNDECIDED — required before Completion slice
```

append:

```md
4. **Organizer-owned Quest Evidence Claim submission.**
   Decide whether an Organizer who created an Organizer-owned Quest:
   - is rejected when submitting an Evidence Claim for that Quest; or
   - may submit the claim, but verification must always be rejected.

   The accepted self-dealing rule already prohibits the Organizer from
   receiving a Verified Completion or XP for their own Quest. The remaining
   decision is the earliest enforcement point and the corresponding API
   behaviour.
```

Also update the section summary so it says there are four deferred decisions,
not three.

Do not choose either behaviour in this task.

---

# Part C — Close the Review Cycle

## 9. Update the resolution record

In:

```text
specs/ai/reviews/03-specification-review-resolution.md
```

change:

```text
Status: PENDING INDEPENDENT RE-REVIEW
```

to:

```text
Status: APPROVED FOR SLICE 0
```

Add:

```md
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

The Completion slice remains gated by the four
`UNDECIDED — required before Completion slice` decisions in
`specs/architecture/02-core-domain-data-model.md`.
```

Do not change the historical verdict in:

```text
specs/ai/reviews/02-specification-review-2026-07-21.md
```

That earlier review must continue to show `CHANGES REQUIRED`.

---

# Part D — Verification

## 10. Required checks

Search for:

```text
Region ||--o{ Quest
Region ||--o{ XpTransaction
PENDING INDEPENDENT RE-REVIEW
GET /api/v1/admin/users/{id}
reduce TargetValue
Organizer-owned Quest Evidence Claim
```

Confirm:

- the two obsolete Mermaid lines are gone from the current domain model;
- no general Admin UserProfile endpoint was introduced;
- Community Challenge PATCH has all three `409` cases;
- the fourth deferred Completion decision is present;
- the old Claude review still says `CHANGES REQUIRED`;
- the new Claude review says `APPROVE`;
- the resolution status says `APPROVED FOR SLICE 0`.

## 11. Completion report

After editing:

1. report the current branch;
2. list every created and modified file;
3. summarize M1–M4;
4. run available Markdown/path/link checks;
5. show:

```bash
git status --short
git diff --stat
```

6. do not commit;
7. do not begin Slice 0;
8. end with:

```text
MINOR DOCUMENTATION CORRECTIONS COMPLETE — READY TO COMMIT SPECIFICATIONS
```
