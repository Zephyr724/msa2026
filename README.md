# Kiwimpact — Community eco quests across New Zealand

> **Community Eco Quests — Small actions. Real change.**

Kiwimpact is my individual full-stack project for the **Microsoft Student
Accelerator (MSA) 2026 Phase 2 Software Development Stream**. It is a gamified
environmental participation platform for Aotearoa New Zealand: people discover
local eco activities, complete quests, earn verified progression rewards, build
an Impact Passport, and share their contribution with the community.

Kiwimpact follows the required **Gamification** theme. It is a community-action
product rather than a traditional game.

## Project links

| Resource | Link | Verification status |
| --- | --- | --- |
| Deployed application | [Kiwimpact on Railway](https://kiwimpact-app-production.up.railway.app/) | Public homepage returned HTTP 200 on 8 August 2026 |
| Scalar API documentation | [Deployed Scalar UI](https://kiwimpact-app-production.up.railway.app/scalar/v1) | Returned HTTP 200 on 8 August 2026 |
| OpenAPI document | [OpenAPI v1 JSON](https://kiwimpact-app-production.up.railway.app/openapi/v1.json) | Returned HTTP 200 with JSON content on 8 August 2026 |
| Source repository | [Zephyr724/msa2026](https://github.com/Zephyr724/msa2026) | Public repository returned HTTP 200 on 8 August 2026 |
| Submission video | Not yet published | Must be added and checked without a signed-in session before submission |

The deployed liveness and database-readiness endpoints also returned HTTP 200
on 8 August 2026:
[liveness](https://kiwimpact-app-production.up.railway.app/health/live) and
[readiness](https://kiwimpact-app-production.up.railway.app/health/ready).

Reviewer credentials and other marking-only information are intentionally not
stored in this public README. Where required, they should be supplied through
the private field in the MSA submission form.

## The core experience

```text
Discover → Understand → Join → Complete → Verify
    → Earn → Record → Share → Continue
```

- Guests can explore published quests through a searchable list, map, detail
  pages, community stories, public Passports, and leaderboards.
- Members can join quests, redeem organizer-issued Completion Codes, submit
  eligible evidence claims, record self-reported activity, earn rewards, and
  build a personal Impact Passport.
- Organizers can create, edit, publish, cancel, and archive their own quests,
  manage capacity and participants, and issue Completion Codes.
- Admins can manage all quests, review evidence claims, manage Community
  Challenges, and perform protected administration operations.

## How Kiwimpact meets the Gamification theme

Drawing on ten years of experience in game design and product management, I
take a practical, product-focused approach to analysing gamification at two
levels.

The first is the **outer layer**, or presentation layer: the game-like systems,
UI, animation, music or sound, visual rewards, and visible mechanics that a user
can immediately see and feel. The second is the **inner layer**, or core layer:
what the game industry calls game loops, including behavior loops, progression
loops, reward-economy loops, and the reasons a player chooses to return.

Kiwimpact does not stop at making an environmental platform look like a game.
It uses the outer layer to make each action understandable and emotionally
rewarding, while the inner layer borrows the structures that help well-designed
games sustain participation and retention. The goal is not to create compulsive
use. It is to turn one useful action into a credible reason to take the next
one. The two layers are explained below.

### Outer layer — what users can see and feel

Although I have previously designed many casual games, I did not mechanically
copy those products or apply a child-oriented game UI to Kiwimpact. The intended
audience is deliberately broad, spanning younger users through adults around 60
years old. The experience therefore needs to be approachable, learnable, and
comfortable for people with very different levels of digital and gaming
familiarity.

My product judgement is that usability, practical value, and functional clarity
must take priority over visible gamification. Gameful presentation should make
real actions easier to understand and more rewarding to complete; it should
never make the product harder to learn or distract from its environmental
purpose. The current UI is the result of that deliberate balance rather than a
direct copy of my previous casual-game experience.

The visual direction is a friendly eco-adventure: energetic, optimistic,
rounded, and gameful without becoming childish. Green nature tones, warm gold
and orange reward accents, rounded cards and panels, topographic textures,
friendly display type, badges, progress meters, and Quest/Mission language give
the product a recognizable identity. Light, Dark, and System themes keep that
identity consistent across desktop and mobile.

The outer layer makes the mechanics legible rather than merely decorative:

- **Quests look actionable.** Cards expose difficulty, XP, place, time,
  participation state, verification method, and the next action, so a member
  understands both the goal and its reward before committing.
- **Progress looks owned.** The Mission Board, level and XP meters, rank title,
  weekly streak, achievements, rarity, trophies, unlocked cosmetics, and
  Passport turn database state into a visible personal identity and history.
- **Completion feels consequential.** After a verified reward commits, the UI
  shows Mission Complete or Mission Verified feedback, authored celebration
  copy, gold XP treatment, particles travelling toward the XP target, XP and
  level movement, rank transitions, achievement stamps, and persistent reward
  resolution. The animation reinforces the connection between the real action
  and the resulting progress; it does not invent or calculate the reward.
- **Community progress is visible.** Leaderboards, Community Challenges,
  public Passports, PNG Share Cards, Verified Stories, comments, and reactions
  make individual contribution part of a broader shared experience.
- **Feedback remains accessible.** Reward feedback is readable without motion,
  supports reduced-motion preferences, uses semantic live status, and can be
  paused or dismissed. Music and sound can be part of a game's outer layer,
  but the current Kiwimpact release intentionally contains no audio and never
  relies on sound to communicate success or failure.

This presentation layer helps users recognize state, understand consequences,
and feel that progress matters. On its own, however, it would only make the
product look game-like. The inner layer is what connects those moments into
continued participation.

### Inner layer — why users take the next action

Kiwimpact borrows the useful foundations behind strong player retention:
immediate feedback, clear short-term goals, meaningful long-term progression,
fair rules, identity, social belonging, and an obvious re-entry point. It does
not copy manipulative retention patterns such as loot boxes, purchasable power,
random economic rewards, or punishment designed to force daily attendance.

#### Action loop

**Discover → Understand → Join → Complete → Verify → Earn**

This loop reduces uncertainty at every step. Discovery creates a manageable
choice; Quest Detail explains what participation means; joining creates
commitment; verification protects the value of the result; and immediate reward
feedback closes the loop. Closing it matters because a delayed or ambiguous
outcome weakens the connection between the environmental action and the sense
of progress.

#### Progression and reward-economy loop

**Verified action → XP transaction → Level / Rank → Achievements / Trophies → Passport → Next goal**

Kiwimpact does not implement a conventional virtual economy with currency,
shops, purchases, or trading. Its economy is a controlled progression economy:
eligible verified action is the input, while XP, milestones, recognition, and
new goals are the outputs. The backend calculates rewards, one completion cannot
legitimately produce the same XP twice, and self-reported activity receives no
competitive credit.

**Why the Shop was deferred.** The original design included a spendable virtual
currency and cosmetic Shop. It could have given members another reason to
complete Quests and more ways to personalise their Passport and identity. After
repeatedly weighing the trade-offs, I deferred it from the MSA release.

Time was one reason: a trustworthy Shop is not just another page. It requires a
wallet and transaction ledger, catalogue, inventory, idempotent purchasing,
equipment state, balance rules, administration, security, content assets, and
substantial testing. Building that economy would have put the completeness,
deployment, and verification of the real Quest-to-impact loop at risk.

The more important product reason was focus. If coins or purchases became the
main objective, members could start choosing activities only to farm currency
or optimise a virtual balance. Real environmental work would then become a
means to obtain digital goods, instead of the purpose of Kiwimpact. The current
release therefore keeps rewards tightly connected to verified environmental and
community contribution. Achievement-unlocked Passport borders, avatar frames,
badges, and other non-economic cosmetics preserve some personalisation without
a wallet, prices, purchases, trading, or random rewards.

The Shop remains a possible future direction, not a discarded idea. It should
be reconsidered only after the core product is stable and there is enough time
for a separate economy design, security model, and full test strategy. Any
future version must keep real-world environmental participation as the primary
goal and prevent currency farming from replacing it. This scope decision is
recorded in
[ADR-0008](specs/adr/ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md).

These rules prevent reward inflation and make progress trustworthy. Short-term
feedback such as XP and streak movement provides momentum; medium-term levels,
ranks, and achievements provide attainable goals; and the Level 99 path,
trophies, Passport history, and rarity provide a long horizon. A member can
always see both what changed and what to work toward next.

#### Community loop

**Verified impact → Leaderboards / Challenges → Share / Story → Community feedback → Discover again**

Individual progress becomes local momentum through privacy-aware leaderboards,
shared Community Challenges, public Passport choices, Share Cards, stories,
comments, and reactions. These create belonging, social proof, and new discovery
routes—the same reasons multiplayer and community games can retain interest—
without collecting a precise residential location or exposing unsafe
small-group rankings.

The three loops reinforce one another: the action loop creates a credible
result, the progression loop gives that result lasting meaning, and the
community loop gives the member a social reason to return and discover another
Quest. The outer layer makes each moment understandable and rewarding; the
inner layer makes continued participation coherent. Gamification therefore
supports the environmental action rather than replacing it.

The product also deliberately avoids invented carbon-equivalent claims. Its
goal is sustained, credible participation—not misrepresented impact or
engagement at any cost.

## Distinctive features

### Trusted real-world completion

Kiwimpact separates organizer-verified Completion Codes, admin-reviewed
evidence claims, and non-rewarding self reports. Completion Codes use protected
lookup values, require eligible participation, and are guarded against duplicate
rewards. XP is always calculated by the backend.

### Progression with long-term identity

The server-authoritative XP ledger supports 99 levels, rank titles, a typed
achievement catalogue, national rarity, lifetime trophies, weekly streaks, and
achievement-unlocked cosmetics. The Impact Passport joins that progression to
verified history, whole-Passport and per-completion PNG sharing, and optional
public Passport links.

### Local community without precise-location exposure

Members can choose a coarse Home Community and compare weekly, monthly, or
all-time progress at community, Auckland, and New Zealand scopes. Privacy
thresholds suppress small identifiable rankings, while Community Challenges
create shared goals.

### Discovery plus a deliberately bounded social layer

Quest discovery combines search, filters, region context, list and Google Maps
views, with list/input fallbacks when Maps is unavailable. Community stories
add galleries, editing, comments, replies, likes, tags, and verified-quest
relationships without expanding into chat, follows, private messages, or a
full social network.

### Full-stack roles and responsive feedback

Email/password and Google authentication, account linking, account recovery,
Organizer-owned CRUD, Admin review, SignalR invalidation, responsive layouts,
Light/Dark/System themes, semantic states, keyboard interaction, and
reduced-motion behavior form one integrated React, .NET, and PostgreSQL product.

## Top 3 Advanced Requirements for Assessment

Only the following three advanced requirements are nominated for marking.

### 1. Security Measures

Security matters because Kiwimpact stores accounts, private evidence claims,
role-protected management data, completion rewards, and public/community data
in the same application.

Implemented controls include:

- **Role-based authorization and ownership checks.** ASP.NET Core authorization
  separates Member, Organizer, and Admin operations. Service and repository
  rules also enforce quest ownership and per-user data boundaries instead of
  relying on hidden frontend controls.
- **Anti-CSRF protection.** Cookie-authenticated mutations require an
  antiforgery token sent in the `X-CSRF-TOKEN` header. The backend validates it
  centrally, and the frontend API client obtains and attaches it.
- **Rate limiting.** Registration, login, Completion Code redemption, post,
  comment, and reaction writes use bounded policies partitioned by the relevant
  actor or client address.
- **Validation and privacy enforcement.** Backend validation rejects invalid
  contracts and URLs; sensitive evidence is never public or fetched by the
  server; community leaderboards apply minimum-group privacy rules.
- **Password and session protection.** ASP.NET Core Identity owns password
  hashing and account tokens, while authentication uses Secure, HttpOnly
  cookies rather than browser-readable bearer tokens.

Evidence:

- [`Program.cs`](backend/src/Kiwimpact.Api/Program.cs)
- [`ApiAntiforgeryFilter.cs`](backend/src/Kiwimpact.Api/Security/ApiAntiforgeryFilter.cs)
- [`AuthController.cs`](backend/src/Kiwimpact.Api/Controllers/AuthController.cs)
- [`OrganizerQuestsController.cs`](backend/src/Kiwimpact.Api/Controllers/OrganizerQuestsController.cs)
- [`apiFetch.ts`](frontend/src/lib/api/apiFetch.ts)
- [`AuthApiTests.cs`](backend/tests/Kiwimpact.IntegrationTests/Api/AuthApiTests.cs)
- [`QuestCompletionApiTests.cs`](backend/tests/Kiwimpact.IntegrationTests/Api/QuestCompletionApiTests.cs)
- [`SocialFeedApiTests.cs`](backend/tests/Kiwimpact.IntegrationTests/Api/SocialFeedApiTests.cs)

### 2. Theme Switching

Kiwimpact supports **Light**, **Dark**, and **System** preferences across public,
member, organizer, and admin routes. The selected preference is validated and
stored locally, while System mode reacts to operating-system changes. An inline
pre-paint script applies the resolved theme before React loads to reduce theme
flash. The switcher exposes keyboard and ARIA state, and inaccessible or invalid
storage safely falls back to System.

This requirement improves comfort, accessibility, and visual consistency on
both desktop and mobile rather than being a decorative color toggle.

Evidence:

- [`theme.ts`](frontend/src/lib/theme.ts)
- [`useThemeSync.ts`](frontend/src/hooks/useThemeSync.ts)
- [`ThemeSwitcher.tsx`](frontend/src/components/ThemeSwitcher.tsx)
- [`ThemeSwitcher.test.tsx`](frontend/tests/integration/ThemeSwitcher.test.tsx)
- [`theme.test.ts`](frontend/tests/unit/theme.test.ts)
- [`useThemeSync.test.tsx`](frontend/tests/unit/useThemeSync.test.tsx)
- [Theme-switching completion report](specs/implementation/reports/08-theme-switching-completion.md)

### 3. Dockerization

The root multi-stage Dockerfile builds the React frontend, publishes the .NET
API, creates an EF Core migration bundle, and produces one single-origin
runtime image. The final container runs as a non-root user, uses a read-only
root filesystem in Compose, exposes health checks, and serves the SPA, API,
SignalR hub, Scalar, and OpenAPI from one origin.

Docker Compose provides PostgreSQL, an explicit one-shot migration job, the
application, durable Data Protection keys, and optional Mailpit. `railway.toml`
adapts the same image for the deployed Railway environment. The public app,
liveness, readiness, Scalar, and OpenAPI routes were reachable when this README
was updated.

Evidence:

- [`Dockerfile`](Dockerfile)
- [`docker-compose.yml`](docker-compose.yml)
- [`railway.toml`](railway.toml)
- [`ProductionRuntimeApiTests.cs`](backend/tests/Kiwimpact.IntegrationTests/Api/ProductionRuntimeApiTests.cs)
- [Local production runtime report](specs/implementation/reports/13-local-production-runtime-completion.md)
- [Railway adapter report](specs/implementation/reports/27-r1-railway-deployment-adaptation-completion.md)

## Advanced requirements checklist

- [x] **Security Measures** — selected for the assessment Top 3.
- [x] **Theme Switching** — selected for the assessment Top 3.
- [x] **Dockerization** — selected for the assessment Top 3.
- [x] **Zustand State Management** — implemented, but intentionally not
  submitted as a fourth scored requirement. Zustand owns shared client-only UI
  state such as theme preference, mobile navigation, and live connection status;
  TanStack Query owns server state
  ([store](frontend/src/stores/useUiStore.ts),
  [accepted boundary](specs/adr/ADR-0005-use-tanstack-query-and-zustand.md)).

Additional supporting work includes SignalR and two Cypress end-to-end
journeys. They are not part of the numbered assessment Top 3. A deployed
WebSocket-transport observation and final production E2E pass must be recorded
before either is presented as completed submission evidence.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, Tailwind CSS, daisyUI |
| Frontend data/state | TanStack Query for server state; Zustand for shared UI state |
| Backend | C# 14, .NET 10, ASP.NET Core Web API |
| Persistence | PostgreSQL, Entity Framework Core, Npgsql |
| Authentication | ASP.NET Core Identity with HttpOnly cookie authentication |
| API documentation | OpenAPI and Scalar |
| Real-time updates | ASP.NET Core SignalR |
| Testing | Vitest, React Testing Library, Cypress, xUnit, Testcontainers |
| Runtime | Docker Compose locally; one Docker image deployed on Railway |

The repository keeps the required frontend, backend, persistence, tests, and
assessment evidence together. The backend follows a Clean Architecture Lite
modular-monolith structure.

```text
msa2026/
├── frontend/               React, TypeScript, Vite, frontend tests, Cypress
├── backend/                .NET solution, EF Core, API, unit/integration tests
├── specs/                  Accepted decisions and AI/implementation evidence
├── docs/                   Supporting design and project documentation
├── docker/                 Runtime support scripts
├── .github/workflows/      Continuous integration
├── Dockerfile              Single-origin production image
├── docker-compose.yml      Local full-stack runtime
├── railway.toml            Railway production adapter
└── README.md
```

## Run locally

### Prerequisites

- Node.js 24 LTS
- .NET SDK 10 or later
- Docker with Compose

### Full single-origin Docker runtime

Copy the safe environment template and replace both `REPLACE` values with
different generated secrets:

```bash
cp .env.example .env
openssl rand -base64 36
openssl rand -base64 32
```

Use the first value for `POSTGRES_PASSWORD` and the second for
`COMPLETION_CODES_HMAC_KEY`. Then start the full stack:

```bash
docker compose up --build -d
docker compose ps
```

Compose waits for PostgreSQL, runs the version-matched EF migration bundle,
then starts the application.

- App: <http://localhost:8080>
- Liveness: <http://localhost:8080/health/live>
- Readiness: <http://localhost:8080/health/ready>
- Scalar: <http://localhost:8080/scalar/v1>

Add the Development profile to run Mailpit at <http://localhost:8025>:

```bash
docker compose --profile development up --build -d
```

Useful operations:

```bash
docker compose logs -f app migrate
docker compose restart app
docker compose down
```

Normal `docker compose down` retains the named PostgreSQL and Data Protection
volumes. Removing those volumes is destructive and is not part of the normal
workflow.

The local Compose route uses HTTP and is intended for packaging/public-route
verification. Production authentication cookies remain Secure-only, so use the
hybrid Development workflow below for local authenticated feature work.

### Hybrid Development runtime

Set `POSTGRES_PASSWORD=kiwimpact_dev` in the ignored root `.env`, then start the
support services:

```bash
docker compose --profile development up -d postgres mailpit
```

Run the API:

```bash
cd backend
dotnet restore
dotnet build Kiwimpact.slnx
dotnet run --project src/Kiwimpact.Api --launch-profile http
```

Run the frontend in a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

The API runs at <http://localhost:5091>. Vite runs at
<http://localhost:5173> and proxies `/api`, `/health`, `/openapi`, `/scalar`,
and `/hubs` to the API. Docker maps PostgreSQL from container port `5432` to
host port `5433`.

For local Google Maps, copy `frontend/.env.example` to the ignored
`frontend/.env.local`, provide a browser-restricted Maps JavaScript API key and
map ID, then restart Vite. Never commit a real key.

### Development test personas

Copy the ignored local template and set a Development-only shared password:

```bash
cd backend
cp src/Kiwimpact.Api/appsettings.Development.local.example.json \
  src/Kiwimpact.Api/appsettings.Development.local.json
```

The Development seed provides three accounts for each persona:

| Persona | Accounts | Roles |
| --- | --- | --- |
| Member | `member1@kiwimpact.test` to `member3@kiwimpact.test` | Member |
| External organizer | `external1@kiwimpact.test` to `external3@kiwimpact.test` | Member, Organizer |
| Admin | `admin1@kiwimpact.test` to `admin3@kiwimpact.test` | Member, Admin |

These identities and their password are Development-only and must never be
used in production.

## Verification

Run frontend gates from `frontend/`:

```bash
npm run lint
npm run type-check
npm run test -- --run
npm run build
```

Run backend gates from `backend/`:

```bash
dotnet build Kiwimpact.slnx
dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
```

Run the public Cypress journey after PostgreSQL, the API, and Vite are ready:

```bash
cd frontend
npm run test:e2e:public
```

Run the authenticated Member journey with ignored Development credentials:

```bash
CYPRESS_E2E_MEMBER_EMAIL=member1@kiwimpact.test \
  CYPRESS_E2E_MEMBER_PASSWORD='<local DemoAccounts password>' \
  npm run test:e2e:member
```

Latest recorded full local gates for the current implementation lineage:

- Frontend: lint, type-check, and build passed; 59 files / 485 Vitest tests
  passed ([report](specs/implementation/reports/51-passport-xp-progress-simplification-completion.md)).
- Backend: build passed; 316 unit tests and 350 PostgreSQL integration tests
  passed ([report](specs/implementation/reports/48-member-loop-v2-integration-completion.md)).
- Cypress: two real local full-stack journeys passed together
  ([public journey](specs/implementation/reports/20-cypress-public-discovery-completion.md),
  [member journey](specs/implementation/reports/21-cypress-authenticated-member-completion.md)).

These are dated evidence records, not a claim that every command was rerun as
part of this documentation-only change.

## Configuration and secrets

| Key | Purpose |
| --- | --- |
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string |
| `Cors:Origins` | Allowed origins for split-origin Development |
| `CompletionCodes:HmacKey` | Protects Completion Code lookup values |
| `DataProtection:ApplicationName` | Stable protected-data discriminator |
| `DataProtection:KeyPath` | Optional durable Data Protection key directory |
| `Authentication:Google:ClientId` / `ClientSecret` | Google authentication credentials |
| `VITE_API_BASE_URL` | Browser API base URL; defaults to `/api` |
| `VITE_DEV_PROXY_TARGET` | Vite proxy target; defaults to `http://localhost:5091` |
| `VITE_GOOGLE_MAPS_API_KEY` | Referrer- and API-restricted browser Maps key |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps Advanced Markers map ID |

Use the ignored root `.env`, .NET User Secrets, ignored local settings, or the
deployment platform's secret manager. Never commit real credentials, reviewer
passwords, completion-code keys, SMTP credentials, or unrestricted Maps keys.

## AI-assisted development

AI supported planning, specification review, implementation, test generation,
debugging, and independent read-only review. The repository preserves this
work so markers can distinguish prompts and proposals from implemented and
verified behavior:

- [`specs/` index](specs/README.md) — accepted product, UX, architecture,
  security, and test specifications.
- [`specs/adr/`](specs/adr/) — accepted architecture decision records.
- [`specs/ai/prompts/`](specs/ai/prompts/) — substantial implementation prompt
  records.
- [`specs/ai/reviews/`](specs/ai/reviews/) — independent review evidence.
- [`specs/implementation/reports/`](specs/implementation/reports/) — observed
  commands, results, limitations, and review status.
- [`AGENTS.md`](AGENTS.md) — repository rules for human approval, evidence,
  verification, and AI-agent boundaries.

AI output was not treated as proof of completion. Source code, migrations,
tests, runtime observations, Git history, and human acceptance remain the
evidence of what the project actually does.

## Self-reflection

If I repeated the project, I would freeze the MVP slice plan, align the
implementation with the final UI direction earlier, and deploy a thin
production-shaped vertical slice sooner. That would expose provider, email,
database-privilege, Google callback, and production-browser issues before the
product surface became large.

The project benefited from small vertical slices and independent review, but
some later UI-convergence and assessment-polish work revisited flows that were
already functionally complete. I would keep branches smaller, update the README
and project status at every merge, and reserve more time for user testing,
accessibility polish, and submission rehearsal.

Finally, I would budget earlier for bundle splitting and production end-to-end
observability. The current automated test layers are extensive, but continuous
checks against the deployed origin would make release confidence clearer and
reduce the gap between a locally verified Docker image and a fully evidenced
public deployment.

## Remaining submission work and known limitations

- Publish the submission video (maximum six minutes), add its public link above,
  and verify it in a signed-out/private browser session.
- Record the exact deployed Git SHA and complete the final production smoke
  evidence, including authentication, Google callback, Maps restrictions,
  SignalR WebSocket transport, secure-cookie behavior, and a backup/restore
  drill. The HTTP 200 checks recorded in this README do not prove all of those
  behaviors.
- Confirm the production email-provider workflow before presenting normal
  email/password registration and recovery as fully operational online.
- The Vite build retains a known large-chunk advisory; route-level splitting is
  a future performance improvement.
- A React Router advisory affecting unstable RSC APIs is recorded in project
  evidence. Kiwimpact is a client-only Vite SPA and does not use that mode; a
  major-version upgrade still requires a separate approved regression task.

For the authoritative distinction between accepted scope, implemented source,
and observed verification, use the accepted decisions and dated evidence under
[`specs/`](specs/). [`PROJECT_STATUS.md`](PROJECT_STATUS.md) is a historical
running log and still requires a separate current-state refresh.
