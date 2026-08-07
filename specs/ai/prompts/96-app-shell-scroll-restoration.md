# AppShell route scroll restoration — implementation prompt

## Source

Truthful reconstruction of the implementation instruction for the existing
uncommitted AppShell correction.

## Instruction

Ensure client-side navigation through the shared application shell resets the
window to the top of the destination page instead of preserving the previous
route's scroll offset. Use React Router's built-in scroll-restoration behavior,
add focused AppShell integration coverage, and provide the narrow jsdom
`window.scrollTo` implementation required for observable tests. Do not change
page content, navigation destinations, authentication, dependencies, or backend
behavior.
