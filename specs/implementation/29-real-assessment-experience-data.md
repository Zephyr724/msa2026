# Slice 29 — Real Assessment Experience Data and Reviewer Accounts

## Status

**Accepted — explicitly requested by the product owner on 2026-08-04.**

## Human request interpretation

The request has three parts:

1. replace the fictional production showcase with real New Zealand
   environmental activities that open authoritative provider and council pages,
   and provide observable achievement data;
2. provide three accounts for each distinct product identity to support testing
   and richer Community states;
3. provide six accounts that assessors can use, after applying the MSA 2026
   submission and secret-handling requirements.

The accepted authorization model has three roles: `Member`, `Organizer`, and
`Admin`. “External” remains an Organizer persona, not a fourth role.

Slice 18 already created three Development-only accounts for each identity,
nine total. Slice 19 distributed them across communities and created persisted
activity. This Slice preserves those accounts and closes their missing
achievement-award fixture gap instead of creating duplicate Development
identities.

The six assessment accounts are therefore exactly two Member, two Organizer,
and two Admin personas. Organizer and Admin retain the baseline Member role.

## Real activity catalogue

The Production assessment catalogue contains ten Admin-curated external
Quests. Facts were manually checked on 2026-08-04; the provider page remains
authoritative and must be rechecked before deployment.

Slice 30 extends this original ten-row catalogue with twenty additional
city-focused activities, bringing the current accepted total to thirty. The
extension adds Hamilton, Dunedin, Nelson, and Palmerston North regions and
deepens Auckland, Wellington, Christchurch, and Tauranga coverage. Its source
and image register lives in
`specs/implementation/30-real-activity-city-coverage.md`.

| Activity or programme | Authoritative provider |
| --- | --- |
| Tūpuna Maunga Community Planting — Maungarei | [Auckland Council / OurAuckland](https://ourauckland.aucklandcouncil.govt.nz/events/2026/05/tupuna-maunga-community-planting-days/) |
| Waimakariri Off-road Clean-up 2026 | [Environment Canterbury](https://www.ecan.govt.nz/your-region/living-here/regional-parks/regional-parks-events/regional-parks-planting-and-clean-up-events) |
| Sanctuary Wetland Community Planting | [Environment Canterbury](https://www.ecan.govt.nz/your-region/living-here/regional-parks/regional-parks-events/regional-parks-planting-and-clean-up-events) |
| Friends of Nepal Reserve Working Bee | [Christchurch City Council](https://ccc.govt.nz/news-and-events/whats-on/event/friends-of-nepal-reserve-working-bee-burnside) |
| DOC Hihi Field Assistant — Tiritiri Matangi | [Department of Conservation](https://www.doc.govt.nz/get-involved/volunteer/in-your-region/auckland/tiritiri-matangi-island-hihi-field-assistant/) |
| Auckland Learn to Compost Workshops | [Auckland Council / OurAuckland](https://ourauckland.aucklandcouncil.govt.nz/events/?page=2&searchArg=waste) |
| Wellington Backyard Biodiversity | [Wellington City Council](https://wellington.govt.nz/backyardbiodiversity) |
| Tauranga Environmental Volunteering | [Tauranga City Council](https://www.tauranga.govt.nz/environment/environmental-volunteering) |
| Sustainable Coastlines Community Clean-ups | [Sustainable Coastlines](https://sustainablecoastlines.org/events/) |
| Find Your Conservation Crew | [Department of Conservation](https://www.doc.govt.nz/always-be-naturing/do-your-bit-for-nature/find-your-conservation-crew/) |

Provider images are not copied. Every Quest uses an existing project-owned SVG
with an explicit project-owned licence note. Dated activities receive their
published time where it was verified. Area-wide, recurring, or self-paced
programmes do not receive a fabricated single date or coordinate.

The exact five original fictional assessment rows are upgraded only when both
their legacy title and description remain unchanged. An operator-edited row is
preserved. New rows are insert-only after their first real-source seed.

## Achievement and Community data

- The every-environment achievement catalogue is installed before optional
  fixture activity.
- Development activity now evaluates the same typed achievement rules used by
  live completion, so the existing nine test personas receive awards matching
  their persisted XP history.
- Assessment history is fictional and explicitly described as an assessment
  fixture. It uses only ongoing or recurring real activities; no future dated
  event is marked completed.
- Six reviewer accounts receive varied verified history, XP, levels, Passport
  records, streak inputs, and automatic achievements.
- Four additional assessment contributors bring the shared Home Community to
  the accepted ten-active-member privacy threshold. They are not reviewer
  accounts and have no password, confirmed email, role, claim, external login,
  or token.
- Seeded evidence text states that it is fictional assessment history. It does
  not represent a real person, attendance claim, or ecological outcome.

## Reviewer-account security and MSA boundary

- `Seed:AssessmentAccounts` is default-off and independent from Development
  demo flags.
- All six emails, display names, exact roles, and distinct passwords come from
  deployment-provider secrets. No credential value or production account email
  is committed.
- Startup requires exactly six unique entries with a 2/2/2 role distribution
  and fails before account creation when configuration is incomplete.
- Account creation/reconciliation is transactional. Re-enabling the flag
  rotates the configured passwords and restores the accepted role set.
- Credentials are supplied to assessors only through the MSA submission form's
  private marking field or an approved private channel. They are excluded from
  README examples, screenshots, video, logs, and public specifications.
- Cypress continues to use isolated Development-only accounts and must not use
  assessment credentials or live assessment data.
- Both assessment flags return to `false` after their one-shot bootstrap.

## Exclusions

- No database migration or schema change.
- No dependency change.
- No new authorization role or authentication mechanism.
- No live provider scraping, API synchronization, or background refresh.
- No copying of provider-owned event imagery or uncredited third-party stock
  imagery. Slice 30 may reference Pexels stock photos only with creator, source,
  licence, and illustrative-image metadata stored on each Quest image.
- No claim that fictional reviewer history proves real-world attendance or
  environmental outcomes.
- No deployment, credential creation in Railway, password disclosure, commit,
  push, or pull request without the separately required approvals.

## Acceptance criteria

- Production assessment data contains thirty real-source Quests spanning
  council, DOC, NGO, dated, recurring, self-paced, and city-focused activities.
- Every Quest Detail official-source link is HTTPS and opens in a new tab with
  `noopener noreferrer` through the existing frontend behavior.
- The existing nine Development personas remain exactly three per accepted
  identity and have persisted automatic achievements.
- The assessment path creates exactly six sign-in accounts: two per role.
- All six passwords satisfy ASP.NET Core Identity policy and are verifiable;
  Member/Organizer/Admin role sets remain exact.
- Reviewer and supporting activity is idempotent; completion, evidence, XP,
  profile totals, and achievements do not inflate on repeated startup.
- The four supporting contributors remain credentialless and roleless.
- Applicable backend build, unit, and PostgreSQL integration gates pass.
- Implementation prompt and completion evidence exist before independent
  read-only review is requested.
- Because this is an important authentication/data task, one fresh independent
  reviewer must close all Blocker/Major findings before commit readiness.
