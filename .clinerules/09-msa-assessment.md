# 09 — MSA Assessment Requirements

This rule is always active. It records the mandatory MSA assessment
requirements that directly affect pass/fail and scoring.

## Mandatory Technical Requirements

- Frontend and backend must both exist and be deployed.
- Frontend must use React.
- TypeScript is preferred by MSA; JavaScript is permitted.
- Project decision: this project uses TypeScript.
- Frontend navigation must use React Router or a similar routing library.
- Backend: C# .NET 10+.
- Must use Entity Framework Core.
- Must persist data using an SQL or NoSQL database.
- Project decision: PostgreSQL is the selected database for this project.
- CRUD operations must be implemented.
- Frontend and backend must be contained in one public GitHub repository.
- Only one GitHub repository link may be submitted.
- All files required to run and assess the application must be included.
- Frontend unit tests must cover key frontend components and functionality.
- Backend unit tests must cover key backend components and functionality.
- API documentation must use Scalar (not Swagger UI).
- The UI should be visually appealing, responsive, and display well on desktop and mobile.
- If the application is intentionally desktop-only, the README must justify why it is not responsive.
- The UI should reflect original design choices and have a unique visual identity.

## Theme Requirement

- The application must follow the 2026 MSA Phase 2 theme: Gamification.
- It must meaningfully apply gamification and HCI principles.
- Creating a game is not required.
- Originality and innovation are valued.
- The README must explain how the project relates to the Gamification theme.
- The application must satisfy all basic requirements and follow the
  Gamification theme.
- The official brief states that neglecting any basic requirement will
  result in an instant failure.

## Advanced Requirements — Project-Selected Top 3

MSA requires the application to implement at least three advanced
requirements from the official list.

Project decision: this project selects the following three advanced
requirements as the only three submitted for marking:

1. Security Measures
   - At least two measures must be implemented.
   - Their importance and implementation must be explained in the README.

2. WebSockets
   - Implemented using ASP.NET Core SignalR.
   - The deployed application must be verified to use the WebSocket transport.

3. End-to-End Testing using Cypress

MSA will only mark three explicitly listed advanced requirements.

Other implemented capabilities, such as Zustand, theme switching, and Docker,
may be documented under a separate heading such as “Additional Features”.
They must not be presented as additional items in the numbered Top 3 list.

## Security Measures

To claim this advanced requirement:

- Implement at least two security measures.
- Explain in the README why each selected measure is important to this application.
- Explain in the README how each selected measure was implemented.
- Acceptable examples include RBAC, anti-CSRF protection, password hashing,
  data validation/sanitisation, and rate limiting.

## Repository and Evidence Requirements

- `/specs` must contain Markdown evidence of planning, design, and
  AI-assisted development.
- It must include AI prompt files, agent instructions, and context/config
  files.
- For every substantial AI-assisted task, save the actual prompt used.
- Do not fabricate prompts.
- If a historical prompt is recovered from genuine chat logs or development
  records, preserve its original wording and record its source or recovery
  date.
- Do not invent reconstructed prompts and present them as prompts that were
  actually used.
  (Project governance requirement, stricter than the minimum MSA requirement.)
- Project convention: prompt files belong in `specs/ai/prompts/`.
- Maintain a regular, meaningful Git commit history throughout development.
  Do not combine the entire assessment into a single final commit.

## Submission Video Requirements

- A submission video must be produced.
- The video link must be publicly accessible.
- Maximum length: 6 minutes. Longer videos may be penalized.
- Part 1 must explain and demonstrate how AI was used during development.
- Part 2 must explain important design decisions made during the project.

## Submission Requirements

- Repository must be public.
- Frontend and backend must both be deployed and publicly accessible.
- A demonstration video must be produced, maximum 6 minutes.
- Before submission, verify public access in a private/incognito browser.
- Do not commit after the confirmed MSA submission deadline.
- The submission deadline timezone must be verified from the official MSA
  source. Do not assume or invent a timezone.
- Submission must use the official MSA 2026 Phase 2 Microsoft Form.
- Submit one public GitHub repository link containing frontend and backend.
- Submit one publicly accessible video link.
- Secrets or marking information that should not be public may be supplied
  through the optional private text field.
- Secrets must not be committed to the public repository.

## README Requirements

- README must clearly list the top 3 advanced requirements for scoring:
  1. Security Measures
  2. WebSockets using SignalR
  3. Cypress End-to-End Testing
- The README must include the deployment link required by MSA.
- Project submission-safety requirement: the README also includes links to
  the frontend deployment, backend deployment or Scalar UI, public video,
  and repository.

## README Mandatory Content

The README must contain:

- A link to the deployed application.
- A brief introduction to the project.
- A section explaining how the project relates to the Gamification theme.
- A section explaining the project's distinctive or noteworthy features.
- A clearly labelled checklist of advanced requirements.
- A self-reflection explaining what would be done differently if the project were repeated.

## Individual Work and Academic Integrity

- This is an individual assessment.
- The submitted work must be the student's own work.
- AI-generated output must be critically evaluated and understood before
  being accepted into the project.
- Do not copy another participant's work or collaborate in a way that makes
  the submissions insufficiently distinct.

## Published Scoring Considerations

The formal rubric is not public, but the official brief identifies these
general scoring areas:

- Visual appeal and UI quality.
- Code quality, structure, and maintainability.
- Meaningful Git usage and development history.
- Video presentation clarity and structure.
- Effective and responsible AI usage, supported by evidence in the video
  and `/specs`.

  ## Deadline and Submission Safety

- Published deadline: 11:59 pm, Sunday, 2 August 2026.
- Deadline timezone: UNVERIFIED.
- Verify the timezone through the official MSA source or Discord before submission.
- Do not commit after the confirmed deadline.

  ## Related Rules

- Commit history: `06-development-workflow.md` §6.8
- Deployment and submission: `06-development-workflow.md` §6.7
- AI workflow: `specs/ai/01-ai-development-workflow.md`
- Agent context and governance: `specs/ai/02-agent-context-and-governance.md`
