# Implementation Prompt — UI Sound Effects

Reconstructed implementation instruction (this slice was requested directly in
a Kimi Code CLI conversation; the original wording was conversational, so this
record states the effective instruction truthfully).

Create branch `feat/ui-sound-effects` from `origin/main`. Add four UI feedback
sounds to the frontend: button click, dialog confirm, dialog cancel, and a
fanfare when the reward toast appears. Use pre-made CC0 audio files (Kenney
assets), not synthesized audio. Add a persistent mute/unmute toggle in the app
header. Do not add any npm dependency. Keep sounds easily replaceable: pick
four suitable defaults, deploy them under `frontend/public/sounds/`, and keep
a set of previewable alternatives plus replacement instructions so the human
can swap them without code changes.

Constraints observed: no database, API, or security-model changes; no staging,
committing, pushing, or PR creation without explicit approval; run the
applicable frontend gates; write a truthful completion report.
