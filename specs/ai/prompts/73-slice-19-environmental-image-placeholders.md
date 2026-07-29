# Slice 19 Additive Prompt — Environmental Image Placeholders

Implement the product owner's 2026-07-29 request to replace repeated default
Quest artwork with environmentally relevant image placeholders.

Use the environmental photographs already selected by the checked-in Figma
Make prototype as the preferred placeholder source. Preserve a real uploaded
Quest image when one exists. Treat Development seed SVGs under
`/images/quests/` as placeholders rather than authoritative uploaded media.

Provide a deterministic fallback chain:

1. A real non-placeholder Quest image.
2. The Figma Make environmental photograph for the Quest category.
3. A stable, title-derived `picsum.photos` placeholder at the requested
   rendering dimensions.
4. The repository-owned fallback SVG.

Apply the shared resolver to Landing Community Challenge media, Discover Quest
cards, Quest Detail hero/gallery/thumbnails, My Quests rows, Google Maps Quest
popovers, Passport Completion History, and Community participation media.
Request appropriately sized images for each surface, retain meaningful alt
text, add regression tests, and run the complete frontend gates. Do not add a
dependency, database migration, or production/demo data mutation.
