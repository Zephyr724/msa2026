# Prompt 43 — Slice 4B-2 Completion Code Frontend Implementation

- **Date:** 2026-07-25
- **Tool/model:** Kimi K3 (Kimi Code CLI)
- **Role:** Sole implementation owner
- **Review status:** INDEPENDENT REVIEW COMPLETE (Codex, TARGETED FIX REQUIRED — corrections applied; see report)

## Actual implementation instruction

The human supplied this implementation instruction (verbatim, headings
preserved):

> # Slice 4B-2 — Completion Code Frontend Implementation
>
> ## Role
>
> Implement Slice 4B-2, the frontend completion-code experience for Kiwimpact.
>
> Slice 4B-1 backend has already been independently reviewed, approved, committed and merged into `main`.
>
> This task must integrate with the accepted backend contract. Do not redesign or reinterpret the backend API.
>
> ## Repository
>
> ```text
> /Users/zephyr/dev/personal/msa2026
> ```
>
> Expected branch:
>
> ```text
> feat/slice-4b2-completion-code-frontend
> ```
>
> Before changing files, verify:
>
> ```bash
> git branch --show-current
> git status --short
> git log -1 --oneline
> ```
>
> Stop and report if the branch is not the expected branch.
>
> ## Required source material
>
> Read these before implementation:
>
> ```text
> specs/ai/prompts/42-slice-4b1-completion-code-backend-implementation.md
> specs/implementation/reports/04b1-completion-code-backend-completion.md
> specs/ai/reviews/43-slice-4b1-k3-independent-readiness-review.md
> ```
>
> Also locate and read:
>
> * the accepted Slice 4B design or implementation contract;
> * relevant architecture and frontend rules;
> * accepted security decisions;
> * existing Quest Detail and participation frontend implementation;
> * current API client, CSRF, authentication and ProblemDetails conventions;
> * current TanStack Query configuration;
> * current Figma-aligned design tokens and reusable components;
> * the actual backend controllers, DTOs and OpenAPI surface merged by Slice 4B-1.
>
> Repository code and the accepted contract are the source of truth. Do not invent endpoint paths, DTO properties, error codes or authorization behavior.
>
> ## Objective
>
> Deliver the frontend portion of Slice 4B:
>
> 1. Authorized Quest organizers can inspect completion-code status.
> 2. Authorized Quest organizers can generate a completion code.
> 3. Authorized Quest organizers can rotate an existing completion code.
> 4. Newly generated plaintext is revealed once.
> 5. Participants can redeem a completion code.
> 6. Participants can view their current completion state for the Quest.
> 7. UI behavior correctly handles authorization, validation, rate limiting, duplicate completion and unsupported Quest modes.
> 8. Plaintext completion codes never enter persistent frontend caches or storage.
>
> ## Hard scope boundary
>
> Implement only the approved Slice 4B-2 frontend.
>
> Do not add or modify:
>
> * XP awarding or XP presentation resulting from redemption;
> * level-up behavior;
> * achievements or badges;
> * leaderboard behavior;
> * share cards;
> * admin review flows;
> * evidence-claim flows;
> * SelfReported completion flows;
> * new backend endpoints;
> * backend business logic;
> * database entities or migrations;
> * authentication architecture;
> * new dependencies;
> * Docker, staging, production or deployment configuration;
> * unrelated Quest Detail redesign;
> * broad design-system refactoring;
> * Storybook unless it already exists and the accepted workflow requires it.
>
> Do not commit or push.
>
> ## Functional requirements
>
> ### 1. API contracts and validation
>
> Add exact TypeScript DTOs for the merged Slice 4B-1 endpoints.
>
> Requirements:
>
> * use exact property names and nullability from the backend contract;
> * use existing runtime validation conventions;
> * reject malformed responses rather than silently accepting partial data;
> * avoid permissive passthrough schemas unless already required by repository conventions;
> * do not model fields that the backend does not expose;
> * plaintext code must exist only in the successful generation or rotation response contract;
> * status and current-user completion-state DTOs must not contain plaintext.
>
> Add focused frontend contract tests for the new DTOs.
>
> ### 2. Organizer completion-code status
>
> On the appropriate Quest management or Quest Detail surface, authorized organizers must be able to view the accepted metadata exposed by the status endpoint.
>
> Display only contract-approved information, such as the actual metadata returned by the backend.
>
> Do not imply that plaintext can be viewed again.
>
> When no active code exists, show a clear empty state with the approved generation action.
>
> When an active code exists, show its status and the approved rotation action.
>
> Do not expose organizer controls to ordinary participants merely by hiding them visually. Authorization responses from the server remain authoritative.
>
> ### 3. Generate completion code
>
> Implement the accepted generation interaction.
>
> On success:
>
> * display the newly returned plaintext code once;
> * make it easy to copy;
> * clearly state that it cannot be viewed again;
> * clearly state that generating or rotating a code invalidates the predecessor where applicable;
> * update status metadata after successful generation;
> * do not navigate to a URL containing the plaintext;
> * do not include the plaintext in toast history or global notifications.
>
> Do not regenerate automatically after refresh or component remount.
>
> ### 4. Rotate completion code
>
> Implement explicit rotation of an active code.
>
> Requirements:
>
> * rotation must require an intentional user action;
> * provide an appropriate confirmation explaining that the previous code will stop working;
> * do not display the previous code;
> * on success, reveal only the newly returned plaintext;
> * refresh status metadata;
> * do not treat failed rotation as success;
> * preserve accurate UI state when the backend rejects or fails the operation.
>
> Do not create optimistic plaintext or optimistic rotation state.
>
> ### 5. Reveal-once plaintext security boundary
>
> This is a mandatory security requirement.
>
> The raw completion code may exist only in short-lived component-local memory needed to display the one-time result.
>
> The raw code must not be placed in:
>
> * TanStack Query `QueryCache`;
> * TanStack Query `MutationCache`;
> * Zustand stores;
> * React Context used as application state;
> * URL path, query string, fragment or navigation state;
> * `localStorage`;
> * `sessionStorage`;
> * IndexedDB;
> * cookies;
> * service-worker caches;
> * persisted form state;
> * analytics events;
> * console output;
> * error reporting;
> * reusable toast or notification queues;
> * test snapshots;
> * DOM attributes not required for visible rendering.
>
> Important:
>
> * `mutation.reset()` alone is not security cleanup.
> * Prefer an implementation where the plaintext response never enters persistent TanStack MutationCache storage.
> * If the application architecture necessarily creates a mutation entry containing the response, remove the exact entry after extracting the plaintext rather than relying only on observer reset.
> * Do not use a globally retained mutation result object for generation or rotation.
> * Clear component-local plaintext when the reveal surface is dismissed, unmounted, replaced or otherwise no longer needed.
> * A page reload must not restore the plaintext.
> * Rotation must replace and clear any previously displayed plaintext.
>
> Tests must directly inspect relevant QueryCache, MutationCache and browser storage state rather than merely asserting that the UI no longer displays the code.
>
> ### 6. Copy behavior
>
> A copy action may copy the visible plaintext code to the operating-system clipboard after an explicit user action.
>
> Requirements:
>
> * do not copy automatically;
> * handle clipboard failure gracefully;
> * do not log the code;
> * do not place the code in a global toast message;
> * copied-state feedback must not itself include the raw value.
>
> ### 7. Participant redemption
>
> Add the accepted completion-code redemption form to the appropriate Quest Detail or participation surface.
>
> Requirements:
>
> * use the backend contract as the authority for formatting and normalization;
> * provide an accessible label and validation feedback;
> * avoid leaking whether a particular secret code exists beyond the accepted backend disclosure policy;
> * use the existing authenticated API and CSRF conventions;
> * submit canonical Quest identity from the route or trusted page context;
> * do not allow the client to choose another user identity;
> * do not implement client-only authorization as a security boundary;
> * disable duplicate submission while the request is active;
> * do not optimistically mark the Quest as completed;
> * refresh completion state only after confirmed success.
>
> Handle accepted responses for at least:
>
> * successful redemption;
> * invalid or inactive code;
> * creator attempting to redeem their own Quest;
> * missing or inactive participation;
> * already Verified completion;
> * unsupported Quest source or registration mode;
> * rate-limit rejection;
> * authentication or authorization failure;
> * validation failure;
> * unexpected server failure.
>
> Use existing ProblemDetails mapping conventions. Do not expose raw backend exception details.
>
> ### 8. Current-user completion state
>
> Use the merged current-user completion-state endpoint.
>
> Display the accepted completion state on the relevant Quest page.
>
> Requirements:
>
> * do not infer Verified completion only from local redemption success;
> * refetch authoritative state after successful redemption;
> * preserve correct behavior after reload;
> * do not display XP, achievements or level-up results;
> * distinguish loading, unavailable, not completed and completed states according to the accepted contract;
> * avoid adding a new application-wide state store for this data.
>
> ### 9. TanStack Query behavior
>
> Follow existing query-key and invalidation conventions.
>
> Ensure:
>
> * query keys use canonical Quest identity;
> * organizer status and participant completion-state queries cannot collide;
> * successful generation or rotation invalidates only relevant status data;
> * successful redemption invalidates relevant completion-state and existing Quest/participation data only when required;
> * sensitive generation responses are not retained;
> * query retries do not cause unintended duplicate generation, rotation or redemption;
> * mutation retries for these state-changing operations are disabled unless the existing accepted contract explicitly requires otherwise;
> * rate-limit responses are not automatically retried.
>
> Do not perform automatic generation, rotation or redemption during mount.
>
> ### 10. User experience and Figma alignment
>
> Use the existing Figma-aligned design language and reusable frontend components.
>
> Requirements:
>
> * integrate into the existing Quest-related page rather than creating an unrelated visual system;
> * use current spacing, typography, border, radius, button and alert conventions;
> * remain responsive on mobile and desktop;
> * preserve the established bright, rounded Kiwimpact visual style;
> * avoid a broad redesign of previously accepted pages;
> * keep organizer actions visually distinct from participant redemption;
> * make reveal-once and rotation warnings prominent but not alarming;
> * provide accessible keyboard interaction and focus handling for dialogs or reveal surfaces;
> * use semantic labels and meaningful button text.
>
> All user-facing wording should be concise and understandable for Kiwimpact's all-ages audience.
>
> ### 11. Error and loading states
>
> Every new network surface must have deliberate:
>
> * loading state;
> * empty state where applicable;
> * success state;
> * validation state;
> * authorization state;
> * rate-limit state;
> * recoverable failure state;
> * unexpected failure state.
>
> Do not show indefinite spinners after a failed request.
>
> Do not display the plaintext again through an error boundary or retry UI.
>
> ### 12. Existing backend behavior
>
> Do not modify the backend merely to simplify frontend implementation.
>
> If an apparent API mismatch is found:
>
> 1. verify the actual accepted contract;
> 2. verify the backend controller and DTO;
> 3. document the mismatch;
> 4. stop that affected portion rather than silently expanding the backend scope.
>
> Unrelated frontend or backend issues must be reported, not opportunistically fixed.
>
> ## Required testing
>
> Use the existing frontend test stack and conventions. Do not add dependencies.
>
> At minimum, add tests covering:
>
> ### Contract tests
>
> * exact generation/rotation response schema;
> * exact status response schema;
> * exact redemption response schema;
> * exact current-user completion-state response schema;
> * malformed responses are rejected;
> * status responses cannot contain plaintext fields.
>
> ### Organizer behavior
>
> * empty status permits generation;
> * active status permits rotation;
> * successful generation reveals the returned code;
> * successful rotation reveals only the new code;
> * dismissal removes plaintext from the rendered UI;
> * remount or reload does not restore plaintext;
> * failed generation or rotation does not show fabricated plaintext;
> * unauthorized organizer responses do not expose controls as usable actions.
>
> ### Plaintext retention
>
> After successful generation and after successful rotation, directly verify that the raw code is absent from:
>
> * QueryCache;
> * MutationCache;
> * Zustand or other existing global UI state;
> * `localStorage`;
> * `sessionStorage`;
> * URL and navigation state;
> * persisted test containers or reusable notification state.
>
> Also verify cleanup on:
>
> * reveal dismissal;
> * component unmount;
> * replacement by a later rotation result.
>
> A test that checks only DOM disappearance is insufficient.
>
> ### Redemption
>
> * successful redemption refetches authoritative completion state;
> * invalid code displays accepted bounded feedback;
> * duplicate Verified completion maps correctly;
> * inactive or missing participation maps correctly;
> * creator redemption rejection maps correctly;
> * unsupported Quest mode maps correctly;
> * HTTP 429 displays rate-limit feedback and is not automatically retried;
> * multiple clicks do not create duplicate simultaneous requests;
> * plaintext entered by a participant is not persisted in global or browser storage;
> * no XP, achievement or level-up UI appears.
>
> ### Regression
>
> * existing Quest Detail behavior still works;
> * existing participation behavior still works;
> * authentication and CSRF conventions remain intact;
> * existing frontend tests continue to pass.
>
> Tests must exercise the real frontend API client and state-management integration where practical. Avoid tests that simply reproduce implementation logic in isolated mocks.
>
> ## Verification commands
>
> First inspect the repository and determine the exact existing frontend commands.
>
> Run all applicable existing commands, including at least:
>
> ```bash
> npm run lint
> npm run type-check
> npm run test
> npm run build
> ```
>
> Run them from the correct frontend directory.
>
> Also run:
>
> ```bash
> git diff --check
> git status --short
> ```
>
> Do not claim a command passed unless it was actually executed successfully.
>
> If an environment or infrastructure failure occurs, report:
>
> * the exact command;
> * the exact failure;
> * whether it is an implementation failure or an environmental blocker.
>
> ## Documentation evidence
>
> Create or update:
>
> ```text
> specs/implementation/reports/04b2-completion-code-frontend-completion.md
> ```
>
> The report must include:
>
> * implemented scope;
> * files changed;
> * exact endpoint and DTO integration;
> * plaintext-lifecycle design;
> * exact QueryCache and MutationCache handling;
> * browser-storage handling;
> * query invalidation behavior;
> * UX placement;
> * tests added;
> * exact commands run;
> * observed pass/fail counts;
> * known limitations;
> * confirmation that no XP, achievements, leaderboard, backend, dependency, deployment or commit changes were added.
>
> Do not mark the report complete before all verification commands have actually been run.
>
> ## Final response
>
> Return the implementation result with status, delivered scope, plaintext
> security evidence, a verification gate table, files changed, scope
> confirmation, and remaining issues.
>
> Do not commit or push.
>
> Stop after reporting the implementation and verification evidence.

