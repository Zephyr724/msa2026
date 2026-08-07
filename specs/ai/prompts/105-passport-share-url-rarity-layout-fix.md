# Passport share URL, rarity, and trophy layout fix

## Reconstructed implementation instruction

On the whole-Passport share page, restore the share action as URL sharing
instead of sharing the generated PNG. Keep PNG download as a separate action.
Because the route is authenticated, state truthfully that the URL requires
sign-in and is not a public profile URL.

Restore nationwide rarity labels for the Passport trophy and each earned
achievement by using the existing achievement profile and nationwide
achievement-stat data. Include those labels in both the page UI and the
generated 1080 x 1080 image, with each achievement's rarity on a separate
line below its name.

Fix the locked-trophy caption overflowing its card in the generated image by
using a bounded two-line layout. Add focused tests, run frontend lint and type
checking, and verify the result in the local browser as Test Member 1.
