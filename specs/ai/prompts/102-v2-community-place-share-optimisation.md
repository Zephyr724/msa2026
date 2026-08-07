# V2 optimisation (community challenges, place search, passport share) — implementation prompt

## Source

Actual implementation instruction, delivered by the human on 2026-08-07 to the
Kimi session acting as sole implementation owner. The controlling Codex
session acts only as the independent reviewer after implementation evidence
exists. The human explicitly authorized sending this private repository source
and `/Users/zephyr/Downloads/需要优化内容V2.pdf` content to the Moonshot Kimi
API for this implementation.

## Instruction (verbatim, lightly trimmed of no content)

Read AGENTS.md completely, then read the directly relevant accepted
ADRs/specifications and inspect the current implementation before editing.
Preserve all unrelated user changes. The current branch is
`fix/app-shell-scroll-restoration` and `frontend/index.html` already has an
unrelated user modification: do not edit or revert that file. Do not stage,
commit, push, create a PR, change branches, deploy, or perform destructive
operations.

Source feedback is `/Users/zephyr/Downloads/需要优化内容V2.pdf`. Implement the
four requested outcomes as one coherent frontend-focused vertical slice:

1. Make Act together / Community challenges understandable and not visually
   mix unrelated communities or historical states. Explain the monthly
   LocalArea collective verified-action goal, default to the signed-in member
   current active community where available, provide a clear bounded way to
   browse other Auckland communities and current versus past content, show
   truthful reward information, and label the current launch coverage
   honestly as Auckland-first. Do not expand the Region database or claim
   nationwide challenge coverage; full New Zealand content expansion is not
   authorized.
2. Replace coordinate-first Quest location entry with text-first New Zealand
   place search and map confirmation. Selecting a place should populate the
   existing location description and latitude/longitude, center and confirm
   on the map, retain keyboard-accessible and manual fallback and existing
   validation, and fail gracefully when Maps or Places is not configured. Use
   the existing Google Maps dependency and configuration. Do not add a
   dependency, database column, migration, or persistent Google place ID.
3. Add the member current achievement trophy artwork and tier to the Passport
   Share page and the exported share-card image, with truthful locked,
   loading, and error handling and no privacy regression.
4. Materially improve the Passport Share page and exported 1080x1080 card.
   Show the corresponding earned achievement badge or logo artwork where
   applicable in chooser, preview, and export. Preserve verified-only
   completion sharing and existing privacy exclusions unless an
   already-existing earned-achievement endpoint can be composed safely
   without changing backend or schema; choose the smallest coherent design
   that satisfies the feedback. Reuse repository-owned TrophyArtwork and
   AchievementBadgeArt or a shared repository-owned art mapping. Avoid remote
   cross-origin images that can taint the canvas. Keep preview and download
   on one render model.

This task does not authorize authentication or security changes, database
schema changes, dependency changes, national Region expansion, or a new
public profile. If satisfying a requirement would require one of those, stop
that portion and record the blocker rather than exceeding scope.

Add targeted tests for community selection and filtering, text place
selection and map synchronization and fallback, trophy and badge share
rendering, privacy exclusions, and export behavior. Run applicable targeted
tests during implementation, then run the full frontend gates exactly once
from frontend: `npm run lint`; `npm run type-check`; `npm run test -- --run`;
`npm run build`. Run backend gates only if backend production code changes.

Because this is an important task, create the required truthful evidence
before stopping: a short implementation contract under
`specs/implementation/` using the next appropriate slice number, the actual
implementation prompt record under `specs/ai/prompts/`, and a completion
report under `specs/implementation/reports/` listing scope, files changed,
exact commands and results, limitations, and review status "Pending
independent Codex review". Review the git diff carefully. Do not claim any
unobserved browser or test result. Return a concise completion summary and
any blockers.
