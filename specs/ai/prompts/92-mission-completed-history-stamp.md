# Prompt 92 — Mission Completed History Stamp

- **Date:** 2026-08-06
- **Branch:** `feat/quest-highlight-badge`
- **Risk:** Low — frontend presentation only

## Actual human instruction

The human supplied screenshots of the Passport Completion history and a
distressed circular stamp, then requested:

> Change the completed icon here into a mission completed stamp, drawn to
> match the reference image.

The human clarified the required color:

> Green

The human then refined the reference match:

> No transparent wear-and-scratch marks needed. Everything else stays the
> same, but the text should be a bit larger. Look carefully at "completed" —
> its left and right edges overlap onto the stamp.

The human further clarified the ring and banner construction:

> The stamp's outermost ring is fairly thick, and inside it there is another
> very thin circle; the inner circle is too thick right now. After your
> change, "completed" is illegible where it intertwines with the two rings.
> Follow the original's approach: "completed" should have a white background.

The human then supplied a clearer badge-and-ribbon reference and requested:

> You couldn't reproduce that feel — can you make it like this instead?

The human supplied a final, simpler seal reference and requested:

> Change it to this one ... surely you can make this, in green.

The human refined the proportions and theme treatment:

> Use our theme green. Make the stars smaller — look at the proportions of
> the original icon. The proportions of the serrations and the lines are also
> wrong. Use a transparent background, not white. Make the stamp 30% larger.

The human requested one final compositing adjustment:

> Add 20% transparency.

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
