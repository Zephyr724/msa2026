# Slice 12 — Figma Experience Closure

## Status

Accepted for implementation by the product owner on 2026-07-27.

## Goal

Close the remaining experience gap between the accepted Slice 9–11 product
behaviour and the local Figma Make MVP reference without inventing new product
domains. Slice 12 composes the already implemented authoritative APIs into the
missing member-facing screens and states.

The local reference under `docs/UI/Kiwimpact MVP UI Design/` defines visual
hierarchy and interaction intent. Accepted specifications and production data
contracts remain authoritative for behaviour, privacy, security, and wording.

## 12A — Share Card Builder

- Add an authenticated, dedicated Share Card Builder route linked from the
  Passport.
- Load real Passport completion history and allow selection from verified
  completions only.
- Provide a prominent square live preview, visual-theme and overlay controls,
  and an opt-in display-name toggle.
- Export a 1080 × 1080 PNG client-side.
- Offer Web Share when supported and a clear download fallback otherwise.
- Use only repository-owned imagery and existing frontend dependencies.
- Never include Home Community, precise location, email, user ID, evidence,
  claim text, or review notes.
- When no verified completion exists, render a useful empty state linking to
  My Quests and Passport rather than creating demo data.

## 12B — Full Passport and member momentum composition

- Complete the already accepted authenticated
  `GET /api/v1/users/me/passport` summary route.
- Complete the already accepted authenticated
  `GET /api/v1/users/me/passport/community-participation` route.
- Passport summary exposes only the caller's display identity, progression,
  truthful verified/self-reported/pending counts, optional Home Community
  label under the existing preference, and verified impact grouped by Quest
  category. Category output is an aggregate, not a fictional target or
  completion percentage.
- Community Participation groups historical verified contributions by
  `XpTransaction.CommunityRegionIdAtAward`, includes communities since
  departed, counts challenges actually contributed to, and counts
  challenge-sourced achievements. Null-attributed XP is excluded.
- Recompose the authenticated Home experience around real progression,
  verified weekly streak, Home Community, and Community Challenge data.
- Keep the public landing journey and complete Quest catalogue fallback.
- Add clear links to Mission Board, Passport, community settings, and
  leaderboards.
- Present Community Challenges on Home without exposing Admin controls there.
- Retain the full community-management and challenge-management behavior on
  their existing pages.
- Refine Passport layout so progress, community identity, streak, achievements,
  claims, history, and Share Card entry follow the Make reference hierarchy.

## 12C — Mission Board state convergence

- Replace the participation-only Mission Board presentation with these
  member-facing states composed from existing authoritative reads:
  - Active: joined Quests that have not started yet, including Quests whose
    schedule is still to be confirmed.
  - Ready to Complete: active joined Quests whose start time has arrived and
    that have no final completion.
  - Under Review: pending evidence claims.
  - Completed: verified and self-reported Passport records.
- A rejected evidence claim returns the joined Quest to Ready to Complete and
  must be labelled truthfully; it is never presented as verified.
- When a Quest has multiple evidence attempts, the newest claim is
  authoritative for state classification.
- Load the caller's complete de-duplicated Passport history before
  classification. If paginated reads are incomplete or change during loading,
  fail closed instead of treating missing completion rows as Ready.
- Preserve access to cancelled participation history.
- Do not infer XP, achievements, review decisions, or completion verification.
- Provide responsive tabs, empty/error/loading states, and direct actions to
  the relevant Quest, Passport, or Share Card Builder.

## Implementation boundaries

- No database schema change. The two Passport reads are the unimplemented
  portion of the accepted API contract, not a new persistence model.
- No new package or major technology.
- No authentication, authorization, ownership, privacy-threshold, or
  antiforgery change.
- No hard-coded demo member data.
- No seasons, leagues, social feed, chat, Google OAuth, account linking,
  virtual economy, or environmental outcome claims.
- REST queries remain authoritative; SignalR remains invalidation-only.

## Verification

- Targeted component and unit tests cover Share Card selection/privacy/export,
  Home member composition, and Mission Board state classification.
- Run all applicable frontend gates from `AGENTS.md`.
- Run backend gates only if backend production code changes.
- Record the implementation prompt and completion report.
- Obtain one independent Kimi K3 read-only review after evidence documents
  exist, followed by at most one bounded correction pass for original
  Blocker/Major findings.
