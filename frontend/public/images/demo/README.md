# Development Community image fixtures

These local-only test fixtures keep Community aspect-ratio checks independent
of third-party image delivery. The wide and tall boundary fixtures are derived
from Pexels photos already attributed by the assessment seed; the square
fixture is composed natively at `1:1` so its complete frame can be verified:

- `community-landscape.jpg` — Thirdman, Pexels photo 7656721.
- `community-square-native.png` — native `1:1` generated test photograph;
  composed as a square without source cropping.
- `community-tall.jpg` — Anna Shvets, Pexels photo 5029853.

They are used only by deterministic Development seed posts.
