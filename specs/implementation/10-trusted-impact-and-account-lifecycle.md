# Slice 10 — Trusted Impact and Account Lifecycle

- **Status:** Approved for implementation
- **Date:** 2026-07-27
- **Risk:** High
- **Owner:** Codex
- **Reviewer:** Kimi K3 (independent, read-only)

## 1. Approved scope

### 10A — Trusted completion persistence and API

- Add `EvidenceClaimDetail` with the accepted 1:1 ownership, privacy,
  review, and 90-day purge fields.
- Add the accepted partial unique indexes for one pending evidence claim and
  one self-reported completion per member and Quest.
- Implement member evidence-claim create/list/detail/update/withdraw.
- Implement self-reported completion creation.
- Implement Admin pending-claim list/detail/approve/reject.
- Approval creates the Verified completion reward transaction, progression,
  and milestone achievements atomically.
- Self-reported completions never create XP, achievements, streak, or
  leaderboard contributions.
- Broaden Passport completion history using the accepted precedence:
  Verified, Pending EvidenceClaim, SelfReported, latest Rejected.
- Purge reviewed evidence after 90 days using a bounded hosted service.

### 10B — Trusted completion UI

- Add Evidence Claim and Self-report actions to eligible Quest details.
- Add member claim history and statuses to the Passport.
- Add an Admin Review queue and evidence-review detail workflow.
- Preserve private evidence: only the claimant and Admin may read it.

### 10C — Email/password account lifecycle

- Require confirmed email for normal password login.
- Implement confirmation, resend, forgot/reset password, and authenticated
  change-password flows.
- Use ASP.NET Core Identity token providers.
- Confirmation token lifetime: **24 hours**.
- Password reset token lifetime: **45 minutes**.
- Use non-enumerating resend and forgot-password responses.
- Send development email through Mailpit only; production provider remains a
  deployment decision.
- Google login and account linking remain outside Slice 10.

## 2. Security and behaviour boundaries

- Evidence URLs must be absolute HTTPS URLs. The backend never fetches or
  previews the URL and never logs its value.
- An Organizer cannot submit evidence for a Quest they own.
- Native Quest claims require an active participation; External and
  NoneRequired claims do not.
- An Admin cannot review their own claim.
- Reviewed claims cannot be edited or withdrawn.
- Reset and confirmation tokens are encoded for URLs and are never logged.
- Password change requires the current password.
- State-changing requests retain the accepted antiforgery model.

## 3. Approved schema change

- Add `EvidenceClaimDetails`.
- Extend `QuestCompletions` with the accepted Pending, Rejected, and
  SelfReported enum values and partial unique indexes. Enum values are stored
  as text and require no column-type change.

## 4. Verification and evidence

- Targeted unit, PostgreSQL persistence, API, and frontend component tests.
- Full applicable frontend and backend gates.
- Implementation prompt and completion report.
- One independent Kimi K3 review after evidence documents exist.
- One bounded correction pass for original Blocker/Major findings.

## 5. Explicit exclusions

- Google login/account linking.
- Production email-provider selection.
- Community challenge, maps, community leaderboards, share card, weekly
  streak, and SignalR (Slice 11).
