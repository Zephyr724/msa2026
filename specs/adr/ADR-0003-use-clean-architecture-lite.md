# ADR-0003: Use Clean Architecture Lite in a Modular Monolith

- Status: Accepted
- Date: 2026-07-19
- Decider: Product owner
- Decision source: `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`
- Supersedes: None

> The architecture direction is already accepted in the planning baseline.
> This ADR remains Proposed until the boundaries and consequences are reviewed.

## Context

Kiwimpact is an individual MSA project with meaningful domain rules but a
controlled MVP scope. It needs clear separation between HTTP concerns,
application/domain behavior, persistence, Identity, external adapters,
background services, and tests.

A microservice, event-driven, or complex CQRS architecture would add
coordination and operational cost without demonstrated benefit.

## Decision

Kiwimpact will use Clean Architecture Lite as a modular monolith:

```text
backend/
  src/
    Kiwimpact.Api/
    Kiwimpact.Core/
    Kiwimpact.Infrastructure/
  tests/
    Kiwimpact.UnitTests/
    Kiwimpact.IntegrationTests/
```

### `Kiwimpact.Core`

Contains domain/application rules and abstractions, including entities, value
objects, policies, application services, repository/external-adapter
abstractions, validation, and authorization decisions requiring actor, action,
and resource context.

Core references no other Kiwimpact project.

### `Kiwimpact.Infrastructure`

Contains EF Core, PostgreSQL migrations, repositories, Identity stores, seed
implementation, background services, and external-adapter implementations.

Infrastructure may reference Core.

### `Kiwimpact.Api`

Contains controllers and HTTP contracts, dependency-injection composition,
authentication, antiforgery, CORS, rate limiting, policies, Problem Details,
SignalR hubs, and Scalar documentation.

Api may reference Core and Infrastructure.

## Composition root

`Kiwimpact.Api/Program.cs` is the sole composition root. It may delegate
registration details to Infrastructure extension methods. Those methods are
part of the composition-root boundary and must not resolve services, call
`BuildServiceProvider`, or contain runtime application behavior.

## Request flow

```text
Controller
  -> Application service
    -> Repository/external-adapter abstraction
      -> Infrastructure implementation
        -> PostgreSQL or external system
```

Controllers do not access `DbContext` directly and contain no business logic.
The EF Core `DbContext` acts as a Unit of Work. Application services own
business transaction boundaries.

## Scope limits

Do not add microservices, an event bus, complex CQRS, MediatR, a blanket
repository-per-entity pattern, circular references, or Core dependencies on
Infrastructure, Api, or DI abstractions without demonstrated need and approval.

## Consequences

### Benefits

- Security and domain behavior stay outside controllers.
- Important calculations and policies can be unit tested.
- Persistence and framework concerns remain at explicit boundaries.
- The structure is sufficient without distributed-system overhead.

### Costs and trade-offs

- Mapping is required between HTTP, application, and persistence models.
- Simple CRUD paths may contain more files than controller-to-DbContext code.
- Poor abstractions could create ceremony; abstractions should exist only at
  real boundaries.

## Alternatives considered

Controller-to-DbContext was rejected because it mixes HTTP, authorization,
business rules, and persistence. Full Clean Architecture with mediator
pipelines was rejected as unnecessary ceremony. Microservices were rejected
because no independent deployment or scaling boundary is demonstrated.

## Verification

This decision is implemented only when project references match the direction,
Core has no Api/Infrastructure reference, controllers call application
services, domain and ownership rules are tested below HTTP, Infrastructure owns
persistence/external implementations, and `PROJECT_STATUS.md` records the
verified structure.

## Review triggers

Review this ADR if a module needs independent deployment or scaling, proven
coupling blocks delivery, a new integration requires another boundary, or the
project becomes a larger multi-team product.
