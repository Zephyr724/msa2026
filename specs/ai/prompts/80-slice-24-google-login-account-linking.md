# Prompt 80 — Slice 24 Google Login and Account Linking

## Prompt type

Truthful reconstructed implementation instruction.

## Human authorization

The human requested implementation of the previously deferred Google login
and account-linking feature, then explicitly approved:

1. adding the official `Microsoft.AspNetCore.Authentication.Google`
   dependency; and
2. implementing on the current dirty
   `feat/richer-achievements-trophies` branch while preserving unrelated
   changes.

## Implementation instruction

Implement the accepted Google external-login and authenticated account-linking
flows from ADR-0002 and the accepted API/product specifications.

Requirements:

- retain ASP.NET Core Identity and the Kiwimpact HttpOnly application cookie;
- configure Google credentials only on the backend and commit no secret;
- use the official Google authentication handler;
- create a passwordless confirmed local Member only from a verified Google
  email;
- never automatically link an existing same-email account;
- require the existing authenticated session and antiforgery validation before
  starting explicit linking;
- bind the external correlation state to the current user during linking;
- require a short-lived user-bound authorization ticket before the redirecting
  GET challenge so a cross-site GET cannot bypass the antiforgery-protected
  initiation POST;
- prevent one Google identity from being associated with multiple users;
- restrict post-login redirects to safe local frontend paths;
- expose only allowlisted password/provider metadata in the auth session;
- hide Change password for pure Google accounts and enforce the same rule on
  the backend;
- add focused frontend and real Identity/PostgreSQL integration coverage;
- do not add a migration because the existing Identity login table is the
  persistence boundary;
- preserve all unrelated dirty worktree changes;
- create implementation evidence and report the independent review as pending
  until a separate reviewer completes it.
