# Kiwimpact Final Planning Baseline v1.0

- Status: Accepted planning baseline
- Date: 2026-07-19
- Product owner: Zephyr Chen
- Repository: `msa2026`
- Product name: **Kiwimpact**
- Tagline: **Community eco quests across New Zealand**

> This document records accepted product, UX, architecture, security, testing,
> AI-workflow, and scope decisions. It does not claim that implementation is
> complete.

## 1. Product definition

Kiwimpact is an Auckland-first gamified community environmental participation
platform for Aotearoa New Zealand. It helps users discover selected activities
from multiple providers, participate, verify completion, earn progression
rewards, build a Personal Impact Passport, and share an achievement card.

Core loop:

`Discover → Understand → Join → Complete → Verify → Earn → Record → Share → Continue`

MVP means a complete, deployable full-stack product with controlled scope, not a
static demo or hard-coded prototype.

## 2. Users and roles

- **Guest:** browse, filter, use map, view details/leaderboard, open official
  external links.
- **Member:** email/password or Google login, join/cancel quests, submit
  completion, earn XP, view Passport, generate share card.
- **Organizer:** Member abilities plus CRUD for owned quests, participant view,
  capacity, completion code, publish/cancel/archive.
- **Admin:** manage all quests, create curated external quests, review claims,
  manage source freshness and roles where required.

MVP does not implement a public Organizer application workflow.

## 3. Quest sources and registration

### Curated External Quest

Admin records selected activities from councils, DOC, EcoFest, NGOs, or similar
providers.

May store:

- title;
- date/time;
- location;
- organiser;
- category;
- objective duration/age/difficulty;
- source URL;
- source-check date;
- a short Kiwimpact-written summary.

Do not copy by default:

- full descriptions;
- photos;
- logos;
- posters;
- long safety text;
- original illustrations;
- comments.

Registration stays on the official site. UI shows:

- `View official event`
- `Registration is managed by the original event provider`
- `Official source is authoritative`
- `Last checked: ...`

### Organizer-Published Quest

Registration modes:

- `Native`
- `External`
- `NoneRequired`

### Platform Eco Challenge

Flexible self-directed challenges created by Kiwimpact. Kiwimpact does not host
high-liability public events in the MVP.

## 4. Categories

1. Restore Nature
2. Protect Wildlife
3. Clean & Reduce Waste
4. Grow & Compost
5. Observe & Measure
6. Learn & Share

## 5. Quest and external-source states

`QuestStatus`:

- Draft
- Published
- Cancelled
- Archived

`ExternalSourceStatus`:

- Current
- NeedsReview
- Changed
- SourceRemoved

`SourceCheckedAt` records the last manual verification.

`NextCheckDueAt` uses the earlier applicable date:

- `SourceCheckedAt + 14 days`
- `StartAtUtc - 7 days`

A daily background task marks overdue sources `NeedsReview`. The system does not
scrape external pages.

Do not make `ExternalSourceUrl` globally unique. Use duplicate detection based
on provider, normalized URL, start time, or provider event ID.

## 6. Participation and completion

### Native registration

Backend verifies login, status, capacity, date rules, and duplicate
participation before creating a Participation record.

### Organizer Verified

MVP verification:

- completion code;
- optional Organizer approval where implemented.

Receives full XP, level, achievements, streak, leaderboard, and verified
Passport credit.

### Evidence Reviewed

For external activities:

1. Member submits a claim.
2. Admin reviews.
3. Approved claims create a verified completion and XP transaction.
4. Rejected claims show a short reason.

Fields:

- `ParticipationDate`
- `Description` (about 500 characters maximum)
- optional `EvidenceUrl`
- `UserDeclaration`

Evidence URL:

- HTTPS only;
- owner/Admin only;
- never public;
- backend never downloads, previews, follows, or fetches it;
- full URL not logged;
- open as an untrusted external link with `noopener` and `noreferrer`.

### Self Reported

Appears in the Passport but receives no XP, leaderboard, streak, or reward
credit.

## 7. Completion Claim privacy and retention

- Claim owner can view own claim.
- Admin can review.
- Organizer cannot view external evidence by default.
- Other users cannot view it.
- Share Card and leaderboard contain only the result.

Lifecycle:

- Pending claims can be edited or withdrawn.
- Withdrawn evidence is cleared immediately.
- Reviewed claims cannot be edited by the claimant.
- `EvidencePurgeDueAt = ReviewedAt + 90 days`.
- Evidence is removed within 24 hours after the retention period.

Remove:

- Description
- EvidenceUrl
- detailed ReviewNote

