# Development Community Image Parity — Implementation Prompt

## Actual human instruction

> 现在production和dev的post的测试图是不是一样的？我看到dev环境只有5张图，如果不是一样的，把dev改成production的那几十张图，还是强调一下，图还有竖向，横向，正方形，有截图（非4：3或者0.76比例），没有截取的。

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
