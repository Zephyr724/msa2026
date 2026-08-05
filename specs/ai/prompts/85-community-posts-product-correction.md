# Slice 29 Implementation Prompt — Community Posts Product Correction

## Source

The product owner rejected the narrowed Slice 25 Community implementation and
supplied these correction instructions on 2026-08-04:

> community跟我跟你商定的，差很远，你重新查一下我我的需求，你没做到啊。列出我的需求，补做完剩下的内容

> 不止，我说参考小红书的产品来设计：1.新建帖子是一个按钮，你现在做的是什么玩意？2.点击按钮后才是一个弹窗页面来创建帖子。 3.基本功能也没有啊，可以传多张图，哪怕是url，现在也没实现。4.有标题 5.有正文 6.关联活动（这个才是目的 7能加tag 8.能发布 9.能删除 10.能存draft最好，不行先不实现了，优先其他功能

The product owner first added and then corrected requirement 11:

> 11.活动能公开和隐藏

> 11.修正为发布的帖子能公开和隐藏

The product owner then added the multi-image browsing requirement:

> 12.添加的多张图片在浏览帖子时为滚动轮播功能，也支持用户点击左右翻看

The original social-feed instruction and migration approval remain relevant:

> 新建一个分支，做：社交帖子、搜索、瀑布流、发布、点赞及两级评论。这个需求清楚了吧，清楚就可以开始了

> 批准数据库迁移

The product owner also required Kimi K3 review and correction of findings:

> 写完让K3审查一次，有问题你记得修复

After recovery and review, the product owner corrected the Quest rule on
2026-08-05:

> Related Quest 是optional 不是必须，只是强烈推荐

## Reconstructed implementation instruction

Work as the sole implementation owner in an isolated short-lived feature
worktree/branch without changing the user's dirty main worktree. Correct the
Community product to match `specs/implementation/29-community-posts-product-correction.md`.

- Replace the permanent composer with one clear `New post` button and a
  responsive modal/bottom-sheet composer.
- Require a title and body. Make Related Quest optional but visibly and
  strongly recommended. Reuse the existing Quest list/search boundary; when a
  Quest is supplied, independently require it to exist and be Published.
- Accept zero to nine ordered HTTPS image URL plus alternative-text pairs.
- Accept up to ten bounded tags and expand search to title, body, tags, Quest
  title, and author display name.
- Publish posts as either public or hidden. Treat hidden as a persisted
  visibility state, not a draft: only the author can see, interact with, and
  restore the hidden post.
- Permit only the author to permanently delete a post and rely on database
  cascades for owned reactions, discussion, images, and tags.
- Render multiple images as a touch/horizontal-scroll carousel with mandatory
  CSS scroll snap, previous/next controls, position dots, and a counter. Do not
  autoplay.
- Preserve the existing newest-first URL-search masonry feed, likes, and
  exactly two comment levels.
- Add the already-approved additive EF Core migration with safe legacy title
  and image backfill; do not invent Quest relationships for existing rows.
- Preserve backend authentication, authorization, ownership, privacy,
  antiforgery, validation, and rate-limit enforcement. Do not expose internal
  account identifiers.
- Add unit, PostgreSQL/API, migration/OpenAPI, and frontend integration coverage.
- Run applicable complete gates and real-browser desktop/mobile verification.
- Create truthful evidence before invoking the configured Kimi K3 CLI for one
  independent read-only review. Apply one concentrated correction pass for
  original Blocker/Major findings and use the same review session for targeted
  closure.
- Draft persistence is explicitly deferred. Binary upload/object storage and
  unrelated social-network expansion remain outside scope.
- Do not stage, commit, push, merge, deploy, or create/update a pull request
  without separate explicit product-owner authorization.
