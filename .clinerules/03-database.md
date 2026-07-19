# 03 — Database Rules

## 3.1 Schema Source of Truth
- **EF Core migrations** are the canonical schema history.
- All schema changes go through EF Core migration files generated via
  `dotnet ef migrations add <Name>`.
- `dotnet ef database update` applies pending migrations during local
  development.
- Migration files are immutable after they have been applied to any shared
  environment.

## 3.2 Query Rules
- **Always** use EF Core LINQ or parameterized raw SQL.
- **Never** concatenate user input into SQL strings — this is a hard rule.
- Only repository implementations in `Kiwimpact.Infrastructure` may access
  `DbContext` directly.
- Controllers, services, and middleware MUST NOT import or use `DbContext`
  directly.

## 3.3 Connection Management
- EF Core manages connection pooling via Npgsql.
- The connection string is loaded from configuration (environment variables,
  .NET User Secrets, or `appsettings.Development.json`).
- Never hard-code connection strings in source.
- Actual credentials must use environment variables or .NET User Secrets.
  Committed `appsettings` files may contain only non-secret defaults or
  placeholders.
- Use `Pacific/Auckland` for display and business-week calculations.
- Timestamps are stored as UTC using PostgreSQL `timestamp with time zone`.

## 3.4 Schema Design Principles
- Each table MUST have a primary key.
- Use GUID (UUID) or sequential IDs depending on entity needs.
- Do not treat integer IDs as security boundaries.
- Timestamps use UTC via `timestamp with time zone` in PostgreSQL.
- Foreign keys are explicitly declared with navigation properties in EF Core.
- Soft deletes are decided per-entity, not applied uniformly. Consider
  privacy deletion requirements and unique constraint impact before choosing
  soft delete.
- Unique constraints may be column-level or table-level; composite uniqueness
  must use a named constraint or unique index.

## 3.5 Migration Rules
- EF Core migrations are generated via `dotnet ef migrations add`.
- Migrations are applied via `dotnet ef database update`.
- Applied migrations are stored in the `__EFMigrationsHistory` table.
- A migration must not be edited after it has been applied to a shared
  environment or relied upon by another branch or developer. Use a
  corrective migration.
- A local migration that failed before being recorded may be fixed in place
  during development.
- Use `dotnet ef migrations remove` to remove the last unapplied migration
  during local development only.

### Migration Integrity

- Migrations are deterministic and applied exactly once.
- Migrations must not contain application-level seed data; seeds live in
  separate seed classes.
- No destructive migration (DROP COLUMN, DROP TABLE for existing data)
  without an explicit review.
- Tests and local development may apply migrations automatically when
  explicitly configured. The production migration procedure remains
  undecided until a deployment specification or ADR is accepted.
- Test migrations run against a temporary PostgreSQL database via
  Testcontainers.

## 3.6 Agent Database Access
- Agent may inspect EF Core migration files and `DbContext` configuration
  for **read-only** review during development.
- Agent must **never** execute destructive SQL (DROP, TRUNCATE, ALTER
  without migration) directly.
- All schema changes go through EF Core migration files, not through agent
  SQL execution.