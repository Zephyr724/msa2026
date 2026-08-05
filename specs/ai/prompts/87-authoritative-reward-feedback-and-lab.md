# Prompt Record 87 — Authoritative Reward Feedback and Development Lab

- **Date:** 2026-08-05
- **Implementation owner:** Current Codex session
- **Accepted specification:** `specs/implementation/31-reward-feedback-and-lab.md`

## Product-owner instruction

> 根据之前跟你讨论的内容，设计一套增强交互和视觉效果的方案，不用实施，先把方案和技术都准备好。我这边需求是，符合主题游戏，增加动画，配合当前风格，不是要幼儿化。 最少要实施：1.在完成任务的时候，弹出toast，toast提示恭喜完成任务，然后从toast中有星星粒子效果飞到右上角xp这里。用户可以点击关闭toast或者5秒后自动消失。或者类似的方案。 2.升级时候，也弹出toast，恭喜升级。 其他可以提升gamification的建议，在你调研后告诉我。

The product owner then approved implementation and required a complete test
path:

> 上面的方案可以，实现吧。要考虑给我设计一个测试帐号或者测试功能，我要跑通所有的设计

## Reconstructed implementation instruction

Implement the approved mature Kiwimpact reward feedback as the sole
implementation owner without adding a dependency, schema change, authentication
bypass, or unrelated product expansion.

- Make Completion Code redemption return one committed, server-authoritative
  reward envelope with event ID, actual XP, previous/current progression, and
  newly awarded achievement summaries.
- Validate that exact DTO at the frontend boundary and stop projecting reward
  state from Quest display data.
- Present a queued, deduplicated, non-modal five-second Toast with explicit
  close, hover/focus/document-hidden pause, completion copy, XP, combined
  level/rank congratulations, and bounded achievement reveal.
- Animate a restrained star/ember particle group from the Toast to a visible
  mobile/desktop XP target and update the target at arrival. Respect reduced
  motion and accessibility semantics.
- Keep the established environmental visual system and avoid childish motifs,
  random rewards, or intrusive full-screen celebration.
- Add a Development-only, unauthenticated, memory-only Reward Lab covering all
  supported states, plus document the existing seeded Development member as
  the real persisted-path persona. Never commit a demo password.
- Add targeted backend/frontend tests, run all applicable gates, perform real
  desktop/dark/320 px browser verification, and record only observed evidence.
- Do not stage, commit, push, deploy, or create/update a pull request without
  separate explicit approval.
