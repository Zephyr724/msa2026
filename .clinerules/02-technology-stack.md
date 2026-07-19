# 02 — Technology Stack & Toolchain

## 2.1 Runtimes
- **Frontend**: Node.js 24 LTS
- **Backend**: .NET 10+
- **CI**: GitHub Actions with appropriate runtime matrix
- Do not support multiple runtime versions unless explicitly testing against a matrix in CI.

## 2.2 Frontend Stack

| Package | Purpose |
| -------- | ------- |
| React 19 | UI framework |
| TypeScript 5.9+ | Type-safe development |
| Vite 6+ | Build tool and dev server |
| Tailwind CSS 4 | Utility-first CSS |
| daisyUI 5 | Tailwind CSS component library |
| React Router 7 | Client-side routing |
| TanStack Query 5 | Server state management |
| Zustand 5 | UI state management |
| React Hook Form 7 | Form handling |
| Zod 4 | Schema validation |
| Lucide React | Icons |
| Motion for React | Animation |
| html-to-image | Share card generation |
| canvas-confetti | Reward effects |
| @vis.gl/react-google-maps | Map integration |

## 2.3 Backend Stack

| Package | Purpose |
| -------- | ------- |
| .NET 10+ | Runtime |
| ASP.NET Core | Web API framework |
| Entity Framework Core | ORM |
| Npgsql | PostgreSQL driver |
| ASP.NET Core Identity | Authentication and user management |
| SignalR | Real-time communication |
| Scalar | API documentation |
| System.Text.Json | JSON serialization |

## 2.4 Testing Stack

| Type | Frontend | Backend |
| ---- | -------- | ------- |
| Unit | Vitest + React Testing Library | xUnit v3 |
| Integration | — | xUnit + WebApplicationFactory + Testcontainers |
| E2E | Cypress | Cypress |

## 2.5 Local Infrastructure

- Docker Compose runs PostgreSQL and Mailpit.
- Frontend dev server proxies `/api/*` and `/hubs/*` to the .NET backend.
- See `docker-compose.yml` for service definitions.

## 2.6 Package Managers
- **Frontend**: npm (with `package-lock.json` committed)
- **Backend**: NuGet (with `packages.lock.json` committed)
- Exact dependency resolution is guaranteed by lockfiles, not by caret/tilde ranges.
- Dependency changes require security review under `04c-dependency-security.md`.

## 2.7 Dependency Governance
- A dependency major upgrade requires an ADR only when it changes architecture,
  runtime behavior, public contracts, or persistence format. Other major
  upgrades require a reviewed migration PR.
- New dependencies require justification, bundle-size review (frontend),
  and license check.
- No untriaged critical/high vulnerability may remain.

## 2.8 Frontend Code Quality
- `npm run format:check` passes (Prettier)
- `npm run lint` passes (ESLint, no errors, no warnings)
- `npm run typecheck` passes (`tsc --noEmit`)
- `npm test` passes (unit + integration)
- `npm run build` passes for production source changes and release candidates
- Circular dependency check passes (`madge`)

## 2.9 Backend Code Quality
- `dotnet format --verify-no-changes` passes
- `dotnet build` passes
- `dotnet test` passes
- EF Core migrations are up-to-date and verified