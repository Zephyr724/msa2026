# Slice 29 — Real Assessment Experience Data and Reviewer Accounts Completion Report

- **Date:** 2026-08-04
- **Implementation status:** Complete locally; deployment bootstrap not run
- **Commit readiness:** Not ready until the required independent read-only
  review closes every Blocker/Major finding

## Implemented scope

- Replaced the five fictional Production assessment Quests with a ten-Quest
  catalogue linking to current New Zealand council, Department of
  Conservation, Environment Canterbury, and Sustainable Coastlines sources.
- Added Wellington City, Christchurch City, Tauranga City, and Waimakariri
  District assessment regions without changing the database schema.
- Preserved operator edits and added a bounded, exact-match upgrade path for
  the original five fictional rows.
- Preserved the existing nine Development-only test identities: three Member,
  three external Organizer, and three Admin personas.
- Corrected the Development activity fixture so those identities receive
  automatic achievements consistent with their existing XP history.
- Added a default-off, secret-driven Production bootstrap for exactly six
  reviewer accounts: two Member, two Organizer, and two Admin personas.
- Added deterministic, idempotent fictional assessment history for those six
  accounts plus four credentialless supporting contributors. The fixture
  produces 38 verified completions, 38 evidence details, 38 XP ledger rows,
  populated profile progression, and automatic achievements.
- Kept real provider facts separate from fictional reviewer participation.
  No future dated provider event is represented as a completed event.
- Added fail-closed validation, account-ID/email collision protection,
  transactional account creation, exact role reconciliation, and password
  rotation through ASP.NET Core Identity.
- Documented the one-shot Railway procedure and the MSA private-marking-field
  boundary. No reviewer email or password was added to tracked configuration.

## Files changed

Production:

- `backend/src/Kiwimpact.Api/Program.cs`
- `backend/src/Kiwimpact.Api/appsettings.json`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/AssessmentActivitySeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/AssessmentDataSeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoActivitySeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/IdentitySeed.cs`

Tests:

- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`

Evidence and operations:

- `specs/implementation/29-real-assessment-experience-data.md`
- `specs/ai/prompts/85-real-assessment-experience-data-and-reviewer-accounts.md`
- `specs/implementation/reports/29-real-assessment-experience-data-completion.md`
- `specs/implementation/r1-production-deployment-baseline.md`
- `specs/implementation/r1-railway-production-runbook.md`

## Verification commands and observed results

| Command or check | Observed result |
| --- | --- |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-restore --filter 'FullyQualifiedName~SeedConfigurationTests'` | Passed: 12 tests, 0 failed, 0 skipped; 27-second run |
| `dotnet build Kiwimpact.slnx --no-restore` | Passed: 0 warnings, 0 errors |
| `dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build` | Passed: 305 tests, 0 failed, 0 skipped |
| `dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build` | Passed: 340 tests, 0 failed, 0 skipped; 1-minute-53-second run |
| `git diff --check` | Passed before completion-report creation; a final check remains part of handoff verification |
| Existing Quest Detail source-link inspection | `target="_blank"` and `rel="noopener noreferrer"` remain present; no frontend file changed |

The Production seed integration coverage observed:

- 27 regions and ten real-source published Quests;
- HTTPS provider links and current source-review metadata;
- six password-verifiable confirmed reviewer accounts with exact 2/2/2 role
  distribution;
- 38 completions, evidence-detail rows, and XP transactions;
- at least 20 automatic achievement rows across the seeded assessment users;
- four credentialless, unconfirmed, roleless supporting identities;
- exact count stability on a second startup;
- account-email collision rollback without password-hash takeover or partial
  reviewer creation;
- assessment curator collision rollback and operator-edit preservation;
- Development demo persona achievements and idempotency.

Frontend gates were not repeated because the change contains no frontend
source, test, dependency, or configuration change. The existing source-link
behavior was inspected directly.

## Known limitations and operator work

- The six usable deployed logins do not exist yet. Their emails, display names,
  and distinct passwords must be generated in the deployment provider's
  private variables, the two one-shot seed phases must be run, and each role
  must be smoke-tested. This requires separate deployment authorization.
- Provider facts were checked on 2026-08-04. Near-term dated events and every
  `NextCheckDueAt` row must be rechecked against its official page immediately
  before deployment. There is no provider API synchronization or background
  refresh in this Slice.
- Reviewer completion history is intentionally fictional demonstration data.
  It is visibly labelled as such and is not evidence of attendance, a real
  person, or ecological impact.
- The four supporting contributors are persistence-only identities needed to
  cross the accepted ten-active-member Community privacy threshold. They
  cannot sign in.
- No live Railway startup, login, browser, email-delivery, or public-link smoke
  test was run in this local implementation turn.
- No schema, dependency, authentication mechanism, or authorization role was
  changed.
- No file was staged, committed, pushed, deployed, or added to a pull request.

## Review status

This is an important authentication and assessment-data change. Repository
governance requires one fresh independent read-only review after the prompt,
implementation specification, and this completion evidence exist. That review
has not yet been performed. A Kimi K3 reviewer or a fresh Codex session must
inspect the final diff and reproduce proportionate gates. All original
Blocker/Major findings must be closed before the Slice is commit-ready.
