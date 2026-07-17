---
paths:
  - "package.json"
  - "package-lock.json"
  - "tsconfig.json"
  - "tsconfig.build.json"
---

# 02 — Technology Stack & Toolchain

## 2.1 Runtime
- **Node.js**: 24.x LTS
- **CI runtime**: Node.js 24.x
- **engines.node**: `>=24 <25`
- Do not support multiple runtime versions unless explicitly testing against a matrix in CI.

## 2.2 Verified Dependency Version Baselines
These are the supported major/minor baselines for new project initialization. Exact versions are pinned in `package-lock.json`.

| Package         | Baseline   | Category        |
| --------------- | ---------- | --------------- |
| express         | 5.1.x      | Core            |
| better-sqlite3  | 11.x       | Core            |
| zod             | 4.x        | Core            |
| pino            | 10.x       | Core            |
| pino-http       | 10.x       | Core            |
| helmet          | 8.x        | Core            |
| cors            | 2.x        | Core (if needed)|
| dotenv          | 16.x       | Core (or use Node built-in `--env-file`) |
| typescript      | 5.9.x      | Dev             |
| tsx             | 4.x        | Dev             |
| vitest           | 4.1.x      | Dev             |
| supertest       | 7.x        | Dev             |
| eslint          | 10.x       | Dev             |
| prettier        | 3.x        | Dev             |
| madge           | 8.x        | Dev             |
| husky           | 9.x        | Dev             |
| lint-staged     | 15.x       | Dev             |
| @types/node     | 24.x       | Dev             |
| @types/express  | 5.x        | Dev             |
| @types/supertest| 6.x        | Dev             |

## 2.3 TypeScript Configuration

### tsconfig.json — Full Type-Check (src + tests)
- Used by editor (VS Code) and `npm run typecheck`
- Includes both `src/` and `tests/` for complete type-checking
- `noEmit: true` — this config is for type-checking only, not compilation
- Strict mode enabled (`strict: true`)

### tsconfig.build.json — Production Build (src → dist)
- Used by `npm run build`
- Includes only `src/`
- Sets `outDir: "dist"`, `rootDir: "src"`
- Inherits from `tsconfig.json` via `extends`
- Does NOT emit declarations (`declaration: false`) — this is a service, not a library
- `noEmit: false` — this is the compilation config

## 2.4 Package Manager
- **npm** (with `package-lock.json` committed)
- Exact dependency resolution is guaranteed by the lockfile, not by caret/tilde ranges in `package.json`
- New dependencies require `npm audit` pass before merge (critical/high CVEs block)

## 2.5 Dependency Governance
- Core vs Dev classification: see table above. Anything needed at runtime goes in `dependencies`; build, test, lint, and type tooling goes in `devDependencies`.
- A dependency major upgrade requires an ADR only when it changes architecture, runtime behavior, public contracts, or persistence format. Other major upgrades require a reviewed migration PR.
- New dependencies require justification, bundle-size review, and license check.
- Dependabot enabled for automated patch PRs.

## 2.6 Linting & Formatting
- **ESLint** 10.x with TypeScript plugin for code quality
- **Prettier** 3.x for code formatting
- Both run in CI; no warnings allowed on merge to `main`
- `husky` + `lint-staged` for pre-commit hooks (format + lint)