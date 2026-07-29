# Slice 19 — K3 Independent Read-only Review

## Reviewer

Independent K3 review session `/root/k3_slice15_review`.

## Initial result

The first review reported no Blocker and two Major findings:

1. Discover cleared the selected City when Community returned to
   `All communities in city`.
2. Demo activity used fixed dates, so future restarts would lose observable
   weekly/monthly activity and repeatedly recreate expired challenge state.

The reviewer also recorded one Minor evidence gap: the completion report did
not yet contain final desktop/mobile browser observations for Landing,
My Quests, and the complete Passport composition.

The initial commit-readiness result was **Not ready**.

## Correction pass

- Community empty selection now falls back to `selectedCityId`.
- The Discover regression covers City → Community →
  `All communities in city` and verifies both URL and query parameters.
- Demo completion/XP timestamps now derive from the requested/current
  UTC/Auckland period and converge by the stable `(UserId, QuestId)` key.
- Demo challenges use a stable community/month ID and an Auckland-local monthly
  period.
- A PostgreSQL integration test verifies same-date repeated execution, future
  date advancement, stable user/completion/XP counts, current five-week streak,
  five current challenges, and passwordless/roleless/claimless/loginless/
  tokenless supporting neighbours.
- Browser evidence was expanded to Landing, My Quests, and Passport at 1280 px
  and 390 px, including horizontal-overflow and Community participation
  responsive checks.

## Targeted closure

The reviewer performed the permitted targeted closure check limited to the
original findings and reported:

- Major 1: **Closed**
- Major 2: **Closed**
- Visual evidence Minor: **Closed**
- Final classification: **Blocker 0 / Major 0 / Minor 0**
- Commit readiness: **Ready to commit**