Retain minimal audit:

- ClaimId
- UserId
- QuestId
- Status
- SubmittedAt
- ReviewedAt
- ReviewedBy
- VerificationLevel
- XpTransactionId
- EvidencePurgedAt

Implementation:

- ASP.NET Core `BackgroundService`
- run shortly after startup
- run every 24 hours
- batch size about 100
- idempotent
- logs counts/failures, not evidence content

## 8. Gamification

### XP

- Easy: 50
- Medium: 100
- Hard: 150

Only verified completion earns XP. The backend calculates XP and writes an
`XpTransaction`; the frontend never submits a trusted XP value.

A database uniqueness rule prevents duplicate completion XP for the same user
and quest.

### Level 1–99

Initial cumulative threshold:

`XP(Level L) = 5 × (L - 1) × (L + 7)`

Experience targets:

- one quest: Level 2–3;
- five medium quests: Level 5–8;
- sustained participation: Level 20–30;
- Level 50+: long-term participant;
- Level 99: long-term honour goal.

### Rank titles

- 1–9: Novice
- 10–19: Scout
- 20–29: Adventurer
- 30–39: Ranger
- 40–49: Pathfinder
- 50–59: Guardian
- 60–69: Vanguard
- 70–79: Champion
- 80–89: Hero
- 90–98: Legend
- 99: Kiwimpact Legend

Every ten-level boundary triggers a stronger Rank Up reveal.

### Other systems

- 6–8 fixed achievements
- weekly streak based on one verified quest per New Zealand calendar week
- weekly/monthly/all-time SignalR leaderboard
- Personal Impact Passport
- no invented carbon-equivalent claims

## 9. Gameful UX

Direction:

- friendly eco-adventure;
- slightly cartoon-like;
- energetic and rounded, inspired by Discord/Kahoot friendliness without
  copying them;
- game-like Quest Cards;
- clear XP and level progress;
- accessible rather than childish.

Reward sequence:

1. Quest Completed
2. stars/particles move toward XP
3. XP number increases
4. progress bar fills
5. Level Up
6. Rank Up when applicable
7. Achievement Reveal
8. Passport/leaderboard refresh

Requirements:

- skippable;
- respect `prefers-reduced-motion`;
- lighter on mobile;
- sound optional and off by default;
- no default background music.

## 10. Share Card

MVP uses client-side image generation:

- 1080 × 1080 PNG
- `html-to-image`
- Web Share API file share when supported
- download fallback
- no public profile or public completion page

Default content:

- Display Name
- Quest name
- completion date
- verification label
- XP
- current level
- rank title
- Kiwimpact branding

`Show my display name` is enabled by default but can be turned off.

Never include email, user ID, evidence, claim text, review note, or precise GPS.

## 11. Social scope

MVP:

- leaderboard
- display name
- Personal Impact Passport
- shareable image card

Deferred:

- Community Pulse
- Kudos
- Public Profile
- posts/comments/follows/friends/chat
- notifications
- social image upload and moderation

## 12. Main product areas

1. Landing and Authentication
2. Discover Quests
3. Quest Detail
4. Dashboard / My Quests
5. Profile / Personal Impact Passport
6. Leaderboard
7. Organizer/Admin Console

Every important screen handles loading, empty, success, validation error,
server error, forbidden, and not-found states.

## 13. Technology

### Frontend

- Node.js 24 LTS
- npm + committed `package-lock.json`
- React + TypeScript
- Vite
- React Router
- Tailwind CSS
- daisyUI
- Lucide React
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Motion for React
- canvas-confetti
- html-to-image
- `@vis.gl/react-google-maps`
- unDraw for temporary illustrations

Do not include shadcn/ui initially.

State ownership:

- shared `apiFetch`: HTTP transport
- TanStack Query: authoritative server state
- Zustand: small cross-component UI state
- React state: local component state
- URL search params: filters/sorting/pagination/view state

Initial Zustand stores:

- `useUiStore`
- `useRewardStore`

Never duplicate authoritative Quest, user, XP, achievement, completion, or
leaderboard data in Zustand.

### Backend

- C# with .NET 10+
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL + Npgsql
- ASP.NET Core Identity
- HttpOnly cookie authentication
- SignalR
- Scalar API documentation
- Problem Details
- custom thin auth endpoints around `UserManager`/`SignInManager`

No MongoDB, mixed persistence, custom JWT system, or microservices.

## 14. Architecture

Clean Architecture Lite / Modular Monolith:

