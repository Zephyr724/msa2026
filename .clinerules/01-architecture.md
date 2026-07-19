# 01 — Architecture Constraints

## 1.1 Directory Structure

```
msa2026/
├── frontend/               # React + TypeScript + Vite + Tailwind CSS + daisyUI
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── backend/
│   ├── src/
│   │   ├── Kiwimpact.Api/         # Controllers, contracts, DI, auth, CSRF, SignalR, Scalar
│   │   ├── Kiwimpact.Core/        # Domain/application rules and abstractions
│   │   └── Kiwimpact.Infrastructure/ # EF Core, PostgreSQL, Identity, migrations, seeds, background services
│   └── tests/
│       ├── Kiwimpact.UnitTests/
│       └── Kiwimpact.IntegrationTests/
├── specs/                  # Current Kiwimpact specifications (the single source of truth)
│   ├── 00-project-profile.md
│   ├── product/
│   ├── ux/
│   ├── architecture/
│   ├── security/
│   ├── testing/
│   ├── ai/
│   │   └── prompts/
│   └── adr/
├── docs/
│   └── archive/            # Superseded Node.js/Express/SQLite project materials
├── docker-compose.yml      # PostgreSQL + Mailpit (local dev infrastructure)
├── .clinerules/            # Agent steering rules (this directory)
├── PROJECT_STATUS.md
└── README.md
```

## 1.2 Clean Architecture Lite / Modular Monolith

Kiwimpact follows a Clean Architecture Lite approach as a modular monolith:

```
┌────────────────────────────────────────┐
│ Kiwimpact.Api (Presentation)           │
│ Controllers, DTOs, DI, Auth, CSRF,     │
│ SignalR Hubs, Scalar, Problem Details  │
├────────────────────────────────────────┤
│ Kiwimpact.Core (Domain / Application)  │
│ Entities, Value Objects, Interfaces,   │
│ Business Rules, Domain Services        │
├────────────────────────────────────────┤
│ Kiwimpact.Infrastructure (Data)        │
│ EF Core DbContext, Migrations,         │
│ Repository Implementations,            │
│ Identity Stores, Background Services   │
└────────────────────────────────────────┘
```

### Responsibilities

- **Api:** controllers, request/response DTOs, dependency injection composition,
  authentication config, CSRF, ASP.NET Core policies, SignalR hubs, Scalar
  API documentation, Problem Details middleware.
- **Core:** domain entities, value objects, enums, repository interfaces,
  service interfaces, domain services, business rules, validation logic.
  No dependency on Infrastructure or Api.
- **Infrastructure:** EF Core `DbContext` and configuration, PostgreSQL
  migrations, Identity storage, repository implementations, seed data,
  background services (`BackgroundService` implementations), external
  adapter implementations.

Do not add MediatR, event bus, complex CQRS, microservices, or a repository
per entity without demonstrated need and approval.

## 1.3 Dependency Injection & Composition Root

The application uses the standard ASP.NET Core dependency injection container.
The composition root is `Program.cs` in `Kiwimpact.Api`.

- Services, repositories, and `DbContext` are registered via standard
  `AddScoped`, `AddSingleton`, `AddTransient` calls.
- The composition root is the only place that wires concrete implementations
  to interfaces.
- No project outside of `Kiwimpact.Api` may reference the DI container
  directly.

## 1.4 API Architecture

- **Style**: REST/JSON via ASP.NET Core (decided by ADR in `specs/adr/`)
- **URL convention**:
  ```
  GET    /api/v1/<resource>          # List resources
  POST   /api/v1/<resource>          # Create resource
  GET    /api/v1/<resource>/{id}     # Get single resource
  PATCH  /api/v1/<resource>/{id}     # Partial update
  DELETE /api/v1/<resource>/{id}     # Delete resource (soft or hard)
  ```
- Controllers should be thin: parameter mapping and HTTP response only.
- Use `PATCH` for partial updates, not `PUT`. `PUT` is only appropriate for
  full replacement operations.
- Collection-level `DELETE` and `PUT` are NOT supported unless explicitly
  required by a new ADR.
- API documentation uses Scalar.

## 1.5 Layering Principle (Strictly Enforced)

```
Controllers ──→ Application Services ──→ Repository Interfaces
                      │
                      └──→ Domain Services / Business Rules
                                │
                      Repository Implementations
                                │
                          EF Core DbContext
                                │
                            PostgreSQL
```

- **Controllers** — parameter parsing, HTTP response, authorization attributes.
  Zero business logic. Depend on application service interfaces.
- **Application Services** — orchestration, transaction boundaries,
  authorization checks. Depend on repository interfaces and domain services.
- **Domain Services** — pure business rules, domain logic, validation.
  No external dependencies.
- **Repository Implementations** — EF Core queries and persistence.
  Depend on `DbContext`.
- **Forbidden cross-layer calls**: Controllers → DbContext direct is a
  violation; must route through Services.
- **Forbidden circular dependencies**: Core must not reference Infrastructure
  or Api.

## 1.6 Transaction Boundaries

- The application service layer owns business transaction boundaries.
- EF Core `DbContext` acts as a Unit of Work.
- `SaveChangesAsync()` commits the transaction implicitly.
- Use explicit transactions only when multiple `SaveChangesAsync` calls must
  be atomic.
- Do not perform network, filesystem, queue, email, or other asynchronous I/O
  inside a database transaction.

## 1.7 Authorization Architecture

```
ASP.NET Core Middleware:
- Authentication (cookie, Identity)
- Coarse role checks ([Authorize(Roles = "...")])
- HTTP-specific checks (CSRF, CORS, rate limiting)

Application Service layer:
- Resource ownership verification
- Action-level authorization
- Domain invariants
```

- Authentication and coarse role checks may use ASP.NET Core attributes.
- Resource-level authorization MUST be enforced in application services,
  not assumed from HTTP middleware.
- Services MUST NOT assume that callers have passed through HTTP middleware.
  Background services and other non-HTTP callers may invoke services directly.
- Every read and mutation involving owned resources MUST evaluate:
  `actor + action + resource`.
- Reading another user's private resources (IDOR) is a violation equivalent
  to unauthorized mutation.

## 1.8 Error Handling

- Controllers should throw; ASP.NET Core exception middleware handles
  the response.
- Use Problem Details (`ProblemDetails`) for consistent error responses.
- The exception middleware must construct the client response from
  allowlisted error shapes. It must never serialize raw exceptions,
  stack traces, SQL, filesystem paths, or dependency error objects.
  `ASPNETCORE_ENVIRONMENT=Production` is not considered sufficient
  enforcement.
- Use custom exception types or result objects for domain errors.

## 1.9 API Response Conventions

- Success responses use HTTP 2xx with JSON body
- 201 for resource creation; include `Location` header with the new resource URL
- 204 for successful deletes (soft or hard, depending on resource policy)
- 400 for validation errors; 401 for missing/invalid authentication;
  403 for insufficient permissions
- 404 for not found; 409 for conflicts; 429 for rate limit exceeded
- 500 for unexpected server errors (caught by exception middleware)