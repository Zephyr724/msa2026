# 09 — MSA Assessment Requirements

This rule is always active. It records the MSA 2026 Phase 2 Software Stream
requirements that directly affect pass/fail, scoring, repository evidence,
deployment, and submission safety.

Unless explicitly marked as a current verified state, the requirements in
this file are submission targets and assessment obligations. They must not be
treated as implemented merely because they are listed here.

`PROJECT_STATUS.md`, source code, tests, deployment evidence, Git history, and
the final README prove the current completion status.

## 1. Mandatory Technical Requirements

The final submission must satisfy all basic requirements.

### Frontend

- A frontend must exist and be deployed.
- The frontend must use React.
- TypeScript is preferred by MSA; JavaScript is permitted.
- Project decision: Kiwimpact uses TypeScript.
- Navigation must use React Router or a similar routing library.
- Unit tests must cover key frontend components and functionality.
- The UI must be visually appealing and reflect original design choices.
- The UI should be responsive and display well on desktop and mobile.
- If an application is intentionally desktop-only, its README must justify
  why it is not responsive.
- Project decision: Kiwimpact targets responsive desktop and mobile support;
  the desktop-only exception does not apply.

### Backend

- A backend must exist and be deployed.
- The backend must use C# with .NET 10 or higher.
- The backend must use Entity Framework Core.
- Data must be persisted using an SQL or NoSQL database.
- Project decision: Kiwimpact uses PostgreSQL.
- CRUD operations must be implemented.
- Unit tests must cover key backend components and functionality.
- API documentation must use Scalar rather than Swagger UI.

### Repository

- The frontend and backend must be contained in one GitHub repository.
- Only one GitHub repository link may be submitted.
- The submitted repository must be public.
- The repository must include the frontend, backend, specifications, and all
  other files required to run and assess the application.
- Git history must show regular, meaningful development activity.
- Do not combine the entire assessment into one final commit.

Neglecting a basic requirement may result in an instant failure under the
official assessment brief.

## 2. Theme Requirement

- The application must follow the MSA 2026 Phase 2 theme: Gamification.
- It must meaningfully apply gamification and Human-Computer Interaction
  principles.
- Creating a game is not required.
- Originality and innovation are valued.
- The README must explain how the project relates to the Gamification theme.
- The implemented product must demonstrate the theme through actual behavior
  and user experience, not only through README claims.

## 3. Project-Selected Top 3 Advanced Requirements

MSA asks participants to implement at least three advanced requirements from
the official list and states that only three explicitly listed requirements
will be marked.

Project decision: Kiwimpact submits the following three advanced requirements
for assessment:

1. Security Measures
2. WebSockets using ASP.NET Core SignalR
3. End-to-End Testing using Cypress

These selections are approved assessment targets, not current implementation
claims.

An item may be marked as implemented in the README only after its source code,
tests, runtime behavior, deployment behavior, and supporting evidence have
been verified.

Other implemented capabilities, such as Zustand state management, Light/Dark
theme switching, and Docker local infrastructure, may be described under a
separate heading such as `Additional Features`.

They must not be presented as additional numbered entries in the Top 3
advanced-requirements scoring list.

## 4. Security Measures Evidence

To claim the Security Measures advanced requirement:

- Implement at least two security measures from the official assessment list.
- Explain in the README why each selected measure is important to Kiwimpact.
- Explain in the README how each selected measure was implemented.
- Provide supporting source-code and test evidence.

Official examples include:

- authorisation or RBAC;
- anti-CSRF protection;
- password hashing;
- data validation or sanitisation;
- rate limiting.

A security feature must not be claimed solely because a framework or package
is present. Its configuration, application boundaries, tests, and observable
behavior must support the claim.

## 5. WebSockets Evidence

Kiwimpact implements its WebSockets requirement through ASP.NET Core SignalR.

To claim this requirement:

- A real application feature must use SignalR.
- The frontend and backend integration must be demonstrated.
- The deployed application must be tested end to end.
- At least one deployed verification must show that the SignalR connection
  successfully negotiated and used the WebSockets transport rather than only
  falling back to Long Polling or Server-Sent Events.
- Record the verification method and observed result in the project evidence.

A SignalR package reference or locally constructed hub alone is not sufficient
evidence that the deployed application uses WebSockets.

## 6. Cypress End-to-End Testing Evidence

To claim the Cypress advanced requirement:

- Cypress must be installed and configured in the repository.
- Cypress tests must exercise meaningful full-stack user journeys.
- The tests must cover the deployed or production-like frontend/backend
  integration where appropriate.
- The final configured Cypress suite must pass before the project is described
  as submission-ready.
- Test commands and observed results must be recorded in repository or
  submission evidence.

Placeholder tests or tests that never exercise application behavior do not
satisfy this requirement.

## 7. Repository and AI-Assisted Development Evidence

The `/specs` directory must contain Markdown evidence of:

- planning;
- product and UX design;
- architecture and technical decisions;
- AI-assisted development;
- AI prompts;
- agent instructions;
- relevant context and configuration.

Project convention:

- substantial AI task prompts belong in `specs/ai/prompts/`;
- agent workflow evidence belongs in `specs/ai/`;
- accepted specifications and ADRs must distinguish intended behavior from
  implemented behavior.

For every substantial AI-assisted task:

