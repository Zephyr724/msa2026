---
paths:
  - "src/app.ts"
  - "src/routes/**"
  - "src/services/**"
  - "src/middleware/**"
  - "src/integrations/**"
  - "src/utils/**"
  - "src/config/**"
  - "src/composition/**"
  - "tests/integration/**"
---
# 04d — Runtime Security

## Reverse Proxy Trust

- `trust proxy` must match the actual deployment topology.
- Never enable unrestricted `trust proxy: true` without verifying that the
  last trusted proxy overwrites all forwarded headers.
- Rate limiting and audit logging may use forwarded client IPs only after
  proxy trust is configured and tested.

## Rate Limiting & DoS Protection

- Rate-limit login, registration, and password-reset endpoints.
- Apply a global request body size limit (`express.json({ limit: '100kb' })`).
- Consider per-IP rate limiting for public endpoints.

## HTTP Security Headers

- Use `helmet` middleware for security headers.
- Enable CORS with explicit allowed origins (not `*`) if cross-origin
  requests are needed.

## Outbound HTTP & SSRF

- Validate and restrict outbound HTTP requests from the server.
- Enforce an allowlist for outbound destinations where feasible.
- Do not forward user-supplied URLs to HTTP clients without validation.

## Path Traversal Protection

- Resolve and validate file paths before file operations.
- Reject paths that escape the intended base directory.
- Do not use unsanitized user input to construct filesystem paths.

## CSRF Protection

- Enable CSRF protection if cookie-based sessions are used.
- The CSRF strategy must be resolved by ADR-002.

## Error Serialization

- The centralized error middleware must never serialize `Error` objects,
  stack traces, SQL errors, filesystem paths, or dependency error objects.
- See `01-architecture.md` §1.7 for the complete error handling contract.