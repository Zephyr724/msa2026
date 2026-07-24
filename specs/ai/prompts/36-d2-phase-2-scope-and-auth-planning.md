# D2 — Phase 2 Scope and Authentication Planning Prompt Evidence

- **Date:** 2026-07-24
- **Tool/model:** Codex desktop, GPT-5
- **Prompt provenance:** Exact prompt supplied by the human in an attached text
  file.

## Actual prompt

> # D2 — Freeze Phase 2 Delivery Scope and Prepare Authentication Slices
>
> This is a bounded documentation and architecture-decision task.
>
> Do not write business code.
> Do not create migrations.
> Do not add dependencies.
> Do not modify ADR-0001 through ADR-0008.
> Do not rewrite historical prompts, reviews, or completion reports.
> Do not read Slice 1 review history.
>
> ## Preconditions
>
> Run:
>
> - git status --short
> - git branch --show-current
> - git log --oneline --decorate -5
> - git diff --check HEAD
>
> Expected branch:
>
> docs/streamline-codex-workflow
>
> The branch may contain the committed D1 documentation change but must otherwise
> be clean.
>
> Stop if unexpected uncommitted changes exist.
>
> ## Read
>
> - AGENTS.md
> - specs/00-project-profile.md
> - specs/README.md
> - specs/product/03-community-challenge-scope.md, if this is the current Product
>   03 document
> - the current authentication/security specification
> - the current Identity-related API specification
> - the current Identity-related data specification
> - the current deployment-related architecture specification
> - .clinerules/04b-auth-security.md
> - .clinerules/09-msa-assessment.md
>
> Read only directly relevant sections.
> Do not recursively read historical AI evidence.
>
> ## Required output files
>
> Create:
>
> 1. specs/product/04-phase-2-delivery-scope.md
> 2. specs/adr/ADR-0009-use-single-origin-deployment.md
> 3. specs/implementation/02a-email-password-auth-core.md
> 4. specs/implementation/02b-account-lifecycle-and-auth-hardening.md
> 5. specs/ai/prompts/36-d2-phase-2-scope-and-auth-planning.md
>
> Update only:
>
> 6. specs/00-project-profile.md
> 7. .clinerules/04b-auth-security.md
> 8. specs/README.md
>
> Use the repository's existing ADR directory and naming convention.
> Do not create another ADR directory.
>
> ## 1. Phase 2 delivery scope
>
> The new document must preserve long-term product specifications while defining
> submission priority.
>
> ### P0 — Must be complete and deployed
>
> Core product:
>
> - existing public Region and Quest discovery/detail;
> - email/password authentication core;
> - HttpOnly Cookie authentication;
> - anti-CSRF protection;
> - Member, Organizer, and Admin authorization boundaries;
> - Organizer-owned Quest CRUD;
> - join and cancel participation;
> - one simplified completion flow;
> - server-authoritative XP and level/rank progression;
> - Passport-lite profile/dashboard;
> - at least three simple achievements;
> - one simple persisted leaderboard;
> - responsive desktop and mobile UI;
> - frontend and backend tests for key paths;
> - Scalar;
> - same-origin production deployment;
> - README, /specs evidence, and six-minute video.
>
> Committed advanced requirements:
>
> 1. Security Measures
>    - implement at least two approved controls;
>    - planned evidence includes RBAC, Anti-CSRF, Identity password hashing,
>      validation, and rate limiting where implemented;
>    - the final README must explain their importance and implementation.
> 2. Zustand state management
>    - use it for genuine cross-component client/UI state;
>    - do not duplicate TanStack Query server state;
>    - do not store authenticated user identity in Zustand.
> 3. Theme switching
>    - light and dark themes;
>    - persisted preference;
>    - system-theme-aware initial behaviour;
>    - readable key screens in both themes.
> 4. Dockerization
>    - Dockerize the frontend/backend application and PostgreSQL environment;
>    - provide a reproducible documented startup path;
>    - do not treat a PostgreSQL-only Compose file as full application
>      Dockerization.
>
> The final README will explicitly identify only the three strongest completed
> advanced requirements for marking.
>
> ### P1 — Only after P0 works in deployment
>
> - email confirmation and resend;
> - forgot/reset/change password;
> - local Mailpit email flow;
> - richer achievements;
> - streak;
> - leaderboard refinements;
> - Cypress end-to-end testing with two or three stable core journeys;
> - SignalR WebSockets for leaderboard invalidation only.
>
> SignalR constraints:
>
> - the REST leaderboard must work without SignalR;
> - SignalR is an enhancement, not a correctness dependency;
> - use one server-to-client invalidation event;
> - the client invalidates/refetches the authoritative TanStack Query;
> - do not implement chat, presence, regional groups, or client-side leaderboard
>   writes.
>
> ### Deferred unless substantial time remains
>
> - Storybook integration for all implemented reusable UI components;
> - Google login and account linking;
> - Google Maps;
> - external-event claim and Admin review;
> - Community Challenge;
> - multi-layer community leaderboard;
> - Share Card;
> - seasons, leagues, social feed, or chat.
>
> Storybook must not be claimed as complete unless the implemented reusable UI
> component set is comprehensively integrated.
>
> State explicitly:
>
> - P1 and Deferred work must not delay P0 deployment, testing, README, or video;
> - long-term design documents remain valid as future direction;
> - this delivery-scope document controls scheduling for the current assessment.
>
> ## 2. Update project profile minimally
>
> Update only the parts of specs/00-project-profile.md that conflict with the new
> delivery scope.
>
> In particular:
>
> - replace any statement that the fixed intended top three are Security,
>   WebSockets, and Cypress;
> - state that four advanced requirements are committed:
>   Security, Zustand, Theme Switching, and Docker;
> - state that final README selection depends on actual completion quality;
> - state that Cypress and SignalR are P1 stretch requirements;
> - reference specs/product/04-phase-2-delivery-scope.md;
> - do not rewrite the rest of the project profile.
>
> ## 3. ADR-0009 — single-origin deployment
>
> Decide production topology, not a specific provider.
>
> The ADR must establish:
>
> - browser-visible frontend, API, and Scalar use one public origin;
> - frontend requests continue using relative `/api` paths;
> - local development may continue using the Vite proxy;
> - production authentication uses Secure and HttpOnly cookies;
> - SameSite=Lax is the default unless future evidence requires another value;
> - anti-CSRF protection remains required;
> - production does not depend on cross-origin credentialed CORS;
> - `/hubs` may share the same origin if SignalR is implemented later;
> - WebSockets are not required by this ADR;
> - deployment provider remains separately selectable.
>
> Include:
>
> - status;
> - context;
> - decision;
> - consequences;
> - security impact;
> - rejected cross-origin alternative;
> - implementation implications;
> - review triggers.
>
> Do not choose Azure, Render, Fly.io, Railway, or another provider in this ADR.
>
> ## 4. Slice 2A — Email/password authentication core
>
> Keep the task contract approximately 150–250 lines.
>
> Include only the following.
>
> Backend:
>
> - activate ASP.NET Core Identity Cookie authentication;
> - Member, Organizer, and Admin role constants and safe seed configuration;
> - public registration can create Member only;
> - add UserProfile through an additive EF Core migration;
> - register endpoint;
> - login endpoint;
> - logout endpoint;
> - me/current-session endpoint;
> - anti-CSRF token endpoint;
> - anti-CSRF validation for state-changing authentication requests;
> - generic authentication errors that avoid unnecessary account enumeration;
> - basic approved lockout/rate-limiting behaviour without new dependencies;
> - development-only demo Organizer/Admin accounts;
> - demo passwords must come from environment or local configuration and must
>   never be committed;
> - Scalar documentation;
> - focused unit and PostgreSQL integration tests.
>
> Frontend:
>
> - `/login`;
> - `/register`;
> - authenticated shell state using `/auth/me`;
> - Cookie credentials;
> - CSRF token acquisition, caching, refresh, and one safe retry in `apiFetch`;
> - signed-in/signed-out navigation;
> - responsive and keyboard-usable loading/error states;
> - TanStack Query owns authentication server state;
> - user identity must not be stored in Zustand.
>
> Explicitly out of scope:
>
> - email confirmation;
> - resend confirmation;
> - forgot/reset/change password;
> - Google login;
> - profile editing;
> - role-management UI;
> - Organizer Quest CRUD;
> - participation;
> - XP, achievements, leaderboard, SignalR;
> - Cypress;
> - Storybook;
> - new UI or form dependencies.
>
> Human approval gates:
>
> - adding any dependency;
> - changing the accepted Cookie or CSRF model;
> - changing ADR-0009;
> - changing an accepted Identity/API/schema decision;
> - replacing the additive migration strategy;
> - storing secrets in repository files.
>
> Definition of Done must include:
>
> - register → login → me → logout works through frontend/API;
> - public registration always receives Member only;
> - authenticated and anonymous shell states work;
> - Cookie and CSRF behaviour have focused integration coverage;
> - missing/invalid CSRF is rejected safely;
> - authentication errors do not unnecessarily reveal account existence;
> - no secret/demo password is committed;
> - backend and frontend gates pass;
> - actual behaviour is documented truthfully.
>
> ## 5. Slice 2B — Account lifecycle and authentication hardening
>
> Define it as a separate later task containing:
>
> - email confirmation and resend;
> - forgot password;
> - reset password;
> - change password;
> - Mailpit local email delivery;
> - confirmation-token lifetime;
> - reset-token lifetime;
> - non-enumerating recovery responses;
> - focused rate-limit and lockout hardening;
> - relevant frontend pages and tests.
>
> State that:
>
> - Slice 2B preserves the complete long-term authentication goal;
> - Slice 2B must not block Quest CRUD, initial deployment, README, or video when
>   the deadline is at risk;
> - Google login remains deferred.
>
> ## 6. Authentication security rule
>
> Update .clinerules/04b-auth-security.md only enough to state:
>
> - the complete long-term security goals remain valid;
> - Google login is deferred from the current submission schedule;
> - current implementation sequencing follows Slice 2A and then optional/P1
>   Slice 2B;
> - the latest approved delivery-scope document controls scheduling;
> - underlying password, Cookie, CSRF, authorization, validation, rate-limit, and
>   secret-handling requirements are not weakened.
>
> ## 7. Specs index
>
> Update specs/README.md to include:
>
> - Product 04;
> - ADR-0009;
> - Slice 2A;
> - Slice 2B;
> - Prompt 36.
>
> Fix only directly encountered broken links.
> Do not perform a full historical-document cleanup.
>
> ## 8. Prompt evidence
>
> Create:
>
> specs/ai/prompts/36-d2-phase-2-scope-and-auth-planning.md
>
> Include:
>
> - date;
> - tool/model;
> - actual prompt;
> - files created/updated;
> - decisions made;
> - unresolved human approvals;
> - verification result;
> - human decision placeholder marked `PENDING DESIGN REVIEW`.
>
> ## Verification
>
> - verify new relative Markdown links;
> - check duplicate numbering and naming;
> - run git diff --check HEAD;
> - run git diff --stat HEAD;
> - run git diff --name-status HEAD.
>
> Confirm that no production code, tests, dependency files, migrations, or
> ADR-0001 through ADR-0008 changed.
>
> ## Final response
>
> Return:
>
> 1. files created;
> 2. files updated;
> 3. final P0/P1/Deferred table;
> 4. committed and stretch advanced requirements;
> 5. ADR-0009 summary;
> 6. Slice 2A boundaries;
> 7. Slice 2B boundaries;
> 8. unresolved human approvals;
> 9. link-check and diff-check results;
> 10. recommended commit message.
>
> Do not stage, commit, push, merge, switch branches, or create a PR.

