---
paths:
  - "backend/src/**"
  - "backend/tests/**"
  - "frontend/src/**"
  - "frontend/.env.example"
  - "frontend/vite.config.*"
  - "**/Dockerfile"
  - "**/Dockerfile.*"
  - "docker-compose*.yml"
  - "docker-compose*.yaml"
  - "compose*.yml"
  - "compose*.yaml"
  - "infra/**"
  - "deploy/**"
  - ".github/**"
---
# 04d — Runtime Security

## Reverse Proxy Trust

- Do not enable or trust forwarded client headers merely because the
  frontend uses a Vite development proxy.
- ForwardedHeaders configuration is enabled only for a known production
  proxy topology, with explicit KnownProxies or KnownNetworks
  configuration and tests.
- Rate limiting and audit logging may use forwarded client IPs only after
  proxy trust is configured and tested.

## Rate Limiting & DoS Protection

- Rate-limit login, registration, and password-reset endpoints.
- Apply global request body size limits in ASP.NET Core.
- Consider per-IP rate limiting for public endpoints.

## HTTP Security Headers

- Configure required security headers explicitly using application middleware,
  reverse-proxy configuration, or an explicitly approved dependency. Do not
  add a new security-header package without approval.
- Enable CORS with explicit allowed origins (not `*`) if cross-origin
  requests are needed.

## CORS Configuration

- CORS uses explicit origins only; never wildcard origin with credentials.
- Local Vite proxies `/api/*` and `/hubs/*` with WebSocket support to the
  .NET backend.

## Curated External Source URLs

- Treat provider URLs as untrusted external links.
- Do not scrape, preview, fetch, or follow them from the backend.
- Open them with `noopener` and `noreferrer`.
- The official provider page remains authoritative.

## Google Maps Browser Key

- The browser Maps key is not a backend secret, but it must use HTTP-referrer
  restrictions and Maps JavaScript API restrictions.
- Store it in `frontend/.env.local`; never commit the real value.
- The Google OAuth client secret remains backend-only and separate.
- Local development referrers:
  - `http://localhost:5173/*`
  - `http://127.0.0.1:5173/*`
- Restrict the development key to Maps JavaScript API.
- The real Maps API key must never be committed.
- Production referrer allowlists require explicit review.
- Non-secret production origins and restriction configuration may be committed.

## Outbound HTTP & SSRF

- Validate and restrict outbound HTTP requests from the server.
- Enforce an allowlist for outbound destinations where feasible.
- Do not forward user-supplied URLs to HTTP clients without validation.

## Evidence URL Handling

- Evidence URLs submitted by users: HTTPS only, owner/Admin only, never
  public, backend never downloads, previews, follows, or fetches them.
- Full URL is not logged; open as untrusted external link with `noopener`
  and `noreferrer`.

## Path Traversal Protection

- Resolve and validate file paths before file operations.
- Reject paths that escape the intended base directory.
- Do not use unsanitized user input to construct filesystem paths.

## CSRF Protection

- Every POST/PUT/PATCH/DELETE request uses ASP.NET Core antiforgery
  protection.
- The shared client sends `X-CSRF-TOKEN`.
- See `04b-auth-security.md` for cookie and CSRF configuration.

## Logging Safety

- Configure ASP.NET Core logging redaction for sensitive fields, including
  at minimum: authorization headers, cookies, set-cookie headers, password
  fields, tokens, and secrets.
- Do not log request or response bodies by default.
- Do not log sensitive query strings by default.
- Use request IDs or correlation IDs for request tracing.
- Log internal stable identifiers only when operationally necessary.
- Never rely solely on developers remembering to remove sensitive fields.

## Error Serialization

- The centralized exception middleware must never serialize `Exception`
  objects, stack traces, SQL errors, filesystem paths, or dependency error
  objects.
- See `01-architecture.md` §1.8 for the complete error handling contract.
