# Slice 33 — Assessment Community Stories

## Status

**Accepted — explicitly requested by the product owner on 2026-08-05.**

## Human request interpretation

Add more Community posts with believable detail and a warm, active atmosphere.
The content should demonstrate why posts exist: members can reflect on an
activity, share a practical lesson, ask for help, encourage another person, and
connect a lived story back to a discoverable Quest.

“Realistic” means natural fictional showcase writing, not fabricated evidence
or impersonation. No seeded author represents a real person and no story proves
attendance, impact, or provider endorsement.

## Product contract

- Add twenty public assessment stories across Auckland, Wellington,
  Christchurch, Hamilton, Tauranga, Dunedin, Nelson, and Palmerston North.
- Use all ten existing assessment identities as authors, with two posts per
  identity. Four credentialless supporting profiles use pseudonymous display
  names instead of numbered placeholders.
- Give every post a concise title, reflective body, Related Quest, one or two
  images, and three searchable tags.
- Prefix every public card title with `Fictional showcase ·` and begin every
  body with a plain-language statement that no real person, attendance, or
  evidence is represented. Disclosure must be visible without relying on a tag,
  source-code comment, or external specification.
- Vary the voice and purpose: beginner nerves, practical preparation, a small
  failure, observation, a question, a useful lesson, appreciation, and an
  invitation to continue the conversation.
- Seed different like counts and a root comment on every story; add selected
  author replies so the detail view demonstrates two-way community exchange.
- Reuse the twenty Pexels illustrations already checked and credited on the
  Slice 30 Quest catalogue. Social image alternative text must explicitly call
  each image illustrative stock photography.
- Include the `assessment-showcase` tag on every seeded story as an additional
  searchable signal; it does not replace the visible title/body disclosure.

## Deterministic fixture

| Item | Count |
| --- | ---: |
| Public posts | 20 |
| Distinct authors | 10 |
| Related Quests | 20 |
| Post image rows | 26 |
| Distinct Pexels image URLs | 20 |
| Two-image carousel posts | 6 |
| Tags | 60 |
| Likes | 80 |
| Root comments | 20 |
| Direct replies | 8 |

The twenty posts cover four complementary functions:

1. **Reflect:** capture a lesson or a moment that made the activity meaningful.
2. **Help:** share a checklist, mistake, or practical tip for the next person.
3. **Ask:** turn uncertainty into a useful community conversation.
4. **Connect:** encourage contributors and lead readers back to the Related
   Quest when they want to participate.

## Seed and safety behavior

- Community stories run only with the explicitly enabled assessment-account
  bootstrap because they require the six configured reviewer identities.
- The activity history and social fixture commit in the same transaction.
- Stable IDs prevent duplicates. An existing seeded post is left untouched,
  including its title, body, images, tags, likes, and comments.
- Likes and comments are added only alongside a newly inserted fixture post;
  later startup does not restore an interaction that a reviewer removed.
- A deterministic Post ID already owned by an unexpected identity fails closed.
- The four supporting identities remain credentialless and have no role,
  claim, login, or token.
- No schema, dependency, authentication, authorization, or public API change is
  included.

## Acceptance criteria

- The exact fixture counts above are observed after one and repeated startup.
- Every post is public, linked to a different published assessment Quest, has
  a visible fictional title/body disclosure, carries the disclosure tag, and
  uses one or two `images.pexels.com` image URLs.
- Ten author identities are represented evenly and every post has between two
  and six likes plus at least one comment.
- Eight reply rows remain one direct level below their root comment.
- A reviewer-edited seeded post remains edited after repeated startup.
- Backend build, unit tests, focused seed tests, and the full PostgreSQL
  integration suite pass.
- No staging, commit, push, deployment, or pull-request action is included.
