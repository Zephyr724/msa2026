# Slice 29 — Real Assessment Experience Data and Reviewer Accounts Prompt

## Record type

Actual human implementation prompt, preserved verbatim from the 2026-08-04
Codex task.

## Human prompt

> Look at the current code and figure out how to add 3 things: 1. Real activities and achievement data. The activities should ideally link to real ones that can navigate to various New Zealand environmental activity websites and council websites. 2. For each different identity, create 3 different accounts — for testing and enriching the community. 3. Create 6 accounts for the judges to use. These must be created only after carefully reading the msa2026 requirements.

## Repository-grounded interpretation used for implementation

- Preserve the accepted three-role authorization model; do not introduce an
  `External` or `Judge` role.
- Recognize that three Development accounts per identity already exist and
  repair their missing achievement fixture data.
- Replace the bounded fictional production assessment catalogue with manually
  checked real New Zealand provider and council activities and official URLs.
- Create six private assessment accounts as two Member, two Organizer, and two
  Admin personas through a default-off, secret-only one-shot bootstrap.
- Follow the MSA rule that marking secrets belong in the private submission
  field and never in the public repository, README, screenshots, or video.
- Keep Cypress isolated from assessment accounts and live data.
- Add no schema migration, dependency, new role, or live scraping behavior.
- Verify idempotency, role boundaries, credentials, XP/achievement consistency,
  and supporting-account non-login invariants with PostgreSQL integration tests.

