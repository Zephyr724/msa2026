# Community masonry image parity and crop correction

## Actual human instruction

> Do just one task: debug the Community masonry images — square and near-square images are still being cropped. Look at the earlier code and history; you previously said it was an image problem — if that's the case, update all the images. Also make the images exactly the same across the production and dev environments. Add more images, but try not to repeat them.
>
> Work on a new branch

## Reconstructed implementation instruction

Create `fix/community-masonry-images`. Compare the accepted intrinsic-ratio
contract, prior masonry fixes, current frontend rendering, Development seed,
and production assessment seed. Fix every remaining source of square and
near-square clipping. Replace the remote Community showcase media with one
deployment-bundled catalogue shared by production assessment and Development
fixtures. Increase the unique catalogue, balance square, near-square,
landscape, and portrait ratios, minimise repeated occurrences, and reconcile
deterministic existing rows without changing schema, dependencies, auth, or
user-created posts.

## Image-generation prompt set

Built-in ImageGen generated 24 photorealistic-natural Community feed photos.
All prompts required candid Aotearoa New Zealand environmental participation,
important subjects inside safe margins, no readable brands or text, no logos,
no watermark, no border, and no collage. Six images were requested in each
ratio family: square, near-square (about 5:4), landscape (about 3:2), and
portrait (about 4:5).

The 24 distinct subjects were stream planting, beach cleanup, wetland field
notes, recycling workshop, water-quality testing, community gardening, track
maintenance, conservation-trap checking, home composting, cycling to a working
bee, wetland plant guards, a nature walk, native seed collection, dune-guard
checking, nesting-box installation, rain-garden planting, stream-invertebrate
identification, youth pollinator planning, tool cleaning, post-working-bee tea,
litter auditing, invasive-vine removal, young-tree care, and reusable-event
setup.
