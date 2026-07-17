---
alwaysApply: true
---

# 01 — Architecture Constraints

## 1.1 Directory Structure
```
msa2026/
├── src/
│   ├── db/              # Connection management, query functions, seed data
│   ├── routes/          # Express route handlers (HTTP parameter parsing only)
│   ├── services/        # Business logic layer
│   ├── middleware/       # Auth, logging, rate-limiting, error handling
│   ├── schemas/         # Zod validation schemas
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Shared utilities
│   ├── config/          # Environment-based configuration
│   ├── app.ts           # Express app creation & configuration (no listen)
│   └── server.ts        # Entry point: imports app, calls app.listen()
├── tests/
│   ├── unit/
│   ├── integration/
│   │   ├── db/          # Repository integration tests (real SQLite)
│   │   └── api/         # API integration tests (app + service + test DB + Supertest)
│   └── e2e/
├── scripts/
│   └── migrations/      # Timestamp-named migration files (canonical schema history)
├── .github/
│   └── workflows/       # CI/CD pipeline definitions
├── init_db.sql          # Initial baseline snapshot (generated from migrations)
├── .clinerules/         # Agent steering rules (multi-file, this directory)
├── docs/                # Architecture ADRs, operations runbooks, security docs
├── .env.example         # Environment variable template
├── package.json
├── tsconfig.json        # Full type-check: src + tests
├── tsconfig.build.json  # Production build config (src → dist only)
└── vitest.config.ts
```

## 1.2 App/Server Separation
- **`src/app.ts`** — Creates and configures the Express application (middleware, routes, error handler). Does NOT call `app.listen()`.
- **`src/server.ts`** — Imports the configured app from `app.ts` and calls `app.listen()`. This is the actual entry point.
- This separation allows integration tests to import the app directly via `request(app)` without starting a real server.

## 1.3 API Architecture
- **Style**: REST via Express (decided by ADR-001 in `docs/architecture/adr/`)
- **URL convention**:
  ```
  GET    /api/v1/<resource>          # List resources
  POST   /api/v1/<resource>          # Create resource
  GET    /api/v1/<resource>/:id      # Get single resource
  PATCH  /api/v1/<resource>/:id      # Partial update
  DELETE /api/v1/<resource>/:id      # Delete resource (soft or hard)
  ```
- Routes must use Express `Router`; no inline route definitions in `app.ts` or `server.ts`
- Use `PATCH` for partial updates, not `PUT`. `PUT` is only appropriate for full replacement operations.
- Collection-level `DELETE` and `PUT` are NOT supported unless explicitly required by a new ADR.

## 1.4 Layering Principle (Strictly Enforced)
- **Routes layer** — parameter parsing & HTTP response only; zero business logic
- **Services layer** — all business logic; called by routes, and may also be called by jobs, tests, CLI adapters, and other entry points
- **Database layer** — exposes parameterized query functions only; NEVER concatenates user input into SQL
- **Middleware layer** — cross-cutting concerns: authentication, logging, rate-limiting, CORS
- **Forbidden cross-layer calls**: Routes → DB direct is a violation; must route through Services
- **Forbidden circular dependencies**: detected via `madge` or ESLint import rules

## 1.5 Error Handling
- Route handlers must propagate errors to the centralized error middleware; do not catch errors locally unless the handler can meaningfully recover or add context before rethrowing
- Express error middleware signature: `(err, req, res, next)` with four parameters
- Error responses follow a consistent JSON envelope: `{ error: { code: string, message: string } }`
- Stack traces must never be exposed in error responses (production: `NODE_ENV=production` strips them)

## 1.6 API Response Conventions
- Success responses use HTTP 2xx with JSON body
- 201 for resource creation; include `Location` header with the new resource URL
- 204 for successful deletes (soft or hard, depending on resource policy)
- 400 for validation errors; 404 for not found; 409 for conflicts (e.g., duplicate email)
- 500 for unexpected server errors (caught by error middleware)