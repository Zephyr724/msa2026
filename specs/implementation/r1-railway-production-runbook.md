# R1 Railway Production Runbook

## Status and scope

Railway was selected by explicit human approval on 2026-08-03 for the first
public Kiwimpact deployment. The approved topology is one Docker application
service serving the React SPA and ASP.NET Core API from one HTTPS origin, one
Railway PostgreSQL service, and one application volume for ASP.NET Core Data
Protection keys. The selected region is Southeast Asia (Singapore).

This runbook does not authorize a commit, push, production secret change, DNS
change, or deployment. Each state-changing release action still requires the
human approval required by `AGENTS.md`.

## Repository-owned deployment behavior

- `railway.toml` selects the root `Dockerfile`, explicitly routes both the
  migration pre-deploy and application start command through the privilege-
  dropping entrypoint, requires the key-volume mount, checks `/health/ready`,
  and applies an on-failure restart policy.
- The image defaults to the unprivileged `app` user.
- The Alpine runtime installs `tzdata`; Auckland calendar calculations used by
  streaks, leaderboards, and achievements therefore resolve
  `Pacific/Auckland` in the deployed image.
- Railway must start the entrypoint with `RAILWAY_RUN_UID=0` because attached
  volumes are root-owned. The entrypoint prepares only the configured Data
  Protection key directory and immediately drops to `app:app` with `su-exec`.
- `Hosting__Railway__Enabled=true` enables forwarded-header processing before
  HTTPS redirection and rate limiting. It accepts one hop only, consumes
  Railway's documented `X-Real-IP` and `X-Forwarded-Proto` headers, and trusts
  only the documented Railway proxy range `100.0.0.0/8` plus framework loopback
  defaults.
- The application volume mount path is `/var/lib/kiwimpact/keys`.
- The PostgreSQL connection uses the private service variables rather than the
  public TCP proxy.

