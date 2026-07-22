# Slice 0 Foundation — Documentation and Evidence Correction Round 3

- **Target agent:** DeepSeek V4 Pro through Cline
- **Mode:** Act
- **Branch:** `feat/slice-0-foundation`
- **Scope:** Documentation, evidence, and obsolete-artifact cleanup only
- **Commit status:** Do not commit

## Objective

Resolve the remaining Codex findings `R3-D5` and `R3-E1` without changing
application source code, architecture, dependencies, or accepted scope.

## Required Inputs

Read:

```text
specs/implementation/00-slice-0-foundation.md
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
specs/ai/prompts/10-slice-0-foundation-codex-rereview-task.md
specs/ai/reviews/10-slice-0-foundation-codex-rereview-2026-07-22.md
specs/ai/reviews/10-slice-0-foundation-codex-rereview-task.md
```

Also read the latest Codex review containing findings `R3-D5` and `R3-E1`.

## R3-D5 — Completion Report Fidelity

File:

```text
specs/implementation/reports/00-slice-0-foundation-completion-report-2026-07-22.md
```

### 1. Reconcile `NOT VERIFIED` results

The report currently marks styling and the Vite OpenAPI proxy as
`NOT VERIFIED`, but later claims the corresponding acceptance criteria and all
D1–D5 evidence passed.

Choose one evidence-based path for each item:

#### Preferred path: obtain actual verification

For the Vite OpenAPI proxy:

1. Start the backend on `http://localhost:5000`.
2. Start the frontend Vite server on its documented port.
3. Request the OpenAPI document through the Vite server, not directly from the
   backend.
4. Record the exact proxy URL, HTTP status, and a short observed response
   summary.

Example target:

```text
http://localhost:5173/openapi/v1.json
```

For styling:

1. Use the available Playwright/browser tooling.
2. Open the running frontend.
3. Verify at least one Tailwind utility and one daisyUI component through
   observed browser evidence, such as rendered appearance, computed styles, or
   a browser screenshot.
4. Record exactly what was observed.

Do not treat dependency presence, CSS generation, or successful build output
as visual/runtime verification.

#### Fallback path: preserve `NOT VERIFIED`

When browser or proxy verification genuinely cannot be performed:

- keep the item as `NOT VERIFIED`;
- mark the corresponding acceptance criterion `NOT VERIFIED`;
- list it under remaining risks;
- do not state that all acceptance criteria passed;
- do not use the final result
  `SLICE 0 FOUNDATION COMPLETE — READY FOR INDEPENDENT RE-REVIEW`.

### 2. Correct all summary claims

Search the entire report for claims equivalent to:

```text
all acceptance criteria passed
all D1–D5 evidence passed
Slice 0 is complete
ready for independent re-review
```

Ensure each statement matches the actual evidence table.

A `PASS` is allowed only when backed by an observed result.

### 3. Refresh the final Git state

After all file changes and cleanup are complete, run:

```bash
git status --short
git diff --check
git diff --stat
```

Replace the stale Git-state section with the current observed output or a
faithful complete transcription.

The report must include all current untracked or modified prompt, review, and
report files.

## R3-E1 — Remove Obsolete Codex Prompt Duplicate

The correct artifacts are:

```text
specs/ai/prompts/10-slice-0-foundation-codex-rereview-task.md
specs/ai/reviews/10-slice-0-foundation-codex-rereview-2026-07-22.md
```

The obsolete duplicate is:

```text
specs/ai/reviews/10-slice-0-foundation-codex-rereview-task.md
```

Required action:

1. Confirm the obsolete file is byte-for-byte identical to the correct prompt
   or otherwise contains no unique historical review evidence.
2. Delete the obsolete duplicate from the working tree.
3. Update every completion-report reference to use the dated review artifact:

```text
specs/ai/reviews/10-slice-0-foundation-codex-rereview-2026-07-22.md
```

4. Do not delete or rewrite the genuine dated Codex review.
5. Do not move the correct prompt back into the reviews directory.

## Hard Restrictions

Do not modify:

```text
backend source code
frontend source code
project files
package manifests
lockfiles
architecture or product specifications
historical review findings or verdicts
```

Do not:

```text
stage
commit
push
merge
rebase
reset
clean
switch branches
```

## Validation

Run:

```bash
git branch --show-current
git status --short
git diff --check
git diff --stat
test ! -e specs/ai/reviews/10-slice-0-foundation-codex-rereview-task.md
test -s specs/ai/prompts/10-slice-0-foundation-codex-rereview-task.md
test -s specs/ai/reviews/10-slice-0-foundation-codex-rereview-2026-07-22.md
grep -R "10-slice-0-foundation-codex-rereview-task.md"   specs/implementation/reports specs/ai/reviews || true
```

Report the actual results.

## Final Response

Summarize:

1. obsolete file removed;
2. references corrected;
3. styling verification result;
4. OpenAPI proxy verification result;
5. acceptance-criteria changes;
6. final completion-report status;
7. final Git state.

End with exactly one:

```text
DOCUMENTATION AND EVIDENCE CORRECTION COMPLETE
```

or:

```text
DOCUMENTATION AND EVIDENCE CORRECTION INCOMPLETE
```
