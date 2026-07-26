# Slice 7B — Simple Leaderboard Frontend Implementation Prompt

## Reconstructed implementation instruction

Implement the human-approved 7B Frontend task from
`specs/implementation/07-simple-persisted-leaderboard.md` on
`feat/slice-7b-simple-leaderboard-frontend`, based on merged 7A main at
`5fb7be0` (PR #17).

Stay within the approved 13-primary-file frontend map:

- add strict types and exact-key validation for the staged
  `{ scope, period, rows }` response;
- validate `scope=nz`, `period=allTime`, at most 10 sequential ordinal rows,
  bounded display names, safe non-negative XP, and positive completion counts;
- fetch `/v1/leaderboards/people` with the TanStack Query cancellation signal;
- use key `['leaderboard', 'people', 'nz', 'allTime']`, 60-second stale time,
  `retry: false`, and manual Retry;
- add public `/leaderboard` without an auth guard;
- add an all-principal compact Trophy navigation item with an accessible label
  and hidden-below-`sm` text;
- render one semantic fixed-layout table with a caption, scoped headers,
  narrow numeric columns, truncated names, accessible ranks, and bounded
  loading/empty/error states;
- never render server Problem Details detail;
- invalidate the `['leaderboard']` prefix after authoritative completion
  synchronization;
- use TanStack Query only for server state: no Zustand or Web Storage;
- add no backend, schema, migration, dependency, configuration, scope switch,
  pagination, `/me`, movement, SignalR, or other deferred leaderboard feature.

Run targeted tests during implementation and the four full frontend gates
once after implementation. Update `PROJECT_STATUS.md`, create truthful
implementation evidence, review the diff, and stop for independent Kimi K3
implementation review. Do not stage, commit, push, merge, create a pull
request, or deploy.

## Execution record

Codex implemented the instruction on 2026-07-26 as the sole implementation
owner. The implementation remained inside the approved 13-primary-file map:
8 new files and 5 modified files.

Observed targeted verification:

- five affected test files: 40/40 tests passed;
- `npm run lint`: passed with no warnings;
- `npm run type-check`: passed.

Observed full gates:

- `npm run lint`: passed with no warnings;
- `npm run type-check`: passed;
- `npm run test -- --run`: 288/288 tests passed across 31 files;
- `npm run build`: succeeded, transforming 1,899 modules.

No browser viewport run is claimed. Responsive evidence is limited to the
approved structural table/navigation contract in jsdom. No backend, schema,
migration, dependency, configuration, authentication, Zustand store, Web
Storage, or excluded leaderboard capability changed. No Git write action or
deployment was performed. Independent Kimi K3 implementation review remains
pending.

## Post-implementation review update

Kimi K3 independently reviewed the implementation in Review 50 and returned
`APPROVED` with 0 Blockers, 0 Majors, and 2 non-blocking Minors. The reviewer
independently observed lint and type-check passing, 288/288 tests across 31
files, and a successful 1,899-module production build. The Minors concern two
optional validator counter-examples and independent replay of the targeted
40-test command; the full observed run subsumes those files and no behaviour
defect exists. No production code or test was changed after approval. Git
actions remain pending explicit human approval.
