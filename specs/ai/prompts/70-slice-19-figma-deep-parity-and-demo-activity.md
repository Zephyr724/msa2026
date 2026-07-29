# Slice 19 Implementation Prompt

Implement the product owner's 2026-07-28 page-by-page Figma corrections on top
of the Slice 18 worktree. Use the checked-in runnable Figma Make prototype
under `docs/UI/Kiwimpact MVP UI Design/` as the visual source.

Restore the Make structure for Landing Community Goal and the Impact Passport
band; My Quests Player Status and mission rows; Passport XP/category progress
and Community challenge participation; and People/Communities Leaderboard
tabs and podiums. Preserve the current Leaderboard content width. Long podium
names may wrap to two lines. Use gold, silver, and bronze stages in 2–1–3
order.

Add City classification to the existing Country → Administrative Area → Local
Area hierarchy and expose separate City and Community filters on Discover
without a schema migration. For the Communities leaderboard, Auckland compares
Local Area communities and New Zealand compares Administrative Area cities.

Seed truthful persisted Development-only activity for the accepted nine demo
personas and enough passwordless supporting neighbours to cross the community
privacy threshold. Make Mission Board, Passport, streak, challenges, and both
leaderboards visibly testable. Add Development-only Wellington and
Christchurch fixtures for the national city board. Keep production/demo flags,
passwords, roles, privacy enforcement, and accepted authorization boundaries
unchanged.

Make primary navigation labels non-wrapping. Hide icons and reduce text before
allowing surrounding layout pressure. Keep the XP and level phrase indivisible.

Do not add dependencies, roles, or migrations. Update regression tests, run
applicable full gates, verify the pages in the browser, create the completion
report, and obtain one independent K3 read-only review before requesting
commit approval.
