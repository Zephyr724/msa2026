# Project Status

Last reviewed: 2026-07-20

| Control or component | Status | Evidence / notes |
| -------------------- | ------ | ---------------- |
| Planning baseline | Accepted | `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md` |
| Project profile | Present | `specs/00-project-profile.md` |
| ADR-0001 PostgreSQL | Accepted | `specs/adr/ADR-0001-use-postgresql.md` |
| ADR-0002 Identity + Cookie Auth | Accepted | `specs/adr/ADR-0002-use-identity-cookie-authentication.md` |
| ADR-0003 Clean Architecture Lite | Accepted | `specs/adr/ADR-0003-use-clean-architecture-lite.md` |
| ADR-0004 React/Vite/Tailwind/daisyUI | Accepted | `specs/adr/ADR-0004-use-react-vite-tailwind-daisyui.md` |
| ADR-0005 TanStack Query + Zustand | Accepted | `specs/adr/ADR-0005-use-tanstack-query-and-zustand.md` |
| ADR-0006 Google Maps | Accepted | `specs/adr/ADR-0006-use-google-maps.md` |
| ADR-0007 PostgreSQL Integration Tests | Accepted | `specs/adr/ADR-0007-use-postgresql-integration-tests.md` |
| ADR-0008 Community Identity | Accepted | `specs/adr/ADR-0008-community-identity-local-leaderboards-and-virtual-economy-scope.md` |
| Product requirements | Present | Base product overview (`specs/product/01-product-requirements.md`) and Community scope update (`specs/product/02-community-identity-and-gamification-scope-update.md`) |
| Community UX specification | Accepted | `specs/ux/04-community-identity-leaderboard-and-selector.md` |
| Community architecture specification | Accepted | `specs/architecture/01-domain-model-region.md` |
| Community data specification | Accepted | `specs/data/01-community-identity-data-model.md` |
| Community security specification | Accepted | `specs/security/01-community-privacy-rules.md` |
| Community testing specification | Accepted | `specs/testing/01-community-leaderboard-and-privacy-tests.md` |
| Figma first pass | Reviewed | First-pass review recorded (`specs/ux/03-figma-ai-first-pass-ui-review.md`); Community Figma revision not yet applied |
| Review 01 (pre-development) | Completed | ADR-0001–0007 and base UI brief accepted (`specs/review/01-pre-development-review.md`) |
| Review 02 (community scope) | Completed | ADR-0008 and community direction accepted (`specs/review/02-community-scope-review.md`) |
| Frontend scaffold | Not implemented | No verified `package.json` or commands |
| Backend scaffold | Not implemented | No verified `.sln`/`.csproj` files |
| PostgreSQL local infrastructure | Not implemented | `docker-compose.yml` not verified |
| Test commands | Not verified | Activate only after scaffold |
| GitHub Actions | Not active | Add after real commands exist |
| Branch protection | Not active | Manual control required |
| Cline hooks | Not implemented | Rules are advisory only |
| Deployment | Not configured | Deployment decision pending |
| Verified commands | None | No scaffold or runtime commands exist yet |
| Legacy root artifacts | Moved | `init_db.sql` and `msa2026.db` moved to `docs/archive/legacy-task-api/` |
| Root README | Present | Minimal Kiwimpact README with planning status created |
| `.gitignore` | Present | Covers secrets, dependencies, build outputs, databases, logs, OS files |
| `.clineignore` | Present | Covers secrets, dependencies, build/test outputs, archived docs, databases, logs, OS files |