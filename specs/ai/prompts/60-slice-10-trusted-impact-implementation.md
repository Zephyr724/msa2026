# Prompt 60 — Slice 10 Trusted Impact Implementation

- **Date:** 2026-07-27
- **Implementation owner:** Codex
- **Review model:** Kimi K3

## Reconstructed implementation instruction

Implement Slice 10 on `codex/feat/slice-10-trusted-impact` after Slice 9.

The human explicitly approved:

1. additive migrations for Evidence Claim and later Community Challenge data;
2. the later Quest coordinate model;
3. the later Google Maps and SignalR client dependencies;
4. required email confirmation with 24-hour confirmation tokens and
   45-minute password-reset tokens;
5. exclusion of Google OAuth/account linking from Slice 10.

For Slice 10:

- implement private Evidence Claim submission, owner history/detail,
  pending-only update/withdraw, Admin queue/detail/approve/reject, reviewer
  self-review prevention, HTTPS-only evidence URLs, atomic XP/progression/
  achievement award on approval, and 90-day sensitive-evidence purge;
- implement Self-reported Completion without XP, achievements, streak, or
  leaderboard contribution;
- broaden Passport completion history with precedence Verified, Pending
  EvidenceClaim, SelfReported, latest Rejected;
- implement confirmation/resend, forgot/reset/change password using ASP.NET
  Core Identity, non-enumerating responses, CSRF and rate limiting, Mailpit
  only in Development, and no production email-provider claim;
- add responsive member, Passport, Admin Review, and account-lifecycle UI
  consistent with the Slice 9 Kiwimpact visual system;
- add focused frontend, unit, PostgreSQL persistence, API, migration, privacy,
  and security tests;
- run applicable full gates;
- create a truthful completion report before independent K3 review;
- preserve and exclude `.playwright-mcp/`, `docs/UI/`, and
  `figma-make-1.jpeg` from the Slice commit.

Do not weaken HttpOnly cookie authentication, antiforgery, server-side role
checks, ownership enforcement, evidence privacy, or server-authoritative XP.
