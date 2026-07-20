# ADR-0004: Use React, TypeScript, Vite, Tailwind CSS, and daisyUI

- Status: Accepted
- Date: 2026-07-19
- Decider: Product owner
- Decision source: `specs/Kiwimpact_Final_Planning_Baseline_v1.0.md`
- Supersedes: None

> The frontend direction is already accepted in the planning baseline. This ADR

## Context

The MSA assessment requires a React frontend with routing, unit tests,
deployment, and a visually distinctive responsive UI. Kiwimpact also needs
public discovery, Member/Organizer/Admin areas, maps, gameful progress,
Light/Dark themes, accessible forms, and integration with a separate ASP.NET
Core backend.

The MVP has no accepted server-side rendering requirement.

## Decision

The frontend will use:

- React;
- TypeScript;
- Vite;
- React Router;
- Tailwind CSS;
- daisyUI;
- Lucide React for functional icons.

Vite provides development and production builds. React Router provides
client-side navigation. Tailwind CSS and daisyUI provide the initial styling
and component foundation, with Kiwimpact-specific tokens and component styling
layered on top.

shadcn/ui will not be included initially. Exact package versions will be chosen
during scaffolding after compatibility checks and proven by `package.json` and
`package-lock.json`.

## Visual and interaction direction

The frontend must support Kiwimpact Light/Dark themes, accepted visual tokens,
responsive layouts, keyboard access, semantic HTML, reduced motion, skippable
reward sequences, optional sound off by default, and clear loading/empty/error/
forbidden/not-found states.

The interface is friendly, rounded, energetic, and slightly cartoon-like
without copying another product or becoming childish.

## Application boundary

The React app consumes REST/JSON and SignalR from ASP.NET Core. It does not
duplicate backend business authority. React Hook Form and Zod improve frontend
input UX; the backend remains authoritative.

## Consequences

### Benefits

- Meets the React requirement.
- Vite fits a separate .NET backend.
- TypeScript improves UI and API-boundary safety.
- Tailwind/daisyUI accelerate consistent responsive styling.
- Theming supports the accepted Light/Dark experience.

### Costs and trade-offs

- A SPA must handle initial loading and route-level errors carefully.
- Defaults must be customized to avoid a generic appearance.
- Accessibility and responsiveness still require deliberate design and tests.
- Package compatibility must be checked at scaffold time.

## Alternatives considered

Next.js was not selected because the accepted architecture already has a
separate ASP.NET Core backend and no SSR requirement. Styling without the
selected foundation was not chosen because consistent delivery speed matters.
shadcn/ui is deferred to avoid two initial component-system layers.

## Verification

This decision is implemented only when verified manifests/lockfiles exist,
Vite builds the React TypeScript app, routing works, tokens/themes are
configured, responsive and accessible behavior is demonstrated, tests pass,
and `PROJECT_STATUS.md` records the working commands.

## Review triggers

Review this ADR if an accepted requirement needs SSR/static generation, the
styling tools block the approved design, accessibility evidence shows an
unresolvable limitation, or deployment requires another frontend foundation.
