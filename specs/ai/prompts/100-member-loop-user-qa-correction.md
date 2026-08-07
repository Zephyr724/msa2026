# Implementation Prompt — Member Loop User-QA Correction

On branch `codex/feat/member-loop-gamification`, correct the product-owner
reported Slice 37 delivery and presentation defects without staging,
committing, pushing, deploying, or creating a pull request.

Implement the following approved behaviour:

- A successful Completion Code reward must produce the transient reward Toast
  in the real authenticated application, not only in component tests.
- Move the decorative Mission Completed stamp out of the right-side completion
  panel. It must start in the Quest cover area and extend down the left content
  column through Basic Information, completion encouragement, and Rewards,
  without covering the right action column or intercepting input.
- Render the persisted completion encouragement directly below Basic
  Information and directly above Rewards.
- Actual controls labelled Cancel use the red error treatment, including
  participation and Quest cancellation and the existing edit-cancel controls.
- Keep `Your record is updated` on one line where normal desktop space permits,
  widen the Toast if needed, and make the `Review Quest` action green.
- Set the frontend document title to
  `Kiwimpact | Eco Quests, Real Impact`.

Preserve the existing Kiwimpact palette and established component language.
Diagnose from the real reward event and runtime rather than assuming the
synthetic Toast test proves end-to-end delivery. Add focused regression tests,
run all applicable frontend gates, verify the corrected localhost UI in the
browser, record observed evidence, and obtain one independent read-only Kimi
K3 review under the repository's bounded review workflow.