(The quoted instruction above is a faithful reproduction of the supplied
task; its "Final response" section's exact output template is summarized in
the last paragraphs rather than re-indented, with no requirement altered.)

## Implemented interpretation

- Kept the change frontend-only and integrated exactly with the merged
  Slice 4B-1 contract (four endpoints, exact DTO keys, dashed `XXXXX-XXXXX`
  reveal format, round-trip UTC timestamps, ProblemDetails classes).
- Implemented contract §12 Option A: generate/rotate and redeem run through
  the real `apiFetch` client without `useMutation`, so no MutationCache
  entry containing plaintext (response or variables) is ever created;
  plaintext lives only in component-local state.
- The one deviation found in required source material: the review file
  referenced as `43-…` exists as
  `specs/ai/reviews/33-slice-4b1-k3-independent-readiness-review.md`
  (APPROVE); it was used.
- No backend, XP, achievement, leaderboard, dependency, deployment, or
  commit/push action.

## Post-review corrections (Codex independent review, 2026-07-25)

The independent Codex review returned TARGETED FIX REQUIRED with three Major
findings; all were corrected in this session:

- M1: the reveal-once plaintext is now transferred to component state
  immediately when the POST resolves; the status invalidation is deliberately
  not awaited, so a stalled metadata refetch can never withhold the code.
- M2: a failed rotation now preserves the currently revealed (still-active)
  code; replacement happens atomically only on a successful response.
- M3: this prompt record was added (the original gap).
- Minor findings (cross-field DTO invariants, 404/429/403 error-state tests
  and bounded management 429 feedback, quest-keyed panel reset, reveal-focus
  assertion) were also corrected with tests.

## Verification observed before this record was created

Run from `frontend/`:

- `npm run lint` — passed; 0 warnings, 0 errors.
- `npm run type-check` — passed; no diagnostics.
- `npm run test` — passed; 168 of 168 tests before corrections (49 new);
  counts after corrections are recorded in the updated completion report.
- `npm run build` — passed.
- `git diff --check` — passed.

No backend gate was run because no backend file changed.

## Review status

INDEPENDENT REVIEW COMPLETE (Codex, TARGETED FIX REQUIRED). Corrections were
applied as the single bounded correction pass; targeted closure of the
original findings is recorded in the updated completion report.
