# 02 — Technology Stack & Toolchain

## 2.1 Runtime
- **Node.js**: 24.x LTS
- **CI runtime**: Node.js 24.x
- **engines.node**: `>=24 <25`
- Do not support multiple runtime versions unless explicitly testing against a matrix in CI.

## 2.2 Dependency Version Policy
- Exact resolved versions are defined by `package-lock.json`.
- Before project initialization or dependency upgrades, verify current
  compatible releases against Node.js 24 and the project test suite.
- The table below records the last validated baselines, including validation date.
- Do not treat this table as an authoritative live version registry.

| Package          | Last Validated Baseline | Validated On | Category |
| ---------------- | ----------------------- | ------------ | -------- |
| express          | 5.2.x                   | 2026-07-17   | Core     |
| better-sqlite3   | 12.12.x                 | 2026-07-17   | Core     |
| zod              | 4.x                     | 2026-07-17   | Core     |
| pino             | 10.x                    | 2026-07-17   | Core     |
| pino-http        | 11.x                    | 2026-07-17   | Core     |
| helmet           | 8.x                     | 2026-07-17   | Core     |
| cors             | 2.x                     | 2026-07-17   | Core     |
| dotenv           | 16.x                    | 2026-07-17   | Core     |
| typescript       | 5.9.x                   | 2026-07-17   | Dev      |
| tsx              | 4.x                     | 2026-07-17   | Dev      |
| vitest           | 4.1.x                   | 2026-07-17   | Dev      |
| supertest        | 7.x                     | 2026-07-17   | Dev      |
| eslint           | 10.x                    | 2026-07-17   | Dev      |
| prettier         | 3.x                     | 2026-07-17   | Dev      |
| madge            | 8.x                     | 2026-07-17   | Dev      |
| husky            | 9.x                     | 2026-07-17   | Dev      |
| lint-staged      | 15.x                    | 2026-07-17   | Dev      |
| @types/node      | 24.x                    | 2026-07-17   | Dev      |
| @types/express   | 5.x                     | 2026-07-17   | Dev      |
| @types/supertest | 6.x                     | 2026-07-17   | Dev      |

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

## 2.4 TypeScript Coding Rules

See `08-typescript.md` for detailed TypeScript coding conventions including
module system, type narrowing, discriminated unions, and async function rules.
Key highlights:

- Use ESM with `module` and `moduleResolution` set to `NodeNext`.
- Use `.js` extensions in relative imports emitted for Node.js.
- Use `unknown` for untrusted data and narrow it before use.
- Explicit `any` is prohibited except at isolated compatibility boundaries with a justification comment.
- Do not export symbols unless another module requires them.
- Prefer discriminated unions for domain states.
- Enable `useUnknownInCatchVariables`, `noUncheckedIndexedAccess`, and `verbatimModuleSyntax`.
- Async functions must return typed Promises.
- Never ignore a Promise intentionally without `void` and justification.

## 2.5 Package Manager
- **npm** (with `package-lock.json` committed)
- Exact dependency resolution is guaranteed by the lockfile, not by caret/tilde ranges in `package.json`
- New dependencies require `npm audit` pass before merge (see audit exception policy in `06-development-workflow.md`)

## 2.6 Dependency Governance
- Core vs Dev classification: see table above. Anything needed at runtime goes in `dependencies`; build, test, lint, and type tooling goes in `devDependencies`.
- A dependency major upgrade requires an ADR only when it changes architecture, runtime behavior, public contracts, or persistence format. Other major upgrades require a reviewed migration PR.
- New dependencies require justification, bundle-size review, and license check.
- Dependabot enabled for automated patch PRs.

## 2.7 Linting & Formatting
- **ESLint** 10.x with TypeScript plugin for code quality
- **Prettier** 3.x for code formatting
- Both run in CI; no warnings allowed on merge to `main`
- `husky` + `lint-staged` for pre-commit hooks (format + lint)