```text
/frontend

/backend
  /src
    /Kiwimpact.Api
    /Kiwimpact.Core
    /Kiwimpact.Infrastructure
  /tests
    /Kiwimpact.UnitTests
    /Kiwimpact.IntegrationTests

/specs
```

Responsibilities:

- **Core:** domain/application rules and abstractions.
- **Infrastructure:** EF Core, PostgreSQL, Identity storage, migrations, seed,
  background services, external adapter implementations.
- **Api:** controllers, contracts, DI composition, auth, CSRF, policies,
  SignalR, Problem Details, Scalar.

Do not add MediatR, event bus, complex CQRS, microservices, or a repository per
entity without demonstrated need and approval.

## 15. Database and local infrastructure

- PostgreSQL is the only application database.
- EF Core migrations are schema history.
- UTC storage using PostgreSQL `timestamp with time zone`.
- `Pacific/Auckland` for display/business week calculations.

Local development:

- React and API run directly on the Mac.
- Docker Compose runs:
  - PostgreSQL
  - Mailpit
- important integration tests use temporary PostgreSQL through Testcontainers.
- SQLite is not used to imitate critical PostgreSQL behaviour.

## 16. Authentication

Supported methods:

1. email/password;
2. Google.

Email/password:

- registration
- email confirmation
- resend confirmation
- login/logout
- forgot/reset password
- change password
- account lockout/rate control

Suggested:

- unconfirmed email cannot normally log in;
- confirmation token about 24 hours;
- reset token about 30–60 minutes;
- forgot-password response does not reveal account existence;
- demo accounts are seeded confirmed.

Google:

- Google authenticates;
- Kiwimpact creates/locates a local Identity user;
- Kiwimpact issues its own HttpOnly cookie;
- same-email accounts are not automatically linked;
- linking requires an authenticated settings flow;
- pure Google users do not see Change Password unless a local password exists.

Local confirmation/reset email uses Mailpit. Production email provider is
deferred to deployment.

## 17. Cookie, CSRF, CORS, proxy

Local Vite proxies:

- `/api/*`
- `/hubs/*` with WebSocket support

Cookie:

- HttpOnly
- SameSite=Lax
- Secure=false only for local HTTP where necessary
- Secure=true in production

Every POST/PUT/PATCH/DELETE request uses ASP.NET Core antiforgery protection.
The shared client sends `X-CSRF-TOKEN`.

CORS uses explicit origins only; never wildcard origin with credentials.

## 18. Google Maps

Provider:

- Google Maps
- `@vis.gl/react-google-maps`

MVP:

- map
- markers
- marker summary
- fit bounds
- link to detail
- click map to choose coordinates for Admin/Organizer
- full list fallback

Excluded:

- Places Autocomplete
- Directions
- Street View
- Distance Matrix
- traffic
- continuous geolocation

Local key:

- dedicated development browser key
- referrers:
  - `http://localhost:5173/*`
  - `http://127.0.0.1:5173/*`
- restrict to Maps JavaScript API
- save in `/frontend/.env.local`
- ignore in Git

Google OAuth secret stays on the backend and is separate from the Maps key.

## 19. Validation and API conventions

Frontend:

- React Hook Form + Zod

Backend:

- DataAnnotations for request shape
- application/domain validation for business rules
- backend remains authoritative

API:

- REST/JSON
- `/api/v1`
- Scalar
- Problem Details
- ISO 8601 UTC timestamps
- page-number pagination
- default page size 12
- maximum 50

## 20. Testing

Frontend:

- Vitest
- React Testing Library
- user-event
- jest-dom

Backend unit:

- xUnit v3

Backend integration:

- xUnit
- WebApplicationFactory
- Testcontainers PostgreSQL

E2E:

- Cypress

Core coverage:

- CRUD and permissions
- capacity and duplicate registration
- completion code
- claim review
- XP/level/rank
- duplicate XP prevention
- achievements
- streak
- external source review
- evidence purge
- auth and authorization
- share card
- Member/Organizer/Admin journeys

## 21. Seed data

System seed:

- roles
- categories
- achievements
- ranks where stored

Development/demo seed:

- 1 Admin
- 1 Organizer
- 3 Members
- 3–5 organisations
- 18–24 quests
- all categories and source types
- participation/claim states
- XP, achievements, leaderboard data

Rules:

- idempotent
- EF migrations, not `EnsureCreated`
- demo passwords from environment variables
- demo users confirmed
- fictional evidence only
- real external activities normally entered through Admin workflow

## 22. Visual system and assets

Themes:

- Kiwimpact Light
- Kiwimpact Dark

Initial Light tokens:

