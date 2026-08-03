# Slice 24 — Google Login and Account Linking

- **Status:** Implemented; Kimi K3 reviewed, non-blocking Minors corrected
- **Date:** 2026-07-31
- **Risk:** High — external authentication and account association

## Goal

Complete the accepted Google authentication path without weakening the
existing Identity application-cookie, antiforgery, role, or ownership model.

## Implemented scope

### Backend

- Optional Google OAuth registration using backend-only client credentials.
- Browser redirect initiation and provider callback handling.
- Creation of a confirmed, passwordless local Member account only when Google
  supplies a verified email address.
- Explicit rejection of automatic same-email account linking.
- Authenticated, antiforgery-protected account-link initiation.
- A user-bound, five-minute data-protected ticket between the protected POST
  and the browser GET challenge, preventing direct cross-site GET initiation.
- Identity external-login association with user-bound correlation state.
- Session metadata for local-password availability and linked providers.
- Safe local frontend return paths and generic provider failure states.
- Configuration validation and a secret-free local configuration example.

### Frontend

- Continue with Google on the login page.
- Friendly callback failure messages.
- Link Google account in Profile Settings.
- Visible linked state.
- No Change password action for a Google-only account.

### Verification

- Focused frontend integration tests.
- ASP.NET Core Identity/PostgreSQL integration tests with only the remote
  Google network exchange replaced by a deterministic test handler.
- Applicable full frontend and backend verification gates.

## Security invariants

- Kiwimpact issues its own HttpOnly application cookie.
- Google client secrets are read only from backend configuration.
- A matching email never links accounts automatically.
- Linking requires the authenticated Kiwimpact session, antiforgery
  validation, and Identity's user-bound external correlation state.
- One Google identity cannot be linked to multiple local accounts.
- External callback return paths must be local frontend paths.
- No OAuth token, provider secret, cookie, or correlation value is logged.
- Pure Google accounts cannot use the local change-password endpoint.

## Configuration

Set both values through deployment secrets or untracked local configuration:

```text
Authentication__Google__ClientId
Authentication__Google__ClientSecret
```

The Google OAuth web client must allow the deployed middleware callback:

```text
https://<kiwimpact-origin>/signin-google
```

Local development normally uses:

```text
http://localhost:5173/signin-google
```

Vite proxies that callback to the local API together with `/api`. If the
browser initiates Google login directly against the API origin instead, the
registered callback must use that exact API origin.

## Out of scope

- Automatic linking by email.
- Google account unlinking.
- Importing Google profile photos or additional profile data.
- Creating or managing Google Cloud resources.
- Committing real client credentials.
- Any database migration; ASP.NET Core Identity's existing user-login table is
  used.

## Review requirement

The independent Kimi K3 read-only security review is recorded in
`specs/ai/reviews/77-slice-24-google-login-account-linking-k3-review.md`.
It found 0 Blockers, 0 Majors, and 3 non-blocking Minors. The implementation
owner completed one concentrated correction pass for all three Minors and
observed the documented closure tests.
