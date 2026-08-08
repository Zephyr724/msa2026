# Development Community Image Parity — Implementation Prompt

## Actual human instruction

> Are the test images for posts the same in production and dev right now? I see the dev environment only has 5 images. If they are not the same, change dev to use those dozens of images from production. And to emphasise again: the images include portrait, landscape, and square ones, with some cropped (not in 4:3 or 0.76 ratio) and some not cropped.

## Implementation instruction

Compare the Development Community fixture images with the Production
assessment Community image set. Make Development reuse every Production Post
image and multi-image ordering without changing the Production fixture data.
Preserve the dedicated Development landscape, square, extra-tall bounded
portrait, and no-image text-cover cases so the feed continues to exercise both
cropped boundary fixtures and uncropped intrinsic ratios. Keep the seed
deterministic and idempotent, add PostgreSQL verification for counts, shared
URLs, repair of existing deterministic fixture rows, and absence of
source-cropping parameters, and do not change schema,
dependencies, authentication, authorization, API contracts, or deployment.
