# Kiwimpact Project Profile

- **Status:** Accepted Project Profile
- **Last updated:** 2026-07-20
- **Repository:** `msa2026`
- **Product owner:** Zephyr Chen

> This file is a concise entry point for humans and AI agents.
>
> It does not replace the detailed planning baseline, accepted ADRs, or
> scope-specific specifications. It does not claim that planned functionality
> has been implemented.

## 1. Project

- **Name:** Kiwimpact
- **Tagline:** Community eco quests across New Zealand
- **Theme:** Gamification
- **Current lifecycle stage:** Planning, specification, and UI design
- **Primary launch area:** Auckland, with a model that can expand across
  Aotearoa New Zealand

Kiwimpact is a gamified environmental participation platform that helps people:

1. discover local environmental activities;
2. join and complete eco quests;
3. verify eligible completion;
4. earn XP, levels, ranks, and achievements;
5. build a Personal Impact Passport;
6. participate in community and wider regional leaderboards;
7. share selected achievements through a generated image card.

The product uses game-design principles to encourage meaningful real-world
environmental participation. It is not intended to be a traditional game.

### Core loop

```text
Discover
→ Understand
→ Join
→ Complete
→ Verify
→ Earn
→ Record
→ Share
→ Continue
```

## 2. Current Implementation Status

At the time of this profile:

the planning baseline is accepted;
ADR-0001 through ADR-0008 are accepted decisions;
product, UX, Community, AI-governance, and review documents are being
developed;
frontend application scaffolding has not been verified;
backend application scaffolding has not been verified;
PostgreSQL local infrastructure has not been verified;
application test commands have not been verified;
GitHub Actions is not active;
branch protection is not active;
deployment is not configured;
Cline rules are advisory because enforcement hooks have not been implemented.

Use PROJECT_STATUS.md for the latest observed implementation and control
status.

Do not infer implementation completion from this profile, an ADR, or another
planning document.

## 3. Primary Users and Roles
Guest

Can browse public quests, use filters and the map, view Quest Details, inspect
public leaderboard information, and open official external activity links.

Member

Can register or sign in, join or cancel eligible quests, complete quests,
submit eligible claims, earn verified progression rewards, view the Personal
Impact Passport, select an optional Home Community, participate in scoped
leaderboards, and generate a Share Card.

Organizer

Has Member abilities and can manage owned quests, including creation, editing,
publishing, cancellation, archiving, capacity, participants, registration mode,
and completion-code workflows.

Admin

Can manage all quests, create curated external quests, review external
completion claims, manage source-review state, moderate relevant Community
data, and manage roles where required.

The MVP does not include a public Organizer application workflow.

##  4. Product and UX Priorities

Make the environmental action and its next step immediately understandable.
Make discovery useful through both a complete list and an optional map.
Award XP only for accepted XP-producing verified completion.
Make progression visible through XP, levels, ranks, achievements, streaks,
Passport records, and leaderboards.
Use Community identity to support belonging without collecting precise
residential location.
Support a broad audience without making the interface childish or
excessively competitive.
Provide responsive desktop and mobile layouts.
Provide keyboard access, semantic structure, reduced-motion behavior, and
clear loading, empty, success, validation, error, forbidden, and not-found
states.
Keep external provider information attributable and direct users to the
authoritative provider page.
Deliver a complete, deployable, tested MVP rather than a large collection
of incomplete features.

## 5. MVP Scope

Included
email/password authentication;
Google external login;
email confirmation and password recovery;
public Quest discovery and detail;
Organizer-owned Quest CRUD;
participation and cancellation;
completion-code verification;
external completion claims and Admin review;
XP, levels, rank titles, achievements, and weekly streaks;
Personal Impact Passport;
client-generated Share Card;
optional Home Community;
My Community, Auckland, and New Zealand leaderboard scopes;
Weekly, Monthly, and All-time leaderboard periods;
SignalR real-time leaderboard updates;
responsive Light and Dark themes;
Scalar API documentation;
frontend, backend, integration, and Cypress testing.
Excluded from the MVP
a full social network;
posts, comments, follows, friends, chat, or public profiles;
evidence-image upload;
continuous geolocation;
scraping or automated provider-page retrieval;
AI product features;
payments or real vouchers;
virtual currency, Wallet, Shop, purchasing, or trading;
loot boxes or random economic rewards;
native mobile applications or push notifications;
microservices;
MongoDB or mixed application persistence;
environmental-impact claims without an accepted methodology.

