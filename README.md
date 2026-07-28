# Kiwimpact — Community eco quests across New Zealand

**Status: Slices 9–13 implemented and independently reviewed**

Kiwimpact is an Auckland-first gamified community environmental participation
platform for Aotearoa New Zealand. The technical foundation is now in place.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind CSS + daisyUI |
| Backend | C# .NET 10 + ASP.NET Core Web API |
| Database | PostgreSQL (via Entity Framework Core + Npgsql) |
| API Docs | Scalar |
| Testing | Vitest + React Testing Library (frontend), xUnit (backend) |
| Local/Production Runtime | Docker Compose; one ASP.NET Core image serving React, API, SignalR, Scalar and OpenAPI |

## Repository Structure

```
frontend/       React + TypeScript + Vite application
backend/        .NET solution (Kiwimpact.Api, Kiwimpact.Core, Kiwimpact.Infrastructure)
specs/          Accepted specifications, ADRs, reviews
Dockerfile          Single-origin production image and EF migration bundle
docker-compose.yml  Full local runtime, PostgreSQL and optional Mailpit
```

## Prerequisites

- Node.js 24 LTS
- .NET SDK 10+
- Docker (for PostgreSQL and Mailpit)

## Local Setup

### 1. Prepare local Compose values

Copy the safe template, then replace both `REPLACE` values. Generate a
different value for each:

```bash
cp .env.example .env
openssl rand -base64 36
openssl rand -base64 32
```

The first output is suitable for `POSTGRES_PASSWORD`; the second is suitable
for `COMPLETION_CODES_HMAC_KEY`. `.env` is ignored by Git. Never commit real
credentials.

### 2. Choose a local workflow

#### Full single-origin runtime

```bash
docker compose up --build -d
docker compose ps
```

Compose waits for PostgreSQL, runs the version-matched EF migration bundle
once, then starts the application. Open:

- App: `http://localhost:8080`
- Liveness: `http://localhost:8080/health/live`
- Database/migration readiness: `http://localhost:8080/health/ready`
- Scalar: `http://localhost:8080/scalar/v1`

The full local runtime uses HTTP because provider-neutral TLS termination is
not part of Slice 13. Production authentication cookies remain secure-only, so
this path verifies packaging and public/runtime routes; it is not evidence of
production authentication over HTTP.

To include the local email inbox:

```bash
docker compose --profile development up --build -d
```

Mailpit is then available at `http://localhost:8025`.

Useful operations:

```bash
docker compose logs -f app migrate
docker compose restart app
docker compose down
```

`docker compose down` retains the named PostgreSQL and Data Protection volumes.
Removing volumes deletes local database and key state and is intentionally not
part of the normal command.

#### Hybrid development runtime

For Vite and the .NET process on the host, set `POSTGRES_PASSWORD` in `.env` to
the documented development-only value `kiwimpact_dev`, then start only the
supporting services:

```bash
docker compose --profile development up -d postgres mailpit
```

### 3. Backend

```bash
cd backend
dotnet restore
dotnet build
dotnet test
dotnet run --project src/Kiwimpact.Api --launch-profile http
```

The API starts on `http://localhost:5091` with the `http` launch profile. Port
`5091` avoids the macOS Control Center/AirPlay service that commonly reserves
port `5000`.

#### Development test personas

To enable the nine confirmed local test accounts, copy the ignored local
configuration template and choose a development-only password:

```bash
cp src/Kiwimpact.Api/appsettings.Development.local.example.json \
  src/Kiwimpact.Api/appsettings.Development.local.json
```

Set `DemoAccounts:Password` in the copied file, then restart the API. The file
is ignored by Git, the seed is Development-only and idempotent, and environment
variables remain authoritative. The seeded identities are:

| Persona | Accounts | Accepted roles |
|---------|----------|----------------|
| Member | `member1@kiwimpact.test` through `member3@kiwimpact.test` | Member |
| External organizer | `external1@kiwimpact.test` through `external3@kiwimpact.test` | Member + Organizer |
| Admin | `admin1@kiwimpact.test` through `admin3@kiwimpact.test` | Member + Admin |

“External” is a testing persona for externally sourced event management; it
uses the accepted Organizer role rather than introducing a fourth
authorization role. Never use these identities or their shared local password
in production.

**Selected public endpoints:**

