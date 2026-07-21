# Independent Specification Review — Post-Resolution Verification

- **Reviewer:** Claude Sonnet
- **Date:** 2026-07-21
- **Mode:** Plan
- **Review type:** Independent read-only re-review
- **Verdict:** APPROVE
- **Normative status:** Non-normative AI review evidence. Accepted ADRs and
  specifications remain the source of truth.

**Reviewer role:** Independent review (read-only, per task instructions and `.clinerules/10-ai-model-routing-and-cost-control.md` review-isolation rules — no files modified)
**Reviewed:** AGENTS.md, `02-core-domain-data-model.md`, `03-api-contract.md`, `03-community-challenge-scope.md`, `01-community-privacy-rules.md`, against `02-specification-review-2026-07-21.md` and `03-specification-review-resolution.md`

## Verification of the 11 Original Findings

| #   | Finding                                                                         | Verified Status                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | UserAchievement `SourceCommunityChallengeId` + partial unique indexes + ERD fix | ✅ Correctly resolved (field, indexes, and ERD direction all confirmed)                                                                                                                                                              |
| 2   | Organizer participant endpoint                                                  | ✅ Correctly resolved (`GET .../participants`, privacy-safe fields, correct auth)                                                                                                                                                    |
| 3   | Capacity scope limited to Native registration                                   | ✅ Correctly resolved (data model + API contract consistent)                                                                                                                                                                         |
| 4   | Self-dealing prevention (**Blocker**)                                           | ✅ Resolved for CompletionCode redemption and Admin claim review — but see **Minor M4** below regarding Evidence Claim submission timing                                                                                             |
| 5   | Pending claim withdrawal = permanent delete                                     | ✅ Correctly resolved; no `Withdrawn` status introduced                                                                                                                                                                              |
| 6   | Challenge finalization via `BackgroundService`                                  | ✅ Correctly resolved; Hangfire explicitly rejected                                                                                                                                                                                  |
| 7   | Small-community suppression applied to Challenge/Communities Leaderboard        | ✅ Correctly resolved, including SignalR payload suppression                                                                                                                                                                         |
| 8   | `LastCommunityChangeAt` added to community identity data spec                   | ✅ Correctly resolved                                                                                                                                                                                                                |
| 9   | CommunityChallenge ownership clarified                                          | ✅ Correctly resolved, consistent across all three docs                                                                                                                                                                              |
| 10  | Quest archive preconditions                                                     | ✅ Correctly resolved, consistent in both docs                                                                                                                                                                                       |
| 11  | Admin UserProfile-read endpoint narrowed                                        | ⚠️ **Partially resolved** — data model ownership table was correctly narrowed, but the claimed explicit clarifying note in `03-api-contract.md` ("no general Admin UserProfile-read endpoint exists") is **not present** in the file |

## Verification of the 10 Follow-up Human Audit Items

Items 1, 2, 3, 5, 6, 7, 8, 9, 10 all verified as correctly and consistently resolved across the reviewed documents.

**Item 4 (Nullable Mermaid ERD cardinality notation) — ⚠️ Only partially resolved.**
In `02-core-domain-data-model.md` §2, the `UserProfile }o--o| Region` line correctly uses optional (`o|`) notation for the nullable `HomeCommunityRegionId` FK. However, two other lines explicitly labeled `(nullable)` still use the mandatory `||` symbol instead of the optional `o|`:

- `Region ||--o{ Quest : "LocationRegionId (nullable)"` — should be `Region o|--o{ Quest`
- `Region ||--o{ XpTransaction : "CommunityRegionIdAtAward (nullable)"` — should be `Region o|--o{ XpTransaction`

This is a self-contradiction within the same diagram (text annotation says "nullable" while the crow's-foot symbol asserts "exactly one"). The authoritative field tables in §3.4 and §3.10 correctly show these columns as nullable (`uuid?`), so this is a **diagram-only** inconsistency, not a functional/behavioral ambiguity.

## Additional Issues Found (not in either prior review)

**M3 — API contract omits edit-restriction error conditions for Community Challenges.**
`03-api-contract.md` §2.13 "Important error conditions" lists only Create-time errors (409 duplicate Active challenge, 400 non-LocalArea region). It does not enumerate the 409 Conflict conditions for the PATCH edit-restriction rules (fields immutable once `PeriodStart` arrives or contribution exists; target-reduction forbidden) that are clearly documented in `03-community-challenge-scope.md` §3.1 and `02-core-domain-data-model.md` §3.13. An implementer reading only the API contract would miss these constraints.

**M4 — Evidence Claim self-dealing enforcement point is unspecified.**
The ownership/transaction-boundary rules broadly state an Organizer "cannot receive a Verified Completion" for their own quest, and this is explicitly enforced with a documented 409 for CompletionCode redemption (§2.8) and Admin claim review (§2.16). However, `03-api-contract.md` §2.9 (Evidence Claims submission) has **no corresponding error condition** for an Organizer submitting an Evidence Claim against their own Quest. It's unclear whether this should be rejected at submission time or only at approval time (which would still be blocked, just later and more confusingly for the Organizer). Since Completion-lifecycle entities are already gated by the UNDECIDED list in §11 of the core domain doc, this is a good candidate to fold into that same pre-implementation decision list, but it is not currently captured there.

## Classification Summary

| Severity | Count | Items                                                                                                                                                                                                                                                                                                  |
| -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Blocker  | 0     | —                                                                                                                                                                                                                                                                                                      |
| Major    | 0     | —                                                                                                                                                                                                                                                                                                      |
| Minor    | 4     | M1 (ERD nullable notation partially fixed), M2 (Finding 11 API-contract note missing), M3 (missing edit-restriction error conditions in API contract §2.13), M4 (Evidence Claim self-dealing timing unspecified)                                                                                       |
| Optional | 1     | Confirm whether `01-community-privacy-rules.md`'s `Date: 2026-07-20` header should be refreshed given cross-references from the 2026-07-21 resolution (likely a non-issue — the threshold/suppression content appears to predate the review and was only _referenced_, not edited, by Finding 7's fix) |

## Assessment Against Focus Areas

- **Unresolved blockers:** None. The original Blocker (Finding 4, self-dealing) is resolved for its two originally-flagged paths (CompletionCode redemption, Admin claim review).
- **Specification contradictions:** One real contradiction found (M1 — ERD text vs. symbol for two relationships). Not behavior-affecting since field tables are authoritative and correct.
- **Accidental scope expansion:** None found. Both explicitly rejected Optional suggestions (Hangfire, `Withdrawn` status) remain correctly absent from all documents.
- **Security/privacy risks:** None new. Small-community suppression, evidence privacy, and self-dealing rules are consistently applied. M4 is a documentation completeness gap, not a currently-exploitable risk, since Completion entities aren't implemented yet and are separately gated.
- **Implementation readiness:** Specifications are ready for Foundation/Regions/Auth slice work. The Completion slice remains correctly gated behind the §11 UNDECIDED list; I recommend adding the M4 question to that same gate before Completion entities are built.

## Verdict

**APPROVE**

Rationale: All 11 original findings and 10 follow-up audit items were checked individually against the current document text. Zero Blockers and zero Majors remain unresolved. The four Minor items identified (M1–M4) are documentation completeness/consistency gaps that do not block the currently-approved implementation slices (Foundation, Regions, Auth) and do not introduce security or scope risk. They should be tracked as lightweight follow-up corrections — ideally M4 folded into the existing §11 UNDECIDED gate before the Completion slice begins — but do not warrant blocking overall specification acceptance.