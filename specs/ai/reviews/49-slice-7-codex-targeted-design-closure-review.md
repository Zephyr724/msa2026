# Review 49 — Slice 7 Targeted Design Closure

- **Date:** 2026-07-26
- **Reviewer:** Codex (author of independent design Review 47)
- **Scope:** only Review 47 findings M1–M4 and m1–m2
- **Artifact reviewed:**
  `specs/implementation/07-simple-persisted-leaderboard.md`
- **Verdict:** `APPROVE`

## Timing transparency

The concentrated plan correction was completed before human approval and 7A
implementation, but its required targeted closure record was accidentally
omitted. This document records that bounded closure after Kimi K3 identified
the evidence gap in Review 48. It does not claim that the record existed
earlier. Review 48 independently confirmed the backend-relevant corrections
against the completed implementation and real gates.

## Closure findings

### M1 — Staged pagination rejection reachability: CLOSED

The plan now requires the controller to bind nullable `scope`, `period`,
`page`, and `pageSize` inputs and pass all four to the service. It explicitly
distinguishes omission/defaulting from empty or unsupported values, rejects
every present pagination parameter, and records that unrelated unknown query
keys are ignored. The service contract and parameter tests use the same four
inputs, so the required 400 paths are implementable.

### M2 — 7A file map, DI, and OpenAPI evidence: CLOSED

The map contains 13 primary files: 9 new and 4 modified. Repository
registration belongs to
`backend/src/Kiwimpact.Infrastructure/DependencyInjection.cs`; Core service
registration belongs to `backend/src/Kiwimpact.Api/Program.cs`; the existing
OpenAPI operation test is explicitly modified. Baseline inspection during
implementation corrected one factual path from Review 47:
`ProblemDetailsHelper.cs` actually resides under
`backend/src/Kiwimpact.Api/Helpers/`. The final plan uses the observed path
without changing scope or count.

### M3 — Final tie ownership and observable proof: CLOSED

The repository exclusively owns the SQL chain:
XP descending, completion count descending, case-folded display name
ascending, then internal UserId ascending. The aggregate is explicitly long.
The service only preserves repository order and assigns ordinal ranks. The
test contract uses case-distinct visible names with the same lowercase value
and controlled GUIDs, making the final tie externally observable without
serializing UserId; identical duplicate names prove multiplicity only.

### M4 — Compact responsive navigation: CLOSED

The 7B contract now requires the public Leaderboard link for guest, member,
organizer, and admin to use the existing Lucide Trophy, an accessible label,
and `hidden sm:inline` text. AppShell tests must cover all principal clusters
and preserve the existing 320/375 px compact-header contract.

### m1 — Table runtime overclaim: CLOSED

The plan now specifies an exact fixed-layout table structure and limits
jsdom assertions to markup/classes. It explicitly forbids claiming observed
320 px no-overflow behaviour unless a browser run actually observes it.

### m2 — 7A-to-7B handoff and status ownership: CLOSED

The plan freezes 7A on the current branch through evidence, Kimi K3 review,
human-approved Git actions, and merge. Only then may 7B start from merged
`main` on `feat/slice-7b-simple-leaderboard-frontend`. Codex owns truthful
`PROJECT_STATUS.md` updates at both implementation boundaries; this does not
authorize Git actions.

## Validation and boundary

The corrected plan, Prompt 53 correction record, observed repository paths,
Review 48, and current working-tree scope were inspected. No production code,
test, accepted contract, configuration, dependency, or Git state was changed
by this closure check. This review adds only this evidence file.

All original Review 47 Major and Minor findings are closed. No second
full-design review or new product decision is required.