Railway references: [config as code](https://docs.railway.com/config-as-code),
[pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command),
[volume permissions](https://docs.railway.com/volumes/reference),
[request headers](https://docs.railway.com/networking/public-networking/specs-and-limits),
[private networking](https://docs.railway.com/private-networking), and
[PostgreSQL](https://docs.railway.com/databases/postgresql).

## Railway service variables

Create these on the `kiwimpact-app` service. Use Railway reference variables
where shown. Generate every secret independently, seal it after verification,
and never put a real value in Git, chat, screenshots, or the runbook.

**Database credential decision gate:** do not apply the connection row or start
the first deployment until the human chooses one of these two boundaries:

1. Preserve the accepted strict boundary by adding a separately operated
   migration identity/service with independently scoped credentials, while the
   steady app receives only a restricted runtime role. This requires an
   additional approved implementation slice because Railway app pre-deploy and
   app runtime share one service environment.
2. Explicitly approve a time-bounded assessment-release deviation that lets the
   single app service use the Railway Postgres administrative account for both
   migration and runtime, with a recorded expiry and mandatory follow-up. This
   is simpler but does not satisfy the accepted least-privilege baseline.

| Variable | Value or source | Secret | Required before first deploy |
| --- | --- | --- | --- |
| `PORT` | `8080` | No | Yes |
| `ASPNETCORE_ENVIRONMENT` | `Production` | No | Yes |
| `ASPNETCORE_HTTP_PORTS` | `8080` | No | Yes |
| `RAILWAY_RUN_UID` | `0` | No | Yes |
| `Hosting__Railway__Enabled` | `true` | No | Yes |
| `HttpsRedirection__Enabled` | `false` | No | Yes; Railway edge owns public HTTP-to-HTTPS redirect |
| `AllowedHosts` | `${{RAILWAY_PUBLIC_DOMAIN}};healthcheck.railway.app` | No | Yes, after generating the app domain |
| `Auth__FrontendBaseUrl` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` | No | Yes, after generating the app domain |
| `ConnectionStrings__DefaultConnection` | Pending the database credential decision above. The current single-service deviation value would be `Host=${{Postgres.PGHOST}};Port=${{Postgres.PGPORT}};Database=${{Postgres.PGDATABASE}};Username=${{Postgres.PGUSER}};Password=${{Postgres.PGPASSWORD}};SSL Mode=Require` | Yes by reference | Yes, but do not apply without the decision |
| `CompletionCodes__HmacKey` | Independent Base64 value containing at least 32 random bytes | Yes | Yes |
| `DataProtection__ApplicationName` | `Kiwimpact` | No | Yes |
| `DataProtection__KeyPath` | `/var/lib/kiwimpact/keys` | No | Yes |
| `Seed__Roles` | `true` | No | Yes |
| `Seed__Region` | `false` | No | Yes |
| `Seed__DemoQuests` | `false` | No | Yes |
| `Seed__DemoAccounts` | `false` | No | Yes |
| `Seed__AssessmentData` | `false` normally; set `true` only for the approved one-shot assessment bootstrap described below | No | Yes |
| `Authentication__Google__ClientId` | Google OAuth web client ID | No | Before Google sign-in smoke |
| `Authentication__Google__ClientSecret` | Google OAuth web client secret | Yes | Before Google sign-in smoke |
| `GOOGLE_MAPS_BROWSER_VALUE` | Browser-visible key restricted by API and production referrer | No; it is embedded in the frontend bundle | Before Maps smoke |
| `GOOGLE_MAPS_MAP_ID` | Google Maps map ID | No | Before Maps smoke |

`Email__Enabled` remains `false` until an approved production SMTP provider is
configured. With the current default `Auth__RequireConfirmedEmail=true`, normal
password registration cannot complete while email is disabled. Google sign-in
can be verified independently after its credentials and callback are approved.
Do not silently weaken the confirmation policy merely to make registration
appear functional.

The Railway PostgreSQL image is SSL-enabled with a self-issued server
certificate for `localhost`, so this first deployment uses `SSL Mode=Require`
over Railway's encrypted, environment-isolated WireGuard private network. The
public TCP proxy is not used. Hostname-verifying PostgreSQL TLS would require a
separate provider certificate/CA design and is not claimed here.

## Build-time Google Maps values

Railway exposes service variables during Docker builds. The Dockerfile declares
`GOOGLE_MAPS_BROWSER_VALUE` and `GOOGLE_MAPS_MAP_ID` as build arguments and
translates them to Vite variables only for the frontend build. Changing either
value requires a new image build and deploy.

## Dashboard configuration

1. Keep one app replica in Southeast Asia (Singapore). A service with a volume
   cannot use replicas, and Railway prevents overlapping volume mounts during
   deploys, so brief application downtime during redeploy is expected.
2. Confirm the renamed application volume is attached to `kiwimpact-app` at
   `/var/lib/kiwimpact/keys`.
3. Generate a public Railway domain for `kiwimpact-app`, then add the two domain
   reference variables above.
4. Connect `Zephyr724/msa2026`, deployment branch `main`, to the app service.
5. Enable automatic deploys and **Wait for CI**. Keep PR environments disabled
   because sealed secrets are not copied to them and the production volume must
   not be shared.
6. Confirm the deployment details show the config-file values from
   `railway.toml`: Dockerfile build, both explicit entrypoint-wrapped commands,
   required mount path, `/health/ready`, 300-second health timeout, and
   on-failure restart policy. Keep the Dashboard Custom Start Command empty;
   config-as-code owns it.
7. Keep PostgreSQL public networking disabled for normal operation. Use the
   private reference variables above.
8. Enable and verify the approved Postgres backup schedule in its `Backups` tab.
   A backup existing in the UI is not sufficient evidence until a restore drill
   succeeds.
9. Configure a spend alert and hard usage limit appropriate to the approved
   budget. Railway Agent is not required for deployment and should remain off.

## One-shot assessment data bootstrap

The approved public assessment environment may initialize a bounded showcase
without enabling either Development demo flag or creating a test login:

1. Keep `Seed__Region=false`, `Seed__DemoQuests=false`, and
   `Seed__DemoAccounts=false`.
2. Set `Seed__AssessmentData=true` only after the matching migration pre-deploy
   has succeeded. The next application start atomically creates the official
   23-row region hierarchy, five fictional published Quests with coordinates
   and project-owned covers, and one credentialless disabled ownership identity.
   That identity has no role, claim, login, token, or confirmed email.
3. Verify the public Quest list returns five showcase rows and Map view renders
   their Auckland markers. Confirm that every description says the event is
   fictional and not scheduled.
4. Set `Seed__AssessmentData=false` and let Railway deploy once more. The rows
   remain in PostgreSQL. Re-enabling the flag is idempotent and does not update
   existing seed-owned Quests, but leaving a bootstrap switch enabled is not
   normal steady-state configuration.

This bootstrap does not create an administrator or organizer login and does not
grant the signed-in reviewer elevated permissions. Any production role grant
requires a separately approved operator procedure.

## First-release order

1. Merge only a reviewed, green deployment-adapter commit to `main` after human
   approval.
2. Let GitHub CI finish; Wait for CI should then permit Railway to build.
3. Observe `/app/migrate` exit successfully before the app rollout begins.
4. If assessment data is required, perform the one-shot bootstrap above; do not
   enable the Development demo flags.
5. Observe `/health/ready` return healthy before Railway marks the deployment
   active.
6. Record the exact deployed Git SHA and Railway deployment ID.
7. Perform the smoke checks below. A green Railway badge alone is not release
   evidence.

## Required smoke and recovery evidence

- `GET /health/live` returns 200.
- `GET /health/ready` returns 200 and confirms migrated database readiness.
- `/`, a nested frontend route, `/openapi/v1.json`, and Scalar render through
  the single HTTPS origin. Public HTTP is redirected by Railway edge; direct
  internal `/health/ready` remains HTTP 200 without an application redirect.
- Response cookies are `Secure`, `HttpOnly`, and retain the intended SameSite
  behavior; CSRF-protected mutation coverage remains green.
- Requests receive the correct HTTPS scheme and distinct client-IP rate-limit
  partitions through Railway edge forwarding.
- SignalR WebSocket negotiation succeeds through the public domain.
- Google sign-in uses the production callback URL and survives an application
  restart, proving Data Protection key persistence.
- After Google sign-in, `/api/v1/users/me/streak` and the weekly Auckland people
  leaderboard return non-500 responses, proving the deployed image can resolve
  Auckland calendar boundaries.
- Public Quest List and Map views expose the five approved assessment rows; map
  markers use the build-time restricted Google Maps key and Map ID.
- PostgreSQL data and the key volume survive an application redeploy/restart.
- A failed migration blocks deployment and leaves the prior release available.
- One database backup restore drill is recorded with timestamps and observed
  data, not merely inferred from the Backups tab.

## Rollback boundary

Use Railway redeploy/rollback only for application changes that are compatible
with the already-applied schema. EF migrations are forward-only in the release
path; a schema rollback requires a separately reviewed corrective migration or
database restore decision. Never wipe or delete either volume as a rollback
shortcut.
