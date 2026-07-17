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
│   └── index.ts         # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
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
├── tsconfig.json
└── vitest.config.ts
```

## 1.2 API Architecture
- **Style**: REST via Express (decided by ADR-001 in `docs/architecture/adr/`)
- **URL convention**: `GET/POST/PUT/DELETE /api/v1/<resource>` and `GET/PUT/DELETE /api/v1/<resource>/:id`
- Routes must use Express 4.x `Router`; no inline route definitions in `index.ts`

## 1.3 Layering Principle (Strictly Enforced)
- **Routes layer** — parameter parsing & HTTP response only; zero business logic
- **Services layer** — all business logic; called by routes, and may also be called by jobs, tests, CLI adapters, and other entry points
- **Database layer** — exposes parameterized query functions only; NEVER concatenates user input into SQL
- **Middleware layer** — cross-cutting concerns: authentication, logging, rate-limiting, CORS
- **Forbidden cross-layer calls**: Routes → DB direct is a violation; must route through Services
- **Forbidden circular dependencies**: detected via `madge` or ESLint import rules

## 1.4 Error Handling
- Route handlers must propagate errors to the centralized error middleware; do not catch errors locally unless the handler can meaningfully recover or add context before rethrowing
- Express error middleware signature: `(err, req, res, next)` with four parameters
- Error responses follow a consistent JSON envelope: `{ error: { code: string, message: string } }`
- Stack traces must never be exposed in error responses (production: `NODE_ENV=production` strips them)

## 1.5 API Response Conventions
- Success responses use HTTP 2xx with JSON body
- 201 for resource creation; include `Location` header with the new resource URL
- 204 for successful deletes (soft or hard, depending on resource policy)
- 400 for validation errors; 404 for not found; 409 for conflicts (e.g., duplicate email)
- 500 for unexpected server errors (caught by error middleware)