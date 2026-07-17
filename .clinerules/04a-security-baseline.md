# 04a — Security Baseline

This rule is always active and applies to all files.

## Hard Rules (never violate)

1. **Never** log credentials, tokens, secrets, or unmasked PII.
2. **Never** concatenate user input into SQL, shell commands, HTML, or any
   interpreted language. Use parameterized queries, structured builders, or
   safe templating.
3. **Never** run unvalidated or unsanitized user input as code.
4. **Never** hard-code secrets in source code. Load secrets from environment
   variables or a secrets manager at runtime.
5. **Never** bypass authentication or authorization checks, even temporarily
   for debugging.

## Before Every Change — Five Questions

```
INJECTION? → EXPOSURE? → PERSISTENCE? → DESTRUCTION? → PRIVILEGE?
   ❌           ❌           ❌              ❌             ❌
   If any ❌ is actually ✅ → STOP and re-evaluate

INJECTION:   Is user input reaching SQL/shell/HTML without sanitization?
EXPOSURE:    Could this leak secrets, PII, tokens, or internal paths?
PERSISTENCE: Could this create a backdoor or alter auth flows?
DESTRUCTION: Could this irreversibly delete data?
PRIVILEGE:   Does this escalate permissions or change access controls?
```

## High-Risk Operations

For any of the following, STOP and request explicit human approval:
- Installing or removing dependencies
- Changing authentication or authorization logic
- Modifying database schema outside a migration file
- Deleting or destructively modifying data
- Changing environment variable handling or secret loading
- Modifying rate-limiting, CORS, CSRF, or security headers

## Cryptography

- Only use well-audited standard library or platform crypto modules.
- Never implement custom cryptographic algorithms or protocols.
- Use cryptographically secure random number generators for tokens and IDs.
- Password hashing parameters: see `04b-auth-security.md`.

## Secrets & Configuration

- Secrets come from environment variables or a secrets manager, never from
  source files, comments, or committed configuration.
- `.env` files must be in `.gitignore`. Only `.env.example` (with placeholder
  values only) may be committed.
- Configuration defaults must be safe for production (secure by default).