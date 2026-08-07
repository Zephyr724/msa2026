# Development Community Image Parity — Completion Report

## Implemented scope

- Exposed the 20 original-ratio Pexels images already used by Production
  assessment Community posts as a shared read-only catalogue.
- Extended the Development Community seed from 4 to 24 deterministic posts.
- Added 20 Development mirror posts using the same 20 unique Production image
  URLs and the same 26 ordered image occurrences, including multi-image posts.
- Retained the dedicated cropped landscape, cropped square, extra-tall portrait
  boundary, and no-image text-cover Development fixtures.
- Replaced the unavailable square-fixture URL with a verified Pexels image that
  returns a real 900 by 900 response, and made deterministic Development rows
  reconcile on restart so an existing database is repaired without deleting
  likes or comments.
- Kept Production assessment seed data unchanged and introduced no schema or
  dependency change.

## Files changed

- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/AssessmentDataSeed.cs`
- `backend/src/Kiwimpact.Infrastructure/Data/Seeds/DemoSocialSeed.cs`
- `backend/tests/Kiwimpact.IntegrationTests/Persistence/SeedConfigurationTests.cs`
- `specs/ai/prompts/93-development-community-image-parity.md`
- `specs/implementation/reports/43-development-community-image-parity-completion.md`

## Verification

- Read the public Production Community API on 2026-08-06 and observed 22
  public posts: 20 assessment showcase posts plus 2 manually created posts.
  The response contained 29 ordered image rows in total; the 20 showcase posts
  contained the expected 26 Pexels image occurrences.
- Downloaded the 20 Pexels URLs already present in source to a temporary
  directory and observed native returned dimensions spanning 16:9, 3:2, 2:3,
  and approximately 0.65:1 portrait ratios.
- `cd backend && dotnet build Kiwimpact.slnx` — passed with 0 errors and 5
  pre-existing EF1002 warnings in unrelated test files.
- Focused PostgreSQL seed test — passed, 1/1.
- `cd backend && dotnet test tests/Kiwimpact.UnitTests/Kiwimpact.UnitTests.csproj --no-build`
  — passed, 309/309.
- `cd backend && dotnet test tests/Kiwimpact.IntegrationTests/Kiwimpact.IntegrationTests.csproj --no-build`
  — passed, 342/342.

## Known limitations

- Remote Pexels availability remains external to the application. The URLs are
  the same checked URLs already used by the Production assessment catalogue.
- Production contains no square original among these twenty images; the square
  case remains a Development-only dedicated fixture.

## Review status

This is a low-risk Development fixture extension with no schema, security, or
Production-data change. No independent review was required or performed.