## Files created

- `specs/product/04-phase-2-delivery-scope.md`
- `specs/adr/ADR-0009-use-single-origin-deployment.md`
- `specs/implementation/02a-email-password-auth-core.md`
- `specs/implementation/02b-account-lifecycle-and-auth-hardening.md`
- `specs/ai/prompts/36-d2-phase-2-scope-and-auth-planning.md`

## Files updated

- `specs/00-project-profile.md`
- `.clinerules/04b-auth-security.md`
- `specs/README.md`

## Decisions made

- P0 is the deployable assessment-critical product.
- P1 starts only after P0 works in deployment; remaining scope is Deferred.
- Security, Zustand, Theme Switching, and Dockerization are the four committed
  advanced requirements; the final README selects the strongest three actually
  completed.
- Production uses one browser-visible origin for frontend, API, Scalar, and
  optional later `/hubs`; the provider remains open.
- Slice 2A contains only email/password authentication core.
- Slice 2B preserves confirmation, recovery, password change, Mailpit, and
  focused hardening as a separate P1 task.
- Google login remains deferred.

## Unresolved human approvals

- Accept Product 04 as the current assessment scheduling authority.
- Accept ADR-0009 and its single-origin topology.
- Approve Slice 2A's implementation plan, additive UserProfile migration,
  Identity/cookie/CSRF configuration, role seed, rate limits, lockout values,
  and Development demo-account secret provisioning before implementation.
