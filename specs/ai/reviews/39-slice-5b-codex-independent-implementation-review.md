# Slice 5B Codex Independent Implementation Review

Date: 2026-07-26
Reviewer: Codex (independent read-only implementation reviewer)
Implementation owner: Kimi K3
Branch: `05b-passport-lite`
Reviewed HEAD: `5c8954263a172a6866415b6866168d22ab2b82e2`
Approved implementation prompt: `specs/ai/prompts/47-slice-5b-passport-lite-implementation.md`
Completion report: `specs/implementation/reports/05b-passport-lite-completion.md`

## Verdict

**CHANGES REQUIRED**

- Blockers: 0
- Majors: 2
- Minors: 0

The backend endpoint, exact DTO, self-authorization, profile/not-ready
ordering, XP-pending behavior, progression math, core Passport page states,
and the principal-transition ordering implemented in `useAuth` are
substantially aligned with the approved plan. All independently rerun build,
lint, type-check, unit, frontend, and PostgreSQL integration gates passed.

The Slice is not commit-ready because the approved responsive requirement is
demonstrably false for Organizer/Admin, and the private-401 security lifecycle
is bound to an imported singleton QueryClient despite Prompt 47 explicitly
requiring the active provider client.

## Findings

### M1 — Organizer/Admin navigation overflows at both approved narrow widths

- **Location:** `frontend/src/app/AppShell.tsx:37-71`;
  `specs/implementation/reports/05b-passport-lite-completion.md:193-217`
- **Requirement:** approved plan
  `specs/implementation/05b-passport-lite.md:849-859` and Prompt 47
  `specs/ai/prompts/47-slice-5b-passport-lite-implementation.md:381-385`
  require the complete authenticated cluster, explicitly including
  `Manage quests`, Passport, and logout, to fit at 320px and 375px. If it
  cannot be fixed within the existing compact-label idioms, implementation
  must stop and return to the human.
- **Issue:** the live smoke check used only a Member account. The completion
  report acknowledges that Organizer/Admin was not checked, but nevertheless
  marks F23 and all D7 gates complete. The unchanged full `Manage quests`
  label plus the new Passport control and `Sign out` button exceed both target
  widths.
- **Independent reproduction:** Codex ran the current Vite app with an
  Organizer session and measured the rendered navigation:
  - 320px viewport: document and nav `scrollWidth = 412px`;
  - 375px viewport: document and nav `scrollWidth = 412px`;
  - the `Sign out` button ended at x = 412.30px in both cases.

  This is real horizontal page overflow, not a theoretical class-level risk.
- **Impact:** Organizer/Admin users at the explicitly supported phone widths
  cannot see the complete authenticated navigation without horizontal
  scrolling. The completion report's F23 claim is incomplete and its
  reinterpretation that the pre-existing management item is outside the Slice
  contradicts the reviewed requirement: adding Passport is the change that
  pushes the cluster past the viewport.
- **Required correction:** use the approved existing compact-label/icon
  approach to make Member, Organizer, and Admin clusters fit at both 320px and
  375px without a new menu. Add deterministic coverage for the management
  roles and rerun an observed browser check for all applicable clusters. If
  this cannot be achieved inside the approved approach, stop and return with
  the minimal-menu proposal required by the plan. Correct the completion
  report to record the actual checks.

### M2 — Private 401 cleanup ignores the active provider QueryClient

- **Location:** `frontend/src/lib/api/progression.ts:1-17`;
  `frontend/src/lib/api/passport.ts:1-16`;
  `frontend/tests/integration/AuthSessionBoundary.test.tsx:11-20`
- **Requirement:** Prompt 47
  `specs/ai/prompts/47-slice-5b-passport-lite-implementation.md:368-372`
  requires cancellation and removal to operate on the same active
  `QueryClient` supplied by the provider, explicitly says not to hard-code a
  client inside an API helper, and requires the client to be passed or closed
  over explicitly.
- **Issue:** both API modules import the application singleton directly from
  `app/queryClient.ts` and call the B1 cleanup on that singleton. The F9/F10
  test then imports that same singleton specifically because the production
  code is hard-coded to it. This makes the test conform to the implementation
  instead of proving that the lifecycle acts on the provider's active client.
  Other Passport/guard tests use a fresh `QueryClientProvider` client; a
  private 401 in those trees would clear the unrelated global cache while
  leaving the active auth/private cache unchanged.
- **Impact:** the security boundary is correct only under the incidental
  assumption that the app will always use that one module singleton. It fails
  for an alternate provider client used by tests, isolated roots, or future
  provider construction, and directly violates the approved B1 implementation
  instruction. The API layer also now depends upward on both app and hook
  modules.
- **Required correction:** keep transport/validation functions independent of
  the global app client. Pass or close over the `QueryClient` obtained from
  `useQueryClient()` in the hooks, and execute the ordered private-401
  lifecycle against that exact client. Preserve:
  cancel progression/passport → remove progression/passport → clear auth →
  propagate/redirect. Rewrite F9/F10 to use a fresh injected client and prove
  the same call order, concurrent/idempotent 401 behavior, and deferred
  old-principal non-repopulation without importing the application singleton.

