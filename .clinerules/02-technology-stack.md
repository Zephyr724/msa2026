# 02 — Technology Stack & Dependency Governance

## 2.1 Runtime & Language
- **Runtime**: Node.js 24 LTS (≥24.0.0), managed via `.nvmrc` or `package.json.engines`
- **Minimum supported runtime during migration**: Node.js 22 LTS (≥22.0.0)
- **Language**: TypeScript 5.x, `strict: true`, `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`
- **Package Manager**: npm (no yarn, pnpm); `package-lock.json` committed
- **ESM**: Use `"type": "module"` in `package.json`; imports use `.js` extension

## 2.2 Core Dependencies (Approved List)

| Category | Library | Notes |
|----------|---------|-------|
| HTTP Framework | `express` ^4.19 | REST API; no alternative without ADR |
| Validation | `zod` ^3.23 | All input/output schemas |
| Logging | `pino` ^9 | Structured JSON; no `console.log` |
| Database | `better-sqlite3` ^11 | Synchronous SQLite driver; parameterized queries only |
| Testing | `vitest` ^1.x, `supertest` ^6 | Unit + integration tests |
| TypeScript | `typescript` ^5.4, `tsx` ^4 | Compilation + dev runner |
| HTTP Client (tests) | `supertest` ^6 | Integration test HTTP assertions |
| Environment | `dotenv` ^16 | `.env` parsing; no custom config loaders |

## 2.3 Banned Dependencies
- **ORMs** (TypeORM, Prisma, Drizzle, Knex): banned; raw parameterized SQL only
- **`knex`**, **`pg`**, **`mysql2`**: not applicable (SQLite-only)
- **`sequelize`**: banned (ORMs violate layering principle per `01-architecture.md`)
- **`typeorm`**: banned
- **`lodash`**, **`underscore`**: banned; prefer native ES2022+ APIs
- **`moment`**, **`dayjs`**: banned; use `Intl.DateTimeFormat` or `Temporal` polyfill
- **`axios`**: banned for server-side; use native `fetch` (Node.js 24 built-in)
- **`nodemon`**: banned; use `tsx watch`
- **`class-validator`**, **`class-transformer`**: banned; use Zod
- **`winston`**, **`bunyan`**, **`morgan`**: banned; use pino

## 2.4 Dev Dependencies

| Category | Library | Notes |
|----------|---------|-------|
| Linting | `eslint` ^8 + `@typescript-eslint/*` | Strict ruleset; no `any` allowed |
| Formatting | `prettier` ^3 | Consistent code style |
| Type Checking | `typescript` ^5.4 | `tsc --noEmit` in CI |
| Test Runner | `vitest` ^1.x | Configured in `vitest.config.ts` |
| Test HTTP | `supertest` ^6 | HTTP integration assertions |
| Git Hooks | `husky` ^9 + `lint-staged` ^15 | Pre-commit linting |
| Import Check | `madge` ^6 | Circular dependency detection |

## 2.5 Version Governance
- Major version bumps require an ADR (Architecture Decision Record) in `docs/architecture/adr/`
- All dependencies locked to minor/patch: `"express": "~4.19.2"` (tilde for patch, caret for minor)
- `npm audit` runs in CI; critical/high CVEs block merge
- Dependabot enabled for automated patch PRs
- New dependency proposals: file an issue with justification + bundle-size + license check

## 2.6 TypeScript Configuration Baseline
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 2.7 Database Driver Configuration
- Driver: `better-sqlite3` (synchronous, fast, no connection pool needed for single-writer SQLite)
- `PRAGMA journal_mode=WAL` for concurrent reads
- `PRAGMA foreign_keys=ON` at every connection open
- `PRAGMA busy_timeout=5000` to handle contention
- No raw `db.exec()` with user-supplied strings; always use `db.prepare().run/get/all()` with `?` placeholders