- primary `#2F8F5B`
- secondary `#6C63D9`
- accent `#F4B740`
- base `#F8FBF4`
- content `#183026`

Initial Dark tokens:

- primary `#6FD69A`
- secondary `#AAA1F5`
- accent `#FFD166`
- base `#13211B`
- content `#F2F7F3`

Geometry:

- button/input radius 14px
- card 20px
- modal 24px
- pill badges
- spacing 4/8/12/16/24/32/48

Motion:

- fast 120ms
- normal 220ms
- emphasis 350ms
- reward 600–900ms

Resources:

- Lucide for functional icons
- unDraw for temporary illustrations
- custom Kiwimpact rank/achievement assets during polish
- user-selected third-party sound effects
- asset register records source, author, licence, attribution, date, changes,
  and use location

## 23. Advanced requirements

Top three in final README:

1. Security Measures
2. WebSockets using SignalR
3. Cypress End-to-End Testing

Additional advanced work:

- Zustand state management
- Light/Dark theme switching
- Docker local infrastructure

## 24. AI workflow

- **Human:** final decisions and review.
- **Figma/Figma AI:** visual exploration.
- **Claude:** read designs; draft tokens, component specs, ADR, ERD, API
  Contract, Component Plan.
- **Human review:** accept/reject.
- **DeepSeek + Cline:** implement accepted written specs in small vertical
  slices, run verified commands, report failures.

AI chat is not the source of truth. Human-approved `/specs` files and accepted
ADRs guide implementation. Source code, migrations, lockfiles, config, and tests
prove current state.

## 25. `/specs` and ADR naming

Suggested structure:

```text
/specs
  00-project-profile.md
  /product
  /ux
  /architecture
  /security
  /testing
  /ai
    /prompts
  /adr
```

Normal files:

- numbered lowercase kebab-case, such as
  `01-product-requirements.md`

ADR files:

- `ADR-0001-use-postgresql.md`
- statuses: Proposed, Accepted, Superseded, Rejected

Do not create empty placeholder documents.

Initial ADRs:

1. PostgreSQL
2. Identity + Cookie Authentication
3. Clean Architecture Lite
4. React/Vite/Tailwind/daisyUI
5. TanStack Query + Zustand
6. Google Maps
7. PostgreSQL integration tests

## 26. CI and repository controls

GitHub Actions is added immediately after real commands exist.

Initial CI:

Frontend:

- install from lockfile
- lint
- type-check
- unit tests
- build

Backend:

- restore
- build
- unit tests
- PostgreSQL integration tests

Later add Cypress and security/dependency checks.

After stable CI, protect `main`:

- PR required
- CI required
- no force push
- no branch deletion
- no mandatory second reviewer for this individual project

Cline Hooks remain unimplemented initially. Deployment protection is configured
only during the deployment stage.

Agents must not automatically install dependencies, migrate/destruct data,
commit, push, merge, deploy, alter security, or expand scope.

## 27. MVP exclusions

- full social network
- Community Pulse, Kudos, Public Profile
- evidence image upload
- AI features
- payments/real vouchers
- scraping/API sync
- route/traffic/geolocation expansion
- native mobile/push
- complex organisation administration
- carbon claims without methodology
- unrestricted Member publishing
- background music by default
- MongoDB/mixed databases
- microservices

## 28. Future roadmap

- **1.1:** image evidence, Organizer approval, QR, batch attendance
- **1.2:** verified organisations and organisation teams
- **1.3:** sponsor rewards with stock/redemption and legal review
- **2.0:** social/community features
- **2.x:** nationwide and partner integrations
- **3.0:** recommendations, AI assistance, mobile, Citizen Science, validated
  impact calculations

## 29. Recommended implementation order

1. Replace/archive incompatible legacy project rules and status.
2. Add this baseline and accepted project profile to `/specs`.
3. Create the seven accepted ADRs.
4. Write product requirements, user journeys, gamification spec, ERD, API
   contract, auth flow, test strategy, threat model, and AI workflow.
5. Create Figma information architecture and the key page/component designs.
6. Scaffold Docker Compose, backend solution, frontend app, and test projects.
7. Verify commands and immediately add basic GitHub Actions.
8. Implement vertical slices:
   - authentication;
   - public quest discovery/detail;
   - Organizer CRUD;
   - participation;
   - completion code + XP;
   - levels/ranks/achievements/animations;
   - Passport;
   - external quest + claim review;
   - SignalR leaderboard;
   - Share Card.
9. Add Cypress, accessibility, responsive polish, seed data, and error states.
10. Deploy, finish README/spec evidence/video, and run final submission checks.
