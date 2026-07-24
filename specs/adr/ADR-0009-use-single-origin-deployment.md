# ADR-0009: Use a Single Public Origin for Production

- **Status:** Proposed — pending design review
- **Date:** 2026-07-24
- **Decider:** Product owner
- **Decision source:** Phase 2 delivery-scope planning
- **Supersedes:** None

## Context

Kiwimpact is a first-party browser application using ASP.NET Core Identity
with HttpOnly cookie authentication and antiforgery protection. The frontend
uses relative `/api` requests locally through the Vite proxy. Production must
support secure cookies and CSRF protection without adding avoidable
cross-origin credential complexity.

This ADR decides the public topology, not the hosting provider. WebSockets are
a P1 enhancement and must not be a prerequisite for deployment.

## Decision

The browser-visible frontend, API, and Scalar documentation will use one
public origin in production.

- Frontend API calls continue using relative `/api` paths.
- Scalar is served on the same public origin.
- Local development may continue using the Vite proxy.
- Production authentication cookies use `Secure` and `HttpOnly`.
- `SameSite=Lax` is the default unless future evidence demonstrates that
  another value is necessary.
- State-changing requests continue to require anti-CSRF validation.
- Production does not depend on credentialed cross-origin CORS.
- If SignalR is implemented later, `/hubs` may share the same origin.
- This ADR does not require WebSockets.
- The deployment provider remains separately selectable.

The selected host may use a reverse proxy, application gateway, or a backend
that serves the built frontend. The implementation may vary as long as the
browser observes one origin and the security properties above hold.

## Consequences

### Benefits

- Relative frontend API paths work consistently in production.
- Cookie and antiforgery behaviour avoid routine cross-origin credential
  configuration.
- Browser, API, Scalar, and optional hub links share one public base.
- Local development retains the existing Vite proxy workflow.
- Hosting-provider selection remains open.

### Costs and trade-offs

- Deployment must route frontend, `/api`, Scalar, and optional `/hubs`
  correctly beneath one origin.
- Independent frontend/backend hosts require a front door or reverse proxy so
  the browser still observes one origin.
- Cache, fallback routing, forwarded headers, HTTPS termination, and WebSocket
  upgrade behaviour must be verified for the selected provider.

## Security impact

- Production cookies are `Secure` and `HttpOnly`.
- `SameSite=Lax` remains the default defence-in-depth policy.
- Antiforgery protection is still mandatory for state-changing requests.
- Same-origin topology reduces exposure to cross-origin credential
  misconfiguration but does not replace authorization, validation, rate
  limiting, trusted proxy configuration, or CSRF tests.
- Production secrets remain in deployment secret management, never committed
  configuration.

## Rejected alternative: browser-visible cross-origin deployment

A frontend on one public origin and credentialed API on another was rejected
as the default because it requires more complex cookie, CORS, preflight, CSRF,
redirect, and proxy configuration without a demonstrated product need.

Cross-origin deployment may be reconsidered only if a future accepted
requirement cannot be met securely with the single-origin topology.

## Implementation implications

- Preserve relative `/api` URLs in frontend code.
- Keep the Vite `/api` proxy for local development.
- Configure the production ingress to route the built frontend, API, Scalar,
  and optional `/hubs` through one origin.
- Set production cookie security explicitly and verify it over HTTPS.
- Do not rely on production credentialed CORS for normal browser operation.
- Ensure SPA fallback routing does not capture `/api`, Scalar, or `/hubs`.
- If SignalR is later added, verify proxy upgrade behaviour separately; REST
  leaderboard correctness remains independent.
- Record the chosen provider and exact deployment procedure in later
  deployment evidence, not in this ADR.

## Review triggers

Review this ADR if:

- a native, third-party, or independently hosted client becomes accepted;
- the selected provider cannot expose the required single public origin;
- external authentication callback requirements demonstrate a topology
  conflict;
- cookie or antiforgery testing shows `SameSite=Lax` is insufficient;
- Scalar cannot be safely exposed on the same origin;
- a future networking or security requirement materially changes the threat
  model.
