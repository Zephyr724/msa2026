# AI Model Routing Policy

## Runtime instruction

The active runtime policy is stored at:

`/.clinerules/10-ai-model-routing-and-cost-control.md`

## Workflow

- Claude Sonnet: architecture, security, planning, and independent review.
- DeepSeek V4 Pro: routine implementation, testing, and debugging.
- Claude Opus: explicit human-approved escalation only.
- Plan mode is used for Claude planning and review.
- Act mode is used for DeepSeek implementation.
- Independent reviews begin in a new blank task.

## Rationale

This division keeps routine development cost-effective while reserving the
stronger reasoning model for decisions where architectural or security errors
would be expensive to correct.

## Human responsibility

The developer reviews and approves architecture decisions, file changes,
terminal commands, tests, and final implementation outcomes.
