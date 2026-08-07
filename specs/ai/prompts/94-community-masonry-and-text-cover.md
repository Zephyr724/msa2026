# Community masonry and text cover — implementation prompt

## Source

Reconstructed from the product owner's explicit corrections on 2026-08-05 and
2026-08-06.

## Instruction

Correct the Community discovery feed so cards form a stable responsive masonry
grid rather than uniform cropped rows. Read each first image's natural
width-to-height ratio. Preserve the complete image when the ratio is between
`0.76` and `4:3`, inclusive, including square and near-square images. Crop only
extra-tall portraits below `0.76` to `19:25`, and extra-wide landscape images
above `4:3` to `4:3`.

For posts without images, render the first complete body sentence on a fixed
`19:25` default cover with a pale `secondary` colour base and only a subtle,
small, widely spaced diagonal Kiwimpact leaf watermark. Reuse the same default
cover in the opened post's left media area.

Make the behavior directly testable in Development by seeding deterministic,
public landscape, square, extra-tall portrait, and no-image posts. Local shape
fixtures must be real photographs and must not depend on external image
delivery. Do not change the schema,
dependencies, image URL validation for user writes, authentication, or privacy
boundaries.

The square fixture must be composed natively at `1:1`; do not use a source
image that was converted to square with `fit=crop`, because that would obscure
whether the feed itself preserves the complete image.

## Native square fixture generation prompt

Create a native square `1:1` candid documentary-style photograph of two adult
community volunteers planting a complete young native tree outdoors in
Aotearoa New Zealand. Keep both volunteers, the sapling, hands, tools, and
faces fully inside the frame with comfortable padding. Use authentic natural
photography and soft overcast daylight. Compose in-camera for the square frame;
do not crop a differently shaped source. No text, logo, watermark, border, or
collage.
