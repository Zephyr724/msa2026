# Kiwimpact — Community eco quests across New Zealand

**Status: Slices 9–12 implemented and independently reviewed**

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
| Local Infra | Docker Compose (PostgreSQL, Mailpit) |

## Repository Structure

```
frontend/       React + TypeScript + Vite application
backend/        .NET solution (Kiwimpact.Api, Kiwimpact.Core, Kiwimpact.Infrastructure)
specs/          Accepted specifications, ADRs, reviews
docker-compose.yml  PostgreSQL + Mailpit local infrastructure
```

## Prerequisites

- Node.js 24 LTS
- .NET SDK 10+
- Docker (for PostgreSQL and Mailpit)

## Local Setup

### 1. Start local infrastructure

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
dotnet restore
dotnet build
dotnet test
dotnet run --project src/Kiwimpact.Api --launch-profile http
```

The API starts on `http://localhost:5000` with the `http` launch profile.

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

### 3. Frontend

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
| `Cors:Origins` | Allowed CORS origins (array) |
| `VITE_API_BASE_URL` | Browser API base URL for `apiFetch` (default: `/api`) |
| `VITE_DEV_PROXY_TARGET` | Backend URL for Vite dev proxy (default: `http://localhost:5000`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Dedicated browser key restricted to Maps JavaScript API and approved website referrers |
| `VITE_GOOGLE_MAPS_MAP_ID` | JavaScript map ID used by Google Maps Advanced Markers |

Use `appsettings.Development.json` for local overrides, `.NET User Secrets`
or environment variables for secrets.

For local maps, copy `frontend/.env.example` to the ignored
`frontend/.env.local`, set both Google Maps values, and restart Vite. The
Google Cloud project must have billing and Maps JavaScript API enabled. Restrict
the browser key to Maps JavaScript API and these local website referrers:
`http://localhost:5173/*` and `http://127.0.0.1:5173/*`. Production needs its
own restricted browser key and exact deployed HTTPS origins injected while
building the Vite frontend. Never commit a real key.

**Local connection string:**

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

- Slices 0–8 are merged into `main`; sequential Slice 9–11 feature branches
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

## Key References

- [`specs/`](specs/)
- [PROJECT_STATUS.md](PROJECT_STATUS.md)
