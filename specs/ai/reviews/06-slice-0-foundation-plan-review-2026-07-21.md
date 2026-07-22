# Independent Review — Slice 0 Foundation Implementation Plan

- **Reviewer:** Claude Sonnet
- **Date:** 2026-07-21
- **Mode:** Plan
- **Review type:** Independent implementation-plan review
- **Files modified:** None
- **Verdict:** CHANGES REQUIRED
- **Normative status:** Non-normative AI review evidence. Accepted ADRs,
  specifications, project profile, and repository rules remain the source of
  truth.

## Blocker

### B1. Backend project structure contradicts the accepted architecture

Slice 0 §5, §6.1, and §6.2 specify four backend production projects:

```text
Kiwimpact.Domain
Kiwimpact.Application
Kiwimpact.Infrastructure
Kiwimpact.Api

with the dependency direction:

Kiwimpact.Domain
    ↑
Kiwimpact.Application
    ↑
Kiwimpact.Infrastructure
    ↑
Kiwimpact.Api

However, every accepted authority defines three production projects:

ADR-0003-use-clean-architecture-lite.md states that
Kiwimpact.Core contains the combined domain and application rules and
references no other Kiwimpact project.
specs/00-project-profile.md defines the target projects as:
Kiwimpact.Api
Kiwimpact.Core
Kiwimpact.Infrastructure
.clinerules/01-architecture.md defines the same three-project structure and
the reference direction:
Core references no other Kiwimpact project.
Infrastructure references Core.
Api references Core and Infrastructure.

The four-project split in the Slice 0 plan is an unapproved architecture
change. It introduces:

an additional assembly boundary;
an additional project-reference edge;
different dependency semantics;
acceptance criteria that conflict with the accepted ADR and project profile.

Per the repository harness rules, this mismatch must be resolved explicitly
and must not be silently implemented by DeepSeek.

Required resolution

Before implementation, choose one of the following:

Restore the accepted three-project structure:
Kiwimpact.Api
Kiwimpact.Core
Kiwimpact.Infrastructure
Obtain explicit human approval for a four-project structure and update
ADR-0003, the project profile, and architecture rules before implementation.

DeepSeek must not choose between these options.

Major

None beyond B1.

The four-project versus three-project mismatch is the dominant issue and is
already classified as a Blocker.

Minor
M1. Broken cross-reference to a non-existent rule file

Slice 0 §3 lists:

.clinerules/09-msa-assessment-requirements.md

The actual repository file is:

.clinerules/09-msa-assessment.md

The review prompt repeats the same invalid path.

The Slice 0 plan must use the actual filename so the implementation agent does
not stall or silently skip a required rule.

M2. Kiwimpact.IntegrationTests is omitted from Slice 0 scaffolding

.clinerules/01-architecture.md includes:

backend/tests/Kiwimpact.IntegrationTests/

in the target repository structure, while Slice 0 creates only:

backend/tests/Kiwimpact.UnitTests/

Deferring the integration-test project is reasonable because Slice 0 has:

no entities;
no migrations;
no persistence behaviour;
no meaningful PostgreSQL integration boundary to test.

However, the plan should explicitly state that
Kiwimpact.IntegrationTests is deferred to the first data-backed slice rather
than leaving an unexplained difference from the target structure.

M3. Required reading omits the Quality Gate Matrix and technology-stack rule

Slice 0 §3 does not include:

.clinerules/02-technology-stack.md
.clinerules/07-agent-workflow.md

The Quality Gate Matrix in .clinerules/07-agent-workflow.md should remain the
source of truth for proportional verification.

The Slice 0 plan may add slice-specific checks, but it should not independently
redefine or weaken the repository quality gates.

Optional
O1. Branch naming convention

The plan specifies:

slice/0-foundation

The repository branch-safety rule suggests prefixes such as:

feat/
fix/
test/
docs/
refactor/
chore/

The list is advisory rather than mandatory, so this is not a conflict.

For consistency, the branch may be named:

feat/slice-0-foundation
Assessment by Review Dimension
1. Scope size

The scope is appropriately small.

The explicit non-goals correctly exclude:

Identity;
Regions;
Quest features;
Completion;
XP;
achievements;
leaderboards;
Passport;
Community Challenges;
other business functionality.
2. Dependency direction

The plan is internally understandable but conflicts with the accepted
three-project architecture.

This is Blocker B1.

3. Frontend and backend foundation

The plan adequately covers:

application shell;
health endpoint;
OpenAPI;
Scalar;
EF Core and PostgreSQL registration without entities;
React Router;
TanStack Query;
Zustand;
Tailwind CSS;
daisyUI;
typed fetch client;
Vite proxy;
frontend and backend test foundations.
4. Avoidance of premature feature implementation

The plan explicitly and comprehensively avoids premature implementation of:

Identity;
Region;
Quest;
Completion;
all other business features.
5. Build, test, security, and documentation verification

The verification is adequate for the foundation scope, subject to M2 and M3.

6. Unnecessary dependencies or architecture

The dependency list is controlled and consistent with the accepted technology
stack.

The only unapproved structural addition is the four-project backend split
identified in B1.

7. Readiness for DeepSeek implementation

The plan is not ready for implementation.

B1 must be resolved before it is handed to DeepSeek in Act mode.

Verdict

CHANGES REQUIRED
```
