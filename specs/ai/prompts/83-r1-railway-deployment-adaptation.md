# R1 Railway Deployment Adaptation — Implementation Prompt Record

## Record type

Truthful reconstructed implementation instruction. The work was directed over
an interactive Chinese deployment session rather than supplied as one static
prompt.

## Human instruction and approved context

The human selected Railway, created a production project with an online
PostgreSQL service in Southeast Asia (Singapore), created the `kiwimpact-app`
service, attached and renamed an application volume, and approved the code-side
deployment adaptation. The target is automatic GitHub deployment rather than
manual Railway uploads. The application volume is for ASP.NET Core Data
Protection keys at `/var/lib/kiwimpact/keys`.

## Reconstructed implementation instruction

Implement the smallest provider-specific production adapter for the accepted
single-origin Kiwimpact architecture:

- preserve the existing React build plus ASP.NET Core API Docker topology;
- keep the application and EF migration process non-root at steady state;
- account for Railway's root-owned volume mount with a tightly bounded startup
  permission step that drops privileges immediately;
- add Railway config-as-code for Dockerfile build, explicit migration
  pre-deploy, readiness healthcheck, and restart behavior;
- process forwarded scheme and client IP before HTTPS redirection and rate
  limiting, trusting only Railway's documented proxy network and one hop;
- retain a persistent Data Protection key path on the attached volume;
- use the Railway PostgreSQL private network and require encrypted PostgreSQL
  transport;
- add focused tests for trusted and untrusted forwarded headers;
- document exact Railway variables, auto-deploy/Wait for CI settings, backup and
  restore evidence, smoke checks, rollback boundaries, and known limitations;
- run applicable backend, frontend, Docker, and diff verification, recording
  only observed results;
- obtain one independent read-only review after evidence documents exist.

Do not stage, commit, push, merge, expose production secrets, change DNS, or
trigger a deployment without separate explicit human approval.