| Endpoint | URL |
|----------|-----|
| Health | `GET /health` |
| OpenAPI JSON | `GET /openapi/v1.json` |
| Scalar Docs | `/scalar/v1` |
| Active local Regions | `GET /api/v1/regions` |
| Region detail | `GET /api/v1/regions/{id}` |
| Region children | `GET /api/v1/regions/{id}/children` |
| Region ancestors | `GET /api/v1/regions/{id}/ancestors` |
| Published Quest discovery | `GET /api/v1/quests` |
| Published Quest detail | `GET /api/v1/quests/{id}` |
| Published Quest images | `GET /api/v1/quests/{id}/images` |

### 4. Frontend

```bash
cd frontend
npm ci
npm run dev
```

The dev server starts on `http://localhost:5173` and proxies `/api`, `/health`,
`/openapi`, `/scalar`, and `/hubs` to the backend.

**Commands:**

```bash
npm run lint         # oxlint
npm run type-check   # tsc --noEmit
npm run test         # vitest
npm run build        # production build
```

## Configuration

| Key | Description |
|-----|-------------|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string |
| `Cors:Origins` | Allowed CORS origins for split-origin development (array) |
| `DataProtection:ApplicationName` | Shared discriminator for protected application data |
| `DataProtection:KeyPath` | Optional durable filesystem key directory |
| `HttpsRedirection:Enabled` | HTTPS redirect switch; defaults on outside Development |
| `VITE_API_BASE_URL` | Browser API base URL for `apiFetch` (default: `/api`) |
| `VITE_DEV_PROXY_TARGET` | Backend URL for Vite dev proxy (default: `http://localhost:5091`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Dedicated browser key restricted to Maps JavaScript API and approved website referrers |
| `VITE_GOOGLE_MAPS_MAP_ID` | JavaScript map ID used by Google Maps Advanced Markers |

Use `appsettings.Development.json` only for non-sensitive local defaults.
Use `.NET User Secrets`, the ignored root `.env`, or environment variables for
secrets.

For local maps, copy `frontend/.env.example` to the ignored
`frontend/.env.local`, set both Google Maps values, and restart Vite. The
Google Cloud project must have billing and Maps JavaScript API enabled. Restrict
the browser key to Maps JavaScript API and these local website referrers:
`http://localhost:5173/*` and `http://127.0.0.1:5173/*`. Production needs its
own restricted browser key and exact deployed HTTPS origins injected while
building the Vite frontend. Never commit a real key.

**Hybrid local connection string:**

```
Host=localhost;Port=5433;Database=kiwimpact;Username=kiwimpact;Password=kiwimpact_dev
```

> **Port mapping:** Docker Compose maps host port `5433` to container port `5432`
> so the PostgreSQL container does not conflict with another local PostgreSQL
> service that may already use the default host port `5432`.
>
> Verify the services are running with:
>
> ```bash
> docker compose ps
> ```

## Current State

- Slices 0–8 are merged into `main`; sequential Slice 9–12 feature branches
  implement the richer MVP product experience.
- The current Slice 12 work aligns the production member experience with the
  local Figma Make reference using authoritative data: full Passport summary
  and community history, a dedicated Share Card Builder, member-momentum Home,
  and stateful My Quests Mission Board.
- Google Maps Quest discovery, trusted/self-reported completion, Admin Review,
  account lifecycle, Home Community, multi-layer leaderboards, weekly streak,
  Community Challenges, and SignalR invalidation are implemented on the
  convergence branches.
- TanStack Query owns server state and REST remains authoritative. SignalR is
  invalidation-only.
- ASP.NET Core Identity uses HttpOnly cookie authentication with antiforgery,
  server-side authorization, ownership, validation, and privacy enforcement.
- PostgreSQL integration tests run through Testcontainers and apply the real
  migrations.
- Latest Slice 12 local gates: 326 frontend tests, 247 backend unit tests, and
  286 PostgreSQL integration tests passed. Kimi K3 Review 59 approved the
  Slice with no remaining Blocker or Major.
- Slice 13 adds a provider-neutral, single-origin production image, explicit
  migration job, durable Data Protection keys, readiness/liveness probes, and
  a documented local full-stack startup path. The image, migration ordering,
  health routes, deep links, and database/key persistence have been locally
  verified. Public deployment remains a separate provider decision.

## Key References

- [`specs/`](specs/)
- [PROJECT_STATUS.md](PROJECT_STATUS.md)
