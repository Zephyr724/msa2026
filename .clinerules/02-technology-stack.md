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

### Backend

- .NET 10+
- ASP.NET Core
- Entity Framework Core
- Npgsql (PostgreSQL driver)
- ASP.NET Core Identity
- SignalR
- Scalar
- System.Text.Json

### Testing

| Type | Frontend | Backend |
| ---- | -------- | ------- |
| Unit | Vitest + React Testing Library | xUnit v3 |
| Integration | — | xUnit + WebApplicationFactory + Testcontainers |
| E2E | Cypress | Cypress |

## 2.3 Resolved Versions

Exact package versions are determined only after scaffolding and are proven
by `package.json`, `package-lock.json`, project files (`.csproj`), and
resolved package metadata. Do not invent or manually preselect versions
without checking compatibility. A dependency major upgrade requires an ADR
only when it changes architecture, runtime behavior, public contracts, or
persistence format. Other major upgrades require a reviewed migration PR.

## 2.4 Package Managers
- **Frontend**: npm (with `package-lock.json` committed after scaffold)
- **Backend**: NuGet
- Exact dependency resolution will be proven by committed lockfiles once
  configured.

## 2.5 Local Infrastructure

- Docker Compose runs PostgreSQL and Mailpit.
- Frontend dev server proxies `/api/*` and `/hubs/*` to the .NET backend.
- See `docker-compose.yml` for service definitions.

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