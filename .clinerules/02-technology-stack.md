# 02 — Technology Stack & Toolchain

## 2.1 Runtimes
- **Frontend**: Node.js 24 LTS
- **Backend**: .NET 10+
- **CI**: GitHub Actions with appropriate runtime matrix
- Do not support multiple runtime versions unless explicitly testing against a matrix in CI.

## 2.2 Accepted Technology Choices

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- daisyUI
- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Lucide React
- Motion for React
- html-to-image
- canvas-confetti
- @vis.gl/react-google-maps

Do not include shadcn/ui initially.

State ownership rules:

- `apiFetch` owns HTTP transport.
- TanStack Query owns authoritative server state.
- Zustand owns only small cross-component UI state.
- React state owns local component state.
- URL search parameters own filters, sorting, pagination, and view state.
- Do not duplicate Quest, user, XP, achievement, completion, or leaderboard
  server data in Zustand.
- Initial stores: `useUiStore`, `useRewardStore`.

### Backend

- .NET 10+
- ASP.NET Core
- Entity Framework Core
- Npgsql (PostgreSQL driver)
- ASP.NET Core Identity
- SignalR
- Scalar

### Testing

| Type | Tool |
| ---- | ---- |
| Frontend unit/integration | Vitest + React Testing Library |
| Backend unit | xUnit v3 |
| Backend integration | xUnit + WebApplicationFactory + Testcontainers |
| Full-stack E2E | Cypress |

## 2.3 Resolved Versions

Exact package versions are determined only after scaffolding and are proven
by `package.json`, `package-lock.json`, project files (`.csproj`), and
resolved package metadata. Do not invent or manually preselect versions
without checking compatibility. A dependency major upgrade requires an ADR
only when it changes architecture, runtime behavior, public contracts, or
persistence format. Other major upgrades require a reviewed dependency-upgrade PR with
  migration notes where applicable.

## 2.4 Package Managers
- **Frontend**: npm (with `package-lock.json` committed after scaffold)
- **Backend**: NuGet
- Frontend lockfile (`package-lock.json`) proves resolved dependency versions.
- Backend project files (`.csproj`) and restored package metadata prove
  resolved dependency versions. A NuGet lockfile is not currently mandated.

## 2.5 Local Infrastructure (accepted target)

- The accepted baseline specifies Docker Compose for PostgreSQL and Mailpit.
- Frontend dev server proxies `/api/*` and `/hubs/*` to the .NET backend.
- Do not claim Docker Compose is running unless the file exists and the
  services have been verified.

## 2.6 Dependency Governance
- New dependencies require justification, bundle-size review (frontend),
  and license check.
- No untriaged critical/high vulnerability may remain.
- Dependency changes require security review under `04c-dependency-security.md`.

## 2.7 Frontend Code Quality (planned — activate after scaffold)

- `npm run format:check` passes (Prettier)
- `npm run lint` passes (ESLint, no errors, no warnings)
- `npm run typecheck` passes (`tsc --noEmit`)
- `npm test` passes (unit + integration)
- `npm run build` passes for production source changes and release candidates

## 2.8 Backend Code Quality (planned — activate after scaffold)

- `dotnet format --verify-no-changes` passes
- `dotnet build` passes
- `dotnet test` passes
- EF Core migrations are up-to-date and verified