# Slice 6B — Passport Achievements UI Implementation Prompt

Date: 2026-07-26

## Actual human instruction

> 批准

## Approved context applied by Codex

The approval followed the targeted Codex design closure review
(`specs/ai/reviews/45-slice-6b-codex-targeted-design-closure-review.md`) and
explicitly accepted every recommended decision and implementation boundary:

- D1-A: render the full active achievement catalog;
- D2-A: stack Progress, Achievements, and Completion history in that order;
- D3-A: locked cards show icon, name, description, and a Locked badge, with
  no fabricated progress;
- D4-A: bound `progression-not-ready` to the Achievements section;
- D5-A: use the approved Lucide code map, stable fallback, and guarded
  `iconUrl`;
- D6-A: show the server `awardedAt` date on unlocked cards;
- D7-A: earned-empty renders all catalog cards locked; catalog-empty renders
  a neutral bounded note;
- D8-A: retain every documented exclusion;
- accept the achievement-prefix invalidation/removal side effects;
- accept the 15-primary-file implementation boundary.

## Implementation instruction

Implement the reviewed and approved contract in
`specs/implementation/06b-passport-achievements-ui.md` as the sole
implementation owner on `feat/slice-6b-passport-achievements-ui`.

- Add strict achievement types, exact-key validators, transports, TanStack
  Query hooks, card rendering, and the Passport Achievements section.
- The catalog defines active slots and their order. Match by achievement ID;
  unlocked display fields must all come from the earned response. Do not
  render earned rows without an active catalog slot.
- Forward TanStack Query cancellation signals through both transports.
- Extend redemption invalidation and private-session cleanup to the
  `['achievements']` prefix.
- Add the approved responsive, accessible locked/unlocked presentation and
  bounded loading/error/empty states.
- Add the planned validator, hook, rendering, page, redemption, and
  principal-boundary tests.
- Run the targeted tests, then all four frontend gates and record only
  observed results.
- Update `PROJECT_STATUS.md` and create the required completion report before
  requesting Kimi K3's independent implementation review.
- Do not change backend files, API contracts, schema, migrations,
  dependencies, configuration, or any excluded product scope.
- Do not stage, commit, push, merge, create/update a pull request, or deploy
  without separate explicit human approval.

## Post-review concentrated Minor correction

Review 46 independently returned `APPROVE` with 0 Blockers, 0 Majors, and
two non-blocking Minors. The human relayed the complete review result to
Codex. In one concentrated correction pass:

- remove the duplicated `max-w-4xl` assertion from F22;
- give a locked card's guarded remote `<img>` the same muted visual treatment
  as its mapped-icon path, using opacity rather than text color;
- add a focused regression assertion for that image opacity;
- rerun the two affected test files followed by all four frontend gates;
- update the completion and status evidence truthfully;
- do not request a targeted closure review because Review 46 contained no
  Blocker or Major finding.
