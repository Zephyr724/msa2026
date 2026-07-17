# 03 — Database Rules

## 3.1 Schema Source of Truth
- **`scripts/migrations/`** is the canonical schema history
- **`init_db.sql`** is a generated baseline snapshot (not manually maintained alongside migrations)
- All schema changes go through timestamp-named migration files: `scripts/migrations/YYYYMMDDHHmmss_description.sql`
- `init_db.sql` is regenerated from migrations when the schema stabilizes

## 3.2 Query Rules
- **Always** use parameterized queries: `db.prepare().run/get/all()` with `?` placeholders
- **Never** concatenate user input into SQL strings — this is a hard rule
- **Never** use `db.exec()` with user-supplied strings
- All query functions live in `src/db/` and are the ONLY modules that import `better-sqlite3`

## 3.3 Connection Management
- Single long-lived database connection for the application lifetime
- Enable `PRAGMA foreign_keys = ON` at every connection open
- Enable `PRAGMA journal_mode = WAL` for concurrent read support
- Set `PRAGMA busy_timeout = 5000` to handle write contention gracefully
- Write transactions should be kept short; avoid holding write locks across async boundaries

## 3.4 Schema Design Principles
- All tables have an auto-increment `INTEGER PRIMARY KEY` column named `id`
- Timestamps use ISO 8601 text format (`TEXT` with `CURRENT_TIMESTAMP` default)
- Foreign keys are explicitly declared with `REFERENCES` clauses
- Soft deletes are preferred over hard deletes for user-facing data (add `deleted_at TIMESTAMP NULL`)
- Unique constraints are declared at the column level where applicable

## 3.5 Migration Rules
- Migration files are idempotent where possible (`IF NOT EXISTS`, `IF EXISTS` for drops)
- Each migration wrapped in a transaction (`BEGIN ... COMMIT`)
- Migrations must not contain application-level seed data; seeds live in `src/db/seed.ts`
- No destructive migration (DROP COLUMN, DROP TABLE for existing data) without an explicit review
- Test migrations run against an in-memory or temporary database file

## 3.6 Agent Database Access
- Agent may use MCP SQLite tools for **read-only** inspection during development
- Agent must **never** execute destructive SQL (DROP, TRUNCATE, ALTER without migration) directly via MCP
- All schema changes go through migration files, not through agent SQL execution