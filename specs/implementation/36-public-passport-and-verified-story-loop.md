# Slice 36 — Public Passport and Verified Story Loop

- **Status:** Approved by the product owner for implementation
- **Approval date:** 2026-08-06
- **Implementation owner:** Current Codex session
- **Database migration:** Approved, additive
- **Dependency change:** None

## Product intent

Give earned progress optional social and reputational value without turning
Kiwimpact into a searchable public-member directory. The private Impact
Passport remains the complete personal record. A member may deliberately
publish a bounded showcase and share verified Quest stories that carry
server-enforced completion provenance.

## Privacy defaults

- Public Passport is Private by default and requires an explicit member action
  to enable.
- Enabling creates a stable, cryptographically unguessable share identifier.
  Disabling hides the page but does not rotate the identifier; re-enabling
  restores the same link.
- The initial release has no public user search, username route, directory,
  indexing API, or enumerable identifier.
- Home Community is hidden from the public Passport regardless of the private
  Passport preference.
- Evidence, evidence URLs, review notes, email, user IDs, internal completion
  IDs, self-reports, pending/rejected claims, precise location, and complete
  history are never exposed.

## Public showcase contract

The public page may expose only:

- display name;
- level and rank title;
- current achievement trophy tier and its nationwide rarity;
- verified XP and verified completion aggregates;
- up to five member-selected achievements, each of which the member has
  actually earned, including nationwide rarity;
- a bounded set of the member's public Verified Quest Stories;
- a share action for the stable public URL.

The backend enforces ownership, earned-achievement membership, uniqueness,
order, and the five-item limit. Disabling the Passport makes anonymous reads
return not found. Anonymous DTOs are purpose-built rather than reusing private
Passport responses.

## Verified Story provenance

- `SocialPost` gains nullable immutable completion provenance.
- A create request may nominate one owned Verified completion.
- The backend verifies ownership, `Verified` status, and Quest consistency,
  and then stores the provenance in the same transaction as the post.
- A provenance-backed post receives a public `Verified Quest Story` marker.
- Editing may change normal post content under existing rules but cannot move,
  invent, or remove its completion provenance.
- General posts continue to work without provenance.
- Hidden posts and non-provenance posts never appear on a public Passport.

## Loop entry points

- Persistent completion resolution links to a prefilled composer using the
  owned completion ID.
- The composer locks the related Quest to the server-verified completion,
  clearly labels the story as verified, and prefills restrained Quest-based
  copy that the member may edit.
- Successful publishing links back to the verified story and makes it eligible
  for the public Passport when the post is public and the Passport is enabled.
- The private Passport settings surface supports enable/disable, link copy,
  public-page preview, and selecting/reordering up to five earned achievements.

## Visual contract

- Reuse current Passport summary, trophy, achievement-card, community-post,
  green/warm-neutral/gold, rounded-panel, and topographic patterns.
- Public presentation should feel like an earned field record, not a shop,
  inventory screen, or unrelated redesign.
- Global icon replacement remains deferred.

## Security and verification contract

- Additive schema constraints and backend authorization enforce privacy and
  provenance; client state is not trusted.
- Anonymous reads reveal no distinction between disabled, nonexistent, or
  malformed share identifiers beyond the same not-found response.
- Integration tests cover defaults, stable identifier, disable/re-enable,
  non-enumerability shape, DTO allow-list, ownership, five-achievement limit,
  unearned achievement rejection, provenance forgery, immutable provenance,
  hidden posts, and anonymous access.
- Frontend tests cover settings, selection limit, public route, prefilled
  verified composer, marker, share action, and responsive states.
- Applicable full gates plus light/dark desktop and 320 px browser inspection.
- One K3 CLI independent read-only review after evidence documents exist.

## Explicit exclusions

- Public user search/directory, follows, friends, direct messages, comments on
  Passport, public Home Community, full completion history, self-reported
  stories presented as verified, currency, shop, cosmetics purchasing, and
  global icon replacement.
