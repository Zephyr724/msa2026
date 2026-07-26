# Prompt 51 — Slice 6B Passport Achievements UI First Plan

- **Date:** 2026-07-26
- **Target agent:** Kimi K3
- **Task type:** Planning only (frontend-only Slice plan)
- **Expected reviewer:** Codex, independent design review
- **Implementation authority:** None
- **Human decision status:** All D1–D8 decisions in the produced plan remain
  unapproved until the human explicitly accepts the reviewed plan

## Prompt given to Kimi K3 (verbatim)

> 你负责为 Slice 6B — Passport Achievements UI 创建 first implementation plan，不实施代码。
>
> 基线：
>
> - 远端 `main`: `a974725`，PR #15 已合并 Slice 6A-2 及 CI 精度修正
> - 开始前确认分支、HEAD 和干净工作树
> - 阅读并遵守 `AGENTS.md`
>
> 必须阅读：
>
> - `PROJECT_STATUS.md`
> - `specs/implementation/06a-simple-achievements-backend.md` §13–§17，重点 §17 handoff contract
> - `specs/architecture/03-api-contract.md` §2.12
> - 当前 Passport frontend：
>   - `frontend/src/pages/PassportPage.tsx`
>   - `frontend/src/components/passport/`
>   - `frontend/src/hooks/useProgression.ts`
>   - `frontend/src/hooks/usePassportCompletions.ts`
>   - `frontend/src/hooks/useCompletion.ts`
>   - `frontend/src/lib/api/privateCache.ts`
>   - `frontend/src/lib/api/progression.ts`
>   - `frontend/src/lib/api/passport.ts`
>   - `frontend/src/lib/validation/`
>   - `frontend/src/types/`
>   - 直接相关 frontend tests
> - 6A-2 的 prompt、completion report 和 Review 43，只用于核对已实现 API 事实
>
> 创建：
>
> 1. `specs/implementation/06b-passport-achievements-ui.md`
> 2. `specs/ai/prompts/51-slice-6b-passport-achievements-ui-first-plan.md`
>
> 计划首行必须是：
>
> `Status: Proposed — pending human decisions and independent Codex design review`
>
> 计划必须覆盖：
>
> 1. Baseline 与已实现 API 事实。
> 2. P0 产品目标和明确 out-of-scope。
> 3. Passport 页面信息架构和 responsive 布局。
> 4. Catalog 与 earned 数据的客户端类型、严格 exact-key validators、transport 和 TanStack Query hooks。
> 5. 推荐 UI：
>    - Achievements 区块放在 Level Summary 与 Completion History 之间；
>    - 展示全部 active catalog 项；
>    - 已获得项显示 unlocked 状态和 `awardedAt`；
>    - 未获得项显示 locked 状态，但不显示后端未提供的进度；
>    - mobile 单列，较宽屏幕最多三列。
> 6. 错误和加载状态：
>    - 401 使用既有 private-session 生命周期；
>    - 404 与 Passport 既有 profile-missing 行为一致；
>    - 503 `progression-not-ready` 仅形成有界 Achievement 区块状态；
>    - `retry: false`；
>    - catalog 与 earned 的失败边界不得泄漏内部信息。
> 7. 缓存合同：
>    - catalog key `['achievements','catalog']`，长 stale time；
>    - earned key 位于 `['achievements']` 前缀；
>    - redemption 的 `syncAuthoritativeCompletion` 扩展 invalidation；
>    - `expirePrivateSession` 扩展 achievements 私有缓存；
>    - 不使用 Zustand 保存服务端 Achievement 数据。
> 8. 图标策略：
>    - 为三个现有 code 推荐具体 Lucide 图标；
>    - `iconUrl` 非空时的安全渲染策略；
>    - 未知 code 的稳定 fallback；
>    - 不添加依赖。
> 9. Accessibility：语义 heading/list、locked/unlocked 不能仅靠颜色、图标装饰规则、日期文本、键盘和屏幕阅读器行为。
> 10. 测试矩阵：
>     - validators/types；
>     - API transport 与 401 cleanup；
>     - hooks/query keys/retry；
>     - earned/locked rendering；
>     - ordering；
>     - loading/empty/404/503/error；
>     - responsive structural assertions；
>     - redemption invalidation；
>     - private-cache cleanup；
>     - existing Passport regression。
> 11. 适用 frontend gates：
>     - `npm run lint`
>     - `npm run type-check`
>     - `npm run test -- --run`
>     - `npm run build`
> 12. 精确文件映射、文件计数、风险、DoD、证据和独立 review 流程。
> 13. 明确列出 D1–D8 人工决定，每项给出推荐选项、备选项和影响。至少包括：
>     - 展示全部 catalog 还是 earned-only；
>     - 区块位置；
>     - locked 卡片内容；
>     - 503 是区块级还是页面级；
>     - icon 映射/fallback；
>     - 是否显示 unlock date；
>     - catalog/earned 空状态；
>     - 是否明确排除进度、toast 和动画。
> 14. 明确说明进度数据、阈值、streak、toast、unlock animation、其他用户成就、写入端点和 backend change 均不在本 Slice。
>
> 不要修改生产代码、测试、accepted 文档、依赖或配置。不要 stage、commit、push、merge、创建 PR 或部署。不要替人类批准决定。
>
> 完成后报告：
>
> - 创建的文件；
> - baseline 验证；
> - 推荐的 D1–D8；
> - 需要人类选择的内容；
> - 文件数和风险；
> - 下一步为 Codex 独立设计 review。

