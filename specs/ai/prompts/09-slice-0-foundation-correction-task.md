# Slice 0 Foundation — Focused Correction Task

- **Target agent:** DeepSeek V4 Pro through Cline
- **Mode:** Act
- **Task type:** Focused correction and verification
- **Branch:** `feat/slice-0-foundation`
- **Review basis:** Claude independent Slice 0 implementation review
- **Current review verdict:** `CHANGES REQUIRED`
- **Commit status:** Do not commit

## 1. Objective

Resolve every required finding from the independent Slice 0 implementation
review, run the complete approved verification set, and create a durable
completion report containing actual observed results.

Do not redesign Slice 0. Do not add business features. Do not broaden scope.

## 2. Findings to Resolve

### B1 — Missing completion report and verification evidence

Create a durable implementation completion report at:

```text
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
```

The report must contain actual commands and observed results. Do not write
"passed" unless the command was run successfully in this correction task.

### M1 — Backend port mismatch

Reconcile these files to one local HTTP backend port:

```text
README.md
frontend/vite.config.ts
backend/src/Kiwimpact.Api/Properties/launchSettings.json
```

Use:

```text
http://localhost:5000
```

Requirements:

- the documented default backend command starts the API on port 5000;
- the `http` launch profile binds to port 5000;
- the frontend development proxy fallback targets port 5000;
- the README matches the actual observed port;
- the running API is verified on port 5000.

### Mi1 — Placeholder test

Delete:

```text
backend/tests/Kiwimpact.UnitTests/UnitTest1.cs
```

Do not replace it with another placeholder. Retain and run the meaningful
architecture test.

### Mi2 — Configurable Vite proxy target

Update `frontend/vite.config.ts` so the development proxy target is loaded from
an environment variable with this fallback:

```text
http://localhost:5000
```

Use one documented variable name consistently, for example:

```text
VITE_DEV_PROXY_TARGET
```

Apply the same resolved target to:

```text
/api
/hubs
/health
/openapi
/scalar
```

For `/hubs`, enable WebSocket proxying without maintaining a second
contradictory hardcoded target.

Add or update a safe example environment file when appropriate. Do not commit
secrets.

### Mi3 — HTTPS redirection

Configure HTTPS redirection without breaking the local HTTP Vite proxy.

Preferred behaviour:

```text
Development:
  local HTTP port 5000 remains usable

Non-development:
  HTTPS redirection is enabled
```

A conditional `UseHttpsRedirection()` outside Development is acceptable.
Record the exact behaviour and rationale in the completion report.

### Optional findings

Do not change the health endpoint solely for O1.

Do not remove the approved throwaway local development database password solely
for O2. Confirm it remains local-only and compliant with repository rules.

## 3. Hard Scope

Allowed changes:

```text
README.md
frontend/vite.config.ts
frontend/.env.example or equivalent safe example file
backend/src/Kiwimpact.Api/Properties/launchSettings.json
backend/src/Kiwimpact.Api/Program.cs
backend/tests/Kiwimpact.UnitTests/UnitTest1.cs
specs/00-project-profile.md, only when verified commands or URLs require correction
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
```

Make any additional change only when a verification failure proves another
Slice 0 file is defective. Explain every additional file in the report.

Do not:

- modify accepted product or architecture specifications;
- modify historical Claude review text;
- implement Identity, Region, Quest, Completion, XP, Passport, leaderboard,
  Community Challenge, SignalR, or Admin behaviour;
- create entities, migrations, seed data, or `Kiwimpact.IntegrationTests`;
- add unapproved dependencies;
- commit, push, merge, rebase, reset, clean, or switch branches.

## 4. Before Editing

Run and report:

```bash
git branch --show-current
git status --short
node --version
npm --version
dotnet --version
dotnet --list-sdks
```

Required:

```text
Branch: feat/slice-0-foundation
Node: 24.x
.NET SDK: 10.x or later
```

## 5. Required Correction Sequence

1. Fix the backend port in `launchSettings.json`.
2. Make the Vite proxy target configurable with the port-5000 fallback.
3. Update README commands, configuration, and URLs.
4. Delete the empty scaffold test.
5. Configure non-development HTTPS redirection while preserving local HTTP.
6. Run all backend and frontend quality gates.
7. Run both applications and perform actual runtime verification.
8. Create the completion report using observed evidence.
9. Inspect the final Git diff.
10. Do not commit.

## 6. Required Verification

### Repository

```bash
git status --short
git diff --check
git diff --stat
```

### Backend

From the correct backend directory, run:

```bash
dotnet restore
dotnet build
dotnet test
```

Record the exact working directory, command, result, warnings, and test count.

### Backend runtime

Start the API with the documented default command and HTTP launch profile.

Verify actual responses:

```text
http://localhost:5000/health
http://localhost:5000/openapi/v1.json
http://localhost:5000/scalar
```

Record each URL, HTTP status, and a short non-sensitive response summary.

### Frontend

From `frontend/`, run:

```bash
npm run lint
npm run type-check
npm run test -- --run
npm run build
```

Use the exact supported Vitest invocation if the existing script already exits
without watch mode.

### Frontend runtime

Use the available browser or Playwright tooling to verify:

- the root route renders;
- the not-found route renders;
- Tailwind/daisyUI styling is applied;
- the frontend reaches the backend health route through the proxy;
- the frontend still renders after the backend is stopped.

Do not claim runtime success from source inspection.

## 7. Completion Report

Create:

```text
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
```

Use:

```md
# Slice 0 Foundation — Implementation Completion Report

- Date:
- Agent:
- Branch:
- Commit status:
- Final status:

## 1. Scope Summary
## 2. Created and Modified Files
## 3. Backend Project Reference Graph
## 4. Dependencies Added and Purpose

## 5. Corrections Applied
### B1
### M1
### Mi1
### Mi2
### Mi3

## 6. Environment Verification

| Check | Observed result |
|---|---|

## 7. Backend Build and Test Results

| Command | Working directory | Result | Evidence summary |
|---|---|---|---|

## 8. Backend Runtime Verification

| URL | HTTP status | Observed result |
|---|---:|---|

## 9. Frontend Quality-Gate Results

| Command | Result | Evidence summary |
|---|---|---|

## 10. Frontend Runtime Verification

| Check | Observed result |
|---|---|

## 11. Acceptance Criteria

List every Slice 0 acceptance criterion as PASS, FAIL, or NOT VERIFIED.

## 12. Deferred Work
## 13. Remaining Risks

## 14. Git State

Include the actual output or a faithful summary of:

- `git status --short`
- `git diff --check`
- `git diff --stat`

## Final Result

Use exactly one:

SLICE 0 FOUNDATION COMPLETE — READY FOR INDEPENDENT RE-REVIEW

or

SLICE 0 FOUNDATION INCOMPLETE — HUMAN ACTION REQUIRED
```

Do not fabricate output. Use `NOT VERIFIED` when evidence is unavailable.

## 8. Final Response

Report:

1. files changed;
2. every finding resolution;
3. all commands and results;
4. verified URLs;
5. completion-report path;
6. final Git status and diff stat.

Do not commit.

End with exactly the same final result used in the completion report.
