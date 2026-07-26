# Slice 6A-2 — Achievement Read API Implementation Prompt

Date: 2026-07-26

## Actual human instruction

> 已merge 并切换到main，下一步吧

## Execution context applied by Codex

Implement the already approved Slice 6A-2 contract in
`specs/implementation/06a-simple-achievements-backend.md` after confirming
that `main` contains the reviewed Slice 6A-1 merge and CI correction.

- Create `feat/slice-6a2-achievement-read-api` from the merged `main`.
- Codex is the sole implementation owner; Kimi K3 performs the independent
  implementation review.
- Implement only:
  - anonymous `GET /api/v1/achievements`;
  - self-only `GET /api/v1/users/me/achievements`;
  - Core read models/service/repository abstraction;
  - Infrastructure read repository;
  - API contracts, mapping, controllers, DI registrations;
  - caller-scoped 404/503 readiness behavior;
  - exact-key, ordering, active-only, authorization, privacy, mapping, and
    OpenAPI tests;
  - the accepted API-contract amendment and required evidence.
- Do not change schema, migrations, seed, award writes, backfill, XP paths,
  dependencies, frontend, Community Challenge, or any 6A-1 invariant.
- Run targeted Achievement tests followed by all three backend gates.
- Do not stage, commit, push, merge, deploy, or create/update a pull request
  without separate explicit human approval.
