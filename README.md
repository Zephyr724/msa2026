# Kiwimpact — Community eco quests across New Zealand

**Status: Slice 1 Region and Public Quest Read merged and frozen**

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

**Available endpoints:**

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

Use `appsettings.Development.json` for local overrides, `.NET User Secrets`
or environment variables for secrets.

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

- Slice 0 Foundation is implemented.
- Slice 1 Region and Public Quest Read is complete, merged through PR #3, and
  frozen.
- Current work is workflow and scope convergence before Slice 2.
- React Router provides public Quest discovery and detail pages.
- TanStack Query owns Region and Quest server state; discovery filters,
  sorting, search, page, and page size are URL-owned.
- ASP.NET Core exposes anonymous Region and published-Quest read APIs plus
  health, OpenAPI, and Scalar endpoints.
- Three-project Clean Architecture Lite structure is established.
- EF Core Region, Quest, QuestImage, and Identity-backed curator persistence
  is configured with a PostgreSQL migration and Development-only demo seeds.
- PostgreSQL integration tests run through Testcontainers and apply the real
  migration.
- Final Slice 1 verification on 2026-07-24 passed: backend build with
  0 warnings/0 errors, 34 unit tests, 73 PostgreSQL integration tests,
  and 65 frontend tests across 6 files, plus frontend lint, type-check,
  and production build.

## Key References

- [`specs/`](specs/)
- [PROJECT_STATUS.md](PROJECT_STATUS.md)
