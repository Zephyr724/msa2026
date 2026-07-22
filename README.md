# Kiwimpact — Community eco quests across New Zealand

**Status: Slice 0 Foundation implemented**

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

**Foundation endpoints:**

| Endpoint | URL |
|----------|-----|
| Health | `GET /health` |
| OpenAPI JSON | `GET /openapi/v1.json` |
| Scalar Docs | `/scalar/v1` |

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
Host=localhost;Database=kiwimpact;Username=kiwimpact;Password=kiwimpact_dev
```

## Current State

- Slice 0 Foundation is implemented.
- React frontend builds, runs, and renders the application shell.
- ASP.NET Core backend builds, runs, and exposes health and Scalar endpoints.
- Three-project Clean Architecture Lite structure is established.
- EF Core and PostgreSQL boundaries are configured (no entities or migrations yet).
- Frontend and backend unit tests pass.
- **No business features are implemented.**

Integration tests (`Kiwimpact.IntegrationTests`) are deferred to the first
data-backed feature slice (no entities, migrations, or persistence behaviour
exist yet).

## Key References

- [`specs/`](specs/)
- [PROJECT_STATUS.md](PROJECT_STATUS.md)