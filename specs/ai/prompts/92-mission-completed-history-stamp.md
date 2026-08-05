# Prompt 92 — Mission Completed History Stamp

- **Date:** 2026-08-06
- **Branch:** `feat/quest-highlight-badge`
- **Risk:** Low — frontend presentation only

## Actual human instruction

The human supplied screenshots of the Passport Completion history and a
distressed circular stamp, then requested:

> 这里完成的图标变成mission completed的章，画成跟参考图一样

The human clarified the required color:

> 绿色

The human then refined the reference match:

> 不需要透明磨损划痕。其他一样，文字要大一点，completed你仔细观察，左右两边压在章上

The human further clarified the ring and banner construction:

> 章的完全外圈比较粗，里面还有一圈很细的线，现在内圈太粗了。completed你改后看不清跟那两个圈交织在一起，参考原版做法，completed应该是有白色背景的

The human then supplied a clearer badge-and-ribbon reference and requested:

> 你做不出来这个感觉，做成这样能吗？

The human supplied a final, simpler seal reference and requested:

> 改成这个。。。总能做出来吧，绿色

The human refined the proportions and theme treatment:

> 绿色选用我们的主题绿色。星星变小点，你观察原图标的比例。锯齿和线的比例也不对。底图用透明，不是白色。章再大30%

The human requested one final compositing adjustment:

> 加20%透明度

## Implementation instruction

Replace the green Verified check overlay on Passport completion-history images
with a green code-native SVG seal inspired by the final supplied reference.
Use the product theme green, a shallow-toothed serrated circular edge,
transparent inner field, fine green inner circle, proportionally small green
stars above and below, and a wide angled green rounded banner with large white
`MISSION COMPLETE` text. Render the badge approximately 30% larger than the
previous version and apply 20% transparency to the complete badge. Do not add
distress marks. Preserve the existing non-Verified status treatment and add
accessible test coverage. Do not add an image asset or dependency.
