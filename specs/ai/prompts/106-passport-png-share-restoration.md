# Restore whole-Passport PNG sharing

## Implementation instruction

Remove the authenticated `/passport/share` page URL from the whole-Passport
share action because it has no value to recipients. Restore the prior product
behavior: generate the privacy-safe Passport PNG and pass it to the Web Share
API as a file. Keep direct PNG download as the fallback, disable both actions
until all artwork is ready, and retain the separate-line rarity layout.

Add focused coverage proving that the share payload contains a PNG file and no
URL, then run the applicable frontend checks and visually verify the page.