## 6. Technology
Frontend
Node.js 24 LTS
npm with committed package-lock.json
React
TypeScript
Vite
React Router
Tailwind CSS
daisyUI
TanStack Query
Zustand
React Hook Form
Zod
Lucide React
Motion for React
canvas-confetti
html-to-image
@vis.gl/react-google-maps

Do not include shadcn/ui initially.

Exact package versions are decided and recorded only during verified
scaffolding.

Backend
C# with .NET 10 or higher
ASP.NET Core Web API
Entity Framework Core
PostgreSQL
Npgsql
ASP.NET Core Identity
HttpOnly cookie authentication
SignalR
Scalar
Problem Details
Testing
Vitest
React Testing Library
user-event
jest-dom
xUnit v3
WebApplicationFactory
Testcontainers PostgreSQL
Cypress
Local Infrastructure Target
React and ASP.NET Core run directly on the development machine.
Docker Compose provides PostgreSQL and Mailpit.
Important integration tests use temporary PostgreSQL through Testcontainers.

These remain targets until their files, commands, and observed behavior are
recorded in PROJECT_STATUS.md.

## 7. Architecture Style

Clean Architecture Lite in a modular monolith.

Target backend projects
backend/
├── src/
│   ├── Kiwimpact.Api/
│   ├── Kiwimpact.Core/
│   └── Kiwimpact.Infrastructure/
└── tests/
    ├── Kiwimpact.UnitTests/
    └── Kiwimpact.IntegrationTests/
Responsibilities
Kiwimpact.Core

Contains domain and application rules, entities, value objects, policies,
application services, validation, authorization decisions, and abstractions.

Core must not reference Api or Infrastructure.

Kiwimpact.Infrastructure

Contains EF Core, PostgreSQL migrations, repositories, Identity stores, seed
implementation, background services, and external-adapter implementations.

Infrastructure may reference Core.

Kiwimpact.Api

Contains HTTP contracts, controllers, dependency-injection composition,
authentication, antiforgery, CORS, rate limiting, policies, Problem Details,
SignalR hubs, and Scalar documentation.

Api may reference Core and Infrastructure.

Composition root

Kiwimpact.Api/Program.cs is the sole composition root.

Infrastructure registration extension methods may be invoked from
Program.cs as part of the composition-root boundary. They must not resolve
services, call BuildServiceProvider, or contain runtime application behavior.

Persistence boundary

Only approved persistence components in Kiwimpact.Infrastructure may access
DbContext directly.

Controllers and application/domain services must not access DbContext
directly.

API style
REST/JSON
base path: /api/v1
ISO 8601 UTC timestamps
Problem Details errors
page-number pagination
default page size: 12
maximum page size: 50
Scalar documentation

Exact endpoints and update semantics belong in the accepted API contract.

## 8. State Ownership

apiFetch: HTTP transport and shared request behavior
TanStack Query: authoritative server state
Zustand: small cross-component UI and reward state
React state: local component state
URL search parameters: filters, sorting, pagination, and list/map view

Initial Zustand stores:

useUiStore
useRewardStore

Do not duplicate authoritative Quest, user, participation, completion, claim,
XP, achievement, or leaderboard data in Zustand.

## 9. Data and Time

PostgreSQL is the only application database.
EF Core migrations are the canonical schema history.
Application timestamps are stored as UTC using PostgreSQL
timestamp with time zone.
Pacific/Auckland is used for display and New Zealand business-week
calculations.
Important PostgreSQL behavior is tested against PostgreSQL, not SQLite.

The production migration procedure remains pending a deployment specification
or ADR.

## 10. Community Identity

Members may optionally select a coarse-grained Home Community.

The accepted conceptual Region hierarchy uses:

Country
AdministrativeArea
LocalArea

Initial leaderboard scopes are:

My Community
Auckland
New Zealand

Initial periods are:

Weekly
Monthly
All-time

Home Community:

is selected manually;
is not inferred from GPS, IP address, or street address;
is separate from Quest location;
may be changed subject to the accepted cooldown rule;
must not retroactively move historical Community-attributed XP;
remains hidden from Share Cards.

Conceptual fields include:

UserProfile.HomeCommunityRegionId
Quest.LocationRegionId
XpTransaction.CommunityRegionIdAtAward

Only verified XP-producing completion contributes to competitive
leaderboards. Self-reported completion produces no XP, leaderboard, streak, or
reward credit.

Virtual currency, Wallet, Shop, and purchasing are excluded from the MVP.

## 11. Security Decisions

