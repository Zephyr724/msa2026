# Community text-cover long-sentence fit

## Reconstructed implementation instruction

Create a short-lived fix branch and correct the `/community` no-image post
cover so that its complete first sentence is never clipped when it is too long
for the fixed `19:25` cover. Preserve the complete sentence and reduce its font
size only when required by the available cover height. Recalculate after
responsive size changes, retain the existing card treatment, add focused test
coverage, and run the applicable frontend verification gates.

