# Review 58 — Slice 11A K3 Independent Review

## Scope

Independent read-only review of the uncommitted Google Maps runtime
configuration correction against:

- `AGENTS.md`
- `specs/adr/ADR-0006-use-google-maps.md`
- `specs/ai/prompts/62-google-maps-runtime-configuration-correction.md`
- `specs/implementation/reports/11a-google-maps-runtime-configuration-correction.md`
- the current correction diff and applicable frontend tests

## Initial verdict

**CHANGES REQUIRED**

### Major M1 — loader referrer policy conflicted with accepted key restrictions

`QuestMap.tsx` and `CoordinatePicker.tsx` set
`authReferrerPolicy="origin"`, while ADR-0006 and README instructed operators
to use `http://localhost:5173/*` and `http://127.0.0.1:5173/*` website-referrer
rules. The reviewer identified the mismatch with the Maps JavaScript loader
requirement for origin-policy restrictions and requested one consistent model.

## Correction

The implementation owner removed `authReferrerPolicy="origin"` from both
`APIProvider` usages, preserving the already accepted full-referrer restriction
pattern. The completion report was corrected to describe the observed
implementation.

Targeted checks after correction:

- frontend lint — passed;
- frontend type-check — passed;
- three focused test files — 10/10 passed;
- `git diff --check` — passed.

The reviewer also observed the prior production build and complete frontend
suite with 37 files and 314/314 tests passing.

## Targeted closure

- Major M1: **CLOSED**
- Remaining Blockers: **0**
- Remaining Majors: **0**

## Final verdict

**APPROVED**

## Non-blocking external limitation

A real restricted browser key, JavaScript map ID, and Google Cloud Website/API
restrictions were not available. Live Google-rendered map verification remains
pending those human-controlled values.
