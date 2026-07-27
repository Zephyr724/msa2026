# Prompt 62 — Google Maps Runtime Configuration Correction

## Reconstructed implementation instruction

Inspect the completed Slice 11 Google Maps implementation and identify every
remaining requirement between the current no-key fallback and a real,
restricted Google-rendered map. Correct the repository-owned gaps without
committing credentials or changing the accepted ADR scope.

The correction must:

- replace the hard-coded demo map ID with explicit runtime/build
  configuration;
- require both a browser API key and JavaScript map ID before enabling maps;
- retain the complete Quest list and numeric coordinate fields as authoritative
  fallbacks;
- present a safe fallback if the Maps JavaScript API fails to load;
- keep the accepted feature scope limited to maps, markers, fit bounds, Quest
  links, and coordinate picking;
- improve coordinate-picker feedback by showing the selected marker;
- handle zero, one, and multiple mapped Quests safely;
- document local and production configuration and key restrictions without
  placing a real key in Git;
- add focused tests and run the applicable frontend gates;
- create truthful completion evidence before independent review.

Do not create Google Cloud resources, enable billing, choose a production
deployment provider, commit a real browser key, stage, commit, push, merge, or
deploy without the required human authorization.
