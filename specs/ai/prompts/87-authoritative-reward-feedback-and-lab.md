# Prompt Record 87 — Authoritative Reward Feedback and Development Lab

- **Date:** 2026-08-05
- **Implementation owner:** Current Codex session
- **Accepted specification:** `specs/implementation/31-reward-feedback-and-lab.md`

## Product-owner instruction

> 根据之前跟你讨论的内容，设计一套增强交互和视觉效果的方案，不用实施，先把方案和技术都准备好。我这边需求是，符合主题游戏，增加动画，配合当前风格，不是要幼儿化。 最少要实施：1.在完成任务的时候，弹出toast，toast提示恭喜完成任务，然后从toast中有星星粒子效果飞到右上角xp这里。用户可以点击关闭toast或者5秒后自动消失。或者类似的方案。 2.升级时候，也弹出toast，恭喜升级。 其他可以提升gamification的建议，在你调研后告诉我。

The product owner then approved implementation and required a complete test
path:

> 上面的方案可以，实现吧。要考虑给我设计一个测试帐号或者测试功能，我要跑通所有的设计

After exercising the Lab, the product owner reported that the preview buttons
showed no visible animation and explicitly requested the correction:

> [http://localhost:5173/dev/rewards](http://localhost:5173/dev/rewards)这个页面我点击每个测试按钮，看不到任何动画，为什么？

> 修复

The product owner then refined the approved visual hierarchy and motion:

> 修改特效：1.布局不对，最上面是标题Congratulation，其他内容放在这个下面。 2.Congratulation选用夸张的英文花字体，颜色选用接近金色的黄色。3.这个Congratulation是稍微有向上凸的弧度，左右宽度尽量撑满toast的70%宽度。 4.星星特效看不清楚，粒子放大一点。能不能做成一条弧线，一个一个星星飞到那个地方

> 一个接一个星星飞到终点位置

> 星星移动的动画慢一点，慢20%，现在看不清

> **+50** **XP** 要有适合的出场动画；**→ Level** **10也要有出场动画，这个是箭头从左边level的最后一个字母往右移出，level 10，从隐形出现， Level** **10 选用接近金色的黄色**

The product owner clarified the intended XP symbol:

> 我说是星星是指Sparkles这个，所有xp相关的图标都改成这个，而不是闪电

The product owner selected the exact title face and weight:

> Congraculation字体选用Pinyon Script，中间的厚度

The product owner clarified that the in-flight particles use the same symbol:

> 飞上去的星星也是用这个Sparkles啊

The product owner then specified the complete reward sequence:

> **+50** **XP也是相同的金黄色，只有+50** **XP有动画，图标没有。顺序优化一下，获得xp，然后飞星星，飞星星后隔一秒播放升级的动画，最后再是获得成就的动画。成就也是金黄色，动画是类似盖章的动画，大到小“盖章到”那个位置。Congratulation的字体加粗一个级别**

> 等级箭头动画播放后停1秒，播放成就

The product owner requested a smoother, accelerating particle stream:

> 星星飞上去的动画不流畅，总感觉中间少了几帧。选用星星的速度，越后面出现的星星速度越快，就是整体速度越来越快的方式。整个动画控制在2.5秒。星星不知道是透明度问题还是被toast框覆盖裁剪问题，离开了框感觉就变透明了，而不是清晰地飞到nav的等级上

The product owner clarified the stamp target:

> 成就不是整个盖章，是那个成就的title有盖章效果，例如“**Building Momentum**”

The product owner further increased the title emphasis and width:

> COngraculation再加粗一级，而且宽度不够，再往左右多占更多空间，就是左右两边各留10%够了

The product owner simplified the flight glyph and shortened the stream:

> 星星的粒子选用sparkles类似的四角星星，不要四角星星左右还有小星星的形式。整个动画在2秒内完成

The product owner made the final title width/weight adjustment:

> Congraculation再左右多占一点，但是字体粗度缩小一点点

The product owner enlarged the level and particles, extended combined rewards,
and corrected the stamp's depth direction:

> 升级后的大小level 10放大一点。如果是**Combined reward，toast停留时间多5秒。盖章效果不是现在这个，上一版的效果更像盖章。现在更像是右边插进来。我需要的效果是更像是从z轴就是屏幕外盖下去的。星星飞上去的那个例子大50%**

The product owner selected a hollow flight-star treatment:

> 四角星星有没有中空的替换现在的？

The product owner added a restrained arrival accent to the new level:

> level 5出现后，加一点震动效果

The product owner increased the hollow sparkle outline weight:

> 星星框加粗20%

> 再加粗20%

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
- Lead the Toast with a 70%-width, slightly upward-curved calligraphic
  `Congratulation` title in near-gold. Keep all reward details below it.
- Use larger star particles on one shared curved trajectory, staggered one
  after another. Sample the Bézier route densely and interpolate it linearly so
  motion does not hitch between sparse keyframes. Shorten each later particle's
  duration to create an accelerating stream, complete the group within two
  seconds, keep it above the Toast without clipping, and preserve full opacity
  until each particle visibly reaches the navigation XP target. Use a single
  four-point sparkle shape with no smaller satellite sparkles for flight.
- Animate only the near-gold XP amount while its `Sparkles` icon stays still.
  Then fly the Sparkles particles. One second after the final particle, animate
  the arrow rightward from the previous `Level` label and reveal the new level
  from transparent in near-gold. After the arrow animation completes, hold for
  another second before stamping only each near-gold achievement title (for
  example, `Building Momentum`) from large to its final size. The containing
  achievement panel stays still.
- Enlarge the revealed target level slightly. Increase the single flight
  sparkle from 18 px to 27 px. Keep ordinary Toasts at five seconds, but extend
  combined level/rank-plus-achievement rewards to ten seconds. The achievement
  title stamp must travel directly along the Z axis from in front of the screen,
  with no lateral insertion.
- After any new level (including Level 5) becomes visible, finish its entrance
  with a subtle, rapidly decaying horizontal shake of approximately two pixels.
- Render each flight particle as one hollow, rounded gold four-point outline
  with no fill and no satellite sparkles. Apply two successive 20% outline
  increases, from 2.2 px to 2.64 px and finally 3.168 px.
- Replace lightning-bolt XP glyphs with Lucide `Sparkles` throughout the
  frontend, including every in-flight particle, so the reward and persistent XP
  surfaces use one visual language.
- Load `Pinyon Script` through the existing Google Fonts stylesheet, render the
  curved title at a slightly softened 550 weight, and expand the actual curved
  text to about 86% of the Toast so roughly 7% remains on either side.
- Keep the established environmental visual system and avoid childish motifs,
  random rewards, or intrusive full-screen celebration.
- Add a Development-only, unauthenticated, memory-only Reward Lab covering all
  supported states, plus document the existing seeded Development member as
  the real persisted-path persona. Never commit a demo password.
- Add targeted backend/frontend tests, run all applicable gates, perform real
  desktop/dark/320 px browser verification, and record only observed evidence.
- Correct the discovered particle initialization and browser-compatibility
  defects. Do not treat mounted particle nodes as evidence of movement; verify
  a ready trajectory, non-zero in-flight opacity/transform, and final XP arrival.
- Do not stage, commit, push, deploy, or create/update a pull request without
  separate explicit approval.
