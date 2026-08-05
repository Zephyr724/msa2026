# Slice 29 — Real Assessment Experience Data and Reviewer Accounts Prompt

## Record type

Actual human implementation prompt, preserved verbatim from the 2026-08-04
Codex task.

## Human prompt

> 查看现在代码，看看要如何补充3个东西：1.真实的活动，成就数据。活动最好能链接到真实的，能跳转到不同的新西兰的环保活动网页和council的。 2.每个不同的身份，创建3个不同账号的。给测试和丰富社区。 3.创建6个，供评委能使用的的账号。这个必须仔细阅读msa2026的需求后创建。

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