Authentication
ASP.NET Core Identity
HttpOnly application cookie
email/password
Google external login
email confirmation
forgot/reset password
authenticated account linking
no custom JWT system for the MVP
Request security
ASP.NET Core antiforgery protection for state-changing requests
shared frontend header: X-CSRF-TOKEN
explicit CORS origins
no wildcard origin with credentials
authentication endpoint rate limiting
allowlisted/local return URLs

The exact antiforgery token-issuance flow belongs in the accepted
authentication/API specification.

Authorization
middleware and attributes provide authentication and coarse role checks;
application services enforce ownership and action-level authorization;
protected operations evaluate actor + action + resource;
another user's private resource must not be exposed through IDOR.
Validation
Zod and React Hook Form improve frontend input UX;
DataAnnotations validate backend request shape;
application/domain validation remains authoritative for business rules.
Secrets
no credentials or real API keys in committed source or configuration;
frontend local Maps key belongs in frontend/.env.local;
backend secrets use environment variables, .NET User Secrets, or deployment
secret management;
sensitive request bodies, cookies, tokens, evidence, and private URLs are not
logged.
Location privacy
do not store a Member's street address for Community identity;
do not infer Home Community automatically;
do not create a public user movement history;
use coarse, user-selected Region identifiers;
keep Home Community out of Share Cards.

## 12. Accepted ADRs

ADR-0001-use-postgresql.md
ADR-0002-use-identity-cookie-authentication.md
ADR-0003-use-clean-architecture-lite.md
ADR-0004-use-react-vite-tailwind-daisyui.md
ADR-0005-use-tanstack-query-and-zustand.md
ADR-0006-use-google-maps.md
ADR-0007-use-postgresql-integration-tests.md
ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md

Acceptance records a decision. It does not prove that the decision has been
implemented.

## 13. MSA Assessment Priorities

The final application must include:

a deployed React frontend;
a deployed C# .NET 10+ backend;
React Router or an equivalent routing library;
Entity Framework Core;
persistent database-backed CRUD;
frontend and backend unit tests;
Scalar API documentation;
responsive and visually distinctive UI;
one public repository containing frontend, backend, specifications, and
assessment files;
meaningful Git history;
planning and AI-assisted-development evidence under /specs.

The selected Top 3 advanced requirements are:

Security Measures
WebSockets using SignalR
Cypress End-to-End Testing

Do not claim an assessment requirement as complete before implementation and
evidence have been verified.

## 14. Repository Commands

No application install, development, build, lint, type-check, test, migration,
or deployment command is currently verified by this profile.

Agents must:

inspect actual repository configuration;
use only commands that exist;
observe a successful result;
record active commands and gates in PROJECT_STATUS.md.

Do not invent commands based on this profile.

## 15. Quality Gates

Quality gates are planned until their tools and commands exist and have run
successfully.

Expected categories include:

Frontend
formatting
linting
TypeScript checking
unit/integration testing
production build
Backend
formatting
build
unit testing
PostgreSQL integration testing
migration verification
Full stack
Cypress
security and authorization verification
SignalR/WebSocket verification
public deployment checks

Only gates marked active in PROJECT_STATUS.md are operational project gates.

## 16. Specification Authority

Use the following rules when documents differ:

Platform and security constraints have highest authority.
Explicit current user decisions override earlier project decisions within
their stated scope.
Later accepted ADRs and scope-specific specifications amend earlier
specifications only within their explicit scope.
ADR-0008 and its related Community specifications amend the planning
baseline for Community identity, scoped leaderboards, and virtual-economy
scope.
The accepted planning baseline remains authoritative in areas not amended
by later accepted documents.
Review documents and AI prompt records are evidence, not normative product
requirements.
Source code, migrations, configuration, lockfiles, and tests prove current
implementation state.
A mismatch between intended specifications and implementation evidence must
be reported rather than silently resolved.

## 17. Key References

specs/Kiwimpact_Final_Planning_Baseline_v1.0.md
specs/product/01-product-requirements.md
specs/product/02-community-identity-and-gamification-scope-update.md
specs/adr/
specs/ux/
specs/architecture/
specs/data/
specs/security/
specs/testing/
specs/ai/
specs/review/
.clinerules/
PROJECT_STATUS.md

Before relying on a reference, verify that the file or directory exists and
contains substantive current content.

## 18. Approval and Change Control

This profile is accepted as a concise project context document.

Update it only when an accepted product, architecture, technology, security,
testing, assessment, or lifecycle decision changes.

Do not use this file to record detailed requirements that belong in a
scope-specific specification or ADR.