- Decide whether deadline margin permits Slice 2B after P0 deployment.
- Select the final three advanced requirements only after implementation and
  evidence quality are known.

## Verification result

- All five new relative index targets exist.
- Naming/numbering check found exactly one Product 04, ADR-0009, Slice 2A,
  Slice 2B, and Prompt 36 file.
- Slice 2A is exactly 250 lines.
- `git diff --check HEAD` passed with no output.
- `git diff --stat HEAD` reported three tracked documentation files changed,
  with 47 insertions and 6 deletions.
- `git diff --name-status HEAD` reported only the three authorized tracked
  documentation updates.
- `git status --short` reported those three updates and the five expected new
  documentation files.
- The new files contain no trailing whitespace.
- No production code, tests, dependency files, migrations, historical prompt,
  review, completion report, or ADR-0001 through ADR-0008 changed.

## Human decision

`APPROVED AFTER INDEPENDENT DESIGN REVIEW`

## Targeted correction outcome

- The independent design review found no Blockers and one Major: the active MSA
  assessment rule still fixed SignalR and Cypress in the final Top 3.
- `.clinerules/09-msa-assessment.md` was corrected only in the affected
  advanced-requirement and README sections.
- The rule now commits Security, Zustand, Theme Switching, and Dockerization,
  defers the final strongest-three selection until implementation evidence is
  known, and keeps Cypress and SignalR as non-blocking P1 stretch work.
- The original Major is marked addressed in
  `specs/ai/reviews/27-d2-scope-auth-design-review.md`; the original review
  verdict remains preserved as historical review evidence.
- Relevant document references and scope statements were checked for
  consistency, and the requested Git diff checks completed successfully.