- preserve the actual prompt used whenever it is available;
- do not fabricate prompts;
- do not silently rewrite a historical prompt and present it as the original;
- when an exact historical prompt is recovered from genuine chat logs or
  development records, preserve its original wording and record its source or
  recovery date.

Project governance is intentionally stricter than the minimum MSA prompt-file
requirement: an invented reconstruction must not be presented as a prompt that
was actually used.

AI-generated output must be critically reviewed, understood, and accepted or
rejected by the student. AI chat output alone is not proof that a feature was
implemented or understood.

## 8. README Requirements

The final README must contain:

- a link to the deployed application;
- a brief introduction to the project;
- a section explaining how the project relates to the Gamification theme;
- a section explaining distinctive, interesting, or noteworthy features;
- a clearly labelled checklist of implemented advanced requirements;
- an unmistakable `Top 3 Advanced Requirements for Assessment` section;
- a self-reflection explaining what would be done differently if the project
  were repeated.

The Top 3 section must clearly list:

1. Security Measures
2. WebSockets using SignalR
3. Cypress End-to-End Testing

The Security Measures section must identify at least two implemented controls
and explain both their importance and implementation.

Additional advanced or supporting features may be discussed elsewhere in the
README, but they must be clearly separated from the numbered Top 3 scoring
list.

### Project Submission-Safety Links

Beyond the minimum official README content, the Kiwimpact README should also
include convenient links to:

- the frontend deployment;
- the deployed Scalar API UI or another suitable backend deployment endpoint;
- the public GitHub repository;
- the public submission video.

These additional links are a project submission-safety convention. Repository
and video links remain official submission-form fields even when they are also
included in the README.

Do not add a deployment, video, test, or feature link before the linked
resource exists and has been verified as publicly accessible.

## 9. Submission Video Requirements

A submission video must be produced.

Requirements:

- The video link must be publicly accessible.
- Maximum video length is 6 minutes.
- Longer videos may be penalized.
- Part 1 must explain and demonstrate how AI was used during development.
- Part 2 must explain important design decisions made during the project.
- The presentation should be clear, structured, and understandable.
- Claims shown in the video must match the repository and deployed
  application.

Before submission, open the video link in a private or incognito browser to
confirm that markers can access it without the student's authenticated
session.

## 10. Submission Form Requirements

Submission must use the official MSA 2026 Phase 2 Microsoft Form.

The form is expected to require:

- one public GitHub repository link containing the frontend and backend;
- one publicly accessible video link;
- optional private marking information or secrets that should not be public.

Do not submit separate frontend and backend repository links.

Secrets required for marking may be supplied through the optional private
submission field where appropriate. Secrets must not be committed to the
public repository, included in screenshots, exposed in the video, or written
into public specifications.

## 11. Deployment and Public Access

- The frontend and backend must both be deployed.
- The deployed application must be publicly accessible to markers.
- Scalar API documentation must be reachable in the deployed or otherwise
  assessable backend environment.
- The deployed frontend and backend must remain publicly accessible until the
  Phase 2 results have been released.
- Before submission, verify all public links in a private or incognito browser.
- Do not claim a deployment is complete based only on a successful local
  build or deployment command.
- Record the deployed URLs and observed access checks in project evidence.

## 12. Individual Work and Academic Integrity

- This is an individual assessment.
- The submitted work must be the student's own work.
- AI-generated output must be critically evaluated and understood before it is
  accepted into the project.
- Do not copy another participant's work.
- Do not collaborate in a way that makes submissions insufficiently distinct.
- Do not claim authorship, understanding, tests, or implementation evidence
  that cannot be demonstrated.

## 13. Published Scoring Considerations

The formal marking rubric is not public.

The official assessment brief identifies these general scoring areas:

- visual appeal and UI quality;
- code quality, structure, and maintainability;
- meaningful Git usage and development history;
- video presentation clarity and structure;
- effective and responsible AI usage supported by evidence in the video and
  `/specs`.

These published considerations do not replace the mandatory technical,
repository, README, deployment, video, or submission requirements.

## 14. Deadline and Submission Safety

- Published deadline: 11:59 pm, Sunday, 2 August 2026.
- Deadline timezone: `UNVERIFIED`.
- Verify the timezone through an official MSA source or Discord before relying
  on it.
- Do not assume or invent the deadline timezone.
- Do not commit after the confirmed submission deadline.
- Before the deadline, verify:
  - repository visibility;
  - frontend accessibility;
  - backend and Scalar accessibility;
  - video accessibility;
  - submission-form entries;
  - final commit timestamp.

A deadline, timezone, or submission-status claim must not be treated as
verified unless it has been checked against an official source.

## 15. Related Rules and Evidence

- Commit history: `06-development-workflow.md` §6.8
- Deployment and submission: `06-development-workflow.md` §6.7
- AI workflow: `specs/ai/01-ai-development-workflow.md`
- Agent context and governance:
  `specs/ai/02-agent-context-and-governance.md`
- Current implementation and control status: `PROJECT_STATUS.md`

Before relying on these references, verify that the referenced files and
sections exist and contain substantive content.

Do not create empty placeholder documents solely to satisfy a cross-reference.
When a referenced document is legitimately pending, record it as pending in
`PROJECT_STATUS.md` or the relevant task completion report.