## Execution record (observed facts only)

- Baseline verified before any planning file was created:
  - Branch `feat/slice-6a2-achievement-read-api`, HEAD
    `5be2a32a4564f40f74bba3e2445090ea7b732b0c`, working tree clean
    (`git status --porcelain` empty).
  - `git fetch origin main` → `origin/main` =
    `a9747259dee07b0db1698dd38c81f36e0e76bbea` (PR #15 merge containing
    `d350ae3` 6A-2 read API and `5be2a32` CI precision correction);
    `git merge-base --is-ancestor HEAD origin/main` confirmed the checkout
    content is contained in remote `main`.
  - The only Git operation performed was the read-only `fetch`; no branch,
    stage, commit, push, merge, reset, or worktree mutation of any kind.
- All mandated sources were read: `AGENTS.md` (supplied in-session),
  `PROJECT_STATUS.md`, `specs/implementation/06a-simple-achievements-backend.md`
  §7–§8 and §13–§18 (§17 handoff contract in full),
  `specs/architecture/03-api-contract.md` §2.11–§2.12, every listed Passport
  frontend source file plus `frontend/src/lib/api/apiFetch.ts`,
  `frontend/src/hooks/useAuth.ts`, `frontend/package.json`,
  `frontend/tests/integration/PassportPage.test.tsx`,
  `frontend/tests/integration/AuthSessionBoundary.test.tsx` (prefix
  assertions), `frontend/tests/unit/useCompletion.test.tsx` (test list),
  prompt 46 (planning-prompt format precedent), prompt 50, the 6A-2
  completion report, and Review 43 (the last three used only to cross-check
  implemented API facts).
- Verified frontend facts recorded in the plan: `lucide-react ^1.25.0`
  already present; `PRIVATE_SERVER_QUERY_KEYS` currently has exactly two
  prefixes; `syncAuthoritativeCompletion` currently has five invalidations;
  no achievement-related frontend module exists.
- Files created by this task: `specs/implementation/06b-passport-achievements-ui.md`
  and this prompt record. Nothing else.
- No production code, test code, accepted specification, dependency, or
  configuration change. No Git mutation beyond the read-only fetch. No
  implementation was performed; no test suite was run (planning-only task;
  no disputed baseline fact required execution).

## Concentrated correction record — Review 44 (2026-07-26, appended)

After the plan was created, Codex delivered the independent design review
`specs/ai/reviews/44-slice-6b-codex-independent-design-review.md` with
verdict `CHANGES REQUIRED` (0 Blocker, 1 Major, 2 Minor). The human then
instructed one concentrated planning correction limited to the original M1,
m1, and m2 findings. The original prompt above is unchanged; this section
records the correction facts.

Correction instruction (summary of the human's message): read Review 44,
the plan, this prompt record, and the accepted 6A D5/§17 handoff contract;
correct only M1, m1, and m2; keep the plan's first-line status exactly
unchanged; keep every D1–D8 item marked `REQUIRES HUMAN APPROVAL`; do not
expand scope; do not touch production code, tests, accepted documents,
dependencies, or configuration; no second full review; no Git mutation;
append this record to Prompt 51; the next step is a Codex targeted design
closure check limited to these three findings.

Corrections applied to `specs/implementation/06b-passport-achievements-ui.md`:

- **M1 — unlocked display fields:** §3.2 and §9 now state that the catalog
  defines only the card slots and their order plus locked-card display
  data; matching remains `earned.achievementId === catalog.id`; a matched
  unlocked card renders the complete earned item (`code`, `name`,
  `description`, `iconUrl`, `category`, `awardedAt`) — never just
  `awardedAt`; an earned row without an active catalog slot is not
  rendered. §14.4 gained the counterexample test (catalog and earned
  display fields deliberately differ → the unlocked card shows the earned
  fields) and the no-slot non-rendering test.
- **m1 — Passport region helpers:** §6 D4 impact, §10 (new
  implementation-boundary paragraph plus table wording), §13 loading
  bullet, and the §16 file map now specify equivalent **private**
  loading/error helpers inside `AchievementsSection.tsx` with the same
  fixed copy and 404/503/generic semantics; no reverse import from
  `PassportPage.tsx` (dependency cycle), no new shared component file, file
  map and 15-file count unchanged.
- **m2 — catalog cancellation signal:** §8.3 defines
  `fetchAchievementCatalog(options?: { signal?: AbortSignal })` forwarding
  the signal to `apiFetch`; §8.4 specifies
  `queryFn: ({ signal }) => fetchAchievementCatalog({ signal })`; §14.2
  gained the focused assertion that the exact signal instance reaches
  `apiFetch`/the global `fetch` call.

Preserved as instructed: the plan's first line remains exactly
`Status: Proposed — pending human decisions and independent Codex design
review`; all D1–D8 rows remain marked `REQUIRES HUMAN APPROVAL`; no scope
expansion; no production code, test, accepted-document, dependency, or
configuration change; no staging, commit, push, merge, pull request, or
deployment action; no second full review was requested or performed.
