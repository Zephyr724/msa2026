# Prompt 82 — P0-2 Private Query Cache Isolation

- **Date:** 2026-08-03
- **Implementation owner:** Codex
- **Task type:** Important frontend authentication-boundary correction
- **Human authorization:** Production implementation and tests requested
- **Excluded authority:** No staging, commit, push, merge, pull request, or deployment

## Actual implementation instruction

> 你修改这部分内容P0-2：修复跨账号私有 Query Cache 隔离
> 这是本次新发现的最重要代码风险。登录/登出目前只清理少数缓存前缀，
> `privateCache.ts` 遗漏了：
>
> - Community profile/streak
> - 管理员 Evidence claim 和私密审核内容
> - 单 Quest 的个人 participation/completion
> - Organizer 管理数据和 completion-code 状态
> - 带 isCurrentUser、Home Community 等用户语义的 leaderboard
>
> 中途收到 401 时，部分 API 也没有执行统一的 session-expiry 清理。共用浏览器
> 从 A 账号退出再登录 B 账号时，可能短暂显示 A 的私有数据。
>
> 完成标准：登录、登出、账号替换、任意私有接口 401 都先取消并清除全部
> principal-specific query/mutation 数据；补 A→logout→B 和管理员→普通用户回归测试。

## Implementation constraints applied

- Preserve the existing HttpOnly-cookie authentication and authorization model.
- Make no backend, schema, dependency, architecture, or product-scope change.
- Use the active `QueryClient` supplied by the mounted provider.
- Preserve the accepted ordering: cancel and clear old-principal state before
  publishing a null or replacement session.
- Run the applicable frontend gates and record only observed results.
- Create implementation evidence before requesting the required independent
  read-only review.
