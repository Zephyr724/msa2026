# 01 — Architecture Constraints

## 1.1 Directory Structure
```
msa2026/
├── src/
│   ├── db/              # Connection management, transaction helpers, seed data (no domain queries)
│   ├── repositories/    # Data access layer (domain-specific parameterized queries, SQL only)
│   ├── policies/        # Authorization policy functions
│   ├── services/        # Business logic layer (depends on repositories + policies)
│   ├── routes/          # Express route handlers (depends on services only)
│   ├── middleware/       # Auth, logging, rate-limiting, error handling
│   ├── schemas/         # Zod validation schemas
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Shared utilities
│   ├── config/          # Environment-based configuration
│   ├── composition/     # Dependency wiring (create_dependencies.ts)
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
├── PROJECT_STATUS.md    # Point-in-time project status snapshot
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

## 1.3 Composition Root & Dependency Injection

The application MUST use a composition root pattern. No module may import a
global singleton database connection or configuration directly.

Assembly order:

```
Database
  → Repositories
  → Authorization policies
  → Services
  → Routes
  → Express app
```

```typescript
// src/app.ts
interface AppDependencies {
  userService: UserService;
  projectService: ProjectService;
  taskService: TaskService;
  logger: Logger;
  config: AppConfig;
}

const createApp = (deps: AppDependencies): Express => {
  // Middleware and routes receive services, never the raw database.
};
```

- **Production entry** (`server.ts`): creates real dependencies via a
  composition module (`src/composition/create_dependencies.ts`), calls
  `createApp()`.
- **Test entry**: creates test database / silent logger / test config, calls
  `createApp()` with test service instances.
- **Jobs, CLI adapters, MCP tools**: receive their own service instances via
  the composition module; never import a global singleton.
- The database connection may be a single long-lived connection for the
  application lifetime, but it must be wired through the composition root,
  not imported as a module-level global.
- Raw database access is restricted to the infrastructure boundaries listed
  in Section 1.6.
- Routes, services, middleware, policies, and general application utilities
  MUST NOT receive or import the raw database connection.
- Services depend on repository interfaces, not `better-sqlite3` directly.

The dependency example is illustrative, not a required initial shape.
Do not create placeholder services. `AppDependencies` contains only
dependencies required by routes that currently exist.

## 1.4 API Architecture
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

## 1.5 Layering Principle (Strictly Enforced)

```

Routes ──→ Services ──→ Repository Interfaces
               │
               └──→ Authorization Policies
                        │
              Repository Implementations
                        │
                  SQLite Connection
```

- **Routes layer** — parameter parsing & HTTP response only; zero business logic. Depends only on service interfaces and HTTP middleware.
- **Services layer** — all business logic; called by routes, and may also be called by jobs, tests, CLI adapters, and other entry points. Depends on repository interfaces and authorization policies.
- **Authorization policies** — resource ownership and action-level checks. Must not depend on HTTP request objects.
- **Repository implementations** — domain-specific parameterized SQL queries and row mapping. Depend on the database adapter.
- **`src/db/**`** — connection management, transactions, and test database creation. Contains NO domain-specific queries.
- **Middleware layer** — cross-cutting concerns: authentication, logging, rate-limiting, CORS.
- Only repository implementations, migration tooling, and database factories may import `better-sqlite3`.
- **Forbidden cross-layer calls**: Routes → DB direct is a violation; must route through Services.
- **Forbidden circular dependencies**: detected via `madge` or ESLint import rules.

## 1.6 Transaction Boundaries

- The service layer owns business transaction boundaries.
- Services that require atomic work across repositories depend on an injected
  `TransactionRunner` interface.
- `TransactionRunner.run()` accepts a synchronous callback and returns its
  result. The callback MUST NOT return a Promise.
- Repository implementations are bound to the same application database
  connection, so calls made inside `run()` participate in the same SQLite
  transaction.
- Services, routes, middleware, and policies MUST NOT receive the raw SQLite
  connection.
- Raw database access is restricted to:
  - `src/db/**`;
  - repository implementations;
  - migration tooling;
  - test database factories;
  - the composition root while wiring dependencies.
- Do not perform network, filesystem, queue, email, or other asynchronous I/O
  inside a database transaction.

## 1.7 Authorization Architecture

```
Route middleware:
- Authentication (verify identity)
- Coarse role checks (if applicable)
- HTTP-specific checks (CSRF, CORS, rate limiting)

Service / Authorization policy layer:
- Resource ownership verification
- Action-level authorization (can this actor perform this action?)
- Tenant boundaries
- Domain invariants
```

- Authentication and coarse role checks may run in route middleware.
- Resource-level authorization MUST be enforced through centralized
  authorization policy functions called by the service layer.
- Services MUST NOT assume that callers have passed through HTTP middleware.
  Jobs, CLI adapters, and MCP tools may call services directly.
- Every read and mutation involving owned resources MUST evaluate:
  `actor + action + resource`.
- Reading another user's private resources (IDOR) is a violation equivalent
  to unauthorized mutation.

## 1.8 Error Handling
- Route handlers must propagate errors to the centralized error middleware; do not catch errors locally unless the handler can meaningfully recover or add context before rethrowing
- Express error middleware signature: `(err, req, res, next)` with four parameters
- Error responses follow a consistent JSON envelope: `{ error: { code: string, message: string } }`
- The centralized error middleware MUST explicitly construct the client
  response from an allowlisted error shape. It MUST never serialize `Error`,
  `error.stack`, SQL errors, filesystem paths, or dependency error objects.
  `NODE_ENV=production` is not considered sufficient enforcement.
- Express 5 async handlers may throw; rejected Promises are forwarded to the
  error middleware automatically.

## 1.9 API Response Conventions
- Success responses use HTTP 2xx with JSON body
- 201 for resource creation; include `Location` header with the new resource URL
- 204 for successful deletes (soft or hard, depending on resource policy)
- 400 for validation errors; 401 for missing/invalid authentication; 403 for insufficient permissions
- 404 for not found; 409 for conflicts (e.g., duplicate email); 429 for rate limit exceeded
- 500 for unexpected server errors (caught by error middleware)
