# AI Model Routing Policy

## Active instruction

`AGENTS.md` is the primary cross-agent instruction entry point.
`/.clinerules/10-ai-model-routing-and-cost-control.md` is the
Cline-compatible runtime counterpart.

## Active routing

- Codex is the default planning, implementation, testing, debugging, and
  documentation agent.
- Use normal or medium effort for low-risk work.
- Use high effort for authentication, authorization, migrations,
  data-integrity, deployment, and cross-stack contracts.
- Ultra or maximum effort requires explicit human approval.
- Cline with DeepSeek is an optional low-risk or quota-constrained fallback.

Low-risk tasks may complete with Codex self-check, automated gates, and human
inspection. Important and high-risk tasks receive one independent read-only
review by Kimi K3 or a fresh Codex session selected by the human. The reviewer
must not be the implementation session.

Claude is escalation-only when the normal implementation/review pair cannot
resolve a concrete high-risk problem. Never run Kimi, Codex, and Claude
sequentially on one normal task.

Approval requires zero Blockers and zero Majors. A normal task allows one full
independent review, one concentrated correction pass, and one targeted closure
check of original unresolved Blocker/Major findings.

## Historical context

The initial policy routed routine implementation to DeepSeek through Cline and
reserved Claude Sonnet for planning and review, with Claude Opus for explicit
escalation. Historical records created under that policy remain valid evidence;
the active risk-based policy above supersedes that routing.

## Human responsibility

The developer reviews and approves decisions, file changes, commands, tests,
Git writes, deployment, and final outcomes.
