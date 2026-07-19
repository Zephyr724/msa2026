---
paths:
  - "frontend/src/**/*.ts"
  - "frontend/src/**/*.tsx"
  - "frontend/tests/**/*.ts"
  - "frontend/tests/**/*.tsx"
  - "frontend/cypress/**/*.ts"
  - "frontend/cypress/**/*.tsx"
---
# 08 — TypeScript Coding Rules

## 8.1 Module System
- Vite handles module resolution; follow the Vite defaults.
- Omit `.ts` and `.tsx` extensions in normal internal imports unless the
  verified TypeScript configuration explicitly requires them.

## 8.2 Type Safety
- Use `unknown` for untrusted data and narrow it before use.
- Explicit `any` is prohibited in application code unless an isolated compatibility boundary includes a justification comment.
- Enable: `strict: true`, `useUnknownInCatchVariables`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`.
- Do not export symbols unless another module requires them.

## 8.3 Domain Modeling
- Prefer discriminated unions for domain states.
- Use `brand` or opaque types sparingly, only when primitive coercion would cause real bugs.

## 8.4 Async Functions
- Async functions must return typed Promises (`Promise<T>`, never bare `Promise`).
- Never ignore a Promise intentionally without `void` and a justification comment.

## 8.5 Type Assertions & Casting
- Prefer type guards and Zod parsing over `as` casts.
- `as` casts are allowed only when a runtime validation already occurred and TypeScript cannot infer it, or at an isolated compatibility boundary with a comment.
- `@ts-expect-error` is preferred over `@ts-ignore`; include a reason comment.

## 8.6 Exceptions to `any`
- Third-party type bridge modules may use `any` at the boundary, with a comment referencing the upstream issue or limitation.
- Test adapters and mocks may use `any` when the exact type is not available, with a comment.
- Do not use `any` to bypass type errors that could be fixed with a proper type.