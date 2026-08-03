# Review 77 — Slice 24 Google Login and Account Linking K3 Review

- **Date:** 2026-07-31
- **Reviewer:** Kimi K3 via Kimi Code CLI
- **Session:** `session_78f085e4-adc7-4b8c-a3ec-a1ac974df12e`
- **Mode:** Independent read-only security and commit-readiness review
- **Implementation owner:** Codex
- **Initial verdict:** APPROVED WITH MINORS

## Independence and scope

Kimi K3 did not implement Slice 24. The reviewer made no repository file
change, migration, formatting change, stage, commit, push, deployment, or PR
action. It reviewed only the Slice 24 files listed in the completion report
while identifying and excluding the pre-existing dirty Slice 23 changes.

The reviewer compared the implementation against `AGENTS.md`, ADR-0002, the
planning baseline authentication requirements, the accepted API contract, the
Slice 24 implementation specification, Prompt 80, the completion report, and
the actual uncommitted diff.

## Actual review instruction

The reviewer was instructed to act as the single independent read-only
security and commit-readiness reviewer for Slice 24; inspect the governing
documents and actual listed file diff; focus on OAuth callback correctness,
Identity external-cookie/correlation semantics, verified email, same-email
non-linking, explicit linking, CSRF/login-CSRF, the five-minute user ticket,
open redirects, provider uniqueness/concurrency, passwordless accounts,
cookies, Vite callback proxying, secrets, frontend behavior, contracts, tests,
evidence, and dependency implications; perform no writes; and return findings
ordered by Blocker, Major, and Minor with exact evidence and a final verdict.

The human explicitly approved sending the private authentication
implementation, diff, and specifications to Moonshot Kimi K3 for this review.

## Reviewer verification

K3 independently observed:

- `dotnet build Kiwimpact.slnx` — passed incrementally with 0 errors.
- backend unit tests — 289 passed.
- full PostgreSQL integration tests — 323 passed.
- focused `AuthApiTests` — 13 passed.
- frontend lint — passed.
- frontend type check — passed.
- full frontend tests — 48 files and 380 tests passed.
- focused Google frontend tests — 3 passed.
- frontend production build — passed with the existing chunk-size advisory.
- secret scan and ignore-boundary inspection — no Google credential was
  committed; the local settings file is ignored and contained no Google
  section.
- an in-memory `dotnet fsi` probe against the installed ASP.NET Core 10.0.10
  runtime — the external cookie is HttpOnly, SameSite=Lax, and
  Secure=SameAsRequest; the correlation cookie is HttpOnly, SameSite=None, and
  Secure=Always.

## Findings

### Blocker

None.

### Major

None.

K3 explicitly cleared the external/correlation cookie settings, user-bound
external login state, antiforgery and link-ticket boundaries, verified-email
handling, same-email rejection, open redirects, provider uniqueness,
passwordless change-password enforcement, and secret handling.

### Minor 1 — concurrent provider-link conflict can return 500

At `AuthController.LinkGoogleCallback`, two users can both pass
`FindByLoginAsync` before one loses the unique `(LoginProvider, ProviderKey)`
insert race. The database prevents double association, so authentication
security remains correct, but an unhandled `DbUpdateException` can produce a
500 instead of a bounded link failure.

Required correction: catch the persistence race around `AddLoginAsync` and
return a bounded link error.

### Minor 2 — negative-path test gaps

The initial tests did not exercise unverified email, a provider already linked
to another user, a tampered link ticket, a hostile external return URL, or the
unconfigured Google-login path.

Required correction: add focused integration coverage for these paths.

### Minor 3 — unconfigured login shows raw 503 JSON

The login page always renders the Google link. When Google is not configured,
full-page navigation reaches the backend 503 problem response rather than an
in-app message. Production is expected to be configured, so this was graded
as a development-environment UX issue only.

Required correction: make the unconfigured login initiation return through
the existing friendly frontend error path or otherwise expose availability to
the UI.

## Evidence assessment

K3 reproduced every reported gate count. Its incremental build did not
reproduce the implementation owner's five pre-existing EF1002 warnings because
nothing requiring those files was recompiled; K3 did not treat this as an
evidence discrepancy. The evidence files were found complete and coherent,
and the lack of a live Google credential was accurately disclosed.

## Initial verdict

**APPROVED WITH MINORS — 0 Blockers, 0 Majors, 3 non-blocking Minors.**

K3 stated that no second full review is needed. The implementation owner may
apply the three bounded corrections and record the observed closure evidence.

## Correction status

The implementation owner completed one concentrated correction pass limited
to the three original Minors:

1. `LinkGoogleCallback` now catches `DbUpdateException` from a lost provider
   uniqueness race and returns the bounded `unavailable` link result. The
   database primary key remains authoritative.
2. Backend integration coverage now exercises unverified email, hostile
   external return URLs, unconfigured login initiation, tampered link tickets,
   and a provider already linked to another account.
3. Unconfigured anonymous Google-login initiation now redirects to
   `/login?externalError=unavailable`, which uses the existing friendly
   frontend error copy instead of leaving the browser on raw 503 JSON. The
   authenticated link POST retains its bounded 503 behavior, which the
   settings page catches.

Observed closure verification by the implementation owner:

- `dotnet build Kiwimpact.slnx --no-restore` — passed; 0 errors and the five
  pre-existing unrelated EF1002 warnings.
- focused `AuthApiTests` — 16 passed, increased from 13.
- full PostgreSQL integration suite — 326 passed, increased from 323.
- focused frontend Google test — 3 passed.

K3 explicitly stated that these Minors were non-blocking and safe to correct
without a second full review. All three original Minor findings are now
recorded as corrected; the independent verdict remains **APPROVED WITH
MINORS**, with 0 Blockers and 0 Majors.
