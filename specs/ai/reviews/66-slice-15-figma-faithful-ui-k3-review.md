# Slice 15 — Independent K3 Read-only Review

## Review scope

Independent read-only review of the accepted Slice 15 contract, local Figma
Make source, stored visual evidence, current production diff, verification
record, behavior boundaries, and privacy/security constraints.

The reviewer did not modify files.

## Verdict

Not ready for commit at initial review.

- Blocker: 0
- Major: 6
- Minor: 1

No security or privacy regression was found.

## Major findings

1. Landing omitted the accepted guest Personal Progress geometry, separate
   Passport/achievement showcase, closing CTA, and footer while the completion
   report classified it as `Matched`.
   - `frontend/src/pages/HomePage.tsx:127`
   - `frontend/src/pages/HomePage.tsx:216`

2. Mission Board omitted Home Community context/fallback, next milestone,
   highest-priority next action, recent achievements, and Passport preview.
   - `frontend/src/pages/MyQuestsPage.tsx:137`

3. Quest Detail retained stacked completion panels rather than one
   permission-filtered method chooser. Completion briefing copy also described
   codes for every Quest.
   - `frontend/src/pages/QuestDetailPage.tsx:167`
   - `frontend/src/pages/QuestDetailPage.tsx:311`
   - `frontend/src/components/quest/QuestCompletionPanel.tsx:100`
   - `frontend/src/components/quest/TrustedCompletionPanel.tsx:58`

4. Share Card retained the pre-Slice abstract gradient canvas without
   repository-owned theme scene art, a category emblem, or a rank crest, while
   the completion report classified it as `Matched`.
   - `frontend/src/lib/shareCard.ts:64`
   - `frontend/src/lib/shareCard.ts:93`
   - `frontend/src/lib/shareCard.ts:144`
   - `frontend/src/pages/ShareCardBuilderPage.tsx:219`

5. Leaderboard cannot render authoritative current-user context because the
   accepted DTO has no viewer/current-user marker. Matching by display name
   would not be identity-safe. Closing this finding requires approval for a
   public API contract change or an explicit scope amendment.
   - `frontend/src/types/leaderboard.ts:6`
   - `frontend/src/pages/LeaderboardPage.tsx:220`

6. Evidence covered only public light-theme routes and did not satisfy the
   accepted authenticated, dark, tablet, 320 px, interaction/state, or paired
   Make/production matrix. The report status overstated readiness.
   - `specs/implementation/evidence/15-figma-faithful-ui/README.md:9`
   - `specs/implementation/evidence/15-figma-faithful-ui/README.md:48`
   - `specs/implementation/reports/15-figma-faithful-ui-restoration-report.md:5`

## Minor finding

- Browser output was JPEG data saved with `.png` extensions. Artifact names and
  documented media type must agree.

## Positive observations

- Passport filtering reads a coherent complete history.
- Discover opens in Cards mode.
- Public responsive layouts are materially closer to Make.
- Custom emblems, crests, and medals remain accessible.
- SignalR status comes from real callbacks.
- No completion-code secrecy, evidence privacy, self-report XP,
  authorization, or Share Card privacy regression was found.

## Closure status

The implementation owner completed one bounded correction pass. The targeted
read-only closure check classified:

- Landing — closed.
- Mission Board — closed.
- Completion chooser — initially partially closed because `Native` alone was
  too broad.
- Share Card — closed.
- Leaderboard current-user context — open.
- Evidence matrix — partially closed; authenticated representative coverage
  remains open.
- JPEG/PNG mismatch — closed.

The implementation owner then applied the closure check's exact completion
boundary: code is now shown only for `OrganizerOwned + Native`, Quest briefing
and summary use the same predicate, and a negative
`AdminCuratedExternal + Native` test was added. The final frontend gate passed
with 42 files and 330 tests.

At that closure-check point, two Majors remained: the Leaderboard API-contract
item required explicit product approval, and the representative authenticated
evidence item required working local confirmation delivery or confirmed fixture
credentials. Blockers remained zero.

## Approved final closure

The product owner explicitly approved both remaining items on 2026-07-27.
Implementation-owner closure evidence records:

- `isCurrentUser` is now part of the people leaderboard contract. It is derived
  from internal authenticated actor ID equality, remains `false` for anonymous
  reads, and is validated by backend unit/integration tests plus frontend
  validation/page tests.
- An isolated PostgreSQL/Mailpit runtime completed registration, actual email
  delivery, direct confirmation-link use, Member login, native participation,
  completion-code redemption, XP/achievement award, and populated desktop plus
  390 px captures for Mission Board, completion, Passport, Share Card, and
  Leaderboard.
- The journey exposed and closed a PostgreSQL EF translation failure in
  `My Claims` and a StrictMode duplicate confirmation submission. Targeted
  regressions and the final full gates passed.
- The isolated containers and disposable fixture data were removed after
  capture.

The final observed gates were 44 frontend test files / 334 tests, 250 backend
unit tests, and 302 backend integration tests, all passing. The original review
has no open Blocker or Major finding after the approved closure.
