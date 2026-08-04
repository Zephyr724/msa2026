# P0 Runtime Timezone and Assessment Data — Implementation Prompt Record

## Record type

Truthful reconstructed implementation instruction. The work was directed over
an interactive Chinese Railway deployment and debugging session rather than
supplied as one static prompt.

## Human instruction and approved context

The human deployed Kiwimpact to Railway, completed Google sign-in and Google
Maps configuration, then observed HTTP 500 responses from the authenticated
streak and Auckland weekly leaderboard endpoints and an empty Quest page with no
map. Repository and live behavior inspection established that the Alpine image
lacked the `Pacific/Auckland` timezone database and Production contained no
Quest rows. The human explicitly approved fixing the timezone and preparing
minimal review data, including the stated test, PR, and Railway auto-deploy
workflow.

## Reconstructed implementation instruction

Implement the smallest safe P0 production slice that:

- adds the Alpine timezone database required by existing
  `TimeZoneInfo.FindSystemTimeZoneById("Pacific/Auckland")` calls;
- leaves database schema, authentication policy, and application roles
  unchanged;
- does not expose the existing Development-only demo Quest or demo account
  seeds to Production;
- adds an explicit, default-off `Seed:AssessmentData` bootstrap usable in a
  migrated review environment;
- atomically creates the accepted Auckland region hierarchy, five clearly
  fictional published Quests with coordinates and project-owned local cover
  assets, and only the disabled ownership identity required by the Quest
  foreign key;
- creates no password, confirmed email, role, claim, external login, token,
  production administrator, or organizer login;
- uses deterministic IDs, fails closed on identity/ownership collisions, is
  idempotent, and never overwrites an existing assessment Quest;
- documents the one-shot Railway enable/verify/disable procedure and live smoke
  checks;
- adds PostgreSQL integration coverage for Production execution, public Quest
  shape, curator security, idempotency, and preservation of operator edits;
- builds and probes the exact production Docker image for Auckland timezone
  availability, then runs all applicable repository verification gates;
- records observed evidence and obtains one independent read-only review before
  commit.

Do not create a migration, demo login, production password, automatic role
grant, or destructive cleanup of user data. Do not claim live Railway success
until the merged SHA is deployed and its endpoints are observed.
