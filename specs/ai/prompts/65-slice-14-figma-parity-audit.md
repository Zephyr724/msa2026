# Prompt 65 — Slice 14 Figma Parity Audit

- **Date:** 2026-07-27
- **Owner:** Codex
- **Task type:** Read-only product/design audit plus documentation
- **Design reference:** `docs/UI/Kiwimpact MVP UI Design/`

## Human instruction

> 现在做一个slice，我观察到figma设计和现在的代码还是查很远，无论布局，功能，查看一下原因跟我一份完整的报告，我希望下面一个slice能还原figma设计。

## Implementation instruction

Treat this as a dedicated audit Slice rather than another broad UI rewrite.
Run the local Figma Make prototype and the current product independently,
collect page-level browser evidence, inspect the accepted Slice 9–12 contracts
and their completion/review records, and compare the implementation with the
prototype at layout, visual-system, interaction, state, and feature levels.

The audit must:

1. distinguish implemented functionality from actual design fidelity;
2. identify the concrete reasons the previous convergence work still differs;
3. classify each prototype element as:
   - existing production behaviour that needs faithful presentation;
   - accepted behaviour whose production composition is missing or materially
     different;
   - prototype-only sample content or an unaccepted data/domain assumption;
4. record evidence limitations truthfully, especially authenticated and
   narrow-viewport visual evidence;
5. produce a complete report and a proposed three-phase contract for the next
   Slice to restore the seven runnable Make pages and their shared states;
6. preserve accepted security, privacy, data-authority, accessibility, and
   dependency boundaries;
7. make no production-code, schema, authentication, dependency, deployment, or
   Git publication change.

Do not present hard-coded prototype people, XP, rankings, challenge totals,
achievement targets, or remote Unsplash images as production data.
