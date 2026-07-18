---
paths:
  - "package.json"
  - "package-lock.json"
  - "tsconfig*.json"
  - "eslint.config.*"
  - "prettier.config.*"
  - ".prettierrc*"
---
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
- The table below records **Candidate Baselines**. Do not treat it as an
  authoritative live version registry; the lockfile is the canonical source of
  truth. A row marked `Candidate` reflects the intended target version; a row is
  upgraded to `Validated` only after evidence confirms the baseline.

| Package              | Candidate Baseline    | Last Checked | Status    | Evidence |
| -------------------- | --------------------- | ------------ | --------- | -------- |
| express              | 5.2.x                 | 2026-07-17   | Candidate | —        |
| better-sqlite3       | 12.12.x               | 2026-07-17   | Candidate | —        |
| zod                  | 4.x                   | 2026-07-17   | Candidate | —        |
| pino                 | 10.x                  | 2026-07-17   | Candidate | —        |
| pino-http            | 11.x                  | 2026-07-17   | Candidate | —        |
| helmet               | 8.x                   | 2026-07-17   | Candidate | —        |
| cors                 | 2.x                   | 2026-07-17   | Candidate | —        |
| dotenv               | 16.x                  | 2026-07-17   | Candidate | —        |
| typescript           | 5.9.x                 | 2026-07-17   | Candidate | —        |
| tsx                  | 4.x                   | 2026-07-17   | Candidate | —        |
| vitest               | 4.1.x                 | 2026-07-17   | Candidate | —        |
| @vitest/coverage-v8  | same minor as vitest  | 2026-07-17   | Candidate | —        |
| supertest            | 7.x                   | 2026-07-17   | Candidate | —        |
| eslint               | 10.x                  | 2026-07-17   | Candidate | —        |
| typescript-eslint    | 8.64.x                | 2026-07-17   | Candidate | —        |
| prettier             | 3.x                   | 2026-07-17   | Candidate | —        |
| madge                | 8.x                   | 2026-07-17   | Candidate | —        |
| husky                | 9.x                   | 2026-07-17   | Candidate | —        |
| lint-staged          | 15.x                  | 2026-07-17   | Candidate | —        |
| @types/node          | 24.x                  | 2026-07-17   | Candidate | —        |
| @types/express       | 5.x                   | 2026-07-17   | Candidate | —        |
| @types/supertest     | 6.x                   | 2026-07-17   | Candidate | —        |

A baseline may be marked **Validated** only when:

1. the lockfile contains that dependency;
2. `npm install` / `npm ci` succeeds on Node.js 24;
3. `npm run typecheck` passes;
4. `npm run lint` passes;
5. `npm test` passes;
6. `npm run build` passes;
7. native modules load without error;
8. evidence is linked from the table (e.g. CI run log or lockfile commit).

A date alone is not validation evidence. After validation, update the row
from `Candidate` to `Validated` and link the evidence.

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