## Reviewed areas with no Major finding

- Backend route and authorization are self-only and expose no user selector.
- Service ordering implements profile 404 before null-timestamp 503 and page
  composition.
- Repository filters `Verified + CompletionCode`, joins current Quest fields
  and `XpTransaction`, and uses explicit nulls-last semantics plus Id
  tie-break.
- Exact DTO mapping, nullable XP behavior, raw-SQL invariant test, method
  isolation, and privacy exclusions are covered.
- No migration, model snapshot, package, lockfile, or dependency change was
  introduced.
- The `InternalsVisibleTo` addition for the requested unit mapping tests adds
  no runtime dependency and is acceptable.
- Progression thresholds, within-level units, Level 99 behavior, strict
  numeric/cross-field rejection, per-region error states, pagination
  reset/clamp, and accessibility structure are consistent with the approved
  design.
- Logout and login callbacks correctly await private cleanup before clearing
  or replacing auth on the provider client.
- The API contract amendment is additive and preserves the long-term
  precedence rule.

## Independent verification

Executed and observed from `backend/`:

```text
dotnet build Kiwimpact.slnx
  PASS — 0 warnings, 0 errors

dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build
  PASS — 178 passed, 0 failed, 0 skipped

dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build
  PASS — 213 passed, 0 failed, 0 skipped
```

Executed and observed from `frontend/`:

```text
npm run lint
  PASS

npm run type-check
  PASS

npm run test -- --run
  PASS — 25 files, 222 tests

npm run build
  PASS — 1890 modules transformed
```

Diff/evidence checks:

- `git diff --check HEAD`: clean.
- Every untracked text file checked with `git diff --no-index --check`: no
  whitespace findings.
- Worktree contains only the reported Slice 5B implementation, tests,
  additive API document change, and completion report.
- No stage, commit, push, merge, PR, deployment, schema, migration, package,
  or lockfile mutation was performed by the reviewer.

Browser verification:

- Temporary local Vite plus bounded mock authenticated Organizer API.
- Real compiled application styles and current `AppShell`.
- 320px and 375px both reproduced `scrollWidth = 412px`.
- Temporary servers were stopped and viewport override reset after the check.

## Bounded next step

The implementation owner may perform the one concentrated correction pass
permitted by `AGENTS.md`, limited to M1 and M2 plus truthful completion-report
updates and directly necessary tests. No backend redesign, schema/dependency
change, new menu architecture, unrelated refactor, commit, push, or PR is
authorized.

After that pass, Codex should perform one targeted closure check limited to
these two original Major findings. Do not run a second full review.

## Targeted closure check

Date: 2026-07-26
Scope: original M1 and M2 only

This is the single targeted closure check permitted by `AGENTS.md`. It is not
a second full review and does not reopen backend or unrelated frontend areas.

### M1 — CLOSED

The management navigation now applies the existing compact icon/hidden-label
idiom to both `Manage quests` and `Sign out`, while retaining stable accessible
names and all controls. `Passport` remains the same compact control. Focused
tests cover Organizer, Admin, and the Member negative management case.

Codex independently reran the current application with an Organizer session
and the real compiled Tailwind/daisyUI styles:

- 320px: document/nav `scrollWidth = 320px`; rightmost control ends at
  x = 304px;
- 375px: document/nav `scrollWidth = 375px`; rightmost control ends at
  x = 359px;
- Kiwimpact home, Quests, Manage quests, Passport, and Sign out were all
  present with accessible names.

The original 412px overflow is no longer present. No menu architecture or
control removal was introduced.

### M2 — CLOSED

`progression.ts` and `passport.ts` no longer import the application singleton
or any hook/app module. `useProgression` and `usePassportCompletions` obtain
the active provider client with `useQueryClient()` and pass it explicitly to
the transport/validation functions. The shared `expirePrivateSession(client)`
executes the approved order on that exact client:

1. cancel both private prefixes;
2. remove both private prefixes;
3. clear the auth entry;
4. only then rethrow/allow the guard redirect.

F9/F10 now install a fresh `QueryClient` through `QueryClientProvider`,
without importing the application singleton. They cover concurrent private
401 responses, auth-write ordering, logout/login ordering, and the deferred
old-principal request non-repopulation case.

### Independent targeted verification

Executed and observed from `frontend/` after the correction:

```text
npm run lint
  PASS

npm run type-check
  PASS

npm run test -- --run
  PASS — 25 files, 225 tests

npm run build
  PASS — 1890 modules transformed
```

Also observed:

- no `app/queryClient` or `useAuth` import remains in the private API/cache
  modules;
- `git diff --check HEAD` is clean;
- all untracked text files are whitespace-clean;
- no backend file changed during the correction pass, so the original
  independent backend results remain applicable;
- the reviewer made no production-code, stage, commit, push, merge, PR, or
  deployment mutation.

## Final verdict after targeted closure

**APPROVE**

Both original Major findings are substantively closed. Slice 5B is
implementation-review clean. Before requesting a commit, the implementation
owner should make the mechanical evidence-only update that changes the
completion report's independent-review status from pending targeted closure
to approved after Review 39 targeted closure. No further implementation
review or correction pass is required.
